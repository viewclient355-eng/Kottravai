const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const { OpenAI } = require(path.join(__dirname, '../server/node_modules/openai'));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function test() {
    try {
        const key = process.env.OPENAI_API_KEY || "";
        console.log("Testing API Key:", key.substring(0, 15) + "...");
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: "test"
        });
        console.log("Success!");
    } catch (err) {
        console.error("Test Failed:", err.message);
    }
}

test();
