import { useState } from 'react'
import { HelpCircle, MessageSquare, ChevronDown, ChevronUp, Send, CheckCircle2 } from 'lucide-react'

const FAQ_ITEMS = [
  {
    category: 'El Algoritmo y los 3 Poderes',
    question: '¿Cómo funciona la Proyección de 6 Vectores-Cartas y por qué no es adivinación?',
    answer: 'El Algoritmo Bénturi opera bajo principios de causalidad y correlación probabilística. Las cartas actúan como vectores matemáticos que decodifican la vía de altísima probabilidad por la que viajas actualmente (Primer Poder: CONOCE), permitiéndote anticiparte y tomar decisiones conscientes.'
  },
  {
    category: 'El Algoritmo y los 3 Poderes',
    question: '¿Por qué se realiza un seguimiento a las 24h, 48h y 72h de la tirada de 6 cartas?',
    answer: 'La tirada gratuita de 6 vectores está diseñada para preguntas concretas a muy corto plazo. La ventana de 72 horas permite que compruebes por ti mismo cómo la proyección se ajusta a la realidad antes de dar el salto al sistema completo de los 3 Poderes.'
  },
  {
    category: 'Pirámide del Amor y 24 Cartas',
    question: '¿Por qué debo completar la Pirámide del Amor antes de la Matriz de 24 Cartas?',
    answer: 'La Matriz Profunda de 24 Cartas analiza hasta 322 billones de combinaciones en 4 filas temporales. El cuestionario de la Pirámide del Amor calibra tu nivel vibracional (Escalones 1 al 11) y tus vivencias para que el algoritmo ubique con exactitud qué fila corresponde a tu Pasado, Presente y Futuro.'
  },
  {
    category: 'Pirámide del Amor y 24 Cartas',
    question: '¿Qué diferencia hay entre la tirada de 6 cartas y la de 24 cartas?',
    answer: 'La tirada de 6 vectores responde a una consulta específica e incluye la técnica de Tiradas Cruzadas para triangular reacciones de terceros. La Matriz de 24 cartas es una radiografía panorámica general de tu vida dividida en las 5 facetas fundamentales: Trabajo, Dinero, Amor, Salud y Crecimiento Personal.'
  },
  {
    category: 'Suscripción y Facturación',
    question: '¿Qué incluye la suscripción Bénturi Premium (12,95 € / mes)?',
    answer: 'Incluye proyecciones ilimitadas de 6 vectores-cartas (ideales para triangular situaciones con Tiradas Cruzadas), 1 Proyección Profunda de 24 Cartas mensual con análisis completo de la Pirámide del Amor, y acceso total al tercer poder DECIDE.'
  },
  {
    category: 'Navegadores Móviles (TikTok / iOS / Android)',
    question: '¿Cómo instalo la App en mi teléfono o descargo mi informe en PDF si entré desde TikTok?',
    answer: 'Si has abierto Método Bénturi desde dentro de TikTok o Instagram, pulsa los 3 puntos (⋯) en la esquina superior derecha y selecciona "Abrir en el navegador" (Safari o Chrome). Desde ahí podrás pulsar "Instalar App" y descargar tus informes en PDF sin bloqueos.'
  }
]

