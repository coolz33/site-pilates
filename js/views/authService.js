import { API_URL } from '../api.js';

export const authService = {
    logout(app) {
        app.state.currentUser = null;
        localStorage.removeItem('pilates_user');
        app.navigate('accueil');
    },

    attachAuthEvents(app, mode) {
        const form = document.getElementById('auth-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;

            if (mode === 'connexion') {
                try {
                    const res = await fetch(`${API_URL}/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });
                    const data = await res.json();
                    if (data.success) {
                        app.state.currentUser = data.user;
                        localStorage.setItem('pilates_user', JSON.stringify(data.user));
                        app.init();
                        app.navigate('planning');
                    } else {
                        app.showNotification(data.message || 'Email ou mot de passe incorrect.', 'error');
                    }
                } catch (err) { app.showNotification("Erreur de connexion", 'error'); }
            } else {
                const firstName = document.getElementById('auth-firstname').value;
                const lastName = document.getElementById('auth-lastname').value;
                const address = document.getElementById('auth-address').value;
                const phone = document.getElementById('auth-phone').value;
                const zipCode = document.getElementById('auth-zipcode').value;
                const city = document.getElementById('auth-city').value;
                const confirmPassword = document.getElementById('auth-confirm-password').value;
                const newsletter_subscribed = document.getElementById('auth-newsletter')?.checked ? 1 : 0;

                if (!app.validateEmail(email)) return app.showNotification("Email invalide.", 'error');
                if (!app.validatePhone(phone)) return app.showNotification("Téléphone invalide.", 'error');
                if (!app.validatePassword(password)) return app.showNotification("Mot de passe trop court.", 'error');
                if (password !== confirmPassword) return app.showNotification("Mots de passe différents.", 'error');
                if (!firstName || !lastName) return app.showNotification("Nom/Prénom obligatoires.", 'error');

                try {
                    const res = await fetch(`${API_URL}/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ firstName, lastName, email, password, address, phone, zipCode, city, newsletter_subscribed })
                    });
                    const data = await res.json();
                    if (data.success) {
                        app.state.currentUser = data.user;
                        localStorage.setItem('pilates_user', JSON.stringify(data.user));
                        app.init();
                        app.navigate('planning');
                    } else {
                        app.showNotification(data.message || 'Erreur inscription.', 'error');
                    }
                } catch (err) { app.showNotification("Erreur inscription.", 'error'); }
            }
        });
    }
};