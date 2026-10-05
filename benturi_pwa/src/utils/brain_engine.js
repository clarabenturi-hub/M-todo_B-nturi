import kbData from '../data/base_conocimiento_cartas.json';
import detData from '../data/base_determinista_cartas.json';
import { FULL_DECK } from '../constants/appData.js';

const normalizeCard = (name) => {
    if (!name) return '';
    return String(name)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\./g, ' ')
        .replace(/\b(caballero|caballo)\b/g, 'caballo')
        .replace(/\b(nueve|9)\b/g, '9')
        .replace(/\b(ocho|8)\b/g, '8')
        .replace(/\b(siete|7)\b/g, '7')
        .replace(/\b(seis|6)\b/g, '6')
        .replace(/\b(cinco|5)\b/g, '5')
        .replace(/\b(cuatro|4)\b/g, '4')
        .replace(/\b(tres|3)\b/g, '3')
        .replace(/\b(dos|2)\b/g, '2')
        .replace(/\b(as|1)\b/g, '1')
        .replace(/\bde\b|\bdel\b|\bda\b|\by\b/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const getCardMeaning = (cardName) => {
    if (!cardName) return null;
    const keys = Object.keys(detData.cartas);
    const foundKey = keys.find(k => normalizeCard(k) === normalizeCard(cardName));
    if (!foundKey) return `Significado no encontrado para ${cardName}`;
    const info = detData.cartas[foundKey];
    return `\n\n**Amor y Relaciones**: ${info.Amor || 'N/A'}\n\n**Trabajo y Profesión**: ${info.Trabajo || 'N/A'}\n\n**Dinero y Finanzas**: ${info.Dinero || 'N/A'}\n\n**Salud y Bienestar**: ${info.Salud || 'N/A'}\n\n**Evolución Personal y Decisiones**: ${info.Evolucion || 'N/A'}\n`;
};

const getCardImage = (cardName) => {
    if (!cardName) return '';
    const normName = normalizeCard(cardName);
    const card = FULL_DECK.find(c => normalizeCard(c.spanishName) === normName);
    return card ? card.img : '';
};

const checkCombo = (c1, c2) => {
    if (!c1 || !c2) return null;
    const match = kbData.combinaciones?.find(c => {
        const parts = c.combinacion
            .toLowerCase()
            .split('+')
            .map(p => p.trim().replace(/\./g, ' '));
        if (parts.length >= 2) {
            const normalizedParts = parts.map(normalizeCard);
            const n1 = normalizeCard(c1);
            const n2 = normalizeCard(c2);
            const direct = normalizedParts[0] === n1 && normalizedParts[1] === n2;
            const reverse = normalizedParts[0] === n2 && normalizedParts[1] === n1;
            return direct || reverse;
        }
        return false;
    });
    return match ? `**${c1} + ${c2}:** ${match.significado}` : null;
};

// Determinar el macro-tramo (Banda Inferior / Banda Superior)
const calculateBand = (cards) => {
    let espadasCount = 0;
    let copasBastosOrosCount = 0;
    
    cards.forEach(c => {
        if (!c) return;
        const norm = normalizeCard(c);
        if (norm.includes('espadas')) espadasCount++;
        else copasBastosOrosCount++;
    });

    if (espadasCount > copasBastosOrosCount) {
        // Dominan espadas -> Banda Inferior
        if (espadasCount >= cards.length * 0.7) {
            return "BANDA INFERIOR (Tramo 0 a 5): Sub-tramo CONFLICTO / DUELO SEVERO (0 a 3 sobre 10). La resistencia externa es alta y bloquea la energía.";
        } else {
            return "BANDA INFERIOR (Tramo 0 a 5): Sub-tramo RESISTENCIA / DISONANCIA / CHOQUE VISUAL (3 a 5 sobre 10). Existe fricción y análisis excesivo que retrasa el resultado.";
        }
    } else {
        // Dominan otros palos -> Banda Superior
        if (copasBastosOrosCount >= cards.length * 0.7) {
            return "BANDA SUPERIOR (Tramo 5 a 10): Sub-tramo ALEGRÍA MANIFESTADA / CELEBRACIÓN / DICHA (7 a 10 sobre 10). La energía fluye libremente hacia un triunfo evidente.";
        } else {
            return "BANDA SUPERIOR (Tramo 5 a 10): Sub-tramo ECUANIMIDAD / ACEPTACIÓN / NEUTRALIDAD POSITIVA (5 a 7 sobre 10). Existe un balance neutro positivo, avanzando poco a poco.";
        }
    }
};

export const generateDeterministicReport = (question, result) => {
    let markdown = "";
    
    // 1. PREGUNTA DEL CONSULTANTE
    markdown += `### 1. PREGUNTA DEL CONSULTANTE 📌\n`;
    markdown += `📝✨ **${question}**\n\n`;
    
    let allCards = [];
    let individualAnalysis = "";
    let combos = [];

    if (!result.q1 && result.c1) {
        markdown += `### MATRIZ DE VECTORES PROBABILÍSTICOS (TIRADA DE 6 CARTAS) 📌\n\n`;
        const c1img = getCardImage(result.c1);
        const c2img = getCardImage(result.c2);
        const c3img = getCardImage(result.c3);
        const c4img = getCardImage(result.c4);
        const c5img = getCardImage(result.c5);
        const c6img = getCardImage(result.c6);
        
        markdown += `| Carta 1 | Carta 2 | Carta 3 |\n`;
        markdown += `| :---: | :---: | :---: |\n`;
        markdown += `| ![](${c1img})<br>**${result.c1}** | ![](${c2img})<br>**${result.c2}** | ![](${c3img})<br>**${result.c3}** |\n\n`;
        
        markdown += `| Carta 4 | Carta 5 | Carta 6 |\n`;
        markdown += `| :---: | :---: | :---: |\n`;
        markdown += `| ![](${c4img})<br>**${result.c4}** | ![](${c5img})<br>**${result.c5}** | ![](${c6img})<br>**${result.c6}** |\n\n`;
        markdown += `---\n\n`;
    }

    // 2. ANÁLISIS INDIVIDUAL
    markdown += `### 2. ANÁLISIS INDIVIDUAL DE CADA VECTOR-CARTA RESPECTO A LA PREGUNTA 📌\n\n`;
    if (result.q1) {
        // Matriz Express de 24
        allCards = result.cards ? result.cards.map(c => c?.spanishName).filter(Boolean) : [];
        
        individualAnalysis += `Para la lectura de la Matriz Avanzada de 24 vectores, el Algoritmo Bénturi se concentra en los pares maestros de cada cuadrante probabilístico que definen tu proyección energética:\n\n`;
        individualAnalysis += `- **Primer Cuadrante (Vectores 1 y 2):** ${result.c1} y ${result.c2}\n`;
        individualAnalysis += `- **Segundo Cuadrante (Vectores 7 y 8):** ${result.c7} y ${result.c8}\n`;
        individualAnalysis += `- **Tercer Cuadrante (Vectores 13 y 14):** ${result.c13} y ${result.c14}\n`;
        individualAnalysis += `- **Cuarto Cuadrante (Vectores 19 y 20):** ${result.c19} y ${result.c20}\n\n`;
        
        individualAnalysis += `*(Los 16 vectores restantes actúan como entrelazamiento cuántico de fondo para sostener estos 4 pilares fundamentales).*\n`;

        const combo1 = checkCombo(result.c1, result.c2) || `**${result.c1} + ${result.c2}:** ${result.q1}`;
        if (combo1) combos.push(combo1);
        const combo2 = checkCombo(result.c7, result.c8) || `**${result.c7} + ${result.c8}:** ${result.q2}`;
        if (combo2) combos.push(combo2);
        const combo3 = checkCombo(result.c13, result.c14) || `**${result.c13} + ${result.c14}:** ${result.q3}`;
        if (combo3) combos.push(combo3);
        const combo4 = checkCombo(result.c19, result.c20) || `**${result.c19} + ${result.c20}:** ${result.q4}`;
        if (combo4) combos.push(combo4);
    } else if (result.c1) {
        allCards = [result.c1, result.c2, result.c3, result.c4, result.c5, result.c6];
        
        individualAnalysis += `- **${result.c1}**: ${getCardMeaning(result.c1)}\n`;
        individualAnalysis += `- **${result.c2}**: ${getCardMeaning(result.c2)}\n`;
        individualAnalysis += `- **${result.c3}**: ${getCardMeaning(result.c3)}\n`;
        individualAnalysis += `- **${result.c4}**: ${getCardMeaning(result.c4)}\n`;
        individualAnalysis += `- **${result.c5}**: ${getCardMeaning(result.c5)}\n`;
        individualAnalysis += `- **${result.c6}**: ${getCardMeaning(result.c6)}\n`;
        
        const combo1 = checkCombo(result.c1, result.c2);
        if (combo1) combos.push(combo1);
        const combo2 = checkCombo(result.c3, result.c4);
        if (combo2) combos.push(combo2);
        const combo3 = checkCombo(result.c5, result.c6);
        if (combo3) combos.push(combo3);
    }

    markdown += individualAnalysis + "\n";

    // 3. ANÁLISIS DEL CONJUNTO
    markdown += `### 3. ANÁLISIS DEL CONJUNTO DE LOS VECTORES-CARTAS Y SU CORRELACIÓN ENTRE ELLAS 📌\n\n`;
    if (combos.length > 0) {
        markdown += `En base al entrelazamiento de las frecuencias, se han detectado las siguientes interacciones dominantes:\n\n`;
        combos.forEach(c => markdown += `- ${c}\n`);
    } else {
        markdown += `Las frecuencias individuales operan de manera autónoma sin presentar choques ni alianzas absolutas entre pares. La correlación fluye según el peso de cada carta individual.\n`;
    }
    markdown += "\n";

    // 4. PROYECCIÓN DE ALTA PROBABILIDAD
    markdown += `### 4. PROYECCIÓN DE ALTA PROBABILIDAD + PREGUNTA DEL CONSULTANTE 📌\n\n`;
    markdown += `"Las emociones y los campos de consciencia no son magnitudes físicas estáticas ni datos fijos de laboratorio, sino ondas de probabilidad fluidas. Por ello, el Algoritmo Bénturi no predice un número estático e inflexible, sino que decodifica la franja o densidad energética dominante en la que se mueve la situación." 🌊🧠\n\n`;
    
    const bandText = calculateBand(allCards);
    markdown += `Al calcular el colapso de onda y la superposición de estados de los vectores ingresados, el sistema ha sintonizado la siguiente vibración de banda ancha:\n\n`;
    markdown += `**_${bandText}_** ✍️⚡\n\n`;
    markdown += `No existe un absoluto categórico; todo fluye según el efecto del observador. Mantén la calma, la fe en la luz y permite que la gracia de tu propio zen te guíe hacia la verdad eterna. 🧘‍♂️💫🔮✨\n\n`;

    // 5. LOS TRES PODERES Y CIERRE
    markdown += `### 5. LA PROYECCIÓN DE ALTA PROBABILIDAD Y EL MÉTODO BÉNTURI 📌\n\n`;
    markdown += `**PRIMER PODER "CONOCE" (La Proyección):** 🔮✨\nYa hemos trazado la proyección de alta probabilidad para tu situación actual. Hemos utilizado esta lectura como base para iluminar el camino que la energía presente marca.\n\n`;
    markdown += `**SEGUNDO PODER "EL DEL AMOR" (Evaluación Vibracional):** ❤️🔥👑\nAhora, es el momento de aplicar el poder del amor. Debes evaluar en qué parte de la pirámide te encuentras hoy. Es crucial identificar tu estado emocional, pues solo desde una frecuencia alineada con el amor podemos integrar esta información sin resistencia y elevar nuestra vibración para que los acontecimientos fluyan a nuestro favor.\n\n`;
    markdown += `**TERCER PODER "DECIDE" (La Acción Transformadora):** 🎯🐎💨\nPor último, aplicamos el poder de decidir. A través de la metodología paso a paso que tienes disponible en nuestra app y web, no solo comprendes tu futuro, sino que tienes la capacidad de intervenir en él. Si la proyección no resuena con tus objetivos, la metodología te permite modificar esa probabilidad. Pero recuerda: el éxito no reside solo en la intención, sino en el hacer. La acción constante es la única vía para demostrar al universo —o a tu propio fuero interno— tu compromiso absoluto con el resultado.\n\n`;
    markdown += `**Tu futuro se construye hoy. Decide, haz y transforma.** ✨🧘‍♂️💫\n\n`;
    markdown += `> _"Ahora que conoces esa proyección de futuro de altísima probabilidad, estás alineado con el Amor, y entiendes su poder, si no haces, no crees de verdad, qué pasará. Solo deseas desde la carencia. Tienes una gran ventaja al disponer del Método Bénturi. Pero perdón por ser reiterativos, si no haces y te quedas esperando, no crees de verdad..."_\n\n`;
    
    // TEXTO DE CIERRE
    markdown += `***\n\n`;
    markdown += `### SI EL ALGORITMO HA AJUSTADO ESA PROYECCIÓN DE FUTURO DE ALTÍSIMA PROBABILIDAD, QUE ALGUNOS LLAMARÁN DESTINO... ⚡🔮\n\n`;
    markdown += `**IMAGINA LO QUE LOGRARÁS CON EL SISTEMA COMPLETO.** 🤔✨\n\n`;
    markdown += `Si esto es lo que el algoritmo puede decodificar con una sola proyección, el límite lo pones tú. 🔝\n\n`;
    markdown += `Por una inversión menor a un menú mensual, accede a la HOJA DE RUTA TOTAL del MÉTODO BÉNTURI:\n\n`;
    markdown += `- ✅ PROYECCIONES DE ALTA PROBABILIDAD DE FUTURO ILIMITADAS ♾️\n`;
    markdown += `- ✅ PROYECCIONES PROFUNDAS DE 24 CARTAS 🃏✨\n`;
    markdown += `- ✅ EVALUACIÓN DE TU ESTADO EN LA PIRÁMIDE DEL AMOR ,PARA SU ASCENSO Y VIBRAR EN LA ENERGIA ADECUADA,PARA TU ÉXITO ❤️🔥 💖👑\n`;
    markdown += `- ✅ VISUALIZACIONES EXCLUSIVAS PARA MANIFESTAR TUS OBJETIVOS 🚀🌟\n\n`;
    markdown += `Deja de observar tu destino y empieza a diseñarlo. 🎨 Como ya hacen cientos de miles, toma las riendas de tu vida. 🐎💨\n\n`;
    markdown += `¡SUERTE! 🍀\n\n`;
    markdown += `**AUNQUE PROBABLEMENTE, YA NO LA NECESITES.** 😏🔥\n`;

    return markdown;
};
