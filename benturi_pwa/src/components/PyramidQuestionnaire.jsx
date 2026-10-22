import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PREGUNTAS_SITUACIONALES_48, 
  FACTORES_PIRAMIDE, 
  NIVELES_12, 
  ACTION_PLANS_12, 
  calculateSituationalPyramid 
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
  onReset 
}) {
  // Modalidad de cuestionario: 'situacional_48' (nuevo) o 'clasico_55' (existente)
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem('benturi_quiz_mode') || 'situacional_48'
    } catch {
      return 'situacional_48'
    }
  })

  // Estado para el modo Situacional (48 preguntas)
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

  // Estado para el modo Clásico (55 preguntas)
  const [clasAnswers, setClasAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem('benturi_fase2_answers')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [clasIdx, setClasIdx] = useState(() => {
    try {
      const saved = localStorage.getItem('benturi_fase2_answers')
      if (saved) {
        const count = Object.keys(JSON.parse(saved)).length
        if (count > 0 && count < FASE2_QUESTIONS.length) return count
      }
      return 0
    } catch {
      return 0
    }
  })

  // Estado de finalización y diagnóstico
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

  // Guardar cambio de modo
  const handleSwitchMode = (newMode) => {
    setMode(newMode)
    try {
      localStorage.setItem('benturi_quiz_mode', newMode)
    } catch (e) {
      console.error(e)
    }
  }

  // Responder en modo Situacional (48)
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
      // Cuestionario completado
      const diagResult = calculateSituationalPyramid(updated)
      diagResult.tipo = 'situacional_48'
      setActiveResult(diagResult)
      setIsDone(true)

      try {
        localStorage.setItem('benturi_active_pyramid_result', JSON.stringify(diagResult))
        localStorage.setItem('benturi_fase2_result', JSON.stringify(diagResult))
        localStorage.setItem('benturi_fase2_answers', JSON.stringify(updated))
      } catch (e) {
        console.error(e)
      }

      if (onComplete) {
        onComplete({
          tipo: 'situacional_48',
          result: diagResult,
          answers: updated
        })
      }
    }
  }

  // Responder en modo Clásico (55)
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
      localStorage.setItem('benturi_fase2_answers', JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }

    if (clasIdx < FASE2_QUESTIONS.length - 1) {
      setClasIdx(i => i + 1)
    } else {
      let totalScore = 0
      Object.values(updated).forEach(a => { totalScore += (Number(a.score) || 0) })
      let level = Math.floor((totalScore - 55) / 20) + 1
      if (level < 1) level = 1
      if (level > 11) level = 11

      const diagResult = {
        tipo: 'clasico_55',
        activeLevel: level,
        levelName: LEVEL_NAMES_11[level],
        zone: getLevelZone11(level),
        totalScore,
        maxPossibleScore: 275,
        date: new Date().toLocaleDateString('es-ES')
      }

      setActiveResult(diagResult)
      setIsDone(true)

      try {
        localStorage.setItem('benturi_active_pyramid_result', JSON.stringify(diagResult))
        localStorage.setItem('benturi_fase2_result', JSON.stringify(diagResult))
      } catch (e) {
        console.error(e)
      }

      if (onComplete) {
        onComplete({
          tipo: 'clasico_55',
          result: diagResult,
          answers: updated
        })
      }
    }
  }

  // Reiniciar cuestionario
  const handleResetQuiz = () => {
    setIsDone(false)
    if (mode === 'situacional_48') {
      setSitIdx(0)
      setSitAnswers({})
      localStorage.removeItem('benturi_sit48_answers')
    } else {
      setClasIdx(0)
      setClasAnswers({})
      localStorage.removeItem('benturi_fase2_answers')
    }
    localStorage.removeItem('benturi_active_pyramid_result')
    localStorage.removeItem('benturi_fase2_result')
    if (onReset) onReset()
  }

  // Renderizado cuando el cuestionario ya está finalizado (PIRÁMIDE REVELADA)
  if (isDone && activeResult) {
    const isSit = activeResult.tipo === 'situacional_48' || !!activeResult.factorId
    const activeLv = activeResult.activeLevel || 1
    const totalLevels = isSit ? 12 : 11

    return (
      <div className="glass-card" style={{ padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
          <span className="zone-pill" style={{ background: 'rgba(0, 229, 255, 0.15)', borderColor: 'rgba(0, 229, 255, 0.4)', color: '#38bdf8' }}>
            {isSit ? '🎯 Test Situacional (12 Peldaños)' : '⚡ Test Rápido (55 Preguntas)'}
          </span>
          <span className="zone-pill" style={{ background: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.4)', color: '#34d399' }}>
            {activeResult.zone || 'CALIBRADO'}
          </span>
        </div>

        <h2 style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', color: '#ffffff', fontWeight: '800', marginBottom: '8px' }}>
          DIAGNÓSTICO VIBRACIONAL ALCANZADO
        </h2>
        <p style={{ fontSize: '13px', color: '#cbd5e1', maxWidth: '600px', margin: '0 auto 20px', lineHeight: '1.5' }}>
          Tu frecuencia ha sido identificada con precisión. El Algoritmo utilizará este diagnóstico para sintonizar el eje temporal del pasado y las proyecciones futuras de la matriz.
        </p>

        {/* Visualización Piramidal Adaptativa */}
        <div className="pyramid-container" style={{ margin: '20px auto 26px', maxWidth: '520px' }}>
          {Array.from({ length: totalLevels }, (_, i) => {
            const lv = totalLevels - i
            const isActive = lv === activeLv
            const widthPct = 25 + (i * (70 / totalLevels))
            const levelInfo = isSit ? NIVELES_12[lv] : null
            const name = isSit ? `${lv}. ${levelInfo?.nombre || ''}` : `${lv}. ${LEVEL_NAMES_11[lv] || ''}`
            const zoneCls = isSit 
              ? (lv <= 4 ? 'material' : lv <= 8 ? 'mental' : 'espiritual')
              : getLevelClass11(lv)

            return (
              <div
                key={lv}
                className={`pyramid-level ${zoneCls}${isActive ? ' active' : ''}`}
                style={{ 
                  width: `${widthPct}%`, 
                  boxShadow: isActive ? '0 0 20px rgba(0, 229, 255, 0.8)' : 'none',
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
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(10, 25, 47, 0.9))',
          border: '1.5px solid rgba(0, 229, 255, 0.4)',
          borderRadius: '14px',
          padding: '18px 20px',
          margin: '0 auto 20px',
          maxWidth: '560px',
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38bdf8', fontWeight: '700' }}>
            {isSit && activeResult.factorNombre ? activeResult.factorNombre : 'ESTADO VIBRACIONAL PREDOMINANTE'}
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>
            Escalón {activeLv}: {activeResult.levelName}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Puntuación obtenida: <strong style={{ color: '#38bdf8' }}>{activeResult.totalScore}</strong> {isSit ? 'puntos' : `/ 275`} • Fecha: {activeResult.date}
          </div>

          {/* Plan de Acción */}
          <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#40e0d0', marginBottom: '8px' }}>
              {isSit ? ACTION_PLANS_12[activeLv]?.title : ACTION_PLANS_11[activeLv]?.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(isSit ? ACTION_PLANS_12[activeLv]?.actions : ACTION_PLANS_11[activeLv]?.actions)?.map((act, idx) => (
                <div key={idx} style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#38bdf8' }}>✓</span>
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tarjeta de Hitos Futuros (Opción D en test situacional) */}
          {isSit && activeResult.hitosFuturos && activeResult.hitosFuturos.length > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px dashed rgba(56, 189, 248, 0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>
                <span>🛡️</span>
                <span>{activeResult.hitosFuturos.length} Hitos No Vividos Detectados (Indicador de Futuro)</span>
              </div>
              <p style={{ fontSize: '11px', color: '#cbd5e1', margin: '4px 0 8px', lineHeight: '1.4' }}>
                Al marcar "Jamás me ha ocurrido" en estas situaciones, el motor de Bénturi las indexa como eventos potenciales no cristalizados para el análisis de futuro:
              </p>
              <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {activeResult.hitosFuturos.slice(0, 5).map((h, i) => (
                  <div key={i} style={{ fontSize: '11px', color: '#94a3b8' }}>
                    • [{h.area}] <em>"{h.textoOpcion}"</em>
                  </div>
                ))}
                {activeResult.hitosFuturos.length > 5 && (
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontStyle: 'italic' }}>
                    + {activeResult.hitosFuturos.length - 5} situaciones más registradas en tu informe.
                  </div>
                )}
              </div>
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
          🔄 Repetir o cambiar modalidad de cuestionario
        </button>
      </div>
    )
  }

  // ==================== VISTA DEL CUESTIONARIO ACTIVO ====================
  return (
    <div className="stack" style={{ gap: '16px', width: '100%', maxWidth: '640px', margin: '0 auto' }}>
      
      {/* Selector de Modalidad (Pestañas Superiores) */}
      <div style={{
        display: 'flex',
        background: 'rgba(10, 25, 47, 0.75)',
        border: '1px solid rgba(127, 179, 213, 0.25)',
        borderRadius: '12px',
        padding: '4px',
        gap: '4px'
      }}>
        <button
          type="button"
          onClick={() => handleSwitchMode('situacional_48')}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: '9px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '12px',
            transition: 'all 0.2s ease',
            background: mode === 'situacional_48' ? 'linear-gradient(135deg, #0284c7, #0ea5e9)' : 'transparent',
            color: mode === 'situacional_48' ? '#ffffff' : '#94a3b8',
            boxShadow: mode === 'situacional_48' ? '0 4px 12px rgba(14, 165, 233, 0.3)' : 'none'
          }}
        >
          🎯 Test Situacional (48 Preguntas)
          <span style={{ display: 'block', fontSize: '10px', opacity: 0.85, fontWeight: '500' }}>
            12 Peldaños • Opción Inmunidad
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchMode('clasico_55')}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: '9px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '12px',
            transition: 'all 0.2s ease',
            background: mode === 'clasico_55' ? 'linear-gradient(135deg, #0284c7, #0ea5e9)' : 'transparent',
            color: mode === 'clasico_55' ? '#ffffff' : '#94a3b8',
            boxShadow: mode === 'clasico_55' ? '0 4px 12px rgba(14, 165, 233, 0.3)' : 'none'
          }}
        >
          ⚡ Escala Rápida (55 Preguntas)
          <span style={{ display: 'block', fontSize: '10px', opacity: 0.85, fontWeight: '500' }}>
            Escala Likert 1 a 5
          </span>
        </button>
      </div>

      {/* ========================================================== */}
      {/* MODO 1: TEST SITUACIONAL (48 PREGUNTAS ABCD)              */}
      {/* ========================================================== */}
      {mode === 'situacional_48' && (() => {
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
                    {progressPct}% ({sitIdx + 1}/48)
                  </span>
                </div>

                {/* Subtítulo del nivel */}
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                  Peldaño {currentQ.level}: {nivel.subtitulo}
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

              {/* Tarjeta de la Pregunta */}
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

                {/* Texto de la situación */}
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
                        {/* Círculo indicador A, B, C, D */}
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

                        {/* Texto de la opción */}
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
      {/* MODO 2: ESCALA RÁPIDA CLÁSICA (55 PREGUNTAS LIKERT)        */}
      {/* ========================================================== */}
      {mode === 'clasico_55' && (() => {
        const currentQ = FASE2_QUESTIONS[clasIdx] || FASE2_QUESTIONS[0]
        const progressPct = Math.round(((clasIdx + 1) / FASE2_QUESTIONS.length) * 100)
        const zoneCls = getLevelClass11(currentQ.level)
        const zoneTitle = getLevelZone11(currentQ.level)

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="glass-card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`zone-pill ${zoneCls}`}>
                  {zoneTitle}
                </span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#40e0d0' }}>
                  {progressPct}% ({clasIdx + 1}/55)
                </span>
              </div>
              <div className="progress-track" style={{ marginTop: '10px', height: '6px' }}>
                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div className="question-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>
                  PREGUNTA {clasIdx + 1} DE 55
                </span>
                {clasIdx > 0 && (
                  <button
                    type="button"
                    onClick={() => setClasIdx(i => i - 1)}
                    style={{ background: 'transparent', border: 'none', color: '#40e0d0', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    ← Anterior
                  </button>
                )}
              </div>

              <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', fontSize: '16px', fontWeight: '500', lineHeight: '1.5', marginBottom: '20px' }}>
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
