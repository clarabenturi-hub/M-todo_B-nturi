import { useState, useRef, useEffect } from 'react'
import { useTexts } from '../hooks/useTexts'
import { useCombinations } from '../hooks/useCombinations'
import Dialog from '../components/Dialog'
import CardSelectorModal from '../components/CardSelectorModal'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { FULL_DECK } from '../constants/appData'
import { generarPDFDesdeMarkdown, stripEmojis } from '../utils/pdf_generator.js'
import { generateDeterministicReport } from '../utils/brain_engine.js'

const REMINDER_MESSAGES = [
  {
    hours: 24,
    key: 'benturi_notified_24h',
    title: '¿Se cumplió tu proyección de 6 vectores?',
    body: 'Ya han pasado 24 horas desde tu tirada. Si ya has comprobado que el algoritmo no falla, imagina lo que puedes hacer teniéndolo disponible todo el tiempo. ¡¡Mucha suerte ! Aunque probablemente con el método Bénturi y por el precio de un café a la semana ,ya no te haga falta'
  },
  {
    hours: 48,
    key: 'benturi_notified_48h',
    title: '¿Se cumplió tu proyección de 6 vectores?',
    body: 'Ya han pasado 48 horas desde tu tirada. Si ya has comprobado que el algoritmo no falla, imagina lo que puedes hacer teniéndolo disponible todo el tiempo. ¡¡Mucha suerte ! Aunque probablemente con el método Bénturi y por el precio de un café a la semana ,ya no te haga falta'
  },
  {
    hours: 72,
    key: 'benturi_notified_72h',
    title: '¿Se cumplió tu proyección de 6 vectores?',
    body: 'Ya han pasado 72 horas desde tu tirada. Si ya has comprobado que el algoritmo no falla, imagina lo que puedes hacer teniéndolo disponible todo el tiempo. ¡¡Mucha suerte ! Aunque probablemente con el método Bénturi y por el precio de un café a la semana ,ya no te haga falta.'
  }
];

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getOrCreateDeviceId() {
  try {
    let devId = localStorage.getItem('benturi_device_id');
    if (!devId) {
      const randomPart = Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      devId = `bdev_${randomPart}`;
      localStorage.setItem('benturi_device_id', devId);
    }
    return devId;
  } catch {
    return 'bdev_fallback';
  }
}

