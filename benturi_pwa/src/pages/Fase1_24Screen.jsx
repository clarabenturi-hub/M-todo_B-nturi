import { useState, useRef, useEffect } from 'react'
import { useTexts } from '../hooks/useTexts'
import { useCombinations } from '../hooks/useCombinations'
import Dialog from '../components/Dialog'
import CardSelectorModal from '../components/CardSelectorModal'
import { FULL_DECK } from '../constants/appData'
import { generarPDFDesdeMarkdown } from '../utils/pdf_generator.js'
import { generateDeterministicReport } from '../utils/brain_engine.js'

export default function Fase1_24Screen({ user, token, onLoginClick }) {
  const { t, tList } = useTexts()
  const getMeaning = useCombinations()
  const [loading, setLoading] = useState(false)

  const [question, setQuestion] = useState('')
  const [timeLock, setTimeLock] = useState('En las próximas 78 horas')
  const [selectedCards, setSelectedCards] = useState(Array(24).fill(null))
  const [cardModalIndex, setCardModalIndex] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [codeStream, setCodeStream] = useState('')
  const [result, setResult] = useState(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [showProcedimientoDialog, setShowProcedimientoDialog] = useState(false)
  
  // Streaming states
  const [streamedReport, setStreamedReport] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamError, setStreamError] = useState(false)

  const streamTimer = useRef(null)

  const timeLockOptions = tList('fase1','opciones_candado',['En las próximas 78 horas'])
  const timeLockList = timeLockOptions.length > 0 ? timeLockOptions : ['En las próximas 78 horas']
  const alreadySelected = selectedCards.filter(Boolean)

  const handleSelectCard = (card) => {
    const next = [...selectedCards]
    next[cardModalIndex] = card
    setSelectedCards(next)
    setCardModalIndex(null)
  }

  const startStreamingReport = async (resData) => {
    setIsStreaming(true);
    setStreamedReport('');
    setStreamError(false);
    try {
      const resp = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, result: resData })
      });
      if (!resp.ok) throw new Error('Error en la API');
      
      const reader = resp.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let fullText = '';
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
              try {
                const data = JSON.parse(line.substring(6));
                fullText += data.text;
                setStreamedReport(fullText);
              } catch(e) {}
            }
          }
        }
      }
    } catch(err) {
      setStreamError(true);
      console.error(err);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      if (streamedReport) {
        await generarPDFDesdeMarkdown(streamedReport, "Informe_Cuantico_Benturi.pdf");
      } else {
        alert("El informe aún no se ha generado correctamente.");
      }
    } catch(err) {
      alert("Hubo un error al generar el PDF.");
      console.error(err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleProject = () => {
    if (!question.trim()) {
      alert(t('fase1','alerta_variable_vacia','El Algoritmo requiere una Variable de Consulta válida.'))
      return
    }

    const filled = [...selectedCards]
    const remaining = FULL_DECK.filter(c => !filled.some(s => s?.id === c.id))
    const shuffled = remaining.sort(() => Math.random() - 0.5)
    let ri = 0
    for (let i = 0; i < 24; i++) {
      if (!filled[i]) filled[i] = shuffled[ri++]
    }
    setSelectedCards(filled)

    setIsProcessing(true)
    setCodeStream('')

    const HEX = '0123456789ABCDEF'
    streamTimer.current = setInterval(() => {
      let s = ''
      for (let i = 0; i < 150; i++) s += HEX[Math.floor(Math.random() * 16)]
      setCodeStream(s)
    }, 30)

    setTimeout(() => {
      clearInterval(streamTimer.current)
      setCodeStream('DECODIFICACIÓN PROFUNDA DE 24 VECTORES ESTABLECIDA.\n\nCOLAPSO DE ONDA FINALIZADO.')

      setTimeout(() => {
        setIsProcessing(false)
        const c1 = filled[0].spanishName, c2 = filled[1].spanishName
        const c7 = filled[6].spanishName, c8 = filled[7].spanishName
        const c13 = filled[12].spanishName, c14 = filled[13].spanishName
        const c19 = filled[18].spanishName, c20 = filled[19].spanishName

        const newResult = {
          question,
          timeLock,
          cards: filled,
          c1, c2, c7, c8, c13, c14, c19, c20,
          q1: getMeaning(c1, c2),
          q2: getMeaning(c7, c8),
          q3: getMeaning(c13, c14),
          q4: getMeaning(c19, c20),
        };
        setResult(newResult);
        startStreamingReport(newResult);
      }, 800)
    }, 3000)
  }

  useEffect(() => () => clearInterval(streamTimer.current), [])

  const handleSubscribe = async () => {
    if (!user) {
      onLoginClick()
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch(`/api/create-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await res.json()
      if (data.url && data.params) {
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = data.url
        
        Object.keys(data.params).forEach(key => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = data.params[key]
          form.appendChild(input)
        })
        
        document.body.appendChild(form)
        form.submit()
      } else {
        alert('Error al generar el pago en el servidor.')
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      alert('Error de conexión con el servidor')
      setLoading(false)
    }
  }

  if (user?.isPremium) {
    return (
       <div className="page stack">
         <div className="glass-card-light" style={{textAlign:'center'}}>
           <h1 style={{fontSize: '24px', lineHeight: '1.3'}}>Proyección de futuro Alta Probabilidad Avanzada (24 Vectores-Cartas)</h1>
           <div className="subtitle mt-8" style={{fontSize: '13px', lineHeight: '1.4', opacity: 0.9, textTransform: 'none'}}>El Algoritmo Decodifica entre 32,2 billones opciones distintas.</div>
           
           <div className="mt-16 mb-8">
             <iframe 
               style={{width: '100%', aspectRatio: '9/16', borderRadius: '12px', border: '1.5px solid rgba(127,179,213,0.4)', background: 'black'}} 
               src="https://www.youtube.com/embed/nH_2f9PBDv0?rel=0&modestbranding=1&controls=0&vq=hd1080&iv_load_policy=3" 
               title="Vídeo 24 Cartas" 
               frameBorder="0" 
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
               allowFullScreen>
             </iframe>
           </div>
         </div>

         <div className="glass-card">
           <h2>{t('fase1','titulo_parametros','ESTABLECER PARÁMETROS')}</h2>
           <div className="params-row mt-24">
             <div>
               <label className="field-label" style={{ fontSize: '1rem', fontWeight: '400', lineHeight: '1.6', display: 'block', marginBottom: '12px' }}>{t('fase1','label_variable','Variable de Consulta:')}</label>
               <input type="text" value={question} onChange={e => setQuestion(e.target.value)} placeholder={t('fase1','placeholder_variable','Ej: ¿Conseguiré el nuevo trabajo...')} />
             </div>
             <div>
               <label className="field-label">{t('fase1','label_candado','Candado Temporal:')}</label>
               <select value={timeLock} onChange={e => setTimeLock(e.target.value)}>
                 {timeLockList.map(opt => <option key={opt} value={opt}>{opt}</option>)}
               </select>
             </div>
           </div>
         </div>

         <div>
           <div className="shuffle-header">
             <div>
               <h2>Matriz Vectores probabilísticos (24 Cartas)</h2>
               <button
                 className="btn-outline mt-8"
                 style={{fontSize:'12px', padding:'4px 12px'}}
                 onClick={() => setShowProcedimientoDialog(true)}
               >
                 ℹ️ Procedimiento
               </button>
             </div>
           </div>

           <div className="card-grid-24 mt-16">
             {selectedCards.map((card, idx) => (
               <div key={idx} className={`card-slot${card ? ' filled' : ''}`} onClick={() => setCardModalIndex(idx)}>
                 {card ? <img src={card.img} alt={card.spanishName} /> : <div className="card-slot-label" style={{fontSize: '18px', fontWeight: '800', color: 'var(--blue-accent)', opacity: 0.8}}>{idx * 2 + 1}</div>}
               </div>
             ))}
           </div>
         </div>

         <button className="btn-primary" onClick={handleProject} disabled={!question.trim()}>PROTOCOLO EXPRESS DE CALIBRACIÓN: MATRIZ DE 24 VECTORES-CARTAS</button>

         {result && (
            <Dialog 
              title="INFORME CUÁNTICO EN TIEMPO REAL" 
              onClose={() => { setResult(null); setSelectedCards(Array(24).fill(null)); setQuestion(''); setStreamedReport(''); }}
              actions={
                <div className="stack" style={{width: '100%', gap: '8px'}}>
                  <button
                    className="btn-primary"
                    style={{width: '100%', margin: 0, background: isStreaming ? 'grey' : 'var(--magenta-primary)', color: 'white', border: 'none'}}
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf || isStreaming || streamError}
                  >
                    {isStreaming ? 'ESCRIBIENDO INFORME...' : (isGeneratingPdf ? 'GENERANDO PDF...' : 'DESCARGAR INFORME (PDF)')}
                  </button>
                  <button
                    className="btn-secondary"
                    style={{width: '100%', margin: 0, opacity: 0.8, fontSize: '11px'}}
                    onClick={() => { setResult(null); setSelectedCards(Array(24).fill(null)); setQuestion(''); setStreamedReport(''); }}
                  >
                    CERRAR Y HACER OTRA PREGUNTA
                  </button>
                </div>
              }
            >
              <div>
                 <p style={{fontStyle:'italic', marginBottom:'16px', opacity: 0.8}}>
                   Consulta analizada: <strong style={{color: 'var(--blue-accent)'}}>"{result.question}"</strong>
                 </p>
                 
                 <div className="glass-card-light custom-scroll-container" style={{padding: '16px', marginBottom: '16px', maxHeight: '50vh', overflowY: 'auto', overflowX: 'hidden', wordBreak: 'break-word', overflowWrap: 'anywhere', textAlign: 'left', whiteSpace: 'pre-wrap', color: '#FFFFFF', fontSize: '13px', lineHeight: '1.5', fontFamily: 'monospace'}}>
                   {streamError ? (
                     <span style={{color: '#ff6b6b'}}>Hubo un error de red generando el informe. Por favor, inténtalo de nuevo.</span>
                   ) : (
                      <>
                        {streamedReport ? (
                          <div dangerouslySetInnerHTML={{ __html: streamedReport }} style={{ display: 'inline' }} />
                        ) : (
                          'Conectando con la IA cuántica...'
                        )}
                        {isStreaming && <span className="cursor-blink" style={{marginLeft: '4px'}}>|</span>}
                      </>
                   )}
                 </div>
                 
                 {!isStreaming && !streamError && (
                   <p className="mt-16" style={{fontWeight:'700', color:'var(--blue-mid)'}}>
                     El informe ha sido completado con éxito. Ahora puedes descargarlo en formato PDF.
                   </p>
                 )}
                 {isStreaming && !streamError && (
                   <p className="mt-16" style={{fontWeight:'700', color:'var(--green-accent)'}}>
                     Generando respuesta cuántica en tiempo real...
                   </p>
                 )}
               </div>
             </Dialog>
         )}

         {cardModalIndex !== null && (
           <CardSelectorModal selectedCards={alreadySelected} onSelect={handleSelectCard} onClose={() => setCardModalIndex(null)} />
         )}

         {isProcessing && (
           <div className="processing-overlay">
             <div className="processing-title">ANALIZANDO BILLONES DE COMBINACIONES</div>
             <div className={`code-stream${codeStream.startsWith('DECOD') ? ' completed' : ''}`} style={{whiteSpace:'pre-line', fontSize: '10px'}}>{codeStream}</div>
           </div>
         )}

         {showProcedimientoDialog && (
           <Dialog title="PROCEDIMIENTO" onClose={() => setShowProcedimientoDialog(false)}>
             <div style={{textAlign: 'left', maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px'}}>
               <h3 style={{fontSize: '14px', color: 'var(--blue-accent)', marginBottom: '8px'}}>GUÍA RÁPIDA: PROCEDIMIENTO DE 24 VECTORES 📋</h3>
               <p style={{fontSize: '13px', marginBottom: '8px'}}><strong>✨ 1. PREPARACIÓN Y CÓDIGO DE ENTRADA 🕯️💧</strong></p>
               <p style={{fontSize: '12px', marginBottom: '8px'}}>Entra en un espacio tranquilo. Enciende una vela blanca y coloca un vaso de agua limpia.<br/>Baraja las cartas un mínimo de 7 veces mientras introduces mentalmente tu consulta (puede ser general o concreta).<br/>Recita en voz alta (o mentalmente) el mantra de calibración: "A las Guapas, las Guapas, qué bonitas que sois, decidme la verdad".<br/>Detén el barajado cuando lo sientas y corta el mazo con la mano izquierda.</p>
               
               <p style={{fontSize: '13px', marginBottom: '8px', marginTop: '16px'}}><strong>🃏 2. DESPLIEGUE EN LA MESA Y SELECCIÓN 🔄</strong></p>
               <p style={{fontSize: '12px', marginBottom: '8px'}}>Coloca las 24 cartas sobre la mesa siguiendo esta regla de descarte:<br/>La primera carta va a la mesa (esquina superior izquierda).<br/>La segunda carta se aparta a un montón de descarte (no se lee).<br/>Repite el proceso de forma sucesiva (una sí, una no) hasta completar la matriz de 24.<br/>Introduce los 24 vectores en el desplegable de la app. (Si no tienes suscripción, pasarás por el checkout exprés).</p>
               
               <p style={{fontSize: '13px', marginBottom: '8px', marginTop: '16px'}}><strong>📂 3. CALIBRACIÓN EN DOS PASOS (EL SECRETO) 🧠🎯</strong></p>
               <p style={{fontSize: '12px', marginBottom: '8px'}}>Paso A (Lectura Inicial): El algoritmo procesará las variables y te enviará un primer PDF que lee pasado, presente y futuro.<br/>Paso B (Ajuste Técnico): Como el algoritmo calcula pero no adivina tus vivencias, revisa el PDF e identifica dónde se sitúa tu pasado (por ejemplo, las dos filas inferiores).<br/>Paso C (Optimización 100%): Introduce esa indicación en el cuadro de texto para alimentar el sistema. El algoritmo reconfigurará la matriz para darte tu proyección multidimensional exacta.</p>
               
               <p style={{fontSize: '13px', marginBottom: '8px', marginTop: '16px'}}><strong>🧼 4. LIMPIEZA DE VECTORES 🔀</strong></p>
               <p style={{fontSize: '12px', marginBottom: '8px'}}>Al terminar, devuelve las 24 cartas al mazo de forma completamente aleatoria (cada una en un sitio diferente) para limpiar los códigos energéticos.</p>
             </div>
           </Dialog>
         )}
       </div>
    )
  }

  return (
    <div className="page stack">
      <div className="glass-card-light" style={{textAlign:'center'}}>
        <h1>24 CARTAS</h1>
        <div className="subtitle mt-8">ACCESO PREMIUM</div>
        <div className="mt-16">
          <iframe 
            style={{width: '100%', aspectRatio: '9/16', borderRadius: '12px', border: '1.5px solid rgba(127,179,213,0.4)', background: 'black'}} 
            src="https://www.youtube.com/embed/nH_2f9PBDv0?rel=0&modestbranding=1&controls=0&vq=hd1080&iv_load_policy=3" 
            title="Vídeo 24 Cartas" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen>
          </iframe>
        </div>
      </div>
      <div className="paywall-card">
        <div className="paywall-badge">{t('suscripcion','etiqueta_acceso','ACCESO ILIMITADO')}</div>
        <h2 style={{textAlign:'center'}}>{t('suscripcion','subtitulo','PASA DE LA INCERTIDUMBRE A LOS 3 PODERES')}</h2>
        <p className="mt-12" style={{textAlign:'center'}}>{t('suscripcion','desc','Pasa de la incertidumbre a los 3 poderes del Método Bénturi por bastante menos de lo que cuesta un menú al mes. Y sé el maestro de tu vida.')}</p>
        <div className="paywall-price mt-16">{t('suscripcion','precio','9,99 €')}</div>
        <div className="paywall-freq">{t('suscripcion','frecuencia','/ mes')}</div>
        <div className="stack mt-16">
          {[
            {icon:'🔮', tit:'beneficio_1_titulo', desc:'beneficio_1_desc', fb:'Conoce:', fbd:'Tirada de 24 cartas bajo demanda.'},
            {icon:'❤️', tit:'beneficio_2_titulo', desc:'beneficio_2_desc', fb:'Ama:', fbd:'Algoritmo para vibrar en la frecuencia del Amor.'},
            {icon:'⚡', tit:'beneficio_3_titulo', desc:'beneficio_3_desc', fb:'Decide:', fbd:'Decide dónde quieres estar en ese futuro entre tus probabilidades.'},
          ].map(b => (
            <div key={b.tit} className="paywall-benefit">
              <span className="paywall-benefit-icon">{b.icon}</span>
              <div>
                <div className="paywall-benefit-title">{t('suscripcion',b.tit,b.fb)}</div>
                <p>{t('suscripcion',b.desc,b.fbd)}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="btn-dark mt-24 glass-btn" id="btn-desbloquear-24" onClick={handleSubscribe} disabled={loading}>
          {loading ? 'CONECTANDO CON BANCO...' : t('suscripcion','btn_desbloquear','DESBLOQUEAR AHORA')}
        </button>
        <div className="paywall-legal">{t('suscripcion','texto_legal','Pago 100% seguro tramitado directamente por el TPV de tu banco (Redsys).')}</div>
      </div>
    </div>
  )
}
