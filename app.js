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
 * @class PilatesApp
 * @description Architecture de type "Single Page Application" (SPA) en Vanilla JS.
 * Gère l'état global, la navigation, le rendu du DOM et l'interface utilisateur.
 */
class PilatesApp {
    /**
     * Initialise l'état global de l'application et lie le contexte (bind) des méthodes.
     * @constructor
     */
    constructor() {
        /** 
         * État global de l'application centralisant toutes les données réactives.
         * @type {Object}
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
            showCalendarModal: false,
            classForCalendar: null,
            notification: { message: '', type: 'success', visible: false },
            isVerifyingEmail: false,
            resendCodeTimer: 0,
            resendCodeInterval: null,
            registrationData: null,
            resetPasswordToken: null,
            courseTemplates: [],
            creditPackages: [],
            studioAddress: '',
            studioPhone: '',
            studioEmail: '',
            cancellationDelay: 24,
            studioFacebook: '',
            studioInstagram: '',
            studioTiktok: '',
            aiProvider: 'gemini',
            quill: null,
            newsletterContent: '',
            isHtmlView: false,
            selectedNewsletterRecipients: [],
            selectedUserDetails: null,
            adminUserQuill: null,
            adminUserMessageContent: '',
            isSendingAdminMessage: false,
            adminAddClassForm: {
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
            isAdminRecurring: false,
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
            visiblePasswords: [],
            selectedAdminClasses: [],
            userSearchQuery: '',
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

        this.handleRouteChange = this.handleRouteChange.bind(this);
        this.openCalendarModal = this.openCalendarModal.bind(this);
        this.closeCalendarModal = this.closeCalendarModal.bind(this);
    }

    /**
     * Méthode d'initialisation appelée au chargement du DOM.
     * Restaure le thème, charge l'utilisateur en cache, rafraîchit les données via l'API,
     * et gère les événements de l'historique du navigateur.
     * @async
     * @returns {Promise<void>}
     */
    async init() {
        try {
            const savedTheme = localStorage.getItem('pilates_theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = savedTheme || (prefersDark ? 'dark' : 'light');
            this.applyTheme(theme);

            const savedUser = localStorage.getItem('pilates_user');
            if (savedUser) {
                this.state.currentUser = JSON.parse(savedUser);
                console.log("[INIT] Utilisateur restauré :", this.state.currentUser.email);
                
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

            if (window.opener && (window.location.pathname.endsWith('/paiement-succes') || window.location.hash.includes('payment='))) {
                try {
                    if (window.opener.app) {
                        console.log("[POPUP] Signal de succès envoyé à la fenêtre parente");
                        await window.opener.app.init();
                        if (window.location.pathname.endsWith('/paiement-succes')) {
                            window.opener.app.navigate('paiement-succes');
                        }
                    }
                    window.close();
                    return;
                } catch (e) {
                    console.warn("Impossible de rafraîchir la fenêtre parente", e);
                }
            }

            window.addEventListener('popstate', this.handleRouteChange);
            await this.handleRouteChange();
            
        } catch (err) {
            console.error("Erreur d'initialisation:", err);
        }
    }

    /**
     * Analyse l'URL courante, gère les paramètres spécifiques (paiement, désabonnement),
     * détermine la vue à afficher et charge les données nécessaires depuis l'API.
     * @async
     * @returns {Promise<void>}
     */
    async handleRouteChange() {
        const path = window.location.pathname;
        const queryParams = new URLSearchParams(window.location.search);

        this.state.isVerifyingEmail = false;
        this.state.registrationData = null;
        clearInterval(this.state.resendCodeInterval);
        this.state.resendCodeTimer = 0;
        this.state.isMenuOpen = false;
        this.state.aiResponse = '';
        this.state.userSearchQuery = '';
        this.state.showCalendarModal = false;
        this.state.selectedAdminClasses = [];
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
        
        if (!window.opener) {
            window.scrollTo(0, 0);
        }

        if (queryParams.get('desabonne') === 'success') {
            this.showNotification("Vous avez été désabonné de la newsletter avec succès.");
            history.replaceState(null, '', window.location.pathname);
        }
        if (queryParams.get('payment') === 'success') {
            const msg = queryParams.get('type') === 'booking' ? "Paiement réussi ! Votre réservation est confirmée." : "Paiement réussi ! Vos crédits ont été ajoutés.";
            this.showNotification(msg);
            history.replaceState(null, '', window.location.pathname);
        }
        if (queryParams.get('payment') === 'cancel') {
            this.showNotification("Paiement annulé.", "error");
            history.replaceState(null, '', window.location.pathname);
        }

        const segments = path.split('/').filter(Boolean);
        let view = segments.length > 0 ? segments[segments.length - 1] : 'accueil';

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
            this.state.aiProvider = results[0].aiProvider || 'gemini';
            this.state.studioFacebook = results[0].facebookUrl || '';
            this.state.studioInstagram = results[0].instagramUrl || '';
            this.state.studioTiktok = results[0].tiktokUrl || '';
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
     * Gère la navigation entre les vues de l'application.
     * @param {string} view - Le nom de la vue cible.
     */
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

    /**
     * Définit l'onglet actif du profil.
     * @param {string} tab - Nom de l'onglet.
     */
    setProfileTab(tab) {
        this.state.profileTab = tab;
        this.render();
    }

    /**
     * Met à jour le formulaire d'ajout de cours côté admin.
     * @param {string} key - Le champ à modifier.
     * @param {any} value - La nouvelle valeur.
     */
    handleAdminAddClassFormChange(key, value) {
        this.state.adminAddClassForm[key] = value;
        this.render();
    }

    /**
     * Bascule l'état de récurrence pour l'ajout d'un cours.
     */
    toggleAdminRecurring() {
        this.state.isAdminRecurring = !this.state.isAdminRecurring;
        if (!this.state.isAdminRecurring) {
            this.state.adminAddClassForm.recurrenceType = 'weekly';
            this.state.adminAddClassForm.recurrenceEnd = '';
        }
        this.render();
    }

    /**
     * Définit l'onglet actif de la section d'administration.
     * Gère également l'auto-sélection des abonnés pour la newsletter.
     * @param {string} tab - Nom de l'onglet admin.
     */
    setAdminTab(tab) {
        this.state.adminTab = tab;
        this.state.selectedAdminClasses = [];
        if (tab === 'newsletter') {
            this.state.selectedNewsletterRecipients = this.state.users
                .filter(u => Number(u.newsletter_subscribed) === 1 && u.role !== 'admin')
                .map(u => u.id);
        }
        this.render();
    }

    /**
     * Ouvre ou ferme le menu mobile.
     */
    toggleMenu() {
        this.state.isMenuOpen = !this.state.isMenuOpen;
        this.render();
    }

    /**
     * Affiche une notification en superposition (toast).
     * @param {string} message - Le message à afficher.
     * @param {string} [type='success'] - 'success', 'error', 'info', 'warning'.
     */
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

    /**
     * Applique un thème au document et le sauvegarde.
     * @param {string} theme - 'light' ou 'dark'.
     */
    applyTheme(theme) {
        this.state.theme = theme;
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        try {
            localStorage.setItem('pilates_theme', theme);
        } catch (e) {
            console.warn("Impossible de sauvegarder le thème (localStorage bloqué)");
        }
        this.render();
    }

    async switchTheme(theme, element) {
        if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !element || !element.getBoundingClientRect) {
            this.applyTheme(theme);
            return;
        }
    
        try {
            const rect = element.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        
            const transition = document.startViewTransition(() => {
                this.applyTheme(theme);
            });
        
            await transition.ready;
        
            document.documentElement.animate(
                { clipPath: [ `circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)` ] },
                { duration: 500, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
            );
        } catch (err) {
            console.warn("L'animation de transition a été ignorée :", err);
            if (this.state.theme !== theme) {
                this.applyTheme(theme);
            }
        }
    }

    toggleTheme(element) {
        console.log("💡 [Thème] Bouton cliqué ! Thème actuel :", this.state.theme);
        const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
        this.switchTheme(newTheme, element);
    }

    togglePasswordVisibility(inputId) {
        const index = this.state.visiblePasswords.indexOf(inputId);
        const isVisible = index === -1; // S'il n'y était pas, il devient visible
        
        if (isVisible) {
            this.state.visiblePasswords.push(inputId);
        } else {
            this.state.visiblePasswords.splice(index, 1);
        }
        
        // Mise à jour directe du DOM au lieu de tout recharger avec this.render()
        const input = document.getElementById(inputId);
        if (input) {
            input.type = isVisible ? 'text' : 'password';
            const btn = input.nextElementSibling;
            if (btn) {
                const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>`;
                const eyeSlashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z"/><path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z"/></svg>`;
                btn.innerHTML = isVisible ? eyeSlashIcon : eyeIcon;
            }
            input.focus(); // Remet le focus dans le champ de texte pour le confort
        }
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

    /**
     * Méthode de rendu principal.
     * Reconstruit dynamiquement le DOM en fonction de l'état (this.state).
     * Gère la restauration du focus des éléments pour l'accessibilité.
     */
    render() {
        const activeElementId = document.activeElement?.id;
        let selectionStart = null;
        let selectionEnd = null;
        try {
            selectionStart = document.activeElement?.selectionStart ?? null;
            selectionEnd = document.activeElement?.selectionEnd ?? null;
        } catch (e) { /* Ignore pour les inputs ne supportant pas la sélection (ex: email, number) */ }

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
            
            if (v === this.lastView) {
                html = html.replace(/animate-(fade-in|slide-up|bounce|pulse)/g, ' ');
            }
            mainContainer.innerHTML = html;
        }

        renderPaymentModal(this, mainContainer);
        renderCalendarModal(this);
        renderConfirmModal(this);
        this.renderCookieBanner();

        if (activeElementId) {
            const elementToFocus = document.getElementById(activeElementId);
            if (elementToFocus && (elementToFocus instanceof HTMLInputElement || elementToFocus instanceof HTMLTextAreaElement)) {
                elementToFocus.focus();
                // Restauration de la position du curseur pour éviter qu'il ne saute à la fin
                if (selectionStart !== null) {
                    try {
                        elementToFocus.setSelectionRange(selectionStart, selectionEnd);
                    } catch (e) { /* Ignore si non supporté par le navigateur */ }
                }
            }
        }

        this.lastView = v;

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

    /**
     * Gère l'affichage de la bannière d'information des cookies.
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

        banner.className = "position-fixed bottom-0 end-0 p-3 p-md-4 animate-fade-in";
        banner.style.zIndex = "1050";
        banner.style.maxWidth = "400px";
        banner.innerHTML = `
            <div class="custom-card p-4 shadow-lg">
                <div class="d-flex flex-column gap-3">
                    <p class="small text-muted mb-0">
                        <span class="fw-bold text-stone-800 d-block mb-1">Respect de votre vie privée</span>
                        Nous utilisons uniquement des données strictement nécessaires à votre navigation (session, thème). Aucun traceur publicitaire n'est utilisé.
                    </p>
                    <button onclick="app.acceptCookies()" class="btn btn-emerald w-100 py-2 fw-medium">
                        J'ai compris
                    </button>
                </div>
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