export default function Fase1Screen({ user, token, onQuickAuthSuccess, onNavigateToSubscription }) {
  const { t, tList } = useTexts()
  const getMeaning = useCombinations()

  const [question, setQuestion] = useState('')
  const [quickEmail, setQuickEmail] = useState(() => {
    return user?.email || localStorage.getItem('benturi_captured_email') || ''
  })
  const [quotaBlockMessage, setQuotaBlockMessage] = useState('')
  const [timeLock, setTimeLock] = useState('En las próximas 78 horas')
  const [selectedCards, setSelectedCards] = useState(Array(6).fill(null))
  const [cardModalIndex, setCardModalIndex] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [codeStream, setCodeStream] = useState('')
  const [result, setResult] = useState(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [showApuestasDialog, setShowApuestasDialog] = useState(false)
  const [showProcedimientoDialog, setShowProcedimientoDialog] = useState(false)
  const [showVentajaPopup, setShowVentajaPopup] = useState(false)
  const [acceptedLegal, setAcceptedLegal] = useState(false)

  // Control de ocultación del botón de descarga y desbloqueo a las 72 horas
  const [tiradaTimestamp, setTiradaTimestamp] = useState(() => {
    const saved = localStorage.getItem('benturi_tirada6_timestamp');
    return saved ? Number(saved) : null;
  })
  const [hideDownloadBtn, setHideDownloadBtn] = useState(() => {
    return localStorage.getItem('benturi_tirada6_hide_download') === 'true';
  })
  const [nowMs, setNowMs] = useState(() => Date.now())

  const isTest72h = typeof window !== 'undefined' && window.location.search.includes('test72h=1');
  const is72hElapsed = isTest72h || (tiradaTimestamp !== null && (nowMs - tiradaTimestamp >= 72 * 60 * 60 * 1000));

  // Streaming states
  const [streamedReport, setStreamedReport] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamError, setStreamError] = useState(false)
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0)

  const streamTimer = useRef(null)

  const timeLockOptions = tList('fase1','opciones_candado',['En las próximas 78 horas'])

  // Programar recordatorios de 24h, 48h y 72h en Web Push y almacenamiento local
  const scheduleThreeReminders = async (baseTs) => {
    const ts = baseTs || Date.now();
    localStorage.setItem('benturi_tirada6_timestamp', String(ts));
    localStorage.removeItem('benturi_notified_24h');
    localStorage.removeItem('benturi_notified_48h');
    localStorage.removeItem('benturi_notified_72h');
    setTiradaTimestamp(ts);
    window.dispatchEvent(new Event('benturi-tirada6-updated'));

    try {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = 'BEUPFhphS_YDpLxWb18rsXx7L4aRrS2uAmlz5enpF0rHHJamSWq3G9cRy1sLAN3w186Egtavgp85cmiIGFkFTYw';
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
        await fetch('/api/push/schedule-6-reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub, baseTimestamp: ts })
        });
      }
    } catch (e) {
      console.warn('Recordatorios locales activados (Push opcional no disponible):', e);
    }
  };

  // Comprobar periódicamente si se han cumplido las 24h, 48h o 72h
  useEffect(() => {
    const checkReminders = async () => {
      const currentNow = Date.now();
      setNowMs(currentNow);
      const savedTs = localStorage.getItem('benturi_tirada6_timestamp');
      if (!savedTs) return;
      const elapsedHours = (currentNow - Number(savedTs)) / (1000 * 60 * 60);

      for (const rem of REMINDER_MESSAGES) {
        if (elapsedHours >= rem.hours && localStorage.getItem(rem.key) !== 'true') {
          localStorage.setItem(rem.key, 'true');
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready;
                reg.showNotification(rem.title, {
                  body: rem.body,
                  icon: '/icon-192.png',
                  badge: '/icon-192.png'
                });
              } else {
                new Notification(rem.title, { body: rem.body, icon: '/icon-192.png' });
              }
            }
          } catch (e) {
            console.warn('No se pudo mostrar notificación local:', e);
          }
        }
      }
    };

    checkReminders();
    const timer = setInterval(checkReminders, 30000);
    return () => clearInterval(timer);
  }, [tiradaTimestamp]);

  const handleSelectCard = (card) => {
    const next = [...selectedCards]
    next[cardModalIndex] = card
    setSelectedCards(next)
    setCardModalIndex(null)
  }

  const startStreamingReport = async (resData) => {
    setIsStreaming(true);
    setStreamedReport('');
    setStreamError(false);
    setQuotaBlockMessage('');
    const deviceId = getOrCreateDeviceId();
    const activeEmail = (user?.email || quickEmail || localStorage.getItem('benturi_captured_email') || '').trim().toLowerCase();

    try {
      // Si el usuario de tráfico frío introdujo su correo y aún no tenía sesión, iniciamos sesión sin fricción en 1 clic
      let activeToken = token || localStorage.getItem('benturi_token');
      if (activeEmail && !user) {
        try {
          const authResp = await fetch('/api/auth/quick-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: activeEmail, sendMagicLink: false })
          });
          if (authResp.ok) {
            const authData = await authResp.json();
            activeToken = authData.token;
            localStorage.setItem('benturi_token', authData.token);
            localStorage.setItem('benturi_captured_email', activeEmail);
            if (onQuickAuthSuccess) onQuickAuthSuccess(authData.user, authData.token);
          }
        } catch (e) {
          console.warn('No se pudo crear sesión rápida automática:', e);
        }
      }

      const headers = {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId
      };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const resp = await fetch('/api/generate-report', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question,
          result: resData,
          email: activeEmail,
          deviceId
        })
      });

      if (resp.status === 429) {
        const errData = await resp.json().catch(() => ({}));
        setQuotaBlockMessage(
          errData.error ||
          'Ya has utilizado tu proyección gratuita de 6 vectores (límite de 1 consulta por usuario, dispositivo e IP).'
        );
        setIsStreaming(false);
        return;
      }

      if (!resp.ok) throw new Error('Error en la API');
      
      const reader = resp.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let fullText = '';
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
              try {
                const data = JSON.parse(line.substring(6));
                fullText += data.text;
                setStreamedReport(fullText);
              } catch(e) {}
            }
          }
        }
      }
      if (fullText) {
        const nowTs = Date.now();
        localStorage.setItem('benturi_tirada6_saved_report', fullText);
        localStorage.setItem('benturi_tirada6_saved_question', resData?.question || question);
        // Al visualizar el informe completo, se programan las 3 notificaciones Web Push (24h, 48h, 72h)
        scheduleThreeReminders(nowTs);
        // Guardar en el historial vinculado al correo y activar la secuencia de emails (24h, 48h, 72h y 96h)
        if (activeEmail) {
          fetch('/api/reports/save-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: activeEmail,
              readingType: '6cartas',
              question: resData?.question || question,
              reportMarkdown: fullText,
              baseTimestamp: nowTs
            })
          }).catch(() => {});
        }
      }
    } catch(err) {
      setStreamError(true);
      console.error(err);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      if (streamedReport) {
        await generarPDFDesdeMarkdown(streamedReport, "Informe de Proyección Determinista - Método Bénturi");
        // Ocultar el botón de descargar informe una vez descargado
        localStorage.setItem('benturi_tirada6_hide_download', 'true');
        setHideDownloadBtn(true);
        if (!localStorage.getItem('benturi_tirada6_timestamp')) {
          scheduleThreeReminders(Date.now());
        }
      } else {
        alert("El informe aún no se ha generado correctamente.");
      }
    } catch(err) {
      alert("Hubo un error al generar el PDF.");
      console.error(err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCloseReportModal = () => {
    if (streamedReport && !streamError) {
      // Una vez el usuario ha podido visualizar su informe, se oculta el botón de descargar informe
      localStorage.setItem('benturi_tirada6_hide_download', 'true');
      setHideDownloadBtn(true);
    }
    setResult(null);
    setSelectedCards(Array(6).fill(null));
    setQuestion('');
    setStreamedReport('');
  };

  const handleProject = () => {
    if (!question.trim()) {
      alert(t('fase1','alerta_variable_vacia','El Algoritmo requiere una Variable de Consulta válida.'))
      return
    }
    const emailToUse = (user?.email || quickEmail || '').trim()
    if (!emailToUse || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse)) {
      alert('Introduce tu correo electrónico para guardar tu historial y activar el seguimiento de tu proyección.')
      return
    }
    if (!acceptedLegal) {
      alert('Debes aceptar el Aviso Legal, la Exención de Responsabilidad y las Condiciones de Uso antes de iniciar la proyección.')
      return
    }

    const filled = [...selectedCards]
    const remaining = FULL_DECK.filter(c => !filled.some(s => s?.id === c.id))
    const shuffled = remaining.sort(() => Math.random() - 0.5)
    let ri = 0
    for (let i = 0; i < 6; i++) {
      if (!filled[i]) filled[i] = shuffled[ri++]
    }
    setSelectedCards(filled)

    setIsProcessing(true)
    setCodeStream('')

    const HEX = '0123456789ABCDEF'
    streamTimer.current = setInterval(() => {
      let s = ''
      for (let i = 0; i < 50; i++) s += HEX[Math.floor(Math.random() * 16)]
      setCodeStream(s)
    }, 50)

    setTimeout(() => {
      clearInterval(streamTimer.current)
      setCodeStream(t('fase1','estado_completado','PROYECCIÓN DE ALTA PROBABILIDAD ESTABLECIDA.\n\nCOLAPSO DE ONDA FINALIZADO.'))

      setTimeout(() => {
        setIsProcessing(false)

        const c1 = filled[0].spanishName, c2 = filled[1].spanishName
        const c3 = filled[2].spanishName, c4 = filled[3].spanishName
        const c5 = filled[4].spanishName, c6 = filled[5].spanishName

        const newResult = {
          question,
          timeLock,
          cards: filled,
          m1: getMeaning(c1, c2),
          m2: getMeaning(c3, c4),
          m3: getMeaning(c5, c6),
          c1, c2, c3, c4, c5, c6,
        };
        setResult(newResult);
        startStreamingReport(newResult);
      }, 600)
    }, 1500)
  }

  useEffect(() => () => clearInterval(streamTimer.current), [])

  const loadingMessages = [
    "Sintonizando tu frecuencia vibracional...",
    "Decodificando 329 billones de probabilidades...",
    "Alineando vectores con el Primer Poder...",
    "Analizando correlaciones energéticas...",
    "Estructurando tu Hoja de Ruta..."
  ];

  useEffect(() => {
    let interval;
    if (isStreaming && !streamedReport) {
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 6000);
    } else {
      setLoadingMsgIndex(0);
    }
    return () => clearInterval(interval);
  }, [isStreaming, streamedReport]);

  const alreadySelected = selectedCards.filter(Boolean)
  const timeLockList = timeLockOptions.length > 0 ? timeLockOptions : ['En las próximas 78 horas']

  return (
    <div className="page stack">
      <div className="glass-card-light" style={{textAlign:'center'}}>
        <h1>{t('fase1','titulo_algoritmo','Algoritmo Bénturi Decodifica tu futuro')}</h1>
        <div className="subtitle mt-8">{t('fase1','subtitulo','AISLAMIENTO INDIVIDUAL')}</div>
        <div className="mt-16">
          <iframe 
            style={{width: '100%', aspectRatio: '9/16', borderRadius: '12px', border: '1.5px solid rgba(127,179,213,0.4)', background: 'black'}} 
            src="https://www.youtube.com/embed/JMFfrap6sk4?rel=0&modestbranding=1&controls=0&vq=hd1080&iv_load_policy=3" 
            title="Vídeo Fase 1" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen>
          </iframe>
        </div>
      </div>

      <div className="glass-card">
        <h2>EL ALGORITMO BÉNTURI</h2>
        <p className="mt-12">{t('fase1','desc_algoritmo','Haz una pregunta concreta sobre algo que quieres conocer a muy corto plazo (Reunión, pareja, venta de inmueble, etc.)')}</p>
        <div className="mt-16" style={{textAlign:'center'}}>
          <button className="btn-outline" id="btn-apuestas-azar" onClick={() => setShowApuestasDialog(true)}>
            ⚡ {t('fase1','btn_apuestas','Apuestas y azar')}
          </button>
        </div>
      </div>

      <div className="info-box">
        <span className="info-icon">ℹ️</span>
        <p>{t('fase1','desc_escenario','Define con total precisión el escenario sobre el cual deseas proyectar tu futuro de alta probabilidad.')}</p>
      </div>

      <div className="glass-card">
        <h2>{t('fase1','titulo_parametros','ESTABLECER PARÁMETROS')}</h2>
        <div className="mt-24">
          <label className="field-label" style={{ fontSize: '14px', lineHeight: '1.6', fontWeight: '400', display: 'block', marginBottom: '8px' }}>
            {t('fase1','label_variable','Variable de Consulta (Actor + Acción):')}
          </label>
          <input
            id="input-variable-consulta"
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder={t('fase1','placeholder_variable','Ej: ¿Conseguiré el nuevo trabajo...')}
          />
        </div>

        {/* 11. Captura directa de correo sin fricción para tráfico frío */}
        {!user && (
          <div className="mt-16">
            <label className="field-label" style={{ fontSize: '13.5px', lineHeight: '1.5', fontWeight: '600', color: '#00E5FF', display: 'block', marginBottom: '8px' }}>
              ⚡ Tu Correo Electrónico (Acceso sin contraseña · Guarda tu informe y activa el seguimiento de 72h):
            </label>
            <input
              id="input-quick-email-6cartas"
              type="email"
              value={quickEmail}
              onChange={e => setQuickEmail(e.target.value)}
              placeholder="Ej: tu@correo.com"
            />
          </div>
        )}
      </div>

      <div>
        <div className="shuffle-header">
          <div>
            <h2>{t('fase1','titulo_matriz','Matriz Vectores probabilísticos (Cartas)')}</h2>
            <button
              className="btn-outline mt-8"
              style={{fontSize:'12px', padding:'4px 12px'}}
              id="btn-procedimiento"
              onClick={() => setShowProcedimientoDialog(true)}
            >
              ℹ️ Procedimiento
            </button>
          </div>
        </div>

        <div className="card-grid mt-16">
          {selectedCards.map((card, idx) => (
            <div
              key={idx}
              className={`card-slot${card ? ' filled' : ''}`}
              id={`card-slot-${idx+1}`}
              onClick={() => setCardModalIndex(idx)}
            >
              {card ? (
                <img src={card.img} alt={card.spanishName} />
              ) : (
                <>
                  <div className="card-slot-plus">+</div>
                  <div className="card-slot-label">Vector-Carta</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Checkbox obligatorio previo a la tirada gratuita */}
      <div
        className="glass-card"
        style={{
          padding: '14px 18px',
          borderRadius: '12px',
          border: acceptedLegal ? '1.5px solid rgba(0, 229, 255, 0.55)' : '1px solid rgba(217, 70, 239, 0.38)',
          background: acceptedLegal ? 'rgba(0, 229, 255, 0.07)' : 'rgba(15, 23, 42, 0.72)',
          transition: 'all 0.25s ease'
        }}
      >
        <label
          htmlFor="checkbox-legal-tirada6"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <input
            id="checkbox-legal-tirada6"
            type="checkbox"
            checked={acceptedLegal}
            onChange={e => setAcceptedLegal(e.target.checked)}
            style={{
              width: '20px',
              height: '20px',
              marginTop: '2px',
              accentColor: '#00E5FF',
              flexShrink: 0,
              cursor: 'pointer'
            }}
          />
          <span
            style={{
              fontSize: '12.5px',
              lineHeight: '1.5',
              color: '#e2e8f0',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            He leído y acepto el{' '}
            <span
              role="link"
              aria-disabled="true"
              style={{
                color: 'rgba(164, 235, 243, 0.6)',
                textDecoration: 'underline',
                cursor: 'not-allowed'
              }}
            >
              Aviso Legal
            </span>
            , la{' '}
            <span
              role="link"
              aria-disabled="true"
              style={{
                color: 'rgba(164, 235, 243, 0.6)',
                textDecoration: 'underline',
                cursor: 'not-allowed'
              }}
            >
              Exención de Responsabilidad
            </span>
            , las{' '}
            <span
              role="link"
              aria-disabled="true"
              style={{
                color: 'rgba(164, 235, 243, 0.6)',
                textDecoration: 'underline',
                cursor: 'not-allowed'
              }}
            >
              Condiciones de Uso
            </span>{' '}
            y la{' '}
            <span
              role="link"
              aria-disabled="true"
              style={{
                color: 'rgba(164, 235, 243, 0.6)',
                textDecoration: 'underline',
                cursor: 'not-allowed'
              }}
            >
              Política de Privacidad
            </span>
            . Comprendo que esta proyección de 6 vectores es orientativa, no sustituye consejo médico, legal o financiero profesional, y que soy el único responsable de mis decisiones.
          </span>
        </label>
      </div>

      <button
        className="btn-primary"
        id="btn-colapsar-onda"
        onClick={handleProject}
        disabled={!question.trim() || !acceptedLegal || !(user?.email || quickEmail.trim())}
      >
        {t('fase1','btn_colapsar_onda','Iniciar proyección de futuro de alta probabilidad')}
      </button>

      {is72hElapsed && (
        <button
          type="button"
          className="btn-primary"
          id="btn-unete-ventaja-main"
          style={{
            background: 'linear-gradient(135deg, #d946ef, #00e5ff)',
            color: '#ffffff',
            fontWeight: '800',
            border: 'none',
            boxShadow: '0 0 24px rgba(217, 70, 239, 0.45)'
          }}
          onClick={() => setShowVentajaPopup(true)}
        >
          Únete a los que ya juegan con ventaja
        </button>
      )}

      {result && (
        <Dialog 
          title="INFORME CUÁNTICO EN TIEMPO REAL" 
          onClose={handleCloseReportModal}
          actions={
            <div className="stack" style={{width: '100%', gap: '8px'}}>
              {!hideDownloadBtn && (
                <button
                  className="btn-primary"
                  style={{width: '100%', margin: 0, background: isStreaming ? 'grey' : 'var(--magenta-primary)', color: 'white', border: 'none'}}
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf || isStreaming || streamError}
                >
                  {isStreaming ? 'ESCRIBIENDO INFORME...' : (isGeneratingPdf ? 'GENERANDO PDF...' : 'DESCARGAR INFORME (PDF)')}
                </button>
              )}
              {is72hElapsed && (
                <button
                  type="button"
                  className="btn-primary"
                  id="btn-unete-ventaja-modal"
                  style={{
                    width: '100%',
                    margin: 0,
                    background: 'linear-gradient(135deg, #d946ef, #00e5ff)',
                    color: '#ffffff',
                    fontWeight: '800',
                    border: 'none'
                  }}
                  onClick={() => setShowVentajaPopup(true)}
                >
                  Únete a los que ya juegan con ventaja
                </button>
              )}
              <button
                className="btn-secondary"
                style={{width: '100%', margin: 0, opacity: 0.8, fontSize: '11px'}}
                onClick={handleCloseReportModal}
              >
                CERRAR Y HACER OTRA PREGUNTA
              </button>
            </div>
          }
        >
          <div>
            <p style={{fontStyle:'italic', marginBottom:'16px', opacity: 0.8}}>
              Con respecto a tu consulta sobre: <strong style={{color: 'var(--blue-accent)'}}>"{result.question}"</strong>
            </p>
            
            <div className="glass-card-light custom-scroll-container report-content-markdown" style={{padding: '16px', marginBottom: '10px', maxHeight: '46vh', overflowY: 'auto', overflowX: 'hidden', wordBreak: 'break-word', overflowWrap: 'anywhere', textAlign: 'left', color: '#FFFFFF', fontSize: '14px', lineHeight: '1.6'}}>
              {quotaBlockMessage ? (
                <div style={{ textAlign: 'center', padding: '14px 8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#00E5FF', marginBottom: '10px' }}>
                    🛡️ LÍMITE DE PRUEBA GRATUITA ALCANZADO
                  </div>
                  <p style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '1.6', marginBottom: '14px' }}>
                    {quotaBlockMessage}
                  </p>
                </div>
              ) : streamError ? (
                <span style={{color: '#ff6b6b'}}>Hubo un error de red generando el informe. Por favor, inténtalo de nuevo.</span>
              ) : (
                <>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]} 
                    rehypePlugins={[rehypeRaw]}
                  >
                    {stripEmojis(streamedReport) || loadingMessages[loadingMsgIndex]}
                  </ReactMarkdown>
                  {isStreaming && <span className="cursor-blink" style={{marginLeft: '4px'}}>|</span>}
                </>
              )}
            </div>

            {/* Pie de pantalla constante en los informes de 6 cartas */}
            <div
              id="report-6-constant-legal-footer"
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(2, 6, 23, 0.88)',
                border: '1px solid rgba(0, 229, 255, 0.28)',
                borderLeft: '3px solid #D946EF',
                fontSize: '11px',
                lineHeight: '1.45',
                color: 'rgba(226, 232, 240, 0.85)',
                textAlign: 'left',
                marginBottom: '8px'
              }}
            >
              <strong style={{ color: '#00E5FF' }}>⚖️ AVISO LEGAL Y EXENCIÓN DE RESPONSABILIDAD:</strong> Este informe de 6 vectores ofrece orientación probabilística y autoconocimiento; no constituye diagnóstico médico, psicológico, jurídico ni financiero. El usuario mantiene siempre su libre albedrío y la responsabilidad exclusiva sobre sus decisiones.
            </div>
            
            {!isStreaming && !streamError && !hideDownloadBtn && (
              <p className="mt-16" style={{fontWeight:'700', color:'var(--blue-mid)'}}>
                El informe ha sido completado con éxito. Ahora puedes descargarlo en formato PDF.
              </p>
            )}
            {isStreaming && !streamError && (
              <p className="mt-16" style={{fontWeight:'700', color:'var(--green-accent)'}}>
                Generando respuesta cuántica en tiempo real...
              </p>
            )}
          </div>
        </Dialog>
      )}

      {showVentajaPopup && (
        <Dialog
          title="MÉTODO BÉNTURI"
          onClose={() => setShowVentajaPopup(false)}
        >
          <div style={{ textAlign: 'center', padding: '8px 4px' }}>
            <p style={{ fontSize: '15px', lineHeight: '1.65', color: '#ffffff', marginBottom: '20px' }}>
              Ya ves que el Método Bénturi ha ajustado la proyección. Es un algoritmo, no es adivinación. Mucha suerte, aunque probablemente con el Método Bénturi y por el precio de un café a la semana ya no te hará falta.
            </p>
            <a
              href="#suscripcion"
              id="link-suscribete-aqui"
              onClick={(e) => {
                e.preventDefault();
                setShowVentajaPopup(false);
                if (onNavigateToSubscription) onNavigateToSubscription();
              }}
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #d946ef, #00e5ff)',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '15px',
                textDecoration: 'underline',
                boxShadow: '0 4px 18px rgba(217, 70, 239, 0.45)',
                cursor: 'pointer'
              }}
            >
              Suscríbete aquí
            </a>
          </div>
        </Dialog>
      )}

      {cardModalIndex !== null && (
        <CardSelectorModal
          selectedCards={alreadySelected}
          onSelect={handleSelectCard}
          onClose={() => setCardModalIndex(null)}
        />
      )}

      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-title">
            {t('fase1','estado_analizando','ANALIZANDO MILLONES DE COMBINACIONES')}
          </div>
          <div className={`code-stream${codeStream.startsWith('PROYECCIÓN') ? ' completed' : ''}`} style={{whiteSpace:'pre-line'}}>
            {codeStream}
          </div>
        </div>
      )}

      {showApuestasDialog && (
        <Dialog title="Apuestas y azar" onClose={() => setShowApuestasDialog(false)}>
          <p>{t('fase1','dialogo_apuestas','El Algoritmo Bénturi opera bajo principios de causalidad y probabilidad personal. Por diseño técnico, no es un sistema apto para la predicción de eventos de azar, apuestas deportivas o juegos de fortuna.')}</p>
        </Dialog>
      )}

      {showProcedimientoDialog && (
        <Dialog title="Procedimiento" onClose={() => setShowProcedimientoDialog(false)}>
          <p>Una vez que ya hemos hecho la tirada, como vimos en el video, la primera de la izquierda será la número 1 y así sucesivamente.</p>
          <p className="mt-12">Un ejemplo: Si la primera carta es el 3 de bastos, pinchamos en la imagen, se nos abrirá un desplegable con los cuatro palos y seleccionamos el palo. En este caso bastos. Entonces vamos al tres de bastos, lo seleccionamos, y ya estaría. Así haríamos con las seis cartas.</p>
          <p className="mt-12">Antes de dar al botón 'COLAPSAR ONDA', nos cercioramos de que hemos introducido todos los vectores-carta perfectamente.</p>
          <img
            src="/assets/images/foto_carta_6.jpeg"
            alt="Ejemplo carta"
            style={{width:'100%', borderRadius:'12px', marginTop:'16px'}}
            onError={e => e.target.style.display='none'}
          />
        </Dialog>
      )}
    </div>
  )
}
