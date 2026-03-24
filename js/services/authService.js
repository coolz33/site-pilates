import { API_URL } from '../api.js';

export const authService = {
    /**
     * Déconnecte l'utilisateur.
     * @param {PilatesApp} app
     */
    logout(app) {
        app.state.currentUser = null;
        localStorage.removeItem('pilates_user');
        localStorage.removeItem('pilates_token');
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
     * Gère la connexion utilisateur.
     * @param {PilatesApp} app - L'instance de l'application.
     * @param {string} email - L'email saisi.
     * @param {string} password - Le mot de passe saisi.
     */
    async handleLogin(app, email, password) {
        try {
            // Appel à l'API pour se connecter
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            // Si connexion réussie
            if (data.success) {
                app.state.currentUser = data.user;
                // Stockage de la session dans le cache du navigateur
                localStorage.setItem('pilates_user', JSON.stringify(data.user));
                if (data.token) localStorage.setItem('pilates_token', data.token);
                app.init(); // Réinitialise l'app avec les nouveaux droits
                app.navigate('planning'); // Redirection vers le planning
            } else {
                app.showNotification(data.message || 'Email ou mot de passe incorrect.', 'error');
            }
        } catch (err) { 
            app.showNotification("Erreur de connexion", 'error'); 
        }
    },

    /**
     * Gère la première étape de l'inscription (Vérification initiale et envoi de l'OTP).
     * @param {PilatesApp} app - L'instance de l'application.
     * @param {HTMLFormElement} form - Le formulaire soumis.
     * @param {string} email - L'email saisi.
     * @param {string} password - Le mot de passe saisi.
     */
    async handleRegistrationStep1(app, form, email, password) {
        console.log("➡️ Executing Step 1: Sending verification code for registration.");
        
        // Récupération des données du formulaire avec nettoyage (trim)
        const firstName = form.querySelector('#auth-firstname').value.trim();
        const lastName = form.querySelector('#auth-lastname').value.trim();
        const address = form.querySelector('#auth-address').value.trim();
        const phone = form.querySelector('#auth-phone').value.trim();
        const zipCode = form.querySelector('#auth-zipcode').value.trim();
        const city = form.querySelector('#auth-city').value.trim();
        const confirmPassword = form.querySelector('#auth-confirm-password').value;
        const newsletter_subscribed = form.querySelector('#auth-newsletter')?.checked ? 1 : 0;
        
        // Normalisation de l'email
        email = email.trim().toLowerCase();

        // Validations front-end
        if (!app.validateEmail(email)) return app.showNotification("Email invalide.", 'error');
        if (!app.validatePhone(phone)) return app.showNotification("Téléphone invalide.", 'error');
        if (!app.validatePassword(password)) return app.showNotification("Mot de passe trop court (min 5).", 'error');
        if (password !== confirmPassword) return app.showNotification("Mots de passe différents.", 'error');
        if (!firstName || !lastName) return app.showNotification("Nom/Prénom obligatoires.", 'error');

        // Préparation du minuteur pour le renvoi du code
        const startResendTimer = () => {
            app.state.resendCodeTimer = 60;
            app.state.resendCodeInterval = setInterval(() => {
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
                
                app.state.resendCodeTimer--;
                if (app.state.resendCodeTimer <= 0) clearInterval(app.state.resendCodeInterval);
            }, 1000);
        };

        // Sauvegarde temporaire des données pour l'étape 2
        app.state.registrationData = { firstName, lastName, email, password, address, phone, zipCode, city, newsletter_subscribed };
        app.state.isVerifyingEmail = true;
        app.renderAuthView(); // Change l'affichage vers la saisie du code

        try {
            // Envoi réel du code OTP
            const success = await this.sendVerificationCode(app, email);
            if (success) {
                startResendTimer();
                app.showNotification("Code envoyé ! Vérifiez vos emails.");
            } else {
                console.error("❌ Failed to send code.");
            }
        } catch (err) { 
            app.showNotification("Erreur de connexion.", 'error'); 
        }
    },

    /**
     * Gère la deuxième étape de l'inscription (Validation du code OTP).
     * @param {PilatesApp} app - L'instance de l'application.
     * @param {HTMLFormElement} form - Le formulaire de vérification soumis.
     */
    async handleRegistrationStep2(app, form) {
        console.log("➡️ Executing Step 2: Finalizing registration with code.");
        
        const codeInput = form.querySelector('#auth-code-input');
        const code = codeInput ? codeInput.value.trim() : '';
        
        if (!code || code.length < 6) return app.showNotification("Veuillez saisir les 6 chiffres du code.", 'error');

        console.log(`[AUTH] Finalizing registration for ${app.state.registrationData?.email} with code ${code}`);

        try {
            // Création du compte avec les données sauvegardées + le code
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...app.state.registrationData, code })
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("❌ Registration failed:", errorData.message);
                return app.showNotification(errorData.message || 'Code invalide ou erreur inscription.', 'error');
            }

            const data = await res.json();
            
            if (data.success) { 
                console.log("✅ Registration successful. Redirecting...");
                
                // Inscription réussie : on connecte l'utilisateur
                app.state.currentUser = data.user;
                localStorage.setItem('pilates_user', JSON.stringify(data.user));
                if (data.token) localStorage.setItem('pilates_token', data.token);
                
                // Nettoyage COMPLET de l'état d'inscription
                app.state.isVerifyingEmail = false;
                app.state.registrationData = null;
                app.state.registrationCode = '';
                clearInterval(app.state.resendCodeInterval);
                app.state.resendCodeTimer = 0;
                
                // Re-charge l'app pour avoir toutes les données fraîches
                await app.init();
                app.navigate('planning');
            } else {
                app.showNotification(data.message || 'Le code saisi est incorrect.', 'error');
            }
        } catch (err) { 
            console.error("❌ Critical registration error:", err);
            app.showNotification("Une erreur technique est survenue.", 'error'); 
        }
    },

    /**
     * Gère la réinitialisation de mot de passe (Demande de lien et création du nouveau MDP).
     * @param {PilatesApp} app - L'instance de l'application.
     * @param {HTMLFormElement} form - Le formulaire soumis.
     */
    async handleResetPassword(app, form) {
        if (app.state.resetPasswordToken) {
            // ÉTAPE 2 : L'utilisateur est sur la page avec le token URL pour définir le nouveau mot de passe
            const newPassword = form.querySelector('#reset-password-new').value;
            const confirmNewPassword = form.querySelector('#reset-password-confirm').value;
            const token = app.state.resetPasswordToken;

            if (!app.validatePassword(newPassword)) return app.showNotification("Le nouveau mot de passe est trop court (min 5).", 'error');
            if (newPassword !== confirmNewPassword) return app.showNotification("Les nouveaux mots de passe ne correspondent pas.", 'error');

            try {
                // Requête de mise à jour du mot de passe
                const res = await fetch(`${API_URL}/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword })
                });
                const data = await res.json();
                
                if (data.success) {
                    app.showNotification("Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.");
                    app.state.resetPasswordToken = null; // Nettoyage du token
                    app.navigate('connexion');
                } else {
                    app.showNotification(data.message || "Erreur lors de la réinitialisation du mot de passe.", 'error');
                }
            } catch (err) {
                app.showNotification("Erreur de connexion au serveur.", 'error');
            }
        } else {
            // ÉTAPE 1 : Demande du lien de réinitialisation via un simple email
            const emailToReset = form.querySelector('#auth-email')?.value;
            
            if (!app.validateEmail(emailToReset)) return app.showNotification("Email invalide.", 'error');

            try {
                // Requête d'envoi de mail
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
    },

    /**
     * Attache les écouteurs d'événements au formulaire d'authentification principal.
     * @param {PilatesApp} app - L'instance de l'application.
     * @param {'connexion'|'inscription'|'reset-password'} mode - Le mode courant du formulaire.
     */
    attachAuthEvents(app, mode) {
        // Sélectionne le bon formulaire selon l'état d'inscription (vérification email en cours ou non)
        const isVerifying = app.state.isVerifyingEmail && mode === 'inscription';
        const activeFormId = isVerifying ? 'auth-code-verification-form' : 'auth-main-form';
        const form = document.getElementById(activeFormId);
        
        if (!form) return;

        // Astuce : Remplacer le formulaire par son clone pour retirer tous les anciens event listeners
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        // Écoute l'auto-validation du composant CodeInput après clonage
        const codeInput = newForm.querySelector('code-input');
        if (codeInput) {
            // Sauvegarde le code dans l'état au fur et à mesure pour ne pas le perdre lors du re-render
            codeInput.addEventListener('input', (e) => {
                app.state.registrationCode = codeInput.value;
            });

            codeInput.addEventListener('complete', () => {
                console.log("⚡ Auto-validating code...");
                const submitBtn = newForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.classList.add('btn-auth-loading');
                }
                // Déclenche l'événement submit sur le nouveau formulaire
                newForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            });
        }

        // Ajout du listener de soumission (Login, Register ou Reset Password)
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("🚀 Auth form submitted. Mode:", mode);

            // Gère la connexion classique
            if (mode === 'connexion') {
                const email = newForm.querySelector('#auth-email')?.value;
                const password = newForm.querySelector('#auth-password')?.value;
                await this.handleLogin(app, email, password);
            } 
            // Gère l'inscription
            else if (mode === 'inscription') {
                if (!app.state.isVerifyingEmail) {
                    const email = newForm.querySelector('#auth-email')?.value;
                    const password = newForm.querySelector('#auth-password')?.value;
                    await this.handleRegistrationStep1(app, newForm, email, password);
                } else {
                    await this.handleRegistrationStep2(app, newForm);
                }
            } 
            // Gère le mot de passe oublié
            else if (mode === 'reset-password') {
                await this.handleResetPassword(app, newForm);
            }
        });
    },

    /**
     * Relance le compte à rebours et renvoie un code de vérification à l'utilisateur.
     * @param {PilatesApp} app
     */
    async resendVerificationCode(app) {
        if (app.state.resendCodeTimer > 0 || !app.state.registrationData?.email) return;
        app.state.resendCodeTimer = 60;
        app.state.resendCodeInterval = setInterval(() => {
            app.state.resendCodeTimer--;
                
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
            
            if (app.state.resendCodeTimer <= 0) {
                clearInterval(app.state.resendCodeInterval);
                app.state.resendCodeInterval = null;
            }
        }, 1000);
        try {
            await this.sendVerificationCode(app, app.state.registrationData.email);
            app.showNotification("Nouveau code envoyé !");
        } catch (err) { app.showNotification("Erreur lors du renvoi.", "error"); }
    },

    /**
     * Annule le processus d'inscription en cours (fermeture de la pop-up de code).
     * @param {PilatesApp} app
     */
    cancelRegistrationVerification(app) {
        app.state.isVerifyingEmail = false;
        clearInterval(app.state.resendCodeInterval);
        app.state.resendCodeTimer = 0;
        app.render();
        app.showNotification("Vérification annulée.", "error");
    }
};
