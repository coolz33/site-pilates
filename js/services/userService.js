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

        if (app.state.currentUser.is_subscribed) {
            let msg = "Vous êtes déjà abonné(e).\n\nVoulez-vous vraiment acheter des cours supplémentaires ?";
            let confirmText = 'Oui, acheter';
            if (pkg.is_subscription) {
                const days = pkg.expires_in_days || 365;
                let durationStr = `${days} jours`;
                if (days === 365) durationStr = '1 an';
                else if (days >= 28 && days <= 31) durationStr = '1 mois';
                else if (days % 30 === 0) durationStr = `${days / 30} mois`;
                else if (days % 365 === 0) durationStr = `${days / 365} ans`;
                
                msg = `Vous êtes déjà abonné(e).\n\nL'achat de cet abonnement prolongera votre accès de ${durationStr} supplémentaires, à partir de votre date d'expiration actuelle.\n\nVoulez-vous continuer ?`;
                confirmText = 'Oui, prolonger';
            }
            const confirmed = await app.confirmDialog(msg, { type: 'info', confirmText: confirmText });
            if (!confirmed) return;
        }

        // Ouvrir le popup immédiatement
        const width = 600;
        const height = 800;
        const left = (window.innerWidth / 2) - (width / 2);
        const top = (window.innerHeight / 2) - (height / 2);
        
        // On utilise '_blank' au lieu d'un nom fixe pour éviter les conflits de sécurité cross-origin
        const popup = window.open('', '_blank', `width=${width},height=${height},top=${top},left=${left}`);
        
        if (popup) popup.focus();

        console.log("[CHECKOUT] Tentative d'achat pour:", app.state.currentUser.email, "userId:", app.state.currentUser.id);

        try {
            const res = await fetch(`${API_URL}/checkout/create-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    packageId: pkg.id, 
                    userId: app.state.currentUser.id,
                    email: app.state.currentUser.email
                })
            });
            const data = await res.json();
            if (data.url && popup) {
                popup.location.href = data.url;
            } else {
                if (popup) popup.close();
                app.showNotification(data.message || data.error || "Erreur lors de l'initialisation du paiement", "error");
            }
        } catch (err) {
            if (popup && !popup.closed) popup.close();
            app.showNotification("Erreur de connexion au service de paiement", "error");
        }
    },

    async updateStudioSettings(app, e) {
        e.preventDefault();
        const settings = {
            studioAddress: document.getElementById('admin-studio-address').value,
            studioPhone: document.getElementById('admin-studio-phone').value,
            studioEmail: document.getElementById('admin-studio-email').value,
            studioSiret: document.getElementById('admin-studio-siret').value,
            studioTva: document.getElementById('admin-studio-tva').value,
            aiProvider: document.getElementById('admin-ai-provider').value,
            instagramUrl: document.getElementById('admin-studio-instagram').value,
            facebookUrl: document.getElementById('admin-studio-facebook').value,
            tiktokUrl: document.getElementById('admin-studio-tiktok').value,
            cancellationDelay: app.state.cancellationDelay
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

    async updateAllPackages(app, e) {
        e.preventDefault();
        const packages = [];
        const packageBlocks = e.target.querySelectorAll('.package-block');
        
        packageBlocks.forEach(block => {
            const id = parseInt(block.querySelector('[name="id"]').value);
            const name = block.querySelector('[name="name"]').value;
            const subtitle = block.querySelector('[name="subtitle"]').value;
            const price = parseInt(block.querySelector('[name="price"]').value);
            const description = block.querySelector('[name="description"]').value;
            const is_subscription = block.querySelector('[name="is_subscription"]').checked ? 1 : 0;
            
            let credits, expires_in_days;
            if (is_subscription) {
                credits = 0;
                expires_in_days = parseInt(block.querySelector('[name="duration_days"]').value) || 365;
            } else {
                credits = parseInt(block.querySelector('[name="credits"]').value) || 1;
                expires_in_days = parseInt(block.querySelector('[name="expires_in_days"]').value) || 0;
            }
            
            packages.push({
                id, name, subtitle, description, credits, price, expires_in_days, is_subscription
            });
        });
        
        await fetch(`${API_URL}/credit-packages/bulk`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packages })
        });
        app.showNotification('Tous les tarifs ont été mis à jour.');
        app.init();
    },

    async createPackage(app, e) {
        e.preventDefault();
        const block = e.target;
        const name = block.querySelector('[name="name"]').value;
        const subtitle = block.querySelector('[name="subtitle"]').value;
        const price = parseInt(block.querySelector('[name="price"]').value);
        const description = block.querySelector('[name="description"]').value;
        const is_subscription = block.querySelector('[name="is_subscription"]').checked ? 1 : 0;
        
        let credits, expires_in_days;
        if (is_subscription) {
            credits = 0;
            expires_in_days = parseInt(block.querySelector('[name="duration_days"]').value) || 365;
        } else {
            credits = parseInt(block.querySelector('[name="credits"]').value) || 1;
            expires_in_days = parseInt(block.querySelector('[name="expires_in_days"]').value) || 0;
        }
        
        const pkg = {
            name, subtitle, description, credits, price, expires_in_days, is_subscription
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

    async viewUser(app, userId) {
        try {
            app.state.isAdminAiLoading = true;
            app.state.adminUserQuill = null;
            app.state.adminUserMessageContent = '';
            app.render();
            const details = await this.getUserDetails(app, userId);
            app.state.userPaymentFilters = { startDate: '', endDate: '' };
            app.state.userPaymentPagination = { page: 1, limit: 10 };
            app.state.userCreditFilters = { startDate: '', endDate: '' };
            app.state.userCreditPagination = { page: 1, limit: 10 };
            if (details.message || details.error) throw new Error(details.message || details.error);
            app.state.selectedUserDetails = details;
            app.state.adminTab = 'user_details';
        } catch (err) {
            app.showNotification("Impossible de charger les détails.", "error");
        } finally {
            app.state.isAdminAiLoading = false;
            app.render();
        }
    },

    async deleteAccount(app, userId, isAdmin = false) {
        const msg1 = isAdmin ? "Voulez-vous vraiment supprimer ce compte client ?" : "Êtes-vous sûr de vouloir supprimer votre compte ?";
        const confirmed1 = await app.confirmDialog(msg1 + "\n\nCette action est irréversible.", { type: 'danger', confirmText: 'Supprimer' });
        if (!confirmed1) return;
        
        const confirmed2 = await app.confirmDialog("DERNIER AVERTISSEMENT : Toutes les données (cours, réservations, historique) seront définitivement effacées du serveur.\n\nConfirmer la suppression ?", { type: 'danger', confirmText: 'Supprimer définitivement' });
        if (!confirmed2) return;

        try {
            const res = await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
            if (res.ok) {
                app.showNotification("Le compte a été supprimé définitivement.");
                if (!isAdmin) app.logout();
                else {
                    app.state.selectedUserDetails = null;
                    app.state.adminTab = 'users';
                    app.init();
                }
            }
        } catch (err) { app.showNotification("Erreur lors de la suppression.", "error"); }
    },

    async adjustUserCredits(app, e, userId) {
        e.preventDefault();
        const isSubscription = e.target.isSubscription.checked;
        const amount = isSubscription ? 0 : parseInt(e.target.amount.value || 0);
        const transactionType = e.target.transactionType.value;
        const paymentMethod = e.target.paymentMethod ? e.target.paymentMethod.value : null;
        const price = e.target.price ? parseInt(e.target.price.value) : 0;
        let expires_in_days = 0;

        if (e.target.expires_in_value) {
            const expires_value = parseInt(e.target.expires_in_value.value || 0);
            const expires_unit = e.target.expires_in_unit.value || 'days';
            
            if (expires_value > 0) {
                const now = new Date();
                const future = new Date(now);
                if (expires_unit === 'days') future.setDate(future.getDate() + expires_value);
                else if (expires_unit === 'months') future.setMonth(future.getMonth() + expires_value);
                else if (expires_unit === 'years') future.setFullYear(future.getFullYear() + expires_value);
                
                expires_in_days = Math.ceil((future - now) / (1000 * 60 * 60 * 24));
            }
        }

        const res = await fetch(`${API_URL}/users/${userId}/batches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, expires_in_days, transactionType, paymentMethod, price, isSubscription })
        });

        if (res.ok) {
            app.showNotification(isSubscription ? 'Abonnement activé avec succès !' : 'Cours ajoutés avec succès !', 'success', e);
            app.viewUser(userId); // Rafraîchir la vue
        } else {
            app.showNotification(isSubscription ? "Erreur lors de l'activation." : "Erreur lors de l'ajout des cours.", "error", e);
        }
    },

    async promptRemoveSpecificCredits(app, userId, maxCredits, batchIds) {
        const amountStr = window.prompt(`Combien de cours voulez-vous retirer de ce lot ? (Maximum : ${maxCredits})`, "1");
        if (!amountStr) return;
        const amount = parseInt(amountStr);
        if (isNaN(amount) || amount <= 0 || amount > maxCredits) {
            return app.showNotification("Quantité invalide.", "error");
        }
        await fetch(`${API_URL}/users/${userId}/remove-batch-credits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, batchIds })
        });
        app.showNotification('Cours retirés avec succès.');
        app.viewUser(userId);
    },

    async removeSpecificCredits(app, userId, amount, batchIds) {
        const confirmed = await app.confirmDialog("Voulez-vous vraiment supprimer tout ce lot de cours ?", { type: 'danger' });
        if (!confirmed) return;

        await fetch(`${API_URL}/users/${userId}/remove-batch-credits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, batchIds })
        });
        app.showNotification('Lot de cours supprimé.');
        app.viewUser(userId); // Rafraîchir la vue
    },

    async toggleUserRole(app, userId, currentRole) {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const confirmMsg = newRole === 'admin' 
            ? "Voulez-vous nommer cet utilisateur administrateur ? Il aura accès à tout le panneau de gestion." 
            : "Voulez-vous retirer les droits d'administration de cet utilisateur ?";
        
        const confirmed = await app.confirmDialog(confirmMsg);
        if (!confirmed) return;

        await fetch(`${API_URL}/users/${userId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
        });
        
        app.showNotification(newRole === 'admin' ? "Utilisateur nommé administrateur." : "Droits d'administration retirés.");
        const resUsers = await fetch(`${API_URL}/users`);
        app.state.users = await resUsers.json() || [];
        await app.viewUser(userId);
    },

    async toggleSubscription(app, e, userId, currentStatus) {
        const newStatus = currentStatus ? 0 : 1;
        const confirmMsg = newStatus 
            ? "Activer l'abonnement pour cet utilisateur (limite d'1 cours par semaine) ?" 
            : "Désactiver l'abonnement pour cet utilisateur ?";
        
        const confirmed = await app.confirmDialog(confirmMsg);
        if (!confirmed) return;

        await fetch(`${API_URL}/users/${userId}/subscription`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_subscribed: newStatus })
        });
        
        app.showNotification(newStatus ? "Abonnement activé." : "Abonnement désactivé.", "success", e);
        app.viewUser(userId);
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