// Módulo de generación de PDF para PWA Matriz de Vectores
// Diseño editorial determinista — Método Bénturi (Sin emojis)

import { marked } from 'marked';

/**
 * Elimina emojis y pictogramas Unicode conservando acentos, signos de puntuación y símbolos estándar.
 */
export function stripEmojis(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
    .replace(/[ \t]{2,}/g, ' ');
}

/**
 * Preprocesa el Markdown bruto del LLM para normalizar separadores de guiones bajos,
 * etiquetas HTML de subrayado y limpiar emojis antes de pasarlo a marked.
 */
function preprocessMarkdown(rawText) {
  if (!rawText) return 'No hay contenido para mostrar';

  let text = stripEmojis(rawText);

  // Quitar etiquetas <u> y </u> para que los estilos CSS controlen los bordes superiores/inferiores
  text = text.replace(/<\/?u>/gi, '');

  // Convertir líneas largas de guiones bajos o signos igual en separadores horizontales estándar o eliminarlas si son decorativas
  text = text.replace(/^[ \t]*[_=]{4,}[ \t_\-=]*$/gm, '---');
  text = text.replace(/^[ \t]*-{4,}[ \t]*$/gm, '---');

  // Normalizar posiciones C1..C9 a C01..C09 cuando aparezcan entre corchetes
  text = text.replace(/\[C([1-9])\]/g, '[C0$1]');

  return text;
}

/**
 * Transforma el DOM HTML generado por marked en la maquetación editorial exacta
 * de "Informe de Proyección Determinista - Método Bénturi".
 */
