/**
 * 10. ANALÍTICA DE CONVERSIÓN Y PÍXELES DE SEGUIMIENTO (TIKTOK / YOUTUBE / META / GA4)
 * Módulo centralizado que inicializa TikTok Pixel, Google Tag Manager / GA4 y Meta Pixel,
 * dispara los eventos del embudo y detecta navegadores internos (In-App Browsers de TikTok/IG/YouTube).
 */

const TIKTOK_PIXEL_ID = import.meta.env.VITE_TIKTOK_PIXEL_ID || '';
const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_ID || '';
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';

let initialized = false;

export function initAnalyticsPixels() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // 1. Google Analytics 4 / Google Tag Manager
  if (GA4_MEASUREMENT_ID && !window.gtag) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID);
  }

  // 2. TikTok Pixel
  if (TIKTOK_PIXEL_ID && !window.ttq) {
    (function (w, d, t) {
      w.TiktokAnalyticsObject = t;
      const ttq = (w[t] = w[t] || []);
      ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
      ttq.setAndDefer = function (t, e) {
        t[e] = function () {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };
      for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.load = function (e) {
        const n = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        const a = d.createElement('script');
        a.type = 'text/javascript';
        a.async = true;
        a.src = n + '?sdkid=' + e + '&lib=' + t;
        const s = d.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(a, s);
      };
      ttq.load(TIKTOK_PIXEL_ID);
      ttq.page();
    })(window, document, 'ttq');
  }

  // 3. Meta / Facebook Pixel
  if (META_PIXEL_ID && !window.fbq) {
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }
}

/**
 * Registra un evento de conversión tanto en los píxeles de terceros (TikTok, GA4, Meta)
 * como en la base de datos interna (/api/analytics/event) para el panel de administrador.
 */
export function trackConversionEvent(eventName, metadata = {}) {
  try {
    if (typeof window === 'undefined') return;
    initAnalyticsPixels();

    const email = localStorage.getItem('benturi_captured_email') || '';
    const deviceId = localStorage.getItem('benturi_device_id') || '';

    // Google Analytics 4
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, metadata);
    }

    // TikTok Pixel
    if (window.ttq && typeof window.ttq.track === 'function') {
      const tiktokMap = {
        FreeReading6Started: 'SubmitForm',
        PyramidCompleted: 'CompleteRegistration',
        Day3ValidationClick: 'ClickButton',
        InitiateCheckout: 'InitiateCheckout',
        Purchase: 'CompletePayment'
      };
      window.ttq.track(tiktokMap[eventName] || eventName, metadata);
    }

    // Meta Pixel
    if (typeof window.fbq === 'function') {
      const metaMap = {
        FreeReading6Started: 'Lead',
        PyramidCompleted: 'CompleteRegistration',
        InitiateCheckout: 'InitiateCheckout',
        Purchase: 'Purchase'
      };
      window.fbq('track', metaMap[eventName] || eventName, metadata);
    }

    // Registro interno en SQLite
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, email, deviceId, metadata })
    }).catch(() => {});
  } catch (e) {
    console.warn('Error registrando evento de analítica:', e);
  }
}

/**
 * 14. Detección de navegadores integrados dentro de aplicaciones móviles (In-App Browsers de TikTok, Instagram, Facebook, YouTube)
 */
export function detectInAppBrowser() {
  if (typeof window === 'undefined' || !window.navigator) {
    return { isInApp: false, appName: null };
  }
  const ua = window.navigator.userAgent || '';
  if (/BytedanceWebview|musical_ly|TikTok/i.test(ua)) {
    return { isInApp: true, appName: 'TikTok' };
  }
  if (/Instagram/i.test(ua)) {
    return { isInApp: true, appName: 'Instagram' };
  }
  if (/FBAN|FBAV/i.test(ua)) {
    return { isInApp: true, appName: 'Facebook' };
  }
  return { isInApp: false, appName: null };
}
