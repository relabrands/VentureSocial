import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { Resend } from "resend";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();
const resend = new Resend("re_Doi4Und1_4nowJQ57yZEowgbwUtipQ6Fb");

export const onApplicationStatusChange = onDocumentUpdated("applications/{applicationId}", async (event) => {
    const change = event.data;
    if (!change) return;

    const newData = change.after.data();
    const previousData = change.before.data();

    // Only proceed if status changed
    if (newData.status === previousData.status) return;

    const applicationId = event.params.applicationId;
    const newStatus = newData.status;
    const email = newData.email;
    const fullName = newData.fullName;
    const project = newData.project;

    logger.info(`Status changed for application ${applicationId} to ${newStatus}`);

    // Map status to template key
    let templateKey = "";
    switch (newStatus) {
        case "review":
            templateKey = "application_review";
            break;
        case "accepted":
            templateKey = "application_accepted";
            break;
        case "rejected":
            templateKey = "application_rejected";
            break;
        default:
            logger.info(`No template for status ${newStatus}`);
            return;
    }

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

        // Replace placeholders
        let subject = template.subject || "";
        let body = template.body || "";

        const replacements: Record<string, string> = {
            "{{fullName}}": fullName || "",
            "{{status}}": newStatus || "",
            "{{project}}": project || "",
        };

        for (const [key, value] of Object.entries(replacements)) {
            subject = subject.replace(new RegExp(key, "g"), value);
            body = body.replace(new RegExp(key, "g"), value);
        }

        // Send email
        const { data, error } = await resend.emails.send({
            from: "Venture Social <onboarding@resend.dev>",
            to: email,
            subject: subject,
            html: body.replace(/\n/g, "<br>"), // Simple newline to br conversion
        });

        if (error) {
            logger.error("Error sending email:", error);
            await logEmail(applicationId, email, templateKey, "failed", error.message);
        } else {
            logger.info("Email sent successfully:", data);
            await logEmail(applicationId, email, templateKey, "sent", null);
        }

    } catch (error: any) {
        logger.error("Error in onApplicationStatusChange:", error);
        await logEmail(applicationId, email, templateKey, "error", error.message);
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
