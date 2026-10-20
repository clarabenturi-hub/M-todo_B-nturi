import { useState, useRef, useEffect } from 'react'
import { useTexts } from '../hooks/useTexts'
import { useCombinations } from '../hooks/useCombinations'
import Dialog from '../components/Dialog'
import CardSelectorModal from '../components/CardSelectorModal'
import { 
  FULL_DECK, 
  FASE2_QUESTIONS, 
  LEVEL_NAMES, 
  getLevelZone, 
  getLevelClass, 
  ACTION_PLANS 
} from '../constants/appData'
import { generarPDFDesdeMarkdown } from '../utils/pdf_generator.js'

const LIKERT_TEXTS = {
  1: "Totalmente en desacuerdo",
  2: "En desacuerdo",
  3: "Neutral",
  4: "De acuerdo",
  5: "Totalmente de acuerdo"
}

export default function Fase1_24Screen({ user, token, onLoginClick }) {
  const { t, tList } = useTexts()
  const getMeaning = useCombinations()
  const [loading, setLoading] = useState(false)

  // Estado del Stepper: 1 = Sintonización Vibracional (Amor), 2 = Matriz de 24 Cartas
  const [activeStep, setActiveStep] = useState(() => {
    try {
      const savedRes = localStorage.getItem('benturi_fase2_result')
      return savedRes ? 2 : 1
    } catch {
      return 1
    }
  })

  // -------------------------------------------------------------
  // ESTADO DEL CUESTIONARIO PIRÁMIDE DEL AMOR (FASE 2 / AMA)
  // -------------------------------------------------------------
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem('benturi_fase2_answers')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const [currentIdx, setCurrentIdx] = useState(() => {
    try {
      const saved = localStorage.getItem('benturi_fase2_answers')
      if (saved) {
        const count = Object.keys(JSON.parse(saved)).length
        if (count > 0 && count < FASE2_QUESTIONS.length) {
          return count
        }
      }
    } catch {}
    return 0
  })

  // Control de vista en Paso 1: Introducción/Vídeo vs Cuestionario Activo
  const [quizStarted, setQuizStarted] = useState(() => {
    try {
      const saved = localStorage.getItem('benturi_fase2_answers')
      if (saved && Object.keys(JSON.parse(saved)).length > 0) {
        return true
      }
    } catch {}
    return false
  })

  // Modal para ver el vídeo explicativo de Clara Bénturi en cualquier momento
  const [showVideoModal, setShowVideoModal] = useState(false)

  const [totalScore, setTotalScore] = useState(() => {
    try {
      const savedRes = localStorage.getItem('benturi_fase2_result')
      return savedRes ? (JSON.parse(savedRes).totalScore || 0) : 0
    } catch {
      return 0
    }
  })

  const [done, setDone] = useState(() => {
    try {
      return !!localStorage.getItem('benturi_fase2_result')
    } catch {
      return false
    }
  })

  const [activeLevel, setActiveLevel] = useState(() => {
    try {
      const savedRes = localStorage.getItem('benturi_fase2_result')
      return savedRes ? (JSON.parse(savedRes).activeLevel || null) : null
    } catch {
      return null
    }
  })

  const answerQuestion = (score) => {
    const q = FASE2_QUESTIONS[currentIdx]
    const area = q.area || (q.text && q.text.includes(':') ? q.text.split(':')[0].trim() : 'General')
    const updatedAnswers = {
      ...answers,
      [q.id]: {
        id: q.id,
        level: q.level,
        area,
        text: q.text,
        score,
        scoreLabel: LIKERT_TEXTS[score]
      }
    }
    setAnswers(updatedAnswers)
    try {
      localStorage.setItem('benturi_fase2_answers', JSON.stringify(updatedAnswers))
    } catch (e) {
      console.error("Error guardando benturi_fase2_answers:", e)
    }

    const newScore = totalScore + score
    if (currentIdx < FASE2_QUESTIONS.length - 1) {
      setTotalScore(newScore)
      setCurrentIdx(i => i + 1)
    } else {
      setTotalScore(newScore)
      let level = Math.floor((newScore - 55) / 20) + 1
      if (level < 1) level = 1
      if (level > 11) level = 11
      setActiveLevel(level)
      setDone(true)

      const resultObj = {
        activeLevel: level,
        levelName: LEVEL_NAMES[level],
        zone: getLevelZone(level),
        totalScore: newScore,
        date: new Date().toLocaleDateString('es-ES')
      }
      try {
        localStorage.setItem('benturi_fase2_result', JSON.stringify(resultObj))
      } catch (e) {
        console.error("Error guardando benturi_fase2_result:", e)
      }
    }
  }

  const resetQuestionnaire = () => {
    setCurrentIdx(0)
    setTotalScore(0)
    setDone(false)
    setActiveLevel(null)
    setAnswers({})
    setQuizStarted(false)
    localStorage.removeItem('benturi_fase2_answers')
    localStorage.removeItem('benturi_fase2_result')
    setActiveStep(1)
  }

  // -------------------------------------------------------------
  // ESTADO DE LA MATRIZ DE 24 VECTORES (CARTAS)
  // -------------------------------------------------------------
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
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0)

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
      // Extraer datos de la Pirámide del Amor desde localStorage o estado
      let amorData = null;
      try {
        const savedAnswers = localStorage.getItem('benturi_fase2_answers');
        const savedResult = localStorage.getItem('benturi_fase2_result');
        if (savedAnswers || savedResult) {
          amorData = {
            answers: savedAnswers ? JSON.parse(savedAnswers) : answers,
            result: savedResult ? JSON.parse(savedResult) : {
              activeLevel,
              levelName: LEVEL_NAMES[activeLevel],
              zone: getLevelZone(activeLevel),
              totalScore,
              date: new Date().toLocaleDateString('es-ES')
            }
          };
        }
      } catch (e) {
        console.warn("No se pudieron leer las respuestas de Fase 2:", e);
      }

      const resp = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: resData.question || 'Consulta General (Proyección Panorámica 24 Vectores)', 
          result: resData,
          amorData 
        })
      });
      if (!resp.ok) throw new Error('Error en la API');
      
      const reader = resp.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let doneStream = false;
      let fullText = '';
      
      while (!doneStream) {
        const { value, done: readerDone } = await reader.read();
        doneStream = readerDone;
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
        await generarPDFDesdeMarkdown(streamedReport, "Informe_Cuantico_24_Vectores_Benturi.pdf");
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
          question: 'Consulta General (Proyección Panorámica 24 Vectores)',
          timeLock,
          cards: filled,
          c1, c2, c7, c8, c13, c14, c19, c20,
          q1: getMeaning(c1, c2),
          q2: getMeaning(c7, c8),
          q3: getMeaning(c13, c14),
          q4: getMeaning(c19, c20),
          amorData: {
            answers,
            result: activeLevel ? {
              activeLevel,
              levelName: LEVEL_NAMES[activeLevel],
              zone: getLevelZone(activeLevel),
              totalScore,
              date: new Date().toLocaleDateString('es-ES')
            } : null
          }
        };
        setResult(newResult);
        startStreamingReport(newResult);
      }, 800)
    }, 3000)
  }

  useEffect(() => () => clearInterval(streamTimer.current), [])

  const loadingMessages = [
    "Sintonizando tu frecuencia con la Pirámide del Amor...",
    "Decodificando 329 billones de probabilidades...",
    "Alineando vectores con el Pasado, Presente y Futuro...",
    "Analizando correlaciones energéticas de la matriz 4x6...",
    "Estructurando tu Hoja de Ruta total del Método Bénturi..."
  ];

  useEffect(() => {
    let interval;
    if (isStreaming && !streamedReport) {
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 6000);
    } else {
      setLoadingMsgIndex(0);
    }
    return () => clearInterval(interval);
  }, [isStreaming, streamedReport]);

  const currentQuestion = FASE2_QUESTIONS[currentIdx] || FASE2_QUESTIONS[0]
  const progressPercent = Math.round(((currentIdx + 1) / FASE2_QUESTIONS.length) * 100)

  const getZoneClass = (level) => {
    if (level <= 4) return 'material'
    if (level <= 8) return 'mental'
    return 'espiritual'
  }

  const getZoneTitle = (level) => {
    if (level <= 4) return '🔴 ZONA DE LO MATERIAL (Escalones 1 al 4)'
    if (level <= 8) return '🟡 ZONA DE LO MENTAL (Escalones 5 al 8)'
    return '🟢 ZONA DE LO ESPIRITUAL (Escalones 9 al 11)'
  }

  if (true || user?.isPremium) {
    return (
      <div className="page stack">
        
        {/* ENCABEZADO PRINCIPAL DE LA PROYECCIÓN 24 VECTORES */}
        <div className="glass-card-light" style={{textAlign:'center'}}>
          <h1 style={{fontSize: '22px', lineHeight: '1.3'}}>Proyección de Futuro Alta Probabilidad (24 Vectores)</h1>
          <div className="subtitle mt-8" style={{fontSize: '13px', lineHeight: '1.4', opacity: 0.9, textTransform: 'none'}}>
            El Algoritmo decodifica 32,2 billones de opciones cruzando tu estado vibracional con la red probabilística.
          </div>
        </div>

        {/* STEPPER DE NAVEGACIÓN UX/UI */}
        <nav className="stepper-nav" aria-label="Progreso del protocolo 24 cartas">
          <button 
            type="button"
            className={`stepper-item${activeStep === 1 ? ' active' : ''}${done ? ' completed' : ''}`}
            onClick={() => setActiveStep(1)}
            id="step-tab-1"
          >
            <span className="stepper-badge">{done ? '✓' : '1'}</span>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7 }}>Paso 1</div>
              <div style={{ whiteSpace: 'nowrap' }}>Sintonización (Pirámide)</div>
            </div>
          </button>

          <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />

          <button 
            type="button"
            className={`stepper-item${activeStep === 2 ? ' active' : ''}`}
            onClick={() => {
              if (done) setActiveStep(2);
              else alert("Para que la tirada de 24 sea exacta, completa primero el chequeo vibracional de la Pirámide del Amor.");
            }}
            id="step-tab-2"
          >
            <span className="stepper-badge">2</span>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7 }}>Paso 2</div>
              <div style={{ whiteSpace: 'nowrap' }}>Matriz de 24 Cartas</div>
            </div>
          </button>
        </nav>

        {/* ========================================================= */}
        {/* PASO 1: SINTONIZACIÓN VIBRACIONAL (CUESTIONARIO Y PIRÁMIDE) */}
        {/* ========================================================= */}
        {activeStep === 1 && (
          <div className="stack" style={{ gap: '16px' }}>
            {!done ? (
              !quizStarted ? (
                /* PASO 1A: INTRODUCCIÓN Y VÍDEO DE CLARA BÉNTURI */
                <>
                  <div className="glass-card-light" style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '8px' }}>
                      Sintonización Vibracional: La Pirámide del Amor
                    </h2>
                    <div className="subtitle" style={{ fontSize: '14px', opacity: 0.9, textTransform: 'none', maxWidth: '620px', margin: '0 auto', lineHeight: '1.5' }}>
                      Antes de abrir la matriz probabilística de 24 cartas, el Algoritmo necesita medir tu nivel vibracional para ubicar qué fila corresponde a tu Pasado, Presente y Futuro.
                    </div>

                    <div className="mt-16" style={{ maxWidth: '560px', margin: '16px auto 0' }}>
                      <video 
                        controls 
                        preload="metadata" 
                        playsInline 
                        style={{
                          width: '100%', 
                          borderRadius: '12px', 
                          border: '1.5px solid rgba(0, 229, 255, 0.4)', 
                          background: 'black',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                        }}
                      >
                        <source src="/assets/videos/fase2.mp4" type="video/mp4" />
                      </video>
                    </div>
                  </div>

                  <div className="glass-card" style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '16px', color: '#40e0d0', marginBottom: '8px', letterSpacing: '0.04em' }}>
                      LA VIBRACIÓN MÁS ALTA DEL UNIVERSO
                    </h3>
                    <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
                      Estar en amor es fundamental a nivel cuántico porque funciona como la frecuencia más alta, capaz de disolver el miedo, atraer situaciones sincrónicas y alinear tus células con la vida. Este chequeo (55 preguntas rápidas) revelará tu escalón en la Pirámide del Amor.
                    </p>

                    <button 
                      className="btn-primary" 
                      id="btn-iniciar-chequeo-amor"
                      style={{
                        fontSize: '16px',
                        padding: '16px 24px',
                        fontWeight: '800',
                        letterSpacing: '0.03em',
                        borderRadius: '12px',
                        boxShadow: '0 6px 20px rgba(0, 229, 255, 0.35)',
                        width: '100%',
                        maxWidth: '480px',
                        margin: '22px auto 0',
                        display: 'block'
                      }}
                      onClick={() => setQuizStarted(true)}
                    >
                      INICIAR CHEQUEO VIBRACIONAL (55 PREGUNTAS) →
                    </button>
                  </div>
                </>
              ) : (
                /* PASO 1B: CUESTIONARIO ENFOCADO 1 A 1 */
                <>
                  <div className="glass-card" style={{ padding: '16px 20px' }}>
                    <div className="flex-between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span className={`zone-pill ${getZoneClass(currentQuestion.level)}`} style={{ margin: 0 }}>
                        {getZoneTitle(currentQuestion.level)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setShowVideoModal(true)}
                          style={{
                            background: 'rgba(0, 229, 255, 0.1)',
                            border: '1px solid rgba(0, 229, 255, 0.3)',
                            color: '#40e0d0',
                            fontSize: '12px',
                            fontWeight: '700',
                            padding: '5px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                          title="Ver vídeo explicativo de Clara Bénturi"
                        >
                          🎬 Ver Vídeo
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#40e0d0' }}>
                          {progressPercent}%
                        </span>
                      </div>
                    </div>

                    <div className="progress-track" style={{ margin: '12px 0 0 0' }}>
                      <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  <div className="question-card">
                    <div className="question-header">
                      <div className="question-counter" style={{ fontSize: '13px', letterSpacing: '0.05em' }}>
                        PREGUNTA {currentIdx + 1} DE {FASE2_QUESTIONS.length}
                      </div>
                      {currentIdx > 0 && (
                        <button 
                          className="question-back-btn" 
                          id="btn-pregunta-anterior-24" 
                          onClick={() => setCurrentIdx(i => i - 1)}
                          title="Pregunta anterior"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#40e0d0', background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: '8px' }}
                        >
                          ← Anterior
                        </button>
                      )}
                    </div>

                    <div className="question-text" style={{ minHeight: '70px', display: 'flex', alignItems: 'center', fontSize: '18px', fontWeight: '500', lineHeight: '1.5', margin: '16px 0 24px' }}>
                      {currentQuestion.text}
                    </div>

                    <div className="likert-scale">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button 
                          key={n} 
                          className="likert-btn" 
                          id={`likert-24-btn-${n}`} 
                          onClick={() => answerQuestion(n)} 
                          aria-label={`${n} de 5 - ${LIKERT_TEXTS[n]}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>

                    <div className="likert-labels">
                      <div className="likert-label">1<br/>Totalmente<br/>desacuerdo</div>
                      <div className="likert-label">2<br/>En<br/>desacuerdo</div>
                      <div className="likert-label">3<br/>Neutral</div>
                      <div className="likert-label">4<br/>De<br/>acuerdo</div>
                      <div className="likert-label">5<br/>Totalmente<br/>de acuerdo</div>
                    </div>
                  </div>
                </>
              )
            ) : (
              /* PASO 1C: PIRÁMIDE VIBRACIONAL REVELADA */
              <>
                <div className="glass-card">
                  <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '20px' }}>
                    DIAGNÓSTICO VIBRACIONAL ALCANZADO
                  </h2>
                  <p style={{ textAlign: 'center', fontSize: '13px', opacity: 0.85, marginBottom: '20px' }}>
                    Tu frecuencia ha sido identificada. El Algoritmo utilizará este escalón para calibrar el eje temporal y el Segundo Poder de tu tirada de 24 cartas.
                  </p>

                  <div className="pyramid-container">
                    {Array.from({ length: 11 }, (_, i) => {
                      const lv = 11 - i
                      const isActive = lv === activeLevel
                      const cls = getLevelClass(lv)
                      const widthPct = 30 + (i * 6)
                      return (
                        <div
                          key={lv}
                          className={`pyramid-level ${cls}${isActive ? ' active' : ''}`}
                          style={{ width: `${widthPct}%`, animation: isActive ? 'pulse 2s infinite alternate' : 'none' }}
                        >
                          <span>{LEVEL_NAMES[lv]}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="result-diag">
                  <div className="result-diag-label">CALIBRACIÓN COMPLETADA</div>
                  <div className="result-diag-level">ESCALÓN {activeLevel}: {LEVEL_NAMES[activeLevel]}</div>
                  <div className="result-diag-score">Puntuación Total: {totalScore}/275 pts • Zona {getLevelZone(activeLevel)}</div>
                  <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
                    Tu nivel energético está alineado con la matriz probabilística. Ya estás listo para colapsar los 24 vectores.
                  </p>

                  {ACTION_PLANS[activeLevel] && (
                    <>
                      <div className="divider" />
                      <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#40e0d0', marginBottom: '8px' }}>
                        {ACTION_PLANS[activeLevel].title}
                      </h3>
                      {ACTION_PLANS[activeLevel].actions.map((a, i) => (
                        <div key={i} className="action-item" style={{ fontSize: '13px', lineHeight: '1.4' }}>{a}</div>
                      ))}
                    </>
                  )}

                  {/* BOTÓN PROMINENTE PARA PASAR AL PASO 2 */}
                  <button 
                    className="btn-primary mt-16" 
                    id="btn-ir-paso-2"
                    style={{ fontSize: '15px', padding: '16px 22px', fontWeight: '800', letterSpacing: '0.04em' }}
                    onClick={() => setActiveStep(2)}
                  >
                    CONTINUAR A LA MATRIZ DE 24 VECTORES (PASO 2) →
                  </button>

                  <button 
                    className="btn-secondary" 
                    id="btn-recalibrar-fase2" 
                    style={{ opacity: 0.8, fontSize: '12px', marginTop: '10px' }}
                    onClick={resetQuestionnaire}
                  >
                    🔄 REPETIR CHEQUEO / RECALIBRAR PREGUNTAS
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PASO 2: MATRIZ DE 24 VECTORES (SELECCIÓN Y TIRADA)       */}
        {/* ========================================================= */}
        {activeStep === 2 && (
          <div className="stack" style={{ gap: '16px' }}>
            
            {/* BANNER DE VIBRACIÓN CALIBRADA */}
            <div className="vibration-banner">
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a3e635', marginBottom: '4px' }}>
                  ✨ Sintonización Vibracional Activa
                </div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>
                  Escalón {activeLevel}: {LEVEL_NAMES[activeLevel]} <span style={{ fontSize: '12px', fontWeight: '500', opacity: 0.8 }}>({getLevelZone(activeLevel)})</span>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '3px', maxWidth: '520px', lineHeight: '1.4' }}>
                  El Algoritmo priorizará las vivencias de tus respuestas para ubicar el Pasado en la matriz y desplegar el futuro.
                </div>
              </div>
              <button 
                type="button"
                className="btn-outline" 
                style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(64,224,208,0.5)', color: '#40e0d0', background: 'rgba(64,224,208,0.08)' }}
                onClick={() => setActiveStep(1)}
              >
                🔺 Ver Pirámide / Recalibrar
              </button>
            </div>

            {/* CUADRÍCULA DE 24 CARTAS */}
            <div>
              <div className="shuffle-header">
                <div>
                  <h2>Matriz Vectores probabilísticos (24 Cartas)</h2>
                  <button
                    type="button"
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

            <button 
              className="btn-primary" 
              onClick={handleProject} 
              disabled={isProcessing}
              id="btn-iniciar-protocolo-24"
            >
              {isProcessing ? "CALIBRANDO MATRIZ DE 24 VECTORES..." : "PROTOCOLO EXPRESS DE CALIBRACIÓN: MATRIZ DE 24 VECTORES-CARTAS"}
            </button>
          </div>
        )}

        {/* DIÁLOGO / MODAL DEL INFORME FINAL EN TIEMPO REAL */}
        {result && (
          <Dialog 
            title="INFORME CUÁNTICO EN TIEMPO REAL" 
            onClose={() => { setResult(null); setSelectedCards(Array(24).fill(null)); setStreamedReport(''); }}
            actions={
              <div className="stack" style={{width: '100%', gap: '8px'}}>
                <button
                  className="btn-primary"
                  style={{width: '100%', margin: 0, background: isStreaming ? 'grey' : 'var(--magenta-primary)', color: 'white', border: 'none'}}
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf || isStreaming || streamError}
                >
                  {isStreaming ? 'ESCRIBIENDO INFORME...' : (isGeneratingPdf ? 'GENERANDO PDF...' : 'DESCARGAR INFORME CON PIRÁMIDE (PDF)')}
                </button>
                <button
                  className="btn-secondary"
                  style={{width: '100%', margin: 0, opacity: 0.8, fontSize: '11px'}}
                  onClick={() => { setResult(null); setSelectedCards(Array(24).fill(null)); setStreamedReport(''); }}
                >
                  CERRAR Y REALIZAR OTRA PROYECCIÓN
                </button>
              </div>
            }
          >
            <div>
              {/* RESUMEN SUPERIOR EN EL MODAL */}
              <div style={{ background: 'rgba(64, 224, 208, 0.08)', border: '1px solid rgba(64, 224, 208, 0.3)', borderRadius: '10px', padding: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#40e0d0', fontWeight: '700' }}>
                    🔺 Diagnóstico Vibracional Integrado
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                    Escalón {activeLevel}: {LEVEL_NAMES[activeLevel]} ({getLevelZone(activeLevel)})
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  Candado: <strong style={{ color: '#40e0d0' }}>{result.timeLock}</strong>
                </div>
              </div>

              <div className="glass-card-light custom-scroll-container" style={{padding: '16px', marginBottom: '16px', maxHeight: '50vh', overflowY: 'auto', overflowX: 'hidden', wordBreak: 'break-word', overflowWrap: 'anywhere', textAlign: 'left', whiteSpace: 'pre-wrap', color: '#FFFFFF', fontSize: '13px', lineHeight: '1.5', fontFamily: 'monospace'}}>
                {streamError ? (
                  <span style={{color: '#ff6b6b'}}>Hubo un error de red generando el informe. Por favor, inténtalo de nuevo.</span>
                ) : (
                  <>
                    {streamedReport || loadingMessages[loadingMsgIndex]}
                    {isStreaming && <span className="cursor-blink" style={{marginLeft: '4px'}}>|</span>}
                  </>
                )}
              </div>
              
              {!isStreaming && !streamError && (
                <p className="mt-16" style={{fontWeight:'700', color:'var(--blue-mid)'}}>
                  El informe ha sido completado con éxito con la Pirámide del Amor y la Matriz de 24. Ahora puedes descargarlo en PDF.
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
              <p style={{fontSize: '12px', marginBottom: '8px'}}>Entra en un espacio tranquilo. Enciende una vela blanca y coloca un vaso de agua limpia.<br/>Baraja las cartas un mínimo de 7 veces.<br/>Recita en voz alta (o mentalmente) el mantra de calibración: "A las Guapas, las Guapas, qué bonitas que sois, decidme la verdad".<br/>Detén el barajado cuando lo sientas y corta el mazo con la mano izquierda.</p>
              
              <p style={{fontSize: '13px', marginBottom: '8px', marginTop: '16px'}}><strong>🃏 2. DESPLIEGUE EN LA MESA Y SELECCIÓN 🔄</strong></p>
              <p style={{fontSize: '12px', marginBottom: '8px'}}>Coloca las 24 cartas sobre la mesa siguiendo la regla de descarte (una sí, una no).<br/>Introduce los 24 vectores en la matriz de la app.</p>
              
              <p style={{fontSize: '13px', marginBottom: '8px', marginTop: '16px'}}><strong>📂 3. CALIBRACIÓN EN DOS PASOS (EL SECRETO) 🧠🎯</strong></p>
              <p style={{fontSize: '12px', marginBottom: '8px'}}>Paso A: Sintonización Vibracional en la Pirámide del Amor para situar el pasado y el nivel de consciencia.<br/>Paso B: Colapso de onda y decodificación de la red de 24 cartas.</p>
              
              <p style={{fontSize: '13px', marginBottom: '8px', marginTop: '16px'}}><strong>🧼 4. LIMPIEZA DE VECTORES 🔀</strong></p>
              <p style={{fontSize: '12px', marginBottom: '8px'}}>Al terminar, devuelve las 24 cartas al mazo de forma aleatoria para limpiar los códigos energéticos.</p>
            </div>
          </Dialog>
        )}

        {showVideoModal && (
          <Dialog title="VÍDEO EXPLICATIVO: LA VIBRACIÓN DEL AMOR" onClose={() => setShowVideoModal(false)}>
            <div style={{ textAlign: 'center' }}>
              <video 
                controls 
                autoPlay
                playsInline 
                style={{ width: '100%', borderRadius: '12px', background: 'black', maxHeight: '55vh' }}
              >
                <source src="/assets/videos/fase2.mp4" type="video/mp4" />
              </video>
              <p style={{ fontSize: '13px', marginTop: '12px', opacity: 0.9, lineHeight: '1.4' }}>
                Clara Bénturi te explica cómo funciona la Pirámide del Amor y por qué calibra el pasado y futuro de tu tirada de 24 cartas.
              </p>
            </div>
          </Dialog>
        )}
      </div>
    )
  }

  return null
}
