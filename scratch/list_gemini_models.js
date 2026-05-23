const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    try {
        console.log("Listing models via axios...");
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        console.log("Models found:", response.data.models.map(m => m.name));
    } catch (err) {
        console.error("Failed to list models:", err.response ? err.response.data : err.message);
    }
}

listModels();
