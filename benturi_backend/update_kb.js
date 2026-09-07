const fs = require('fs');
const path = require('path');

const txtPath = path.join(__dirname, '../nuevo_prompt.txt');
const jsonPath = path.join(__dirname, 'base_conocimiento_cartas.json');

const txtContent = fs.readFileSync(txtPath, 'utf8');
const lines = txtContent.split(/\r?\n/).filter(line => line.trim() !== '');

const nuevasCombinaciones = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('+') && !line.startsWith('(')) {
        const combinacion = line.replace(/^\*+|\*+$/g, ''); // remove bold asterisks if any
        let significado = '';
        if (i + 1 < lines.length && !lines[i + 1].includes('+')) {
            significado = lines[i + 1].trim();
            i++; // skip next line
        }
        
        let palo_origen = "desconocido";
        const lowerComb = combinacion.toLowerCase();
        if (lowerComb.includes('espadas')) palo_origen = 'espadas';
        else if (lowerComb.includes('copas')) palo_origen = 'copas';
        else if (lowerComb.includes('oros')) palo_origen = 'oros';
        else if (lowerComb.includes('bastos')) palo_origen = 'bastos';
        
        nuevasCombinaciones.push({
            palo_origen,
            combinacion,
            significado
        });
    }
}

const kb = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
kb.combinaciones = nuevasCombinaciones;

fs.writeFileSync(jsonPath, JSON.stringify(kb, null, 2), 'utf8');
console.log(`Se han extraído ${nuevasCombinaciones.length} combinaciones y se ha actualizado el JSON.`);
