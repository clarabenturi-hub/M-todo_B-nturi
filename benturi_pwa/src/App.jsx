import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ParticlesBackground from './components/ParticlesBackground'
import InstallPrompt from './components/InstallPrompt'
import { LayoutDashboard, Layers, Network, Zap } from 'lucide-react'
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

  // Abrir pestaña 6 CARTAS si viene desde la notificación push (?tab=6cartas)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('tab') === '6cartas') {
      setTab(1)
    }
  }, [])

  const isTest72h = typeof window !== 'undefined' && window.location.search.includes('test72h=1')
  const is72hElapsed = isTest72h || (tiradaTimestamp !== null && (nowMs - tiradaTimestamp >= 72 * 60 * 60 * 1000))
  const canSeeAdvancedTabs = Boolean(user?.isPremium || user?.role === 'admin' || is72hElapsed)

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
    { index: 0, label: t('navegacion','tab_1','INICIO'), icon: NAV_ICONS[0], visible: true },
    { index: 1, label: t('navegacion','tab_2','6 CARTAS'), icon: NAV_ICONS[1], visible: true },
    { index: 2, label: t('navegacion','tab_3','24 CARTAS'), icon: NAV_ICONS[2], visible: canSeeAdvancedTabs },
    { index: 3, label: t('navegacion','tab_5','DECIDE'), icon: NAV_ICONS[3], visible: canSeeAdvancedTabs },
  ].filter(item => item.visible)

  const screens = [
    <HomeScreen key="home" onNavigateTo6Cartas={() => setTab(1)} user={user} onLoginClick={() => setShowAuthModal(true)} onLogout={handleLogout} onNavigateToAdmin={() => setTab(4)} />,
    <Fase1Screen key="fase1" onNavigateToSubscription={() => setTab(5)} />,
    <Fase1_24Screen key="fase1_24" user={user} token={token} onLoginClick={() => setShowAuthModal(true)} />,
    <Fase3Screen key="fase3" user={user} token={token} onLoginClick={() => setShowAuthModal(true)} />,
    <AdminScreen key="admin" token={token} />,
    <SubscriptionScreen key="subscription" user={user} token={token} onLoginClick={() => setShowAuthModal(true)} onBack={() => setTab(1)} />
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
            className={`nav-item${tab === item.index ? ' active' : ''}`}
            onClick={() => {
              playBeep(400 + item.index * 50, 'sine', 100);
              setTab(item.index);
            }}
            aria-label={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
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
