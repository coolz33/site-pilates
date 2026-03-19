/**
 * @file api.js
 * @description Gestionnaire de routes API pour le backend Pilates.
 * Utilise un pool de connexion MySQL pour les opérations CRUD.
 */

const pool = require('../database');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
                credits INT,
                price INT
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
        // Migration des anciens noms vers les nouveaux si nécessaire
        try { await pool.query(`ALTER TABLE users CHANGE points_balance credits_balance INT DEFAULT 0`); } catch (e) {}
        try { await pool.query(`ALTER TABLE classes CHANGE points_price credits_price INT DEFAULT 1`); } catch (e) {}
        try { await pool.query(`ALTER TABLE classes DROP COLUMN price`); } catch (e) {}
        try { await pool.query(`ALTER TABLE course_templates DROP COLUMN default_price`); } catch (e) {}
        try { await pool.query(`ALTER TABLE course_templates CHANGE default_points_price default_credits_price INT`); } catch (e) {}
        try { await pool.query(`ALTER TABLE course_templates ADD COLUMN default_credits_price INT DEFAULT 1`); } catch (e) {}

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
                ['Pilates Mat Fondamental', 'Séance au sol axée sur les principes de base.', 60, 20],
                ['Pilates Flow Dynamique', 'Enchaînement fluide pour travailler le cardio et la souplesse.', 45, 22],
                ['Spécial Dos & Posture', 'Focus sur le renforcement des muscles profonds du dos.', 50, 25],
                ['Pilates avec Accessoires', 'Utilisation de ballons, cercles et élastiques.', 60, 23]
            ];
            await pool.query('INSERT INTO course_templates (title, description, duration, default_credits_price) VALUES ?', [defaultTemplates]);
        }

        // 4. Credit Packages (Tarif dégressif)
        const [packages] = await pool.query('SELECT COUNT(*) as count FROM credit_packages');
        if (packages[0].count === 0) {
            await pool.query('INSERT INTO credit_packages (name, credits, price) VALUES ?', [[
                ['Pack Découverte', 20, 20],
                ['Pack Équilibre (100 crédits)', 100, 80],
                ['Pack Sérénité (200 crédits)', 200, 140]
            ]]);
        } else {
            // Mise à jour forcée des packs pour correspondre à la demande
            await pool.query('DELETE FROM credit_packages');
            await pool.query('INSERT INTO credit_packages (name, credits, price) VALUES ?', [[
                ['Pack Découverte', 20, 20],
                ['Pack Équilibre (100 crédits)', 100, 80],
                ['Pack Sérénité (200 crédits)', 200, 140]
            ]]);
        }
        console.log('✅ Base de données MySQL initialisée');
    } catch (err) {
        console.error('❌ Erreur initialisation DB:', err);
    }
};
seedDB();

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
                    const { password: _, ...userWithoutPassword } = users[0];
                    const [transactions] = await pool.query(`
                        SELECT id, type, amount, description, DATE_FORMAT(date, '%Y-%m-%d %H:%i') as date 
                        FROM transactions 
                        WHERE user_id = ? 
                        ORDER BY date DESC`, [userId]);
                    return send(200, { ...userWithoutPassword, transactions });
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
            const [user] = await pool.query('SELECT id, firstName, lastName, email, phone, address, zipCode, city, credits_balance, newsletter_subscribed, role FROM users WHERE id = ?', [userId]);
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

            return send(200, { user: user[0], bookings, transactions });
        }

        const giftMatch = path.match(/^\/users\/(\d+)\/gift$/);
        if (method === 'POST' && giftMatch) {
            const userId = giftMatch[1];
            const { amount } = req.body;
            const description = amount > 0 ? 'Cadeau administrateur' : 'Retrait manuel administrateur';
            await pool.query('UPDATE users SET credits_balance = credits_balance + ? WHERE id = ?', [amount, userId]);
            await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, 'adjustment', amount, description]);
            return send(200, { success: true });
        }

        const messageMatch = path.match(/^\/users\/(\d+)\/message$/);
        if (method === 'POST' && messageMatch) {
            const userId = messageMatch[1];
            const { subject, message } = req.body;
            const [users] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);
            if (!users.length) return send(404, { message: 'Utilisateur non trouvé' });

            // Réutilisation de la configuration SMTP (simplifiée ici)
            const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT), secure: process.env.SMTP_PORT == 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
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
                    const { password: _, ...userWithoutPassword } = user;
                    return send(200, { success: true, user: userWithoutPassword });
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
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
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
            const { email } = req.body;
            const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) return send(400, { success: false, message: 'Cet email est déjà utilisé' });

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expire dans 15 min

            await pool.query(
                'INSERT INTO email_verifications (email, code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at)',
                [email, code, expiresAt]
            );

            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT),
                secure: process.env.SMTP_PORT == 465,
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
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
            const { firstName, lastName, email, password, address, phone, zipCode, city, newsletter_subscribed, code } = req.body;

            // Vérification du code
            const [verification] = await pool.query('SELECT * FROM email_verifications WHERE email = ? AND code = ? AND expires_at > NOW()', [email, code]);
            if (verification.length === 0) return send(400, { success: false, message: 'Code de vérification invalide ou expiré' });

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
            return send(200, { success: true, user: newUser[0] });
        }

        if (method === 'PUT' && path === '/users/profile') {
            const { id, firstName, lastName, email, password, address, phone, zipCode, city, newsletter_subscribed } = req.body;
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
            await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, 'purchase', credits, 'Achat de crédits (Manuel)']);
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
            const { title, description, duration, default_credits_price } = req.body;
            await pool.query(
                'INSERT INTO course_templates (title, description, duration, default_credits_price) VALUES (?, ?, ?, ?)',
                [title, description, duration, default_credits_price]
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
            const { title, description, duration, default_credits_price } = req.body;
            await pool.query(
                'UPDATE course_templates SET title=?, description=?, duration=?, default_credits_price=? WHERE id=?',
                [title, description, duration, default_credits_price, templateIdMatch[1]]
            );
            return send(200, { success: true });
        }

        if (method === 'GET' && path === '/credit-packages') {
            const [pkgs] = await pool.query('SELECT * FROM credit_packages');
            return send(200, pkgs);
        }

        if (method === 'POST' && path === '/credit-packages') {
            const { name, credits, price } = req.body;
            await pool.query(
                'INSERT INTO credit_packages (name, credits, price) VALUES (?, ?, ?)',
                [name, credits, price]
            );
            return send(200, { success: true });
        }

        const packageIdMatch = path.match(/^\/credit-packages\/(\d+)$/);
        if (method === 'PUT' && packageIdMatch) {
            const { name, credits, price } = req.body;
            await pool.query(
                'UPDATE credit_packages SET name=?, credits=?, price=? WHERE id=?',
                [name, credits, price, packageIdMatch[1]]
            );
            return send(200, { success: true });
        }

        if (method === 'GET' && path === '/classes') {
            const [rows] = await pool.query(`
                SELECT c.id, c.title, DATE_FORMAT(c.date, '%Y-%m-%d') as date, c.time, c.duration, c.capacity, c.credits_price, c.description, c.recurrence_id,
                GROUP_CONCAT(b.user_id) as bookedUsersStr 
                FROM classes c 
                LEFT JOIN bookings b ON c.id = b.class_id 
                GROUP BY c.id, c.title, c.date, c.time, c.duration, c.capacity, c.credits_price, c.description, c.recurrence_id
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
            await pool.query('DELETE FROM classes WHERE id IN (?)', [[...ids]]);
            return send(200, { success: true, message: 'Séances supprimées' });
        }

        const deleteSeriesMatch = path.match(/^\/classes\/series\/(.+)$/);
        if (method === 'DELETE' && deleteSeriesMatch) {
            const rid = decodeURIComponent(deleteSeriesMatch[1]);
            await pool.query('DELETE FROM classes WHERE recurrence_id = ?', [rid]);
            return send(200, { success: true, message: 'Série de cours supprimée' });
        }

        const deleteClassMatch = path.match(/^\/classes\/(\d+)$/);
        if (method === 'DELETE' && deleteClassMatch) {
            await pool.query('DELETE FROM classes WHERE id = ?', [deleteClassMatch[1]]);
            return send(200, { message: 'Cours supprimé' });
        }

        const bookClassMatch = path.match(/^\/classes\/book\/(\d+)$/);
        if (method === 'POST' && bookClassMatch) {
            const classId = bookClassMatch[1];
            const { userId } = req.body;

            const [rows] = await pool.query(`
                SELECT c.capacity, COUNT(b.user_id) as currentBookings 
                FROM classes c 
                LEFT JOIN bookings b ON c.id = b.class_id 
                WHERE c.id = ? 
                GROUP BY c.id`, [classId]);

            if (rows.length === 0) return send(404, { success: false, message: 'Cours non trouvé' });
            
            const { capacity, currentBookings } = rows[0];

            const [existing] = await pool.query('SELECT * FROM bookings WHERE class_id = ? AND user_id = ?', [classId, userId]);
            if (existing.length > 0) return send(400, { success: false, message: 'Déjà inscrit' });

            if (currentBookings < capacity) {
                await pool.query('INSERT INTO bookings (class_id, user_id) VALUES (?, ?)', [classId, userId]);
                return send(200, { success: true, message: 'Réservation ajoutée' });
            } else {
                return send(400, { success: false, message: 'Le cours est complet' });
            }
        }

        if (method === 'POST' && path.match(/^\/classes\/book-credits\/(\d+)$/)) {
            const classId = path.match(/^\/classes\/book-credits\/(\d+)$/)[1];
            const { userId } = req.body;

            const [userRows] = await pool.query('SELECT credits_balance FROM users WHERE id = ?', [userId]);
            const [classRows] = await pool.query('SELECT title, credits_price, capacity FROM classes WHERE id = ?', [classId]);
            const [bookingCount] = await pool.query('SELECT COUNT(*) as count FROM bookings WHERE class_id = ?', [classId]);

            if (!userRows.length || !classRows.length) return send(404, { message: 'Erreur' });

            const user = userRows[0];
            const cls = classRows[0];

            if (user.credits_balance < cls.credits_price) {
                return send(400, { success: false, message: 'Solde de crédits insuffisant' });
            }
            if (bookingCount[0].count >= cls.capacity) {
                return send(400, { success: false, message: 'Cours complet' });
            }

            await pool.query('START TRANSACTION');
            await pool.query('UPDATE users SET credits_balance = credits_balance - ? WHERE id = ?', [cls.credits_price, userId]);
            await pool.query('INSERT INTO bookings (class_id, user_id) VALUES (?, ?)', [classId, userId]);
            await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, 'booking', -cls.credits_price, `Réservation : ${cls.title || 'Séance'}`]);
            await pool.query('COMMIT');

            const [updatedUser] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
            return send(200, { success: true, user: updatedUser[0] });
        }

        const cancelClassMatch = path.match(/^\/classes\/cancel\/(\d+)$/);
        if (method === 'POST' && cancelClassMatch) {
            const classId = cancelClassMatch[1];
            const { userId } = req.body;

            // Vérification du délai d'annulation
            const [settings] = await pool.query('SELECT cancellationDelay FROM settings WHERE id = 1');
            const delay = settings[0]?.cancellationDelay || 24;
            const [cls] = await pool.query('SELECT title, date, time, credits_price FROM classes WHERE id = ?', [classId]);
            
            if (cls.length) {
                const classDate = new Date(cls[0].date + 'T' + cls[0].time);
                const now = new Date();
                const hoursDiff = (classDate - now) / 1000 / 60 / 60;
                if (hoursDiff < delay) {
                    return send(400, { success: false, message: `Annulation impossible moins de ${delay}h avant le cours.` });
                }
            }

            const creditsToRefund = (cls.length && cls[0].credits_price) ? cls[0].credits_price : 0;

            await pool.query('START TRANSACTION');
            const [result] = await pool.query('DELETE FROM bookings WHERE class_id = ? AND user_id = ?', [classId, userId]);
            
            if (result.affectedRows > 0 && creditsToRefund > 0) {
                await pool.query('UPDATE users SET credits_balance = credits_balance + ? WHERE id = ?', [creditsToRefund, userId]);
                await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [userId, 'refund', creditsToRefund, `Annulation : ${cls[0].title}`]);
            }
            await pool.query('COMMIT');

            return send(200, { success: true, message: 'Réservation annulée' });
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
                        product_data: { name: pkg.name, description: `${pkg.credits} crédits Pilates` },
                        unit_amount: pkg.price * 100,
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `http://${req.headers.host}/paiement-succes`,
                cancel_url: `http://${req.headers.host}/#profil?payment=cancel`,
                metadata: { userId: userId.toString(), credits: pkg.credits.toString(), price: pkg.price.toString(), packageName: pkg.name, type: 'credits_purchase' }
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

                const { userId, credits, price, packageName, type } = session.metadata;
                
                if (credits && userId) {
                    console.log(`[WEBHOOK] Traitement achat : User ${userId}, +${credits} crédits`);
                    
                    const description = price ? `Achat de crédits (${price}€)` : 'Achat de crédits';
                    await pool.query('START TRANSACTION');
                    await pool.query('UPDATE users SET credits_balance = credits_balance + ? WHERE id = ?', [parseInt(credits), parseInt(userId)]);
                    await pool.query('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [parseInt(userId), 'purchase', parseInt(credits), description]);
                    await pool.query('COMMIT');
                    console.log(`✅ Crédits ajoutés en DB (+${credits}) pour l'utilisateur ${userId}`);

                    // Récupérer l'email de l'utilisateur depuis la DB pour être sûr de l'adresse
                    const [userRows] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);
                    const targetEmail = userRows[0]?.email || session.customer_details?.email;
                    
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

                    try {
                        const info = await transporter.sendMail({
                            from: `"L'espace doré" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                            to: targetEmail,
                            subject: "Confirmation de votre achat - L'espace doré",
                            html: `
                                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e7e5e4; border-radius: 12px; max-width: 600px; margin: auto;">
                                    <h2 style="color: #065f46;">Merci pour votre achat !</h2>
                                    <p>Votre paiement a été validé avec succès. Voici le récapitulatif de votre commande :</p>
                                    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                        <p style="margin: 5px 0;"><strong>Produit :</strong> ${packageName || 'Pack de crédits'}</p>
                                        <p style="margin: 5px 0;"><strong>Montant :</strong> ${price}€</p>
                                        <p style="margin: 5px 0;"><strong>Crédits ajoutés :</strong> +${credits}</p>
                                    </div>
                                    <p>Vos crédits sont immédiatement disponibles sur votre compte pour vos prochaines réservations.</p>
                                    <p style="font-size: 12px; color: #78716c; margin-top: 30px;">Ceci est un email automatique, merci de ne pas y répondre.</p>
                                </div>
                            `
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
            const { studioAddress, studioPhone, studioEmail, cancellationDelay, aiProvider, facebookUrl, instagramUrl, tiktokUrl } = req.body;
            await pool.query(`
                INSERT INTO settings (id, studioAddress, studioPhone, studioEmail, cancellationDelay, aiProvider, facebookUrl, instagramUrl, tiktokUrl)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    studioAddress = COALESCE(?, studioAddress), 
                    studioPhone = COALESCE(?, studioPhone), 
                    studioEmail = COALESCE(?, studioEmail), 
                    cancellationDelay = COALESCE(?, cancellationDelay), 
                    aiProvider = COALESCE(?, aiProvider),
                    facebookUrl = COALESCE(?, facebookUrl),
                    instagramUrl = COALESCE(?, instagramUrl),
                    tiktokUrl = COALESCE(?, tiktokUrl)
            `, [studioAddress, studioPhone, studioEmail, cancellationDelay, aiProvider, facebookUrl, instagramUrl, tiktokUrl,
                studioAddress, studioPhone, studioEmail, cancellationDelay, aiProvider, facebookUrl, instagramUrl, tiktokUrl]);
            
            return send(200, { id: 1, ...req.body });
        }

        return send(404, { message: 'Route non trouvée' });

    } catch (err) {
        console.error(`❌ [API ERROR] ${method} ${path} :`, err);
        return send(500, { error: err.message });
    }
};

module.exports = { handleRequest };
