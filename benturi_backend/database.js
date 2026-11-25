const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Si existe la variable DB_PATH (en Render), usa esa ruta. Si no, usa la local.
const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'benturi.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error abriendo la base de datos', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    
    // Crear tabla de usuarios
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      isPremium BOOLEAN DEFAULT 0,
      plan TEXT DEFAULT 'free',
      redsysReference TEXT,
      role TEXT DEFAULT 'user',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creando tabla de usuarios:', err.message);
      } else {
        // Asegurar columnas adicionales por si la tabla ya estaba creada antes
        db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, () => {
          db.run(`ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free'`, () => {
            // Crear usuario admin por defecto si no existe
            db.run(`INSERT OR IGNORE INTO users (email, password, role, isPremium, plan) VALUES ('admin@benturi.com', 'admin123', 'admin', 1, 'premium')`);

            // Habilitar y asegurar usuario de testeo clarabenturi@gmail.com con acceso completo (isPremium = 1, plan = 'premium')
            db.run(`INSERT OR IGNORE INTO users (email, password, role, isPremium, plan) VALUES ('clarabenturi@gmail.com', 'Clara2027$$', 'admin', 1, 'premium')`, () => {
              db.run(`UPDATE users SET password = ?, isPremium = 1, role = 'admin', plan = 'premium' WHERE LOWER(email) = 'clarabenturi@gmail.com'`, ['Clara2027$$']);
            });
          });
        });
      }
    });

    // Tabla de suscripciones Web Push
    db.run(`CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      endpoint TEXT NOT NULL,
      keys TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )`);

    // Tabla de notificaciones Web Push programadas (24h, 48h, 72h)
    db.run(`CREATE TABLE IF NOT EXISTS scheduled_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL,
      keys TEXT NOT NULL,
      hours INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      fireAt INTEGER NOT NULL,
      sent INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 12. REGLAS DE LÍMITES DE USO Y ANTI-ABUSO (RATE LIMITING):
    // Registro de lecturas por IP, Dispositivo (fingerprint) y Correo para limitar la prueba gratuita
    // y contabilizar cuotas mensuales de Bénturi Despega y Bénturi Premium
    db.run(`CREATE TABLE IF NOT EXISTS reading_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      email TEXT,
      ip TEXT,
      deviceId TEXT,
      readingType TEXT NOT NULL,
      question TEXT,
      monthKey TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    )`);

    // Historial de informes guardados asociados al correo del usuario (punto 11)
    db.run(`CREATE TABLE IF NOT EXISTS saved_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      readingType TEXT NOT NULL,
      question TEXT,
      reportMarkdown TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    )`);

    // 13. SECUENCIA DE CORREOS TRANSACCIONALES DEL EMBUDO (24h, 48h, 72h y 96h)
    db.run(`CREATE TABLE IF NOT EXISTS scheduled_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      hours INTEGER NOT NULL,
      subject TEXT NOT NULL,
      htmlBody TEXT NOT NULL,
      textBody TEXT NOT NULL,
      fireAt INTEGER NOT NULL,
      sent INTEGER DEFAULT 0,
      providerResponse TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

module.exports = db;
