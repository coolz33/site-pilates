import { API_URL } from '../api.js';

export const classService = {
    changeWeek(app, offset) {
        const newDate = new Date(app.state.currentDate);
        newDate.setDate(newDate.getDate() + (offset * 7));
        app.state.currentDate = newDate;
        app.render();
    },

    jumpToDate(app, dateString) {
        if (!dateString) return;
        const [year, month, day] = dateString.split('-').map(Number);
        app.state.currentDate = new Date(year, month - 1, day);
        app.render();
    },

    initiateBooking(app, classId) {
        if (!app.state.currentUser) {
            app.navigate('connexion');
            return;
        }
        const cls = app.state.classes.find(c => c.id === classId);

        const classDate = new Date(`${cls.date}T${cls.time}`);
        if (classDate < new Date()) {
            return app.showNotification("Ce cours est déjà passé.", "error");
        }

        const isBooked = cls.bookedUsers.includes(app.state.currentUser.id);

        if (isBooked) {
            app.showNotification("Vous êtes déjà inscrit. Gérez vos réservations depuis votre profil.", "info");
            app.navigate('profil');
        } else if (cls.bookedUsers.length < cls.capacity) {
            app.state.selectedClassForPayment = cls;
            app.state.paymentMethod = 'card';
            app.state.showPaymentModal = true;
            app.state.modalMessage = null;
            app.render();
        }
    },

    async confirmPayment(app, e) {
        e.preventDefault();
        const cls = app.state.selectedClassForPayment;
        if (!cls || cls.bookedUsers.length >= cls.capacity) return;

        // Réinitialiser le message d'erreur précédent
        app.state.modalMessage = null;

        if (app.state.paymentMethod === 'card') {
            // 1. Ouvrir le popup immédiatement pour éviter le blocage par le navigateur
            const width = 600;
            const height = 800;
            const left = (window.innerWidth / 2) - (width / 2);
            const top = (window.innerHeight / 2) - (height / 2);
            const popup = window.open('', 'Paiement Stripe', `width=${width},height=${height},top=${top},left=${left}`);
            
            if (popup) {
                popup.document.write(`<html><head><title>Paiement</title><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;background:#f5f5f4;color:#444;}</style></head><body><div style="text-align:center"><h3>Connexion à Stripe...</h3><p>Veuillez patienter.</p></div></body></html>`);
            } else {
                return app.showNotification("Le navigateur a bloqué la fenêtre de paiement.", "error");
            }

            try {
                const res = await fetch(`${API_URL}/checkout/create-session-class`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        classId: cls.id, 
                        userId: app.state.currentUser.id 
                    })
                });
                const data = await res.json();
                if (data.url) {
                    // 2. Rediriger le popup vers l'URL Stripe reçue
                    popup.location.href = data.url;
                    app.state.showPaymentModal = false;
                    app.state.selectedClassForPayment = null;
                    app.render();
                } else {
                    popup.close(); // Fermer le popup si erreur serveur
                    app.showNotification(data.message || data.error || "Erreur lors de l'initialisation du paiement", "error");
                }
            } catch (err) {
                if (popup) popup.close();
                app.showNotification("Erreur de connexion au service de paiement", "error");
            }
        } else {
            // Vérification de la case à cocher
            const confirmCheck = document.getElementById('confirm-credits');
            if (!confirmCheck || !confirmCheck.checked) {
                app.state.modalMessage = { type: 'error', text: "Veuillez cocher la case pour confirmer l'utilisation de vos crédits." };
                return app.render();
            }

            // Paiement par crédits (la confirmation est implicite via le bouton du modal)
            try {
                const res = await fetch(`${API_URL}/classes/book-credits/${cls.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: app.state.currentUser.id })
                });
                const data = await res.json();
                if (data.success) {
                    if (data.user) app.state.currentUser = data.user;
                    app.showNotification("Réservation confirmée !");
                    app.state.showPaymentModal = false;
                    app.state.selectedClassForPayment = null;
                    app.init();
                } else {
                    app.state.modalMessage = { type: 'error', text: data.message };
                    if (data.message === 'Solde de crédits insuffisant') {
                        app.state.modalMessage.isInsufficientCredits = true;
                    }
                    app.render();
                }
            } catch (err) { 
                app.state.modalMessage = { type: 'error', text: "Erreur lors de la réservation" };
                app.render();
            }
        }
    },

    cancelPayment(app) {
        app.state.showPaymentModal = false;
        app.state.selectedClassForPayment = null;
        app.render();
    },

    // Annulation par le client (Profil)
    async cancelBooking(app, classId) {
        if (!confirm("Confirmer l'annulation de ce cours ?")) return;
        const res = await fetch(`${API_URL}/classes/cancel/${classId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: app.state.currentUser.id })
        });
        const data = await res.json();
        if (data.success) {
            app.showNotification("Réservation annulée.");
            app.init(); // Rafraîchir pour mettre à jour le solde et le planning
        } else {
            app.showNotification(data.message, 'error');
        }
    },

    // Suppression par l'admin (Planning)
    async adminDeleteClass(app, id) {
        if (confirm("Voulez-vous vraiment supprimer ce cours ?")) {
            await fetch(`${API_URL}/classes/${id}`, { method: 'DELETE' });
            app.init();
        }
    },

    async submitAddClass(app, e) {
        e.preventDefault();
        const title = document.getElementById('planning-title').value;
        const date = document.getElementById('planning-date').value;
        const time = document.getElementById('planning-time').value;

        if (!title) return app.showNotification("Veuillez choisir un modèle de cours.", "error");
        if (!date || !time) return app.showNotification("Veuillez saisir une date et une heure.", "error");

        const newClass = {
            title: title,
            description: document.getElementById('planning-desc').value,
            date: date,
            time: time,
            duration: parseInt(document.getElementById('planning-duration').value) || 0,
            capacity: parseInt(document.getElementById('planning-capacity').value) || 10,
            price: parseInt(document.getElementById('planning-price').value) || 0,
            credits_price: parseInt(document.getElementById('planning-credits-price').value) || 1,
            bookedUsers: []
        };
        await fetch(`${API_URL}/classes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClass)
        });
        app.showNotification("Séance ajoutée.");
        app.init();
    },

    applyTemplate(app) {
        const templateId = document.getElementById('planning-template-select').value;
        if (!templateId) return;
        const t = app.state.courseTemplates.find(x => x.id == templateId);
        if (!t) return;
        document.getElementById('planning-title').value = t.title;
        document.getElementById('planning-desc').value = t.description;
        document.getElementById('planning-duration').value = t.duration;
        document.getElementById('planning-price').value = t.default_price;
        document.getElementById('planning-credits-price').value = t.default_credits_price || 1;
    },

    editTemplate(app, id) {
        app.state.editingTemplateId = id;
        app.render();
    },

    cancelEditTemplate(app) {
        app.state.editingTemplateId = null;
        app.render();
    },

    async saveAsTemplate(app) {
        const template = {
            title: document.getElementById('template-title').value,
            description: document.getElementById('template-desc').value,
            duration: parseInt(document.getElementById('template-duration').value) || 0,
            default_price: parseInt(document.getElementById('template-price').value) || 0,
            default_credits_price: parseInt(document.getElementById('template-credits-price').value) || 1
        };

        const id = app.state.editingTemplateId;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/course-templates/${id}` : `${API_URL}/course-templates`;

        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template)
        });

        app.showNotification(id ? "Modèle mis à jour !" : "Modèle sauvegardé !");
        app.state.editingTemplateId = null;
        await app.init();
    }
};