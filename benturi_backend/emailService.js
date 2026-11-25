const fetch = require('node-fetch');

/**
 * 13. CONFIGURACIÓN DE ENTREGABILIDAD DE CORREOS (SPF, DKIM, DMARC)
 * Servicio unificado de correo transaccional compatible con Resend, Postmark o SendGrid
 * sobre el dominio verificado metodobenturi.com.
 */
const FROM_EMAIL = process.env.EMAIL_FROM || 'Clara Bénturi <no-reply@metodobenturi.com>';
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'contacto@metodobenturi.com';

async function sendTransactionalEmail({ to, subject, html, text }) {
  if (!to) return { ok: false, provider: 'none', error: 'Destinatario vacío' };

  // 1. RESEND (Prioritario si RESEND_API_KEY está configurado)
  if (process.env.RESEND_API_KEY) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          reply_to: REPLY_TO,
          subject,
          html,
          text
        })
      });
      const data = await resp.json();
      return { ok: resp.ok, provider: 'resend', response: JSON.stringify(data) };
    } catch (err) {
      console.error('Error enviando correo vía Resend:', err);
      return { ok: false, provider: 'resend', error: err.message };
    }
  }

  // 2. POSTMARK (Si POSTMARK_SERVER_TOKEN está configurado)
  if (process.env.POSTMARK_SERVER_TOKEN) {
    try {
      const resp = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN
        },
        body: JSON.stringify({
          From: FROM_EMAIL,
          To: to,
          ReplyTo: REPLY_TO,
          Subject: subject,
          HtmlBody: html,
          TextBody: text,
          MessageStream: 'outbound'
        })
      });
      const data = await resp.json();
      return { ok: resp.ok, provider: 'postmark', response: JSON.stringify(data) };
    } catch (err) {
      console.error('Error enviando correo vía Postmark:', err);
      return { ok: false, provider: 'postmark', error: err.message };
    }
  }

  // 3. SENDGRID (Si SENDGRID_API_KEY está configurado)
  if (process.env.SENDGRID_API_KEY) {
    try {
      const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: FROM_EMAIL.includes('<') ? FROM_EMAIL.match(/<([^>]+)>/)[1] : FROM_EMAIL, name: 'Método Bénturi' },
          reply_to: { email: REPLY_TO },
          subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html }
          ]
        })
      });
      return { ok: resp.ok, provider: 'sendgrid', response: `HTTP ${resp.status}` };
    } catch (err) {
      console.error('Error enviando correo vía SendGrid:', err);
      return { ok: false, provider: 'sendgrid', error: err.message };
    }
  }

  // Modo cola local / log cuando aún no se ha insertado la API Key en variables de entorno
  console.log(`[EMAIL TRANSACCIONAL PREPARADO] Para: ${to} | Asunto: ${subject}`);
  return { ok: true, provider: 'queued-no-api-key', response: 'Logged locally (add RESEND_API_KEY / POSTMARK_SERVER_TOKEN / SENDGRID_API_KEY in Render)' };
}

function buildFunnelEmailTemplate({ title, hoursLabel, messageBody, ctaUrl, ctaText }) {
  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#020617;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#e2e8f0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#020617;padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#0f172a;border:1px solid #00e5ff;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background-color:#0b192c;padding:20px 24px;text-align:center;border-bottom:2px solid #c5a059;">
                <div style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:0.6px;">
                  <span style="color:#c5a059;">MB</span> Método Bénturi
                </div>
                <div style="font-size:11px;color:#a4ebf3;text-transform:uppercase;letter-spacing:1.2px;margin-top:4px;">
                  Secuencia Algorítmica · ${hoursLabel}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px;">
                <h1 style="margin:0 0 16px 0;font-size:20px;color:#00e5ff;line-height:1.35;">
                  ${title}
                </h1>
                <p style="margin:0 0 22px 0;font-size:15px;line-height:1.65;color:#e2e8f0;">
                  ${messageBody}
                </p>
                <div style="text-align:center;margin:28px 0;">
                  <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#d946ef,#00e5ff);background-color:#d946ef;color:#ffffff;font-weight:bold;font-size:14px;text-decoration:none;border-radius:50px;letter-spacing:0.5px;">
                    ${ctaText}
                  </a>
                </div>
                <p style="margin:24px 0 0 0;font-size:11px;line-height:1.5;color:#94a3b8;border-top:1px solid #1e293b;padding-top:14px;text-align:center;">
                  Aviso Legal: Este correo forma parte de la secuencia de seguimiento de tu proyección de 6 vectores en Método Bénturi. Orientación probabilística y autoconocimiento bajo libre albedrío.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;

  const text = `${title}\n\n${messageBody}\n\n${ctaText}: ${ctaUrl}\n\nMétodo Bénturi - Orientación probabilística y autoconocimiento.`;
  return { html, text };
}

/**
 * Registros DNS obligatorios en metodobenturi.com para máxima entregabilidad (SPF, DKIM, DMARC)
 */
const DNS_DELIVERABILITY_RECORDS = {
  domain: 'metodobenturi.com',
  recommendedProvider: 'Resend / Postmark / SendGrid',
  records: [
    {
      type: 'TXT',
      host: '@ (metodobenturi.com)',
      purpose: 'SPF (Sender Policy Framework)',
      value: 'v=spf1 include:amazonses.com include:spf.mtasv.net include:sendgrid.net ~all',
      notes: 'Autoriza a los servidores de correo transaccional (Resend/SES, Postmark, SendGrid) a enviar en nombre de metodobenturi.com.'
    },
    {
      type: 'TXT / CNAME',
      host: 'resend._domainkey.metodobenturi.com (o selector DKIM del proveedor)',
      purpose: 'DKIM (DomainKeys Identified Mail)',
      value: 'p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC... (Clave pública generada al añadir metodobenturi.com en el panel de Resend/Postmark)',
      notes: 'Firma criptográfica que garantiza a Gmail, Outlook, Yahoo y Apple Mail que el correo no ha sido alterado.'
    },
    {
      type: 'TXT',
      host: '_dmarc.metodobenturi.com',
      purpose: 'DMARC (Domain-based Message Authentication, Reporting & Conformance)',
      value: 'v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@metodobenturi.com; aspf=r; adkim=r;',
      notes: 'Protege contra suplantación de identidad y asegura la entrada en Bandeja Principal evitando la carpeta de Spam.'
    },
    {
      type: 'MX / TXT',
      host: 'send.metodobenturi.com',
      purpose: 'Return-Path / Subdominio de Rebote Personalizado',
      value: 'feedback-smtp.eu-west-1.amazonses.com (Prioridad 10)',
      notes: 'Alinea el Return-Path con metodobenturi.com para cumplir el requisito de alineación estricta de Gmail y Yahoo.'
    }
  ]
};

module.exports = {
  sendTransactionalEmail,
  buildFunnelEmailTemplate,
  DNS_DELIVERABILITY_RECORDS
};
