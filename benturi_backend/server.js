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
        const promptFile = path.join(__dirname, '../Informe Usuario .txt');
        const systemPrompt = fs.readFileSync(promptFile, 'utf8');
        
        // Leer base de conocimientos de combinaciones y significados deterministas
        const kbPath = path.join(__dirname, 'base_conocimiento_cartas.json');
        const detPath = path.join(__dirname, 'base_determinista_cartas.json');
        
        let kb = { significado_cartas: [], combinaciones: [] };
        let det = { cartas: {}, textos_fijos: {} };
        
        try {
            kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
            det = JSON.parse(fs.readFileSync(detPath, 'utf8'));
        } catch (e) {
            console.error("No se pudo leer bases de conocimiento JSON", e);
        }

        const normalizeCard = (name) => name ? name.toLowerCase().replace(/ de /g, ' ').trim() : '';
        
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
                const parts = c.combinacion.toLowerCase().split('+').map(p => p.trim().replace('.', ''));
                if (parts.length === normalizedInput.length) {
                    // Comprobación directa exacta (1 a 1 en el mismo orden)
                    const isDirectMatch = parts.every((p, index) => normalizeCard(p) === normalizedInput[index]);
                    if (isDirectMatch) return true;
                    
                    // Si es doble, permitimos el cruce inverso
                    if (parts.length === 2) {
                        const isReverseMatch = normalizeCard(parts[0]) === normalizedInput[1] && normalizeCard(parts[1]) === normalizedInput[0];
                        if (isReverseMatch) return true;
                    }
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

        if (result.q1) {
            // Matriz 24
            vectoresArray = [
                { posicion: "Cuadrante 1: Origen y Causa Subyacente", cartas: result.q1 },
                { posicion: "Cuadrante 2: Fricción y Resistencia", cartas: result.q2 },
                { posicion: "Cuadrante 3: Puntos de Inflexión y Acción", cartas: result.q3 },
                { posicion: "Cuadrante 4: Proyección y Desenlace", cartas: result.q4 }
            ];
            contextText = `TIPO DE MATRIZ: Matriz Express de 24 Vectores\nPREGUNTA DEL USUARIO: ${question}\n\nDATOS EXTRAÍDOS (Resumen por Cuadrantes):\n${JSON.stringify(vectoresArray, null, 2)}`;
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
                    const errorText = "# INFORME DE PROYECCIÓN DE FUTURO Y MATRIZ VECTORIAL\n\nHubo un error de conexión persistente con la IA cuántica. Detalles del error: " + e.message;
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
