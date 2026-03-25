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
import { studioView } from './js/views/studio.js';
import { profileView } from './js/views/profile.js';
import { creditsView } from './js/views/credits.js';
import { contactView } from './js/views/contact.js';
import { authView } from './js/views/auth.js';
import { legalView } from './js/views/legal.js';
import { scheduleView } from './js/views/schedule.js';
import { paymentSuccessView } from './js/views/paymentSuccess.js';
import { adminView } from './js/views/admin.js';
import { renderNavbar, renderFooter, renderPaymentModal, renderCalendarModal, renderConfirmModal, renderNotification } from './js/views/components.js';

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
            notification: { message: '', type: 'success', visible: false, position: null },
            isVerifyingEmail: false,
            resendCodeTimer: 0,
            resendCodeInterval: null,
            registrationData: null,
            registrationCode: '',
            resetPasswordToken: null,
            courseTemplates: [],
            creditPackages: [],
            studioAddress: '',
            studioPhone: '',
            studioEmail: '',
            studioSiret: '',
            studioTva: '',
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
            adminLedger: [],
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
            adminTemplateForm: {
                title: '',
                description: '',
                duration: 60,
                creditsPrice: 1,
                capacity: 10
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
            adminClassesSort: { column: 'date', direction: 'asc' },
            adminClassesPagination: { page: 1, limit: 10 },
            ledgerFilters: { startDate: '', endDate: '' },
            ledgerSort: { column: 'date', direction: 'desc' },
            ledgerPagination: { page: 1, limit: 10 },
            userPaymentFilters: { startDate: '', endDate: '' },
            userPaymentPagination: { page: 1, limit: 10 },
            userCreditFilters: { startDate: '', endDate: '' },
            userCreditPagination: { page: 1, limit: 10 },
            userFutureSessionFilters: { startDate: '', endDate: '' },
            userFutureSessionPagination: { page: 1, limit: 10 },
            userSessionFilters: { startDate: '', endDate: '' },
            userSessionPagination: { page: 1, limit: 10 },
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
        
        this.activeRequests = 0;
        this.loadingTimeout = null;
        this.setupFetchInterceptor();
    }

    setupFetchInterceptor() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            this.activeRequests++;
            if (this.activeRequests === 1) {
                this.loadingTimeout = setTimeout(() => {
                    let loader = document.getElementById('global-loader');
                    if (!loader) {
                        loader = document.createElement('div');
                        loader.id = 'global-loader';
                        loader.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center custom-modal-backdrop animate-fade-in';
                        loader.style.zIndex = '9999';
                        loader.innerHTML = '<div class="spinner-border text-emerald mb-3" role="status" style="width: 3rem; height: 3rem; border-width: 0.25em;"></div><div class="text-white fw-medium bg-dark bg-opacity-75 px-4 py-2 rounded-pill shadow-sm tracking-wider small">TRAITEMENT EN COURS...</div>';
                        document.body.appendChild(loader);
                    }
                }, 500);
            }
            try {
                const url = args[0] || '';
                // On ajoute le token uniquement si l'URL pointe vers notre API
                if (url.toString().includes('/api') || url.toString().includes('localhost') || !url.toString().startsWith('http')) {
                    const token = localStorage.getItem('pilates_token');
                    if (token) {
                        const opts = args[1] || {};
                        opts.headers = opts.headers || {};
                        // On évite d'écraser si Content-Type est déjà un Headers (rare ici, mais prudent)
                        if (opts.headers instanceof Headers) {
                            opts.headers.append('Authorization', `Bearer ${token}`);
                        } else {
                            opts.headers['Authorization'] = `Bearer ${token}`;
                        }
                        args[1] = opts;
                    }
                }
                return await originalFetch(...args);
            } finally {
                this.activeRequests = Math.max(0, this.activeRequests - 1);
                if (this.activeRequests === 0) {
                    clearTimeout(this.loadingTimeout);
                    const loader = document.getElementById('global-loader');
                    if (loader) loader.remove();
                }
            }
        };
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
                            window.opener.history.pushState(null, '', window.location.pathname + window.location.search);
                            window.opener.app.handleRouteChange();
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

        const segments = path.split('/').filter(Boolean);
        let view = segments.length > 0 ? segments[segments.length - 1] : 'accueil';
        const isViewChange = this.state.view !== view;

        if (isViewChange) {
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
            this.state.adminTemplateForm = {
                title: '',
                description: '',
                duration: 60,
                creditsPrice: 1,
                capacity: 10
            };
            this.state.classForCalendar = null;
            this.state.userPaymentFilters = { startDate: '', endDate: '' };
            this.state.userPaymentPagination = { page: 1, limit: 10 };
            this.state.userCreditFilters = { startDate: '', endDate: '' };
            this.state.userCreditPagination = { page: 1, limit: 10 };
            this.state.userFutureSessionFilters = { startDate: '', endDate: '' };
            this.state.userFutureSessionPagination = { page: 1, limit: 10 };
            this.state.userSessionFilters = { startDate: '', endDate: '' };
            this.state.userSessionPagination = { page: 1, limit: 10 };
            this.state.ledgerFilters = { startDate: '', endDate: '' };
            this.state.ledgerSort = { column: 'date', direction: 'desc' };
            this.state.ledgerPagination = { page: 1, limit: 10 };
            this.state.adminClassesPagination = { page: 1, limit: 10 };
            this.state.adminClassesSort = { column: 'date', direction: 'asc' };
            
            if (!window.opener) {
                window.scrollTo(0, 0);
            }
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

        if (view === 'reset-password' && queryParams.has('token')) {
            this.state.resetPasswordToken = queryParams.get('token');
            history.replaceState(null, '', window.location.pathname);
        } else if (view === 'reset-password' && !queryParams.has('token')) {
            this.state.resetPasswordToken = null;
        } else {
            this.state.resetPasswordToken = null;
        }

        this.state.view = view;
        if (isViewChange) {
            if (this.state.view === 'profil') this.state.profileTab = 'infos';
            if (this.state.view === 'planning') this.state.currentDate = new Date();
        }

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
            this.state.studioSiret = results[0].studioSiret || '';
            this.state.studioTva = results[0].studioTva || '';
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
    async setAdminTab(tab) {
        this.state.adminTab = tab;
        this.state.selectedAdminClasses = [];
        if (tab === 'planning') {
            this.state.adminClassesSort = { column: 'date', direction: 'asc' };
            this.state.adminClassesPagination.page = 1;
        } else if (tab === 'past_sessions') {
            this.state.adminClassesSort = { column: 'date', direction: 'desc' };
            this.state.adminClassesPagination.page = 1;
        } else if (tab === 'templates') {
            this.state.editingTemplateId = null;
            this.state.adminTemplateForm = { title: '', description: '', duration: 60, creditsPrice: 1, capacity: 10 };
        } else if (tab === 'newsletter') {
            this.state.selectedNewsletterRecipients = this.state.users
                .filter(u => Number(u.newsletter_subscribed) === 1)
                .map(u => u.id);
        } else if (tab === 'ledger') {
            this.state.isAdminAiLoading = true;
            this.render();
            try {
                const res = await fetch(`${API_URL}/transactions`);
                if (res.ok) this.state.adminLedger = await res.json();
            } catch (e) {
                console.error("Erreur de chargement du livre de recettes", e);
            }
            this.state.isAdminAiLoading = false;
        }
        this.render();
    }

    /**
     * Met à jour le filtre de date de l'historique des encaissements.
     */
    handleLedgerFilterChange(key, value) {
        this.state.ledgerFilters[key] = value;
        this.state.ledgerPagination.page = 1; // Retour à la première page
        this.render();
    }

    /**
     * Change la page affichée pour les séances côté admin.
     */
    setAdminClassesPage(page) {
        this.state.adminClassesPagination.page = page;
        this.render();
    }

    setAdminClassesLimit(limit) {
        this.state.adminClassesPagination.limit = limit === 'all' ? 'all' : parseInt(limit);
        this.state.adminClassesPagination.page = 1;
        this.render();
    }

    /**
     * Met à jour le tri du tableau des séances.
     */
    handleAdminClassesSort(column) {
        if (this.state.adminClassesSort.column === column) {
            this.state.adminClassesSort.direction = this.state.adminClassesSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.adminClassesSort.column = column;
            this.state.adminClassesSort.direction = 'asc';
        }
        this.state.adminClassesPagination.page = 1;
        this.render();
    }

    /**
     * Met à jour le tri du livre de recettes.
     */
    handleLedgerSort(column) {
        if (this.state.ledgerSort.column === column) {
            this.state.ledgerSort.direction = this.state.ledgerSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.ledgerSort.column = column;
            this.state.ledgerSort.direction = 'asc';
        }
        this.state.ledgerPagination.page = 1;
        this.render();
    }

    /**
     * Change la page affichée pour l'historique des encaissements.
     */
    setLedgerPage(page) {
        this.state.ledgerPagination.page = page;
        this.render();
    }

    /**
     * Change le nombre d'éléments affichés par page.
     */
    setLedgerLimit(limit) {
        this.state.ledgerPagination.limit = limit === 'all' ? 'all' : parseInt(limit);
        this.state.ledgerPagination.page = 1;
        this.render();
    }

    /**
     * Met à jour le filtre de date de l'historique des encaissements d'un utilisateur.
     */
    handleUserPaymentFilterChange(key, value) {
        this.state.userPaymentFilters[key] = value;
        this.state.userPaymentPagination.page = 1;
        this.render();
    }

    /** Change la page affichée pour l'historique d'un utilisateur */
    setUserPaymentPage(page) {
        this.state.userPaymentPagination.page = page;
        this.render();
    }

    /** Change la limite d'affichage pour l'historique d'un utilisateur */
    setUserPaymentLimit(limit) {
        this.state.userPaymentPagination.limit = limit === 'all' ? 'all' : parseInt(limit);
        this.state.userPaymentPagination.page = 1;
        this.render();
    }

    /**
     * Met à jour le filtre de date de l'historique des mouvements de cours d'un utilisateur.
     */
    handleUserCreditFilterChange(key, value) {
        this.state.userCreditFilters[key] = value;
        this.state.userCreditPagination.page = 1;
        this.render();
    }

    /** Change la page affichée pour l'historique des mouvements */
    setUserCreditPage(page) {
        this.state.userCreditPagination.page = page;
        this.render();
    }

    /** Change la limite d'affichage pour l'historique des mouvements */
    setUserCreditLimit(limit) {
        this.state.userCreditPagination.limit = limit === 'all' ? 'all' : parseInt(limit);
        this.state.userCreditPagination.page = 1;
        this.render();
    }

    /**
     * Met à jour le filtre de date des prochaines séances d'un utilisateur.
     */
    handleUserFutureSessionFilterChange(key, value) {
        this.state.userFutureSessionFilters[key] = value;
        this.state.userFutureSessionPagination.page = 1;
        this.render();
    }

    /** Change la page affichée pour les prochaines séances */
    setUserFutureSessionPage(page) {
        this.state.userFutureSessionPagination.page = page;
        this.render();
    }

    /** Change la limite d'affichage pour les prochaines séances */
    setUserFutureSessionLimit(limit) {
        this.state.userFutureSessionPagination.limit = limit === 'all' ? 'all' : parseInt(limit);
        this.state.userFutureSessionPagination.page = 1;
        this.render();
    }

    /**
     * Met à jour le filtre de date de l'historique des séances d'un utilisateur.
     */
    handleUserSessionFilterChange(key, value) {
        this.state.userSessionFilters[key] = value;
        this.state.userSessionPagination.page = 1;
        this.render();
    }

    /** Change la page affichée pour l'historique des séances */
    setUserSessionPage(page) {
        this.state.userSessionPagination.page = page;
        this.render();
    }

    /** Change la limite d'affichage pour l'historique des séances */
    setUserSessionLimit(limit) {
        this.state.userSessionPagination.limit = limit === 'all' ? 'all' : parseInt(limit);
        this.state.userSessionPagination.page = 1;
        this.render();
    }

    /**
     * Exporte les encaissements du livre de recettes au format Excel (.xlsx) natif.
     */
    async exportLedgerToXLSX() {
        let ledgerPurchases = (this.state.adminLedger || []).filter(t => t.type === 'purchase');
        
        const parseDate = (dStr) => { const [d, m, y] = dStr.split(' ')[0].split('/'); return `${y}-${m}-${d}`; };
        if (this.state.ledgerFilters.startDate) {
            ledgerPurchases = ledgerPurchases.filter(t => parseDate(t.date) >= this.state.ledgerFilters.startDate);
        }
        if (this.state.ledgerFilters.endDate) {
            ledgerPurchases = ledgerPurchases.filter(t => parseDate(t.date) <= this.state.ledgerFilters.endDate);
        }

        if (ledgerPurchases.length === 0) return this.showNotification("Aucune donnée à exporter.", "warning");

        this.showNotification("Génération du fichier Excel en cours...", "info");

        // Chargement dynamique de la librairie SheetJS pour créer un vrai XLSX
        if (typeof XLSX === 'undefined') {
            try {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            } catch (e) {
                return this.showNotification("Erreur lors du chargement de la librairie Excel.", "error");
            }
        }

        const data = ledgerPurchases.map(t => {
            const client = `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Client Supprimé';
            let productText = '';
            const isSub = t.amount >= 999 || (t.amount === 0 && t.description.toLowerCase().includes('abonnement'));
            const priceMatch = t.description.match(/\((\d+)€\)/);
            const price = priceMatch ? parseInt(priceMatch[1]) : 0;
            
            const descriptionWithoutPrice = t.description.replace(/\s*\(\d+€\)/, '');

            let pkg = null;
            if (isSub) {
                pkg = this.state.creditPackages.find(p => p.is_subscription && (price === 0 || p.price === price)) || this.state.creditPackages.find(p => p.is_subscription);
                productText = pkg ? (pkg.subtitle || pkg.name) : 'Abonnement';
            } else {
                pkg = this.state.creditPackages.find(p => p.credits === t.amount && (price === 0 || p.price === price)) || this.state.creditPackages.find(p => p.credits === t.amount && !p.is_subscription);
                productText = pkg ? (pkg.subtitle || pkg.name) : `${t.amount} cours`;
            }

            const priceTTC = price || 0;
            const priceHT = priceTTC > 0 ? Number((priceTTC / 1.2).toFixed(2)) : 0;
            const tva = priceTTC > 0 ? Number((priceTTC - (priceTTC / 1.2)).toFixed(2)) : 0;

            return {
                "Date": t.date,
                "Client": client,
                "Description": descriptionWithoutPrice,
                "Produit acheté": productText,
                "Montant HT (€)": priceHT,
                "TVA 20% (€)": tva,
                "Montant TTC (€)": priceTTC
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        
        // 1. Espacement intelligent des colonnes
        worksheet['!cols'] = [
            { wch: 18 }, // Date
            { wch: 25 }, // Client
            { wch: 50 }, // Description
            { wch: 25 }, // Produit acheté
            { wch: 15 }, // Montant HT
            { wch: 15 }, // TVA
            { wch: 15 }  // Montant TTC
        ];

        // 2. Activation des filtres et du tri sur les colonnes
        worksheet['!autofilter'] = { ref: `A1:G${data.length + 1}` };

        // 3. Stylisation de la ligne d'en-tête (Ligne 1)
        for (let C = 0; C <= 6; ++C) {
            const address = XLSX.utils.encode_col(C) + "1";
            if (worksheet[address]) {
                worksheet[address].s = {
                    fill: { fgColor: { rgb: "FF10B981" } }, // Vert émeraude
                    font: { color: { rgb: "FFFFFFFF" }, bold: true }, // Texte Blanc
                    alignment: { horizontal: "center", vertical: "center" }
                };
            }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Livre de recettes");
        
        XLSX.writeFile(workbook, `Livre_Recettes_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    /**
     * Exporte les encaissements du livre de recettes au format CSV lisible sous Excel.
     */
    exportLedgerToCSV() {
        let ledgerPurchases = (this.state.adminLedger || []).filter(t => t.type === 'purchase');
        
        const parseDate = (dStr) => { const [d, m, y] = dStr.split(' ')[0].split('/'); return `${y}-${m}-${d}`; };
        if (this.state.ledgerFilters.startDate) {
            ledgerPurchases = ledgerPurchases.filter(t => parseDate(t.date) >= this.state.ledgerFilters.startDate);
        }
        if (this.state.ledgerFilters.endDate) {
            ledgerPurchases = ledgerPurchases.filter(t => parseDate(t.date) <= this.state.ledgerFilters.endDate);
        }

        if (ledgerPurchases.length === 0) return this.showNotification("Aucune donnée à exporter.", "warning");

        // En-têtes du CSV (utilisation du point-virgule pour compatibilité Excel FR)
        let csvContent = "Date;Client;Description;Produit achete;Montant HT (€);TVA 20% (€);Montant TTC (€)\n";

        ledgerPurchases.forEach(t => {
            const client = `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Client Supprime';
            let productText = '';
            const isSub = t.amount >= 999 || (t.amount === 0 && t.description.toLowerCase().includes('abonnement'));
            const priceMatch = t.description.match(/\((\d+)€\)/);
            const price = priceMatch ? parseInt(priceMatch[1]) : 0;
            
            const descriptionWithoutPrice = t.description.replace(/\s*\(\d+€\)/, '');

            let pkg = null;
            if (isSub) {
                pkg = this.state.creditPackages.find(p => p.is_subscription && (price === 0 || p.price === price)) || this.state.creditPackages.find(p => p.is_subscription);
                productText = pkg ? (pkg.subtitle || pkg.name) : 'Abonnement';
            } else {
                pkg = this.state.creditPackages.find(p => p.credits === t.amount && (price === 0 || p.price === price)) || this.state.creditPackages.find(p => p.credits === t.amount && !p.is_subscription);
                productText = pkg ? (pkg.subtitle || pkg.name) : `${t.amount} cours`;
            }

            // Calculs comptables
            const priceTTC = price || 0;
            const priceHT = priceTTC > 0 ? (priceTTC / 1.2).toFixed(2).replace('.', ',') : '0';
            const tva = priceTTC > 0 ? (priceTTC - (priceTTC / 1.2)).toFixed(2).replace('.', ',') : '0';

            const escapeCsv = (str) => `"${String(str).replace(/"/g, '""')}"`;
            csvContent += `${escapeCsv(t.date)};${escapeCsv(client)};${escapeCsv(descriptionWithoutPrice)};${escapeCsv(productText)};${priceHT};${tva};${priceTTC.toFixed(2).replace('.', ',')}\n`;
        });

        // Ajout du BOM (Byte Order Mark) pour forcer Excel à lire le fichier en UTF-8 (gestion des accents)
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Livre_Recettes_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Génère et télécharge une facture PDF stylisée pour un achat donné.
     * @param {Object} t - L'objet de transaction (achat)
     * @param {Object} u - L'objet utilisateur (client)
     */
    async downloadInvoice(t, u) {
        if (!t || !u) return;
        this.showNotification("Génération de la facture en cours...", "info");

        // Chargement dynamique de la librairie de création PDF
        if (typeof html2pdf === 'undefined') {
            try {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            } catch (e) {
                return this.showNotification("Erreur lors du chargement du générateur PDF.", "error");
            }
        }

        const priceMatch = t.description.match(/\((\d+)€\)/);
        const priceTTC = priceMatch ? parseInt(priceMatch[1]) : 0;
        let descWithoutPrice = t.description.replace(/\s*\(\d+€\)/, '');

        const isSub = t.amount >= 999 || t.description.toLowerCase().includes('abonnement');
        let pkg = null;
        if (isSub) {
            pkg = this.state.creditPackages.find(p => p.is_subscription && (priceTTC === 0 || p.price === priceTTC)) || this.state.creditPackages.find(p => p.is_subscription);
        } else {
            pkg = this.state.creditPackages.find(p => p.credits === t.amount && (priceTTC === 0 || p.price === priceTTC)) || this.state.creditPackages.find(p => p.credits === t.amount && !p.is_subscription);
        }

        if (pkg && pkg.subtitle) {
            descWithoutPrice += `<br><span style="font-size: 12px; color: #10b981;">${pkg.subtitle}</span>`;
        }

        if (isSub && pkg && pkg.expires_in_days) {
            const days = pkg.expires_in_days;
            let durationStr = `${days} jours`;
            if (days === 365) durationStr = '1 an';
            else if (days >= 28 && days <= 31) durationStr = '1 mois';
            else if (days % 30 === 0) durationStr = `${days / 30} mois`;
            else if (days % 365 === 0) durationStr = `${days / 365} ans`;
            
            descWithoutPrice += `<br><span style="font-size: 12px; color: #666;">Durée : ${durationStr}</span>`;
        }

        const priceHT = priceTTC > 0 ? (priceTTC / 1.2).toFixed(2) : '0.00';
        const tvaAmount = priceTTC > 0 ? (priceTTC - (priceTTC / 1.2)).toFixed(2) : '0.00';

        // Sécurisation de la date pour Safari/iOS
        const tDate = new Date(t.date.replace(' ', 'T'));
        const dateStr = tDate.toLocaleDateString('fr-FR');
        const invoiceNum = `FACT-${tDate.getFullYear()}${(tDate.getMonth()+1).toString().padStart(2,'0')}${tDate.getDate().toString().padStart(2,'0')}-${t.id}`;

        const htmlContent = `
            <div style="box-sizing: border-box; padding: 30px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; width: 700px; background: white;">
                <!-- En-tête -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 40px;">
                    <div>
                        <h1 style="color: #10b981; font-size: 28px; font-weight: 300; margin: 0; letter-spacing: 2px;">L'ESPACE<b style="font-weight: 700;">DORÉ</b></h1>
                        <p style="margin: 5px 0 0; font-size: 12px; color: #666; line-height: 1.5;">
                            ${this.state.studioAddress}<br>
                            SIRET : ${this.state.studioSiret}<br>
                            N° TVA : ${this.state.studioTva}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <h2 style="font-size: 24px; font-weight: bold; margin: 0; color: #333;">FACTURE</h2>
                        <p style="margin: 5px 0 0; font-size: 14px;"><strong>N° ${invoiceNum}</strong></p>
                        <p style="margin: 5px 0 0; font-size: 14px;">Date : ${dateStr}</p>
                    </div>
                </div>
                <!-- Informations Client -->
                <div style="margin-bottom: 40px;">
                    <h3 style="font-size: 16px; font-weight: bold; color: #10b981; border-bottom: 1px solid #eee; padding-bottom: 5px; text-transform: uppercase;">Facturé à</h3>
                    <p style="margin: 10px 0 0; font-size: 14px; line-height: 1.5;">
                        <strong>${u.firstName || ''} ${u.lastName || ''}</strong><br>
                        ${u.email || ''}<br>
                        ${u.address ? u.address + '<br>' : ''}
                        ${u.zipCode || ''} ${u.city || ''}
                    </p>
                </div>
                <!-- Tableau des prestations -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 14px;">
                    <thead><tr style="background-color: #f0fdf4; color: #064e3b;"><th style="padding: 12px; text-align: left; border-bottom: 2px solid #10b981;">Description</th><th style="padding: 12px; text-align: center; border-bottom: 2px solid #10b981;">Qté</th><th style="padding: 12px; text-align: right; border-bottom: 2px solid #10b981;">P.U HT</th><th style="padding: 12px; text-align: right; border-bottom: 2px solid #10b981;">TVA (20%)</th><th style="padding: 12px; text-align: right; border-bottom: 2px solid #10b981;">Total TTC</th></tr></thead>
                    <tbody><tr><td style="padding: 12px; border-bottom: 1px solid #eee;">${descWithoutPrice}</td><td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">1</td><td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${priceHT} €</td><td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${tvaAmount} €</td><td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;"><strong>${priceTTC.toFixed(2)} €</strong></td></tr></tbody>
                </table>
                <!-- Totaux -->
                <div style="display: flex; justify-content: flex-end;">
                    <table style="width: 300px; font-size: 14px; border-collapse: collapse;">
                        <tr><td style="padding: 5px 12px; text-align: left;">Total HT</td><td style="padding: 5px 12px; text-align: right;">${priceHT} €</td></tr>
                        <tr><td style="padding: 5px 12px; text-align: left;">TVA (20%)</td><td style="padding: 5px 12px; text-align: right;">${tvaAmount} €</td></tr>
                        <tr style="font-size: 18px; font-weight: bold; color: #10b981;"><td style="padding: 10px 12px; text-align: left; border-top: 2px solid #10b981;">Total TTC</td><td style="padding: 10px 12px; text-align: right; border-top: 2px solid #10b981;">${priceTTC.toFixed(2)} €</td></tr>
                    </table>
                </div>
                <!-- Pied de page légal -->
                <div style="margin-top: 80px; padding-top: 20px; border-top: 1px solid #eee; font-size: 10px; color: #999; text-align: center; line-height: 1.4;">
                    La facture est payable à réception. En cas de retard de paiement, une pénalité fixée à 3 fois le taux d'intérêt légal sera appliquée,<br>ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 euros.<br>
                    Dispensé d'escompte pour paiement anticipé.
                </div>
            </div>
        `;

        const opt = { margin: 10, filename: `Facture_${invoiceNum}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
        
        // En passant directement la chaîne HTML, html2pdf l'isole parfaitement sans subir les bugs d'affichage de la page
        html2pdf().set(opt).from(htmlContent).save().then(() => {
            this.showNotification("Facture téléchargée avec succès !");
        }).catch((err) => {
            console.error("Erreur de génération PDF:", err);
        });
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
    /**
     * Affiche une notification (toast).
     * @param {string} message - Le texte à afficher.
     * @param {string} type - 'success', 'error', 'info', 'warning'.
     * @param {HTMLElement|Event} target - L'élément ou l'événement pour positionner le toast au-dessus.
     */
    showNotification(message, type = 'success', target = null) {
        let position = null;
        if (target) {
            let el = null;
            if (target instanceof HTMLElement) el = target;
            else if (target.submitter) el = target.submitter;
            else if (target.target && target.target instanceof HTMLElement) el = target.target;

            if (el && typeof el.getBoundingClientRect === 'function') {
                const rect = el.getBoundingClientRect();
                position = {
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                };
            }
        }
        this.state.notification = { message, type, visible: true, position };
        
        // On ne fait pas un render() complet pour ne pas faire sauter l'interface (scroll, focus)
        // On met à jour uniquement le composant de notification
        renderNotification(this);
        
        // On nettoie l'ancien timer s'il existait
        if (this.notificationTimer) clearTimeout(this.notificationTimer);
        
        this.notificationTimer = setTimeout(() => {
            this.state.notification.visible = false;
            renderNotification(this);
            this.notificationTimer = null;
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
                cancelText: options.cancelText !== undefined ? options.cancelText : 'Annuler',
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
    async updateAllPackages(e) { await userService.updateAllPackages(this, e); }
    async createPackage(e) { await userService.createPackage(this, e); }

    async deleteAccount(userId, isAdmin = false) { await userService.deleteAccount(this, userId, isAdmin); }

    async resendVerificationCode() { await authService.resendVerificationCode(this); }

    cancelRegistrationVerification() { authService.cancelRegistrationVerification(this); }

    renderAuthView() {
        const mainContainer = document.getElementById('main');
        const v = this.state.view;
        if (mainContainer && (v === 'connexion' || v === 'inscription' || v === 'reset-password')) {
            let html = authView(this, v);
            
            // Évite de rejouer les animations si on est déjà sur la même vue (ex: après une notification)
            if (v === this.lastView) {
                html = html.replace(/animate-(fade-in|slide-up|bounce|pulse)/g, ' ');
            }
            
            mainContainer.innerHTML = html;
            authService.attachAuthEvents(this, v);
        }
    }

    async viewUser(userId) { await userService.viewUser(this, userId); }

    async adjustUserCredits(e, userId) { await userService.adjustUserCredits(this, e, userId); }
    async promptRemoveSpecificCredits(userId, maxCredits, batchIds) { await userService.promptRemoveSpecificCredits(this, userId, maxCredits, batchIds); }
    async removeSpecificCredits(userId, amount, batchIds) { await userService.removeSpecificCredits(this, userId, amount, batchIds); }
    async sendUserMessage(e, userId) { await userService.sendUserMessage(this, e, userId); }
    async toggleUserRole(userId, currentRole) { await userService.toggleUserRole(this, userId, currentRole); }
    async toggleSubscription(e, userId, currentStatus) { await userService.toggleSubscription(this, e, userId, currentStatus); }
    async askAi() { await aiService.askAi(this); }
    handleUserSearch(query) {
        this.state.userSearchQuery = query;
        this.render();
    }
    async deleteClass(id) { await classService.cancelBookingByUser(this, id); }
    async adminCancelBookingForUser(e, classId, userId) { await classService.adminCancelBookingForUser(this, e, classId, userId); }
    async adminDeleteClass(e, id) { await classService.adminDeleteClass(this, e, id); }
    async editClassCapacity(id, capacity) { await classService.editClassCapacity(this, id, capacity); }
    async adminBulkDeleteClasses() { await classService.adminBulkDeleteClasses(this); }
    async generateAdminDescription() { await aiService.generateAdminDescription(this); }
    async submitAddClass(e) { await classService.submitAddClass(this, e); }
    applyTemplate() { classService.applyTemplate(this); }
    editTemplate(id) { classService.editTemplate(this, id); }
    cancelEditTemplate() { classService.cancelEditTemplate(this); }
    async deleteTemplate(id) { await classService.deleteTemplate(this, id); }
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
                'le-studio': studioView,
                profil: profileView,
                tarifs: creditsView,
                contact: contactView,
                planning: scheduleView,
                'paiement-succes': paymentSuccessView,
                administration: adminView,
                'mentions-legales': (app) => legalView(app, 'mentions-legales'),
                'politique-confidentialite': (app) => legalView(app, 'politique-confidentialite'),
                'cgv': (app) => legalView(app, 'cgv'),
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
        renderNotification(this);
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
                    // Forcer la réinitialisation si le DOM a été écrasé
                    if (this.state.quill && !editorContainer.classList.contains('ql-container')) {
                        this.state.quill = null;
                    }
                    if (!this.state.quill) {
                        this.state.quill = new Quill('#nl-editor', { theme: 'snow', placeholder: 'Rédigez...' });
                        if (this.state.newsletterContent) this.state.quill.root.innerHTML = this.state.newsletterContent;
                        this.state.quill.on('text-change', () => { this.state.newsletterContent = this.state.quill.root.innerHTML; });
                    }
                }
            }
            if (this.state.adminTab === 'user_details') {
                const userEditor = document.getElementById('user-message-editor');
                if (userEditor) {
                    // Forcer la réinitialisation si le DOM a été écrasé (ex: lors d'un re-render des infos client)
                    if (this.state.adminUserQuill && !userEditor.classList.contains('ql-container')) {
                        this.state.adminUserQuill = null;
                    }
                    if (!this.state.adminUserQuill) {
                        this.state.adminUserQuill = new Quill('#user-message-editor', { theme: 'snow' });
                        if (this.state.adminUserMessageContent) {
                            this.state.adminUserQuill.root.innerHTML = this.state.adminUserMessageContent;
                        }
                        this.state.adminUserQuill.on('text-change', () => { this.state.adminUserMessageContent = this.state.adminUserQuill.root.innerHTML; });
                    }
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
