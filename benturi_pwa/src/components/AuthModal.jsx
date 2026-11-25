import { useState } from 'react'

export default function AuthModal({ onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const endpoint = isLogin ? '/api/login' : '/api/register'
      const res = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('benturi_token', data.token)
        onLoginSuccess(data.user, data.token)
      } else {
        setError(data.error || 'Error de autenticación')
      }
    } catch (err) {
      setError('Error de red al conectar con el servidor')
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-box" onClick={e => e.stopPropagation()}>
        <h2>{isLogin ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}</h2>
        {error && <p style={{color:'#ff6b6b', fontSize:'13px', marginBottom:'12px'}}>{error}</p>}

        <form onSubmit={handleSubmit} className="stack">
          <div>
            <label className="field-label">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" required />
          </div>
          <div>
            <label className="field-label">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn-primary mt-8">
            {isLogin ? 'ENTRAR' : 'REGISTRARME'}
          </button>
        </form>
        
        <div className="mt-16 text-center">
          <button className="dialog-btn" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
          </button>
        </div>
        
        <div className="dialog-actions">
          <button className="dialog-btn" onClick={onClose}>CERRAR</button>
        </div>
      </div>
    </div>
  )
}
