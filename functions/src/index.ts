import { onDocumentUpdated, onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
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

// Export new function
export * from "./updateCohortMatches";
import { runMatchmaking } from "./updateCohortMatches";

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

// Callable function to manually trigger matchmaking
export const triggerMatchmaking = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    logger.info(`Manual matchmaking triggered by ${request.auth.uid}`);

    try {
        await runMatchmaking();
        return { success: true, message: "Matchmaking process started." };
    } catch (error: any) {
        logger.error("Error in manual matchmaking:", error);
        throw new HttpsError('internal', error.message);
    }
});

// Callable function to send Magic Link for login
export const sendMagicLink = onCall(async (request) => {
    const { email, memberId, name } = request.data;

    if (!email || !memberId) {
        throw new HttpsError('invalid-argument', 'Missing required fields: email, memberId');
    }

    logger.info(`Sending magic link to ${email} for member ${memberId}`);

    let templateDoc: any = null;
    let subject = "Your Venture Social Member Access Link";
    const magicLink = `https://www.venturesocialdr.com/pass/${memberId}`;

    let html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #10b981;">Access your Founder Pass</h1>
                <p>Hello ${name || 'Member'},</p>
                <p>Click the button below to access your Venture Social Founder Pass and the Member Panel.</p>
                <a href="${magicLink}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
                    Access Member Panel
                </a>
                <p style="color: #666; font-size: 14px;">Or copy this link: <a href="${magicLink}">${magicLink}</a></p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
        `;

    try {
        const resend = new Resend(RESEND_API_KEY.value());
        const fromEmailRaw = FROM_EMAIL.value() || "onboarding@resend.dev";
        const fromAddress = fromEmailRaw.includes("<")
            ? fromEmailRaw
            : `Venture Social <${fromEmailRaw}>`;

        try {
            templateDoc = await db.collection("emailTemplates").doc("magic_link_login").get();
            if (templateDoc.exists) {
                const template = templateDoc.data();
                logger.info("Found magic link template:", { active: template?.active, subject: template?.subject });

                if (template?.active) {
                    subject = template.subject || subject;
                    let body = template.body || html;

                    // Replace variables
                    const replacements: Record<string, string> = {
                        "{{name}}": name || "Member",
                        "{{fullName}}": name || "Member",
                        "{{magicLink}}": magicLink,
                        "{{memberId}}": memberId
                    };

                    for (const [key, value] of Object.entries(replacements)) {
                        subject = subject.replace(new RegExp(key, "g"), value);
                        body = body.replace(new RegExp(key, "g"), value);
                    }
                    html = body;
                }
            } else {
                logger.warn("Magic link template not found in Firestore");
            }
        } catch (tmplError) {
            logger.warn("Failed to fetch magic link template, using default.", tmplError);
        }

        const { data, error } = await resend.emails.send({
            from: fromAddress,
            to: email,
            subject: subject,
            html: html,
        });

        if (error) {
            logger.error("Error sending magic link:", error);
            throw new HttpsError('internal', error.message);
        }

        return {
            success: true,
            data,
            debug: {
                templateSource: templateDoc?.exists ? "firestore" : "default",
                templateActive: templateDoc?.exists ? templateDoc.data()?.active : false,
                subjectUsed: subject
            }
        };
    } catch (error: any) {
        logger.error("Error in sendMagicLink:", error);
        throw new HttpsError('internal', error.message);
    }
});

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
            // Trigger Matchmaking
            await runMatchmaking();
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

export const servePass = onRequest(async (req, res) => {
    const path = req.path; // e.g. /pass/VS-001
    const memberId = path.split('/').pop();

    if (!memberId) {
        res.status(404).send("Not Found");
        return;
    }

    try {
        // Fetch member data
        let memberData: any = null;
        if (memberId.startsWith("VS-")) {
            const q = db.collection("applications").where("memberId", "==", memberId).where("status", "==", "accepted").limit(1);
            const querySnapshot = await q.get();
            if (!querySnapshot.empty) {
                memberData = querySnapshot.docs[0].data();
            }
        } else {
            const docSnap = await db.collection("applications").doc(memberId).get();
            if (docSnap.exists && docSnap.data()?.status === "accepted") {
                memberData = docSnap.data();
            }
        }

        if (!memberData) {
            res.redirect('/');
            return;
        }

        // Construct OG Tags
        const isPublicShare = path.includes('/p/');
        const title = isPublicShare
            ? `I am a Member | Venture Social`
            : `${memberData.fullName} | Venture Social Founder Pass`;

        const description = `Proud to be selected for the first cohort of @VentureSocialDR. Building the future of tech in Santo Domingo alongside the best. 🇩🇴`;
        const image = "https://firebasestorage.googleapis.com/v0/b/venture-social-dr.firebasestorage.app/o/founder-pass-preview.png?alt=media";
        // Always point OG URL to the public share page if possible, or match request
        const url = `https://www.venturesocialdr.com${path}`;

        // Fetch the live index.html
        const indexHtmlResponse = await fetch("https://www.venturesocialdr.com/index.html");
        let html = await indexHtmlResponse.text();

        // Inject Meta Tags
        html = html.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
        html = html.replace('</head>', `
            <meta property="og:title" content="${title}" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${image}" />
            <meta property="og:url" content="${url}" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${title}" />
            <meta name="twitter:description" content="${description}" />
            <meta name="twitter:image" content="${image}" />
        </head>`);

        res.status(200).send(html);

    } catch (error: any) {
        logger.error("Error serving pass:", error);
        res.status(500).send("Internal Server Error");
    }
});
