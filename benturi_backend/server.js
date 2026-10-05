require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./database');
const redsys = require('./redsys');
const webpush = require('web-push');
const fetch = require('node-fetch');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-client-id');

// Configuración de web-push (usar llaves de process.env en prod)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BEUPFhphS_YDpLxWb18rsXx7L4aRrS2uAmlz5enpF0rHHJamSWq3G9cRy1sLAN3w186Egtavgp85cmiIGFkFTYw';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'd8gCEsYMFjQrDrG4Ju4yCfLXMRiT6dQcKgZpusAT9iE';
webpush.setVapidDetails(
  'mailto:contacto@metodobenturi.com',
  vapidPublicKey,
  vapidPrivateKey
);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'benturi_super_secret_key_2026';

// El frontend PWA suele correr en el puerto 5173 o 5174 localmente
app.use(cors());

// Middleware para parsear JSON (para login/registro)
// PERO para el Webhook de Redsys necesitamos urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- AUTHENTICATION ENDPOINTS ---

app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'El email ya existe' });
                return res.status(500).json({ error: 'Error del servidor' });
            }
            
            const token = jwt.sign({ id: this.lastID, email, isPremium: false, role: 'user' }, JWT_SECRET);
            res.json({ token, user: { id: this.lastID, email, isPremium: false, role: 'user' } });
        });
    } catch (err) {
        return res.status(500).json({ error: 'Error encriptando contraseña' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
        
        const isBcrypt = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
        let isValid = false;

        if (isBcrypt) {
            isValid = await bcrypt.compare(password, user.password);
        } else {
            isValid = (password === user.password);
            if (isValid) {
                const newHash = await bcrypt.hash(password, 10);
                db.run('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
            }
        }
        
        if (!isValid) return res.status(401).json({ error: 'Credenciales inválidas' });
        
        const token = jwt.sign({ id: user.id, email: user.email, isPremium: user.isPremium, role: user.role }, JWT_SECRET);
        res.json({ token, user: { id: user.id, email: user.email, isPremium: user.isPremium, role: user.role } });
    });
});

app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Token de Google requerido' });

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload.email;

        // Verificar si el usuario ya existe
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
            if (err) return res.status(500).json({ error: 'Error del servidor' });

            if (user) {
                // Usuario existe, iniciar sesión
                const token = jwt.sign({ id: user.id, email: user.email, isPremium: user.isPremium, role: user.role }, JWT_SECRET);
                return res.json({ token, user: { id: user.id, email: user.email, isPremium: user.isPremium, role: user.role } });
            } else {
                // Usuario no existe, registrar automáticamente
                // Generamos una contraseña aleatoria compleja ya que usan Google para entrar
                const randomPassword = require('crypto').randomBytes(16).toString('hex');
                bcrypt.hash(randomPassword, 10, (err, hashedPassword) => {
                    if (err) return res.status(500).json({ error: 'Error creando usuario' });
                    
                    db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function(err) {
                        if (err) return res.status(500).json({ error: 'Error del servidor al registrar' });
                        
                        const token = jwt.sign({ id: this.lastID, email, isPremium: false, role: 'user' }, JWT_SECRET);
                        res.json({ token, user: { id: this.lastID, email, isPremium: false, role: 'user' } });
                    });
                });
            }
        });
    } catch (err) {
        console.error('Error verificando token de Google:', err);
        res.status(401).json({ error: 'Token de Google inválido' });
    }
});

// Middleware para proteger rutas
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.get('/api/me', authenticateToken, (req, res) => {
    db.get('SELECT id, email, isPremium, role FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err || !user) return res.sendStatus(404);
        res.json(user);
    });
});

// --- ADMIN ENDPOINTS ---

function requireAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    }
}

app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    db.all('SELECT id, email, isPremium, role, createdAt FROM users ORDER BY createdAt DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error obteniendo usuarios' });
        res.json(rows);
    });
});

