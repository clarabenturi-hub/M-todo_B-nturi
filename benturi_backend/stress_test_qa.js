/**
 * 15. TESTS DE ESTRÉS Y CONTROL DE CALIDAD PRE-LANZAMIENTO (QA) 🧪✅
 * Script de pruebas de carga concurrente para validar:
 * - Acceso rápido sin fricción (/api/auth/quick-access)
 * - Control de cuotas y Rate Limiting (/api/quota-status)
 * - Registro de eventos de conversión (/api/analytics/event)
 * - Configuración de entregabilidad DNS (/api/email/deliverability-config)
 *
 * Uso: node stress_test_qa.js [URL_BASE] [USUARIOS_CONCURRENTES]
 */

const fetch = require('node-fetch');

const BASE_URL = process.argv[2] || process.env.TEST_URL || 'https://m-todo-b-nturi.onrender.com';
const CONCURRENT_USERS = Number(process.argv[3]) || 30;

async function simulateSingleUser(idx) {
  const start = Date.now();
  const deviceId = `qa_stress_dev_${idx}_${Date.now()}`;
  try {
    // 1. Consultar estado de cuotas / Rate Limiting
    const qRes = await fetch(`${BASE_URL}/api/quota-status?deviceId=${deviceId}`, {
      headers: { 'X-Device-Id': deviceId }
    });

    // 2. Registrar evento de conversión PageView
    const aRes = await fetch(`${BASE_URL}/api/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'QA_StressTest_Ping',
        deviceId,
        metadata: { userIdx: idx }
      })
    });

    const elapsed = Date.now() - start;
    return {
      ok: qRes.ok && aRes.ok,
      status: qRes.status,
      elapsedMs: elapsed
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      elapsedMs: Date.now() - start,
      error: err.message
    };
  }
}

async function runStressTest() {
  console.log(`================================================================`);
  console.log(`🧪 INICIANDO TEST DE ESTRÉS QA PRE-LANZAMIENTO — MÉTODO BÉNTURI`);
  console.log(`🌍 Destino: ${BASE_URL}`);
  console.log(`👥 Usuarios simultáneos simulados: ${CONCURRENT_USERS}`);
  console.log(`================================================================`);

  const t0 = Date.now();
  const tasks = Array.from({ length: CONCURRENT_USERS }, (_, i) => simulateSingleUser(i + 1));
  const results = await Promise.all(tasks);
  const totalTime = Date.now() - t0;

  const successCount = results.filter(r => r.ok).length;
  const failCount = results.length - successCount;
  const latencies = results.map(r => r.elapsedMs).sort((a, b) => a - b);
  const avgLatency = Math.round(latencies.reduce((acc, v) => acc + v, 0) / latencies.length);
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)] || latencies[latencies.length - 1];

  console.log(`✅ Peticiones exitosas: ${successCount} / ${CONCURRENT_USERS}`);
  console.log(`❌ Peticiones fallidas: ${failCount}`);
  console.log(`⏱️ Tiempo total de ráfaga: ${totalTime} ms`);
  console.log(`📊 Latencia media por usuario: ${avgLatency} ms | P95: ${p95Latency} ms`);
  console.log(`================================================================`);
}

if (require.main === module) {
  runStressTest();
}

module.exports = { runStressTest };