function enhanceReportDOM(container) {
  // 1. Limpiar <hr> redundantes (los titulares ya llevan sus bordes en CSS)
  container.querySelectorAll('hr').forEach(hr => hr.remove());

  // 2. Normalizar párrafos que son en realidad titulares principales o subtitulares
  const allElements = Array.from(container.children);
  for (const el of allElements) {
    if (el.tagName === 'P') {
      const txt = el.textContent.trim();
      const upper = txt.toUpperCase();

      // Titulares principales numerados (1.- a 7.-)
      if (/^[1-7]\.\s*-\s*[A-ZÁÉÍÓÚÑ¿¡]/.test(txt) && txt.length < 140) {
        const h2 = document.createElement('h2');
        h2.className = 'section-heading';
        h2.textContent = txt.replace(/^\*\*|\*\*$/g, '');
        el.replaceWith(h2);
        continue;
      }

      // Subtítulos de FILA 1..4
      if (/^FILA\s+[1-4]\s*:/i.test(txt) && txt.length < 120) {
        const div = document.createElement('div');
        div.className = 'fila-banner';
        div.textContent = txt.replace(/^\*\*|\*\*$/g, '');
        el.replaceWith(div);
        continue;
      }

      // Capítulos I..IV si vienen en un párrafo suelto o con salto de línea
      if (/^CAP[ÍI]TULO\s+(I|II|III|IV|1|2|3|4)\b/i.test(txt)) {
        const lines = el.innerHTML.split(/<br\s*\/?>/i);
        if (lines.length > 1) {
          const titleDiv = document.createElement('h3');
          titleDiv.className = 'chapter-heading';
          titleDiv.innerHTML = lines[0].replace(/<\/?strong>|<\/?b>/gi, '').trim();
          const bodyP = document.createElement('p');
          bodyP.innerHTML = lines.slice(1).join('<br>');
          el.replaceWith(titleDiv, bodyP);
        } else {
          const titleDiv = document.createElement('h3');
          titleDiv.className = 'chapter-heading';
          titleDiv.textContent = txt.replace(/^\*\*|\*\*$/g, '');
          el.replaceWith(titleDiv);
        }
        continue;
      }

      // Facetas de la sección 4 si vienen en el mismo párrafo o como línea suelta
      const facetMatch = txt.match(/^[•\-*]?\s*(TRABAJO\s*\/\s*[ÁA]MBITO\s+LABORAL|DINERO\s*\/\s*FINANZAS\s+Y\s+PATRIMONIO|AMOR\s*\/\s*V[ÍI]NCULOS\s+Y\s+PAREJA|SALUD\s*\/\s*VITALIDAD\s+Y\s+BIENESTAR|CRECIMIENTO\s+PERSONAL\s*\/\s*ESTADO\s+DE\s+CONCIENCIA)\s*:?\s*([\s\S]*)/i);
      if (facetMatch) {
        const card = document.createElement('div');
        card.className = 'facet-card';
        const title = document.createElement('div');
        title.className = 'facet-card-title';
        title.textContent = facetMatch[1].toUpperCase();
        card.appendChild(title);
        if (facetMatch[2] && facetMatch[2].trim()) {
          const body = document.createElement('div');
          body.className = 'facet-card-body';
          body.textContent = facetMatch[2].trim();
          card.appendChild(body);
        }
        el.replaceWith(card);
        continue;
      }

      // Escenario probabilístico consolidado (24 cartas) o conclusión probabilística (6 cartas)
      if (/^_?\*?\*?(Escenario probabil[íi]stico consolidado\s*:|"Existe una probabilidad|Existe una probabilidad\s+(baja|media|alta|alt[íi]sima))/i.test(txt)) {
        const banner = document.createElement('div');
        banner.className = 'consolidated-banner';
        banner.textContent = txt.replace(/^[_*]+|[_*]+$/g, '');
        el.replaceWith(banner);
        continue;
      }

      // Citas encuadradas del punto 4, 5 o 6 ("Ahora que conoces...", "Cuando compruebes...", "Acuérdate, con el poder número tres...")
      if (
        upper.includes('AHORA QUE CONOCES ESA PROYECCIÓN DE FUTURO') ||
        upper.includes('AHORA QUE CONOCES ESA PROYECCION DE FUTURO') ||
        upper.includes('CUANDO COMPRUEBES QUE ESTA PROYECCIÓN') ||
        upper.includes('CUANDO COMPRUEBES QUE ESTA PROYECCION') ||
        (upper.includes('ACUÉRDATE') && upper.includes('DECIDE') && upper.includes('CAMBIAR DE VÍA'))
      ) {
        const callout = document.createElement('div');
        callout.className = 'gold-quote-box';
        callout.textContent = txt.replace(/^[_*]+|[_*]+$/g, '');
        el.replaceWith(callout);
        continue;
      }

      // Cierre final "¡Mucha suerte!..."
      if (upper.includes('MUCHA SUERTE') && upper.includes('CAFÉ A LA SEMANA')) {
        const finalBox = document.createElement('div');
        finalBox.className = 'final-luck-box';
        finalBox.textContent = txt.replace(/^[_*]+|[_*]+$/g, '');
        el.replaceWith(finalBox);
        continue;
      }
    }
  }

  // Clasificar h1/h2/h3 existentes
  container.querySelectorAll('h1, h2, h3, h4').forEach(h => {
    const txt = h.textContent.trim();
    const upper = txt.toUpperCase();
    if (/^[1-7]\.\s*-/.test(txt)) {
      h.className = 'section-heading';
    } else if (/^FILA\s+[1-4]\b/i.test(txt)) {
      const div = document.createElement('div');
      div.className = 'fila-banner';
      div.textContent = txt;
      h.replaceWith(div);
    } else if (/^CAP[ÍI]TULO\s+(I|II|III|IV|1|2|3|4)\b/i.test(txt)) {
      h.className = 'chapter-heading';
    } else if (/^(TRABAJO\s*\/|DINERO\s*\/|AMOR\s*\/|SALUD\s*\/|CRECIMIENTO\s+PERSONAL\s*\/)/i.test(txt)) {
      h.className = 'facet-heading-marker';
    } else if (/^(PRIMER PODER|SEGUNDO PODER|TERCER PODER|[123]\s*[-.]\s*(PRIMER|SEGUNDO|TERCER)\s+PODER|[123]\.\s*(INTEGRACI[ÓO]N|EJECUCI[ÓO]N)\s+DEL|5\.[12]\s*-)/i.test(txt)) {
      h.className = 'power-heading-marker';
    }
  });

  // 3. Agrupar la NOTA MUY IMPORTANTE DEL SISTEMA superior
  const childrenStep1 = Array.from(container.children);
  const notaIdx = childrenStep1.findIndex(el => el.textContent.toUpperCase().includes('NOTA MUY IMPORTANTE DEL SISTEMA'));
  if (notaIdx !== -1) {
    const notaBox = document.createElement('div');
    notaBox.className = 'system-notice-box';
    const notaTitle = document.createElement('div');
    notaTitle.className = 'system-notice-title';
    notaTitle.textContent = 'NOTA MUY IMPORTANTE DEL SISTEMA';
    notaBox.appendChild(notaTitle);

    const notaList = document.createElement('ul');
    notaList.className = 'system-notice-list';

    let i = notaIdx;
    const toRemove = [];
    while (i < childrenStep1.length) {
      const curr = childrenStep1[i];
      const u = curr.textContent.toUpperCase();
      if (i > notaIdx && (u.includes('DECODIFICACIÓN PROYECCIÓN') || u.includes('DECODIFICACION PROYECCION') || /^[12]\.\s*-/.test(u.trim()))) {
        break;
      }
      toRemove.push(curr);
      if (curr.tagName === 'UL') {
        Array.from(curr.querySelectorAll('li')).forEach(li => {
          const clone = document.createElement('li');
          clone.innerHTML = formatNoticeBullet(li.textContent);
          notaList.appendChild(clone);
        });
      } else {
        const lines = curr.textContent.split(/\n+/).map(l => l.trim()).filter(Boolean);
        lines.forEach(line => {
          if (line.toUpperCase().replace(/[^A-Z]/g, '') === 'NOTAMUYIMPORTANTEDELSISTEMA') return;
          const li = document.createElement('li');
          li.innerHTML = formatNoticeBullet(line);
          notaList.appendChild(li);
        });
      }
      i++;
    }

    // Unificar si SALUD Y BIENESTAR o RESPONSABILIDAD quedaron partidos en varias líneas
    consolidateNoticeList(notaList);
    notaBox.appendChild(notaList);
    if (toRemove.length > 0) {
      container.insertBefore(notaBox, toRemove[0]);
      toRemove.forEach(n => n.remove());
    }
  }

  // 4. Agrupar el Banner Hero "DECODIFICACIÓN PROYECCIÓN MÉTODO BÉNTURI"
  const childrenStep2 = Array.from(container.children);
  const heroIdx = childrenStep2.findIndex(el => {
    const u = el.textContent.toUpperCase();
    return u.includes('DECODIFICACIÓN') && u.includes('PROYECCIÓN') && u.includes('BÉNTURI');
  });

  if (heroIdx !== -1) {
    const heroBox = document.createElement('div');
    heroBox.className = 'hero-banner';

    const heroTitle = document.createElement('div');
    heroTitle.className = 'hero-banner-title';
    heroTitle.textContent = 'DECODIFICACIÓN PROYECCIÓN MÉTODO BÉNTURI';
    heroBox.appendChild(heroTitle);

    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'hero-banner-steps';

    let footerLineText = '';
    const toRemove = [];
    let i = heroIdx;
    while (i < childrenStep2.length) {
      const curr = childrenStep2[i];
      const u = curr.textContent.trim().toUpperCase();
      if (i > heroIdx && (curr.classList.contains('section-heading') || /^2\.\s*-/.test(u))) {
        break;
      }
      toRemove.push(curr);
      const lines = curr.textContent.split(/\n+/).map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        const lu = line.toUpperCase();
        if (lu.includes('DECODIFICACIÓN') && lu.includes('BÉNTURI') && !lu.includes('24 VECTORES')) continue;
        if (lu.includes('VECTORES') || lu.includes('BILLONES')) {
          footerLineText = line.replace(/\(\[FECHA ACTUAL\]\)|\(\[FECHA ACTUAL\]/i, `(${formatSpanishDate()})`);
        } else if (/^[123]\.\s*-/.test(line)) {
          const stepDiv = document.createElement('div');
          stepDiv.className = 'hero-step-line';
          stepDiv.textContent = line;
          stepsContainer.appendChild(stepDiv);
        }
      }
      i++;
    }

    if (stepsContainer.children.length === 0) {
      [
        '1.- FUNDAMENTOS E INFLUENCIAS DE ORIGEN',
        '2.- FUERZAS EN ACTIVO Y ESPACIO DE TRANSFORMACIÓN',
        '3.- HORIZONTES DE ALTA PROBABILIDAD CON TENDENCIAS DE EVOLUCIÓN'
      ].forEach(s => {
        const d = document.createElement('div');
        d.className = 'hero-step-line';
        d.textContent = s;
        stepsContainer.appendChild(d);
      });
    }
    heroBox.appendChild(stepsContainer);

    const divider = document.createElement('div');
    divider.className = 'hero-banner-divider';
    heroBox.appendChild(divider);

    const heroFooter = document.createElement('div');
    heroFooter.className = 'hero-banner-footer';
    heroFooter.textContent = footerLineText || `24 VECTORES CARTAS. 322 BILLONES DE PROBABILIDADES (${formatSpanishDate()})`;
    heroBox.appendChild(heroFooter);

    if (toRemove.length > 0) {
      container.insertBefore(heroBox, toRemove[0]);
      toRemove.forEach(n => n.remove());
    }
  }

  // 5. Estilizar tablas de VECTOR-CARTA (y convertir listas o párrafos de vectores en tablas si el LLM usó viñetas)
  container.querySelectorAll('ul').forEach(ul => {
    const items = Array.from(ul.querySelectorAll('li'));
    const isVectorList = items.length > 0 && items.every(li => /\[?C\d{1,2}\]?|(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA)\s+CARTA-VECTOR/i.test(li.textContent));
    if (isVectorList) {
      const table = buildVectorTableFromList(items);
      ul.replaceWith(table);
    }
  });

  // Si en el informe de 6 cartas los vectores vinieron como párrafos sueltos (PRIMERA CARTA-VECTOR...), agruparlos en tabla
  const pNodes = Array.from(container.querySelectorAll('p'));
  const vectorParas = pNodes.filter(p => /^[\s*_]*(\[?C\d{1,2}\]?\s*)?(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA)\s+CARTA-VECTOR/i.test(p.textContent.trim()));
  if (vectorParas.length >= 2) {
    const table = buildVectorTableFromList(vectorParas);
    container.insertBefore(table, vectorParas[0]);
    vectorParas.forEach(p => p.remove());
  }

  container.querySelectorAll('table').forEach(table => {
    const firstHeader = table.querySelector('th');
    if (firstHeader && firstHeader.textContent.toUpperCase().includes('VECTOR')) {
      table.className = 'vector-table';
      table.querySelectorAll('tbody tr').forEach(tr => {
        const firstTd = tr.querySelector('td');
        if (firstTd) {
          firstTd.className = 'vector-cell-name';
          firstTd.innerHTML = formatVectorLabel(firstTd.textContent);
        }
        const secondTd = tr.querySelectorAll('td')[1];
        if (secondTd) {
          secondTd.className = 'vector-cell-desc';
        }
      });
    }
  });

  // 6. Envolver cada CAPÍTULO I..IV en su contenedor con barra lateral ámbar
  const chapterHeadings = Array.from(container.querySelectorAll('.chapter-heading'));
  chapterHeadings.forEach(ch => {
    const wrapper = document.createElement('div');
    wrapper.className = 'chapter-block';
    container.insertBefore(wrapper, ch);
    wrapper.appendChild(ch);
    while (wrapper.nextElementSibling) {
      const next = wrapper.nextElementSibling;
      if (
        next.classList.contains('chapter-heading') ||
        next.classList.contains('section-heading') ||
        next.classList.contains('chapter-block')
      ) {
        break;
      }
      wrapper.appendChild(next);
    }
  });

  // 7. Envolver las 5 facetas si vinieron con encabezados h3 (.facet-heading-marker) o en lista
  container.querySelectorAll('ul').forEach(ul => {
    const items = Array.from(ul.children);
    const isFacetList = items.some(li => /^(TRABAJO\s*\/|DINERO\s*\/|AMOR\s*\/|SALUD\s*\/|CRECIMIENTO\s+PERSONAL)/i.test(li.textContent.trim()));
    if (isFacetList) {
      const frag = document.createDocumentFragment();
      items.forEach(li => {
        const txt = li.textContent.trim();
        if (/^Escenario probabil[íi]stico consolidado/i.test(txt)) {
          const b = document.createElement('div');
          b.className = 'consolidated-banner';
          b.textContent = txt;
          frag.appendChild(b);
          return;
        }
        const parts = txt.split(':');
        const card = document.createElement('div');
        card.className = 'facet-card';
        const t = document.createElement('div');
        t.className = 'facet-card-title';
        t.textContent = (parts[0] || '').trim().toUpperCase();
        const body = document.createElement('div');
        body.className = 'facet-card-body';
        body.textContent = parts.slice(1).join(':').trim();
        card.appendChild(t);
        card.appendChild(body);
        frag.appendChild(card);
      });
      ul.replaceWith(frag);
    }
  });

  const facetMarkers = Array.from(container.querySelectorAll('.facet-heading-marker'));
  facetMarkers.forEach(fh => {
    const card = document.createElement('div');
    card.className = 'facet-card';
    const title = document.createElement('div');
    title.className = 'facet-card-title';
    title.textContent = fh.textContent.trim().replace(/:$/, '').toUpperCase();
    card.appendChild(title);
    container.insertBefore(card, fh);
    fh.remove();

    while (card.nextElementSibling) {
      const next = card.nextElementSibling;
      if (
        next.classList.contains('facet-heading-marker') ||
        next.classList.contains('facet-card') ||
        next.classList.contains('consolidated-banner') ||
        next.classList.contains('section-heading')
      ) {
        break;
      }
      next.classList.add('facet-card-body');
      card.appendChild(next);
    }
  });

  // 8. Envolver tarjetas de Poderes en secciones 5 y 6 (.power-heading-marker)
  const powerMarkers = Array.from(container.querySelectorAll('.power-heading-marker'));
  powerMarkers.forEach(ph => {
    const card = document.createElement('div');
    card.className = 'power-card';
    const title = document.createElement('div');
    title.className = 'power-card-title';
    title.textContent = ph.textContent.trim().replace(/:$/, '').toUpperCase();
    card.appendChild(title);
    container.insertBefore(card, ph);
    ph.remove();

    while (card.nextElementSibling) {
      const next = card.nextElementSibling;
      if (
        next.classList.contains('power-heading-marker') ||
        next.classList.contains('power-card') ||
        next.classList.contains('gold-quote-box') ||
        next.classList.contains('section-heading')
      ) {
        break;
      }
      card.appendChild(next);
    }
  });

  // 9. Estructurar la Sección 7 (Bloque Final Obligatorio: Banner oscuro + Tabla comparativa 2 columnas + Caja final)
  buildClosingSection(container);
}

function formatNoticeBullet(text) {
  const cleaned = text.replace(/^[•\-*\s]+/, '').trim();
  const colonIdx = cleaned.indexOf(':');
  if (colonIdx !== -1 && colonIdx < 45) {
    const label = cleaned.slice(0, colonIdx + 1).trim();
    const rest = cleaned.slice(colonIdx + 1).trim();
    return `<strong>${label}</strong> ${rest}`;
  }
  return cleaned;
}

function consolidateNoticeList(ul) {
  const items = Array.from(ul.querySelectorAll('li'));
  const merged = [];
  for (const li of items) {
    const txt = li.textContent.trim();
    const isHeaderOnly = /^(SALUD Y BIENESTAR|RESPONSABILIDAD Y LIBRE ALBEDR[ÍI]O)\s*:?$/i.test(txt);
    if (isHeaderOnly) {
      merged.push({ pendingHeader: txt.replace(/:?$/, ':') });
    } else if (merged.length > 0 && merged[merged.length - 1].pendingHeader) {
      const prev = merged[merged.length - 1];
      prev.html = `<strong>${prev.pendingHeader}</strong> ${txt}`;
      delete prev.pendingHeader;
    } else if (
      merged.length > 0 &&
      !txt.startsWith('SALUD Y BIENESTAR') &&
      !txt.startsWith('RESPONSABILIDAD Y LIBRE') &&
      !txt.startsWith('ESE ES EL VERDADERO VALOR')
    ) {
      merged[merged.length - 1].html += ' ' + txt;
    } else {
      merged.push({ html: formatNoticeBullet(txt) });
    }
  }
  ul.innerHTML = '';
  merged.forEach(m => {
    if (!m.html) return;
    const li = document.createElement('li');
    li.innerHTML = m.html;
    ul.appendChild(li);
  });
}

function formatSpanishDate() {
  const meses = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];
  const d = new Date();
  return `${d.getDate()} DE ${meses[d.getMonth()]} DE ${d.getFullYear()}`;
}

