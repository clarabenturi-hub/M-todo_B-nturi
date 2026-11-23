import { useTexts } from '../hooks/useTexts'

export default function HomeScreen({ onNavigateTo6Cartas, user, onLoginClick, onLogout, onNavigateToAdmin }) {
  const { t } = useTexts()

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const handlePushSubscribe = async () => {
    if (!('serviceWorker' in navigator)) return;
    if (!user || !user.isPremium) {
      alert("Debes ser Premium para activar recordatorios.");
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = 'BEUPFhphS_YDpLxWb18rsXx7L4aRrS2uAmlz5enpF0rHHJamSWq3G9cRy1sLAN3w186Egtavgp85cmiIGFkFTYw';
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      const token = localStorage.getItem('benturi_token');
      await fetch(`/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscription)
      });
      alert("¡Recordatorios nocturnos activados con éxito!");
    } catch (e) {
      console.error(e);
      alert("No se pudo activar las notificaciones. Verifica los permisos de tu navegador.");
    }
  };

  return (
    <div className="page stack">
      <div className="home-header">
        {user ? (
          <button className="account-chip" onClick={onLogout}>🚪 Salir ({user.email})</button>
        ) : (
          <button className="account-chip" id="btn-mi-cuenta" onClick={onLoginClick}>👤 {t('dashboard','boton_cuenta','MI CUENTA')}</button>
        )}
      </div>

      {user?.role === 'admin' && (
        <button className="btn-primary" style={{backgroundColor: '#28a745', border: 'none', marginBottom: '16px'}} onClick={onNavigateToAdmin}>
          👑 PANEL DE CONTROL
        </button>
      )}

      {user?.isPremium && (
        <button className="btn-primary" style={{backgroundColor: '#8BB9D3', border: 'none', marginBottom: '16px'}} onClick={handlePushSubscribe}>
          🔔 ACTIVAR RECORDATORIO NOCTURNO
        </button>
      )}

      <div className="glass-card-light" style={{textAlign:'center'}}>
        <h1 className="shimmer-title">{t('dashboard','titulo_principal','MÉTODO BÉNTURI')}</h1>
        <div className="subtitle mt-8">{t('dashboard','subtitulo_principal','Antes de que vayáis a la tirada gratuita, es muy importante que veáis estos dos vídeos. Ahora nos vemos')}</div>
        
        <div className="mt-16">
          <iframe 
            style={{width: '100%', aspectRatio: '9/16', borderRadius: '12px', border: '1.5px solid rgba(127,179,213,0.4)', background: 'black', display: 'block'}} 
            src="https://www.youtube.com/embed/WbuCBy1jHkg?rel=0&modestbranding=1&controls=0&vq=hd1080&iv_load_policy=3" 
            title="¿Qué es el Método Bénturi?" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen>
          </iframe>
        </div>
      </div>

      <div className="glass-card">
        <h2>{t('dashboard','titulo_info','EL ALGORITMO BÉNTURI')}</h2>
        <p className="mt-12" style={{whiteSpace:'pre-line'}}>{t('dashboard','desc_info_1','El algoritmo Bénturi decodifica la proyección de futuro de altísima probabilidad. Algunos lo llamarán destino.\n\n¡Hola! Me llamo Clara Bénturi. El Método Bénturi se basa en tres poderes.')}</p>

        <div className="stack mt-16">
          <div className="power-item">
            <div className="power-title">{t('dashboard','poder_conoce_titulo','Conoce:')}</div>
            <div className="power-desc">{t('dashboard','poder_conoce_desc','Para cambiar tu futuro de altísima probabilidad, que algunos llamarán destino, primero tienes que conocerlo.')}</div>
          </div>
          <div className="power-item">
            <div className="power-title">{t('dashboard','poder_ama_titulo','Ama:')}</div>
            <div className="power-desc">{t('dashboard','poder_ama_desc','Adquiere el poder del amor para poder vibrar en la energía perfecta para el tercer poder.')}</div>
          </div>
          <div className="power-item">
            <div className="power-title">{t('dashboard','poder_decide_titulo','Decide:')}</div>
            <div className="power-desc">{t('dashboard','poder_decide_desc','Una vez que conocemos ese futuro de altísima probabilidad y vibramos en la energía del amor, seremos dueños del miedo y de la incertidumbre del futuro.')}</div>
          </div>
        </div>

        <button className="btn-cta" id="btn-decodifica" onClick={onNavigateTo6Cartas}>
          {t('dashboard','boton_decodifica','Algoritmo Bénturi Decodifica tu futuro')}
        </button>
      </div>
    </div>
  )
}
