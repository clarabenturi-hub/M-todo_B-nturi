import { useState, useRef, useEffect } from 'react'
import { useTexts } from '../hooks/useTexts'
import { useCombinations } from '../hooks/useCombinations'
import Dialog from '../components/Dialog'
import CardSelectorModal from '../components/CardSelectorModal'
import { FULL_DECK } from '../constants/appData'
import { generarPDFDesdeMarkdown } from '../utils/pdf_generator.js'
import { generateDeterministicReport } from '../utils/brain_engine.js'

export default function Fase1Screen() {
  const { t, tList } = useTexts()
  const getMeaning = useCombinations()

  const [question, setQuestion] = useState('')
  const [timeLock, setTimeLock] = useState('En las próximas 78 horas')
  const [selectedCards, setSelectedCards] = useState(Array(6).fill(null))
  const [cardModalIndex, setCardModalIndex] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [codeStream, setCodeStream] = useState('')
  const [result, setResult] = useState(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [showApuestasDialog, setShowApuestasDialog] = useState(false)
  const [showProcedimientoDialog, setShowProcedimientoDialog] = useState(false)
  
  // Streaming states
  const [streamedReport, setStreamedReport] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamError, setStreamError] = useState(false)

  const streamTimer = useRef(null)

  const timeLockOptions = tList('fase1','opciones_candado',['En las próximas 78 horas'])

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
    for (let i = 0; i < 6; i++) {
      if (!filled[i]) filled[i] = shuffled[ri++]
    }
    setSelectedCards(filled)

    setIsProcessing(true)
    setCodeStream('')

    const HEX = '0123456789ABCDEF'
    streamTimer.current = setInterval(() => {
      let s = ''
      for (let i = 0; i < 50; i++) s += HEX[Math.floor(Math.random() * 16)]
      setCodeStream(s)
    }, 50)

    setTimeout(() => {
      clearInterval(streamTimer.current)
      setCodeStream(t('fase1','estado_completado','PROYECCIÓN DE ALTA PROBABILIDAD ESTABLECIDA.\n\nCOLAPSO DE ONDA FINALIZADO.'))

      setTimeout(() => {
        setIsProcessing(false)

        const c1 = filled[0].spanishName, c2 = filled[1].spanishName
        const c3 = filled[2].spanishName, c4 = filled[3].spanishName
        const c5 = filled[4].spanishName, c6 = filled[5].spanishName

        const newResult = {
          question,
          timeLock,
          cards: filled,
          m1: getMeaning(c1, c2),
          m2: getMeaning(c3, c4),
          m3: getMeaning(c5, c6),
          c1, c2, c3, c4, c5, c6,
        };
        setResult(newResult);
        startStreamingReport(newResult);
      }, 600)
    }, 1500)
  }

  useEffect(() => () => clearInterval(streamTimer.current), [])

  const alreadySelected = selectedCards.filter(Boolean)
  const timeLockList = timeLockOptions.length > 0 ? timeLockOptions : ['En las próximas 78 horas']

  return (
    <div className="page stack">
      <div className="glass-card-light" style={{textAlign:'center'}}>
        <h1>{t('fase1','titulo_algoritmo','Algoritmo Bénturi Decodifica tu futuro')}</h1>
        <div className="subtitle mt-8">{t('fase1','subtitulo','AISLAMIENTO INDIVIDUAL')}</div>
        <div className="mt-16">
          <iframe 
            style={{width: '100%', aspectRatio: '9/16', borderRadius: '12px', border: '1.5px solid rgba(127,179,213,0.4)', background: 'black'}} 
            src="https://www.youtube.com/embed/bXrP8KxyivQ?rel=0&modestbranding=1&controls=0&vq=hd1080&iv_load_policy=3" 
            title="Vídeo Fase 1" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen>
          </iframe>
        </div>
      </div>

      <div className="glass-card">
        <h2>EL ALGORITMO BÉNTURI</h2>
        <p className="mt-12">{t('fase1','desc_algoritmo','Haz una pregunta concreta sobre algo que quieres conocer a muy corto plazo (Reunión, pareja, venta de inmueble, etc.)')}</p>
        <div className="mt-16" style={{textAlign:'center'}}>
          <button className="btn-outline" id="btn-apuestas-azar" onClick={() => setShowApuestasDialog(true)}>
            ⚡ {t('fase1','btn_apuestas','Apuestas y azar')}
          </button>
        </div>
      </div>

      <div className="info-box">
        <span className="info-icon">ℹ️</span>
        <p>{t('fase1','desc_escenario','Define con total precisión el escenario sobre el cual deseas proyectar tu futuro de alta probabilidad.')}</p>
      </div>

      <div className="glass-card">
        <h2>{t('fase1','titulo_parametros','ESTABLECER PARÁMETROS')}</h2>
        <div className="params-row mt-24">
          <div>
            <label className="field-label" style={{ fontSize: '14px', lineHeight: '1.6', fontWeight: '400', display: 'block', marginBottom: '8px' }}>
              {t('fase1','label_variable','Variable de Consulta (Actor + Acción):')}
            </label>
            <input
              id="input-variable-consulta"
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder={t('fase1','placeholder_variable','Ej: ¿Conseguiré el nuevo trabajo...')}
            />
          </div>
          <div>
            <label className="field-label">{t('fase1','label_candado','Candado Temporal (T-Lock):')}</label>
            <select
              id="select-candado-temporal"
              value={timeLock}
              onChange={e => setTimeLock(e.target.value)}
            >
              {timeLockList.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div>
        <div className="shuffle-header">
          <div>
            <h2>{t('fase1','titulo_matriz','Matriz Vectores probabilísticos (Cartas)')}</h2>
            <button
              className="btn-outline mt-8"
              style={{fontSize:'12px', padding:'4px 12px'}}
              id="btn-procedimiento"
              onClick={() => setShowProcedimientoDialog(true)}
            >
              ℹ️ Procedimiento
            </button>
          </div>
        </div>

        <div className="card-grid mt-16">
          {selectedCards.map((card, idx) => (
            <div
              key={idx}
              className={`card-slot${card ? ' filled' : ''}`}
              id={`card-slot-${idx+1}`}
              onClick={() => setCardModalIndex(idx)}
            >
              {card ? (
                <img src={card.img} alt={card.spanishName} />
              ) : (
                <>
                  <div className="card-slot-plus">+</div>
                  <div className="card-slot-label">Vector-Carta</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        className="btn-primary"
        id="btn-colapsar-onda"
        onClick={handleProject}
        disabled={!question.trim()}
      >
        {t('fase1','btn_colapsar_onda','Iniciar proyección de futuro de alta probabilidad')}
      </button>

      {result && (
        <Dialog 
          title="INFORME CUÁNTICO EN TIEMPO REAL" 
          onClose={() => { setResult(null); setSelectedCards(Array(6).fill(null)); setQuestion(''); setStreamedReport(''); }}
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
                onClick={() => { setResult(null); setSelectedCards(Array(6).fill(null)); setQuestion(''); setStreamedReport(''); }}
              >
                CERRAR Y HACER OTRA PREGUNTA
              </button>
            </div>
          }
        >
          <div>
            <p style={{fontStyle:'italic', marginBottom:'16px', opacity: 0.8}}>
              Con respecto a tu consulta sobre: <strong style={{color: 'var(--blue-accent)'}}>"{result.question}"</strong>
            </p>
            
            <div className="glass-card-light custom-scroll-container" style={{padding: '16px', marginBottom: '16px', maxHeight: '50vh', overflowY: 'auto', overflowX: 'hidden', wordBreak: 'break-word', overflowWrap: 'anywhere', textAlign: 'left', whiteSpace: 'pre-wrap', color: '#FFFFFF', fontSize: '13px', lineHeight: '1.5', fontFamily: 'monospace'}}>
              {streamError ? (
                <span style={{color: '#ff6b6b'}}>Hubo un error de red generando el informe. Por favor, inténtalo de nuevo.</span>
              ) : (
                <>
                  {streamedReport || 'Conectando con la IA cuántica...'}
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
        <CardSelectorModal
          selectedCards={alreadySelected}
          onSelect={handleSelectCard}
          onClose={() => setCardModalIndex(null)}
        />
      )}

      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-title">
            {t('fase1','estado_analizando','ANALIZANDO MILLONES DE COMBINACIONES')}
          </div>
          <div className={`code-stream${codeStream.startsWith('PROYECCIÓN') ? ' completed' : ''}`} style={{whiteSpace:'pre-line'}}>
            {codeStream}
          </div>
        </div>
      )}

      {showApuestasDialog && (
        <Dialog title="Apuestas y azar" onClose={() => setShowApuestasDialog(false)}>
          <p>{t('fase1','dialogo_apuestas','El Algoritmo Bénturi opera bajo principios de causalidad y probabilidad personal. Por diseño técnico, no es un sistema apto para la predicción de eventos de azar, apuestas deportivas o juegos de fortuna.')}</p>
        </Dialog>
      )}

      {showProcedimientoDialog && (
        <Dialog title="Procedimiento" onClose={() => setShowProcedimientoDialog(false)}>
          <p>Una vez que ya hemos hecho la tirada, como vimos en el video, la primera de la izquierda será la número 1 y así sucesivamente.</p>
          <p className="mt-12">Un ejemplo: Si la primera carta es el 3 de bastos, pinchamos en la imagen, se nos abrirá un desplegable con los cuatro palos y seleccionamos el palo. En este caso bastos. Entonces vamos al tres de bastos, lo seleccionamos, y ya estaría. Así haríamos con las seis cartas.</p>
          <p className="mt-12">Antes de dar al botón 'COLAPSAR ONDA', nos cercioramos de que hemos introducido todos los vectores-carta perfectamente.</p>
          <img
            src="/assets/images/foto_carta_6.jpeg"
            alt="Ejemplo carta"
            style={{width:'100%', borderRadius:'12px', marginTop:'16px'}}
            onError={e => e.target.style.display='none'}
          />
        </Dialog>
      )}
    </div>
  )
}