export default function HelpCenterModal({ onClose, userEmail = '' }) {
  const [activeTab, setActiveTab] = useState('faq') // 'faq' | 'support'
  const [openIndex, setOpenIndex] = useState(0)
  const [email, setEmail] = useState(() => userEmail || localStorage.getItem('benturi_captured_email') || '')
  const [category, setCategory] = useState('Soporte Técnico')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [ticketSuccess, setTicketSuccess] = useState(null)
  const [error, setError] = useState('')

  const handleSendTicket = async (e) => {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, category, subject, message })
      })
      const data = await res.json()
      if (res.ok) {
        setTicketSuccess(data.message)
        setSubject('')
        setMessage('')
      } else {
        setError(data.error || 'No se pudo enviar tu consulta.')
      }
    } catch {
      setError('Error de conexión con el servidor de soporte.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog-box"
        style={{ maxWidth: '580px', width: '100%', maxHeight: '86vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px' }}>
            <HelpCircle size={20} color="#00E5FF" />
            CENTRO DE AYUDA Y SOPORTE (FAQ)
          </h2>
        </div>

        {/* Selector de pestañas: Preguntas Frecuentes vs Contacto Directo */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '10px',
              border: activeTab === 'faq' ? '1.5px solid #00E5FF' : '1px solid rgba(148,163,184,0.3)',
              background: activeTab === 'faq' ? 'rgba(0, 229, 255, 0.16)' : 'rgba(15, 23, 42, 0.6)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <HelpCircle size={15} />
            Preguntas Frecuentes
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('support'); setTicketSuccess(null); }}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '10px',
              border: activeTab === 'support' ? '1.5px solid #D946EF' : '1px solid rgba(148,163,184,0.3)',
              background: activeTab === 'support' ? 'rgba(217, 70, 239, 0.18)' : 'rgba(15, 23, 42, 0.6)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <MessageSquare size={15} />
            Soporte / Facturación
          </button>
        </div>

        {activeTab === 'faq' ? (
          <div className="stack" style={{ gap: '10px' }}>
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openIndex === idx
              return (
                <div
                  key={idx}
                  style={{
                    borderRadius: '12px',
                    border: isOpen ? '1px solid rgba(0, 229, 255, 0.5)' : '1px solid rgba(148, 163, 184, 0.22)',
                    background: isOpen ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.5)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                    style={{
                      width: '100%',
                      padding: '13px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#00E5FF', textTransform: 'uppercase', marginBottom: '2px' }}>
                        {item.category}
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: '700', lineHeight: '1.4' }}>
                        {item.question}
                      </div>
                    </div>
                    {isOpen ? <ChevronUp size={18} color="#00E5FF" /> : <ChevronDown size={18} color="#94a3b8" />}
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 16px 14px 16px',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: '#cbd5e1',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        paddingTop: '10px'
                      }}
                    >
                      {item.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div>
            {ticketSuccess ? (
              <div
                style={{
                  padding: '22px 18px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  textAlign: 'center'
                }}
              >
                <CheckCircle2 size={36} color="#34d399" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>
                  ¡TICKET DE SOPORTE ENVIADO!
                </div>
                <p style={{ fontSize: '13px !important', color: '#cbd5e1', lineHeight: '1.55', margin: 0 }}>
                  {ticketSuccess}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendTicket} className="stack" style={{ gap: '12px' }}>
                <p style={{ fontSize: '12.5px !important', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                  ¿Tienes alguna incidencia técnica o consulta sobre tu suscripción o facturación? Abre un ticket directo y nuestro equipo te responderá a tu correo.
                </p>

                {error && <p style={{ color: '#ff6b6b', fontSize: '12.5px', margin: 0 }}>{error}</p>}

                <div>
                  <label className="field-label">Tu Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Tipo de Consulta</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="Soporte Técnico">Soporte Técnico / Funcionamiento de la App</option>
                    <option value="Facturación y Suscripción">Facturación, Pagos y Suscripción</option>
                    <option value="Descarga de Informes PDF">Descarga de Informes PDF</option>
                    <option value="Otra Consulta">Otra Consulta</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Asunto</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Ej: Duda sobre mi suscripción Premium"
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Mensaje detallado</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Explícanos cómo podemos ayudarte..."
                    style={{ minHeight: '110px' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={sending}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Send size={16} />
                  {sending ? 'ENVIANDO TICKET...' : 'ENVIAR TICKET A SOPORTE'}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="dialog-actions" style={{ marginTop: '18px' }}>
          <button className="dialog-btn" onClick={onClose}>CERRAR</button>
        </div>
      </div>
    </div>
  )
}
