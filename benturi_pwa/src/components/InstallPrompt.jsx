import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, ArrowDownToLine, Smartphone, X, ExternalLink } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import { detectInAppBrowser } from '../utils/analytics';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [inAppInfo, setInAppInfo] = useState({ isInApp: false, appName: null });
  const [dismissedInAppBanner, setDismissedInAppBanner] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isBrowserStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isNavigatorStandalone = window.navigator.standalone === true; 
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (!isBrowserStandalone && !isNavigatorStandalone && !isLocalhost) {
        setIsStandalone(false);
      } else {
        setIsStandalone(true);
      }
    };

    checkStandalone();
    setInAppInfo(detectInAppBrowser());
    
    const ua = window.navigator.userAgent;
    const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    setIsIOS(iOS);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
    
    window.addEventListener('appinstalled', () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setShowModal(false);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowModal(false);
      }
    } else if (inAppInfo.isInApp) {
      alert(`Estás navegando desde dentro de ${inAppInfo.appName}. Pulsa el icono de los 3 puntos (⋯) arriba a la derecha y selecciona "Abrir en el navegador" (Safari o Chrome) para poder instalar la App y descargar tus informes PDF.`);
    } else {
      alert("Para añadir Método Bénturi a tu pantalla de inicio, abre el menú de opciones de tu navegador (los 3 puntos ⋮ o el icono Compartir) y selecciona 'Añadir a la pantalla de inicio' o 'Instalar aplicación'.");
    }
  };

  if (isStandalone) return null;

  return (
    <>
      {/* 14. Banner inteligente para navegadores integrados de TikTok / Instagram / Facebook */}
      {inAppInfo.isInApp && !dismissedInAppBanner && (
        <div
          style={{
            position: 'fixed',
            top: '8px',
            left: '10px',
            right: '10px',
            zIndex: 9500,
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(11, 25, 44, 0.98))',
            border: '1.5px solid #00E5FF',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            color: '#ffffff',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', lineHeight: '1.4' }}>
            <ExternalLink size={18} color="#00E5FF" style={{ flexShrink: 0 }} />
            <div>
              <strong>Navegador de {inAppInfo.appName} detectado:</strong> Para instalar la App o descargar tu PDF, pulsa <strong>⋯</strong> arriba a la derecha y elige <strong>«Abrir en el navegador»</strong>.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissedInAppBanner(true)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            aria-label="Cerrar aviso"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Botón flotante sutil */}
      {!showModal && (
        <button 
          onClick={() => setShowModal(true)}
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--blue-accent)',
            borderRadius: '50px',
            padding: '10px 16px',
            color: 'var(--blue-accent)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: '700',
            fontFamily: "'Inter', sans-serif",
            boxShadow: '0 4px 15px rgba(0,229,255,0.2)',
            zIndex: 9000,
            cursor: 'pointer'
          }}
        >
          <ArrowDownToLine size={16} />
          Instalar App
        </button>
      )}

      {/* Modal de Instalación */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 6, 23, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          color: '#FFF',
          fontFamily: "'Montserrat', sans-serif"
        }} onClick={() => setShowModal(false)}>
          
          <Tilt className="glass-card-light" tiltMaxAngleX={5} tiltMaxAngleY={5} style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '40px 24px', position: 'relative' }}>
            <div 
              style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', opacity: 0.7 }}
              onClick={(e) => { e.stopPropagation(); setShowModal(false); }}
            >
              <X size={24} color="#FFF" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }} onClick={e => e.stopPropagation()}>
              <div style={{ width: '80px', height: '80px', background: 'rgba(0, 229, 255, 0.1)', borderRadius: '20px', border: '1px solid var(--blue-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,229,255,0.3)' }}>
                <Smartphone size={40} color="var(--blue-accent)" />
              </div>
            </div>
            
            <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '16px', letterSpacing: '1px' }}>INSTALA LA APP</h1>
            <p style={{ color: 'var(--blue-mid)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              Para la mejor experiencia inmersiva en el Método Bénturi, instala el acceso directo en la pantalla de inicio de tu teléfono.
            </p>

            {inAppInfo.isInApp && (
              <div style={{ background: 'rgba(217, 70, 239, 0.14)', border: '1px solid rgba(217, 70, 239, 0.5)', borderRadius: '10px', padding: '12px', marginBottom: '16px', textAlign: 'left', fontSize: '12px', lineHeight: '1.5', color: '#f8fafc' }} onClick={e => e.stopPropagation()}>
                <strong>⚠️ Estás dentro de {inAppInfo.appName}:</strong> Toca primero los <strong>3 puntos (⋯)</strong> arriba a la derecha y selecciona <strong>«Abrir en el navegador»</strong> (Safari o Chrome).
              </div>
            )}

            {isIOS ? (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
                <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '16px', color: '#FFF' }}>Instrucciones para iPhone / iPad (Safari):</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }}><Share size={20} color="var(--blue-mid)" /></div>
                  <p style={{ fontSize: '12px', color: 'var(--blue-mid)', margin: 0 }}>1. Toca el botón <strong>Compartir</strong> en la barra de Safari.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }}><PlusSquare size={20} color="var(--blue-mid)" /></div>
                  <p style={{ fontSize: '12px', color: 'var(--blue-mid)', margin: 0 }}>2. Selecciona <strong>Añadir a pantalla de inicio</strong>.</p>
                </div>
              </div>
            ) : (
              <button 
                className="btn-primary" 
                onClick={(e) => { e.stopPropagation(); handleInstallClick(); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '50px' }}
              >
                <ArrowDownToLine size={18} />
                INSTALAR BÉNTURI
              </button>
            )}
          </Tilt>
        </div>
      )}
    </>
  );
}
