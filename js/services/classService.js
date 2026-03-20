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
            app.state.paymentMethod = 'credits'; // Toujours par crédits
            app.state.showPaymentModal = true;

            // Vérifier la limite d'abonnement (1 cours par semaine)
            let limitReached = false;
            let isSubscriptionExtra = false;
            const classCost = cls.credits_price || 1;
            if (app.state.currentUser.is_subscribed) {
                const getWeekStart = (dateStr) => {
                    const [y, m, d] = dateStr.split('-');
                    const date = new Date(y, m - 1, d);
                    const day = date.getDay();
                    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                    date.setDate(diff);
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                };
                const targetWeekStart = getWeekStart(cls.date);
                const weeklyCount = app.state.classes.filter(c => 
                    c.bookedUsers.includes(app.state.currentUser.id) && getWeekStart(c.date) === targetWeekStart
                ).length;

                limitReached = weeklyCount >= 1;
                
                if (limitReached && (parseInt(app.state.currentUser.credits_balance) || 0) >= classCost) {
                    isSubscriptionExtra = true;
                }
            }

            if (limitReached && !isSubscriptionExtra) {
                app.state.modalMessage = { type: 'error', isSubscriptionLimit: true };
            } else if (limitReached && isSubscriptionExtra) {
                app.state.modalMessage = { type: 'info', isSubscriptionExtra: true };
            } else if (!app.state.currentUser.is_subscribed && (parseInt(app.state.currentUser.credits_balance) || 0) < classCost) {
                app.state.modalMessage = { type: 'error', isInsufficientCredits: true };
            } else {
                app.state.modalMessage = null;
            }
            app.render();
        }
    },

    // Confirmation de paiement (réservation) par l'utilisateur
    async confirmPayment(app, e) { 
        e.preventDefault();
        const cls = app.state.selectedClassForPayment;
        if (!cls || cls.bookedUsers.length >= cls.capacity) return;

        // Réinitialiser le message d'erreur précédent
        if (app.state.modalMessage?.text) app.state.modalMessage.text = null;

        // Vérification de la case à cocher
        const confirmCheck = document.getElementById('confirm-credits');
        if (confirmCheck && !confirmCheck.checked) {
            app.state.modalMessage = { ...app.state.modalMessage, type: 'error', text: "Veuillez cocher la case pour confirmer l'utilisation d'un cours." };
            return app.render();
        }

        // Paiement par crédits
        try {
            const res = await fetch(`${API_URL}/classes/book-credits/${cls.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: app.state.currentUser.id })
            });

            if (!res.ok) {
                // Si la réponse n'est pas OK (ex: 400, 500), on essaie de parser le message d'erreur
                const errorData = await res.json().catch(() => ({ message: `Erreur serveur (${res.status})` }));
                console.error("[classService] La réservation a échoué avec le statut:", res.status, "Message:", errorData.message);
                app.state.modalMessage = { type: 'error', text: errorData.message || `Erreur lors de la réservation (Code: ${res.status})` };
                app.render();
                return;
            }

            // Si la réponse est OK, on parse le JSON
            const data = await res.json().catch(async (jsonErr) => {
                console.error("[classService] Erreur de parsing JSON après une réponse réussie:", jsonErr);
                const rawText = await res.text();
                console.error("[classService] Texte brut de la réponse:", rawText);
                throw new Error("Erreur de format de réponse du serveur."); // On relance l'erreur pour qu'elle soit capturée par le catch externe
            });

            if (data && data.success) { // Vérifier l'existence de data et de la propriété success
                if (data.user) {
                    app.state.currentUser = data.user;
                    localStorage.setItem('pilates_user', JSON.stringify(data.user)); // Mettre à jour le local storage
                }
                app.showNotification("Réservation confirmée !");
                app.openCalendarModal(cls); // Ouvre le modal d'ajout au calendrier
                app.state.showPaymentModal = false;
                app.state.selectedClassForPayment = null;
                app.render();
            } else {
                console.error("[classService] Le backend a signalé un échec (data.success est false):", data.message);
                app.state.modalMessage = { type: 'error', text: data.message };
                if (data.message === 'Solde de cours insuffisant' || data.message === 'Solde de crédits insuffisant') {
                    app.state.modalMessage.isInsufficientCredits = true;
                }
                app.render();
            }
        } catch (err) { 
            console.error("[classService] Erreur générale pendant le processus de réservation:", err);
            app.state.modalMessage = { type: 'error', text: err.message || "Erreur lors de la réservation" };
            app.render();
        }
    },

    cancelPayment(app) {
        app.state.showPaymentModal = false;
        app.state.selectedClassForPayment = null;
        app.render();
    },

    // Annulation par le client (Profil)
    async cancelBookingByUser(app, classId) { // Renommée pour éviter la confusion avec l'annulation admin
        const confirmed = await app.confirmDialog("Confirmer l'annulation de ce cours ?");
        if (!confirmed) return;
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
        const cls = app.state.classes.find(c => c.id === id);
        if (!cls) return;

        if (cls.recurrence_id) {
            const deleteAll = await app.confirmDialog(
                "Cette séance fait partie d'une série récurrente.\n\nVoulez-vous supprimer TOUTE LA SÉRIE ou UNIQUEMENT CETTE SÉANCE ?",
                { confirmText: 'Toute la série', cancelText: 'Uniquement cette séance' }
            );
            
            if (deleteAll) {
                const confirmAll = await app.confirmDialog("Confirmez-vous la suppression de TOUTES les séances de cette série ?", { type: 'danger' });
                if (confirmAll) {
                    await fetch(`${API_URL}/classes/series/${cls.recurrence_id}`, { method: 'DELETE' });
                    app.showNotification("La série de cours a été supprimée.");
                    app.init();
                }
                return;
            }
        }

        const confirmSingle = await app.confirmDialog(cls.recurrence_id ? "Supprimer uniquement cette séance ?" : "Voulez-vous vraiment supprimer ce cours ?", { type: 'danger' });
        if (confirmSingle) {
            await fetch(`${API_URL}/classes/${id}`, { method: 'DELETE' });
            app.showNotification("Séance supprimée.");
            app.init();
        }
    },

    async adminBulkDeleteClasses(app) {
        const ids = app.state.selectedAdminClasses;
        if (!ids || ids.length === 0) return;
        
        const confirmed = await app.confirmDialog(`Voulez-vous vraiment supprimer ces ${ids.length} séances sélectionnées ?`, { type: 'danger', confirmText: 'Supprimer' });
        if (confirmed) {
            try {
                const res = await fetch(`${API_URL}/classes/bulk`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids })
                });
                const data = await res.json();
                if (data.success) {
                    app.showNotification(data.message || (ids.length > 1 ? `${ids.length} séances supprimées.` : "Séance supprimée.")); // Show success notification
                    app.state.selectedAdminClasses = [];
                    await app.init();
                } else {
                    app.showNotification(data.message || data.error || "Erreur lors de la suppression.", "error");
                }
            } catch (err) {
                console.error(err);
                app.showNotification("Erreur réseau lors de la suppression groupée.", "error");
            }
        }
    },

    async submitAddClass(app, e) {
        e.preventDefault();
        const form = app.state.adminAddClassForm;
        const title = form.title;
        const startDateStr = form.date;
        const time = form.time;

        if (!title) return app.showNotification("Veuillez choisir un modèle de cours.", "error");
        if (!startDateStr || !time) return app.showNotification("Veuillez saisir une date et une heure.", "error");

        const isRecurring = document.getElementById('planning-is-recurring').checked;
        const recurrenceType = form.recurrenceType;
        const endDateStr = form.recurrenceEnd;

        if (isRecurring && !endDateStr) {
            return app.showNotification("Veuillez saisir une date de fin pour la récurrence.", "error");
        }

        const baseClass = {
            title: title,
            description: form.description,
            time: time,
            duration: parseInt(form.duration) || 0,
            capacity: parseInt(form.capacity) || 10,
            credits_price: 1, // Fixé à 1 pour la base de données
            bookedUsers: []
        };

        const recurrenceId = isRecurring ? `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` : null;

        const datesToCreate = [startDateStr];

        if (isRecurring && endDateStr) {
            const start = new Date(startDateStr);
            const end = new Date(endDateStr);
            let current = new Date(start);

            while (true) {
                if (recurrenceType === 'daily') current.setDate(current.getDate() + 1);
                else if (recurrenceType === 'weekly') current.setDate(current.getDate() + 7);
                else if (recurrenceType === 'monthly') current.setMonth(current.getMonth() + 1);
                else if (recurrenceType === 'yearly') current.setFullYear(current.getFullYear() + 1);

                if (current > end) break;
                
                const y = current.getFullYear();
                const m = String(current.getMonth() + 1).padStart(2, '0');
                const d = String(current.getDate()).padStart(2, '0');
                datesToCreate.push(`${y}-${m}-${d}`);
            }
        }

        if (datesToCreate.length > 50) {
            const confirmed = await app.confirmDialog(`Vous allez créer ${datesToCreate.length} séances.\n\nÊtes-vous sûr de vouloir continuer ?`);
            if (!confirmed) return;
        }

        try {
            for (const date of datesToCreate) {
                await fetch(`${API_URL}/classes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...baseClass, date, recurrence_id: recurrenceId })
                });
            }
            app.showNotification(datesToCreate.length > 1 ? `${datesToCreate.length} séances ajoutées.` : "Séance ajoutée.");
            app.state.isAdminRecurring = false; // Réinitialiser après succès
        } catch (err) {
            app.showNotification("Erreur lors de la création.", "error");
        }

        app.init();
    },

    applyTemplate(app) {
        const templateId = document.getElementById('planning-template-select').value;
        if (!templateId) return;
        const t = app.state.courseTemplates.find(x => x.id == templateId); // Utilisation de == pour la comparaison
        if (!t) return;
        app.state.adminAddClassForm.title = t.title;
        app.state.adminAddClassForm.description = t.description;
        app.state.adminAddClassForm.duration = t.duration;
        app.render(); // Re-render pour mettre à jour les champs du formulaire
    },

    editTemplate(app, id) {
        app.state.editingTemplateId = id;
        app.render();
    },

    cancelEditTemplate(app) {
        app.state.editingTemplateId = null;
        app.render();
    },

    async deleteTemplate(app, id) {
        const confirmed = await app.confirmDialog("Voulez-vous vraiment supprimer ce modèle ?\n\nTous les cours planifiés avec ce nom seront également supprimés.", { type: 'danger', confirmText: 'Supprimer' });
        if (!confirmed) return;
        
        const res = await fetch(`${API_URL}/course-templates/${id}`, { method: 'DELETE' });
        if (res.ok) app.showNotification("Modèle et cours associés supprimés.");
        app.init();
    },

    async saveAsTemplate(app) {
        const template = {
            title: document.getElementById('template-title').value,
            description: document.getElementById('template-desc').value,
            duration: parseInt(document.getElementById('template-duration').value) || 0,
            default_credits_price: 1
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
    },

    // Annulation par l'administrateur (depuis le détail client)
    async adminCancelBookingForUser(app, classId, targetUserId) {
        const confirmed = await app.confirmDialog("Voulez-vous vraiment annuler cette réservation pour ce client ?\n\nS'il n'est pas abonné, son cours lui sera recrédité.", { type: 'danger' });
        if (!confirmed) return;
        try {
            const res = await fetch(`${API_URL}/classes/cancel/${classId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: targetUserId }) // Utilise l'ID de l'utilisateur cible
            });
            const data = await res.json();
            if (data.success) {
                app.showNotification("Réservation annulée avec succès.");
                // Re-charger les détails du client pour mettre à jour la liste des réservations et le solde de crédits
                await app.viewUser(targetUserId); 
            } else {
                app.showNotification(data.message, 'error');
            }
        } catch (err) {
            console.error("Erreur lors de l'annulation admin:", err);
            app.showNotification("Erreur technique lors de l'annulation.", "error");
        }
    },
};