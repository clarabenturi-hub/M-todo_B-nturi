require('dotenv').config();
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const promptFile = 'prompt_generacion.txt';
  const systemPrompt = fs.readFileSync(promptFile, 'utf8');
  
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3.6-flash', 
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.0, topP: 1 } 
  });
  
  const contextText = `TIPO DE MATRIZ: Matriz de 6 Vectores\nPREGUNTA DEL USUARIO: ¿Me irá bien?\n\nVECTORES BASE CON INFORMACIÓN DETERMINISTA DE LA BASE DE DATOS:\n[{"posicion":"Situación Inicial","cartas":"Dos de Oros, Tres de Oros","info_c1":"...","info_c2":"..."}]`;
  
  try {
    const aiResponse = await model.generateContent(contextText);
    console.log(aiResponse.response.text().substring(0, 500));
  } catch(e) {
    console.error('GEMINI ERROR:', e.message);
  }
}
run();
