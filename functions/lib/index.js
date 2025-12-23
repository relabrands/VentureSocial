"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servePass = exports.onApplicationStatusChange = exports.onApplicationCreated = exports.sendMagicLink = exports.sendAdminEmail = void 0;
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
// Callable function to send Magic Link for login
exports.sendMagicLink = (0, https_1.onCall)(async (request) => {
    const { email, memberId, name } = request.data;
    if (!email || !memberId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields: email, memberId');
    }
    logger.info(`Sending magic link to ${email} for member ${memberId}`);
    try {
        const resend = new resend_1.Resend(RESEND_API_KEY.value());
        const fromEmailRaw = FROM_EMAIL.value() || "onboarding@resend.dev";
        const fromAddress = fromEmailRaw.includes("<")
            ? fromEmailRaw
            : `Venture Social <${fromEmailRaw}>`;
        const magicLink = `https://www.venturesocialdr.com/pass/${memberId}`;
        const html = `
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
        const { data, error } = await resend.emails.send({
            from: fromAddress,
            to: email,
            subject: "Your Venture Social Member Access Link",
            html: html,
        });
        if (error) {
            logger.error("Error sending magic link:", error);
            throw new https_1.HttpsError('internal', error.message);
        }
        return { success: true, data };
    }
    catch (error) {
        logger.error("Error in sendMagicLink:", error);
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
        const emailData = Object.assign(Object.assign({}, newData), { memberId: memberId, passUrl: memberId ? `https://www.venturesocialdr.com/pass/${memberId}` : "" });
        await sendEmailWithTemplate(applicationId, emailData, templateKey);
    }
});
async function generateMemberId(applicationId) {
    const counterRef = db.collection("counters").doc("members");
    const appRef = db.collection("applications").doc(applicationId);
    try {
        return await db.runTransaction(async (t) => {
            var _a;
            const counterDoc = await t.get(counterRef);
            let newCount = 1;
            if (counterDoc.exists) {
                newCount = (((_a = counterDoc.data()) === null || _a === void 0 ? void 0 : _a.count) || 0) + 1;
            }
            const memberId = `VS-${String(newCount).padStart(3, '0')}`;
            t.set(counterRef, { count: newCount }, { merge: true });
            t.update(appRef, { memberId: memberId });
            logger.info(`Generated Member ID ${memberId} for application ${applicationId}`);
            return memberId;
        });
    }
    catch (error) {
        logger.error("Error generating member ID:", error);
        return null;
    }
}
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
exports.servePass = (0, https_1.onRequest)(async (req, res) => {
    var _a;
    const path = req.path; // e.g. /pass/VS-001
    const memberId = path.split('/').pop();
    if (!memberId) {
        res.status(404).send("Not Found");
        return;
    }
    try {
        // Fetch member data
        let memberData = null;
        if (memberId.startsWith("VS-")) {
            const q = db.collection("applications").where("memberId", "==", memberId).where("status", "==", "accepted").limit(1);
            const querySnapshot = await q.get();
            if (!querySnapshot.empty) {
                memberData = querySnapshot.docs[0].data();
            }
        }
        else {
            const docSnap = await db.collection("applications").doc(memberId).get();
            if (docSnap.exists && ((_a = docSnap.data()) === null || _a === void 0 ? void 0 : _a.status) === "accepted") {
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
    }
    catch (error) {
        logger.error("Error serving pass:", error);
        res.status(500).send("Internal Server Error");
    }
});
//# sourceMappingURL=index.js.map