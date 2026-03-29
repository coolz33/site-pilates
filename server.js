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
    console.log(`[${new Date().toLocaleTimeString()}] 📥 ${req.method} ${req.url}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Headers de sécurité essentiels
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Plus souple pour les popups
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
        try {
            const rawBodyBuffer = Buffer.concat(chunks);
            req.rawBody = rawBodyBuffer;
            const body = rawBodyBuffer.toString();

            if (req.url.includes('webhook')) console.log(`[STRIPE] Requête reçue sur ${req.url}`);

            req.body = body ? JSON.parse(body) : {};
        } catch (e) { req.body = {}; }

        try {
        // Sécurisation de l'URL pour éviter les plantages si le header host est absent
        const host = req.headers.host || `localhost:${PORT}`;
        const parsedUrl = new URL(req.url, `http://${host}`);
        // On extrait les paramètres GET (query string) pour les rendre accessibles dans req.query
        req.query = Object.fromEntries(parsedUrl.searchParams);
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

            // SÉCURITÉ : Liste des fichiers et dossiers strictement interdits au public
            const forbiddenNames = [
                '.env', 'package.json', 'package-lock.json', 'server.js', 
                'database.js', 'Dockerfile', 'docker-compose.yml', 'node_modules', 
                'routes', 'technical_document.md', 'user_manual.md', 'README.md', 
                '.git', '.gitignore', '.dockerignore'
            ];

            const fileName = path.basename(filePath).toLowerCase();
            const isDotFile = fileName.startsWith('.');
            const isForbidden = forbiddenNames.some(forbidden => 
                fileName === forbidden.toLowerCase() || 
                relativePath.toLowerCase().startsWith(forbidden.toLowerCase() + '/')
            );

            if (isDotFile || isForbidden) {
                console.warn(`[SECURITY] Tentative d'accès bloquée : ${relativePath}`);
                res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ message: 'Accès interdit : ce fichier est protégé.' }));
                return;
            }

            const extname = String(path.extname(filePath)).toLowerCase();
            const mimeTypes = {
                '.html': 'text/html',
                '.js': 'text/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.ico': 'image/x-icon',
            };

            const contentType = mimeTypes[extname] || 'application/octet-stream';

            fs.readFile(filePath, (error, content) => {
                if (error) {
                    // Si c'est une requête API ou un fichier qui a une extension (ex: .css, .js), 
                    // on ne renvoie SURTOUT PAS index.html
                    const hasExtension = extname !== '';
                    const isApi = pathname.startsWith('/api');

                    if (error.code === 'ENOENT' && !isApi && !hasExtension) {
                        // Vrai routage SPA : on renvoie l'index pour les routes virtuelles (/profil, /planning)
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
                    const responseHeaders = { 'Content-Type': contentType };
                    if (contentType.includes('text') || contentType.includes('javascript') || contentType.includes('json')) {
                        responseHeaders['Content-Type'] += '; charset=utf-8';
                    }
                    
                    // Désactiver le cache du navigateur pour faciliter le développement
                    responseHeaders['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
                    
                    res.writeHead(200, responseHeaders);
                    res.end(content);
                }
            });
        }
        } catch (criticalErr) {
            console.error('🔥 ERREUR CRITIQUE SERVEUR :', criticalErr);
            if (!res.writableEnded) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Crash interne du gestionnaire de requêtes' }));
            }
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
