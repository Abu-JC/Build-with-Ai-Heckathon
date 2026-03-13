// backend/controllers/aiController.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const { Detection } = require('../models/mongoModels');

// Initialize with the Key from your .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeCropImage = async (filePath, mimeType, userId = null) => {
    try {
        // Use the most standard model string
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Analyze this crop leaf. Return ONLY a JSON object: {"crop": "string", "disease": "string", "status": "Healthy/Infected", "treatments": ["string"]}`;

        const imagePart = {
            inlineData: {
                data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
                mimeType: mimeType
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const text = await result.response.text();

        // Robust JSON extraction
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}') + 1;
        const aiData = JSON.parse(text.substring(start, end));

        const detectionRecord = await Detection.create({ user_id: userId, ...aiData });

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return detectionRecord;

    } catch (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.error("AI Controller Error:", error.message);
        throw error;
    }
};

module.exports = { analyzeCropImage };