app.post('/api/admin/users/:id/toggle-premium', authenticateToken, requireAdmin, (req, res) => {
    const userId = req.params.id;
    const { isPremium } = req.body;
    db.run('UPDATE users SET isPremium = ? WHERE id = ?', [isPremium ? 1 : 0, userId], function(err) {
        if (err) return res.status(500).json({ error: 'Error actualizando usuario' });
        res.json({ success: true });
    });
});

// --- AI AND PUSH ENDPOINTS ---

app.post('/api/generate-vision', authenticateToken, async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Texto requerido' });

    const textPrompt = `Eres la IA Cuántica del Método Bénturi. Dirígete al usuario en un tono muy motivador y profundo. Analiza esta visión de futuro y dime que está cerca de manifestarse: ${text.trim()}`;
    const textUrl = `https://text.pollinations.ai/prompt/${encodeURIComponent(textPrompt)}`;
    
    // Generar prompt de imagen
    const imagePrompt = `Una imagen realista y cinematográfica del siguiente escenario: ${text.trim()}`;
    const rawImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=1024&nologo=true&model=flux`;
    const imageUrl = `https://wsrv.nl/?url=${encodeURIComponent(rawImageUrl)}`;

    try {
        const response = await fetch(textUrl);
        const report = await response.text();
        res.json({ report, imageUrl });
    } catch (err) {
        console.error('Error llamando a IA:', err);
        res.status(500).json({ error: 'Error procesando la visión cuántica' });
    }
});

app.post('/api/push/subscribe', authenticateToken, (req, res) => {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) return res.status(400).json({ error: 'Suscripción inválida' });

    const keysStr = JSON.stringify(subscription.keys || {});
    db.run('INSERT INTO push_subscriptions (userId, endpoint, keys) VALUES (?, ?, ?)', 
        [req.user.id, subscription.endpoint, keysStr], 
        (err) => {
            if (err) {
                console.error("Error guardando suscripción:", err);
                return res.status(500).json({ error: 'Error del servidor' });
            }
            res.status(201).json({ success: true });
        }
    );
});

app.post('/api/push/send', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const payload = JSON.stringify({
        title: 'Método Bénturi',
        body: 'Conecta con tu imagen cuántica. Es tu momento.',
        url: '/'
    });

    db.all('SELECT * FROM push_subscriptions WHERE userId = ?', [userId], (err, rows) => {
        if (err || rows.length === 0) return res.status(404).json({ error: 'Suscripción no encontrada' });
        
        let sent = 0;
        rows.forEach(row => {
            const sub = {
                endpoint: row.endpoint,
                keys: JSON.parse(row.keys)
            };
            webpush.sendNotification(sub, payload).catch(e => console.error("Error enviando push", e));
            sent++;
        });
        res.json({ success: true, count: sent });
    });
});

// --- REDSYS ENDPOINTS ---

app.post('/api/create-payment', authenticateToken, (req, res) => {
    // 1. Generar un OrderID único (Redsys requiere que los primeros 4 dígitos sean números y en total máx 12)
    // Para simplificar: Fecha compactada + ID usuario
    const dateStr = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(2, 10); // formato YYMMDDHH
    const orderId = `${dateStr}${req.user.id}`.padEnd(10, '0').slice(0, 12);
    
    const amount = 999; // 9,99 €
    
    // IMPORTANTE: En desarrollo local (localhost), Redsys NO puede alcanzar tu Webhook.
    // Usarías ngrok para exponer tu localhost.
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

    const merchantUrl = `${baseUrl}/api/redsys-webhook`;
    const urlOK = `${frontendUrl}/?pago=ok`;
    const urlKO = `${frontendUrl}/?pago=ko`;

    const paymentData = redsys.createPaymentRequest(amount, orderId, merchantUrl, urlOK, urlKO);
    
    // Guardar el orderId en BD temporalmente si queremos trazarlo (simplificado aquí)
    
    // Detectamos si estamos en Producción por la URL base o NODE_ENV
    const isProduction = baseUrl.includes('onrender.com') || process.env.NODE_ENV === 'production';
    const redsysEndpoint = isProduction 
        ? 'https://sis.redsys.es/sis/realizarPago' 
        : 'https://sis-t.redsys.es:25443/sis/realizarPago';
    
    res.json({
        url: redsysEndpoint,
        params: paymentData
    });
});

