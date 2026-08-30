const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

async function testTirada() {
    const apiKey = process.env.GEMINI_API_KEY || 'TU_API_KEY';
    const genAI = new GoogleGenerativeAI(apiKey);
    const systemPrompt = fs.readFileSync('./prompt_generacion.txt', 'utf8');
    const kb = JSON.parse(fs.readFileSync('./base_conocimiento_cartas.json', 'utf8'));
    const det = JSON.parse(fs.readFileSync('./base_determinista_cartas.json', 'utf8'));
    
    const normalizeCard = (name) => name ? name.toLowerCase().replace(/ de /g, ' ').trim() : '';
    const getDeterministicInfo = (cardName) => {
        if (!cardName) return 'Sin carta';
        const keys = Object.keys(det.cartas);
        const foundKey = keys.find(k => normalizeCard(k) === normalizeCard(cardName));
        if (foundKey) {
            const info = det.cartas[foundKey];
            return `**Amor y Relaciones**: ${info.Amor || 'N/A'}\n**Trabajo y Profesión**: ${info.Trabajo || 'N/A'}\n**Dinero y Finanzas**: ${info.Dinero || 'N/A'}\n**Salud y Bienestar**: ${info.Salud || 'N/A'}\n**Evolución Personal y Decisiones**: ${info.Evolucion || 'N/A'}`;
        }
        return 'Información no encontrada en la base determinista.';
    };

    const formatComboStr = (c1, c2) => {
        if (!c1 || !c2) return null;
        const match = kb.combinaciones?.find(c => {
            const parts = c.combinacion.toLowerCase().split('+').map(p => p.trim().replace('.', ''));
            if (parts.length >= 2) {
               const p1 = normalizeCard(parts[0]);
               const p2 = normalizeCard(parts[1]);
               const n1 = normalizeCard(c1);
               const n2 = normalizeCard(c2);
               return (p1 === n1 && p2 === n2) || (p1 === n2 && p2 === n1);
            }
            return false;
        });
        if (match) return `[${c1} + ${c2}]: ${match.significado}`;
        return null;
    };

    const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.6-flash', 
        systemInstruction: systemPrompt,
        generationConfig: { temperature: 0.0, topP: 1 }
    });

    console.log('--- GENERANDO TIRADA 6 CARTAS ---');
    const result6 = {
        c1: 'As de Oros', c2: 'Dos de Copas', c3: 'Siete de Espadas', 
        c4: 'Caballo de Bastos', c5: 'Rey de Oros', c6: 'As de Copas'
    };
    
    let vectoresArray6 = [
        { posicion: 'Situación Inicial', cartas: `${result6.c1}, ${result6.c2}`, info_c1: getDeterministicInfo(result6.c1), info_c2: getDeterministicInfo(result6.c2) },
        { posicion: 'Desarrollo', cartas: `${result6.c3}, ${result6.c4}`, info_c3: getDeterministicInfo(result6.c3), info_c4: getDeterministicInfo(result6.c4) },
        { posicion: 'Desenlace', cartas: `${result6.c5}, ${result6.c6}`, info_c5: getDeterministicInfo(result6.c5), info_c6: getDeterministicInfo(result6.c6) }
    ];

    const combosReales = [
        formatComboStr(result6.c1, result6.c2), formatComboStr(result6.c2, result6.c3),
        formatComboStr(result6.c3, result6.c4), formatComboStr(result6.c4, result6.c5),
        formatComboStr(result6.c5, result6.c6)
    ].filter(x => x);

    let extraFormatText = 'REGLA DE FORMATO OBLIGATORIO Y ESTRICTO AL INICIO DEL REPORTE:\n';
    extraFormatText += 'Pondrás por escrito exactamente lo siguiente antes de empezar el análisis detallado:\n';
    extraFormatText += `1 [Primera carta: ${result6.c1}]\n2 [Segunda carta: ${result6.c2}]\n3 [Tercera carta: ${result6.c3}]\n4 [Cuarta carta: ${result6.c4}]\n5 [Quinta carta: ${result6.c5}]\n6 [Sexta carta: ${result6.c6}]\n\n`;
    extraFormatText += 'Asociaciones resultantes válidas:\n';
    if (combosReales.length > 0) { extraFormatText += combosReales.join('\n') + '\n\n'; } 
    else { extraFormatText += '(Ninguna asociación contigua válida encontrada)\n\n'; }

    let contextText6 = extraFormatText + 'TIPO DE MATRIZ: Matriz de 6 Vectores\nPREGUNTA DEL USUARIO: ¿Conseguiré el nuevo trabajo?\n\nVECTORES BASE CON INFORMACIÓN DETERMINISTA DE LA BASE DE DATOS:\n' + JSON.stringify(vectoresArray6, null, 2);
    
    let resp6 = await model.generateContent(contextText6);
    fs.writeFileSync('./tirada_6.md', resp6.response.text());
    console.log('Tirada 6 terminada y guardada.');

    console.log('--- GENERANDO TIRADA 24 CARTAS ---');
    const result24 = {
        q1: 'As de Oros, Dos de Copas, Rey de Oros, Cinco de Espadas, Siete de Bastos, Cuatro de Oros',
        q2: 'Tres de Espadas, Caballo de Bastos, As de Copas, Siete de Espadas, Dos de Bastos, Tres de Copas',
        q3: 'Rey de Espadas, As de Bastos, Nueve de Oros, Seis de Copas, Siete de Oros, Dos de Oros',
        q4: 'Cinco de Copas, Cuatro de Espadas, Tres de Oros, Ocho de Bastos, Caballo de Oros, Rey de Copas'
    };
    
    let vectoresArray24 = [
        { posicion: 'Cuadrante 1: Origen y Causa Subyacente', cartas: result24.q1 },
        { posicion: 'Cuadrante 2: Fricción y Resistencia', cartas: result24.q2 },
        { posicion: 'Cuadrante 3: Puntos de Inflexión y Acción', cartas: result24.q3 },
        { posicion: 'Cuadrante 4: Proyección y Desenlace', cartas: result24.q4 }
    ];
    let contextText24 = 'TIPO DE MATRIZ: Matriz Express de 24 Vectores\nPREGUNTA DEL USUARIO: ¿Cómo evolucionará mi empresa este año?\n\nDATOS EXTRAÍDOS (Resumen por Cuadrantes):\n' + JSON.stringify(vectoresArray24, null, 2);
    
    let resp24 = await model.generateContent(contextText24);
    fs.writeFileSync('./tirada_24.md', resp24.response.text());
    console.log('Tirada 24 terminada y guardada.');
}
testTirada().catch(console.error);
