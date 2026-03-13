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
        if (!app.state.currentUser) {
            app.showNotification("Veuillez vous connecter pour acheter des crédits.", "error");
            app.navigate('connexion');
            return;
        }

        // Ouvrir le popup immédiatement
        const width = 600;
        const height = 800;
        const left = (window.innerWidth / 2) - (width / 2);
        const top = (window.innerHeight / 2) - (height / 2);
        const popup = window.open('', 'Paiement Stripe', `width=${width},height=${height},top=${top},left=${left}`);
        
        if (popup) {
            popup.document.write(`<html><head><title>Paiement</title><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;background:#f5f5f4;color:#444;}</style></head><body><div style="text-align:center"><h3>Connexion à Stripe...</h3><p>Veuillez patienter.</p></div></body></html>`);
        }

        try {
            const res = await fetch(`${API_URL}/checkout/create-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    packageId: pkg.id, 
                    userId: app.state.currentUser.id 
                })
            });
            const data = await res.json();
            if (data.url) {
                popup.location.href = data.url;
            } else {
                popup.close();
                app.showNotification(data.message || data.error || "Erreur lors de l'initialisation du paiement", "error");
            }
        } catch (err) {
            if (popup) popup.close();
            app.showNotification("Erreur de connexion au service de paiement", "error");
        }
    },

    async updateStudioSettings(app, e) {
        e.preventDefault();
        const settings = {
            studioAddress: document.getElementById('admin-studio-address').value,
            studioPhone: document.getElementById('admin-studio-phone').value,
            studioEmail: document.getElementById('admin-studio-email').value,
            cancellationDelay: app.state.cancellationDelay // On garde la valeur actuelle car le champ n'est plus dans ce formulaire
        };
        await fetch(`${API_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        app.showNotification('Paramètres mis à jour.');
        app.init();
    },

    async updateCancellationDelay(app, e) {
        e.preventDefault();
        const settings = {
            studioAddress: app.state.studioAddress,
            studioPhone: app.state.studioPhone,
            studioEmail: app.state.studioEmail,
            cancellationDelay: parseInt(document.getElementById('admin-cancellation-delay').value) || 0
        };
        await fetch(`${API_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        app.showNotification('Délai mis à jour.');
        app.init();
    },

    async updatePackage(app, e, id) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const pkg = {
            name: formData.get('name'),
            credits: parseInt(formData.get('credits')),
            price: parseInt(formData.get('price'))
        };
        await fetch(`${API_URL}/credit-packages/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pkg)
        });
        app.showNotification('Pack mis à jour.');
        app.init();
    },

    async createPackage(app, e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const pkg = {
            name: formData.get('name'),
            credits: parseInt(formData.get('credits')),
            price: parseInt(formData.get('price'))
        };
        await fetch(`${API_URL}/credit-packages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pkg)
        });
        app.showNotification('Nouveau pack ajouté.');
        app.init();
    },

    async getUserDetails(app, userId) {
        const res = await fetch(`${API_URL}/users/${userId}/details`);
        return await res.json();
    },

    async adjustCredits(app, e, userId) {
        e.preventDefault();
        const mode = e.submitter.dataset.mode;
        let amount = parseInt(e.target.amount.value);
        if (mode === 'remove') amount = -amount;

        await fetch(`${API_URL}/users/${userId}/gift`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        app.showNotification(amount > 0 ? 'Crédits ajoutés !' : 'Crédits retirés !');
        app.viewUser(userId); // Rafraîchir la vue
    },

    async sendUserMessage(app, e, userId) {
        e.preventDefault();
        const subject = e.target.subject.value;
        const message = app.state.adminUserMessageContent;

        if (!subject || !message || message.trim() === '' || message === '<p><br></p>') {
            return app.showNotification("Veuillez remplir tous les champs.", 'error');
        }

        await fetch(`${API_URL}/users/${userId}/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, message }) });
        app.showNotification('Message envoyé !');
        e.target.subject.value = '';
        if (app.state.adminUserQuill) {
            app.state.adminUserQuill.setContents([]);
        }
    }
};