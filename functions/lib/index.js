"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onApplicationStatusChange = exports.onApplicationCreated = exports.sendAdminEmail = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
// ... (existing imports)
// ... (existing code)
// Callable function for Admin to send custom emails
exports.sendAdminEmail = (0, https_1.onCall)(async (request) => {
    // Ensure the user is authenticated (you might want to add stricter admin checks here)
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { to, subject, html } = request.data;
    if (!to || !subject || !html) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields: to, subject, html');
    }
    logger.info(`Sending admin email to ${to} with subject: ${subject}`);
    try {
        const resend = new resend_1.Resend(RESEND_API_KEY.value());
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
            throw new https_1.HttpsError('internal', error.message);
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
    }
    catch (error) {
        logger.error("Error in sendAdminEmail:", error);
        throw new https_1.HttpsError('internal', error.message);
    }
});
const params_1 = require("firebase-functions/params");
const resend_1 = require("resend");
const app_1 = require("firebase-admin/app");
const firestore_2 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
const db = (0, firestore_2.getFirestore)();
// Define environment variables
const RESEND_API_KEY = (0, params_1.defineString)("RESEND_API_KEY");
const FROM_EMAIL = (0, params_1.defineString)("FROM_EMAIL");
// Helper to send email using template
async function sendEmailWithTemplate(applicationId, data, templateKey) {
    var _a;
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
        if (!(template === null || template === void 0 ? void 0 : template.active)) {
            logger.info(`Template ${templateKey} is inactive`);
            return;
        }
        logger.info(`Fetched template ${templateKey}:`, { subject: template.subject, bodySnippet: (_a = template.body) === null || _a === void 0 ? void 0 : _a.substring(0, 50) });
        // Initialize Resend with the secret
        const resend = new resend_1.Resend(RESEND_API_KEY.value());
        const fromEmailRaw = FROM_EMAIL.value() || "onboarding@resend.dev";
        // If the env var already has the format "Name <email>", use it as is.
        // Otherwise, wrap it with the default name.
        const fromAddress = fromEmailRaw.includes("<")
            ? fromEmailRaw
            : `Venture Social <${fromEmailRaw}>`;
        // Replace placeholders
        let subject = template.subject || "";
        let body = template.body || "";
        const replacements = {
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
            from: fromAddress,
            to: email,
            subject: subject,
            html: body, // Send raw HTML body
        });
        if (error) {
            logger.error("Error sending email:", error);
            await logEmail(applicationId, email, templateKey, "failed", error.message);
        }
        else {
            logger.info("Email sent successfully:", resendData);
            await logEmail(applicationId, email, templateKey, "sent", null);
        }
    }
    catch (error) {
        logger.error(`Error sending email for ${templateKey}:`, error);
        await logEmail(applicationId, email, templateKey, "error", error.message);
    }
}
// Trigger: When a new application is created
exports.onApplicationCreated = (0, firestore_1.onDocumentCreated)("applications/{applicationId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const data = snapshot.data();
    const applicationId = event.params.applicationId;
    await sendEmailWithTemplate(applicationId, data, "application_received");
});
// Trigger: When an application status changes
exports.onApplicationStatusChange = (0, firestore_1.onDocumentUpdated)("applications/{applicationId}", async (event) => {
    const change = event.data;
    if (!change)
        return;
    const newData = change.after.data();
    const previousData = change.before.data();
    // Only proceed if status changed
    if (newData.status === previousData.status)
        return;
    const applicationId = event.params.applicationId;
    const newStatus = newData.status;
    logger.info(`Status changed for application ${applicationId} to ${newStatus}`);
    // Map status to template key
    let templateKey = "";
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
async function logEmail(appId, to, templateKey, status, error) {
    await db.collection("emailLogs").add({
        applicationId: appId,
        to: to,
        templateKey: templateKey,
        status: status,
        error: error,
        sentAt: new Date(),
    });
}
//# sourceMappingURL=index.js.map