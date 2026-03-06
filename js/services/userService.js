import { API_URL } from '../api.js';

export const userService = {
    async updateProfile(app, e) {
        e.preventDefault();
        const password = document.getElementById('prof-password').value;
        const confirmPassword = document.getElementById('prof-confirm-password').value;
        const email = document.getElementById('prof-email').value;
        const phone = document.getElementById('prof-phone').value;

        if (!app.validateEmail(email)) return app.showNotification("Email invalide.", 'error');
        if (phone && !app.validatePhone(phone)) return app.showNotification("Téléphone invalide.", 'error');

        const userData = {
            id: app.state.currentUser.id,
            firstName: document.getElementById('prof-firstname').value,
            lastName: document.getElementById('prof-lastname').value,
            email: email,
            password: "",
            address: document.getElementById('prof-address').value,
            phone: phone,
            zipCode: document.getElementById('prof-zipcode').value,
            city: document.getElementById('prof-city').value,
            newsletter_subscribed: document.getElementById('prof-newsletter')?.checked ? 1 : 0
        };

        let passwordUpdated = false;
        if (confirmPassword.trim() !== "") {
            if (password !== confirmPassword) return app.showNotification("Mots de passe différents.", 'error');
            if (!app.validatePassword(password)) return app.showNotification("Mot de passe trop court.", 'error');
            userData.password = password;
            passwordUpdated = true;
        }

        try {
            const res = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            if (data.success) {
                app.state.currentUser = data.user;
                localStorage.setItem('pilates_user', JSON.stringify(data.user));
                app.showNotification(passwordUpdated ? "Profil et mot de passe mis à jour !" : "Modifications enregistrées");
                document.getElementById('prof-password').value = "";
                document.getElementById('prof-confirm-password').value = "";
            } else {
                app.showNotification(data.message || "Erreur", 'error');
            }
        } catch (err) { app.showNotification("Erreur serveur", 'error'); }
    },

    async buyCredits(app, pkg) {
        if (!confirm(`Acheter ${pkg.name} ?`)) return;
        const res = await fetch(`${API_URL}/credits/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: app.state.currentUser.id, credits: pkg.credits })
        });
        const data = await res.json();
        if (data.success) {
            app.state.currentUser.credits_balance = data.credits_balance;
            app.showNotification("Crédits ajoutés !");
            app.render();
        }
    },

    async updateStudioSettings(app, e) {
        e.preventDefault();
        const settings = {
            studioAddress: document.getElementById('admin-studio-address').value,
            studioPhone: document.getElementById('admin-studio-phone').value,
            studioEmail: document.getElementById('admin-studio-email').value
        };
        await fetch(`${API_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        app.showNotification('Paramètres mis à jour.');
        app.init();
    }
};