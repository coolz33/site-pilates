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
import { renderNavbar, renderFooter, renderPaymentModal, renderCalendarModal, renderConfirmModal } from './js/views/components.js';

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
            showCalendarModal: false, // Nouvelle propriété pour contrôler l'affichage du modal calendrier
            classForCalendar: null,   // Nouvelle propriété pour stocker les détails du cours à ajouter au calendrier
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
            aiProvider: 'gemini',
            quill: null,
            newsletterContent: '',
            isHtmlView: false,
            selectedNewsletterRecipients: [],
            selectedUserDetails: null,
            adminUserQuill: null,
            adminUserMessageContent: '',
            isSendingAdminMessage: false, // Nouvelle propriété pour gérer l'état d'envoi du message admin
            adminAddClassForm: { // État pour le formulaire d'ajout de cours
                templateId: '',
                title: '',
                description: '',
                date: '',
                time: '',
                duration: 60,
                capacity: 10,
                creditsPrice: 1,
                recurrenceType: 'weekly',
                recurrenceEnd: ''
            },
            isAdminRecurring: false, // État persistant pour l'affichage de la récurrence
            adminClassFilters: {
                startDate: '',
                endDate: '',
                startTime: '',
                endTime: '',
                titles: [],
                minBooked: '',
                maxBooked: '',
                userName: ''
            },
            selectedAdminClasses: [], // IDs des séances sélectionnées pour action groupée
            userSearchQuery: '', // Requête pour le filtrage dynamique des clients
            cookieNoticeAccepted: localStorage.getItem('pilates_cookie_accepted') === 'true',
            confirmModal: {
                isOpen: false,
                message: '',
                onConfirm: null,
                onCancel: null,
                confirmText: 'Confirmer',
                cancelText: 'Annuler',
                type: 'warning'
            }
        };
        this.lastView = null;
        // Bind 'this' to methods that are used as event handlers
        this.handleRouteChange = this.handleRouteChange.bind(this);
        this.openCalendarModal = this.openCalendarModal.bind(this);
        this.closeCalendarModal = this.closeCalendarModal.bind(this);
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
        this.state.userSearchQuery = '';
        this.state.showCalendarModal = false;
        this.state.selectedAdminClasses = [];
        // Reset admin add class form on init
        this.state.adminAddClassForm = {
            templateId: '',
            title: '',
            description: '',
            date: '',
            time: '',
            duration: 60,
            capacity: 10,
            creditsPrice: 1,
            recurrenceType: 'weekly',
            recurrenceEnd: ''
        };
        this.state.classForCalendar = null;
        
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
        const segments = path.split('/').filter(Boolean);
        let view = segments.length > 0 ? segments[segments.length - 1] : 'accueil';

        // Handle reset-password token
        if (view === 'reset-password' && queryParams.has('token')) {
            this.state.resetPasswordToken = queryParams.get('token');
            history.replaceState(null, '', window.location.pathname);
        } else if (view === 'reset-password' && !queryParams.has('token')) {
            this.state.resetPasswordToken = null;
        } else {
            this.state.resetPasswordToken = null;
        }

        this.state.view = view;
        if (this.state.view === 'profil') this.state.profileTab = 'infos';
        if (this.state.view === 'planning') this.state.currentDate = new Date();

        try {
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

    navigate(view) {
        const currentPath = window.location.pathname.replace(/^\/+|\/+$/g, '') || 'accueil';
        if (currentPath === view) {
            this.state.isMenuOpen = false;
            window.scrollTo(0, 0);
            this.render();
        } else {
            history.pushState(null, '', `/${view}`);
            this.handleRouteChange();
        }
    }

    setProfileTab(tab) {
        this.state.profileTab = tab;
        this.render();
    }

    handleAdminAddClassFormChange(key, value) {
        this.state.adminAddClassForm[key] = value;
        this.render();
    }

    toggleAdminRecurring() {
        this.state.isAdminRecurring = !this.state.isAdminRecurring;
        if (!this.state.isAdminRecurring) { // Si la récurrence est désactivée, on nettoie les champs associés
            this.state.adminAddClassForm.recurrenceType = 'weekly';
            this.state.adminAddClassForm.recurrenceEnd = '';
        }
        this.render();
    }

    setAdminTab(tab) {
        this.state.adminTab = tab;
        this.state.selectedAdminClasses = []; // Reset selection on tab change
        if (tab === 'newsletter') {
            this.state.selectedNewsletterRecipients = this.state.users
                .filter(u => Number(u.newsletter_subscribed) === 1 && u.role !== 'admin')
                .map(u => u.id);
        }
        this.render();
    }

    toggleMenu() {
        this.state.isMenuOpen = !this.state.isMenuOpen;
        this.render();
    }

    showNotification(message, type = 'success') {
        this.state.notification = { message, type, visible: true };
        this.render();
        
        setTimeout(() => {
            this.state.notification.visible = false;
            this.render();
        }, 3000);
    }

    validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
    validatePhone(phone) { return /^(\+33|0)[1-9][0-9]{8}$/.test(phone.replace(/\s/g, '')); }
    validatePassword(pwd) { return pwd.length >= 5; }

    applyTheme(theme) {
        this.state.theme = theme;
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('pilates_theme', theme);
        this.render();
    }

    async switchTheme(theme, element) {
        if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          this.applyTheme(theme);
          return;
        }
    
        const { top, left, width, height } = element.getBoundingClientRect();
        const x = left + width / 2;
        const y = top + height / 2;
        const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    
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

    confirmDialog(message, options = {}) {
        return new Promise((resolve) => {
            this.state.confirmModal = {
                isOpen: true,
                message,
                confirmText: options.confirmText || 'Confirmer',
                cancelText: options.cancelText || 'Annuler',
                type: options.type || 'warning',
                onConfirm: () => {
                    this.state.confirmModal.isOpen = false;
                    this.render();
                    resolve(true);
                },
                onCancel: () => {
                    this.state.confirmModal.isOpen = false;
                    this.render();
                    resolve(false);
                }
            };
            this.render();
        });
    }

    handleAdminClassFilterChange(key, value) {
        this.state.adminClassFilters[key] = value;
        this.render();
    }

    handleAdminClassTitleToggle(title) {
        const idx = this.state.adminClassFilters.titles.indexOf(title);
        if (idx > -1) this.state.adminClassFilters.titles.splice(idx, 1);
        else this.state.adminClassFilters.titles.push(title);
        this.render();
    }

    toggleAdminClassSelection(id) {
        const idx = this.state.selectedAdminClasses.indexOf(id);
        if (idx > -1) this.state.selectedAdminClasses.splice(idx, 1);
        else this.state.selectedAdminClasses.push(id);
        this.render();
    }

    toggleAllAdminClasses(checked, ids) {
        this.state.selectedAdminClasses = checked ? [...ids] : [];
        this.render();
    }

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

    async deleteAccount(userId, isAdmin = false) {
        const msg1 = isAdmin ? "Voulez-vous vraiment supprimer ce compte client ?" : "Êtes-vous sûr de vouloir supprimer votre compte ?";
        const confirmed1 = await this.confirmDialog(msg1 + "\n\nCette action est irréversible.", { type: 'danger', confirmText: 'Supprimer' });
        if (!confirmed1) return;
        
        const confirmed2 = await this.confirmDialog("DERNIER AVERTISSEMENT : Toutes les données (crédits, réservations, historique) seront définitivement effacées du serveur.\n\nConfirmer la suppression ?", { type: 'danger', confirmText: 'Supprimer définitivement' });
        if (!confirmed2) return;

        try {
            const res = await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
            if (res.ok) {
                this.showNotification("Le compte a été supprimé définitivement.");
                if (!isAdmin) this.logout();
                else {
                    this.state.selectedUserDetails = null;
                    this.state.adminTab = 'users';
                    this.init();
                }
            }
        } catch (err) { this.showNotification("Erreur lors de la suppression.", "error"); }
    }

    async resendVerificationCode() {
        if (this.state.resendCodeTimer > 0 || !this.state.registrationData?.email) return;
        this.state.resendCodeTimer = 60;
        this.state.resendCodeInterval = setInterval(() => {
            this.state.resendCodeTimer--;
            if (this.state.resendCodeTimer <= 0) clearInterval(this.state.resendCodeInterval);
            this.render();
        }, 1000);
        try {
            await authService.sendVerificationCode(this, this.state.registrationData.email);
            this.showNotification("Nouveau code envoyé !");
        } catch (err) { this.showNotification("Erreur lors du renvoi.", "error"); }
    }

    cancelRegistrationVerification() {
        this.state.isVerifyingEmail = false;
        clearInterval(this.state.resendCodeInterval);
        this.state.resendCodeTimer = 0;
        this.render();
        this.showNotification("Vérification annulée.", "error");
    }

    renderAuthView() {
        const mainContainer = document.getElementById('main');
        const v = this.state.view;
        if (mainContainer && (v === 'connexion' || v === 'inscription' || v === 'reset-password')) {
            mainContainer.innerHTML = authView(this, v);
            authService.attachAuthEvents(this, v);
        }
    }

    async viewUser(userId) {
        try {
            this.state.isAdminAiLoading = true;
            this.state.adminUserQuill = null;
            this.state.adminUserMessageContent = '';
            this.render();
            const details = await userService.getUserDetails(this, userId);
            if (details.message || details.error) throw new Error(details.message || details.error);
            this.state.selectedUserDetails = details;
            this.state.adminTab = 'user_details';
        } catch (err) {
            this.showNotification("Impossible de charger les détails.", "error");
        } finally {
            this.state.isAdminAiLoading = false;
            this.render();
        }
    }

    async adjustCredits(e, userId) { await userService.adjustCredits(this, e, userId); }
    async sendUserMessage(e, userId) { await userService.sendUserMessage(this, e, userId); }
    async askAi() { await aiService.askAi(this); }
    handleUserSearch(query) {
        this.state.userSearchQuery = query;
        this.render();
    }
    async deleteClass(id) { await classService.cancelBookingByUser(this, id); }
    async adminCancelBookingForUser(classId, userId) { await classService.adminCancelBookingForUser(this, classId, userId); }
    async adminDeleteClass(id) { await classService.adminDeleteClass(this, id); }
    async adminBulkDeleteClasses() { await classService.adminBulkDeleteClasses(this); }
    async generateAdminDescription() { await aiService.generateAdminDescription(this); }
    async submitAddClass(e) { await classService.submitAddClass(this, e); }
    applyTemplate() { classService.applyTemplate(this); }
    editTemplate(id) { classService.editTemplate(this, id); }
    cancelEditTemplate() { classService.cancelEditTemplate(this); }
    async saveAsTemplate() { await classService.saveAsTemplate(this); }

    render() {
        // Sauvegarde de l'élément ayant le focus et de la position du curseur AVANT toute modification du DOM
        const activeElementId = document.activeElement?.id;
        const selectionStart = document.activeElement?.selectionStart;
        const selectionEnd = document.activeElement?.selectionEnd;

        renderNavbar(this);
        renderFooter(this);
        
        const mainContainer = document.getElementById('main');
        const v = this.state.view;

        if (v === 'connexion' || v === 'inscription' || v === 'reset-password') {
            this.renderAuthView();
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
                'mentions-legales': (app) => legalView(app, 'mentions-legales'),
                'politique-confidentialite': (app) => legalView(app, 'politique-confidentialite'),
            };
            let html = viewMap[v] ? viewMap[v](this) : '';
            
            // Si on est déjà sur la même vue (changement d'onglet ou fermeture modal),
            // on neutralise les animations pour éviter de rejouer les effets d'apparition.
            if (v === this.lastView) {
                html = html.replace(/animate-(fade-in|slide-up|bounce|pulse)/g, ' ');
            }
            mainContainer.innerHTML = html;
        }

        renderPaymentModal(this, mainContainer);
        renderCalendarModal(this);
        renderConfirmModal(this);
        this.renderCookieBanner();

        // Restauration du focus et du curseur après le rendu
        if (activeElementId) {
            const elementToFocus = document.getElementById(activeElementId);
            if (elementToFocus && (elementToFocus instanceof HTMLInputElement || elementToFocus instanceof HTMLTextAreaElement)) {
                elementToFocus.focus();
                // Restauration de la position du curseur pour éviter qu'il ne saute à la fin
                if (selectionStart !== null) elementToFocus.setSelectionRange(selectionStart, selectionEnd);
            }
        }

        this.lastView = v;

        // Initialisation de Quill (Administration)
        if (v === 'administration' && typeof Quill !== 'undefined') {
            if (this.state.adminTab === 'newsletter' && !this.state.isHtmlView) {
                const editorContainer = document.getElementById('nl-editor');
                if (editorContainer) {
                    this.state.quill = new Quill('#nl-editor', { theme: 'snow', placeholder: 'Rédigez...' });
                    if (this.state.newsletterContent) this.state.quill.root.innerHTML = this.state.newsletterContent;
                    this.state.quill.on('text-change', () => { this.state.newsletterContent = this.state.quill.root.innerHTML; });
                }
            }
            if (this.state.adminTab === 'user_details') {
                const userEditor = document.getElementById('user-message-editor');
                if (userEditor && !this.state.adminUserQuill) {
                    this.state.adminUserQuill = new Quill('#user-message-editor', { theme: 'snow' });
                    this.state.adminUserQuill.on('text-change', () => { this.state.adminUserMessageContent = this.state.adminUserQuill.root.innerHTML; });
                }
            }
        }
    }

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
                    Nous utilisons uniquement des données strictement nécessaires à votre navigation.
                </p>
                <button onclick="app.acceptCookies()" class="w-full bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
                    J'ai compris
                </button>
            </div>
        `;
    }

    /**
     * Ouvre le modal d'ajout au calendrier pour un cours donné.
     * @param {Object} cls - Les détails du cours.
     */
    openCalendarModal(cls) {
        this.state.classForCalendar = cls;
        this.state.showCalendarModal = true;
        this.render();
    }

    /**
     * Ferme le modal d'ajout au calendrier.
     */
    async closeCalendarModal() {
        this.state.showCalendarModal = false;
        this.state.classForCalendar = null;
        
        // Nettoyage forcé du DOM pour s'assurer que le modal disparaît
        const modal = document.getElementById('calendar-modal-overlay') || document.getElementById('calendar-modal');
        if (modal) modal.remove();

        // Rafraîchissement silencieux des données pour mettre à jour le statut "Inscrit" 
        // et le solde de crédits sans recharger toute la page (pas de scroll top).
        try {
            const [classesRes, userRes] = await Promise.all([
                fetch(`${API_URL}/classes`),
                this.state.currentUser ? fetch(`${API_URL}/users/${this.state.currentUser.id}`) : Promise.resolve(null)
            ]);

            if (classesRes.ok) this.state.classes = await classesRes.json();
            if (userRes && userRes.ok) {
                const freshUser = await userRes.json();
                this.state.currentUser = freshUser;
                localStorage.setItem('pilates_user', JSON.stringify(freshUser));
            }
        } catch (err) {
            console.error("Erreur lors du rafraîchissement des données:", err);
        }

        this.render();
    }
}

/** Instanciation et démarrage de l'application */
window.app = new PilatesApp();
window.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});
