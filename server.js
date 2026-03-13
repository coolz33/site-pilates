/**
 * @file server.js
 * @description Serveur HTTP natif Node.js.
 * Gère le routage API et le service de fichiers statiques pour le frontend.
 */

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

/** Import des modules locaux avec vérification de chemin */
const routesDir = path.join(__dirname, 'routes');
console.log("🔍 DIAGNOSTIC DOCKER :");
console.log("   -- Dossier de travail :", __dirname);

if (fs.existsSync(routesDir)) {
    const files = fs.readdirSync(routesDir);
    console.log("   -- ✅ Dossier /routes trouvé. Fichiers présents :", files);
    if (!files.includes('api.js')) {
        console.error("   -- ❌ api.js est absent du dossier routes !");
        process.exit(1);
    }
} else {
    console.error("   -- ❌ Le dossier /routes est INTROUVABLE dans le conteneur !");
    process.exit(1);
}

const api = require('./routes/api');
const pool = require('./database');

// Gestion des erreurs globales pour éviter le crash en boucle sans logs
process.on('uncaughtException', (err) => {
    console.error('💥 Erreur non gérée (Uncaught Exception):', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Promesse non gérée (Unhandled Rejection):', reason);
});

const PORT = process.env.PORT || 5000;

/** Création du serveur HTTP */
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Headers de sécurité essentiels
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Parse Body
    const chunks = [];
    req.on('data', chunk => {
        chunks.push(chunk);
    });

    req.on('end', async () => {
        const rawBodyBuffer = Buffer.concat(chunks);
        req.rawBody = rawBodyBuffer; // On stocke le buffer brut pour Stripe
        const body = rawBodyBuffer.toString();

        if (req.url.includes('webhook')) console.log(`[STRIPE] Requête reçue sur ${req.url}`);

        try {
            req.body = body ? JSON.parse(body) : {};
        } catch (e) {
            req.body = {};
        }

        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const pathname = parsedUrl.pathname;

        if (pathname.startsWith('/api')) {
            try {
                await api.handleRequest(req, res);
            } catch (err) {
                console.error('❌ Erreur lors du traitement de la requête API:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Erreur interne du serveur' }));
            }
        } else {
            const relativePath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.slice(1));
            const filePath = path.join(__dirname, relativePath);

            const extname = String(path.extname(filePath)).toLowerCase();
            const mimeTypes = {
                '.html': 'text/html',
                '.js': 'text/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpg',
                '.svg': 'image/svg+xml',
            };

            const contentType = mimeTypes[extname] || 'application/octet-stream';

            fs.readFile(filePath, (error, content) => {
                if (error) {
                    // Si le fichier n'est pas trouvé (ENOENT) et que ce n'est pas une route API,
                    // on sert index.html pour le routage SPA (History API).
                    if (error.code === 'ENOENT' && !pathname.startsWith('/api')) {
                        fs.readFile(path.join(__dirname, 'index.html'), (err, indexContent) => {
                            if (err) {
                                console.error(`--- ❌ Erreur de lecture de index.html : ${err}`);
                                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                                res.end('<h1>500 Internal Server Error</h1>');
                            } else {
                                res.writeHead(200, { 'Content-Type': 'text/html' });
                                res.end(indexContent, 'utf-8');
                            }
                        });
                    } else {
                        // Gestion des erreurs originales pour les autres types d'erreurs ou les routes API
                        if (!filePath.endsWith('.map') && !filePath.endsWith('favicon.ico')) {
                            console.error(`--- ❌ Fichier statique introuvable : ${filePath}`);
                        }
                        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ message: 'Fichier ou route non trouvée' }));
                    }
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                }
            });
        }
    });
});

// Vérification de la connexion Base de Données au démarrage
pool.getConnection()
    .then(connection => {
        console.log('✅ Connecté à la base de données MySQL');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Erreur de connexion à la base de données:', err.message);
        console.log('💡 Conseil: Vérifiez que DB_HOST dans votre .env n\'est pas "localhost" mais l\'IP de votre NAS.');
    });

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`❌ Erreur: Le port ${PORT} est déjà utilisé. Changez PORT dans votre .env`);
    } else {
        console.error('❌ Erreur serveur:', e);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur démarré sur : http://localhost:${PORT}`);
    console.log(`📡 En attente de requêtes...`);
});