function formatVectorLabel(raw) {
  const clean = raw.replace(/[*_]/g, '').trim();
  // Caso 6 cartas: "PRIMERA CARTA-VECTOR DE PROYECCIÓN: CINCO DE ESPADAS" (sin códigos C01..C11 de 24 cartas)
  const m6 = clean.match(/^(?:\[?C\d{1,2}\]?\s*)?((?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA)\s+CARTA-VECTOR(?:\s+DE\s+PROYECCI[ÓO]N)?)\s*:?\s*(.+)$/i);
  if (m6) {
    const label = m6[1].toUpperCase();
    const cardName = m6[2].trim();
    return `<span class="vec-code">${label}:</span><br><span class="vec-card">${cardName}</span>`;
  }
  const m = clean.match(/^(\[?C\d{1,2}\]?)\s*[-–:]?\s*(.+)$/i);
  if (m) {
    let code = m[1].toUpperCase();
    if (!code.startsWith('[')) code = `[${code}]`;
    code = code.replace(/^\[C([1-9])\]$/, '[C0$1]');
    const cardName = m[2].replace(/^\(|\)$/g, '').trim();
    return `<span class="vec-code">${code}</span> <span class="vec-card">${cardName}</span>`;
  }
  return `<span class="vec-card">${clean}</span>`;
}

function buildVectorTableFromList(liElements) {
  const table = document.createElement('table');
  table.className = 'vector-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>VECTOR-CARTA</th>
        <th>DECODIFICACIÓN DETERMINISTA Y PROYECCIÓN APLICADA</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');
  liElements.forEach(li => {
    const tr = document.createElement('tr');
    const html = li.innerHTML;
    const colonIdx = html.indexOf(':');
    let left = '';
    let right = '';
    if (colonIdx !== -1) {
      left = html.slice(0, colonIdx).replace(/<[^>]+>/g, '');
      right = html.slice(colonIdx + 1).trim();
    } else {
      left = li.textContent.slice(0, 25);
      right = li.innerHTML;
    }
    const td1 = document.createElement('td');
    td1.className = 'vector-cell-name';
    td1.innerHTML = formatVectorLabel(left);
    const td2 = document.createElement('td');
    td2.className = 'vector-cell-desc';
    td2.innerHTML = right;
    tr.appendChild(td1);
    tr.appendChild(td2);
    tbody.appendChild(tr);
  });
  return table;
}

