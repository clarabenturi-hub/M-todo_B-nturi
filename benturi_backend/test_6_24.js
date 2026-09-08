const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-3.6-flash",
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ]
});

async function runTest(question, cartas, type) {
    try {
        const prompt = fs.readFileSync('prompt_generacion.txt', 'utf8');
        const promptTotal = prompt + `\n\nTIPO DE TIRADA: ${type} cartas\n\nPREGUNTA DEL USUARIO: ${question}\n\nCARTAS QUE HAN SALIDO: ${JSON.stringify(cartas)}`;
        
        console.log(`\n\n=== Consultando a Gemini 3.6 Flash para tirada de ${type} cartas ===\n`);
        const result = await model.generateContent(promptTotal);
        const response = await result.response;
        console.log(`\n--- RESULTADO OBTENIDO (${type} cartas) ---\n`);
        console.log(response.text());
        
    } catch (e) {
        console.error(`Error en tirada de ${type} cartas:`, e);
    }
}

async function main() {
    const question6 = "¿Cómo me irá en mi nuevo trabajo y la relación con mis compañeros?";
    const cartas6 = [
        { nombre: "As de Bastos", id: 1 },
        { nombre: "Cinco de Bastos", id: 2 },
        { nombre: "Rey de Espadas", id: 3 },
        { nombre: "Tres de Oros", id: 4 },
        { nombre: "Siete de Espadas", id: 5 },
        { nombre: "Caballo de Espadas", id: 6 }
    ];

    const question24 = "¿Cuál es mi panorama general para este año en el amor, el dinero y la salud?";
    const cartas24 = [
        { nombre: "As de Oros", id: 1 }, { nombre: "Dos de Oros", id: 2 }, { nombre: "Tres de Oros", id: 3 }, { nombre: "Cuatro de Oros", id: 4 },
        { nombre: "Cinco de Oros", id: 5 }, { nombre: "Seis de Oros", id: 6 }, { nombre: "Siete de Oros", id: 7 }, { nombre: "Ocho de Oros", id: 8 },
        { nombre: "As de Copas", id: 9 }, { nombre: "Dos de Copas", id: 10 }, { nombre: "Tres de Copas", id: 11 }, { nombre: "Cuatro de Copas", id: 12 },
        { nombre: "As de Espadas", id: 13 }, { nombre: "Dos de Espadas", id: 14 }, { nombre: "Tres de Espadas", id: 15 }, { nombre: "Cuatro de Espadas", id: 16 },
        { nombre: "Cinco de Espadas", id: 17 }, { nombre: "Seis de Espadas", id: 18 }, { nombre: "Siete de Espadas", id: 19 }, { nombre: "Ocho de Espadas", id: 20 },
        { nombre: "As de Bastos", id: 21 }, { nombre: "Dos de Bastos", id: 22 }, { nombre: "Tres de Bastos", id: 23 }, { nombre: "Cuatro de Bastos", id: 24 }
    ];

    await runTest(question6, cartas6, 6);
    await runTest(question24, cartas24, 24);
}

main();
