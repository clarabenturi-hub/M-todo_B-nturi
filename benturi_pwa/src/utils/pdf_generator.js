// Módulo de generación de PDF para PWA Matriz de Vectores
// Requiere marked.js importado en tu proyecto (html2pdf ya no es necesario)

/**
 * Convierte el Markdown retornado por el LLM y utiliza el diálogo de impresión
 * nativo del dispositivo para generar el PDF. (Evita cuelgues en móviles)
 * @param {string} markdownText - Respuesta en Markdown generada por el cerebro (LLM)
 * @param {string} filename - Nombre opcional
 */
export async function generarPDFDesdeMarkdown(markdownText, filename = null) {
  if (typeof window.marked === 'undefined') {
    console.error('La librería marked.js no está cargada en window.');
    alert('Error: marked.js no cargado');
    return;
  }

  console.log("Abriendo diálogo nativo para generar PDF...");
  
  // 1. Convertir Markdown a HTML
  const rawHtml = window.marked.parse(markdownText || 'No hay contenido para mostrar');

  // 2. Construir el documento HTML completo para impresión
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${filename || 'Lectura_Benturi'}</title>
      <style>
        /* Estilos optimizados para impresión (PDF) */
        @page { margin: 20mm; }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #ffffff;
          color: #000000;
          font-size: 14px;
          line-height: 1.6;
          padding: 0;
          margin: 0;
        }
        h1, h2, h3, h4, h5, u { 
          color: #000000; 
          margin-top: 20px; 
          margin-bottom: 10px; 
          font-weight: bold; 
        }
        h1 { font-size: 22px; border-bottom: 2px solid #000; padding-bottom: 5px; }
        h2 { font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
        p { margin-bottom: 15px; }
        strong { font-weight: bold; }
        ul { list-style-type: disc; padding-left: 20px; margin-bottom: 15px; }
        li { margin-bottom: 5px; }
        /* Forzar colores en navegadores webkit al imprimir */
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      ${rawHtml}
    </body>
    </html>
  `;

  // 3. Crear un iframe oculto para invocar el sistema de impresión sin salir de la app
  const iframe = document.createElement('iframe');
  
  // Lo ocultamos de la vista del usuario de forma segura para impresión móvil
  iframe.style.position = 'fixed';
  iframe.style.right = '100%';
  iframe.style.bottom = '100%';
  iframe.style.width = '100vw';
  iframe.style.height = '100vh';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  
  document.body.appendChild(iframe);

  // Escribimos el contenido HTML en el iframe
  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // 4. Invocamos window.print() nativo cuando el contenido termine de cargar
  iframe.onload = () => {
    // Un pequeño tiempo para asegurar que el navegador pinta el DOM del iframe
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error("Error al intentar abrir el diálogo de impresión:", e);
        alert("Tu dispositivo ha bloqueado la generación del PDF. Intenta hacerlo manualmente.");
      } finally {
        // Limpiamos el iframe del DOM después de unos segundos
        // Damos margen suficiente para que el diálogo de impresión termine
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 30000); 
      }
    }, 250);
  };
}
