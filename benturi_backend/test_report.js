require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const systemPrompt = fs.readFileSync('../Informe Usuario .txt', 'utf8');
  const kb = JSON.parse(fs.readFileSync('base_conocimiento_cartas.json', 'utf8'));
  const det = JSON.parse(fs.readFileSync('base_determinista_cartas.json', 'utf8'));
  
  const normalizeCard = (name) => name ? name.toLowerCase().replace(/ de /g, ' ').trim() : '';
  const getDeterministicInfo = (cardName) => {
      const keys = Object.keys(det.cartas);
      const foundKey = keys.find(k => normalizeCard(k) === normalizeCard(cardName));
      if (foundKey) {
          const info = det.cartas[foundKey];
          return `**Amor y Relaciones**: ${info.Amor || 'N/A'}\n**Trabajo y Profesión**: ${info.Trabajo || 'N/A'}\n**Dinero y Finanzas**: ${info.Dinero || 'N/A'}\n**Salud y Bienestar**: ${info.Salud || 'N/A'}\n**Evolución Personal y Decisiones**: ${info.Evolucion || 'N/A'}`;
      }
      return "Información no encontrada.";
  };

  const formatComboStr = (c1, c2) => {
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
      return match ? `[${c1} + ${c2}]: ${match.significado}` : null;
  };

  const question = "Quiero saber si tengo oportunidad de tener una relacion sentimental con la chica que conocí en la fiesta?";
  
  // Eligiendo 6 cartas aleatorias relacionadas para el ejemplo
  const result = {
    c1: "AS DE OROS",
    c2: "DOS DE COPAS",
    c3: "TRES DE COPAS",
    c4: "SOTA DE COPAS",
    c5: "CABALLO DE COPAS",
    c6: "AS DE COPAS" 
  };

  const vectoresArray = [
      { posicion: "Situación Inicial", cartas: `${result.c1}, ${result.c2}`, info_c1: getDeterministicInfo(result.c1), info_c2: getDeterministicInfo(result.c2) },
      { posicion: "Desarrollo", cartas: `${result.c3}, ${result.c4}`, info_c3: getDeterministicInfo(result.c3), info_c4: getDeterministicInfo(result.c4) },
      { posicion: "Desenlace", cartas: `${result.c5}, ${result.c6}`, info_c5: getDeterministicInfo(result.c5), info_c6: getDeterministicInfo(result.c6) }
  ];

  const combosReales = [
      formatComboStr(result.c1, result.c2),
      formatComboStr(result.c2, result.c3),
      formatComboStr(result.c3, result.c4),
      formatComboStr(result.c4, result.c5),
      formatComboStr(result.c5, result.c6)
  ].filter(x => x);

  let extraFormatText = "REGLA DE FORMATO OBLIGATORIO Y ESTRICTO AL INICIO DEL REPORTE:\n";
  extraFormatText += "Pondrás por escrito exactamente lo siguiente antes de empezar el análisis detallado:\n";
  extraFormatText += `1 [Primera carta: ${result.c1}]\n`;
  extraFormatText += `2 [Segunda carta: ${result.c2}]\n`;
  extraFormatText += `3 [Tercera carta: ${result.c3}]\n`;
  extraFormatText += `4 [Cuarta carta: ${result.c4}]\n`;
  extraFormatText += `5 [Quinta carta: ${result.c5}]\n`;
  extraFormatText += `6 [Sexta carta: ${result.c6}]\n\n`;
  extraFormatText += `Asociaciones resultantes válidas:\n`;
  if (combosReales.length > 0) {
      extraFormatText += combosReales.join("\n") + "\n\n";
  } else {
      extraFormatText += "(Ninguna asociación contigua válida encontrada)\n\n";
  }

  const contextText = extraFormatText + `TIPO DE MATRIZ: Matriz de 6 Vectores\nPREGUNTA DEL USUARIO: ${question}\n\nVECTORES BASE CON INFORMACIÓN DETERMINISTA DE LA BASE DE DATOS:\n${JSON.stringify(vectoresArray, null, 2)}\n\n`;

  const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.6-flash', 
      systemInstruction: systemPrompt,
      generationConfig: { temperature: 0.0, topP: 1 }
  });
  
  try {
      const res = await model.generateContent(contextText);
      console.log(res.response.text());
  } catch(e) {
      console.error("ERROR GENERATING:", e.message);
  }
}
run();
