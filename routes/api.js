/**
 * @file api.js
 * @description Gestionnaire de routes API pour le backend Pilates.
 * Utilise un pool de connexion MySQL pour les opérations CRUD.
 */

const pool = require('../database');
const bcrypt = require('bcrypt');

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
                studioEmail VARCHAR(100)
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
                credits_balance INT DEFAULT 0
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
                price INT,
                credits_price INT DEFAULT 1,
                description TEXT
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                description TEXT,
                duration INT,
                default_price INT,
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

        // Mise à jour des tables existantes pour ajouter les nouvelles colonnes si nécessaire
        // On utilise des blocs try/catch individuels pour que si une colonne existe déjà, le script continue
        try { await pool.query(`ALTER TABLE users ADD COLUMN credits_balance INT DEFAULT 0`); } catch (e) {}
        try { await pool.query(`ALTER TABLE classes ADD COLUMN credits_price INT DEFAULT 1`); } catch (e) {}
        try { await pool.query(`ALTER TABLE users ADD COLUMN zipCode VARCHAR(10)`); } catch (e) {}
        try { await pool.query(`ALTER TABLE users ADD COLUMN city VARCHAR(100)`); } catch (e) {}
        // Migration des anciens noms vers les nouveaux si nécessaire
        try { await pool.query(`ALTER TABLE users CHANGE points_balance credits_balance INT DEFAULT 0`); } catch (e) {}
        try { await pool.query(`ALTER TABLE classes CHANGE points_price credits_price INT DEFAULT 1`); } catch (e) {}
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
            await pool.query('INSERT INTO classes (title, date, time, duration, capacity, price, description) VALUES ?', [defaultClasses]);
        }

        // 3b. Course Templates (Exemples)
        const [templates] = await pool.query('SELECT COUNT(*) as count FROM course_templates');
        if (templates[0].count === 0) {
            const defaultTemplates = [
                ['Pilates Mat Fondamental', 'Séance au sol axée sur les principes de base.', 60, 20, 1],
                ['Pilates Flow Dynamique', 'Enchaînement fluide pour travailler le cardio et la souplesse.', 45, 22, 1],
                ['Spécial Dos & Posture', 'Focus sur le renforcement des muscles profonds du dos.', 50, 25, 2],
                ['Pilates avec Accessoires', 'Utilisation de ballons, cercles et élastiques.', 60, 23, 1]
            ];
            await pool.query('INSERT INTO course_templates (title, description, duration, default_price, default_credits_price) VALUES ?', [defaultTemplates]);
        }

        // 4. Credit Packages (Tarif dégressif)
        const [packages] = await pool.query('SELECT COUNT(*) as count FROM credit_packages');
        if (packages[0].count === 0) {
            await pool.query('INSERT INTO credit_packages (name, credits, price) VALUES ?', [[
                ['Pack Découverte', 1, 20],
                ['Pack Équilibre (10 séances)', 10, 180],
                ['Pack Sérénité (20 séances)', 20, 320]
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
    const path = url.pathname.replace('/api', '').replace(/\/$/, '') || '/';
    const method = req.method;

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

        if (method === 'POST' && path === '/register') {
            const { firstName, lastName, email, password, address, phone, zipCode, city } = req.body;
            const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) return send(400, { success: false, message: 'Cet email est déjà utilisé' });

            const name = `${firstName} ${lastName}`;
            const hashedPassword = await bcrypt.hash(password, 10);
            const [result] = await pool.query(
                'INSERT INTO users (firstName, lastName, name, email, password, address, phone, zipCode, city, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [firstName, lastName, name, email, hashedPassword, address, phone, zipCode, city, 'user']
            );
            const [newUser] = await pool.query('SELECT id, firstName, lastName, name, email, role, address, phone, zipCode, city, credits_balance FROM users WHERE id = ?', [result.insertId]);
            return send(200, { success: true, user: newUser[0] });
        }

        if (method === 'PUT' && path === '/users/profile') {
            const { id, firstName, lastName, email, password, address, phone, zipCode, city } = req.body;
            const name = `${firstName} ${lastName}`;
            
            let query = 'UPDATE users SET firstName=?, lastName=?, name=?, email=?, address=?, phone=?, zipCode=?, city=?';
            let params = [firstName, lastName, name, email, address, phone, zipCode, city];
            
            // On ne met à jour le mot de passe que s'il est fourni (non vide)
            if (password && password.trim() !== "") {
                const hashedPassword = await bcrypt.hash(password, 10);
                query += ', password=?';
                params.push(hashedPassword);
            }
            
            query += ' WHERE id=?';
            params.push(id);
            
            await pool.query(query, params);
            
            const [updated] = await pool.query('SELECT id, firstName, lastName, name, email, role, address, phone, zipCode, city, credits_balance FROM users WHERE id = ?', [id]);
            return send(200, { success: true, user: updated[0] });
        }

        if (method === 'POST' && path === '/credits/buy') {
            const { userId, credits } = req.body;
            await pool.query('UPDATE users SET credits_balance = credits_balance + ? WHERE id = ?', [credits, userId]);
            const [updated] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
            return send(200, { success: true, credits_balance: updated[0].credits_balance });
        }

        // --- ROUTES CLASSES ---
        if (method === 'GET' && path === '/course-templates') {
            const [templates] = await pool.query('SELECT * FROM course_templates');
            return send(200, templates);
        }

        if (method === 'POST' && path === '/course-templates') {
            const { title, description, duration, default_price, default_credits_price } = req.body;
            await pool.query(
                'INSERT INTO course_templates (title, description, duration, default_price, default_credits_price) VALUES (?, ?, ?, ?, ?)',
                [title, description, duration, default_price, default_credits_price]
            );
            return send(200, { success: true });
        }

        const templateIdMatch = path.match(/^\/course-templates\/(\d+)$/);
        if (method === 'PUT' && templateIdMatch) {
            const { title, description, duration, default_price, default_credits_price } = req.body;
            await pool.query(
                'UPDATE course_templates SET title=?, description=?, duration=?, default_price=?, default_credits_price=? WHERE id=?',
                [title, description, duration, default_price, default_credits_price, templateIdMatch[1]]
            );
            return send(200, { success: true });
        }

        if (method === 'GET' && path === '/credit-packages') {
            const [pkgs] = await pool.query('SELECT * FROM credit_packages');
            return send(200, pkgs);
        }

        if (method === 'GET' && path === '/classes') {
            const [rows] = await pool.query(`
                SELECT c.id, c.title, DATE_FORMAT(c.date, '%Y-%m-%d') as date, c.time, c.duration, c.capacity, c.price, c.credits_price, c.description, 
                GROUP_CONCAT(b.user_id) as bookedUsersStr 
                FROM classes c 
                LEFT JOIN bookings b ON c.id = b.class_id 
                GROUP BY c.id
            `);
            
            const classes = rows.map(c => {
                const bookedUsers = c.bookedUsersStr ? c.bookedUsersStr.split(',').map(Number) : [];
                delete c.bookedUsersStr;
                return { ...c, bookedUsers };
            });
            return send(200, classes);
        }

        if (method === 'POST' && path === '/classes') {
            const { title, date, time, duration, capacity, price, credits_price, description } = req.body;
            const [result] = await pool.query(
                'INSERT INTO classes (title, date, time, duration, capacity, price, credits_price, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [title, date, time, duration, capacity, price, credits_price, description]
            );
            return send(200, { id: result.insertId, ...req.body, bookedUsers: [] });
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
            const [classRows] = await pool.query('SELECT credits_price, capacity FROM classes WHERE id = ?', [classId]);
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
            await pool.query('COMMIT');

            const [updatedUser] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
            return send(200, { success: true, user: updatedUser[0] });
        }

        const cancelClassMatch = path.match(/^\/classes\/cancel\/(\d+)$/);
        if (method === 'POST' && cancelClassMatch) {
            const classId = cancelClassMatch[1];
            const { userId } = req.body;
            await pool.query('DELETE FROM bookings WHERE class_id = ? AND user_id = ?', [classId, userId]);
            return send(200, { success: true, message: 'Réservation annulée' });
        }

        // --- ROUTES SETTINGS ---
        if (method === 'GET' && path === '/settings') {
            const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
            return send(200, rows[0] || {});
        }

        if (method === 'POST' && path === '/settings') {
            const { studioAddress, studioPhone, studioEmail } = req.body;
            await pool.query(`
                INSERT INTO settings (id, studioAddress, studioPhone, studioEmail) 
                VALUES (1, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE studioAddress = VALUES(studioAddress), studioPhone = VALUES(studioPhone), studioEmail = VALUES(studioEmail)
            `, [studioAddress, studioPhone, studioEmail]);
            
            return send(200, { id: 1, ...req.body });
        }

        return send(404, { message: 'Route non trouvée' });

    } catch (err) {
        return send(500, { error: err.message });
    }
};

module.exports = { handleRequest };
