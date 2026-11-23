import { useState, useRef } from 'react'
import { useTexts } from '../hooks/useTexts'

export default function Fase3Screen() {
  const { t } = useTexts()
  const [text, setText] = useState(() => localStorage.getItem('benturi-vision') || '')
  const [isListening, setIsListening] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null)
  const [generatedReport, setGeneratedReport] = useState(null)
  const recognitionRef = useRef(null)

  const toggleListening = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      alert(t('fase3','alerta_microfono','El reconocimiento de voz no está disponible o no tiene permisos en tu navegador.'))
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const recognition = new Recognition()
    recognition.lang = 'es-ES'
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onresult = e => {
      const transcript = e.results[e.results.length - 1][0].transcript
      setText(prev => prev ? `${prev} ${transcript}` : transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const handleMaterialize = async () => {
    if (!text.trim()) {
      alert(t('fase3','alerta_vacia','Escribe algo en la sala de scripting primero.'))
      return
    }

    localStorage.setItem('benturi-vision', text)
    setIsGenerating(true)
    setGeneratedImageUrl(null)
    setGeneratedReport(null)

    try {
      const token = localStorage.getItem('benturi_token');
      const resp = await fetch(`/api/generate-vision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: text.trim() })
      });
      if (resp.ok) {
        const data = await resp.json();
        setGeneratedReport(data.report);
        setGeneratedImageUrl(data.imageUrl);
      } else {
        setGeneratedReport("Debes ser usuario Premium o iniciar sesión para acceder a la IA.");
      }
    } catch (_) {
      setGeneratedReport("No pudimos conectar con el servidor cuántico.");
    }

    setIsGenerating(false);
  }

  return (
    <div className="page stack">
      <div className="glass-card-light" style={{textAlign:'center'}}>
        <h1>{t('fase3','titulo','FASE 3: DECIDE')}</h1>
        <div className="subtitle mt-8">{t('fase3','subtitulo','OBJETIVIDAD RADICAL')}</div>
        <div className="mt-16">
          <iframe 
            style={{width: '100%', aspectRatio: '9/16', borderRadius: '12px', border: '1.5px solid rgba(127,179,213,0.4)', background: 'black'}} 
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

      <div className="glass-card">
        <h2>{t('fase3','titulo_scripting','SALA DE SCRIPTING')}</h2>
        <p className="mt-8" style={{fontSize:'12px'}}>{t('fase3','desc_scripting','Describe tu proyección con todo detalle. Escríbelo en presente, como si ya estuvieras allí. Involucra olores, emociones y entorno físico.')}</p>

        <div className="scripting-box mt-24">
          <textarea
            id="scripting-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t('fase3','placeholder_scripting','Ej: Estoy sentado en mi nueva oficina, puedo sentir el tacto del escritorio de madera...')}
          />
          <button
            className={`mic-btn${isListening ? ' listening' : ''}`}
            id="btn-microfono"
            onClick={toggleListening}
            title={isListening ? 'Detener' : 'Dictar'}
          >
            🎤
          </button>
        </div>
        <div className="mic-status">
          {isListening
            ? t('fase3','estado_escuchando','Escuchando... vuelve a pulsar para detener.')
            : t('fase3','estado_microfono','Pulsa el micrófono para hablar.')}
        </div>

        <button
          className="btn-primary mt-24"
          id="btn-materializar"
          disabled={isGenerating || text.trim().length < 20}
          onClick={handleMaterialize}
        >
          {isGenerating
            ? t('fase3','btn_materializando','MATERIALIZANDO...')
            : t('fase3','btn_materializar','MATERIALIZAR VISUALIZACIÓN (IA)')}
        </button>

        {generatedReport && (
          <div className="ai-report-box mt-24">
            <div className="ai-report-title">{t('fase3','titulo_informe','INFORME CUÁNTICO')}</div>
            <div className="ai-report-text">{generatedReport}</div>
          </div>
        )}

        <div className="image-area mt-16">
          {isGenerating ? (
            <div className="generating-spinner">
              <div className="spinner" />
              <p style={{color:'#154360', fontSize:'12px'}}>GENERANDO IMAGEN CUÁNTICA...</p>
            </div>
          ) : generatedImageUrl ? (
            <img src={generatedImageUrl} alt="Visualización cuántica" />
          ) : (
            <div className="image-area-placeholder">
              <p>[ {t('fase3','area_imagen','Área de Generación Cuántica de Imágenes')} ]</p>
              <p className="mt-8" style={{fontSize:"13px", color:"var(--blue-mid)", opacity: 0.8}}>
                {t('fase3','desc_imagen','El algoritmo creará una representación visual de tu texto para que la mires cada noche antes de dormir.')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
