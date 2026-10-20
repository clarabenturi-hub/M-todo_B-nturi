import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ParticlesBackground from './components/ParticlesBackground'
import InstallPrompt from './components/InstallPrompt'
import { LayoutDashboard, Layers, Network, Zap } from 'lucide-react'
import { useTexts } from './hooks/useTexts'
import { playBeep } from './utils/audio'

import AuthModal from './components/AuthModal'
import HomeScreen from './pages/HomeScreen'
import Fase1Screen from './pages/Fase1Screen'
import Fase1_24Screen from './pages/Fase1_24Screen'
import Fase3Screen from './pages/Fase3Screen'
import AdminScreen from './pages/AdminScreen'

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

  const navLabels = [
    t('navegacion','tab_1','INICIO'),
    t('navegacion','tab_2','6 CARTAS'),
    t('navegacion','tab_3','24 CARTAS'),
    t('navegacion','tab_5','DECIDE'),
  ]

  const screens = [
    <HomeScreen key="home" onNavigateTo6Cartas={() => setTab(1)} user={user} onLoginClick={() => setShowAuthModal(true)} onLogout={handleLogout} onNavigateToAdmin={() => setTab(4)} />,
    <Fase1Screen key="fase1" />,
    <Fase1_24Screen key="fase1_24" user={user} token={token} onLoginClick={() => setShowAuthModal(true)} />,
    <Fase3Screen key="fase3" />,
    <AdminScreen key="admin" token={token} />
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

      <nav className="bottom-nav" aria-label="Navegación principal">
        {navLabels.map((label, i) => (
          <button
            key={i}
            id={`nav-tab-${i}`}
            className={`nav-item${tab === i ? ' active' : ''}`}
            onClick={() => {
              playBeep(400 + i * 50, 'sine', 100);
              setTab(i);
            }}
            aria-label={label}
          >
            <span className="nav-icon">{NAV_ICONS[i]}</span>
            {label}
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
