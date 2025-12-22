import { onDocumentUpdated, onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
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

        // Initialize Resend with the secret
        const resend = new Resend(RESEND_API_KEY.value());
        const fromEmail = FROM_EMAIL.value() || "onboarding@resend.dev";

        // Replace placeholders
        let subject = template.subject || "";
        let body = template.body || "";

        const replacements: Record<string, string> = {
            "{{fullName}}": fullName,
            "{{status}}": data.status || "",
            "{{project}}": project,
            "{{role}}": data.role || "",
        };

        for (const [key, value] of Object.entries(replacements)) {
            subject = subject.replace(new RegExp(key, "g"), value);
            body = body.replace(new RegExp(key, "g"), value);
        }

        // Send email
        const { data: resendData, error } = await resend.emails.send({
            from: `Venture Social <${fromEmail}>`,
            to: email,
            subject: subject,
            html: body.replace(/\n/g, "<br>"), // Simple newline to br conversion
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
    switch (newStatus) {
        case "review":
            templateKey = "application_review"; // Optional
            break;
        case "accepted":
            templateKey = "application_accepted";
            break;
        case "rejected":
            templateKey = "application_rejected";
            break;
        default:
            logger.info(`No template mapping for status ${newStatus}`);
            return;
    }

    if (templateKey) {
        await sendEmailWithTemplate(applicationId, newData, templateKey);
    }
});

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
