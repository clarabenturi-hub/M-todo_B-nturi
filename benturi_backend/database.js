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
      redsysReference TEXT,
      role TEXT DEFAULT 'user',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creando tabla de usuarios:', err.message);
      } else {
        // Asegurar que la columna role existe (por si la tabla ya estaba creada antes)
        db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (err) => {
            // Ignoramos error de alter table si la columna ya existe
            // Crear usuario admin por defecto si no existe
            db.run(`INSERT OR IGNORE INTO users (email, password, role, isPremium) VALUES ('admin@benturi.com', 'admin123', 'admin', 1)`);
        });
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      endpoint TEXT NOT NULL,
      keys TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )`);
  }
});

module.exports = db;
