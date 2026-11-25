import { useState } from 'react'

export default function AuthModal({ onClose, onLoginSuccess }) {
  // Modo por defecto: Acceso Rápido sin contraseña (Tráfico Frío / Magic Link) o Con Contraseña
  const [authMode, setAuthMode] = useState('quick') // 'quick' | 'password'
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sendMagicEmail, setSendMagicEmail] = useState(true)
  const [error, setError] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleQuickAccess = async (e) => {
    e.preventDefault()
    setError('')
    setInfoMsg('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/quick-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sendMagicLink: sendMagicEmail })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('benturi_token', data.token)
        localStorage.setItem('benturi_captured_email', data.user.email)
        if (data.lastReport?.reportMarkdown) {
          localStorage.setItem('benturi_tirada6_saved_report', data.lastReport.reportMarkdown)
          localStorage.setItem('benturi_tirada6_saved_question', data.lastReport.question || '')
        }
        onLoginSuccess(data.user, data.token)
      } else {
        setError(data.error || 'No se pudo iniciar el acceso rápido')
      }
    } catch {
      setError('Error de red al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = isLogin ? '/api/login' : '/api/register'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('benturi_token', data.token)
        localStorage.setItem('benturi_captured_email', data.user.email)
        onLoginSuccess(data.user, data.token)
      } else {
        setError(data.error || 'Error de autenticación')
      }
    } catch {
      setError('Error de red al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-box" onClick={e => e.stopPropagation()}>
        <h2>{authMode === 'quick' ? '⚡ ACCESO RÁPIDO EN 1 CLIC' : (isLogin ? 'INICIAR SESIÓN' : 'CREAR CUENTA')}</h2>

        {/* Selector de modo: Entrada sin fricción vs Email + Contraseña */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => { setAuthMode('quick'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '10px',
              border: authMode === 'quick' ? '1.5px solid #00E5FF' : '1px solid rgba(148,163,184,0.3)',
              background: authMode === 'quick' ? 'rgba(0, 229, 255, 0.16)' : 'rgba(15, 23, 42, 0.6)',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            ⚡ Sin Contraseña (1 Clic)
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('password'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '10px',
              border: authMode === 'password' ? '1.5px solid #D946EF' : '1px solid rgba(148,163,184,0.3)',
              background: authMode === 'password' ? 'rgba(217, 70, 239, 0.18)' : 'rgba(15, 23, 42, 0.6)',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            🔑 Con Contraseña
          </button>
        </div>

        {error && <p style={{color:'#ff6b6b', fontSize:'13px', marginBottom:'12px'}}>{error}</p>}
        {infoMsg && <p style={{color:'#40e0d0', fontSize:'13px', marginBottom:'12px'}}>{infoMsg}</p>}

        {authMode === 'quick' ? (
          <form onSubmit={handleQuickAccess} className="stack">
            <p style={{ fontSize: '12.5px !important', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '4px' }}>
              Introduce tu correo electrónico para guardar tu historial de proyecciones, activar tu secuencia de seguimiento de 3 días y entrar al instante sin contraseñas.
            </p>
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#a4ebf3', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={sendMagicEmail}
                onChange={e => setSendMagicEmail(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#00E5FF' }}
              />
              Enviarme también un enlace mágico (Magic Link) a mi correo
            </label>
            <button type="submit" className="btn-primary mt-8" disabled={loading}>
              {loading ? 'CONECTANDO...' : 'ENTRAR EN 1 CLIC →'}
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handlePasswordSubmit} className="stack">
              <div>
                <label className="field-label">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" required />
              </div>
              <div>
                <label className="field-label">Contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn-primary mt-8" disabled={loading}>
                {loading ? 'VALIDANDO...' : (isLogin ? 'ENTRAR' : 'REGISTRARME')}
              </button>
            </form>

            <div className="mt-16 text-center">
              <button className="dialog-btn" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
              </button>
            </div>
          </>
        )}
        
        <div className="dialog-actions">
          <button className="dialog-btn" onClick={onClose}>CERRAR</button>
        </div>
      </div>
    </div>
  )
}
