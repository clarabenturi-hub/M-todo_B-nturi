import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PREGUNTAS_SITUACIONALES_48, 
  FACTORES_PIRAMIDE, 
  NIVELES_12 
} from '../constants/situationalQuestions'
import { 
  FASE2_QUESTIONS, 
  LEVEL_NAMES as LEVEL_NAMES_11, 
  getLevelZone as getLevelZone11, 
  getLevelClass as getLevelClass11, 
  ACTION_PLANS as ACTION_PLANS_11 
} from '../constants/appData'

const LIKERT_TEXTS = {
  1: "Totalmente en desacuerdo",
  2: "En desacuerdo",
  3: "Neutral",
  4: "De acuerdo",
  5: "Totalmente de acuerdo"
}

export default function PyramidQuestionnaire({ 
  onComplete, 
  initialDone = false, 
  onReset,
  isPremiumUnlocked = false
}) {
  // Etapa activa del cuestionario integrado: 1 = Situacional (48 preguntas), 2 = Sintonización Likert (55 preguntas)
  const [stage, setStage] = useState(() => {
    try {
      const savedStage = localStorage.getItem('benturi_quiz_stage')
      if (savedStage) return parseInt(savedStage, 10)
      const savedSit = localStorage.getItem('benturi_sit48_answers')
      if (savedSit && Object.keys(JSON.parse(savedSit)).length >= PREGUNTAS_SITUACIONALES_48.length) {
        return 2
      }
      return 1
    } catch {
      return 1
    }
  })

  // Estado para la Etapa 1: Situacional (48 preguntas ABCD)
  const [sitAnswers, setSitAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem('benturi_sit48_answers')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [sitIdx, setSitIdx] = useState(() => {
    try {
      const saved = localStorage.getItem('benturi_sit48_answers')
      if (saved) {
        const count = Object.keys(JSON.parse(saved)).length
        if (count > 0 && count < PREGUNTAS_SITUACIONALES_48.length) return count
      }
      return 0
    } catch {
      return 0
    }
  })

  // Estado para la Etapa 2: Sintonización Clásica (55 preguntas Likert)
  const [clasAnswers, setClasAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem('benturi_clas55_answers') || localStorage.getItem('benturi_fase2_answers')
      if (!saved) return {}
      const parsed = JSON.parse(saved)
      return parsed.clasico ? parsed.clasico : parsed
    } catch {
      return {}
    }
  })
  const [clasIdx, setClasIdx] = useState(() => {
    try {
      const saved = localStorage.getItem('benturi_clas55_answers') || localStorage.getItem('benturi_fase2_answers')
      if (saved) {
        const parsed = JSON.parse(saved)
        const ansObj = parsed.clasico ? parsed.clasico : parsed
        const count = Object.keys(ansObj).length
        if (count > 0 && count < FASE2_QUESTIONS.length) return count
      }
      return 0
    } catch {
      return 0
    }
  })

  // Estado de finalización y diagnóstico consolidado
  const [isDone, setIsDone] = useState(initialDone)
  const [activeResult, setActiveResult] = useState(() => {
    try {
      const saved = localStorage.getItem('benturi_active_pyramid_result')
      if (saved) return JSON.parse(saved)
      const oldRes = localStorage.getItem('benturi_fase2_result')
      return oldRes ? JSON.parse(oldRes) : null
    } catch {
      return null
    }
  })

  // Consolidar el resultado integrado y calcular la pirámide única de 11 niveles
  const finalizeIntegratedQuiz = (finalSitAnswers, finalClasAnswers) => {
    // 1. Análisis de Etapa 1 (Situacional)
    const sitList = Object.values(finalSitAnswers)
    const hitosFuturos = sitList
      .filter(a => a.isFutureHito || a.score === 0 || a.key === 'D')
      .map(a => ({
        preguntaId: a.id,
        area: a.area,
        pregunta: a.pregunta,
        textoOpcion: a.textoOpcion || a.texto
      }))

    let totalScoreSit = 0
    let countScoredSit = 0
    sitList.forEach(a => {
      const s = Number(a.score) || 0
      if (s > 0) {
        totalScoreSit += s
        countScoredSit++
      }
    })
    const avgSit = countScoredSit > 0 ? totalScoreSit / countScoredSit : 1 // escala de 1.0 a 3.0
    // Normalizar a escala de 1 a 11
    let levelSit = Math.round(1 + ((avgSit - 1) / 2) * 10)
    if (levelSit < 1) levelSit = 1
    if (levelSit > 11) levelSit = 11

    // 2. Análisis de Etapa 2 (Sintonización Likert 55 preguntas, escala 55 a 275)
    let totalScoreClas = 0
    Object.values(finalClasAnswers).forEach(a => {
      totalScoreClas += (Number(a.score) || 0)
    })
    let levelClas = Math.floor((totalScoreClas - 55) / 20) + 1
    if (levelClas < 1) levelClas = 1
    if (levelClas > 11) levelClas = 11

    // 3. Nivel Final Integrado Ponderado (50% vivencial situacional + 50% sintonización de frecuencia)
    let finalLevel = Math.round((levelSit * 0.5) + (levelClas * 0.5))
    if (finalLevel < 1) finalLevel = 1
    if (finalLevel > 11) finalLevel = 11

    const consolidatedResult = {
      tipo: 'integrado_unificado',
      activeLevel: finalLevel,
      levelName: LEVEL_NAMES_11[finalLevel],
      zone: getLevelZone11(finalLevel),
      levelSit,
      levelClas,
      situacionalScore: totalScoreSit,
      clasicoScore: totalScoreClas,
      totalScore: totalScoreSit + totalScoreClas,
      maxPossibleScore: (48 * 3) + 275,
      hitosFuturos,
      hitosFuturosCount: hitosFuturos.length,
      date: new Date().toLocaleDateString('es-ES')
    }

    const consolidatedAnswers = {
      situacional: finalSitAnswers,
      clasico: finalClasAnswers
    }

    setActiveResult(consolidatedResult)
    setIsDone(true)

    try {
      localStorage.setItem('benturi_active_pyramid_result', JSON.stringify(consolidatedResult))
      localStorage.setItem('benturi_fase2_result', JSON.stringify(consolidatedResult))
      localStorage.setItem('benturi_fase2_answers', JSON.stringify(consolidatedAnswers))
      localStorage.setItem('benturi_sit48_answers', JSON.stringify(finalSitAnswers))
      localStorage.setItem('benturi_clas55_answers', JSON.stringify(finalClasAnswers))
      localStorage.setItem('benturi_quiz_stage', '2')
    } catch (e) {
      console.error("Error guardando en localStorage:", e)
    }

    if (onComplete) {
      onComplete({
        tipo: 'integrado_unificado',
        result: consolidatedResult,
        answers: consolidatedAnswers
      })
    }
  }

  // Responder en Etapa 1: Situacional (48)
  const handleAnswerSituational = (opcion) => {
    const q = PREGUNTAS_SITUACIONALES_48[sitIdx]
    const updated = {
      ...sitAnswers,
      [q.id]: {
        id: q.id,
        level: q.level,
        factor: q.factor,
        area: q.area,
        pregunta: q.pregunta,
        key: opcion.key,
        score: opcion.score,
        textoOpcion: opcion.texto,
        isFutureHito: !!opcion.isFutureHito
      }
    }
    setSitAnswers(updated)
    try {
      localStorage.setItem('benturi_sit48_answers', JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }

    if (sitIdx < PREGUNTAS_SITUACIONALES_48.length - 1) {
      setSitIdx(i => i + 1)
    } else {
      // Completó la Etapa 1 -> Avanza fluidamente a la Etapa 2
      setStage(2)
      try {
        localStorage.setItem('benturi_quiz_stage', '2')
      } catch (e) {
        console.error(e)
      }
    }
  }

  // Responder en Etapa 2: Sintonización Clásica (55)
  const handleAnswerClassic = (score) => {
    const q = FASE2_QUESTIONS[clasIdx]
    const area = q.area || (q.text && q.text.includes(':') ? q.text.split(':')[0].trim() : 'General')
    const updated = {
      ...clasAnswers,
      [q.id]: {
        id: q.id,
        level: q.level,
        area,
        text: q.text,
        score,
        scoreLabel: LIKERT_TEXTS[score]
      }
    }
    setClasAnswers(updated)
    try {
      localStorage.setItem('benturi_clas55_answers', JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }

    if (clasIdx < FASE2_QUESTIONS.length - 1) {
      setClasIdx(i => i + 1)
    } else {
      // Completó la Etapa 2 -> Calcular y generar la Pirámide Única Consolidada
      finalizeIntegratedQuiz(sitAnswers, updated)
    }
  }

  // Reiniciar cuestionario integrado
  const handleResetQuiz = () => {
    setIsDone(false)
    setStage(1)
    setSitIdx(0)
    setSitAnswers({})
    setClasIdx(0)
    setClasAnswers({})
    try {
      localStorage.removeItem('benturi_sit48_answers')
      localStorage.removeItem('benturi_clas55_answers')
      localStorage.removeItem('benturi_quiz_stage')
      localStorage.removeItem('benturi_active_pyramid_result')
      localStorage.removeItem('benturi_fase2_result')
      localStorage.removeItem('benturi_fase2_answers')
    } catch (e) {
      console.error(e)
    }
    if (onReset) onReset()
  }

  // =========================================================================
  // RENDERIZADO CUANDO EL CUESTIONARIO ESTÁ FINALIZADO (PIRÁMIDE ÚNICA REVELADA)
  // =========================================================================
  if (isDone && activeResult) {
    const activeLv = activeResult.activeLevel || 1
    const totalLevels = 11 // Pirámide Clásica Unificada de 11 niveles

    return (
      <div className="glass-card" style={{ padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <span className="zone-pill" style={{ background: 'rgba(0, 229, 255, 0.15)', borderColor: 'rgba(0, 229, 255, 0.4)', color: '#38bdf8' }}>
            ⚡ Evaluación Integrada (48 Situaciones + 55 Sintonización)
          </span>
          <span className="zone-pill" style={{ background: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.4)', color: '#34d399' }}>
            {activeResult.zone || getLevelZone11(activeLv)}
          </span>
        </div>

        <h2 style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', color: '#ffffff', fontWeight: '800', marginBottom: '8px' }}>
          PIRÁMIDE DEL AMOR • DIAGNÓSTICO VIBRACIONAL UNIFICADO
        </h2>
        <p style={{ fontSize: '13px', color: '#cbd5e1', maxWidth: '600px', margin: '0 auto 20px', lineHeight: '1.5' }}>
          Tu estado de conciencia ha sido calibrado integrando tus respuestas vivenciales y tu sintonización de frecuencia en los 11 niveles del Método Bénturi.
        </p>

        {/* Visualización Piramidal Adaptativa de 11 Niveles */}
        <div className="pyramid-container" style={{ margin: '20px auto 26px', maxWidth: '520px' }}>
          {Array.from({ length: totalLevels }, (_, i) => {
            const lv = totalLevels - i
            const isActive = lv === activeLv
            const widthPct = 25 + (i * (70 / totalLevels))
            const name = `${lv}. ${LEVEL_NAMES_11[lv] || ''}`
            const zoneCls = getLevelClass11(lv)

            return (
              <div
                key={lv}
                className={`pyramid-level ${zoneCls}${isActive ? ' active' : ''}`}
                style={{
                  width: `${widthPct}%`,
                  boxShadow: isActive ? '0 0 22px rgba(0, 229, 255, 0.85)' : 'none',
                  transform: isActive ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 0.3s ease'
                }}
              >
                <span>{name}</span>
              </div>
            )
          })}
        </div>

        {/* Tarjeta de Nivel Activo */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(10, 25, 47, 0.95))',
          border: '1.5px solid rgba(0, 229, 255, 0.4)',
          borderRadius: '14px',
          padding: '18px 20px',
          margin: '0 auto 20px',
          maxWidth: '560px',
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38bdf8', fontWeight: '700' }}>
            ESTADO VIBRACIONAL PREDOMINANTE EN LA PIRÁMIDE
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>
            Escalón {activeLv}: {LEVEL_NAMES_11[activeLv]}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Fecha de Calibración: {activeResult.date}
          </div>

          {isPremiumUnlocked ? (
            <>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', lineHeight: '1.5' }}>
                Nivel Situacional Vivencial: <strong style={{ color: '#38bdf8' }}>{activeResult.levelSit || activeLv}/11</strong> • Sintonización de Frecuencia: <strong style={{ color: '#38bdf8' }}>{activeResult.levelClas || activeLv}/11</strong>
              </div>

              {/* Plan de Acción */}
              {ACTION_PLANS_11[activeLv] && (
                <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#40e0d0', marginBottom: '8px' }}>
                    {ACTION_PLANS_11[activeLv].title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {ACTION_PLANS_11[activeLv].actions.map((act, idx) => (
                      <div key={idx} style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#38bdf8', flexShrink: 0 }}>✓</span>
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hitos No Vividos Detectados */}
              {activeResult.hitosFuturos && activeResult.hitosFuturos.length > 0 && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px dashed rgba(56, 189, 248, 0.4)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>
                    <span>🛡️</span>
                    <span>{activeResult.hitosFuturos.length} Hitos No Vividos Registrados (Indicadores para el Futuro)</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#cbd5e1', margin: '4px 0 8px', lineHeight: '1.4' }}>
                    Eventos potenciales que el Algoritmo Bénturi toma como referencia para no interpretar como vivencias pasadas:
                  </p>
                  <div style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {activeResult.hitosFuturos.slice(0, 4).map((h, i) => (
                      <div key={i} style={{ fontSize: '11px', color: '#94a3b8' }}>
                        • [{h.area}] <em>"{h.textoOpcion}"</em>
                      </div>
                    ))}
                    {activeResult.hitosFuturos.length > 4 && (
                      <div style={{ fontSize: '11px', color: '#38bdf8', fontStyle: 'italic' }}>
                        + {activeResult.hitosFuturos.length - 4} hitos más registrados en tu diagnóstico.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Vista bloqueada del análisis profundo para usuarios sin suscripción Premium */
            <div
              style={{
                marginTop: '16px',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.12), rgba(0, 229, 255, 0.08))',
                border: '1px dashed rgba(217, 70, 239, 0.5)',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#D946EF', marginBottom: '6px' }}>
                🔒 ANÁLISIS VIBRACIONAL Y PLAN DE ASCENSO BLOQUEADOS
              </div>
              <p style={{ fontSize: '12px !important', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                Tu escalón en la Pirámide del Amor ha quedado registrado. Continúa al <strong>Paso 2 (Matriz de 24 Cartas)</strong> para completar tu tirada y desbloquear tu análisis profundo junto con tu Informe de 24 Vectores.
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleResetQuiz}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '12px',
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: '8px'
          }}
        >
          🔄 Repetir Evaluación Vibracional
        </button>
      </div>
    )
  }

  // =========================================================================
  // VISTA DEL CUESTIONARIO INTEGRADO ACTIVO (ETAPA 1 + ETAPA 2 EN FLUJO CONTINUO)
  // =========================================================================
  return (
    <div className="stack" style={{ gap: '16px', width: '100%', maxWidth: '640px', margin: '0 auto' }}>

      {/* Indicador de Flujo Integrado de 2 Etapas */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(10, 25, 47, 0.85)',
        border: '1px solid rgba(0, 229, 255, 0.25)',
        borderRadius: '12px',
        padding: '10px 14px',
        gap: '12px'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: stage === 1 ? 1 : 0.65
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: stage === 1 ? '#00e5ff' : 'rgba(56, 189, 248, 0.2)',
            color: stage === 1 ? '#0a192f' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '800'
          }}>
            1
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: stage === 1 ? '#00e5ff' : '#94a3b8' }}>
              ETAPA 1: SITUACIONAL
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              48 Situaciones Vivenciales
            </div>
          </div>
        </div>

        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.2)' }}>→</div>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: stage === 2 ? 1 : 0.65
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: stage === 2 ? '#00e5ff' : 'rgba(56, 189, 248, 0.2)',
            color: stage === 2 ? '#0a192f' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '800'
          }}>
            2
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: stage === 2 ? '#00e5ff' : '#94a3b8' }}>
              ETAPA 2: SINTONIZACIÓN
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              55 Preguntas de Frecuencia
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* ETAPA 1: TEST SITUACIONAL (48 PREGUNTAS ABCD)              */}
      {/* ========================================================== */}
      {stage === 1 && (() => {
        const currentQ = PREGUNTAS_SITUACIONALES_48[sitIdx] || PREGUNTAS_SITUACIONALES_48[0]
        const factor = FACTORES_PIRAMIDE[currentQ.factor]
        const nivel = NIVELES_12[currentQ.level]
        const progressPct = Math.round(((sitIdx + 1) / PREGUNTAS_SITUACIONALES_48.length) * 100)

        return (
          <AnimatePresence mode="wait">
            <motion.div
              key={`sit-${currentQ.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {/* Barra de progreso y badges del Factor */}
              <div className="glass-card" style={{ padding: '14px 18px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: factor.color
                      }}
                    />
                    <span style={{ fontSize: '11px', fontWeight: '800', color: factor.color, letterSpacing: '0.04em' }}>
                      FACTOR {currentQ.factor} • {nivel.nombre}
                    </span>
                  </div>

                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>
                    Etapa 1: {progressPct}% ({sitIdx + 1}/48)
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                  Situación {currentQ.level}: {nivel.subtitulo}
                </div>

                <div className="progress-track" style={{ marginTop: '10px', height: '6px' }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${progressPct}%`,
                      background: `linear-gradient(90deg, #0284c7, ${factor.color})`
                    }}
                  />
                </div>
              </div>

              {/* Tarjeta de la Pregunta Situacional */}
              <div className="question-card" style={{ padding: '20px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8'
                  }}>
                    Área: {currentQ.area}
                  </span>

                  {sitIdx > 0 && (
                    <button
                      type="button"
                      onClick={() => setSitIdx(i => i - 1)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      ← Pregunta anterior
                    </button>
                  )}
                </div>

                <h3 style={{
                  fontSize: 'clamp(15px, 3.8vw, 17px)',
                  fontWeight: '600',
                  color: '#ffffff',
                  lineHeight: '1.45',
                  marginBottom: '18px'
                }}>
                  {currentQ.pregunta}
                </h3>

                {/* Opciones A, B, C, D */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentQ.opciones.map((opc) => {
                    const isD = opc.isFutureHito || opc.key === 'D'
                    return (
                      <button
                        key={opc.key}
                        type="button"
                        onClick={() => handleAnswerSituational(opc)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: isD ? '1.5px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: isD ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s ease',
                          width: '100%'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isD ? 'rgba(56, 189, 248, 0.18)' : 'rgba(30, 41, 59, 0.8)'
                          e.currentTarget.style.borderColor = isD ? '#38bdf8' : 'rgba(255, 255, 255, 0.3)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isD ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.6)'
                          e.currentTarget.style.borderColor = isD ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <div style={{
                          flexShrink: 0,
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: '800',
                          background: isD ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                          color: isD ? '#38bdf8' : '#e2e8f0',
                          border: isD ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)'
                        }}>
                          {opc.key}
                        </div>

                        <div style={{ flex: 1 }}>
                          {isD && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '10px',
                              fontWeight: '700',
                              color: '#38bdf8',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              marginBottom: '3px'
                            }}>
                              <span>🛡️ Hito No Vivido (Potencial Futuro)</span>
                            </div>
                          )}
                          <div style={{
                            fontSize: '13px',
                            color: isD ? '#e0f2fe' : '#e2e8f0',
                            lineHeight: '1.45'
                          }}>
                            {opc.texto}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )
      })()}

      {/* ========================================================== */}
      {/* ETAPA 2: SINTONIZACIÓN CLÁSICA (55 PREGUNTAS LIKERT)       */}
      {/* ========================================================== */}
      {stage === 2 && (() => {
        const currentQ = FASE2_QUESTIONS[clasIdx] || FASE2_QUESTIONS[0]
        const progressPct = Math.round(((clasIdx + 1) / FASE2_QUESTIONS.length) * 100)
        const zoneCls = getLevelClass11(currentQ.level)
        const zoneTitle = getLevelZone11(currentQ.level)

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="glass-card" style={{ padding: '14px 18px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`zone-pill ${zoneCls}`}>
                  {zoneTitle} • Escalón {currentQ.level} ({LEVEL_NAMES_11[currentQ.level]})
                </span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#40e0d0' }}>
                  Etapa 2: {progressPct}% ({clasIdx + 1}/55)
                </span>
              </div>
              <div className="progress-track" style={{ marginTop: '10px', height: '6px' }}>
                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div className="question-card" style={{ padding: '20px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>
                  PREGUNTA {clasIdx + 1} DE 55
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (clasIdx > 0) {
                      setClasIdx(i => i - 1)
                    } else {
                      // Volver a la última pregunta de la Etapa 1
                      setStage(1)
                      setSitIdx(PREGUNTAS_SITUACIONALES_48.length - 1)
                    }
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#40e0d0', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  ← {clasIdx > 0 ? 'Pregunta anterior' : 'Volver a Etapa 1'}
                </button>
              </div>

              <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', fontSize: '16px', fontWeight: '500', lineHeight: '1.5', marginBottom: '20px', color: '#ffffff' }}>
                {currentQ.text}
              </div>

              <div className="likert-scale">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    className="likert-btn"
                    onClick={() => handleAnswerClassic(n)}
                    aria-label={`${n} de 5`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="likert-labels" style={{ marginTop: '8px' }}>
                <div className="likert-label">1<br/>Totalmente<br/>desacuerdo</div>
                <div className="likert-label">2<br/>En<br/>desacuerdo</div>
                <div className="likert-label">3<br/>Neutral</div>
                <div className="likert-label">4<br/>De<br/>acuerdo</div>
                <div className="likert-label">5<br/>Totalmente<br/>de acuerdo</div>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}
