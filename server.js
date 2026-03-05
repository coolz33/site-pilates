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

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Parse Body
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            req.body = body ? JSON.parse(body) : {};
        } catch (e) {
            req.body = {};
        }

        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const pathname = parsedUrl.pathname;

        if (pathname.startsWith('/api')) {
            await api.handleRequest(req, res);
        } else {
            const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
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
                    console.error(`--- ❌ Fichier statique introuvable : ${filePath}`);
                    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ message: 'Fichier ou route non trouvée' }));
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
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
