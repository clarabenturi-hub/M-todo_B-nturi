const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'C:\\Users\\Snake\\Desktop\\App Metodo Benturi\\benturi_backend\\.env' });

async function run() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        const promptFile = 'C:\\Users\\Snake\\Desktop\\App Metodo Benturi\\benturi_backend\\prompt_generacion.txt';
        const systemPrompt = fs.readFileSync(promptFile, 'utf8');
        
        const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash', systemInstruction: systemPrompt });
        const aiResponse = await model.generateContent('Prueba simple');
        console.log('Success:', aiResponse.response.text().substring(0, 100));
    } catch (e) {
        console.error('ERROR from Gemini:', e.message);
    }
}
run();
