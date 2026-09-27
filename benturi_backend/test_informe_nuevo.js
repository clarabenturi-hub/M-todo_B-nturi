require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

async function testInforme() {
    const question = "Voy a conseguir ese trabajo en la entrevista de la proxima semana?";
    const result = {
        c1: "As de Oros",
        c2: "Dos de Bastos",
        c3: "Tres de Oros",
        c4: "Rey de Bastos",
        c5: "Siete de Bastos",
        c6: "As de Bastos"
    };

    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const promptFile = path.join(__dirname, '../Informe Usuario .txt');
    const systemPrompt = fs.readFileSync(promptFile, 'utf8');

    const kbPath = path.join(__dirname, 'base_conocimiento_cartas.json');
    const detPath = path.join(__dirname, 'base_determinista_cartas.json');
    
    let kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
    let det = JSON.parse(fs.readFileSync(detPath, 'utf8'));

    const normalizeCard = (name) => name ? name.toLowerCase().replace(/ de /g, ' ').trim() : '';
    
    const getDeterministicInfo = (cardName) => {
        if (!cardName) return "Sin carta";
        const keys = Object.keys(det.cartas);
        const foundKey = keys.find(k => normalizeCard(k) === normalizeCard(cardName));
        if (foundKey) {
            const info = det.cartas[foundKey];
            return `**Amor y Relaciones**: ${info.Amor || 'N/A'}\n**Trabajo y Profesión**: ${info.Trabajo || 'N/A'}\n**Dinero y Finanzas**: ${info.Dinero || 'N/A'}\n**Salud y Bienestar**: ${info.Salud || 'N/A'}\n**Evolución Personal y Decisiones**: ${info.Evolucion || 'N/A'}`;
        }
        return "Información no encontrada en la base determinista.";
    };

    // Función genérica para validar arrays de cartas (dobles, triples o cuádruples)
    const checkCombination = (cardsArray, positionsArray) => {
        if (cardsArray.some(c => !c)) return null;
        
        const normalizedInput = cardsArray.map(normalizeCard);
        
        const match = kb.combinaciones?.find(c => {
            const parts = c.combinacion.toLowerCase().split('+').map(p => p.trim().replace('.', ''));
            if (parts.length === normalizedInput.length) {
                // Comprobación directa exacta (1 a 1 en el mismo orden)
                const isDirectMatch = parts.every((p, index) => normalizeCard(p) === normalizedInput[index]);
                if (isDirectMatch) return true;
                
                // Si es doble, permitimos el cruce inverso (por si en la BD está al revés)
                if (parts.length === 2) {
                    const isReverseMatch = normalizeCard(parts[0]) === normalizedInput[1] && normalizeCard(parts[1]) === normalizedInput[0];
                    if (isReverseMatch) return true;
                }
            }
            return false;
        });

        if (match) {
            const posStr = positionsArray.join(' + ');
            const cardStr = cardsArray.map(c => `Vector carta ${c}`).join(' + ');
            return `Asociación [${posStr}] (${cardStr}): ${match.significado}`;
        }
        return null;
    };

    let combosReales = [];

    // 1. CUÁDRUPLES (Hacia adelante)
    const cuadruples = [
        [{c: result.c1, p: "C1"}, {c: result.c2, p: "C3"}, {c: result.c3, p: "C5"}, {c: result.c4, p: "C7"}],
        [{c: result.c2, p: "C3"}, {c: result.c3, p: "C5"}, {c: result.c4, p: "C7"}, {c: result.c5, p: "C9"}],
        [{c: result.c3, p: "C5"}, {c: result.c4, p: "C7"}, {c: result.c5, p: "C9"}, {c: result.c6, p: "C11"}]
    ];

    // 2. TRIPLES (Hacia adelante)
    const triples = [
        [{c: result.c1, p: "C1"}, {c: result.c2, p: "C3"}, {c: result.c3, p: "C5"}],
        [{c: result.c2, p: "C3"}, {c: result.c3, p: "C5"}, {c: result.c4, p: "C7"}],
        [{c: result.c3, p: "C5"}, {c: result.c4, p: "C7"}, {c: result.c5, p: "C9"}],
        [{c: result.c4, p: "C7"}, {c: result.c5, p: "C9"}, {c: result.c6, p: "C11"}]
    ];

    // 3. DOBLES (Hacia adelante)
    const dobles = [
        [{c: result.c1, p: "C1"}, {c: result.c2, p: "C3"}],
        [{c: result.c2, p: "C3"}, {c: result.c3, p: "C5"}],
        [{c: result.c3, p: "C5"}, {c: result.c4, p: "C7"}],
        [{c: result.c4, p: "C7"}, {c: result.c5, p: "C9"}],
        [{c: result.c5, p: "C9"}, {c: result.c6, p: "C11"}]
    ];

    // 4. DOBLES INVERSAS (Hacia atrás)
    const doblesInversas = [
        [{c: result.c6, p: "C11"}, {c: result.c5, p: "C9"}],
        [{c: result.c5, p: "C9"}, {c: result.c4, p: "C7"}],
        [{c: result.c4, p: "C7"}, {c: result.c3, p: "C5"}],
        [{c: result.c3, p: "C5"}, {c: result.c2, p: "C3"}],
        [{c: result.c2, p: "C3"}, {c: result.c1, p: "C1"}]
    ];

    // Procesar todos los grupos
    [cuadruples, triples, dobles, doblesInversas].forEach(group => {
        group.forEach(seq => {
            const cards = seq.map(s => s.c);
            const pos = seq.map(s => s.p);
            const matchStr = checkCombination(cards, pos);
            if (matchStr) combosReales.push(matchStr);
        });
    });

    const vectoresArray = [
        { posicion: "Posición C1 (Carta 1)", nombre_carta: result.c1, significado_determinista: getDeterministicInfo(result.c1) },
        { posicion: "Posición C3 (Carta 2)", nombre_carta: result.c2, significado_determinista: getDeterministicInfo(result.c2) },
        { posicion: "Posición C5 (Carta 3)", nombre_carta: result.c3, significado_determinista: getDeterministicInfo(result.c3) },
        { posicion: "Posición C7 (Carta 4)", nombre_carta: result.c4, significado_determinista: getDeterministicInfo(result.c4) },
        { posicion: "Posición C9 (Carta 5)", nombre_carta: result.c5, significado_determinista: getDeterministicInfo(result.c5) },
        { posicion: "Posición C11 (Carta 6)", nombre_carta: result.c6, significado_determinista: getDeterministicInfo(result.c6) }
    ];

    let extractedDataText = "DATOS EXTRAÍDOS DEL BACKEND PARA EL INFORME:\n";
    extractedDataText += `PREGUNTA DEL CONSULTANTE: ${question}\n\n`;
    extractedDataText += `0.1 & 0.3 "SIGNIFICADO DETERMINISTA DE CADA VECTOR CARTA":\n`;
    extractedDataText += JSON.stringify(vectoresArray, null, 2) + "\n\n";
    extractedDataText += `0.2 "ALGORITMO ASOCIACIONES DE CARTAS MÉTODO BÉNTURI" (LISTADO DE ASOCIACIONES DE CARTAS ENCONTRADAS):\n`;
    
    if (combosReales.length > 0) {
        extractedDataText += combosReales.join("\n") + "\n\n";
    } else {
        extractedDataText += "(Ninguna asociación contigua válida encontrada)\n\n";
    }

    const contextText = extractedDataText + `\nInstrucción: Genera el informe final rellenando la estructura de tu prompt base (INFORME USUARIO) utilizando únicamente los datos aquí proporcionados. Recuerda usar la nomenclatura de posiciones (C1, C3, C5, C7, C9, C11) al referirte a las cartas.`;

    const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.7-flash', 
        systemInstruction: systemPrompt,
        generationConfig: { temperature: 0.0 }
    });
    
    console.log("Generando reporte...");
    const aiResponse = await model.generateContent(contextText);
    const text = aiResponse.response.text();
    fs.writeFileSync(path.join(__dirname, 'informe_generado_test.md'), text);
    console.log("Reporte generado guardado en informe_generado_test.md");
}

testInforme().catch(console.error);
