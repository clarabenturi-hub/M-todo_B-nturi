require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

async function test() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        console.log('API Key present:', !!apiKey);
        const genAI = new GoogleGenerativeAI(apiKey);
        
        const promptFile = path.join(__dirname, 'prompt_generacion.txt');
        const systemPrompt = fs.readFileSync(promptFile, 'utf8');
        console.log('System prompt length:', systemPrompt.length);

        const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash', 
            systemInstruction: systemPrompt,
            generationConfig: {
                temperature: 0.0,
                topP: 1
            }
        });

        console.log('Calling Gemini...');
        const aiResponse = await model.generateContent('Hola, prueba de 10 palabras.');
        console.log('Response:', aiResponse.response.text());
    } catch (e) {
        console.error('ERROR from Gemini:', e.message);
    }
}
test();
