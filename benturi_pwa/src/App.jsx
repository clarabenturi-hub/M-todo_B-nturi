import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ParticlesBackground from './components/ParticlesBackground'
import InstallPrompt from './components/InstallPrompt'
import { LayoutDashboard, Layers, Network, Zap, Lock } from 'lucide-react'
import { useTexts } from './hooks/useTexts'
import { playBeep } from './utils/audio'

import AuthModal from './components/AuthModal'
import LegalFooter from './components/LegalFooter'
import HomeScreen from './pages/HomeScreen'
import Fase1Screen from './pages/Fase1Screen'
import Fase1_24Screen from './pages/Fase1_24Screen'
import Fase3Screen from './pages/Fase3Screen'
import AdminScreen from './pages/AdminScreen'
import SubscriptionScreen from './pages/SubscriptionScreen'

const NAV_ICONS = [
  <LayoutDashboard size={22} />,
  <Layers size={22} />,
  <Network size={22} />,
  <Zap size={22} />
]

export default function App() {
  const { t } = useTexts()
  const [tab, setTab] = useState(0)

  // Modo mantenimiento global activado (solo tú puedes saltarlo añadiendo ?dev_preview=1 a la URL)
  const isMaintenanceBypassed = typeof window !== 'undefined' && window.location.search.includes('dev_preview=1')
  const isMaintenanceMode = !isMaintenanceBypassed

  if (isMaintenanceMode) {
    return (
      <div
        className="app-root"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center'
        }}
      >
        <ParticlesBackground />
        <div
          className="glass-card-light"
          style={{
            maxWidth: '520px',
            width: '100%',
            padding: '40px 28px',
            borderRadius: '18px',
            border: '1.5px solid rgba(0, 229, 255, 0.45)',
            boxShadow: '0 0 40px rgba(0, 229, 255, 0.18)'
          }}
        >
          <div style={{ fontSize: '42px', marginBottom: '16px' }}>⚙️</div>
          <h1 className="shimmer-title" style={{ fontSize: 'clamp(20px, 5vw, 28px)', marginBottom: '14px' }}>
            ESTAMOS EN MANTENIMIENTO
          </h1>
          <p style={{ fontSize: '15px !important', color: '#cbd5e1', lineHeight: '1.65', margin: '0 auto' }}>
            Estamos realizando mejoras y actualizaciones en la plataforma del <strong>Método Bénturi</strong>. Volveremos a estar operativos muy pronto.
          </p>
        </div>
      </div>
    )
  }
  
  // Autenticación global
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('benturi_token') || null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // Control de desbloqueo de pestañas 24 CARTAS y DECIDE a las 72 horas de la tirada de 6
  const [tiradaTimestamp, setTiradaTimestamp] = useState(() => {
    const saved = localStorage.getItem('benturi_tirada6_timestamp')
    return saved ? Number(saved) : null
  })
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const syncTiradaTimestamp = () => {
      const saved = localStorage.getItem('benturi_tirada6_timestamp')
      setTiradaTimestamp(saved ? Number(saved) : null)
      setNowMs(Date.now())
    }
    window.addEventListener('benturi-tirada6-updated', syncTiradaTimestamp)
    window.addEventListener('storage', syncTiradaTimestamp)
    const timer = setInterval(() => setNowMs(Date.now()), 15000)
    return () => {
      window.removeEventListener('benturi-tirada6-updated', syncTiradaTimestamp)
      window.removeEventListener('storage', syncTiradaTimestamp)
      clearInterval(timer)
    }
  }, [])

  // Abrir pestaña 6 CARTAS si viene desde la notificación push (?tab=6cartas) o verificar Magic Link (?magic_token=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('tab') === '6cartas') {
      setTab(1)
    }
    const magicToken = urlParams.get('magic_token')
    if (magicToken) {
      fetch('/api/auth/verify-magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ magicToken })
      })
        .then(r => (r.ok ? r.json() : Promise.reject()))
        .then(data => {
          localStorage.setItem('benturi_token', data.token)
          setToken(data.token)
          setUser(data.user)
          window.history.replaceState({}, document.title, '/')
        })
        .catch(() => {
          alert('El enlace de acceso rápido ha expirado o no es válido.')
        })
    }
  }, [])

  const isTest72h = typeof window !== 'undefined' && window.location.search.includes('test72h=1')
  const is72hElapsed = isTest72h || (tiradaTimestamp !== null && (nowMs - tiradaTimestamp >= 72 * 60 * 60 * 1000))
  const isPremiumUnlocked = Boolean(user?.isPremium || user?.role === 'admin')

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchUser = () => {
    if (token) {
      fetch(`/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(r => {
        if (r.ok) return r.json()
        throw new Error("Token inválido")
      })
      .then(userData => setUser(userData))
      .catch(() => {
        localStorage.removeItem('benturi_token')
        setToken(null)
        setUser(null)
      })
    }
  }

  // Chequear estado de pago al volver de Redsys
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pago') === 'ok') {
      alert("¡PAGO COMPLETADO CON ÉXITO! Ya tienes acceso premium.")
      window.history.replaceState({}, document.title, "/")
      // Esperamos 1 segundo para dar tiempo al Webhook de Redsys y refrescamos el usuario
      setTimeout(() => fetchUser(), 1000)
    } else if (urlParams.get('pago') === 'ko') {
      alert("Error en el pago o cancelado por el usuario.")
      window.history.replaceState({}, document.title, "/")
    }
  }, [token])

  // Validar token con el backend al iniciar
  useEffect(() => {
    fetchUser()
  }, [token])

  const handleLoginSuccess = (userData, jwtToken) => {
    setUser(userData)
    setToken(jwtToken)
    setShowAuthModal(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('benturi_token')
    setToken(null)
    setUser(null)
  }

  const navItems = [
    { index: 0, label: t('navegacion','tab_1','INICIO'), icon: NAV_ICONS[0], locked: false },
    { index: 1, label: t('navegacion','tab_2','6 CARTAS'), icon: NAV_ICONS[1], locked: false },
    { index: 2, label: t('navegacion','tab_3','24 CARTAS'), icon: NAV_ICONS[2], locked: false },
    { index: 3, label: t('navegacion','tab_5','DECIDE'), icon: NAV_ICONS[3], locked: !isPremiumUnlocked },
  ]

  const screens = [
    <HomeScreen key="home" onNavigateTo6Cartas={() => setTab(1)} user={user} onLoginClick={() => setShowAuthModal(true)} onLogout={handleLogout} onNavigateToAdmin={() => setTab(4)} />,
    <Fase1Screen key="fase1" user={user} token={token} onQuickAuthSuccess={handleLoginSuccess} onNavigateToSubscription={() => setTab(5)} />,
    <Fase1_24Screen key="fase1_24" user={user} token={token} onLoginClick={() => setShowAuthModal(true)} onNavigateToSubscription={() => setTab(5)} />,
    <Fase3Screen key="fase3" user={user} token={token} onLoginClick={() => setShowAuthModal(true)} />,
    <AdminScreen key="admin" token={token} />,
    <SubscriptionScreen key="subscription" user={user} token={token} onLoginClick={() => setShowAuthModal(true)} onBack={() => setTab(2)} />
  ]

  return (
    <div className="app-root">
      <InstallPrompt />
      {isOffline && (
        <div style={{ backgroundColor: '#ff4d4d', color: 'white', textAlign: 'center', padding: '10px', position: 'fixed', top: 0, width: '100%', zIndex: 9999, fontWeight: 'bold' }}>
          Sin conexión a Internet. Algunas funciones pueden no estar disponibles.
        </div>
      )}
      <ParticlesBackground />
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onLoginSuccess={handleLoginSuccess} 
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3 }}
          style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
        >
          {screens[tab]}
        </motion.div>
      </AnimatePresence>

      <LegalFooter />

      <nav className="bottom-nav" aria-label="Navegación principal">
        {navItems.map((item) => (
          <button
            key={item.index}
            id={`nav-tab-${item.index}`}
            className={`nav-item${tab === item.index ? ' active' : ''}${item.locked ? ' locked' : ''}`}
            disabled={item.locked}
            onClick={() => {
              if (item.locked) return;
              playBeep(400 + item.index * 50, 'sine', 100);
              setTab(item.index);
            }}
            aria-label={item.label}
            aria-disabled={item.locked}
            title={item.locked ? 'Disponible con suscripción Bénturi Premium' : item.label}
            style={item.locked ? {
              opacity: 0.38,
              cursor: 'not-allowed',
              position: 'relative'
            } : { position: 'relative' }}
          >
            <span className="nav-icon" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.icon}
              {item.locked && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-8px',
                    background: 'rgba(15, 23, 42, 0.92)',
                    border: '1px solid rgba(217, 70, 239, 0.6)',
                    borderRadius: '50%',
                    width: '14px',
                    height: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D946EF'
                  }}
                >
                  <Lock size={9} strokeWidth={2.5} />
                </span>
              )}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <style>{`
        @keyframes pulse {
          from { box-shadow: 0 0 10px 3px rgba(127,179,213,0.6); }
          to   { box-shadow: 0 0 25px 8px rgba(127,179,213,1); }
        }
      `}</style>
    </div>
  )
}
