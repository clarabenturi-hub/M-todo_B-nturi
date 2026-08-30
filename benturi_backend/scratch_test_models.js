require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        // We can use REST API to list models because the SDK might not expose it directly easily
        const fetch = require('node-fetch');
        const res = await fetch(https://generativelanguage.googleapis.com/v1beta/models?key=);
        const data = await res.json();
        console.log(data.models.map(m => m.name));
    } catch (e) {
        console.error('ERROR:', e.message);
    }
}
test();