function buildClosingSection(container) {
  const all = Array.from(container.children);
  const startIdx = all.findIndex(el => {
    const u = el.textContent.toUpperCase();
    return (
      u.includes('7.- PROYECCIÓN DE CONTINUIDAD') ||
      u.includes('SI EL ALGORITMO HA AJUSTADO ESA PROYECCIÓN') ||
      u.includes('SI EL ALGORITMO HA AJUSTADO ESA PROYECCION')
    );
  });

  if (startIdx === -1) return;

  const is24Report = all.some(el => {
    const u = el.textContent.toUpperCase();
    return u.includes('24 VECTORES') || u.includes('322 BILLONES') || u.includes('7.- PROYECCIÓN DE CONTINUIDAD');
  });

  const toRemove = all.slice(startIdx);
  const anchor = toRemove[0];

  if (is24Report) {
    const section7Heading = document.createElement('h2');
    section7Heading.className = 'section-heading';
    section7Heading.textContent = '7.- PROYECCIÓN DE CONTINUIDAD Y ACCESO AL SISTEMA';
    container.insertBefore(section7Heading, anchor);
  }

  const ctaBanner = document.createElement('div');
  ctaBanner.className = 'closing-cta-banner';
  if (is24Report) {
    ctaBanner.innerHTML = `
      <div class="closing-cta-strong">SI EL ALGORITMO HA AJUSTADO ESA PROYECCIÓN DE FUTURO DE ALTÍSIMA PROBABILIDAD, QUE ALGUNOS LLAMARÁN DESTINO... IMAGINA LO QUE LOGRARÁS CON EL SISTEMA COMPLETO.</div>
      <div class="closing-cta-normal">Si esto es lo que el algoritmo puede decodificar con una sola proyección, el límite lo pones tú.</div>
      <div class="closing-cta-strong">“POR EL PRECIO DE UN CAFÉ A LA SEMANA, PASA A SER DE ESPECTADOR A ARQUITECTO DE TU VIDA”</div>
      <div class="closing-cta-normal">Accede a la HOJA DE RUTA TOTAL del MÉTODO BÉNTURI:</div>
    `;
  } else {
    ctaBanner.innerHTML = `
      <div class="closing-cta-strong">SI EL ALGORITMO HA AJUSTADO ESA PROYECCIÓN DE FUTURO DE ALTÍSIMA PROBABILIDAD, QUE ALGUNOS LLAMARÁN DESTINO... IMAGINA LO QUE LOGRARÁS CON EL SISTEMA COMPLETO.</div>
      <div class="closing-cta-normal">Si esto es lo que el algoritmo puede decodificar con una sola proyección, el límite lo pones tú.</div>
      <div class="closing-cta-normal">Por una inversión menor a un menú mensual, accede a la HOJA DE RUTA TOTAL del MÉTODO BÉNTURI:</div>
    `;
  }

  const premiumSecondLine = is24Report
    ? 'Tener ilimitadas proyecciones es perfecto PARA TRIANGULAR TIRADAS VECTORES -CARTAS'
    : 'SON PERFECTAS PARA TRIANGULAR TIRADAS VECTORES -CARTAS';

  const plansTable = document.createElement('table');
  plansTable.className = 'plans-comparison-table';
  plansTable.innerHTML = `
    <thead>
      <tr>
        <th>BÉNTURI DESPEGUE</th>
        <th>BÉNTURI PREMIUM</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="plan-feature"><span class="plan-check">&#10003;</span> 12 PROYECCIONES DE ALTA PROBABILIDAD DE FUTURO MENSUALES.</div>
          <div class="plan-feature"><span class="plan-check">&#10003;</span> 1 PROYECCION PROFUNDA DE 24 CARTAS MENSUAL</div>
          <div class="plan-feature"><span class="plan-check">&#10003;</span> EVALUACIÓN DE TU ESTADO EN LA PIRÁMIDE DEL AMOR ,PARA SU ASCENSO Y VIBRAR EN LA ENERGIA ADECUADA,PARA TU ÉXITO</div>
        </td>
        <td>
          <div class="plan-feature"><span class="plan-check">&#10003;</span> ILIMITADAS PROYECCIONES DE ALTA PROBABILIDAD DE FUTURO</div>
          <div class="plan-feature"><span class="plan-check">&#10003;</span> ${premiumSecondLine}</div>
          <div class="plan-feature"><span class="plan-check">&#10003;</span> 1 PROYECCION PROFUNDA DE 24 CARTAS MENSUAL</div>
          <div class="plan-feature"><span class="plan-check">&#10003;</span> EVALUACIÓN DE TU ESTADO EN LA PIRÁMIDE DEL AMOR ,PARA SU ASCENSO Y VIBRAR EN LA ENERGIA ADECUADA,PARA TU ÉXITO</div>
        </td>
      </tr>
    </tbody>
  `;

  const finalLuckBox = document.createElement('div');
  finalLuckBox.className = 'final-luck-box';
  finalLuckBox.textContent = '¡Mucha suerte! Aunque probablemente, con el Método Bénturi y por lo que cuesta un café a la semana... ¡ya no la necesites!';

  container.insertBefore(ctaBanner, anchor);
  container.insertBefore(plansTable, anchor);
  container.insertBefore(finalLuckBox, anchor);

  toRemove.forEach(n => n.remove());
}

/**
 * Construye el documento HTML5/CSS3 exclusivo para el Informe Oficial de 6 Vectores-Cartas,
 * respetando la identidad visual (#0B192C, #C5A059, #FBF8F1, #1F2937, #4B5563, #FFFFFF)
 * sin alterar ninguna palabra del texto y conservando únicamente el icono ✅ en la tabla de planes.
 */
