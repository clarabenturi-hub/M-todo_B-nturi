import { useTexts } from '../hooks/useTexts'

export default function Fase3Screen() {
  const { t } = useTexts()

  return (
    <div className="page stack">
      <div className="glass-card-light" style={{textAlign:'center'}}>
        <h1>{t('fase3','titulo','FASE 3: DECIDE')}</h1>
        <div className="subtitle mt-8">{t('fase3','subtitulo','OBJETIVIDAD RADICAL')}</div>
        <div className="mt-16">
          <iframe 
            style={{width: '100%', aspectRatio: '9/16', borderRadius: '12px', border: '1.5px solid rgba(127,179,213,0.4)', background: 'black', display: 'block'}} 
            src="https://www.youtube.com/embed/zPNb18SMVoo?rel=0&modestbranding=1&controls=0&vq=hd1080&iv_load_policy=3" 
            title="Vídeo Fase 3" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen>
          </iframe>
        </div>
      </div>

      <div className="glass-card">
        <h2>{t('fase3','titulo_efecto','EL EFECTO OBSERVADOR')}</h2>
        <p className="mt-12">{t('fase3','desc_efecto','Una vez que conoces la proyección de futuro y estás vibrando en la frecuencia del amor, el estar consciente en ese futuro cambiará esa proyección de alta probabilidad. Escribe cómo te ves a ti mismo con todo detalle, relájate y satura tu subconsciente.')}</p>
      </div>
    </div>
  )
}
