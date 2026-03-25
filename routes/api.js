/**
 * @file api.js
 * @description Gestionnaire de routes API pour le backend Pilates.
 * Utilise un pool de connexion MySQL pour les opérations CRUD.
 */

const pool = require('../database');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'pilates_super_secret_key_2026';

/**
 * Nettoie une chaîne de caractères pour éviter les injections XSS
 * @param {string} str - La chaîne à nettoyer
 * @returns {string} La chaîne sécurisée
 */
const escapeHtml = (str) => {
    if (!str) return str;
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

/**
 * Fonction de nettoyage : Vérifie si l'utilisateur possède des cours ayant dépassé leur date d'expiration.
 * Si oui, ils sont supprimés et une transaction est ajoutée à l'historique.
 */
const cleanupExpiredBatches = async (userId) => {
    try {
        const [expired] = await pool.query('SELECT id, credits FROM user_batches WHERE user_id = ? AND credits > 0 AND expires_at < NOW()', [userId]);
        if (expired.length > 0) {
            let totalExpired = 0;
            for (const batch of expired) {
                totalExpired += batch.credits;
                await pool.query('UPDATE user_batches SET credits = 0 WHERE id = ?', [batch.id]);
            }
            if (totalExpired > 0) {
                await pool.query('UPDATE users SET credits_balance = GREATEST(0, credits_balance - ?) WHERE id = ?', [totalExpired, userId]);
                await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, 'expiration', -totalExpired, `Expiration automatique de ${totalExpired} cours`]);
            }
        }
                
                // Nettoyage des abonnements expirés
                const [expiredSubs] = await pool.query('SELECT id FROM users WHERE id = ? AND is_subscribed = 1 AND subscription_expires_at IS NOT NULL AND subscription_expires_at < NOW()', [userId]);
                if (expiredSubs.length > 0) {
                    await pool.query('UPDATE users SET is_subscribed = 0, subscription_expires_at = NULL WHERE id = ?', [userId]);
                    await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, 'expiration', 0, `Expiration de l'abonnement`]);
                }
                
                // Resynchronisation forcée du solde total pour corriger toute erreur mathématique
                const [totalRes] = await pool.query('SELECT SUM(credits) as total FROM user_batches WHERE user_id = ? AND credits > 0', [userId]);
                const actualBalance = totalRes[0].total || 0;
                await pool.query('UPDATE users SET credits_balance = ? WHERE id = ?', [actualBalance, userId]);
    } catch(e) { console.error("Erreur cleanupExpiredBatches:", e); }
};

/**
 * Initialise la base de données : crée les tables et insère les données par défaut.
 */
