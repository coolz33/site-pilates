/**
 * @file app.js
 * @description Moteur principal de l'application Pilates.
 * Gère l'état (State), le rendu (Rendering), les appels API et l'IA.
 */

import { API_URL } from './js/api.js';
import { authService } from './js/services/authService.js';
import { classService } from './js/services/classService.js';
import { aiService } from './js/services/aiService.js';
import { userService } from './js/services/userService.js';
import { newsletterService } from './js/services/newsletterService.js';
import { homeView } from './js/views/home.js';
import { aboutView } from './js/views/about.js';
import { profileView } from './js/views/profile.js';
import { creditsView } from './js/views/credits.js';
import { contactView } from './js/views/contact.js';
import { authView } from './js/views/auth.js';
import { scheduleView } from './js/views/schedule.js';
import { adminView } from './js/views/admin.js';
import { renderNavbar, renderFooter, renderPaymentModal } from './js/views/components.js';

/**
 * Classe PilatesApp
 * Architecture de type "Single Page Application" (SPA) en Vanilla JS.
 */
class PilatesApp {
    constructor() {
        /** 
         * @type {Object} État global de l'application.
         */
        this.state = {
            view: 'accueil',
            isMenuOpen: false,
            users: [],
            currentUser: null,
            classes: [],
            currentDate: new Date(),
            aiResponse: '',
            isAiLoading: false,
            isAdminAiLoading: false,
            showPaymentModal: false,
            adminTab: 'planning',
            paymentMethod: 'card',
            selectedClassForPayment: null,
            modalMessage: null,
            editingTemplateId: null,
            notification: { message: '', type: 'success', visible: false },
            courseTemplates: [],
            creditPackages: [],
            studioAddress: '',
            studioPhone: '',
            studioEmail: '',
            cancellationDelay: 24,
            quill: null,
            newsletterContent: '',
            isHtmlView: false,
            selectedNewsletterRecipients: []
        };
    }

