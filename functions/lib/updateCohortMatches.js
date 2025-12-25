"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCohortMatches = void 0;
exports.runMatchmaking = runMatchmaking;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const vertexai_1 = require("@google-cloud/vertexai");
// Initialize Vertex AI
const vertexAI = new vertexai_1.VertexAI({ project: "venture-social-dr", location: "us-central1" });
const model = vertexAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
const db = admin.firestore();
// Reusable function to run matchmaking
async function runMatchmaking() {
    var _a;
    console.log("Starting matchmaking process...");
    try {
        // 1. Fetch all accepted users
        const usersSnapshot = await db
            .collection("applications")
            .where("status", "==", "accepted")
            .get();
        if (usersSnapshot.empty) {
            console.log("No accepted users found.");
            return;
        }
        const users = usersSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                uid: doc.id,
                name: data.fullName || data.name,
                role: data.role,
                company: data.projectCompany || data.company,
                bio: data.message || "", // Using message as bio/context
                superpower: data.superpower || "",
                challenge: data.biggestChallenge || "",
            };
        });
        console.log(`Processing ${users.length} users for matchmaking.`);
        // 2. Prepare Prompt for Gemini
        const prompt = `
        Act as an expert in VC Networking and Startup Ecosystems.
        
        I have a list of community members. Your goal is to find the Top 3 Matches for EACH user based on their profile, "superpower" (what they offer), and "challenge" (what they need).
        
        For each match, generate:
        1. "score": A Synergy Score between 85 and 99.
        2. "reason": A concise, persuasive reason why they should talk (max 15 words).
        3. "icebreaker": A specific question to start the conversation (max 10 words).

        Input Data (JSON):
        ${JSON.stringify(users)}

        Output Format (JSON Only):
        {
          "user_uid_1": [
            { "matchUid": "user_uid_2", "score": 95, "reason": "...", "icebreaker": "..." },
            ... (top 3)
          ],
          ...
        }
        
        IMPORTANT: 
        - Do not match a user with themselves.
        - Focus on complementary skills (e.g., Founder needing capital -> Investor).
        - Return ONLY valid JSON.
      `;
        // 3. Call Gemini
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0].content.parts[0].text;
        if (!text) {
            throw new Error("Empty response from Gemini.");
        }
        // Clean and Parse JSON
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const matchesMap = JSON.parse(jsonString);
        // 4. Update Firestore
        const batch = db.batch();
        let operationCount = 0;
        for (const [uid, matches] of Object.entries(matchesMap)) {
            const userRef = db.collection("applications").doc(uid);
            batch.update(userRef, {
                aiRecommendations: matches,
                lastMatchUpdate: admin.firestore.FieldValue.serverTimestamp(),
            });
            operationCount++;
        }
        await batch.commit();
        console.log(`Successfully updated matches for ${operationCount} users.`);
    }
    catch (error) {
        console.error("Error in matchmaking:", error);
    }
}
exports.updateCohortMatches = (0, scheduler_1.onSchedule)({
    schedule: "every 24 hours",
    timeoutSeconds: 540,
    memory: "1GiB",
}, async (event) => {
    await runMatchmaking();
});
//# sourceMappingURL=updateCohortMatches.js.map