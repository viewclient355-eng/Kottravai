const path = require('path');
const serverPath = path.join(__dirname, '../server');
const { GoogleGenerativeAI } = require(path.join(serverPath, 'node_modules/@google/generative-ai'));
require('dotenv').config({ path: path.join(serverPath, '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testEmbedding(modelName) {
    try {
        console.log(`Testing ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.embedContent("test");
        console.log(`Success with ${modelName}!`);
        return true;
    } catch (err) {
        console.log(`Failed ${modelName}: ${err.message}`);
        return false;
    }
}

async function run() {
    await testEmbedding("embedding-001");
    await testEmbedding("text-embedding-004");
    await testEmbedding("models/embedding-001");
    await testEmbedding("models/text-embedding-004");
}

run();