    /**
     * Initialise l'application au chargement de la page.
     * Récupère la session utilisateur et les données depuis l'API.
     */
    async init() {
        try {
            // Gestion de la fermeture du popup de paiement Stripe
            if (window.opener && window.location.hash.includes('payment=')) {
                // On met à jour l'URL de la fenêtre principale pour déclencher la notification
                window.opener.location.href = window.location.href;
                // On recharge la fenêtre principale pour récupérer les nouvelles données (réservation/crédits)
                window.opener.location.reload();
                // On ferme le popup
                window.close();
                return; // On arrête l'exécution du script dans le popup
            }

            // Gestion du routage via le hash de l'URL (ex: #schedule)
            const handleHashRoute = () => {
                const hash = window.location.hash.replace('#', '');
                const [view, queryString] = hash.split('?');
                const params = new URLSearchParams(queryString);

                if (params.get('desabonne') === 'success') {
                    this.showNotification("Vous avez été désabonné de la newsletter avec succès.");
                }
                if (params.get('payment') === 'success') {
                    const msg = params.get('type') === 'booking' ? "Paiement réussi ! Votre réservation est confirmée." : "Paiement réussi ! Vos crédits ont été ajoutés.";
                    this.showNotification(msg);
                }
                if (params.get('payment') === 'cancel') {
                    this.showNotification("Paiement annulé.", "error");
                }

                this.state.view = view || 'accueil';
                this.state.isMenuOpen = false;
                this.state.aiResponse = '';
                window.scrollTo(0, 0);
                this.render();
            };

            // Écouter les changements d'URL (boutons précédent/suivant du navigateur ou liens)
            window.addEventListener('hashchange', handleHashRoute);
            
            // Définir la vue initiale selon l'URL actuelle au chargement de la page
            const hash = window.location.hash.replace('#', '');
            const [initialView, queryString] = hash.split('?');
            const params = new URLSearchParams(queryString);

            if (params.get('desabonne') === 'success') {
                this.showNotification("Vous avez été désabonné de la newsletter avec succès.");
            }
            if (params.get('payment') === 'success') {
                const msg = params.get('type') === 'booking' ? "Paiement réussi ! Votre réservation est confirmée." : "Paiement réussi ! Vos crédits ont été ajoutés.";
                this.showNotification(msg);
            }
            if (params.get('payment') === 'cancel') {
                this.showNotification("Paiement annulé.", "error");
            }

            this.state.view = initialView || 'accueil';

            const savedUser = localStorage.getItem('pilates_user');
            if (savedUser) {
                this.state.currentUser = JSON.parse(savedUser);
                // Rafraîchir les données depuis le serveur pour avoir les crédits à jour
                try {
                    const resUser = await fetch(`${API_URL}/users/${this.state.currentUser.id}`);
                    if (resUser.ok) {
                        const freshUser = await resUser.json();
                        this.state.currentUser = freshUser;
                        localStorage.setItem('pilates_user', JSON.stringify(freshUser));
                    }
                } catch (e) {
                    console.warn("Impossible de rafraîchir les données utilisateur", e);
                }
            }
            
            const resSettings = await fetch(`${API_URL}/settings`);
            const settings = await resSettings.json();
            this.state.studioAddress = settings.studioAddress;
            this.state.studioPhone = settings.studioPhone;
            this.state.studioEmail = settings.studioEmail;
            this.state.cancellationDelay = settings.cancellationDelay || 24;

            const resClasses = await fetch(`${API_URL}/classes`);
            this.state.classes = await resClasses.json() || [];

            const resTemplates = await fetch(`${API_URL}/course-templates`);
            this.state.courseTemplates = await resTemplates.json() || [];

            const resPackages = await fetch(`${API_URL}/credit-packages`);
            this.state.creditPackages = await resPackages.json() || [];

            if (this.state.currentUser && this.state.currentUser.role === 'admin') {
                const resUsers = await fetch(`${API_URL}/users`);
                this.state.users = await resUsers.json() || [];
            }

            this.render();
        } catch (err) {
            console.error("Erreur d'initialisation:", err);
        }
    }

    /**
     * Change la vue active et réinitialise certains états.
     * @param {string} view - L'identifiant de la vue (ex: 'home', 'schedule').
     */
    navigate(view) {
        if (window.location.hash === `#${view}`) {
            // Si on est déjà sur la vue, on force la fermeture du menu et le scroll en haut
            this.state.isMenuOpen = false;
            window.scrollTo(0, 0);
            this.render();
        } else {
            // Changer le hash déclenchera automatiquement l'événement 'hashchange'
            window.location.hash = view;
        }
    }

    /**
     * Change l'onglet admin et initialise la liste des destinataires si newsletter.
     */
    setAdminTab(tab) {
        this.state.adminTab = tab;
        if (tab === 'newsletter') {
            // Par défaut, on sélectionne ceux qui ont coché la case
            this.state.selectedNewsletterRecipients = this.state.users
                .filter(u => Number(u.newsletter_subscribed) === 1 && u.role !== 'admin')
                .map(u => u.id);
        }
        this.render();
    }

    /** 
     * Ouvre ou ferme le menu de navigation sur mobile.
     */
    toggleMenu() {
        this.state.isMenuOpen = !this.state.isMenuOpen;
        this.render();
    }

    /**
     * Affiche un message d'information ou d'erreur à l'utilisateur.
     * @param {string} message - Texte à afficher.
     * @param {string} [type='success'] - Type de notification ('success' ou 'error').
     */
    showNotification(message, type = 'success') {
        this.state.notification = { message, type, visible: true };
        this.render();
        
        setTimeout(() => {
            this.state.notification.visible = false;
            this.render();
        }, 3000);
    }

