import { useState } from 'react'
import { useTexts } from '../hooks/useTexts'

export default function SubscriptionScreen({ user, token, onLoginClick, onBack }) {
  const { t } = useTexts()
  const [loadingPlan, setLoadingPlan] = useState(null)

  const handleSubscribe = async (planKey) => {
    if (!user || !token) {
      onLoginClick()
      return
    }

    setLoadingPlan(planKey)
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: planKey })
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
        alert('Error al generar la solicitud de pago en el servidor.')
        setLoadingPlan(null)
      }
    } catch (err) {
      console.error(err)
      alert('Error de conexión con la pasarela de pago.')
      setLoadingPlan(null)
    }
  }

  return (
    <div className="page stack">
      <div className="glass-card-light" style={{ textAlign: 'center' }}>
        <div className="paywall-badge" style={{ display: 'inline-block', marginBottom: '8px' }}>
          {t('suscripcion', 'etiqueta_acceso', 'HOJA DE RUTA TOTAL DEL MÉTODO BÉNTURI')}
        </div>
        <h1 style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', lineHeight: '1.3' }}>
          PASA DE ESPECTADOR A ARQUITECTO DE TU VIDA
        </h1>
        <div className="subtitle mt-8" style={{ textTransform: 'none', fontSize: '13px', lineHeight: '1.5', opacity: 0.9 }}>
          Por el precio de un café a la semana, accede al sistema completo de decodificación algorítmica y calibración vibracional.
        </div>
      </div>

      {/* PLAN 1: BÉNTURI DESPEGUE */}
      <div className="paywall-card" style={{ border: '1.5px solid rgba(127, 179, 213, 0.45)' }}>
        <div className="paywall-badge">PLAN MENSUAL</div>
        <h2 style={{ textAlign: 'center', color: '#ffffff', marginTop: '8px' }}>BÉNTURI DESPEGUE</h2>
        <div className="paywall-price mt-12">9,95 €</div>
        <div className="paywall-freq">/ mes</div>

        <div className="stack mt-16" style={{ gap: '12px', textAlign: 'left' }}>
          <div className="paywall-benefit">
            <span className="paywall-benefit-icon">✅</span>
            <div>
              <div className="paywall-benefit-title">12 PROYECCIONES DE ALTA PROBABILIDAD DE FUTURO MENSUALES</div>
              <p>Acceso a tiradas de 6 vectores-cartas para tus decisiones clave del mes.</p>
            </div>
          </div>
          <div className="paywall-benefit">
            <span className="paywall-benefit-icon">✅</span>
            <div>
              <div className="paywall-benefit-title">1 PROYECCIÓN PROFUNDA DE 24 CARTAS MENSUAL</div>
              <p>Decodificación completa de la matriz 4x6 (Pasado, Presente y Futuro).</p>
            </div>
          </div>
          <div className="paywall-benefit">
            <span className="paywall-benefit-icon">✅</span>
            <div>
              <div className="paywall-benefit-title">EVALUACIÓN EN LA PIRÁMIDE DEL AMOR</div>
              <p>Diagnóstico vibracional para tu ascenso y sintonización en la energía adecuada para tu éxito.</p>
            </div>
          </div>
        </div>

        <button
          className="btn-primary mt-24"
          id="btn-suscribir-despegue"
          style={{ width: '100%' }}
          onClick={() => handleSubscribe('despegue')}
          disabled={loadingPlan !== null}
        >
          {loadingPlan === 'despegue' ? 'CONECTANDO CON BANCO (REDSYS)...' : 'SUSCRIBIRME A BÉNTURI DESPEGUE (9,95 €)'}
        </button>
      </div>

      {/* PLAN 2: BÉNTURI PREMIUM */}
      <div className="paywall-card" style={{ border: '2px solid #d946ef', boxShadow: '0 0 28px rgba(217, 70, 239, 0.25)' }}>
        <div className="paywall-badge" style={{ background: 'linear-gradient(90deg, #d946ef, #00e5ff)', color: '#fff', fontWeight: '800' }}>
          RECOMENDADO · ACCESO ILIMITADO
        </div>
        <h2 style={{ textAlign: 'center', color: '#ffffff', marginTop: '8px' }}>BÉNTURI PREMIUM</h2>
        <div className="paywall-price mt-12">12,95 €</div>
        <div className="paywall-freq">/ mes</div>

        <div className="stack mt-16" style={{ gap: '12px', textAlign: 'left' }}>
          <div className="paywall-benefit">
            <span className="paywall-benefit-icon">✅</span>
            <div>
              <div className="paywall-benefit-title">ILIMITADAS PROYECCIONES DE ALTA PROBABILIDAD DE FUTURO</div>
              <p>Son perfectas para triangular tiradas vectores-cartas (Tiradas Cruzadas sin límite).</p>
            </div>
          </div>
          <div className="paywall-benefit">
            <span className="paywall-benefit-icon">✅</span>
            <div>
              <div className="paywall-benefit-title">1 PROYECCIÓN PROFUNDA DE 24 CARTAS MENSUAL</div>
              <p>Lectura panorámica de 322 billones de probabilidades en las 5 facetas vitales.</p>
            </div>
          </div>
          <div className="paywall-benefit">
            <span className="paywall-benefit-icon">✅</span>
            <div>
              <div className="paywall-benefit-title">EVALUACIÓN EN LA PIRÁMIDE DEL AMOR</div>
              <p>Calibración continua para tu ascenso vibracional y éxito personal.</p>
            </div>
          </div>
        </div>

        <button
          className="btn-dark mt-24 glass-btn"
          id="btn-suscribir-premium"
          style={{ width: '100%', background: 'linear-gradient(135deg, #d946ef, #7c3aed)', color: '#fff', border: 'none', fontWeight: '800' }}
          onClick={() => handleSubscribe('premium')}
          disabled={loadingPlan !== null}
        >
          {loadingPlan === 'premium' ? 'CONECTANDO CON BANCO (REDSYS)...' : 'SUSCRIBIRME A BÉNTURI PREMIUM (12,95 €)'}
        </button>

        <div className="paywall-legal mt-12">
          {t('suscripcion', 'texto_legal', 'Pago 100% seguro tramitado directamente por el TPV de tu banco (Redsys).')}
        </div>
      </div>

      {onBack && (
        <button
          type="button"
          className="btn-secondary"
          style={{ width: '100%' }}
          onClick={onBack}
        >
          ← Volver
        </button>
      )}
    </div>
  )
}
