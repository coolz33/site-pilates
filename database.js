const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pilates',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test immédiat de la connexion pour remonter les erreurs de configuration au démarrage
pool.getConnection()
    .then(conn => {
        console.log('🐘 Pool MySQL prêt (Host: ' + (process.env.DB_HOST || 'localhost') + ')');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Erreur critique de connexion DB:', err.message);
    });

module.exports = pool;