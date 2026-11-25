import { useState, useEffect } from 'react'

export default function AdminScreen({ token }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [emailConfig, setEmailConfig] = useState(null)

  useEffect(() => {
    fetch(`/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setUsers(Array.isArray(data) ? data : [])
      setLoading(false)
    })
    .catch(err => {
      console.error(err)
      setLoading(false)
    })

    fetch('/api/email/deliverability-config')
      .then(r => r.json())
      .then(cfg => setEmailConfig(cfg))
      .catch(() => {})
  }, [token])

  const changeUserPlan = async (userId, nextPlan) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-premium`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPremium: nextPlan !== 'free', plan: nextPlan })
      })
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, isPremium: nextPlan !== 'free', plan: nextPlan } : u))
      }
    } catch {
      alert("Error al actualizar el plan del usuario")
    }
  }

  return (
    <div className="page stack">
      <div className="glass-card-light" style={{textAlign:'center'}}>
        <h1>PANEL DE ADMINISTRADOR</h1>
        <div className="subtitle mt-8">Gestión de Usuarios, Cuotas (Despega / Premium) y Entregabilidad DNS</div>
      </div>
      
      <div className="glass-card" style={{padding: '16px'}}>
        <h2>1. GESTIÓN DE USUARIOS Y CUOTAS MENSUALES</h2>
        {loading ? <p className="mt-12">Cargando usuarios...</p> : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Plan / Cuota</th>
                  <th>Cambiar Plan</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const currentPlan = u.plan || (u.isPremium ? 'premium' : 'free')
                  return (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>
                        <span className={u.isPremium ? "badge-premium" : "badge-free"}>
                          {currentPlan === 'premium'
                            ? 'PREMIUM (6 Ilimitadas + 1x24/mes)'
                            : currentPlan === 'despega'
                              ? 'DESPEGA (12x6/mes + 1x24/mes)'
                              : 'GRATIS (Máx. 10 Tiradas de 6 Cartas)'}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          className="btn-small"
                          onClick={() => changeUserPlan(u.id, 'free')}
                          style={{ background: currentPlan === 'free' ? '#64748b' : '#1e293b', color: '#fff' }}
                        >
                          Gratis
                        </button>
                        <button
                          className="btn-small"
                          onClick={() => changeUserPlan(u.id, 'despega')}
                          style={{ background: currentPlan === 'despega' ? '#00E5FF' : '#0f172a', color: currentPlan === 'despega' ? '#020617' : '#00E5FF', border: '1px solid #00E5FF' }}
                        >
                          Despega
                        </button>
                        <button
                          className="btn-small"
                          onClick={() => changeUserPlan(u.id, 'premium')}
                          style={{ background: currentPlan === 'premium' ? '#D946EF' : '#0f172a', color: '#fff', border: '1px solid #D946EF' }}
                        >
                          Premium
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {emailConfig && (
        <div className="glass-card" style={{ padding: '18px' }}>
          <h2>2. ENTREGABILIDAD DE CORREOS (SPF, DKIM, DMARC) · {emailConfig.dnsConfiguration?.domain}</h2>
          <p className="mt-8" style={{ fontSize: '13px !important' }}>
            Proveedor activo: <strong style={{ color: '#00E5FF' }}>{emailConfig.activeProvider}</strong> · Correos del embudo (24h, 48h, 72h, 96h) en cola: <strong style={{ color: '#D946EF' }}>{emailConfig.pendingScheduledEmails}</strong>
          </p>
          <div className="admin-table-container mt-12">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Host / Nombre</th>
                  <th>Propósito</th>
                  <th>Valor DNS Recomendado</th>
                </tr>
              </thead>
              <tbody>
                {(emailConfig.dnsConfiguration?.records || []).map((rec, idx) => (
                  <tr key={idx}>
                    <td><strong>{rec.type}</strong></td>
                    <td><code>{rec.host}</code></td>
                    <td>{rec.purpose}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>{rec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