function build6CardFullHTML(rawMarkdown, filename) {
  let text = stripEmojis(rawMarkdown || '');
  text = text.replace(/<\/?u>/gi, '');
  text = text.replace(/^[ \t]*[¬_=]{3,}[ \t_\-=]*$/gm, '---');
  text = text.replace(/^[ \t]*-{3,}[ \t]*$/gm, '---');

  marked.setOptions({ breaks: true, gfm: true });
  const parsedHtml = marked.parse(text);

  const root = document.createElement('div');
  root.innerHTML = parsedHtml;
  root.querySelectorAll('hr').forEach(hr => hr.remove());

  // 1. Extraer y estructurar la NOTA MUY IMPORTANTE DEL SISTEMA
  const allInitial = Array.from(root.children);
  const notaIdx = allInitial.findIndex(el => el.textContent.toUpperCase().includes('NOTA MUY IMPORTANTE DEL SISTEMA'));
  let noticeHtml = `
    <div class="b6-notice-box">
      <div class="b6-notice-title">NOTA MUY IMPORTANTE DEL SISTEMA</div>
      <p class="b6-notice-p">ESTA PLATAFORMA OFRECE ORIENTACIÓN PURA Y AUTOCONOCIMIENTO PROFUNDO, ¡PERO NO ES UN DIAGNÓSTICO NI PRONÓSTICO MÉDICO! SI TIENES CUALQUIER DUDA O PROBLEMA DE SALUD, ¡LA PRIORIDAD ABSOLUTA ES ACUDIR SIEMPRE A UN PROFESIONAL MÉDICO CUALIFICADO!</p>
      <ul class="b6-notice-list">
        <li><strong>RESPONSABILIDAD Y LIBRE ALBEDRÍO:</strong> EL MÉTODO BÉNTURI ES UNA POTENTE BRÚJULA PARA DESCODIFICAR ESA PROYECCIÓN DE FUTURO DE ALTISIMA PROBABILIDAD ,QUE ALGUNOS LLAMARÁN DESTINO. ¡PERO EL ÚNICO Y VERDADERO ARTÍFICE DE TU DESTINO ERES TÚ! TOMA ESTE SISTEMA COMO UN FARO DE AYUDA Y REFLEXIÓN, SABIENDO QUE EL TIMÓN, LA ACCIÓN Y LA ABSOLUTA RESPONSABILIDAD SOBRE TU VIDA SIEMPRE RECAEN EN TUS MANOS. ESE ES EL VERDADERO VALOR, ¡ANTICIPARSE! Y RECUERDA:</li>
        <li><strong>SI LA PROYECCIÓN DE ALTÍSIMA PROBABILIDAD NO TE GUSTA... CAMBIÁLA CON EL PODER NÚMERO TRES!</strong> ¡NADA ESTÁ ESCRITO EN PIEDRA CUANDO TU VOLUNTAD ACTÚA! TOMA EL CONTROL ABSOLUTO, ACTIVA TU ENERGÍA Y TRANSFORMA TU DESTINO AHORA MISMO.</li>
      </ul>
    </div>
  `;

  if (notaIdx !== -1) {
    let i = notaIdx;
    const toRemove = [];
    while (i < allInitial.length) {
      const curr = allInitial[i];
      const u = curr.textContent.trim().toUpperCase();
      if (i > notaIdx && /^1\.\s*-/.test(u)) break;
      toRemove.push(curr);
      i++;
    }
    toRemove.forEach(n => n.remove());
  }

  // 2. Normalizar titulares 1.- a 6.- y bloques especiales
  Array.from(root.children).forEach(el => {
    const txt = el.textContent.trim();
    const upper = txt.toUpperCase();

    if (/^[1-6]\.\s*-\s*/.test(txt) && txt.length < 160) {
      const h2 = document.createElement('h2');
      h2.className = 'b6-section-title';
      h2.textContent = txt.replace(/^[*_]+|[*_]+$/g, '');
      el.replaceWith(h2);
      return;
    }

    // Tarjetas individuales para cada una de las 6 cartas-vectores (Sección 2)
    const vecMatch = txt.match(/^[*_\s]*((?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA)\s+CARTA-VECTOR(?:\s+DE\s+PROYECCI[ÓO]N)?\s*:\s*[^\n:]+)\s*:?\s*([\s\S]*)$/i);
    if (vecMatch) {
      const card = document.createElement('div');
      card.className = 'b6-vector-card';
      const head = document.createElement('div');
      head.className = 'b6-vector-card-title';
      head.textContent = vecMatch[1].replace(/[*_]/g, '').trim().toUpperCase();
      card.appendChild(head);

      const restText = (vecMatch[2] || '').trim();
      if (restText) {
        const body = document.createElement('div');
        body.className = 'b6-vector-card-body';
        body.textContent = restText.replace(/^[*_]+|[*_]+$/g, '');
        card.appendChild(body);
      } else if (el.nextElementSibling && el.nextElementSibling.tagName === 'P') {
        const nextTxt = el.nextElementSibling.textContent.trim();
        if (!/^[*_\s]*(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA)\s+CARTA-VECTOR/i.test(nextTxt) && !/^[1-6]\.\s*-/.test(nextTxt)) {
          const body = document.createElement('div');
          body.className = 'b6-vector-card-body';
          body.innerHTML = el.nextElementSibling.innerHTML;
          card.appendChild(body);
          el.nextElementSibling.remove();
        }
      }
      el.replaceWith(card);
      return;
    }

    // Conclusión probabilística (Sección 4) en caja crema con borde doble dorado
    if (/^[_*"«]*(Existe una probabilidad\s+(baja|media|alta|alt[íi]sima))/i.test(txt)) {
      const box = document.createElement('div');
      box.className = 'b6-projection-conclusion';
      box.textContent = txt.replace(/^[_*]+|[_*]+$/g, '');
      el.replaceWith(box);
      return;
    }

    // Cita encuadrada "«Cuando compruebes que esta proyección..." o "“Acuérdate ,con el poder número tres..."
    if (
      upper.includes('CUANDO COMPRUEBES QUE ESTA PROYECCIÓN') ||
      upper.includes('CUANDO COMPRUEBES QUE ESTA PROYECCION') ||
      (upper.includes('ACUÉRDATE') && upper.includes('DECIDE') && upper.includes('CAMBIAR DE VÍA'))
    ) {
      const quote = document.createElement('div');
      quote.className = 'b6-gold-quote';
      quote.textContent = txt.replace(/^[_*]+|[_*]+$/g, '');
      el.replaceWith(quote);
      return;
    }

    // Subbloques de secciones 5 y 6 (5.1, 5.2, 1- PRIMER PODER, 2- SEGUNDO PODER, 3- TERCER PODER, Sinopsis)
    if (/^(5\.[12]\s*-|[123]\s*-\s*(PRIMER|SEGUNDO|TERCER)\s+PODER|SINOPSIS\s*:)/i.test(txt)) {
      const lines = el.innerHTML.split(/<br\s*\/?>/i);
      const block = document.createElement('div');
      block.className = 'b6-structured-block';
      const titleDiv = document.createElement('div');
      titleDiv.className = 'b6-structured-title';
      titleDiv.textContent = lines[0].replace(/<[^>]+>|[*_]/g, '').trim();
      block.appendChild(titleDiv);
      if (lines.length > 1) {
        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'b6-structured-body';
        bodyDiv.innerHTML = lines.slice(1).join('<br>');
        block.appendChild(bodyDiv);
      }
      el.replaceWith(block);
      return;
    }
  });

  // Si las 6 cartas vinieron en una tabla o lista UL, convertirlas en tarjetas individuales (.b6-vector-card)
  root.querySelectorAll('table').forEach(tbl => {
    const th = tbl.querySelector('th');
    if (th && th.textContent.toUpperCase().includes('VECTOR')) {
      const frag = document.createDocumentFragment();
      tbl.querySelectorAll('tbody tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 2) {
          const card = document.createElement('div');
          card.className = 'b6-vector-card';
          const head = document.createElement('div');
          head.className = 'b6-vector-card-title';
          head.textContent = tds[0].textContent.replace(/\[C\d+\]/gi, '').replace(/[*_]/g, '').trim().toUpperCase();
          const body = document.createElement('div');
          body.className = 'b6-vector-card-body';
          body.innerHTML = tds[1].innerHTML;
          card.appendChild(head);
          card.appendChild(body);
          frag.appendChild(card);
        }
      });
      tbl.replaceWith(frag);
    }
  });

  root.querySelectorAll('ul').forEach(ul => {
    const lis = Array.from(ul.querySelectorAll('li'));
    if (lis.length > 0 && lis.every(li => /(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA)\s+CARTA-VECTOR/i.test(li.textContent))) {
      const frag = document.createDocumentFragment();
      lis.forEach(li => {
        const txt = li.textContent.trim();
        const colonIdx = txt.indexOf(':');
        const secondColon = colonIdx !== -1 ? txt.indexOf(':', colonIdx + 1) : -1;
        const splitIdx = secondColon !== -1 ? secondColon : colonIdx;
        const card = document.createElement('div');
        card.className = 'b6-vector-card';
        const head = document.createElement('div');
        head.className = 'b6-vector-card-title';
        const body = document.createElement('div');
        body.className = 'b6-vector-card-body';
        if (splitIdx !== -1) {
          head.textContent = txt.slice(0, splitIdx).replace(/[*_]/g, '').trim().toUpperCase();
          body.textContent = txt.slice(splitIdx + 1).trim();
        } else {
          head.textContent = txt.toUpperCase();
        }
        card.appendChild(head);
        card.appendChild(body);
        frag.appendChild(card);
      });
      ul.replaceWith(frag);
    }
  });

  // 3. Estilizar la pregunta del consultante (justo debajo de 1.- PREGUNTA DEL CONSULTANTE) en caja Azul Marino (#0B192C) con borde dorado
  const sec1 = Array.from(root.querySelectorAll('.b6-section-title')).find(h => /^1\.\s*-/.test(h.textContent));
  if (sec1 && sec1.nextElementSibling && !sec1.nextElementSibling.classList.contains('b6-section-title')) {
    const qEl = sec1.nextElementSibling;
    const qBox = document.createElement('div');
    qBox.className = 'b6-question-box';
    qBox.textContent = qEl.textContent.replace(/^[*_]+|[*_]+$/g, '').trim().toUpperCase();
    qEl.replaceWith(qBox);
  }

  // 4. Asegurar en Sección 4 que la caja de conclusión probabilística quede antes del CTA si ambos existen
  const quoteBoxes = Array.from(root.querySelectorAll('.b6-gold-quote'));
  const projBox = root.querySelector('.b6-projection-conclusion');
  if (projBox && quoteBoxes.length > 0) {
    const firstQuote = quoteBoxes[0];
    if (firstQuote.compareDocumentPosition(projBox) & Node.DOCUMENT_POSITION_FOLLOWING) {
      root.insertBefore(projBox, firstQuote);
    }
  }

  // 5. Estructurar Bloque Final (Comparativa de Planes con exclusivamente el icono ✅)
  const allAfter = Array.from(root.children);
  const closeIdx = allAfter.findIndex(el => {
    const u = el.textContent.toUpperCase();
    return u.includes('SI EL ALGORITMO HA AJUSTADO ESA PROYECCIÓN') || u.includes('SI EL ALGORITMO HA AJUSTADO ESA PROYECCION');
  });

  if (closeIdx !== -1) {
    const toRemove = allAfter.slice(closeIdx);
    const anchor = toRemove[0];

    const finalBlock = document.createElement('div');
    finalBlock.className = 'b6-final-wrapper';
    finalBlock.innerHTML = `
      <div class="b6-cta-header">
        <div class="b6-cta-title">SI EL ALGORITMO HA AJUSTADO ESA PROYECCIÓN DE FUTURO DE ALTÍSIMA PROBABILIDAD, QUE ALGUNOS LLAMARÁN DESTINO... IMAGINA LO QUE LOGRARÁS CON EL SISTEMA COMPLETO.</div>
        <div class="b6-cta-sub">Si esto es lo que el algoritmo puede decodificar con una sola proyección, el límite lo pones tú.</div>
        <div class="b6-cta-sub">Por una inversión menor a un menú mensual, accede a la HOJA DE RUTA TOTAL del MÉTODO BÉNTURI:</div>
      </div>
      <table class="b6-plans-table">
        <thead>
          <tr>
            <th>BÉNTURI DESPEGUE</th>
            <th>BÉNTURI PREMIUM</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="b6-plan-item">✅ 12 PROYECCIONES DE ALTA PROBABILIDAD DE FUTURO MENSUALES.</div>
              <div class="b6-plan-item">✅ 1 PROYECCION PROFUNDA DE 24 CARTAS MENSUAL</div>
              <div class="b6-plan-item">✅ EVALUACIÓN DE TU ESTADO EN LA PIRÁMIDE DEL AMOR ,PARA SU ASCENSO Y VIBRAR EN LA ENERGIA ADECUADA,PARA TU ÉXITO</div>
            </td>
            <td>
              <div class="b6-plan-item">✅ ILIMITADAS PROYECCIONES DE ALTA PROBABILIDAD DE FUTURO</div>
              <div class="b6-plan-item">✅ SON PERFECTAS PARA TRIANGULAR TIRADAS VECTORES -CARTAS</div>
              <div class="b6-plan-item">✅ 1 PROYECCION PROFUNDA DE 24 CARTAS MENSUAL</div>
              <div class="b6-plan-item">✅ EVALUACIÓN DE TU ESTADO EN LA PIRÁMIDE DEL AMOR ,PARA SU ASCENSO Y VIBRAR EN LA ENERGIA ADECUADA,PARA TU ÉXITO</div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="b6-luck-banner">
        ¡Mucha suerte! Aunque probablemente, con el Método Bénturi y por lo que cuesta un café a la semana... ¡ya no la necesites!
      </div>
    `;
    root.insertBefore(finalBlock, anchor);
    toRemove.forEach(n => n.remove());
  }

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${filename || 'Informe Oficial de Proyección · 6 Vectores-Cartas'}</title>
      <style>
        @page {
          size: A4 vertical;
          margin: 16mm 15mm 16mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #FFFFFF;
          color: #1F2937;
          font-size: 10.2pt;
          line-height: 1.55;
          margin: 0;
          padding: 0;
        }
        p {
          margin: 0 0 10px 0;
          color: #1F2937;
          text-align: justify;
        }
        strong, b {
          color: #0B192C;
          font-weight: 700;
        }
        em strong, strong em, b i, i b {
          color: #0B192C;
          font-weight: 700;
          font-style: italic;
        }

        /* 1. CABECERA SUPERIOR CORPORATIVA */
        .b6-corporate-top {
          background-color: #FFFFFF;
          text-align: center;
          padding: 6px 0 12px 0;
        }
        .b6-logo-mark {
          font-family: Georgia, 'Playfair Display', serif;
          font-size: 20pt;
          font-weight: 700;
          color: #0B192C;
          letter-spacing: 0.5px;
        }
        .b6-logo-mark span {
          color: #C5A059;
          margin-right: 6px;
        }
        .b6-header-band {
          background-color: #0B192C;
          border-bottom: 4px double #C5A059;
          padding: 12px 18px;
          text-align: center;
          margin-bottom: 14px;
        }
        .b6-header-band-title {
          font-family: Georgia, 'Playfair Display', serif;
          font-size: 11.5pt;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        .b6-header-band-title span {
          color: #C5A059;
        }

        /* AVISO LEGAL */
        .b6-notice-box {
          background-color: #FBF8F1;
          border: 1px solid #E5DEC9;
          border-left: 4px solid #C5A059;
          padding: 12px 16px;
          margin-bottom: 18px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .b6-notice-title {
          font-family: Georgia, 'Playfair Display', serif;
          font-size: 9.8pt;
          font-weight: 700;
          color: #0B192C;
          text-transform: uppercase;
          margin-bottom: 6px;
          letter-spacing: 0.4px;
        }
        .b6-notice-p {
          font-size: 8.6pt;
          color: #4B5563;
          line-height: 1.42;
          margin-bottom: 6px;
          text-align: justify;
        }
        .b6-notice-list {
          margin: 0;
          padding-left: 16px;
        }
        .b6-notice-list li {
          font-size: 8.6pt;
          color: #4B5563;
          line-height: 1.42;
          margin-bottom: 4px;
          text-align: justify;
        }
        .b6-notice-list li strong {
          color: #0B192C;
        }

        /* TITULARES DE SECCIÓN (1.- a 6.-) */
        .b6-section-title {
          font-family: Georgia, 'Playfair Display', serif;
          font-size: 11.8pt;
          font-weight: 700;
          color: #0B192C;
          text-transform: uppercase;
          border-bottom: 2px solid #C5A059;
          padding-bottom: 5px;
          margin: 20px 0 12px 0;
          letter-spacing: 0.3px;
          page-break-after: avoid;
        }

        /* 2. SECCIÓN 1 · CAJA DE PREGUNTA DEL CONSULTANTE */
        .b6-question-box {
          background-color: #0B192C;
          border: 1.5px solid #C5A059;
          border-radius: 6px;
          padding: 14px 20px;
          margin: 10px 0 18px 0;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 11pt;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* 3. SECCIÓN 2 · TARJETAS INDIVIDUALES DE CADA VECTOR-CARTA (1 A 6) */
        .b6-vector-card {
          background-color: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-left: 4px solid #C5A059;
          border-radius: 4px;
          padding: 12px 16px;
          margin-bottom: 12px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .b6-vector-card-title {
          font-family: Georgia, 'Playfair Display', serif;
          font-size: 10pt;
          font-weight: 700;
          color: #0B192C;
          text-transform: uppercase;
          margin-bottom: 6px;
          letter-spacing: 0.2px;
        }
        .b6-vector-card-body {
          font-size: 9.8pt;
          color: #1F2937;
          line-height: 1.52;
          text-align: justify;
        }

        /* 5. SECCIÓN 4 · PROYECCIÓN DE ALTA PROBABILIDAD Y CITA */
        .b6-projection-conclusion {
          background-color: #FBF8F1;
          border: 3px double #C5A059;
          box-shadow: 0 2px 6px rgba(11, 25, 44, 0.06);
          padding: 14px 18px;
          margin: 14px 0;
          color: #0B192C;
          font-weight: 700;
          font-style: italic;
          font-size: 10.2pt;
          line-height: 1.52;
          text-align: justify;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .b6-gold-quote, blockquote {
          background-color: #FBF8F1;
          border-top: 1.5px solid #C5A059;
          border-bottom: 1.5px solid #C5A059;
          border-left: none;
          border-right: none;
          padding: 12px 18px;
          margin: 14px 0;
          color: #0B192C;
          font-style: italic;
          font-weight: 600;
          font-size: 9.8pt;
          line-height: 1.5;
          text-align: center;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* 6. SECCIONES 5 Y 6 · BLOQUES ESTRUCTURADOS */
        .b6-structured-block {
          background-color: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-left: 3px solid #C5A059;
          padding: 11px 15px;
          margin: 10px 0;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .b6-structured-title {
          font-family: Georgia, 'Playfair Display', serif;
          font-size: 9.8pt;
          font-weight: 700;
          color: #0B192C;
          border-bottom: 1px solid #C5A059;
          padding-bottom: 4px;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        .b6-structured-body {
          font-size: 9.6pt;
          color: #1F2937;
          line-height: 1.5;
          text-align: justify;
        }

        /* 7. BLOQUE FINAL · COMPARATIVA DE PLANES */
        .b6-final-wrapper {
          margin-top: 22px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .b6-cta-header {
          background-color: #0B192C;
          border-top: 2px solid #C5A059;
          border-bottom: 2px solid #C5A059;
          color: #FFFFFF;
          padding: 14px 18px;
          margin-bottom: 14px;
          text-align: center;
        }
        .b6-cta-title {
          font-family: Georgia, 'Playfair Display', serif;
          font-size: 10pt;
          font-weight: 700;
          color: #C5A059;
          margin-bottom: 6px;
          line-height: 1.45;
        }
        .b6-cta-sub {
          font-size: 9.2pt;
          color: #FFFFFF;
          margin-bottom: 4px;
        }
        .b6-plans-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 14px;
          table-layout: fixed;
        }
        .b6-plans-table th {
          width: 50%;
          background-color: #0B192C;
          color: #C5A059;
          font-family: Georgia, 'Playfair Display', serif;
          font-size: 10.2pt;
          font-weight: 700;
          text-align: center;
          padding: 10px 14px;
          border: 1px solid #0B192C;
          border-bottom: 2px solid #C5A059;
          text-transform: uppercase;
        }
        .b6-plans-table td {
          width: 50%;
          vertical-align: top;
          background-color: #FFFFFF;
          border: 1px solid #D1D5DB;
          padding: 12px 14px;
        }
        .b6-plan-item {
          font-size: 9pt;
          color: #1F2937;
          line-height: 1.45;
          margin-bottom: 8px;
        }
        .b6-plan-item:last-child {
          margin-bottom: 0;
        }
        .b6-luck-banner {
          background-color: #FBF8F1;
          border: 1px solid #C5A059;
          padding: 12px 16px;
          text-align: center;
          font-family: Georgia, 'Playfair Display', serif;
          font-size: 9.8pt;
          font-weight: 700;
          color: #0B192C;
        }
        .b6-footer {
          margin-top: 18px;
          padding-top: 8px;
          border-top: 1px solid #E5E7EB;
          text-align: center;
          font-size: 8.2pt;
          color: #4B5563;
        }
      </style>
    </head>
    <body>
      <div class="b6-corporate-top">
        <div class="b6-logo-mark"><span>MB</span>MétodoBénturi</div>
      </div>
      <div class="b6-header-band">
        <div class="b6-header-band-title">INFORME OFICIAL DE PROYECCIÓN DE ALTA PROBABILIDAD <span>· 6 VECTORES-CARTAS</span></div>
      </div>
      ${noticeHtml}
      ${root.innerHTML}
      <div class="b6-footer">Método Bénturi · Informe Oficial de Proyección</div>
    </body>
    </html>
  `;
}

/**
 * Convierte el Markdown retornado por el LLM y utiliza el diálogo de impresión
 * nativo del dispositivo para generar el PDF con el diseño oficial de
 * "Informe de Proyección Determinista - Método Bénturi".
 * @param {string} markdownText - Respuesta en Markdown generada por el cerebro (LLM)
 * @param {string} filename - Nombre opcional
 */
export async function generarPDFDesdeMarkdown(markdownText, filename = null) {
  console.log("Abriendo diálogo nativo para generar PDF determinista...");

  const upperRaw = String(markdownText || '').toUpperCase();
  const is24Report =
    upperRaw.includes('24 VECTORES') ||
    upperRaw.includes('322 BILLONES') ||
    upperRaw.includes('CRÓNICA EVOLUTIVA') ||
    upperRaw.includes('FILA 1:');

  // Si es el informe de 6 cartas, usar su maquetación editorial específica sin tocar el de 24
  if (!is24Report) {
    const html6 = build6CardFullHTML(markdownText, filename);
    const iframe6 = document.createElement('iframe');
    iframe6.style.position = 'fixed';
    iframe6.style.right = '100%';
    iframe6.style.bottom = '100%';
    iframe6.style.width = '100vw';
    iframe6.style.height = '100vh';
    iframe6.style.border = 'none';
    iframe6.style.opacity = '0';
    document.body.appendChild(iframe6);

    const doc6 = iframe6.contentWindow.document;
    doc6.open();
    doc6.write(html6);
    doc6.close();

    iframe6.onload = () => {
      setTimeout(() => {
        try {
          iframe6.contentWindow.focus();
          iframe6.contentWindow.print();
        } catch (e) {
          console.error("Error al intentar abrir el diálogo de impresión:", e);
          alert("Tu dispositivo ha bloqueado la generación del PDF. Intenta hacerlo manualmente.");
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe6)) {
              document.body.removeChild(iframe6);
            }
          }, 30000);
        }
      }, 250);
    };
    return;
  }

  marked.setOptions({
    breaks: true,
    gfm: true
  });

  const cleanMarkdown = preprocessMarkdown(markdownText);
  const rawHtml = marked.parse(cleanMarkdown);

  // Procesar el HTML en un contenedor temporal para aplicar la estructura editorial exacta
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = rawHtml;
  enhanceReportDOM(tempContainer);
  const structuredHtml = tempContainer.innerHTML;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${filename || 'Informe de Proyección Determinista - Método Bénturi'}</title>
      <style>
        @page {
          size: A4;
          margin: 16mm 16mm 18mm 16mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #ffffff;
          color: #1e293b;
          font-size: 10.5pt;
          line-height: 1.52;
          padding: 0;
          margin: 0;
        }
        p {
          margin: 0 0 10px 0;
          color: #1e293b;
        }
        strong, b {
          color: #0f172a;
          font-weight: 700;
        }
        em strong, strong em {
          color: #0f172a;
          font-weight: 700;
          font-style: italic;
        }

        /* 1. CAJA SUPERIOR: NOTA MUY IMPORTANTE DEL SISTEMA */
        .system-notice-box {
          background-color: #fffbeb;
          border: 1px solid #fde68a;
          border-left: 4px solid #d97706;
          padding: 14px 18px;
          margin-bottom: 18px;
          page-break-inside: avoid;
        }
        .system-notice-title {
          color: #b45309;
          font-weight: 800;
          font-size: 10.5pt;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 8px;
        }
        .system-notice-list {
          margin: 0;
          padding-left: 18px;
          list-style-type: disc;
        }
        .system-notice-list li {
          font-size: 9.2pt;
          line-height: 1.45;
          color: #1e293b;
          margin-bottom: 6px;
        }
        .system-notice-list li:last-child {
          margin-bottom: 0;
        }
        .system-notice-list li strong {
          color: #0f172a;
        }

        /* 2. BANNER HERO: DECODIFICACIÓN PROYECCIÓN MÉTODO BÉNTURI */
        .hero-banner {
          background-color: #0f172a;
          border-top: 3px solid #d97706;
          border-bottom: 3px solid #d97706;
          padding: 16px 20px;
          margin-bottom: 20px;
          color: #ffffff;
          page-break-inside: avoid;
        }
        .hero-banner-title {
          font-size: 14.5pt;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.4px;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .hero-banner-steps {
          margin-bottom: 10px;
        }
        .hero-step-line {
          font-size: 9.5pt;
          color: #e2e8f0;
          line-height: 1.5;
        }
        .hero-banner-divider {
          border-top: 1px solid #334155;
          margin: 10px 0;
        }
        .hero-banner-footer {
          font-size: 9.8pt;
          font-weight: 800;
          color: #f59e0b;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        /* 3. TITULARES DE SECCIÓN PRINCIPALES (2.- a 7.-) */
        .section-heading {
          font-size: 12pt;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border-top: 1.5px solid #1e293b;
          border-bottom: 1.5px solid #b45309;
          padding: 6px 0;
          margin: 20px 0 12px 0;
          page-break-after: avoid;
        }

        /* 4. SUBTÍTULOS DE FILA Y TABLA DE VECTORES-CARTA */
        .fila-banner {
          background-color: #f1f5f9;
          border-top: 1px solid #334155;
          border-bottom: 1px solid #334155;
          border-left: 4px solid #b45309;
          padding: 6px 12px;
          font-size: 10pt;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          margin: 16px 0 10px 0;
          page-break-after: avoid;
        }
        .vector-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 9.5pt;
        }
        .vector-table thead tr {
          background-color: #0f172a;
          color: #ffffff;
        }
        .vector-table th {
          text-align: left;
          padding: 8px 12px;
          font-size: 9pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border: 1px solid #0f172a;
        }
        .vector-table th:first-child {
          width: 24%;
        }
        .vector-table tbody tr:nth-child(odd) {
          background-color: #ffffff;
        }
        .vector-table tbody tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .vector-table td {
          padding: 9px 12px;
          border: 1px solid #cbd5e1;
          vertical-align: top;
          text-align: left;
          line-height: 1.48;
        }
        .vector-cell-name {
          font-weight: 700;
          white-space: normal;
        }
        .vec-code {
          color: #0f172a;
          font-weight: 800;
        }
        .vec-card {
          color: #b45309;
          font-weight: 700;
        }
        .vector-cell-desc {
          color: #1e293b;
        }

        /* 5. SECCIÓN 3: CAPÍTULOS CON BARRA LATERAL ÁMBAR */
        .chapter-block {
          border-left: 3px solid #d97706;
          padding-left: 14px;
          margin: 14px 0 18px 0;
          page-break-inside: avoid;
        }
        .chapter-heading {
          font-size: 10.2pt;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 4px;
          margin: 0 0 8px 0;
        }

        /* 6. SECCIÓN 4: TARJETAS DE LAS 5 FACETAS Y BANNER CONSOLIDADO */
        .facet-card {
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 11px 15px;
          margin-bottom: 11px;
          page-break-inside: avoid;
        }
        .facet-card-title {
          font-size: 9.8pt;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .facet-card-body {
          font-size: 9.6pt;
          color: #1e293b;
          margin: 0;
          line-height: 1.48;
        }
        .consolidated-banner {
          background-color: #0f172a;
          border-left: 4px solid #d97706;
          color: #ffffff;
          padding: 13px 16px;
          margin: 14px 0 18px 0;
          font-size: 9.8pt;
          font-weight: 700;
          font-style: italic;
          line-height: 1.5;
          page-break-inside: avoid;
        }

        /* 7. SECCIONES 5 Y 6: TARJETAS DE LOS TRES PODERES Y CITA DORADA */
        .power-card {
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 13px 16px;
          margin-bottom: 14px;
          page-break-inside: avoid;
        }
        .power-card-title {
          font-size: 10pt;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          border-bottom: 1.5px solid #b45309;
          padding-bottom: 4px;
          margin-bottom: 8px;
        }
        .power-card p, .power-card li {
          font-size: 9.6pt;
          color: #1e293b;
          line-height: 1.5;
        }
        .power-card ol, .power-card ul {
          margin: 6px 0 0 0;
          padding-left: 20px;
        }
        .power-card li {
          margin-bottom: 6px;
        }
        .gold-quote-box {
          background-color: #fffbeb;
          border: 1px solid #d97706;
          border-left: 4px solid #b45309;
          padding: 12px 16px;
          margin: 14px 0 18px 0;
          font-size: 9.8pt;
          font-weight: 700;
          font-style: italic;
          color: #0f172a;
          line-height: 1.48;
          page-break-inside: avoid;
        }

        /* 8. SECCIÓN 7: BLOQUE FINAL DE CONTINUIDAD Y TABLA COMPARATIVA */
        .closing-cta-banner {
          background-color: #0f172a;
          border-top: 2px solid #b45309;
          border-bottom: 2px solid #b45309;
          color: #ffffff;
          padding: 14px 18px;
          margin-bottom: 14px;
          page-break-inside: avoid;
        }
        .closing-cta-strong {
          font-size: 9.8pt;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 6px;
          line-height: 1.45;
        }
        .closing-cta-normal {
          font-size: 9.5pt;
          color: #e2e8f0;
          margin-bottom: 6px;
        }
        .closing-cta-normal:last-child {
          margin-bottom: 0;
        }
        .plans-comparison-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          page-break-inside: avoid;
        }
        .plans-comparison-table thead tr {
          background-color: #0f172a;
        }
        .plans-comparison-table th {
          width: 50%;
          text-align: left;
          padding: 9px 14px;
          font-size: 10pt;
          font-weight: 800;
          color: #f59e0b;
          text-transform: uppercase;
          border: 1px solid #0f172a;
        }
        .plans-comparison-table td {
          width: 50%;
          vertical-align: top;
          text-align: left;
          padding: 12px 14px;
          border: 1px solid #cbd5e1;
          background-color: #ffffff;
        }
        .plan-feature {
          font-size: 9.2pt;
          color: #1e293b;
          line-height: 1.45;
          margin-bottom: 8px;
        }
        .plan-feature:last-child {
          margin-bottom: 0;
        }
        .plan-check {
          display: inline-block;
          background-color: #16a34a;
          color: #ffffff;
          font-weight: 800;
          font-size: 8pt;
          width: 14px;
          height: 14px;
          line-height: 14px;
          text-align: center;
          border-radius: 3px;
          margin-right: 4px;
        }
        .final-luck-box {
          background-color: #fffbeb;
          border: 1px solid #fde68a;
          padding: 12px 16px;
          text-align: center;
          font-size: 9.8pt;
          font-weight: 800;
          color: #0f172a;
          margin-top: 12px;
          page-break-inside: avoid;
        }

        blockquote {
          background-color: #fffbeb;
          border: 1px solid #d97706;
          border-left: 4px solid #b45309;
          padding: 12px 16px;
          margin: 14px 0;
          font-style: italic;
          color: #0f172a;
        }
      </style>
    </head>
    <body>
      ${structuredHtml}
    </body>
    </html>
  `;

  // Crear un iframe oculto para invocar el sistema de impresión sin salir de la app
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '100%';
  iframe.style.bottom = '100%';
  iframe.style.width = '100vw';
  iframe.style.height = '100vh';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error("Error al intentar abrir el diálogo de impresión:", e);
        alert("Tu dispositivo ha bloqueado la generación del PDF. Intenta hacerlo manualmente.");
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 30000);
      }
    }, 250);
  };
}
