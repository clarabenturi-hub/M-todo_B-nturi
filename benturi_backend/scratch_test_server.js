const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        
        const promptFile = path.join(__dirname, 'prompt_generacion.txt');
        const systemPrompt = fs.readFileSync(promptFile, 'utf8');
        
        let kbPath = path.join(__dirname, 'base_conocimiento_cartas.json');
        let detPath = path.join(__dirname, 'base_determinista_cartas.json');
        let kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
        let det = JSON.parse(fs.readFileSync(detPath, 'utf8'));
        
        let contextText = TIPO DE MATRIZ: Matriz de prueba\nPREGUNTA DEL USUARIO: ¿Conseguiré el trabajo?\nVECTORES BASE CON INFORMACIÓN DETERMINISTA DE LA BASE DE DATOS:\nPrueba\n\n;

        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.6-flash", 
            systemInstruction: systemPrompt,
            generationConfig: {
                temperature: 0.0,
                topP: 1
            }
        });
        
        console.log("Calling Gemini...");
        const aiResponse = await model.generateContent(contextText);
        console.log("Response:", aiResponse.response.text().substring(0, 200));
    } catch (e) {
        console.error("ERROR from Gemini:", e.message);
    }
}
run();