// WEBHOOK DE REDSYS (Notificación Online)
app.post('/api/redsys-webhook', (req, res) => {
    console.log("=== NOTIFICACION WEBHOOK REDSYS ===");
    const dsSignatureVersion = req.body.Ds_SignatureVersion;
    const dsMerchantParameters = req.body.Ds_MerchantParameters;
    const dsSignature = req.body.Ds_Signature;

    if (!dsMerchantParameters || !dsSignature) {
        console.error("Faltan parámetros de Redsys");
        return res.status(400).send("Bad Request");
    }

    const isValid = redsys.validateWebhookSignature(dsMerchantParameters, dsSignature);
    
    if (isValid) {
        // Decodificar Base64 para leer si fue un éxito
        const decodedParams = Buffer.from(dsMerchantParameters, 'base64').toString('utf8');
        const paramsJson = JSON.parse(decodedParams);
        
        console.log("Pago válido recibido:", paramsJson);
        
        const responseCode = parseInt(paramsJson.Ds_Response || paramsJson.DS_RESPONSE);
        
        // Response 0000 a 0099 es éxito
        if (responseCode >= 0 && responseCode <= 99) {
            const orderId = paramsJson.Ds_Order || paramsJson.DS_ORDER;
            const cofIdentifier = paramsJson.Ds_Merchant_Cof_Txnid || paramsJson.DS_MERCHANT_COF_TXNID; // Para próximos cobros
            
            // Extraer el ID de usuario del Order ID (como lo generamos antes: primeros 8 chars son fecha, resto ID)
            const userIdStr = orderId.substring(8);
            const userId = parseInt(userIdStr);
            
            if (userId) {
                // Actualizar usuario a Premium
                db.run('UPDATE users SET isPremium = 1, redsysReference = ? WHERE id = ?', [cofIdentifier, userId], (err) => {
                    if (err) console.error("Error actualizando DB", err);
                    else console.log(`Usuario ${userId} es ahora PREMIUM. Referencia: ${cofIdentifier}`);
                });
            }
        } else {
            console.error(`Pago denegado. Código de respuesta: ${responseCode}`);
        }
        
        res.status(200).send("OK");
    } else {
        console.error("Firma de Webhook INVÁLIDA. Posible fraude.");
        res.status(400).send("Firma Invalida");
    }
});

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const PDFDocument = require("pdfkit");
const fs = require('fs');
const path = require('path');

