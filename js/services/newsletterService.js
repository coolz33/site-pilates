/**
 * @file newsletterService.js
 * @description Service gérant l'envoi des newsletters et la gestion des listes.
 */

import { API_URL } from '../api.js';

export const newsletterService = {
    /**
     * Envoie la newsletter via l'API SMTP.
     */
    async sendNewsletter(app, e) {
        e.preventDefault();
        const subject = document.getElementById('nl-subject').value;
        
        // Synchronisation du contenu selon le mode actuel
        if (app.state.isHtmlView) {
            app.state.newsletterContent = document.getElementById('nl-html-area').value;
        } else if (app.state.quill) {
            app.state.newsletterContent = app.state.quill.root.innerHTML;
        }

        const message = app.state.newsletterContent;
        const recipientIds = app.state.selectedNewsletterRecipients;

        if (recipientIds.length === 0) return app.showNotification("Aucun destinataire sélectionné.", 'error');
        if (!subject || !message || message === '<p><br></p>') {
            return app.showNotification("Veuillez remplir tous les champs.", 'error');
        }

        try {
            const res = await fetch(`${API_URL}/newsletter/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, message, recipientIds })
            });
            const data = await res.json();
            if (data.success) {
                app.showNotification(`Newsletter envoyée avec succès !`);
                document.getElementById('nl-subject').value = '';
                app.state.newsletterContent = '';
                app.state.isHtmlView = false;
                if (app.state.quill) app.state.quill.setContents([]);
                app.render();
            } else {
                app.showNotification(data.message || "Erreur lors de l'envoi", 'error');
            }
        } catch (err) {
            app.showNotification("Erreur réseau lors de l'envoi", 'error');
        }
    },

    /** Ajoute ou retire un utilisateur de la liste d'envoi temporaire */
    toggleNewsletterRecipient(app, userId) {
        const index = app.state.selectedNewsletterRecipients.indexOf(userId);
        if (index > -1) {
            app.state.selectedNewsletterRecipients.splice(index, 1);
        } else {
            app.state.selectedNewsletterRecipients.push(userId);
        }
        app.render();
    }
};
