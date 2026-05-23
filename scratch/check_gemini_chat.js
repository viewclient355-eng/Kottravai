const path = require('path');
const serverPath = path.join(__dirname, '../server');
const { GoogleGenerativeAI } = require(path.join(serverPath, 'node_modules/@google/generative-ai'));
require('dotenv').config({ path: path.join(serverPath, '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testChat() {
    try {
        console.log("Testing gemini-1.5-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hi");
        console.log("Success with Chat!");
        console.log("Response:", result.response.text());
    } catch (err) {
        console.log("Failed Chat:", err.message);
    }
}

testChat();