const seedDB = async () => {
    try {
        // --- CRÉATION DES TABLES ---
        await pool.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id INT PRIMARY KEY DEFAULT 1,
                studioAddress VARCHAR(255),
                studioPhone VARCHAR(50),
                studioEmail VARCHAR(100),
                cancellationDelay INT DEFAULT 24,
                aiProvider VARCHAR(50) DEFAULT 'gemini'
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                firstName VARCHAR(100),
                lastName VARCHAR(100),
                name VARCHAR(200),
                email VARCHAR(100) UNIQUE,
                password VARCHAR(100),
                role VARCHAR(20) DEFAULT 'user',
                address VARCHAR(255),
                phone VARCHAR(50),
                zipCode VARCHAR(10),
                city VARCHAR(100),
                credits_balance INT DEFAULT 0,
                newsletter_subscribed BOOLEAN DEFAULT 0
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS classes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                date DATE,
                time VARCHAR(10),
                duration INT,
                capacity INT,
                credits_price INT DEFAULT 1,
                description TEXT,
                recurrence_id VARCHAR(50) DEFAULT NULL
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                description TEXT,
                duration INT,
                default_credits_price INT
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS credit_packages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100),
                subtitle VARCHAR(255) DEFAULT '',
                credits INT,
                price INT,
                description VARCHAR(255) DEFAULT '',
                expires_in_days INT DEFAULT 0,
                is_subscription BOOLEAN DEFAULT 0
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                class_id INT,
                user_id INT,
                PRIMARY KEY (class_id, user_id),
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                type VARCHAR(50),
                amount INT,
                description VARCHAR(255),
                date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS email_verifications (
                email VARCHAR(100) PRIMARY KEY,
                code VARCHAR(10),
                expires_at DATETIME
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                token VARCHAR(255) PRIMARY KEY,
                user_id INT NOT NULL,
                expires_at DATETIME NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Mise à jour des tables existantes pour ajouter les nouvelles colonnes si nécessaire
        // On utilise des blocs try/catch individuels pour que si une colonne existe déjà, le script continue
        try { await pool.query(`ALTER TABLE users ADD COLUMN credits_balance INT DEFAULT 0`); } catch (e) {}
        try { await pool.query(`ALTER TABLE classes ADD COLUMN credits_price INT DEFAULT 1`); } catch (e) {}
        try { await pool.query(`ALTER TABLE users ADD COLUMN zipCode VARCHAR(10)`); } catch (e) {}
        try { await pool.query(`ALTER TABLE users ADD COLUMN city VARCHAR(100)`); } catch (e) {}
        try { await pool.query(`ALTER TABLE users ADD COLUMN newsletter_subscribed BOOLEAN DEFAULT 0`); } catch (e) {}
        try { await pool.query(`ALTER TABLE settings ADD COLUMN cancellationDelay INT DEFAULT 24`); } catch (e) {}
        try { await pool.query(`ALTER TABLE settings ADD COLUMN aiProvider VARCHAR(50) DEFAULT 'gemini'`); } catch (e) {}
        try { await pool.query(`ALTER TABLE classes ADD COLUMN recurrence_id VARCHAR(50) DEFAULT NULL`); } catch (e) {}
        try { await pool.query(`ALTER TABLE settings ADD COLUMN facebookUrl VARCHAR(255) DEFAULT NULL`); } catch (e) {}
        try { await pool.query(`ALTER TABLE settings ADD COLUMN instagramUrl VARCHAR(255) DEFAULT NULL`); } catch (e) {}
        try { await pool.query(`ALTER TABLE settings ADD COLUMN tiktokUrl VARCHAR(255) DEFAULT NULL`); } catch (e) {}
        try { await pool.query(`ALTER TABLE credit_packages ADD COLUMN description VARCHAR(255) DEFAULT ''`); } catch (e) {}
        try { await pool.query(`ALTER TABLE credit_packages ADD COLUMN subtitle VARCHAR(255) DEFAULT ''`); } catch (e) {}
        try { await pool.query(`ALTER TABLE credit_packages ADD COLUMN expires_in_days INT DEFAULT 0`); } catch (e) {}
        try { await pool.query(`ALTER TABLE users ADD COLUMN is_subscribed BOOLEAN DEFAULT 0`); } catch (e) {}
        try { await pool.query(`ALTER TABLE credit_packages ADD COLUMN is_subscription BOOLEAN DEFAULT 0`); } catch (e) {}
        try { await pool.query(`ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME DEFAULT NULL`); } catch (e) {}
        try { await pool.query(`ALTER TABLE bookings ADD COLUMN refund_expires_at DATETIME DEFAULT NULL`); } catch (e) {}
        try { await pool.query(`ALTER TABLE settings ADD COLUMN studioSiret VARCHAR(50) DEFAULT ''`); } catch (e) {}
        try { await pool.query(`ALTER TABLE settings ADD COLUMN studioTva VARCHAR(50) DEFAULT ''`); } catch (e) {}
        
        // Migration : Convertit les faux lots de 999 crédits en véritables dates d'abonnement
        try {
            const [subBatches] = await pool.query('SELECT id, user_id, credits, expires_at FROM user_batches WHERE credits >= 50');
            for (const b of subBatches) {
                await pool.query('UPDATE users SET is_subscribed = 1, subscription_expires_at = ?, credits_balance = GREATEST(0, COALESCE(credits_balance, 0) - ?) WHERE id = ?', [b.expires_at, b.credits, b.user_id]);
                await pool.query('DELETE FROM user_batches WHERE id = ?', [b.id]);
            }
        } catch (e) { console.error("Erreur migration abonnements:", e); }
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_batches (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                credits INT,
                expires_at DATETIME NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Migration des crédits existants s'ils n'ont pas encore de lot attribué
        const [batches] = await pool.query('SELECT COUNT(*) as count FROM user_batches');
        if (batches[0].count === 0) {
            const [usersToMigrate] = await pool.query('SELECT id, credits_balance FROM users WHERE credits_balance > 0');
            for (const u of usersToMigrate) {
                await pool.query('INSERT INTO user_batches (user_id, credits, expires_at) VALUES (?, ?, NULL)', [u.id, u.credits_balance]);
            }
        }

        // Migration des anciens noms vers les nouveaux si nécessaire
        try { await pool.query(`ALTER TABLE users CHANGE points_balance credits_balance INT DEFAULT 0`); } catch (e) {}
        try { await pool.query(`ALTER TABLE classes CHANGE points_price credits_price INT DEFAULT 1`); } catch (e) {}
        try { await pool.query(`ALTER TABLE classes DROP COLUMN price`); } catch (e) {}
        try { await pool.query(`ALTER TABLE course_templates DROP COLUMN default_price`); } catch (e) {}
        try { await pool.query(`ALTER TABLE course_templates CHANGE default_points_price default_credits_price INT`); } catch (e) {}
        try { await pool.query(`ALTER TABLE course_templates ADD COLUMN default_credits_price INT DEFAULT 1`); } catch (e) {}
        try { await pool.query(`ALTER TABLE course_templates ADD COLUMN capacity INT DEFAULT 10`); } catch (e) {}
        try { await pool.query(`ALTER TABLE classes ADD COLUMN custom_capacity INT DEFAULT NULL`); } catch (e) {}

        // 1. Settings
        const [settings] = await pool.query('SELECT COUNT(*) as count FROM settings');
        if (settings[0].count === 0) {
            await pool.query('INSERT INTO settings (id, studioAddress, studioPhone, studioEmail) VALUES (1, ?, ?, ?)', ['12 Rue de la Paix, Paris', '01 23 45 67 89', 'contact@pilates.fr']);
        }

        // 2. Admin User
        const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
        if (users[0].count === 0) {
            const hashedPassword = await bcrypt.hash('admin', 10);
            await pool.query(`
                INSERT INTO users (firstName, lastName, name, email, password, role, address, phone) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                ['Admin', 'Istrateur', 'Admin Istrateur', 'admin@pilates.fr', hashedPassword, 'admin', '12 Rue de la Paix, Paris', '0123456789']
            );
        }

        // 3. Classes
        const [classes] = await pool.query('SELECT COUNT(*) as count FROM classes');
        if (classes[0].count === 0) {
            const defaultClasses = [
                ['Pilates Fondations', '2026-02-23', '09:00', 60, 10, 20, 'Idéal pour acquérir les bases de la méthode, comprendre la respiration et le placement du bassin.'],
                ['Pilates Flow', '2026-02-24', '18:30', 45, 12, 20, 'Un enchaînement fluide et dynamique pour faire monter le rythme cardiaque tout en contrôlant ses mouvements.'],
                ['Core & Posture', '2026-02-25', '12:15', 45, 8, 25, 'Focus intense sur la sangle abdominale et les muscles profonds du dos pour redresser la silhouette.'],
                ['Pilates Avancé', '2026-02-26', '19:00', 60, 10, 25, 'Réservé aux pratiquants réguliers. Des exercices complexes pour défier votre équilibre et votre force.'],
                ['Stretching & Mobilité', '2026-02-28', '10:00', 60, 15, 15, "Une séance douce axée sur les étirements profonds et l'amplitude articulaire pour libérer les tensions."]
            ];
            await pool.query('INSERT INTO classes (title, date, time, duration, capacity, credits_price, description) VALUES ?', [defaultClasses]);
        }

        // 3b. Course Templates (Exemples)
        const [templates] = await pool.query('SELECT COUNT(*) as count FROM course_templates');
        if (templates[0].count === 0) {
            const defaultTemplates = [
                ['Pilates Mat Fondamental', 'Séance au sol axée sur les principes de base.', 60, 20, 10],
                ['Pilates Flow Dynamique', 'Enchaînement fluide pour travailler le cardio et la souplesse.', 45, 22, 10],
                ['Spécial Dos & Posture', 'Focus sur le renforcement des muscles profonds du dos.', 50, 25, 10],
                ['Pilates avec Accessoires', 'Utilisation de ballons, cercles et élastiques.', 60, 23, 10]
            ];
            await pool.query('INSERT INTO course_templates (title, description, duration, default_credits_price, capacity) VALUES ?', [defaultTemplates]);
        }

        // 4. Credit Packages (Tarif dégressif)
        const [packages] = await pool.query('SELECT COUNT(*) as count FROM credit_packages');
        if (packages[0].count === 0) {
            await pool.query('INSERT INTO credit_packages (name, subtitle, description, credits, price, expires_in_days, is_subscription) VALUES ?', [[
                ["À l'unité", 'Un cours', 'Tout le matériel est fourni sur place.\nSans engagement.', 1, 18, 0, 0],
                ['Carte', 'Carte 10 cours', 'Soit 15 € le cours.\nValable 6 mois.', 10, 150, 180, 0],
                ['Abonnement', "Abonnement à l'année", 'Soit 12€50 le cours.\nUn cours fixe par semaine de septembre à fin juin.\nUn cours à chaque vacances scolaires.', 999, 475, 365, 1]
            ]]);
        } else {
            // Mise à jour forcée des packs pour correspondre à la demande
            await pool.query('DELETE FROM credit_packages');
            await pool.query('INSERT INTO credit_packages (name, subtitle, description, credits, price, expires_in_days, is_subscription) VALUES ?', [[
                ["À l'unité", 'Un cours', 'Tout le matériel est fourni sur place.\nSans engagement.', 1, 18, 0, 0],
                ['Carte', 'Carte 10 cours', 'Soit 15 € le cours.\nValable 6 mois.', 10, 150, 180, 0],
                ['Abonnement', "Abonnement à l'année", 'Soit 12€50 le cours.\nUn cours fixe par semaine de septembre à fin juin.\nUn cours à chaque vacances scolaires.', 999, 475, 365, 1]
            ]]);
        }
        console.log('✅ Base de données MySQL initialisée');
    } catch (err) {
        console.error('❌ Erreur initialisation DB:', err);
    }
};
seedDB();

/**
 * Envoie un email d'annulation aux inscrits lorsqu'un ou plusieurs cours sont supprimés.
 */
const sendCancellationEmails = async (classIds) => {
    if (!classIds || classIds.length === 0) return;
    try {
        const [bookings] = await pool.query(`
            SELECT c.title, DATE_FORMAT(c.date, '%d/%m/%Y') as dateStr, c.time, u.email, u.firstName
            FROM bookings b
            JOIN classes c ON b.class_id = c.id
            JOIN users u ON b.user_id = u.id
            WHERE c.id IN (?)
        `, [classIds]);

        if (bookings.length === 0) return;

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT),
            secure: process.env.SMTP_PORT == 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            tls: { rejectUnauthorized: false }
        });

        for (const b of bookings) {
            const html = `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e7e5e4; border-radius: 12px; max-width: 600px; margin: auto;">
                    <h2 style="color: #991b1b;">Annulation de cours</h2>
                    <p>Bonjour ${b.firstName},</p>
                    <p>Nous sommes au regret de vous informer que le cours <strong>${b.title}</strong> prévu le <strong>${b.dateStr} à ${b.time}</strong> a malheureusement dû être annulé par notre équipe.</p>
                    <p>Si une réservation avait été décomptée, votre solde de cours a été ou sera mis à jour prochainement.</p>
                    <p>Nous vous prions de nous excuser pour la gêne occasionnée.</p>
                    <p>L'équipe L'espace doré.</p>
                </div>
            `;
            await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: b.email, subject: "Annulation de votre cours - L'espace doré", html: html }).catch(() => {});
        }
    } catch (err) { console.error("[API] Erreur annulation email:", err); }
};

/**
 * Point d'entrée principal pour le traitement des requêtes HTTP.
 * @param {http.IncomingMessage} req - Objet de requête Node.js.
 * @param {http.ServerResponse} res - Objet de réponse Node.js.
 */
const handleRequest = async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    // Nettoyage du chemin : on enlève /api au début et les slashes à la fin
    let path = url.pathname.replace(/^\/api/, '');
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    if (!path) path = '/';
    
    const method = req.method;
    console.log(`[API] Incoming Request - Raw URL: ${req.url}, Method: ${method}, Processed Path: ${path}`); // Debug log
    console.log(`[API] ${method} ${path}`);

    /**
     * Envoie une réponse JSON.
     * @param {number} status - Code de statut HTTP.
     * @param {Object} data - Données à envoyer.
     */
    const send = (status, data) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    // --- VERIFICATION JWT GLOBALE ---
    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/send-verification-code', '/classes', '/course-templates', '/credit-packages', '/settings', '/webhook/stripe', '/newsletter/unsubscribe'];
    let reqUser = null;

    if (!publicPaths.includes(path) && !(method === 'POST' && path === '/checkout/create-session')) {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return send(401, { success: false, message: 'Accès non autorisé : Token manquant' });
        }
        const token = authHeader.split(' ')[1];
        try {
            reqUser = jwt.verify(token, JWT_SECRET);
            
            // Validation des rôles
            const isAdminRoute = path === '/users' || path === '/transactions' || path === '/credit-packages/bulk' || path === '/classes/bulk' ||
                path.match(/^\/users\/\d+\/(details|role|subscription|batches|remove-credits|remove-batch-credits|batches\/\d+|message)$/) ||
                (method !== 'GET' && path.match(/^\/(course-templates|credit-packages|settings)/)) ||
                (method !== 'GET' && path.match(/^\/classes\/(\d+|series\/.+)$/) && method === 'DELETE') ||
                (method !== 'GET' && path === '/classes') || (method === 'POST' && path === '/newsletter/send');

            if (isAdminRoute && reqUser.role !== 'admin') {
                return send(403, { success: false, message: 'Accès interdit : Administrateur requis' });
            }

            // Protection des données personnelles de l'utilisateur
            const userMatch = path.match(/^\/users\/(\d+)\/?$/);
            if (userMatch && reqUser.role !== 'admin' && parseInt(userMatch[1]) !== reqUser.id) {
                return send(403, { success: false, message: 'Accès interdit' });
            }

            // Protection anti-IDOR globale (empêche booking / modification pour un autre utilisateur)
            if (reqUser.role !== 'admin') {
                if (req.body && req.body.userId && parseInt(req.body.userId) !== reqUser.id) {
                    return send(403, { success: false, message: 'Action non autorisée sur ce compte' });
                }
                if (req.body && req.body.id && path === '/users/profile' && parseInt(req.body.id) !== reqUser.id) {
                    return send(403, { success: false, message: 'Modification du profil interdite' });
                }
            }
        } catch (e) {
            return send(401, { success: false, message: 'Accès non autorisé : Token invalide' });
        }
    }

    try {
        // --- ROUTES USERS ---
        if (method === 'GET' && path === '/users') {
            const [users] = await pool.query('SELECT * FROM users');
            return send(200, users);
        }

        // Gestion des routes /users/:id (Profil, Détails, Suppression)
        const userIdMatch = path.match(/^\/users\/(\d+)\/?$/);
        if (userIdMatch) {
            const userId = userIdMatch[1];

            if (method === 'GET') {
                const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
                if (users.length > 0) {
                    await cleanupExpiredBatches(userId);
                    const [updatedUser] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
                    
                    if (updatedUser[0].is_subscribed) {
                        const [weeklyBookings] = await pool.query(`SELECT COUNT(*) as count FROM bookings b JOIN classes c ON b.class_id = c.id WHERE b.user_id = ? AND YEARWEEK(c.date, 1) = YEARWEEK(CURDATE(), 1)`, [userId]);
                        updatedUser[0].hasUsedWeeklyBooking = weeklyBookings[0].count > 0;
                    } else {
                        updatedUser[0].hasUsedWeeklyBooking = false;
                    }
                    
                    const { password: _, ...userWithoutPassword } = updatedUser[0];
                    const [transactions] = await pool.query(`
                        SELECT id, type, amount, description, DATE_FORMAT(date, '%Y-%m-%d %H:%i') as date 
                        FROM transactions 
                        WHERE user_id = ? 
                        ORDER BY date DESC`, [userId]);
                    const [activeBatches] = await pool.query(`
                        SELECT credits, expires_at 
                        FROM user_batches 
                        WHERE user_id = ? AND credits > 0 
                        ORDER BY expires_at IS NULL, expires_at ASC`, [userId]);
                    return send(200, { ...userWithoutPassword, transactions, activeBatches });
                }
                return send(404, { message: 'Utilisateur non trouvé' });
            }
            
            if (method === 'DELETE') {
                await pool.query('DELETE FROM users WHERE id = ?', [userId]);
                return send(200, { success: true, message: 'Utilisateur supprimé' });
            }
        }

        // --- ROUTES GESTION CLIENT (ADMIN) ---
        const userDetailsMatch = path.match(/^\/users\/(\d+)\/details$/);
        if (method === 'GET' && userDetailsMatch) {
            const userId = userDetailsMatch[1];
            await cleanupExpiredBatches(userId);
            const [user] = await pool.query('SELECT id, firstName, lastName, email, phone, address, zipCode, city, credits_balance, newsletter_subscribed, role, is_subscribed FROM users WHERE id = ?', [userId]);
            if (!user.length) return send(404, { message: 'Utilisateur non trouvé' });

            const [bookings] = await pool.query(`
                SELECT b.class_id, c.title, DATE_FORMAT(c.date, '%Y-%m-%d') as date, c.time, c.duration 
                FROM bookings b 
                JOIN classes c ON b.class_id = c.id 
                WHERE b.user_id = ? 
                ORDER BY c.date DESC, c.time DESC`, [userId]);

            const [transactions] = await pool.query(`
                SELECT id, type, amount, description, DATE_FORMAT(date, '%Y-%m-%d %H:%i') as date 
                FROM transactions 
                WHERE user_id = ? ORDER BY date DESC`, [userId]);

            const [activeBatches] = await pool.query(`
                SELECT id, credits, expires_at 
                FROM user_batches 
                WHERE user_id = ? AND credits > 0 
                ORDER BY expires_at IS NULL, expires_at ASC`, [userId]);

            return send(200, { user: user[0], bookings, transactions, activeBatches });
        }

        if (method === 'GET' && path === '/transactions') {
            const [transactions] = await pool.query(`
                SELECT t.id, t.user_id, t.type, t.amount, t.description, DATE_FORMAT(t.date, '%d/%m/%Y %H:%i') as date, u.firstName, u.lastName 
                FROM transactions t 
                LEFT JOIN users u ON t.user_id = u.id 
                ORDER BY t.date DESC LIMIT 1000
            `);
            return send(200, transactions);
        }

        const roleMatch = path.match(/^\/users\/(\d+)\/role$/);
        if (method === 'PUT' && roleMatch) {
            const userId = roleMatch[1];
            const { role } = req.body;
            await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
            return send(200, { success: true });
        }

        const subMatch = path.match(/^\/users\/(\d+)\/subscription$/);
        if (method === 'PUT' && subMatch) {
            const userId = subMatch[1];
            const { is_subscribed } = req.body;
            if (is_subscribed) {
                const d = new Date(); d.setFullYear(d.getFullYear() + 1);
                await pool.query('UPDATE users SET is_subscribed = 1, subscription_expires_at = ? WHERE id = ?', [d.toISOString().slice(0, 19).replace('T', ' '), userId]);
            } else {
                await pool.query('UPDATE users SET is_subscribed = 0, subscription_expires_at = NULL WHERE id = ?', [userId]);
            }
            return send(200, { success: true });
        }

        const batchAddMatch = path.match(/^\/users\/(\d+)\/batches$/);
        if (method === 'POST' && batchAddMatch) {
            const userId = batchAddMatch[1];
            const { amount, expires_in_days, transactionType, paymentMethod, price } = req.body;
            await cleanupExpiredBatches(userId);
            
            let expiresAtStr = null;
            if (expires_in_days && parseInt(expires_in_days) > 0) {
                const d = new Date();
                d.setDate(d.getDate() + parseInt(expires_in_days));
                expiresAtStr = d.toISOString().slice(0, 19).replace('T', ' ');
            }

            let type = 'adjustment';
            let description = 'Ajout manuel de cours (Admin)';
            
            if (transactionType === 'purchase') {
                type = 'purchase';
                const pMethod = paymentMethod || 'Autre moyen';
                const pPrice = price || 0;
                description = `Achat de cours par ${pMethod} (${pPrice}€)`;
            }
            
            await pool.query('START TRANSACTION');
            await pool.query('UPDATE users SET credits_balance = GREATEST(0, COALESCE(credits_balance, 0) + ?) WHERE id = ?', [parseInt(amount), userId]);
            await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, type, parseInt(amount), description]);
            await pool.query('INSERT INTO user_batches (user_id, credits, expires_at) VALUES (?, ?, ?)', [userId, parseInt(amount), expiresAtStr]);
            await pool.query('COMMIT');
            
            await cleanupExpiredBatches(userId);
            return send(200, { success: true });
        }

        const removeCreditsMatch = path.match(/^\/users\/(\d+)\/remove-credits$/);
        if (method === 'POST' && removeCreditsMatch) {
            const userId = removeCreditsMatch[1];
            const { amount } = req.body;
            let toDeduct = parseInt(amount);
            
            if (toDeduct > 0) {
                await pool.query('START TRANSACTION');
                // On retire en priorité sur les lots qui n'ont pas d'expiration, ou ceux qui expirent le plus tard
                const [batches] = await pool.query('SELECT id, credits FROM user_batches WHERE user_id = ? AND credits > 0 ORDER BY expires_at IS NULL DESC, expires_at DESC', [userId]);
                for (const b of batches) {
                    if (toDeduct <= 0) break;
                    const deduction = Math.min(b.credits, toDeduct);
                    await pool.query('UPDATE user_batches SET credits = credits - ? WHERE id = ?', [deduction, b.id]);
                    toDeduct -= deduction;
                }
                
                const actualDeducted = parseInt(amount) - toDeduct;
                if (actualDeducted > 0) {
                    await pool.query('UPDATE users SET credits_balance = GREATEST(0, COALESCE(credits_balance, 0) - ?) WHERE id = ?', [actualDeducted, userId]);
                    await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, 'adjustment', -actualDeducted, 'Retrait manuel de cours (Admin)']);
                }
                await pool.query('COMMIT');
                await cleanupExpiredBatches(userId);
            }
            return send(200, { success: true });
        }

        const removeBatchMatch = path.match(/^\/users\/(\d+)\/remove-batch-credits$/);
        if (method === 'POST' && removeBatchMatch) {
            const userId = removeBatchMatch[1];
            const { amount, batchIds } = req.body;
            let toDeduct = parseInt(amount);
            
            if (toDeduct > 0 && Array.isArray(batchIds) && batchIds.length > 0) {
                await pool.query('START TRANSACTION');
                
                const [batches] = await pool.query('SELECT id, credits FROM user_batches WHERE user_id = ? AND id IN (?) AND credits > 0 ORDER BY id ASC', [userId, batchIds]);
                
                for (const b of batches) {
                    if (toDeduct <= 0) break;
                    const deduction = Math.min(b.credits, toDeduct);
                    await pool.query('UPDATE user_batches SET credits = credits - ? WHERE id = ?', [deduction, b.id]);
                    toDeduct -= deduction;
                }
                
                const actualDeducted = parseInt(amount) - toDeduct;
                if (actualDeducted > 0) {
                    await pool.query('UPDATE users SET credits_balance = GREATEST(0, COALESCE(credits_balance, 0) - ?) WHERE id = ?', [actualDeducted, userId]);
                    await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, 'adjustment', -actualDeducted, 'Retrait ciblé de cours (Admin)']);
                }
                await pool.query('COMMIT');
                await cleanupExpiredBatches(userId);
            }
            return send(200, { success: true });
        }

        const batchDelMatch = path.match(/^\/users\/(\d+)\/batches\/(\d+)$/);
        if (method === 'DELETE' && batchDelMatch) {
            const userId = batchDelMatch[1];
            const batchId = batchDelMatch[2];
            
            await pool.query('START TRANSACTION');
            const [batches] = await pool.query('SELECT credits FROM user_batches WHERE id = ? AND user_id = ?', [batchId, userId]);
            if (batches.length > 0) {
                const creditsToRemove = batches[0].credits;
                await pool.query('DELETE FROM user_batches WHERE id = ?', [batchId]);
                await pool.query('UPDATE users SET credits_balance = GREATEST(0, COALESCE(credits_balance, 0) - ?) WHERE id = ?', [creditsToRemove, userId]);
                await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, 'adjustment', -creditsToRemove, 'Retrait manuel de cours (Admin)']);
            }
            await pool.query('COMMIT');
            
            await cleanupExpiredBatches(userId); // Recalcule le solde exact après l'ajustement
            return send(200, { success: true });
        }

        const messageMatch = path.match(/^\/users\/(\d+)\/message$/);
        if (method === 'POST' && messageMatch) {
            const userId = messageMatch[1];
            const { subject, message } = req.body;
            const [users] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);
            if (!users.length) return send(404, { message: 'Utilisateur non trouvé' });

            // Réutilisation de la configuration SMTP (simplifiée ici)
            const transporter = nodemailer.createTransport({ 
                host: process.env.SMTP_HOST, 
                port: parseInt(process.env.SMTP_PORT), 
                secure: process.env.SMTP_PORT == 465, 
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
                tls: { rejectUnauthorized: false }
            });
            await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: users[0].email, subject: subject, html: message });

            return send(200, { success: true });
        }

        if (method === 'POST' && path === '/login') {
            const { email, password } = req.body;
            const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
            
            if (users.length > 0) {
                const user = users[0];
                let match = await bcrypt.compare(password, user.password);

                // Solution de secours : si le hash ne correspond pas, on vérifie le texte en clair
                if (!match && password === user.password) {
                    // Migration automatique : on hache le mot de passe pour sécuriser le compte
                    const hashedPassword = await bcrypt.hash(password, 10);
                    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
                    match = true;
                }

                if (match) {
                    await cleanupExpiredBatches(user.id);
                    const [updatedUser] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
                    
                    if (updatedUser[0].is_subscribed) {
                        const [weeklyBookings] = await pool.query(`SELECT COUNT(*) as count FROM bookings b JOIN classes c ON b.class_id = c.id WHERE b.user_id = ? AND YEARWEEK(c.date, 1) = YEARWEEK(CURDATE(), 1)`, [user.id]);
                        updatedUser[0].hasUsedWeeklyBooking = weeklyBookings[0].count > 0;
                    } else {
                        updatedUser[0].hasUsedWeeklyBooking = false;
                    }
                    
                    const { password: _, ...userWithoutPassword } = updatedUser[0];
                    const [activeBatches] = await pool.query(`
                        SELECT credits, expires_at 
                        FROM user_batches 
                        WHERE user_id = ? AND credits > 0 
                        ORDER BY expires_at IS NULL, expires_at ASC`, [user.id]);
                    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
                    return send(200, { success: true, user: { ...userWithoutPassword, activeBatches }, token });
                } else {
                    return send(401, { success: false, message: 'Identifiants invalides' });
                }
            } else {
                return send(401, { success: false, message: 'Identifiants invalides' });
            }
        }

        if (method === 'POST' && path === '/forgot-password') {
            const { email } = req.body;
            const [users] = await pool.query('SELECT id, firstName FROM users WHERE email = ?', [email]);
            if (users.length === 0) {
                // Pour des raisons de sécurité, on ne doit pas indiquer si l'email existe ou non.
                // On renvoie toujours un succès pour ne pas donner d'indices aux attaquants.
                return send(200, { success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
            }

            const user = users[0];
            const token = require('crypto').randomBytes(32).toString('hex'); // Jeton sécurisé
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // Expire dans 1 heure

            await pool.query('INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)', [token, user.id, expiresAt]);

            const resetLink = `http://${req.headers.host}/#reset-password?token=${token}`;

            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT),
                secure: process.env.SMTP_PORT == 465,
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
                tls: { rejectUnauthorized: false }
            });

            try {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: email,
                    subject: 'Réinitialisation de votre mot de passe - L\'espace doré',
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e7e5e4; border-radius: 12px;">
                            <h2 style="color: #065f46;">Réinitialisation de votre mot de passe</h2>
                            <p>Bonjour ${user.firstName},</p>
                            <p>Vous avez demandé à réinitialiser votre mot de passe. Veuillez cliquer sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
                            <p style="text-align: center; margin: 20px 0;">
                                <a href="${resetLink}" style="background-color: #065f46; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                    Réinitialiser mon mot de passe
                                </a>
                            </p>
                            <p>Ce lien est valide pendant 1 heure. Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
                        </div>
                    `
                });
                console.log("[API] Email de réinitialisation envoyé à:", email);
                return send(200, { success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
            } catch (mailErr) {
                console.error("[API] Erreur lors de l'envoi de l'email de réinitialisation:", mailErr);
                return send(500, { success: false, message: "Erreur lors de l'envoi de l'email de réinitialisation. Vérifiez la configuration SMTP." });
            }
        }

        if (method === 'POST' && path === '/reset-password') {
            const { token, newPassword } = req.body;

            const [resetRequest] = await pool.query('SELECT user_id FROM password_resets WHERE token = ? AND expires_at > NOW()', [token]);
            if (resetRequest.length === 0) {
                return send(400, { success: false, message: 'Jeton invalide ou expiré.' });
            }

            const userId = resetRequest[0].user_id;
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await pool.query('START TRANSACTION');
            await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
            await pool.query('DELETE FROM password_resets WHERE token = ?', [token]);
            await pool.query('COMMIT');

            return send(200, { success: true, message: 'Votre mot de passe a été réinitialisé avec succès.' });
        }

        if (method === 'POST' && path === '/send-verification-code') {
            console.log(`[API] DEBUG: Matched POST /send-verification-code route.`); // Debug log
            let { email } = req.body;
            if (email) email = email.trim().toLowerCase();

            const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) return send(400, { success: false, message: 'Cet email est déjà utilisé' });

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            console.log(`[API] Generated verification code for ${email}: ${code}`);

            await pool.query(
                'INSERT INTO email_verifications (email, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE)) ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = DATE_ADD(NOW(), INTERVAL 15 MINUTE)',
                [email, code]
            );

            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT),
                secure: process.env.SMTP_PORT == 465,
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
                tls: { rejectUnauthorized: false }
            });

            try {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: email,
                    subject: 'Votre code de vérification - L\'espace doré',
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e7e5e4; border-radius: 12px;">
                            <h2 style="color: #065f46;">Vérification de votre compte</h2>
                            <p>Veuillez saisir le code suivant pour valider votre inscription :</p>
                            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #065f46; margin: 20px 0; text-align: center; background: #f0fdf4; padding: 15px; border-radius: 8px;">
                                ${code}
                            </div>
                        </div>
                    `
                });
                console.log("[API] Email de vérification envoyé à:", email);
                return send(200, { success: true });
            } catch (mailErr) {
                console.error("[API] Erreur lors de l'envoi de l'email de vérification:", mailErr);
                return send(500, { success: false, message: "Erreur lors de l'envoi de l'email de vérification. Vérifiez la configuration SMTP." });
            }
        }

        if (method === 'POST' && path === '/register') {
            console.log(`[API] DEBUG: Matched POST /register route.`); // Debug log
            let { firstName, lastName, email, password, address, phone, zipCode, city, newsletter_subscribed, code } = req.body;

            if (email) email = email.trim().toLowerCase();
            if (code) code = code.toString().trim();

            // Sanitisation contre XSS
            firstName = escapeHtml(firstName);
            lastName = escapeHtml(lastName);
            address = escapeHtml(address);
            city = escapeHtml(city);

            // Vérification du code
            const [verification] = await pool.query('SELECT * FROM email_verifications WHERE email = ? AND code = ? AND expires_at > NOW()', [email, code]);
            if (verification.length === 0) {
                // Diagnostic log
                const [anyVerif] = await pool.query('SELECT *, NOW() as current_time FROM email_verifications WHERE email = ?', [email]);
                console.warn(`[API] Verification FAILED for ${email}. Found in DB:`, anyVerif);
                return send(400, { success: false, message: 'Code de vérification invalide ou expiré' });
            }

            const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) return send(400, { success: false, message: 'Cet email est déjà utilisé' });

            const name = `${firstName} ${lastName}`;
            const hashedPassword = await bcrypt.hash(password, 10);
            const [result] = await pool.query(
                'INSERT INTO users (firstName, lastName, name, email, password, address, phone, zipCode, city, role, newsletter_subscribed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [firstName, lastName, name, email, hashedPassword, address, phone, zipCode, city, 'user', newsletter_subscribed || 0]
            );
            await pool.query('DELETE FROM email_verifications WHERE email = ?', [email]);

            const [newUser] = await pool.query('SELECT id, firstName, lastName, name, email, role, address, phone, zipCode, city, credits_balance, newsletter_subscribed FROM users WHERE id = ?', [result.insertId]);

            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT),
                    secure: process.env.SMTP_PORT == 465,
                    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
                    tls: { rejectUnauthorized: false }
                });
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: email,
                    subject: "Bienvenue chez L'espace doré !",
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e7e5e4; border-radius: 12px; max-width: 600px; margin: auto;">
                            <h2 style="color: #065f46;">Bienvenue ${firstName} !</h2>
                            <p>Votre compte a bien été créé avec succès.</p>
                            <p>Vous pouvez dès à présent vous connecter sur notre site pour consulter le planning et réserver vos prochaines séances de Pilates.</p>
                            <p style="text-align: center; margin: 30px 0;">
                                <a href="http://${req.headers.host}/planning" style="background-color: #065f46; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                    Voir le planning
                                </a>
                            </p>
                            <p>À très bientôt au studio,<br>L'équipe L'espace doré.</p>
                        </div>
                    `
                });
            } catch (mailErr) { console.error("[API] Erreur email bienvenue:", mailErr); }

            const userToSend = newUser[0];
            const token = jwt.sign({ id: userToSend.id, role: userToSend.role }, JWT_SECRET, { expiresIn: '7d' });
            return send(200, { success: true, user: userToSend, token });
        }

        if (method === 'PUT' && path === '/users/profile') {
            let { id, firstName, lastName, email, password, address, phone, zipCode, city, newsletter_subscribed } = req.body;
            
            // Sanitisation contre XSS
            firstName = escapeHtml(firstName);
            lastName = escapeHtml(lastName);
            address = escapeHtml(address);
            city = escapeHtml(city);

            const name = `${firstName} ${lastName}`;
            
            let query = 'UPDATE users SET firstName=?, lastName=?, name=?, email=?, address=?, phone=?, zipCode=?, city=?, newsletter_subscribed=?';
            let params = [firstName, lastName, name, email, address, phone, zipCode, city, newsletter_subscribed];
            
            // On ne met à jour le mot de passe que s'il est fourni (non vide)
            if (password && password.trim() !== "") {
                const hashedPassword = await bcrypt.hash(password, 10);
                query += ', password=?';
                params.push(hashedPassword);
            }
            
            query += ' WHERE id=?';
            params.push(id);
            
            await pool.query(query, params);
            
            const [updated] = await pool.query('SELECT id, firstName, lastName, name, email, role, address, phone, zipCode, city, credits_balance, newsletter_subscribed FROM users WHERE id = ?', [id]);
            return send(200, { success: true, user: updated[0] });
        }

        if (method === 'POST' && path === '/credits/buy') {
            const { userId, credits } = req.body;
            await pool.query('START TRANSACTION');
            await pool.query('UPDATE users SET credits_balance = credits_balance + ? WHERE id = ?', [credits, userId]);
            await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, 'purchase', credits, 'Achat de cours (Manuel)']);
            await pool.query('INSERT INTO user_batches (user_id, credits, expires_at) VALUES (?, ?, NULL)', [userId, credits]);
            await pool.query('COMMIT');
            
            const [updated] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
            return send(200, { success: true, credits_balance: updated[0].credits_balance });
        }

        // --- ROUTES CLASSES ---
        if (method === 'GET' && path === '/course-templates') {
            const [templates] = await pool.query('SELECT * FROM course_templates');
            return send(200, templates);
        }

        if (method === 'POST' && path === '/course-templates') {
            const { title, description, duration, default_credits_price, capacity } = req.body;
            
            const [existing] = await pool.query('SELECT id FROM course_templates WHERE title = ?', [title]);
            if (existing.length > 0) return send(400, { success: false, message: 'Un modèle avec ce titre existe déjà.' });

            await pool.query(
                'INSERT INTO course_templates (title, description, duration, default_credits_price, capacity) VALUES (?, ?, ?, ?, ?)',
                [title, description, duration, default_credits_price, capacity || 10]
            );
            return send(200, { success: true });
        }

        const deleteTemplateMatch = path.match(/^\/course-templates\/(\d+)$/);
        if (method === 'DELETE' && deleteTemplateMatch) {
            const id = deleteTemplateMatch[1];
            // 1. Récupérer le titre pour supprimer les cours planifiés associés
            const [templates] = await pool.query('SELECT title FROM course_templates WHERE id = ?', [id]);
            if (templates.length > 0) {
                const title = templates[0].title;
                await pool.query('START TRANSACTION');
                await pool.query('DELETE FROM course_templates WHERE id = ?', [id]);
                // On supprime les cours qui portent le même titre
                await pool.query('DELETE FROM classes WHERE title = ?', [title]);
                await pool.query('COMMIT');
                return send(200, { success: true, message: 'Modèle et cours associés supprimés' });
            }
            return send(404, { message: 'Modèle non trouvé' });
        }

        const templateIdMatch = path.match(/^\/course-templates\/(\d+)$/);
        if (method === 'PUT' && templateIdMatch) {
            const { title, description, duration, default_credits_price, capacity } = req.body;
            
            const [existing] = await pool.query('SELECT id FROM course_templates WHERE title = ? AND id != ?', [title, templateIdMatch[1]]);
            if (existing.length > 0) return send(400, { success: false, message: 'Un autre modèle avec ce titre existe déjà.' });
            
            try {
                await pool.query('START TRANSACTION');
                
                // 1. Récupérer l'ancien titre pour retrouver les séances liées dans le planning
                const [oldTpl] = await pool.query('SELECT title FROM course_templates WHERE id = ?', [templateIdMatch[1]]);
                const oldTitle = oldTpl.length > 0 ? oldTpl[0].title : title;
                
                // 2. Mettre à jour le modèle lui-même
                await pool.query(
                    'UPDATE course_templates SET title=?, description=?, duration=?, default_credits_price=?, capacity=? WHERE id=?',
                    [title, description, duration, default_credits_price, capacity || 10, templateIdMatch[1]]
                );

                // 3. Mettre à jour automatiquement TOUTES les séances du planning (passées et futures)
                if (oldTitle) {
                    await pool.query(
                        'UPDATE classes SET title=?, description=?, duration=?, capacity=? WHERE title=?',
                        [title, description, duration, capacity || 10, oldTitle]
                    );
                }
                
                await pool.query('COMMIT');
                return send(200, { success: true });
            } catch (err) {
                await pool.query('ROLLBACK');
                throw err;
            }
        }

        if (method === 'GET' && path === '/credit-packages') {
            const [pkgs] = await pool.query('SELECT * FROM credit_packages');
            return send(200, pkgs);
        }

        if (method === 'POST' && path === '/credit-packages') {
            const { name, subtitle, description, credits, price, expires_in_days, is_subscription } = req.body;
            await pool.query(
                'INSERT INTO credit_packages (name, subtitle, description, credits, price, expires_in_days, is_subscription) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name, subtitle, description, credits, price, expires_in_days, is_subscription ? 1 : 0]
            );
            return send(200, { success: true });
        }

        if (method === 'PUT' && path === '/credit-packages/bulk') {
            const { packages } = req.body;
            if (!packages || !Array.isArray(packages)) return send(400, { success: false });

            await pool.query('START TRANSACTION');
            try {
                for (const pkg of packages) {
                    await pool.query(
                        'UPDATE credit_packages SET name=?, subtitle=?, description=?, credits=?, price=?, expires_in_days=?, is_subscription=? WHERE id=?',
                        [pkg.name, pkg.subtitle, pkg.description, pkg.credits, pkg.price, pkg.expires_in_days, pkg.is_subscription ? 1 : 0, pkg.id]
                    );
                }
                await pool.query('COMMIT');
            } catch (err) {
                await pool.query('ROLLBACK');
                throw err;
            }
            return send(200, { success: true });
        }

        if (method === 'GET' && path === '/classes') {
            const [rows] = await pool.query(`
                SELECT c.id, c.title, DATE_FORMAT(c.date, '%Y-%m-%d') as date, c.time, c.duration, COALESCE(c.custom_capacity, ct.capacity, c.capacity) as capacity, c.credits_price, c.description, c.recurrence_id,
                GROUP_CONCAT(b.user_id) as bookedUsersStr 
                FROM classes c 
                LEFT JOIN course_templates ct ON c.title = ct.title 
                LEFT JOIN bookings b ON c.id = b.class_id 
                GROUP BY c.id, c.title, c.date, c.time, c.duration, c.custom_capacity, ct.capacity, c.capacity, c.credits_price, c.description, c.recurrence_id
            `);
            
            const classes = rows.map(c => {
                const bookedUsers = c.bookedUsersStr ? c.bookedUsersStr.split(',').map(Number) : [];
                delete c.bookedUsersStr;
                return { ...c, bookedUsers };
            });
            return send(200, classes);
        }

        if (method === 'POST' && path === '/classes') {
            const { title, date, time, duration, capacity, credits_price, description, recurrence_id } = req.body;
            const [result] = await pool.query(
                'INSERT INTO classes (title, date, time, duration, capacity, credits_price, description, recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [title, date, time, duration, capacity, credits_price, description, recurrence_id || null]
            );
            return send(200, { id: result.insertId, ...req.body, bookedUsers: [] });
        }

        console.log(`[API DEBUG] Checking route: ${method} ${path}`); // Ajout d'un log de débogage
        if (method === 'DELETE' && path === '/classes/bulk') {
            const { ids } = req.body;
            if (!ids || !ids.length) return send(400, { success: false, message: 'Aucun cours sélectionné' });
            await sendCancellationEmails(ids);
            await pool.query('DELETE FROM classes WHERE id IN (?)', [[...ids]]);
            return send(200, { success: true, message: 'Séances supprimées' });
        }

        const deleteSeriesMatch = path.match(/^\/classes\/series\/(.+)$/);
        if (method === 'DELETE' && deleteSeriesMatch) {
            const rid = decodeURIComponent(deleteSeriesMatch[1]);
            const [classes] = await pool.query('SELECT id FROM classes WHERE recurrence_id = ?', [rid]);
            const classIds = classes.map(c => c.id);
            if (classIds.length > 0) await sendCancellationEmails(classIds);
            await pool.query('DELETE FROM classes WHERE recurrence_id = ?', [rid]);
            return send(200, { success: true, message: 'Série de cours supprimée' });
        }

        const deleteClassMatch = path.match(/^\/classes\/(\d+)$/);
        if (method === 'DELETE' && deleteClassMatch) {
            const classId = deleteClassMatch[1];
            await sendCancellationEmails([classId]);
            await pool.query('DELETE FROM classes WHERE id = ?', [classId]);
            return send(200, { message: 'Cours supprimé' });
        }

        const classCapacityMatch = path.match(/^\/classes\/(\d+)\/capacity$/);
        if (method === 'PUT' && classCapacityMatch) {
            const classId = classCapacityMatch[1];
            const { capacity } = req.body;
            await pool.query('UPDATE classes SET custom_capacity = ?, capacity = ? WHERE id = ?', [capacity, capacity, classId]);
            return send(200, { success: true });
        }

        const bookClassMatch = path.match(/^\/classes\/book\/(\d+)$/);
        if (method === 'POST' && bookClassMatch) {
            const classId = bookClassMatch[1];
            const { userId } = req.body;

            const [rows] = await pool.query(`
                SELECT COALESCE(c.custom_capacity, ct.capacity, c.capacity) as capacity, COUNT(b.user_id) as currentBookings 
                FROM classes c 
                LEFT JOIN course_templates ct ON c.title = ct.title 
                LEFT JOIN bookings b ON c.id = b.class_id 
                WHERE c.id = ? 
                GROUP BY c.id, c.custom_capacity, ct.capacity, c.capacity`, [classId]);

            if (rows.length === 0) return send(404, { success: false, message: 'Cours non trouvé' });
            
            const { capacity, currentBookings } = rows[0];

            const [existing] = await pool.query('SELECT * FROM bookings WHERE class_id = ? AND user_id = ?', [classId, userId]);
            if (existing.length > 0) return send(400, { success: false, message: 'Déjà inscrit' });

            if (currentBookings < capacity) {
                await pool.query('INSERT INTO bookings (class_id, user_id, refund_expires_at) VALUES (?, ?, NULL)', [classId, userId]);
                return send(200, { success: true, message: 'Réservation ajoutée' });
            } else {
                return send(400, { success: false, message: 'Le cours est complet' });
            }
        }

        if (method === 'POST' && path.match(/^\/classes\/book-credits\/(\d+)$/)) {
            const classId = path.match(/^\/classes\/book-credits\/(\d+)$/)[1];
            const { userId } = req.body;

            await cleanupExpiredBatches(userId);
            const [userRows] = await pool.query('SELECT credits_balance, is_subscribed, subscription_expires_at FROM users WHERE id = ?', [userId]);
            const [classRows] = await pool.query(`
                SELECT c.title, c.date, c.credits_price, c.recurrence_id, COALESCE(c.custom_capacity, ct.capacity, c.capacity) as capacity 
                FROM classes c 
                LEFT JOIN course_templates ct ON c.title = ct.title 
                WHERE c.id = ?`, [classId]);
            const [bookingCount] = await pool.query('SELECT COUNT(*) as count FROM bookings WHERE class_id = ?', [classId]);

            if (!userRows.length || !classRows.length) return send(404, { message: 'Erreur' });

            const user = userRows[0];
            const cls = classRows[0];

            if (!user.is_subscribed && user.credits_balance < cls.credits_price) {
                return send(400, { success: false, message: 'Solde de cours insuffisant' });
            }
            if (bookingCount[0].count >= cls.capacity) {
                return send(400, { success: false, message: 'Cours complet' });
            }

            let isUsingExtraCredit = false;
            if (userRows[0].is_subscribed) {
                const [weeklyBookings] = await pool.query(`
                    SELECT COUNT(*) as count 
                    FROM bookings b 
                    JOIN classes c_booked ON b.class_id = c_booked.id 
                    WHERE b.user_id = ? AND YEARWEEK(c_booked.date, 1) = YEARWEEK(?, 1)
                `, [userId, cls.date]);

                if (weeklyBookings[0].count >= 1) {
                    if (user.credits_balance < cls.credits_price) {
                        return send(400, { success: false, message: "Limite d'un cours par semaine atteinte et solde insuffisant." });
                    } else {
                        isUsingExtraCredit = true;
                    }
                }
            }

            await pool.query('START TRANSACTION');
            let refundExpiresAt = null;
            
            if (!userRows[0].is_subscribed || isUsingExtraCredit) {
                // Déduire les cours nécessaires en vidant les lots qui expirent le plus vite
                let toDeduct = cls.credits_price;
                const [batches] = await pool.query(`
                    SELECT id, credits, expires_at 
                    FROM user_batches 
                    WHERE user_id = ? AND credits > 0 AND (expires_at IS NULL OR expires_at > NOW())
                    ORDER BY expires_at IS NULL, expires_at ASC
                `, [userId]);
                
                let usedExpirations = [];
                for (const b of batches) {
                    if (toDeduct <= 0) break;
                    const deduction = Math.min(b.credits, toDeduct);
                    await pool.query('UPDATE user_batches SET credits = credits - ? WHERE id = ?', [deduction, b.id]);
                    toDeduct -= deduction;
                    usedExpirations.push(b.expires_at);
                }
                
                if (usedExpirations.includes(null)) {
                    refundExpiresAt = null;
                } else if (usedExpirations.length > 0) {
                    const maxDate = new Date(Math.max(...usedExpirations.map(e => new Date(e))));
                    const pad = n => n < 10 ? '0' + n : n;
                    refundExpiresAt = `${maxDate.getFullYear()}-${pad(maxDate.getMonth()+1)}-${pad(maxDate.getDate())} ${pad(maxDate.getHours())}:${pad(maxDate.getMinutes())}:${pad(maxDate.getSeconds())}`;
                }
                
                await pool.query('UPDATE users SET credits_balance = GREATEST(0, credits_balance - ?) WHERE id = ?', [cls.credits_price, userId]);
                await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, 'booking', -cls.credits_price, `Réservation${isUsingExtraCredit ? ' (Supp)' : ''} : ${cls.title || 'Séance'}`]);
            } else {
                // Pour un abonnement, on enregistre une transaction neutre sans toucher aux crédits
                await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, 'booking', 0, `Réservation (Abonnement) : ${cls.title || 'Séance'}`]);
            }
            
            await pool.query('INSERT INTO bookings (class_id, user_id, refund_expires_at) VALUES (?, ?, ?)', [classId, userId, refundExpiresAt]);
            await pool.query('COMMIT');

            // Auto-booking de la série pour les abonnés
            const bookSeries = req.body.bookSeries;
            if (bookSeries && userRows[0].is_subscribed && classRows[0].recurrence_id) {
                try {
                    const [futureClasses] = await pool.query(`
                        SELECT c.id, c.title, c.date, COALESCE(c.custom_capacity, ct.capacity, c.capacity) as capacity 
                        FROM classes c 
                        LEFT JOIN course_templates ct ON c.title = ct.title 
                        WHERE c.recurrence_id = ? AND c.date > ? AND (? IS NULL OR c.date <= DATE(?))
                        ORDER BY c.date ASC
                    `, [classRows[0].recurrence_id, classRows[0].date, userRows[0].subscription_expires_at, userRows[0].subscription_expires_at]);

                    for (const fc of futureClasses) {
                        const [bCount] = await pool.query('SELECT COUNT(*) as count FROM bookings WHERE class_id = ?', [fc.id]);
                        if (bCount[0].count >= fc.capacity) continue;

                        const [existing] = await pool.query('SELECT * FROM bookings WHERE class_id = ? AND user_id = ?', [fc.id, userId]);
                        if (existing.length > 0) continue;

                        const [wBookings] = await pool.query(`
                            SELECT COUNT(*) as count FROM bookings b 
                            JOIN classes c_booked ON b.class_id = c_booked.id 
                            WHERE b.user_id = ? AND YEARWEEK(c_booked.date, 1) = YEARWEEK(?, 1)
                        `, [userId, fc.date]);

                        if (wBookings[0].count === 0) {
                            await pool.query('START TRANSACTION');
                            await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, 'booking', 0, `Réservation auto (Abonnement) : ${fc.title}`]);
                            await pool.query('INSERT INTO bookings (class_id, user_id, refund_expires_at) VALUES (?, ?, NULL)', [fc.id, userId]);
                            await pool.query('COMMIT');
                        }
                    }
                } catch (err) { console.error("[API] Erreur auto-booking série:", err); }
            }

            const [updatedUser] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
            
            if (updatedUser[0].is_subscribed) {
                const [weeklyBookings] = await pool.query(`SELECT COUNT(*) as count FROM bookings b JOIN classes c ON b.class_id = c.id WHERE b.user_id = ? AND YEARWEEK(c.date, 1) = YEARWEEK(CURDATE(), 1)`, [userId]);
                updatedUser[0].hasUsedWeeklyBooking = weeklyBookings[0].count > 0;
            } else {
                updatedUser[0].hasUsedWeeklyBooking = false;
            }
            
            const { password: _, ...userWithoutPassword } = updatedUser[0];
            const [activeBatches] = await pool.query(`SELECT credits, expires_at FROM user_batches WHERE user_id = ? AND credits > 0 ORDER BY expires_at IS NULL, expires_at ASC`, [userId]);
            return send(200, { success: true, user: { ...userWithoutPassword, activeBatches } });
        }

        const cancelClassMatch = path.match(/^\/classes\/cancel\/(\d+)$/);
        if (method === 'POST' && cancelClassMatch) {
            const classId = cancelClassMatch[1];
            const { userId, cancelSeries } = req.body;

            // Vérification du délai d'annulation
            const [settings] = await pool.query('SELECT cancellationDelay FROM settings WHERE id = 1');
            const delay = settings[0]?.cancellationDelay || 24;
            const [cls] = await pool.query('SELECT id, title, date, time, credits_price, recurrence_id FROM classes WHERE id = ?', [classId]);
            
            if (!cls.length) return send(404, { success: false, message: 'Cours introuvable.' });

            const [userRows] = await pool.query('SELECT is_subscribed FROM users WHERE id = ?', [userId]);
            const isSubscribed = userRows.length > 0 ? userRows[0].is_subscribed : false;

            let classesToCancel = [ cls[0] ];

            if (cancelSeries && cls[0].recurrence_id) {
                const [futureClasses] = await pool.query(`
                    SELECT c.id, c.title, c.date, c.time, c.credits_price, c.recurrence_id
                    FROM classes c
                    JOIN bookings b ON c.id = b.class_id
                    WHERE c.recurrence_id = ? AND c.date >= ? AND b.user_id = ? AND c.id != ?
                `, [cls[0].recurrence_id, cls[0].date, userId, classId]);
                classesToCancel = classesToCancel.concat(futureClasses);
            }

            const now = new Date();
            let successCount = 0;

            for (const classToCancel of classesToCancel) {
                const classDate = new Date(classToCancel.date + 'T' + classToCancel.time);
                const hoursDiff = (classDate - now) / 1000 / 60 / 60;
                
                if (hoursDiff < delay) {
                    if (classToCancel.id == classId) {
                        return send(400, { success: false, message: `Annulation impossible moins de ${delay}h avant le cours.` });
                    } else {
                        continue; // On ignore les cours futurs qui violeraient la règle
                    }
                }

                let isRefundingExtraCredit = false;
                if (isSubscribed) {
                    const [weeklyBookings] = await pool.query(`SELECT COUNT(*) as count FROM bookings b JOIN classes c_booked ON b.class_id = c_booked.id WHERE b.user_id = ? AND YEARWEEK(c_booked.date, 1) = YEARWEEK(?, 1)`, [userId, classToCancel.date]);
                    if (weeklyBookings[0].count > 1) isRefundingExtraCredit = true;
                }

                let creditsToRefund = classToCancel.credits_price || 0;
                if (isSubscribed && !isRefundingExtraCredit) creditsToRefund = 0; 

                const [booking] = await pool.query('SELECT refund_expires_at FROM bookings WHERE class_id = ? AND user_id = ?', [classToCancel.id, userId]);
                let refundExpiresAt = booking.length > 0 ? booking[0].refund_expires_at : null;

                await pool.query('START TRANSACTION');
                const [result] = await pool.query('DELETE FROM bookings WHERE class_id = ? AND user_id = ?', [classToCancel.id, userId]);
                
                if (result.affectedRows > 0) {
                    successCount++;
                    if (creditsToRefund > 0) {
                        await pool.query('UPDATE users SET credits_balance = credits_balance + ? WHERE id = ?', [creditsToRefund, userId]);
                        await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, 'refund', creditsToRefund, `Annulation : ${classToCancel.title}`]);
                        await pool.query('INSERT INTO user_batches (user_id, credits, expires_at) VALUES (?, ?, ?)', [userId, creditsToRefund, refundExpiresAt]);
                    } else if (isSubscribed) {
                        await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, 'refund', 0, `Annulation (Abonnement) : ${classToCancel.title}`]);
                    }
                }
                await pool.query('COMMIT');
            }

            return send(200, { success: true, message: successCount > 1 ? `${successCount} réservations annulées.` : 'Réservation annulée.' });
        }

        // --- ROUTES AI (Proxy sécurisé) ---
        if (method === 'POST' && path === '/ai/consult') {
            const { prompt, userId } = req.body;
            
            if (!prompt) return send(400, { error: 'Prompt vide' });

            // Récupération du fournisseur configuré
            const [settings] = await pool.query('SELECT aiProvider FROM settings WHERE id = 1');
            const provider = settings[0]?.aiProvider || 'gemini';

            let url, body, apiKey, headers = { 'Content-Type': 'application/json' };

            // Configuration selon le fournisseur
            switch (provider) {
                case 'mistral':
                    apiKey = process.env.MISTRAL_API_KEY;
                    url = 'https://api.mistral.ai/v1/chat/completions';
                    headers['Authorization'] = `Bearer ${apiKey}`;
                    body = { model: 'mistral-large-latest', messages: [{ role: 'user', content: prompt }] };
                    break;
                case 'groq':
                    apiKey = process.env.GROQ_API_KEY;
                    url = 'https://api.groq.com/openai/v1/chat/completions';
                    headers['Authorization'] = `Bearer ${apiKey}`;
                    body = { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }] };
                    break;
                case 'openai':
                    apiKey = process.env.OPENAI_API_KEY;
                    url = 'https://api.openai.com/v1/chat/completions';
                    headers['Authorization'] = `Bearer ${apiKey}`;
                    body = { model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] };
                    break;
                default: // gemini
                    apiKey = process.env.GEMINI_API_KEY;
                    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                    body = { contents: [{ parts: [{ text: prompt }] }] };
            }

            if (!apiKey) return send(500, { error: `Clé API pour ${provider} non configurée sur le serveur` });

            try {
                const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
                const data = await response.json();

                if (data.error) throw new Error(data.error.message || "Erreur API");

                let answer;
                if (provider === 'gemini') {
                    answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
                } else {
                    // Format OpenAI compatible (Mistral, Groq, OpenAI)
                    answer = data.choices?.[0]?.message?.content;
                }

                return send(200, { success: true, answer: answer || "Je n'ai pas pu formuler de réponse." });
            } catch (err) {
                console.error(`❌ Erreur API ${provider}:`, err.message);
                return send(500, { success: false, answer: "L'assistant rencontre une erreur technique." });
            }
        }

        // --- ROUTE DÉSINCRIPTION DIRECTE ---
        if (method === 'GET' && path === '/newsletter/unsubscribe') {
            const email = req.query.email;
            if (email) await pool.query('UPDATE users SET newsletter_subscribed = 0 WHERE email = ?', [email]);
            res.writeHead(302, { 'Location': `http://${req.headers.host}/#accueil?desabonne=success` });
            return res.end();
        }

        // --- ROUTE NEWSLETTER (Envoi SMTP) ---
        if (method === 'POST' && path === '/newsletter/send') {
            const { subject, message, recipientIds } = req.body;
            
            if (!recipientIds || recipientIds.length === 0) {
                return send(400, { success: false, message: 'Aucun destinataire sélectionné' });
            }

            try {
                // Récupération des emails des destinataires sélectionnés
                const [users] = await pool.query('SELECT email, firstName FROM users WHERE id IN (?)', [recipientIds]);
                if (users.length === 0) return send(404, { success: false, message: 'Destinataires introuvables' });

                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT),
                    secure: process.env.SMTP_PORT == 465, // true pour le port 465, false pour les autres
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });

                // Envoi individuel pour personnaliser le lien de désinscription
                for (const u of users) {
                    const unsubscribeLink = `http://${req.headers.host}/api/newsletter/unsubscribe?email=${encodeURIComponent(u.email)}`;
                    const personalFooter = `
                        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e7e5e4; font-family: sans-serif; color: #78716c; font-size: 12px; text-align: center;">
                            <p>Bonjour ${u.firstName}, vous recevez cet email car vous êtes membre de L'espace doré.</p>
                            <p>Pour ne plus recevoir de communications, vous pouvez vous <a href="${unsubscribeLink}" style="color: #10b981; text-decoration: underline;">désabonner en un clic</a>.</p>
                        </div>
                    `;

                    await transporter.sendMail({
                        from: process.env.SMTP_FROM || process.env.SMTP_USER,
                        to: u.email, 
                        subject: subject,
                        html: message + personalFooter,
                        headers: {
                            'Precedence': 'bulk',
                            'List-Unsubscribe': `<${unsubscribeLink}>, <mailto:${process.env.SMTP_USER}?subject=unsubscribe>`,
                            'X-Mailer': 'EspaceDore-Mailer'
                        }
                    });
                }

                return send(200, { success: true });
            } catch (err) {
                console.error("Erreur Newsletter SMTP:", err);
                return send(500, { success: false, message: "Erreur lors de l'envoi: " + err.message });
            }
        }

        // --- ROUTES STRIPE ---
        if (method === 'POST' && path === '/checkout/create-session') {
            const { packageId, userId, email } = req.body;
            console.log("[STRIPE] Requête de session reçue. userId:", userId, "packageId:", packageId);

            let customerEmail = email ? email.trim() : null;

            // Si l'email n'est pas fourni par le front, on le récupère en base par sécurité
            if (!customerEmail) {
                const [users] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);
                if (!users.length) {
                    console.error("[STRIPE] Utilisateur introuvable en DB pour ID:", userId);
                    return send(404, { message: 'Utilisateur non trouvé' });
                }
                customerEmail = users[0].email ? users[0].email.trim() : null;
            }
            console.log(`[STRIPE] Email envoyé à Stripe : "${customerEmail}"`);

            const [pkgs] = await pool.query('SELECT * FROM credit_packages WHERE id = ?', [packageId]);
            if (!pkgs.length) return send(404, { message: 'Pack non trouvé' });
            const pkg = pkgs[0];

            const session = await stripe.checkout.sessions.create({
                customer_email: customerEmail,
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'eur',
                        product_data: { name: pkg.name, description: `${pkg.credits} cours de Pilates` },
                        unit_amount: pkg.price * 100,
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `http://${req.headers.host}/paiement-succes?package=${encodeURIComponent(pkg.name)}&credits=${pkg.credits}`,
                cancel_url: `http://${req.headers.host}/#profil?payment=cancel`,
                metadata: { userId: userId.toString(), credits: pkg.credits.toString(), price: pkg.price.toString(), packageName: pkg.name, expires_in_days: pkg.expires_in_days.toString(), is_subscription: pkg.is_subscription ? '1' : '0', type: 'credits_purchase' }
            });
            console.log("[STRIPE] Session créée avec succès :", session.id);
            return send(200, { url: session.url });
        }

        if (method === 'POST' && path === '/webhook/stripe') {
            const sig = req.headers['stripe-signature'];
            let event;
            try {
                event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
                console.log(`[STRIPE] ✅ Événement vérifié : ${event.type}`);
            } catch (err) {
                console.error("❌ Webhook Error:", err.message);
                return send(400, { error: `Webhook Error: ${err.message}` });
            }

            if (event.type === 'checkout.session.completed') {
                const session = event.data.object;
                console.log("🔔 Webhook Stripe : checkout.session.completed reçu.");

                const { userId, credits, price, packageName, expires_in_days, is_subscription, type } = session.metadata;
                
                if (userId) {
                    console.log(`[WEBHOOK] Traitement achat : User ${userId}`);
                    
                    const parsedCredits = parseInt(credits) || 0;
                    const isSubscription = is_subscription === '1' || (packageName && packageName.toLowerCase().includes('abonnement'));

                    // Récupérer l'utilisateur depuis la DB pour gérer l'expiration et l'email
                    const [userRows] = await pool.query('SELECT email, is_subscribed, subscription_expires_at FROM users WHERE id = ?', [userId]);
                    const targetEmail = userRows[0]?.email || session.customer_details?.email;

                    const expiresInDaysInt = parseInt(expires_in_days) || 0;
                    let expiresAtStr = null;
                    if (expiresInDaysInt > 0) {
                        let baseDate = new Date();
                        if (isSubscription && userRows[0]?.is_subscribed && userRows[0]?.subscription_expires_at) {
                            const currentExp = new Date(userRows[0].subscription_expires_at);
                            if (currentExp > baseDate) {
                                baseDate = currentExp;
                            }
                        }
                        baseDate.setDate(baseDate.getDate() + expiresInDaysInt);
                        expiresAtStr = baseDate.toISOString().slice(0, 19).replace('T', ' ');
                    }

                    await pool.query('START TRANSACTION');
                    
                    if (parsedCredits > 0 && !isSubscription) {
                        const description = price ? `Achat de cours (${price}€)` : 'Achat de cours';
                        await pool.query('UPDATE users SET credits_balance = COALESCE(credits_balance, 0) + ? WHERE id = ?', [parsedCredits, parseInt(userId)]);
                        await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [parseInt(userId), 'purchase', parsedCredits, description]);
                        await pool.query('INSERT INTO user_batches (user_id, credits, expires_at) VALUES (?, ?, ?)', [parseInt(userId), parsedCredits, expiresAtStr]);
                    }

                    if (isSubscription) {
                        await pool.query('UPDATE users SET is_subscribed = 1, subscription_expires_at = ? WHERE id = ?', [expiresAtStr, parseInt(userId)]);
                        await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [parseInt(userId), 'purchase', 0, `Achat d'abonnement (${price}€)`]);
                    }
                    await pool.query('COMMIT');
                    await cleanupExpiredBatches(parseInt(userId));

                    const [settingsRows] = await pool.query('SELECT * FROM settings WHERE id = 1');
                    const studioSettings = settingsRows[0] || {};

                    const [pkgRows] = await pool.query('SELECT subtitle FROM credit_packages WHERE name = ? LIMIT 1', [packageName]);
                    const packageSubtitle = pkgRows.length > 0 ? pkgRows[0].subtitle : '';

                    // Génération dynamique de la facture PDF en pièce jointe
                    let attachments = [];
                    try {
                        const PDFDocument = require('pdfkit');
                        const pdfBuffer = await new Promise((resolve) => {
                            const doc = new PDFDocument({ margin: 50 });
                            const buffers = [];
                            doc.on('data', buffers.push.bind(buffers));
                            doc.on('end', () => resolve(Buffer.concat(buffers)));

                            const priceTTC = parseInt(price) || 0;
                            const priceHT = priceTTC > 0 ? (priceTTC / 1.2).toFixed(2) : '0.00';
                            const tvaAmount = priceTTC > 0 ? (priceTTC - (priceTTC / 1.2)).toFixed(2) : '0.00';
                            const invoiceNum = `FACT-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;

                            doc.fillColor('#10b981').fontSize(24).text("L'ESPACE DORE", { continued: true })
                               .fillColor('#333333').fontSize(20).text("FACTURE", { align: 'right' });
                            doc.moveDown();
                            
                            doc.fontSize(10).fillColor('#666666')
                               .text(studioSettings.studioAddress || '')
                               .text(`SIRET : ${studioSettings.studioSiret || '-'}`)
                               .text(`N° TVA : ${studioSettings.studioTva || '-'}`);
                            
                            doc.moveUp(3);
                            doc.fillColor('#333333').text(`N° ${invoiceNum}`, { align: 'right' })
                               .text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
                            
                            doc.moveDown(4);
                            doc.fontSize(14).fillColor('#10b981').text("Facture a");
                            doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#eeeeee').stroke();
                            doc.moveDown(0.5);
                            doc.fontSize(11).fillColor('#333333')
                               .text(`${userRows[0]?.firstName || ''} ${userRows[0]?.lastName || ''}`)
                               .text(`${targetEmail || ''}`);
                            doc.moveDown(3);

                            const tableTop = doc.y;
                            
                            // Fond pour l'en-tête du tableau
                            doc.rect(50, tableTop - 5, 495, 20).fill('#f0fdf4');
                            
                            doc.fillColor('#064e3b').font('Helvetica-Bold').fontSize(10);
                            doc.text("Description", 60, tableTop);
                            doc.text("Qte", 300, tableTop, { width: 30, align: 'center' });
                            doc.text("P.U HT", 330, tableTop, { width: 60, align: 'right' });
                            doc.text("TVA (20%)", 390, tableTop, { width: 80, align: 'right' });
                            doc.text("Total TTC", 470, tableTop, { width: 75, align: 'right' });
                            
                            doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#10b981').lineWidth(1.5).stroke();
                            doc.moveDown(1.5);
                            
                            doc.font('Helvetica').fontSize(11).fillColor('#333333');
                            const rowY = doc.y;
                            doc.text(packageName || 'Pack de cours', 60, rowY, { width: 240 });
                            if (packageSubtitle) {
                                doc.fontSize(9).fillColor('#10b981').text(packageSubtitle, 60, rowY + 13);
                            }
                            
                            doc.fontSize(11).fillColor('#333333');
                            doc.text("1", 300, rowY, { width: 30, align: 'center' });
                            doc.text(`${priceHT} €`, 330, rowY, { width: 60, align: 'right' });
                            doc.text(`${tvaAmount} €`, 390, rowY, { width: 80, align: 'right' });
                            doc.text(`${priceTTC.toFixed(2)} €`, 470, rowY, { width: 75, align: 'right' });
                            
                            const lineY = packageSubtitle ? rowY + 30 : rowY + 20;
                            doc.moveTo(50, lineY).lineTo(545, lineY).strokeColor('#eeeeee').lineWidth(0.5).stroke();
                            doc.y = lineY + 15;
                            
                            const totalX = 350;
                            const totalWidth = 195;
                            const subTotalY = doc.y;
                            
                            doc.fontSize(10).fillColor('#666666');
                            doc.text("Total HT", totalX, subTotalY);
                            doc.text(`${priceHT} €`, totalX, subTotalY, { width: totalWidth, align: 'right' });
                            
                            doc.y += 15;
                            doc.text("TVA (20%)", totalX, doc.y);
                            doc.text(`${tvaAmount} €`, totalX, doc.y, { width: totalWidth, align: 'right' });
                            
                            doc.y += 10;
                            doc.moveTo(totalX, doc.y).lineTo(545, doc.y).strokeColor('#10b981').lineWidth(1.5).stroke();
                            
                            doc.y += 10;
                            doc.font('Helvetica-Bold').fillColor('#10b981').fontSize(14);
                            doc.text("Total TTC", totalX, doc.y);
                            doc.text(`${priceTTC.toFixed(2)} €`, totalX, doc.y, { width: totalWidth, align: 'right' });
                            doc.end();
                        });
                        if (pdfBuffer) attachments.push({ filename: `Facture_${new Date().toISOString().slice(0,10)}.pdf`, content: pdfBuffer, contentType: 'application/pdf' });
                    } catch (pdfErr) { console.warn("⚠️ Impossible de générer le PDF. L'email partira sans pièce jointe.", pdfErr.message); }

                    console.log(`[WEBHOOK] Préparation de l'email pour : ${targetEmail}`);

                    if (!targetEmail) {
                        console.error("❌ Webhook Error: Impossible de trouver l'email du destinataire dans la DB ou la session");
                        return send(200, { received: true });
                    }

                    // Envoi de l'email de confirmation (Facture)
                    console.log("[SMTP] Tentative d'envoi de facture à:", targetEmail);
                    const transporter = nodemailer.createTransport({
                        host: process.env.SMTP_HOST,
                        port: parseInt(process.env.SMTP_PORT),
                        secure: process.env.SMTP_PORT == 465, // true pour 465, false pour 587
                        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
                        tls: {
                            rejectUnauthorized: false // Aide en développement si le certificat SMTP est auto-signé
                        }
                    });

                    const emailHtml = isSubscription ? `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e7e5e4; border-radius: 12px; max-width: 600px; margin: auto;">
                            <h2 style="color: #065f46;">Merci pour votre achat !</h2>
                            <p>Votre paiement a été validé avec succès. Voici le récapitulatif de votre commande :</p>
                            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Produit :</strong> ${packageName}</p>
                                <p style="margin: 5px 0;"><strong>Montant :</strong> ${price}€</p>
                            </div>
                            <p>Votre abonnement est maintenant activé !</p>
                            <p style="font-size: 12px; color: #78716c; margin-top: 30px;">Ceci est un email automatique, merci de ne pas y répondre.</p>
                        </div>
                    ` : `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e7e5e4; border-radius: 12px; max-width: 600px; margin: auto;">
                            <h2 style="color: #065f46;">Merci pour votre achat !</h2>
                            <p>Votre paiement a été validé avec succès. Voici le récapitulatif de votre commande :</p>
                            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Produit :</strong> ${packageName || 'Pack de cours'}</p>
                                <p style="margin: 5px 0;"><strong>Montant :</strong> ${price}€</p>
                                <p style="margin: 5px 0;"><strong>Cours ajoutés :</strong> +${credits}</p>
                            </div>
                            <p>Vos cours sont immédiatement disponibles sur votre compte pour vos prochaines réservations.</p>
                            <p style="font-size: 12px; color: #78716c; margin-top: 30px;">Ceci est un email automatique, merci de ne pas y répondre.</p>
                        </div>
                    `;

                    try {
                        const info = await transporter.sendMail({
                            from: `"L'espace doré" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                            to: targetEmail,
                            subject: "Confirmation de votre achat - L'espace doré",
                            html: emailHtml,
                            attachments: attachments
                        });
                        console.log("✅ [SMTP] Email de confirmation envoyé ! ID:", info.messageId);
                    } catch (mailErr) {
                        console.error("❌ [SMTP] Erreur envoi email facture:", mailErr.message);
                    }
                } else {
                    console.warn("⚠️ Webhook ignoré : métadonnées incomplètes ou type inconnu", session.metadata);
                }
            }
            return send(200, { received: true });
        }

        // --- ROUTES SETTINGS ---
        if (method === 'GET' && path === '/settings') {
            const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
            return send(200, rows[0] || {});
        }

        if (method === 'POST' && path === '/settings') {
            const { studioAddress, studioPhone, studioEmail, cancellationDelay, aiProvider, facebookUrl, instagramUrl, tiktokUrl, studioSiret, studioTva } = req.body;
            await pool.query(`
                INSERT INTO settings (id, studioAddress, studioPhone, studioEmail, cancellationDelay, aiProvider, facebookUrl, instagramUrl, tiktokUrl, studioSiret, studioTva)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    studioAddress = COALESCE(?, studioAddress), 
                    studioPhone = COALESCE(?, studioPhone), 
                    studioEmail = COALESCE(?, studioEmail), 
                    cancellationDelay = COALESCE(?, cancellationDelay), 
                    aiProvider = COALESCE(?, aiProvider),
                    facebookUrl = COALESCE(?, facebookUrl),
                    instagramUrl = COALESCE(?, instagramUrl),
                    tiktokUrl = COALESCE(?, tiktokUrl),
                    studioSiret = COALESCE(?, studioSiret),
                    studioTva = COALESCE(?, studioTva)
            `, [studioAddress, studioPhone, studioEmail, cancellationDelay, aiProvider, facebookUrl, instagramUrl, tiktokUrl, studioSiret, studioTva,
                studioAddress, studioPhone, studioEmail, cancellationDelay, aiProvider, facebookUrl, instagramUrl, tiktokUrl, studioSiret, studioTva]);
            
            return send(200, { id: 1, ...req.body });
        }

        return send(404, { message: 'Route non trouvée' });

    } catch (err) {
        console.error(`❌ [API ERROR] ${method} ${path} :`, err);
        return send(500, { error: err.message });
    }
};

module.exports = { handleRequest };
