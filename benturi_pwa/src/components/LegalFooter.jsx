import { ShieldCheck, Scale, Lock, Cookie, Building2, HelpCircle } from 'lucide-react'

export default function LegalFooter({ onOpenHelp }) {
  const disabledLinkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    borderRadius: '999px',
    background: 'rgba(15, 23, 42, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    color: 'rgba(164, 235, 243, 0.55)',
    fontSize: '11.5px',
    fontWeight: '600',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.2px',
    cursor: 'not-allowed',
    userSelect: 'none',
    opacity: 0.78,
    textDecoration: 'none'
  }

  return (
    <footer
      className="legal-footer-wrapper"
      aria-label="Aviso legal, privacidad y datos corporativos"
      style={{
        maxWidth: '860px',
        margin: '-64px auto 112px auto',
        padding: '0 20px',
        boxSizing: 'border-box',
        width: '100%'
      }}
    >
      <div
        className="glass-card"
        style={{
          padding: '20px 22px',
          borderRadius: '14px',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.78) 0%, rgba(2, 6, 23, 0.92) 100%)',
          border: '1px solid rgba(0, 229, 255, 0.22)',
          boxShadow: '0 8px 32px rgba(2, 6, 23, 0.65)'
        }}
      >
        {/* Cabecera del bloque legal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '12px',
            color: '#00E5FF',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            textAlign: 'center'
          }}
        >
          <Scale size={16} strokeWidth={2.2} style={{ color: '#D946EF', flexShrink: 0 }} />
          <span>Aviso Legal, Exención de Responsabilidad y Transparencia</span>
          <ShieldCheck size={16} strokeWidth={2.2} style={{ color: '#00E5FF', flexShrink: 0 }} />
        </div>

        {/* Texto de Exención de Responsabilidad */}
        <p
          style={{
            fontSize: '12px !important',
            lineHeight: '1.58',
            color: 'rgba(226, 232, 240, 0.78)',
            textAlign: 'center',
            margin: '0 auto 16px auto',
            maxWidth: '740px',
            fontStyle: 'normal'
          }}
        >
          <strong style={{ color: '#A4EBF3' }}>Exención de Responsabilidad:</strong> Esta plataforma ofrece orientación probabilística, desarrollo personal y autoconocimiento mediante el Método Bénturi. Su contenido tiene carácter exclusivamente informativo y reflexivo, y en ningún caso sustituye el diagnóstico, consejo o tratamiento de profesionales médicos, psicológicos, jurídicos o financieros cualificados. El usuario actúa bajo su libre albedrío y es el único responsable de sus decisiones.
        </p>

        {/* Separador sutil */}
        <div
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.25), rgba(217, 70, 239, 0.25), transparent)',
            margin: '14px 0'
          }}
        />

        {/* Enlaces legales deshabilitados (estéticos) */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '14px'
          }}
        >
          <span
            role="link"
            aria-disabled="true"
            title="Sección en actualización"
            style={disabledLinkStyle}
          >
            <Scale size={13} />
            Aviso Legal y Condiciones de Uso
          </span>

          <span
            role="link"
            aria-disabled="true"
            title="Sección en actualización"
            style={disabledLinkStyle}
          >
            <ShieldCheck size={13} />
            Exención de Responsabilidad
          </span>

          <span
            role="link"
            aria-disabled="true"
            title="Sección en actualización"
            style={disabledLinkStyle}
          >
            <Lock size={13} />
            Política de Privacidad
          </span>

          <span
            role="link"
            aria-disabled="true"
            title="Sección en actualización"
            style={disabledLinkStyle}
          >
            <Cookie size={13} />
            Política de Cookies
          </span>

          <span
            role="link"
            aria-disabled="true"
            title="Sección en actualización"
            style={disabledLinkStyle}
          >
            <Building2 size={13} />
            Datos de Contacto / Información Corporativa
          </span>

          {onOpenHelp && (
            <button
              type="button"
              id="btn-open-help-center"
              onClick={onOpenHelp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 15px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(217, 70, 239, 0.2))',
                border: '1px solid #00E5FF',
                color: '#ffffff',
                fontSize: '11.5px',
                fontWeight: '700',
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(0, 229, 255, 0.25)'
              }}
            >
              <HelpCircle size={13} color="#00E5FF" />
              Centro de Ayuda (FAQ) y Soporte
            </button>
          )}
        </div>

        {/* Copyright e Información Corporativa */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '11px',
            color: 'rgba(148, 163, 184, 0.65)',
            fontFamily: "'Inter', sans-serif",
            letterSpacing: '0.3px'
          }}
        >
          © {new Date().getFullYear()} Método Bénturi · Todos los derechos reservados · Plataforma de Decodificación Probabilística
        </div>
      </div>
    </footer>
  )
}
