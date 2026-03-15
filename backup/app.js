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
import { legalView } from './js/views/legal.js';
import { scheduleView } from './js/views/schedule.js';
import { paymentSuccessView } from './js/views/paymentSuccess.js';
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
            theme: 'light',
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
            profileTab: 'infos',
            adminTab: 'planning',
            paymentMethod: 'card',
            selectedClassForPayment: null,
            modalMessage: null,
            editingTemplateId: null,
            notification: { message: '', type: 'success', visible: false },
            isVerifyingEmail: false, // True when waiting for email code
            resendCodeTimer: 0,      // Countdown for resend button
            resendCodeInterval: null, // Interval ID for timer
            registrationData: null,
            resetPasswordToken: null, // Token for password reset flow
            courseTemplates: [],
            creditPackages: [],
            studioAddress: '',
            studioPhone: '',
            studioEmail: '',
            cancellationDelay: 24,
            quill: null,
            newsletterContent: '',
            isHtmlView: false,
            selectedNewsletterRecipients: [],
            selectedUserDetails: null,
            adminUserQuill: null,
            adminUserMessageContent: '',
            cookieNoticeAccepted: localStorage.getItem('pilates_cookie_accepted') === 'true'
        };
        // Bind 'this' to methods that are used as event handlers
        this.handleRouteChange = this.handleRouteChange.bind(this);
    }

    /**
     * Initialise l'application au chargement de la page.
     * Récupère la session utilisateur et les données depuis l'API.
     */
    async init() {
        try {
            // Gestion du thème
            const savedTheme = localStorage.getItem('pilates_theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = savedTheme || (prefersDark ? 'dark' : 'light');
            this.applyTheme(theme);

            // 1. Charger l'utilisateur AVANT toute chose
            const savedUser = localStorage.getItem('pilates_user');
            if (savedUser) {
                this.state.currentUser = JSON.parse(savedUser);
                console.log("[INIT] Utilisateur restauré :", this.state.currentUser.email);
                
                // Rafraîchir les données en arrière-plan
                try {
                    const resUser = await fetch(`${API_URL}/users/${this.state.currentUser.id}`);
                    if (resUser.ok) {
                        const freshUser = await resUser.json();
                        this.state.currentUser = freshUser;
                        localStorage.setItem('pilates_user', JSON.stringify(freshUser));
                        console.log("[INIT] Données utilisateur rafraîchies");
                    }
                } catch (e) {
                    console.warn("[INIT] Échec rafraîchissement utilisateur", e);
                }
            }

            // Gestion de la fermeture du popup de paiement Stripe
            if (window.opener && (window.location.pathname.endsWith('/paiement-succes') || window.location.hash.includes('payment='))) {
                try {
                    if (window.opener.app) {
                        console.log("[POPUP] Signal de succès envoyé à la fenêtre parente");
                        await window.opener.app.init();
                        if (window.location.pathname.endsWith('/paiement-succes')) {
                            window.opener.app.navigate('paiement-succes');
                        }
                    }
                    window.close(); // On ferme le popup
                    return;
                } catch (e) {
                    console.warn("Impossible de rafraîchir la fenêtre parente", e);
                }
            }

            // Utilisation de l'History API pour un routage propre (sans #)
            window.addEventListener('popstate', this.handleRouteChange); // Gère les boutons précédent/suivant du navigateur
            await this.handleRouteChange(); // Gère la route initiale au chargement de la page
            
        } catch (err) {
            console.error("Erreur d'initialisation:", err);
        }
    }

    /**
     * Gère les changements de route (initialisation et popstate).
     */
    async handleRouteChange() {
        const path = window.location.pathname;
        const queryParams = new URLSearchParams(window.location.search);

        // Reset specific states on route change
        this.state.isVerifyingEmail = false;
        this.state.registrationData = null;
        clearInterval(this.state.resendCodeInterval);
        this.state.resendCodeTimer = 0;
        this.state.isMenuOpen = false;
        this.state.aiResponse = '';
        
        // Sécurité : scroller en haut seulement si on n'est pas dans un popup
        if (!window.opener) {
            window.scrollTo(0, 0);
        }

        // Handle special query parameters (payment, unsubscribe)
        if (queryParams.get('desabonne') === 'success') {
            this.showNotification("Vous avez été désabonné de la newsletter avec succès.");
            history.replaceState(null, '', window.location.pathname); // Clean URL
        }
        if (queryParams.get('payment') === 'success') {
            const msg = queryParams.get('type') === 'booking' ? "Paiement réussi ! Votre réservation est confirmée." : "Paiement réussi ! Vos crédits ont été ajoutés.";
            this.showNotification(msg);
            history.replaceState(null, '', window.location.pathname); // Clean URL
        }
        if (queryParams.get('payment') === 'cancel') {
            this.showNotification("Paiement annulé.", "error");
            history.replaceState(null, '', window.location.pathname); // Clean URL
        }

        // Determine the view based on pathname
        // Pour le NAS : on récupère uniquement le dernier segment de l'URL
        const segments = path.split('/').filter(Boolean);
        let view = segments.length > 0 ? segments[segments.length - 1] : 'accueil';

        // Handle reset-password token
        if (view === 'reset-password' && queryParams.has('token')) {
            this.state.resetPasswordToken = queryParams.get('token');
            // Clean the token from the URL after reading it, but keep the path
            history.replaceState(null, '', window.location.pathname);
        } else if (view === 'reset-password' && !queryParams.has('token')) {
            // If navigating to /reset-password without a token, ensure token is null
            this.state.resetPasswordToken = null;
        } else {
            // For any other view, ensure resetPasswordToken is null
            this.state.resetPasswordToken = null;
        }

        this.state.view = view;
        if (this.state.view === 'profil') this.state.profileTab = 'infos';
        if (this.state.view === 'planning') this.state.currentDate = new Date();

        try {
            // Ajout d'un contrôleur d'abandon pour éviter le chargement infini si le serveur est bloqué
            console.log("[APP] Chargement des données initiales...");
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes max

            const promises = [
                fetch(`${API_URL}/settings`, { signal: controller.signal }).then(r => r.ok ? r.json() : {}).catch(() => ({})),
                fetch(`${API_URL}/classes`, { signal: controller.signal }).then(r => r.ok ? r.json() : []).catch(() => []),
                fetch(`${API_URL}/course-templates`, { signal: controller.signal }).then(r => r.ok ? r.json() : []).catch(() => []),
                fetch(`${API_URL}/credit-packages`, { signal: controller.signal }).then(r => r.ok ? r.json() : []).catch(() => [])
            ];

            if (this.state.currentUser?.id) {
                promises.push(fetch(`${API_URL}/users/${this.state.currentUser.id}`, { signal: controller.signal }).then(r => r.ok ? r.json() : null).catch(() => null));
                if (this.state.currentUser.role === 'admin') {
                    promises.push(fetch(`${API_URL}/users`, { signal: controller.signal }).then(r => r.ok ? r.json() : []).catch(() => []));
                }
            }

            const results = await Promise.all(promises);
            clearTimeout(timeoutId);

            this.state.studioAddress = results[0].studioAddress || '';
            this.state.studioPhone = results[0].studioPhone || '';
            this.state.studioEmail = results[0].studioEmail || '';
            this.state.cancellationDelay = results[0].cancellationDelay || 24;
            this.state.classes = results[1] || [];
            this.state.courseTemplates = results[2] || [];
            this.state.creditPackages = results[3] || [];

            if (this.state.currentUser?.id) {
                const freshUser = results[4];
                if (freshUser) {
                    this.state.currentUser = freshUser;
                    localStorage.setItem('pilates_user', JSON.stringify(freshUser));
                }
                if (this.state.currentUser.role === 'admin') {
                    this.state.users = results[5] || [];
                }
            }
        } catch (e) {
            console.error("[APP] Erreur critique au démarrage:", e);
            this.showNotification("Erreur de connexion au serveur (Timeout).", "error");
        }

        this.render();
    }

    /**
     * Change la vue active et réinitialise certains états.
     * @param {string} view - L'identifiant de la vue (ex: 'home', 'schedule').
     */
    navigate(view) {
        const currentPath = window.location.pathname.replace(/^\/+|\/+$/g, '') || 'accueil';
        if (currentPath === view) {
            // Si on est déjà sur la vue, on force la fermeture du menu et le scroll en haut
            this.state.isMenuOpen = false;
            window.scrollTo(0, 0);
            this.render();
        } else {
            history.pushState(null, '', `/${view}`);
            this.handleRouteChange(); // Manuellement appeler le gestionnaire pour pushState
        }
    }

    /**
     * Change l'onglet actif dans le profil utilisateur.
     * @param {string} tab - L'identifiant de l'onglet ('infos', 'sessions', 'payments').
     */
    setProfileTab(tab) {
        this.state.profileTab = tab;
        this.render();
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

    /** @section Theme Management */
    applyTheme(theme) {
        this.state.theme = theme;
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('pilates_theme', theme);
        this.render(); // Re-render to update icons etc.
    }

    async switchTheme(theme, element) {
        if (
          !document.startViewTransition ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          this.applyTheme(theme);
          return;
        }
    
        const { top, left, width, height } = element.getBoundingClientRect();
        const x = left + width / 2;
        const y = top + height / 2;
        const right = window.innerWidth - x;
        const bottom = window.innerHeight - y;
        const radius = Math.hypot(Math.max(x, right), Math.max(y, bottom));
    
        const transition = document.startViewTransition(() => {
          this.applyTheme(theme);
        });
    
        await transition.ready;
    
        document.documentElement.animate(
          { clipPath: [ `circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)` ] },
          { duration: 500, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
        );
    }

    toggleTheme(element) {
        const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
        this.switchTheme(newTheme, element);
    }

    /**
     * Accepte la notice d'information sur le stockage local.
     */
    acceptCookies() {
        localStorage.setItem('pilates_cookie_accepted', 'true');
        this.state.cookieNoticeAccepted = true;
        this.render();
    }

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

    /**
     * Supprime définitivement un compte utilisateur avec double confirmation.
     */
    async deleteAccount(userId, isAdmin = false) {
        const msg1 = isAdmin ? "Voulez-vous vraiment supprimer ce compte client ?" : "Êtes-vous sûr de vouloir supprimer votre compte ?";
        if (!confirm(`⚠️ ${msg1} Cette action est irréversible.`)) return;
        
        if (!confirm("🛑 DERNIER AVERTISSEMENT : Toutes les données (crédits, réservations, historique) seront définitivement effacées du serveur. Confirmer la suppression ?")) return;

        try {
            const res = await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
            const data = await res.json();
            
            if (data.success || res.ok) {
                this.showNotification("Le compte a été supprimé définitivement.");
                if (!isAdmin) {
                    this.logout();
                } else {
                    this.state.selectedUserDetails = null;
                    this.state.adminTab = 'users';
                    const resUsers = await fetch(`${API_URL}/users`);
                    this.state.users = await resUsers.json() || [];
                    this.render();
                }
            } else {
                this.showNotification(data.message || "Erreur lors de la suppression", "error");
            }
        } catch (err) {
            this.showNotification("Erreur technique lors de la suppression.", "error");
        }
    }

    /**
     * Relance l'envoi du code de vérification par email.
     */
    async resendVerificationCode() {
        if (this.state.resendCodeTimer > 0 || !this.state.registrationData?.email) return;

        this.state.resendCodeTimer = 60; // Start 60-second countdown
        this.state.resendCodeInterval = setInterval(() => {
            this.state.resendCodeTimer--;
            if (this.state.resendCodeTimer <= 0) {
                clearInterval(this.state.resendCodeInterval);
                this.state.resendCodeInterval = null;
            }
            this.render(); // Re-render to update button text
        }, 1000);

        try {
            await authService.sendVerificationCode(this, this.state.registrationData.email);
            this.showNotification("Nouveau code envoyé !");
        } catch (err) {
            this.showNotification("Erreur lors du renvoi du code.", "error");
        }
    }

    /**
     * Annule la vérification d'inscription et revient au formulaire initial.
     */
    cancelRegistrationVerification() {
        this.state.isVerifyingEmail = false;
        // On ne vide pas registrationData pour que les champs soient pré-remplis si l'utilisateur revient
        // this.state.registrationData = null;
        clearInterval(this.state.resendCodeInterval);
        this.state.resendCodeTimer = 0;
        this.state.resendCodeInterval = null;
        this.render(); // Utilise render pour revenir à l'état initial
        this.showNotification("Vérification annulée. Veuillez réessayer.", "error");
    }

    /**
     * Rend spécifiquement la vue d'authentification.
     * Permet de basculer entre l'inscription et la saisie du code sans recharger tout le site.
     */
    renderAuthView() {
        const mainContainer = document.getElementById('main');
        const v = this.state.view;
        if (mainContainer && (v === 'connexion' || v === 'inscription' || v === 'reset-password')) {
            // On injecte le HTML de la vue auth
            mainContainer.innerHTML = authView(this, v);
            // On attache les écouteurs d'événements sur les nouveaux éléments du DOM
            authService.attachAuthEvents(this, v);
        }
    }

    async viewUser(userId) {
        try {
            this.state.isAdminAiLoading = true;
            this.state.adminUserQuill = null; // Détruire la référence à l'ancienne instance
            this.state.adminUserMessageContent = ''; // Vider le contenu du message précédent
            this.render();
            const details = await userService.getUserDetails(this, userId);
            
            // Correction : on gère aussi 'error' (500) et on vérifie que les données sont complètes
            if (details.message || details.error) {
                throw new Error(details.message || details.error);
            }
            
            this.state.selectedUserDetails = details;
            this.state.adminTab = 'user_details';
        } catch (err) {
            console.error("Erreur chargement client:", err);
            this.showNotification("Impossible de charger les détails du client.", "error");
        } finally {
            this.state.isAdminAiLoading = false;
            this.render();
        }
    }
    async adjustCredits(e, userId) { await userService.adjustCredits(this, e, userId); }
    async sendUserMessage(e, userId) { await userService.sendUserMessage(this, e, userId); }
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
        
        const mainContainer = document.getElementById('main'); // Ensure mainContainer is defined
        const v = this.state.view;

        if (v === 'connexion' || v === 'inscription' || v === 'reset-password') {
            this.renderAuthView(); // Utilise la nouvelle fonction pour l'auth
        } else {
            const viewMap = {
                accueil: homeView,
                'a-propos': aboutView,
                profil: profileView,
                tarifs: creditsView,
                contact: contactView,
                planning: scheduleView,
                'paiement-succes': paymentSuccessView,
                administration: adminView,
                'mentions-legales': (app) => legalView(app, 'mentions-legales'), // Keep these views
                'politique-confidentialite': (app) => legalView(app, 'politique-confidentialite'), // Keep these views
            };
            mainContainer.innerHTML = viewMap[v] ? viewMap[v](this) : '';
        }

        renderPaymentModal(this, mainContainer);
        this.renderCookieBanner();

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

        // Initialisation de Quill pour le message personnel à un client
        if (v === 'administration' && this.state.adminTab === 'user_details' && typeof Quill !== 'undefined') {
            const editorContainer = document.getElementById('user-message-editor');
            if (editorContainer && !this.state.adminUserQuill) { // Ne réinitialise pas si déjà présent
                this.state.adminUserQuill = new Quill('#user-message-editor', {
                    theme: 'snow',
                    modules: {
                        toolbar: [
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link', 'clean']
                        ]
                    },
                    placeholder: 'Rédigez votre message ici...'
                });
                this.state.adminUserQuill.on('text-change', () => {
                    this.state.adminUserMessageContent = this.state.adminUserQuill.root.innerHTML;
                });
            }
        }
    }

    /**
     * Affiche une bannière d'information sur les cookies/storage.
     */
    renderCookieBanner() {
        if (this.state.cookieNoticeAccepted) {
            const existing = document.getElementById('cookie-banner');
            if (existing) existing.remove();
            return;
        }
        
        let banner = document.getElementById('cookie-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'cookie-banner';
            document.body.appendChild(banner);
        }

        banner.className = "fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-sm bg-white dark:bg-stone-800 p-6 rounded-2xl shadow-2xl border border-stone-100 dark:border-stone-700 z-[100] animate-fade-in";
        banner.innerHTML = `
            <div class="flex flex-col gap-4">
                <p class="text-sm text-stone-600 dark:text-stone-300">
                    <span class="font-semibold text-stone-800 dark:text-white block mb-1">Respect de votre vie privée</span>
                    Nous utilisons uniquement des données strictement nécessaires à votre navigation (session, thème). Aucun traceur publicitaire n'est utilisé.
                </p>
                <button onclick="app.acceptCookies()" class="w-full bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors dark:bg-emerald-700 dark:hover:bg-emerald-600">
                    J'ai compris
                </button>
            </div>
        `;
    }

}

/** Instanciation et démarrage de l'application */
window.app = new PilatesApp();
window.addEventListener('DOMContentLoaded', () => {    window.app.init();
});
