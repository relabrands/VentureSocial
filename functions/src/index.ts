import { onDocumentUpdated, onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// ... (existing imports)

// ... (existing code)

// Callable function for Admin to send custom emails
export const sendAdminEmail = onCall(async (request) => {
    // Ensure the user is authenticated (you might want to add stricter admin checks here)
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { to, subject, html } = request.data;

    if (!to || !subject || !html) {
        throw new HttpsError('invalid-argument', 'Missing required fields: to, subject, html');
    }

    logger.info(`Sending admin email to ${to} with subject: ${subject}`);

    try {
        const resend = new Resend(RESEND_API_KEY.value());
        const fromEmailRaw = FROM_EMAIL.value() || "onboarding@resend.dev";
        const fromAddress = fromEmailRaw.includes("<")
            ? fromEmailRaw
            : `Venture Social <${fromEmailRaw}>`;

        const { data, error } = await resend.emails.send({
            from: fromAddress,
            to: to,
            subject: subject,
            html: html,
        });

        if (error) {
            logger.error("Error sending admin email:", error);
            throw new HttpsError('internal', error.message);
        }

        logger.info("Admin email sent successfully:", data);

        // Log to Firestore
        await db.collection("emailLogs").add({
            applicationId: "admin-action",
            to: to,
            templateKey: "custom-admin-email",
            status: "sent",
            sentBy: request.auth.uid,
            sentAt: new Date(),
        });

        return { success: true, data };
    } catch (error: any) {
        logger.error("Error in sendAdminEmail:", error);
        throw new HttpsError('internal', error.message);
    }
});
import { defineString } from "firebase-functions/params";
import { Resend } from "resend";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

// Define environment variables
const RESEND_API_KEY = defineString("RESEND_API_KEY");
const FROM_EMAIL = defineString("FROM_EMAIL");

// Helper to send email using template
async function sendEmailWithTemplate(applicationId: string, data: any, templateKey: string) {
    const email = data.email;
    const fullName = data.fullName || data.name || "Applicant";
    const project = data.projectCompany || data.project || "Project";

    logger.info(`Processing email for application ${applicationId} with template ${templateKey}`);

    try {
        // Fetch template
        const templateDoc = await db.collection("emailTemplates").doc(templateKey).get();

        if (!templateDoc.exists) {
            logger.warn(`Template ${templateKey} not found`);
            return;
        }

        const template = templateDoc.data();
        if (!template?.active) {
            logger.info(`Template ${templateKey} is inactive`);
            return;
        }

        logger.info(`Fetched template ${templateKey}:`, { subject: template.subject, bodySnippet: template.body?.substring(0, 50) });

        // Initialize Resend with the secret
        const resend = new Resend(RESEND_API_KEY.value());
        const fromEmailRaw = FROM_EMAIL.value() || "onboarding@resend.dev";

        // If the env var already has the format "Name <email>", use it as is.
        // Otherwise, wrap it with the default name.
        const fromAddress = fromEmailRaw.includes("<")
            ? fromEmailRaw
            : `Venture Social <${fromEmailRaw}>`;

        // Replace placeholders
        let subject = template.subject || "";
        let body = template.body || "";

        const replacements: Record<string, string> = {
            "{{fullName}}": fullName,
            "{{status}}": data.status || "",
            "{{project}}": project,
            "{{role}}": data.role || "",
            "{{passUrl}}": data.passUrl || "#",
            "{{memberId}}": data.memberId || "",
        };

        for (const [key, value] of Object.entries(replacements)) {
            subject = subject.replace(new RegExp(key, "g"), value);
            body = body.replace(new RegExp(key, "g"), value);
        }

        // Send email
        const { data: resendData, error } = await resend.emails.send({
            from: fromAddress,
            to: email,
            subject: subject,
            html: body, // Send raw HTML body
        });

        if (error) {
            logger.error("Error sending email:", error);
            await logEmail(applicationId, email, templateKey, "failed", error.message);
        } else {
            logger.info("Email sent successfully:", resendData);
            await logEmail(applicationId, email, templateKey, "sent", null);
        }

    } catch (error: any) {
        logger.error(`Error sending email for ${templateKey}:`, error);
        await logEmail(applicationId, email, templateKey, "error", error.message);
    }
}

// Trigger: When a new application is created
export const onApplicationCreated = onDocumentCreated("applications/{applicationId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const applicationId = event.params.applicationId;

    await sendEmailWithTemplate(applicationId, data, "application_received");
});

// Trigger: When an application status changes
export const onApplicationStatusChange = onDocumentUpdated("applications/{applicationId}", async (event) => {
    const change = event.data;
    if (!change) return;

    const newData = change.after.data();
    const previousData = change.before.data();

    // Only proceed if status changed
    if (newData.status === previousData.status) return;

    const applicationId = event.params.applicationId;
    const newStatus = newData.status;

    logger.info(`Status changed for application ${applicationId} to ${newStatus}`);

    // Map status to template key
    let templateKey = "";
    let memberId = newData.memberId;

    switch (newStatus) {
        case "review":
            templateKey = "application_review";
            break;
        case "pending":
            templateKey = "application_pending";
            break;
        case "new":
            // "new" might be the initial status, usually handled by onApplicationCreated, but if manually set:
            templateKey = "application_received";
            break;
        case "accepted":
            templateKey = "application_accepted";
            // Generate Member ID if not exists
            if (!memberId) {
                memberId = await generateMemberId(applicationId);
            }
            break;
        case "rejected":
            templateKey = "application_rejected";
            break;
        default:
            logger.info(`No template mapping for status ${newStatus}`);
            return;
    }

    if (templateKey) {
        const emailData = {
            ...newData,
            memberId: memberId,
            passUrl: memberId ? `https://www.venturesocialdr.com/pass/${memberId}` : ""
        };
        await sendEmailWithTemplate(applicationId, emailData, templateKey);
    }
});

async function generateMemberId(applicationId: string): Promise<string | null> {
    const counterRef = db.collection("counters").doc("members");
    const appRef = db.collection("applications").doc(applicationId);

    try {
        return await db.runTransaction(async (t) => {
            const counterDoc = await t.get(counterRef);
            let newCount = 1;

            if (counterDoc.exists) {
                newCount = (counterDoc.data()?.count || 0) + 1;
            }

            const memberId = `VS-${String(newCount).padStart(3, '0')}`;

            t.set(counterRef, { count: newCount }, { merge: true });
            t.update(appRef, { memberId: memberId });
            logger.info(`Generated Member ID ${memberId} for application ${applicationId}`);
            return memberId;
        });
    } catch (error) {
        logger.error("Error generating member ID:", error);
        return null;
    }
}

async function logEmail(appId: string, to: string, templateKey: string, status: string, error: string | null) {
    await db.collection("emailLogs").add({
        applicationId: appId,
        to: to,
        templateKey: templateKey,
        status: status,
        error: error,
        sentAt: new Date(),
    });
}
