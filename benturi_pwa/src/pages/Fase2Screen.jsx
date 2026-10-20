import { useState } from 'react'
import { useTexts } from '../hooks/useTexts'
import { FASE2_QUESTIONS, LEVEL_NAMES, getLevelZone, getLevelClass, ACTION_PLANS } from '../constants/appData'

const LIKERT_TEXTS = {
  1: "Totalmente en desacuerdo",
  2: "En desacuerdo",
  3: "Neutral",
  4: "De acuerdo",
  5: "Totalmente de acuerdo"
}

export default function Fase2Screen() {
  const { t } = useTexts()
  
  // Cargar estado previo de localStorage si existe
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem('benturi_fase2_answers')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const [currentIdx, setCurrentIdx] = useState(0)
  
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

  const reset = () => {
    setCurrentIdx(0)
    setTotalScore(0)
    setDone(false)
    setActiveLevel(null)
    setAnswers({})
    localStorage.removeItem('benturi_fase2_answers')
    localStorage.removeItem('benturi_fase2_result')
  }

  const current = FASE2_QUESTIONS[currentIdx]

  return (
    <div className="page stack">
      <div className="glass-card-light" style={{textAlign:'center'}}>
        <h1>{t('fase2','titulo','FASE 2: EL AMOR')}</h1>
        <div className="subtitle mt-8">{t('fase2','subtitulo','CONEXIÓN Y FLUJO DINÁMICO')}</div>
        <div className="mt-16">
          <video controls preload="metadata" playsInline style={{width: '100%', borderRadius: '12px', border: '1.5px solid rgba(127,179,213,0.4)', background: 'black'}}>
            <source src="/assets/videos/fase2.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      <div className="glass-card">
        <h2>{t('fase2','titulo_vibracion','LA VIBRACIÓN MÁS ALTA')}</h2>
        <p className="mt-12">{t('fase2','desc_vibracion','Estar en amor es fundamental a nivel energético porque funciona como la vibración más alta del universo, capaz de elevar tu propia frecuencia, atraer situaciones afines y alinear tus células con la vida. Este cuestionario medirá tu escalón en la pirámide.')}</p>
      </div>

      {!done ? (
        <div className="question-card">
          <div className="question-header">
            <div className="question-counter">
              {t('fase2','label_pregunta','PREGUNTA')} {currentIdx + 1} {t('fase2','label_de','DE')} {FASE2_QUESTIONS.length}
            </div>
            {currentIdx > 0 && (
              <button className="question-back-btn" id="btn-pregunta-anterior" onClick={() => setCurrentIdx(i => i - 1)}>←</button>
            )}
          </div>
          <div className="question-text">{current.text}</div>
          <div className="likert-scale">
            {[1,2,3,4,5].map(n => (
              <button key={n} className="likert-btn" id={`likert-btn-${n}`} onClick={() => answerQuestion(n)} aria-label={`${n} de 5`}>{n}</button>
            ))}
          </div>
          <div className="likert-labels">
            <div className="likert-label">{t('fase2','label_desacuerdo','Total.\nDesacuerdo')}</div>
            <div className="likert-label">{t('fase2','label_neutral','Neutral')}</div>
            <div className="likert-label">{t('fase2','label_acuerdo','Total.\nAcuerdo')}</div>
          </div>
        </div>
      ) : (
        <>
          <div className="glass-card">
            <h2 style={{textAlign:'center', marginBottom:'16px'}}>DIAGNÓSTICO VIBRACIONAL</h2>
            <div className="pyramid-container">
              {Array.from({length:11}, (_,i) => {
                const lv = 11 - i
                const isActive = lv === activeLevel
                const cls = getLevelClass(lv)
                const widthPct = 30 + (i * 6)
                return (
                  <div
                    key={lv}
                    className={`pyramid-level ${cls}${isActive ? ' active' : ''}`}
                    style={{width:`${widthPct}%`, animation: isActive ? 'pulse 2s infinite alternate' : 'none'}}
                  >
                    <span>{LEVEL_NAMES[lv]}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="result-diag">
            <div className="result-diag-label">RESULTADO OBTENIDO</div>
            <div className="result-diag-level">ESCALÓN {activeLevel}: {LEVEL_NAMES[activeLevel]}</div>
            <div className="result-diag-score">Puntuación Total: {totalScore}/275</div>
            <p>El algoritmo detecta que te encuentras en el nivel {getLevelZone(activeLevel)}.</p>

            {ACTION_PLANS[activeLevel] && (
              <>
                <div className="divider" />
                <h3 style={{fontSize:'12px', fontWeight:'700', color:'#154360'}}>{ACTION_PLANS[activeLevel].title}</h3>
                {ACTION_PLANS[activeLevel].actions.map((a,i) => (
                  <div key={i} className="action-item">{a}</div>
                ))}
              </>
            )}

            <button className="btn-secondary mt-16" id="btn-repetir-fase2" onClick={reset}>REPETIR CHEQUEO</button>
          </div>
        </>
      )}
    </div>
  )
}