app.post('/api/generate-report', async (req, res) => {
    try {
        const { question, result } = req.body;
        
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("Falta GEMINI_API_KEY en .env");
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const is24 = result.cards && result.cards.length === 24;
        const promptFilename = is24 ? '../Informe_Usuario_24.txt' : '../Informe Usuario .txt';
        const promptFile = path.join(__dirname, promptFilename);
        const systemPrompt = fs.readFileSync(promptFile, 'utf8');
        
        // Leer base de conocimientos de combinaciones y significados deterministas
        const kbPath = path.join(__dirname, 'base_conocimiento_cartas.json');
        const txtKbPath = path.join(__dirname, '../pROMTS/base_conocimiento_cartas.txt');
        const detPath = path.join(__dirname, 'base_determinista_cartas.json');
        
        let kb = { significado_cartas: [], combinaciones: [] };
        let det = { cartas: {}, textos_fijos: {} };
        
        const mergeKnowledgeBase = (sourceKb, sourceText) => {
            const normalized = new Map();
            const allCombos = [
                ...(sourceKb?.combinaciones || []),
                ...(sourceText || [])
            ];

            for (const combo of allCombos) {
                if (!combo || !combo.combinacion) continue;
                const key = normalizeCard(combo.combinacion);
                if (!key) continue;
                if (!normalized.has(key)) {
                    normalized.set(key, combo);
                }
            }

            return {
                ...sourceKb,
                combinaciones: Array.from(normalized.values())
            };
        };

        try {
            kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
            det = JSON.parse(fs.readFileSync(detPath, 'utf8'));
        } catch (e) {
            console.error("No se pudo leer bases de conocimiento JSON", e);
        }

        try {
            if (fs.existsSync(txtKbPath)) {
                const txtRows = fs.readFileSync(txtKbPath, 'utf8')
                    .split(/\r?\n/)
                    .map(line => line.trim())
                    .filter(line => line.includes('+') && line.includes('='));

                const parsedTextCombos = txtRows.map(line => {
                    const cleaned = line.replace(/^[•\-*\s]+/, '');
                    const [combinacion, ...rest] = cleaned.split('=');
                    const significado = rest.join('=').trim();
                    const paloOrigen = combinacion.toLowerCase().includes('espadas')
                        ? 'espadas'
                        : combinacion.toLowerCase().includes('copas')
                            ? 'copas'
                            : combinacion.toLowerCase().includes('oros')
                                ? 'oros'
                                : combinacion.toLowerCase().includes('bastos')
                                    ? 'bastos'
                                    : 'desconocido';

                    return {
                        palo_origen: paloOrigen,
                        combinacion: combinacion.trim(),
                        significado
                    };
                });

                kb = mergeKnowledgeBase(kb, parsedTextCombos);
            }
        } catch (e) {
            console.warn('No se pudo cargar la base de conocimiento de texto', e);
        }

        const normalizeCard = (name) => {
            if (!name) return '';
            return String(name)
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/\./g, ' ')
                .replace(/\b(caballero|caballo)\b/g, 'caballo')
                .replace(/\b(nueve|9)\b/g, '9')
                .replace(/\b(ocho|8)\b/g, '8')
                .replace(/\b(siete|7)\b/g, '7')
                .replace(/\b(seis|6)\b/g, '6')
                .replace(/\b(cinco|5)\b/g, '5')
                .replace(/\b(cuatro|4)\b/g, '4')
                .replace(/\b(tres|3)\b/g, '3')
                .replace(/\b(dos|2)\b/g, '2')
                .replace(/\b(as|1)\b/g, '1')
                .replace(/\bde\b|\bdel\b|\bda\b|\by\b/g, ' ')
                .replace(/[^a-z0-9]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        };
        
        const getDeterministicInfo = (cardName) => {
            if (!cardName) return "Sin carta";
            const keys = Object.keys(det.cartas);
            const foundKey = keys.find(k => normalizeCard(k) === normalizeCard(cardName));
            if (foundKey) {
                const info = det.cartas[foundKey];
                return `**Amor y Relaciones**: ${info.Amor || 'N/A'}\n**Trabajo y Profesión**: ${info.Trabajo || 'N/A'}\n**Dinero y Finanzas**: ${info.Dinero || 'N/A'}\n**Salud y Bienestar**: ${info.Salud || 'N/A'}\n**Evolución Personal y Decisiones**: ${info.Evolucion || 'N/A'}`;
            }
            return "Información no encontrada en la base determinista.";
        };

        // Función genérica para validar arrays de cartas (dobles, triples o cuádruples)
        const checkCombination = (cardsArray, positionsArray) => {
            if (cardsArray.some(c => !c)) return null;
            
            const normalizedInput = cardsArray.map(normalizeCard);
            
            const match = kb.combinaciones?.find(c => {
                const parts = c.combinacion
                    .toLowerCase()
                    .split('+')
                    .map(p => p.trim().replace(/\./g, ' '));
                const normalizedParts = parts.map(normalizeCard);

                if (normalizedParts.length !== normalizedInput.length) return false;

                const directMatch = normalizedParts.every((p, index) => p === normalizedInput[index]);
                if (directMatch) return true;

                const sortedInput = [...normalizedInput].sort();
                const sortedParts = [...normalizedParts].sort();
                if (sortedInput.join('|') === sortedParts.join('|')) return true;

                if (normalizedParts.length === 2) {
                    const reverseMatch = normalizedParts[0] === normalizedInput[1] && normalizedParts[1] === normalizedInput[0];
                    if (reverseMatch) return true;
                }

                return false;
            });

            if (match) {
                const posStr = positionsArray.join(' + ');
                const cardStr = cardsArray.map(c => `Vector carta ${c}`).join(' + ');
                return `Asociación [${posStr}] (${cardStr}): ${match.significado}`;
            }
            return null;
        };

        let contextText = "";
        let vectoresArray = [];
        let combosReales = [];

        if (result.cards && result.cards.length === 24) {
            // MATRIZ 24 VECTORES (Cruce completo de matriz 4x6)
            const m = result.cards.map(card => card ? card.spanishName : null);
            
            // Nombres de posiciones según la matriz del método Bénturi
            const posNames = [
                "C1", "C3", "C5", "C7", "C9", "C11",
                "C13", "C15", "C17", "C19", "C21", "C23",
                "C25", "C27", "C29", "C31", "C33", "C35",
                "C37", "C39", "C41", "C43", "C45", "C47"
            ];
            
            const getPos = (idx) => ({ c: m[idx], p: posNames[idx] });

            vectoresArray = m.map((carta, idx) => ({
                posicion: `Posición ${posNames[idx]}`,
                nombre_carta: carta,
                significado_determinista: getDeterministicInfo(carta)
            }));

            const dobles = [];
            const triples = [];
            const cuadruples = [];

            const addD = (i1, i2) => dobles.push([getPos(i1), getPos(i2)]);
            const addT = (i1, i2, i3) => triples.push([getPos(i1), getPos(i2), getPos(i3)]);
            const addQ = (i1, i2, i3, i4) => cuadruples.push([getPos(i1), getPos(i2), getPos(i3), getPos(i4)]);

            // HORIZONTALES (Dobles, Triples, Cuadruples)
            for (let r = 0; r < 4; r++) {
                const rowStart = r * 6;
                // Hacia adelante
                for (let i = 0; i < 5; i++) addD(rowStart+i, rowStart+i+1);
                for (let i = 0; i < 4; i++) addT(rowStart+i, rowStart+i+1, rowStart+i+2);
                for (let i = 0; i < 3; i++) addQ(rowStart+i, rowStart+i+1, rowStart+i+2, rowStart+i+3);
                // Hacia atrás (Dobles)
                for (let i = 5; i > 0; i--) addD(rowStart+i, rowStart+i-1);
            }

            // VERTICALES (Dobles)
            // Hacia abajo (F1->F2, F2->F3, F3->F4)
            for (let c = 0; c < 6; c++) {
                addD(c, c+6);     
                addD(c+6, c+12);  
                addD(c+12, c+18); 
            }
            // Hacia arriba (F2->F1, F3->F2, F4->F3)
            for (let c = 0; c < 6; c++) {
                addD(c+6, c);     
                addD(c+12, c+6);  
                addD(c+18, c+12); 
            }

            // Procesar combinaciones
            [cuadruples, triples, dobles].forEach(group => {
                group.forEach(seq => {
                    const cards = seq.map(s => s.c);
                    const pos = seq.map(s => s.p);
                    const matchStr = checkCombination(cards, pos);
                    if (matchStr) combosReales.push(matchStr);
                });
            });

            let extractedDataText = "DATOS EXTRAÍDOS DEL BACKEND PARA LA MATRIZ DE 24 VECTORES:\n";
            extractedDataText += `PREGUNTA DEL CONSULTANTE: ${question}\n\n`;
            extractedDataText += `VALORES INDIVIDUALES DETERMINISTAS:\n${JSON.stringify(vectoresArray, null, 2)}\n\n`;
            extractedDataText += `ASOCIACIONES COMPROBADAS EN LA MATRIZ 4x6 (Dobles, Triples y Cuádruples):\n`;
            extractedDataText += combosReales.length > 0 ? combosReales.join("\n") + "\n\n" : "(Ninguna asociación válida encontrada en la red de la matriz)\n\n";

            contextText = extractedDataText + `Instrucción: Genera el informe final de 24 cartas usando tu prompt de estructura específico.`;
        } else {
            // Matriz 6 - Mapeo de Posiciones Algoritmo Bénturi (C1, C3, C5, C7, C9, C11)
            vectoresArray = [
                { posicion: "Posición C1 (Carta 1)", nombre_carta: result.c1, significado_determinista: getDeterministicInfo(result.c1) },
                { posicion: "Posición C3 (Carta 2)", nombre_carta: result.c2, significado_determinista: getDeterministicInfo(result.c2) },
                { posicion: "Posición C5 (Carta 3)", nombre_carta: result.c3, significado_determinista: getDeterministicInfo(result.c3) },
                { posicion: "Posición C7 (Carta 4)", nombre_carta: result.c4, significado_determinista: getDeterministicInfo(result.c4) },
                { posicion: "Posición C9 (Carta 5)", nombre_carta: result.c5, significado_determinista: getDeterministicInfo(result.c5) },
                { posicion: "Posición C11 (Carta 6)", nombre_carta: result.c6, significado_determinista: getDeterministicInfo(result.c6) }
            ];

            // 1. CUÁDRUPLES (Hacia adelante)
            const cuadruples = [
                [{c: result.c1, p: "C1"}, {c: result.c2, p: "C3"}, {c: result.c3, p: "C5"}, {c: result.c4, p: "C7"}],
                [{c: result.c2, p: "C3"}, {c: result.c3, p: "C5"}, {c: result.c4, p: "C7"}, {c: result.c5, p: "C9"}],
                [{c: result.c3, p: "C5"}, {c: result.c4, p: "C7"}, {c: result.c5, p: "C9"}, {c: result.c6, p: "C11"}]
            ];

            // 2. TRIPLES (Hacia adelante)
            const triples = [
                [{c: result.c1, p: "C1"}, {c: result.c2, p: "C3"}, {c: result.c3, p: "C5"}],
                [{c: result.c2, p: "C3"}, {c: result.c3, p: "C5"}, {c: result.c4, p: "C7"}],
                [{c: result.c3, p: "C5"}, {c: result.c4, p: "C7"}, {c: result.c5, p: "C9"}],
                [{c: result.c4, p: "C7"}, {c: result.c5, p: "C9"}, {c: result.c6, p: "C11"}]
            ];

            // 3. DOBLES (Hacia adelante)
            const dobles = [
                [{c: result.c1, p: "C1"}, {c: result.c2, p: "C3"}],
                [{c: result.c2, p: "C3"}, {c: result.c3, p: "C5"}],
                [{c: result.c3, p: "C5"}, {c: result.c4, p: "C7"}],
                [{c: result.c4, p: "C7"}, {c: result.c5, p: "C9"}],
                [{c: result.c5, p: "C9"}, {c: result.c6, p: "C11"}]
            ];

            // 4. DOBLES INVERSAS (Hacia atrás)
            const doblesInversas = [
                [{c: result.c6, p: "C11"}, {c: result.c5, p: "C9"}],
                [{c: result.c5, p: "C9"}, {c: result.c4, p: "C7"}],
                [{c: result.c4, p: "C7"}, {c: result.c3, p: "C5"}],
                [{c: result.c3, p: "C5"}, {c: result.c2, p: "C3"}],
                [{c: result.c2, p: "C3"}, {c: result.c1, p: "C1"}]
            ];

            // Procesar todos los grupos
            [cuadruples, triples, dobles, doblesInversas].forEach(group => {
                group.forEach(seq => {
                    const cards = seq.map(s => s.c);
                    const pos = seq.map(s => s.p);
                    const matchStr = checkCombination(cards, pos);
                    if (matchStr) combosReales.push(matchStr);
                });
            });

            let extractedDataText = "DATOS EXTRAÍDOS DEL BACKEND PARA EL INFORME:\n";
            extractedDataText += `PREGUNTA DEL CONSULTANTE: ${question}\n\n`;
            extractedDataText += `0.1 & 0.3 "SIGNIFICADO DETERMINISTA DE CADA VECTOR CARTA":\n`;
            extractedDataText += JSON.stringify(vectoresArray, null, 2) + "\n\n";
            extractedDataText += `0.2 "ALGORITMO ASOCIACIONES DE CARTAS MÉTODO BÉNTURI" (LISTADO DE ASOCIACIONES DE CARTAS ENCONTRADAS):\n`;
            
            if (combosReales.length > 0) {
                extractedDataText += combosReales.join("\n") + "\n\n";
            } else {
                extractedDataText += "(Ninguna asociación contigua válida encontrada)\n\n";
            }

            contextText = extractedDataText + `\nInstrucción: Genera el informe final rellenando la estructura de tu prompt base (INFORME USUARIO) utilizando únicamente los datos aquí proporcionados. Recuerda usar la nomenclatura de posiciones (C1, C3, C5, C7, C9, C11) al referirte a las cartas.`;
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        let retries = 3;
        let success = false;
        while (retries > 0 && !success) {
            try {
                const model = genAI.getGenerativeModel({ 
                    model: 'gemini-3.6-flash', 
                    systemInstruction: systemPrompt,
                    generationConfig: { temperature: 0.0, topP: 1 },
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    ]
                });
                
                const aiResponse = await model.generateContentStream(contextText);
                
                for await (const chunk of aiResponse.stream) {
                    const chunkText = chunk.text();
                    res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
                }
                success = true;
                break;
            } catch (e) {
                console.error(`Error contactando con Gemini API. Reintentos restantes: ${retries - 1}`, e);
                retries--;
                if (retries === 0) {
                    const errorText = "## ⚠️ ALTA DEMANDA EN LOS SERVIDORES CUÁNTICOS\n\nActualmente, miles de usuarios están colapsando la onda de probabilidad simultáneamente y nuestros servidores cuánticos están saturados.\n\nPor favor, **cierra esta ventana, espera unos segundos y vuelve a pulsar el botón de Generar Informe**.\n\nTus cartas y parámetros seguirán guardados para que no tengas que volver a elegirlos.\n\n*(Nuestros ingenieros ya están escalando los servidores para soportar el crecimiento masivo).*";
                    res.write(`data: ${JSON.stringify({ text: errorText })}\n\n`);
                } else {
                    await new Promise(resolve => setTimeout(resolve, 2000 * (4 - retries)));
                }
            }
        }
        
        // Append static text if the generation succeeded
        if (success) {
            try {
                const staticPathFile = path.join(__dirname, 'texto_estatico_informe.txt');
                if (fs.existsSync(staticPathFile)) {
                    const staticContent = fs.readFileSync(staticPathFile, 'utf8');
                    res.write(`data: ${JSON.stringify({ text: '\n\n' + staticContent })}\n\n`);
                }
            } catch (err) {
                console.error("Error leyendo texto_estatico_informe.txt", err);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error("Error generando reporte:", error);
        res.status(500).json({ error: "Error ensamblando el informe determinista" });
    }
});

// Servir la aplicación React (PWA) estática
app.use(express.static(path.join(__dirname, '../benturi_pwa/dist')));

// Ruta comodín para que el enrutamiento de React funcione correctamente (Express 5 fix)
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, '../benturi_pwa/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Backend de Bénturi ejecutándose en el puerto ${PORT}`);
});