    /** @section Helpers de validation */
    validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
    validatePhone(phone) { return /^(\+33|0)[1-9][0-9]{8}$/.test(phone.replace(/\s/g, '')); }
    validatePassword(pwd) { return pwd.length >= 5; }

    logout() { authService.logout(this); }
    changeWeek(offset) { classService.changeWeek(this, offset); }
    jumpToDate(dateString) { classService.jumpToDate(this, dateString); }
    initiateBooking(classId) { classService.initiateBooking(this, classId); }
    async confirmPayment(e) { await classService.confirmPayment(this, e); }
    cancelPayment() { classService.cancelPayment(this); }
    async sendNewsletter(e) { await newsletterService.sendNewsletter(this, e); }
    toggleNewsletterRecipient(userId) { newsletterService.toggleNewsletterRecipient(this, userId); }
    toggleHtmlView() { newsletterService.toggleHtmlView(this); }
    async updateProfile(e) { await userService.updateProfile(this, e); }
    async buyCredits(pkg) { await userService.buyCredits(this, pkg); }
    async updateStudioSettings(e) { await userService.updateStudioSettings(this, e); }
    async updateCancellationDelay(e) { await userService.updateCancellationDelay(this, e); }
    async updatePackage(e, id) { await userService.updatePackage(this, e, id); }
    async createPackage(e) { await userService.createPackage(this, e); }
    async askAi() { await aiService.askAi(this); }
    async deleteClass(id) { await classService.cancelBooking(this, id); } // Pour le profil utilisateur
    async adminDeleteClass(id) { await classService.adminDeleteClass(this, id); } // Pour l'admin
    async generateAdminDescription() { await aiService.generateAdminDescription(this); }
    async submitAddClass(e) { await classService.submitAddClass(this, e); }
    applyTemplate() { classService.applyTemplate(this); }
    editTemplate(id) { classService.editTemplate(this, id); }
    cancelEditTemplate() { classService.cancelEditTemplate(this); }
    async saveAsTemplate() { await classService.saveAsTemplate(this); }

    /** 
     * Fonction maîtresse de rendu. 
     * Analyse l'état actuel pour afficher la bonne vue et les composants globaux.
     */
    render() {
        renderNavbar(this);
        renderFooter(this);

        const mainContainer = document.getElementById('main');
        const v = this.state.view;

        if (v === 'connexion' || v === 'inscription') {
            mainContainer.innerHTML = authView(this, v);
            authService.attachAuthEvents(this, v);
        } else {
            const viewMap = {
                accueil: homeView,
                'a-propos': aboutView,
                profil: profileView,
                tarifs: creditsView,
                contact: contactView,
                planning: scheduleView,
                administration: adminView
            };
            mainContainer.innerHTML = viewMap[v] ? viewMap[v](this) : '';
        }

        renderPaymentModal(this, mainContainer);

        // Initialisation de Quill pour la newsletter
        if (v === 'administration' && this.state.adminTab === 'newsletter' && !this.state.isHtmlView && typeof Quill !== 'undefined') {
            const editorContainer = document.getElementById('nl-editor');
            if (editorContainer) {
                this.state.quill = new Quill('#nl-editor', {
                    theme: 'snow',
                    modules: {
                        toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'color': [] }, { 'background': [] }],
                            [{ 'align': [] }],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link', 'image', 'clean']
                        ]
                    },
                    placeholder: 'Rédigez votre message ici...'
                });

                // Restaurer le contenu sauvegardé
                if (this.state.newsletterContent) {
                    this.state.quill.root.innerHTML = this.state.newsletterContent;
                }

                // Sauvegarder le contenu à chaque modification pour ne pas le perdre au re-render
                this.state.quill.on('text-change', () => {
                    this.state.newsletterContent = this.state.quill.root.innerHTML;
                });
            }
        }
    }

}

/** Instanciation et démarrage de l'application */
window.app = new PilatesApp();
window.addEventListener('DOMContentLoaded', () => {    window.app.init();
});
