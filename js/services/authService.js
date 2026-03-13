import { API_URL } from '../api.js';

export const authService = {
    /**
     * Déconnecte l'utilisateur.
     * @param {PilatesApp} app
     */
    logout(app) {
        app.state.currentUser = null;
        localStorage.removeItem('pilates_user');
        app.navigate('accueil');
    },

    /**
     * Envoie un code de vérification à l'email spécifié.
     * Utilisé pour la première étape d'inscription et le renvoi du code.
     * @param {PilatesApp} app
     * @param {string} email
     * @returns {Promise<boolean>} True si le code a été envoyé avec succès.
     */
    async sendVerificationCode(app, email) {
        try {
            const res = await fetch(`${API_URL}/send-verification-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (!data.success) {
                app.showNotification(data.message || 'Erreur lors de l\'envoi du code.', 'error');
            }
            return data.success;
        } catch (err) {
            app.showNotification("Erreur de connexion au serveur.", 'error');
            return false;
        }
    },

    /**
     * Attache les écouteurs d'événements au formulaire d'authentification.
     * Gère la connexion, l'inscription en deux étapes et la réinitialisation de mot de passe.
     * @param {PilatesApp} app
     * @param {'connexion'|'inscription'|'reset-password'} mode
     */
    attachAuthEvents(app, mode) {
        // Déterminer quel formulaire est actif selon l'état de vérification
        const isVerifying = app.state.isVerifyingEmail && mode === 'inscription';
        const activeFormId = isVerifying ? 'auth-code-verification-form' : 'auth-main-form';
        const form = document.getElementById(activeFormId);
        
        if (!form) return;

        // On remplace le formulaire par une copie pour supprimer les anciens écouteurs (évite les doublons)
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("🚀 Auth form submitted. Mode:", mode, "isVerifyingEmail:", app.state.isVerifyingEmail, "resetPasswordToken:", app.state.resetPasswordToken);

            let email, password;
            if (mode === 'inscription' && app.state.isVerifyingEmail) {
                email = app.state.registrationData.email;
                password = app.state.registrationData.password;
            } else if (mode === 'reset-password' && !app.state.resetPasswordToken) {
                // Pour la demande de lien de réinitialisation (email seulement)
                email = newForm.querySelector('#auth-email')?.value;
                password = ''; // Pas de mot de passe pour cette étape
            } else {
                // Pour la connexion ou la première étape d'inscription
                email = newForm.querySelector('#auth-email')?.value;
                password = newForm.querySelector('#auth-password')?.value;
            }

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
            } else if (mode === 'inscription' && !app.state.isVerifyingEmail) {
                // Mode INSCRIPTION - ÉTAPE 1: Envoi du code de vérification
                console.log("➡️ Executing Step 1: Sending verification code for registration.");
                const firstName = newForm.querySelector('#auth-firstname').value;
                const lastName = newForm.querySelector('#auth-lastname').value;
                const address = newForm.querySelector('#auth-address').value;
                
                const phone = newForm.querySelector('#auth-phone').value;
                const zipCode = newForm.querySelector('#auth-zipcode').value;
                const city = newForm.querySelector('#auth-city').value;
                const confirmPassword = newForm.querySelector('#auth-confirm-password').value;
                const newsletter_subscribed = newForm.querySelector('#auth-newsletter')?.checked ? 1 : 0;

                if (!app.validateEmail(email)) return app.showNotification("Email invalide.", 'error');
                if (!app.validatePhone(phone)) return app.showNotification("Téléphone invalide.", 'error');
                if (!app.validatePassword(password)) return app.showNotification("Mot de passe trop court (min 5).", 'error');
                if (password !== confirmPassword) return app.showNotification("Mots de passe différents.", 'error');
                if (!firstName || !lastName) return app.showNotification("Nom/Prénom obligatoires.", 'error');

                const startResendTimer = () => {
                    app.state.resendCodeTimer = 60;
                    app.state.resendCodeInterval = setInterval(() => {
                        // On cherche les éléments dans le document car newForm peut avoir été remplacé
                        const resendButtonTextElement = document.getElementById('resend-code-text');
                        const resendButton = document.getElementById('resend-code-btn');

                        if (resendButtonTextElement && resendButton) {
                            if (app.state.resendCodeTimer > 0) {
                                resendButtonTextElement.textContent = `Renvoyer le code (${app.state.resendCodeTimer}s)`;
                                resendButton.disabled = true;
                            } else {
                                resendButtonTextElement.textContent = 'Renvoyer le code';
                                resendButton.disabled = false;
                            }
                        }
                        
                        app.state.resendCodeTimer--; // Décrémenter le compteur après la mise à jour
                        if (app.state.resendCodeTimer <= 0) clearInterval(app.state.resendCodeInterval); // Stop timer
                    }, 1000);
                };

                // Transition immédiate vers la vue de vérification pour une meilleure réactivité
                app.state.registrationData = { firstName, lastName, email, password, address, phone, zipCode, city, newsletter_subscribed };
                app.state.isVerifyingEmail = true;
                app.renderAuthView();

                try {
                    const success = await this.sendVerificationCode(app, email);
                    if (success) {
                        startResendTimer(); // Démarrer le timer APRÈS que la vue est rendue
                        app.showNotification("Code envoyé ! Vérifiez vos emails.");
                    } else {
                        // sendVerificationCode gère déjà la notification d'erreur
                        console.error("❌ Failed to send code.");
                    }
                } catch (err) { app.showNotification("Erreur de connexion.", 'error'); }
            } else if (mode === 'inscription' && app.state.isVerifyingEmail) {
                // Mode INSCRIPTION - ÉTAPE 2: Finalisation avec le code
                console.log("➡️ Executing Step 2: Finalizing registration with code.");
                const email = app.state.registrationData.email; // Email est dans registrationData
                const password = app.state.registrationData.password; // Password est dans registrationData
                const codeInput = newForm.querySelector('#auth-code-input');
                const code = codeInput ? codeInput.value : '';
                if (!code) return app.showNotification("Veuillez saisir le code reçu.", 'error');

                try {
                    const res = await fetch(`${API_URL}/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...app.state.registrationData, code })
                    });
                    const data = await res.json();
                    if (data.success) { // Registration successful.
                        app.state.currentUser = data.user;
                        localStorage.setItem('pilates_user', JSON.stringify(data.user));
                        app.state.isVerifyingEmail = false;
                        clearInterval(app.state.resendCodeInterval); // Stop timer
                        app.state.resendCodeTimer = 0;
                        app.state.registrationData = null;
                        app.init();
                        app.navigate('planning');
                    } else {
                        console.error("❌ Failed to register:", data.message);
                        app.showNotification(data.message || 'Code invalide ou erreur inscription.', 'error');
                    }
                } catch (err) { app.showNotification("Erreur inscription.", 'error'); }
            } else if (mode === 'reset-password') {
                // Mode RÉINITIALISATION DE MOT DE PASSE
                if (app.state.resetPasswordToken) {
                    // User is on the form to set a new password with a token
                    const newPassword = newForm.querySelector('#reset-password-new').value;
                    const confirmNewPassword = newForm.querySelector('#reset-password-confirm').value;
                    const token = app.state.resetPasswordToken; // Already available from state

                    if (!app.validatePassword(newPassword)) return app.showNotification("Le nouveau mot de passe est trop court (min 5).", 'error');
                    if (newPassword !== confirmNewPassword) return app.showNotification("Les nouveaux mots de passe ne correspondent pas.", 'error');

                    try {
                        const res = await fetch(`${API_URL}/reset-password`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token, newPassword })
                        });
                        const data = await res.json();
                        if (data.success) {
                            app.showNotification("Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.");
                            app.state.resetPasswordToken = null; // Clean up token
                            app.navigate('connexion');
                        } else {
                            app.showNotification(data.message || "Erreur lors de la réinitialisation du mot de passe.", 'error');
                        }
                    } catch (err) {
                        app.showNotification("Erreur de connexion au serveur.", 'error');
                    }
                } else {
                    // User is on the form to request a reset link (forgot password)
                    const emailToReset = newForm.querySelector('#auth-email')?.value;
                    if (!app.validateEmail(emailToReset)) return app.showNotification("Email invalide.", 'error');

                    try {
                        const res = await fetch(`${API_URL}/forgot-password`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: emailToReset })
                        });
                        const data = await res.json();
                        if (data.success) {
                            app.showNotification("Si cet email existe, un lien de réinitialisation a été envoyé.", 'success');
                        } else {
                            app.showNotification(data.message || "Erreur lors de l'envoi du lien de réinitialisation.", 'error');
                        }
                    } catch (err) {
                        app.showNotification("Erreur de connexion au serveur.", 'error');
                    }
                }
            }
        });
    }
};
