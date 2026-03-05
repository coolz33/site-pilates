/**
 * @file app.js
 * @description Moteur principal de l'application Pilates.
 * Gère l'état (State), le rendu (Rendering), les appels API et l'IA.
 */

import { icons } from './js/icons.js';
import { API_URL, callGemini } from './js/api.js';
import { homeView } from './js/views/home.js';
import { aboutView } from './js/views/about.js';
import { profileView } from './js/views/profile.js';
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
            editingTemplateId: null,
            notification: { message: '', type: 'success', visible: false },
            courseTemplates: [],
            creditPackages: [],
            studioAddress: '',
            studioPhone: '',
            studioEmail: ''
        };
    }

    /**
     * Initialise l'application au chargement de la page.
     * Récupère la session utilisateur et les données depuis l'API.
     */
    async init() {
        try {
            // Gestion du routage via le hash de l'URL (ex: #schedule)
            const handleHashRoute = () => {
                const view = window.location.hash.replace('#', '') || 'accueil';
                this.state.view = view;
                this.state.isMenuOpen = false;
                this.state.aiResponse = '';
                window.scrollTo(0, 0);
                this.render();
            };

            // Écouter les changements d'URL (boutons précédent/suivant du navigateur ou liens)
            window.addEventListener('hashchange', handleHashRoute);
            
            // Définir la vue initiale selon l'URL actuelle au chargement de la page
            const initialView = window.location.hash.replace('#', '') || 'accueil';
            this.state.view = initialView;

            const savedUser = localStorage.getItem('pilates_user');
            if (savedUser) {
                this.state.currentUser = JSON.parse(savedUser);
            }
            
            const resSettings = await fetch(`${API_URL}/settings`);
            const settings = await resSettings.json();
            this.state.studioAddress = settings.studioAddress;
            this.state.studioPhone = settings.studioPhone;
            this.state.studioEmail = settings.studioEmail;

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

    /** 
     * Déconnecte l'utilisateur et nettoie le stockage local.
     */
    logout() {
        this.state.currentUser = null;
        localStorage.removeItem('pilates_user');
        this.navigate('accueil');
    }

    /** 
     * Navigue d'une semaine en avant ou en arrière dans le planning.
     * @param {number} offset - Nombre de semaines à ajouter/soustraire.
     */
    changeWeek(offset) {
        const newDate = new Date(this.state.currentDate);
        newDate.setDate(newDate.getDate() + (offset * 7));
        this.state.currentDate = newDate;
        this.render();
    }

    /** 
     * Saute à une date spécifique via le sélecteur de date.
     * @param {string} dateString - Date au format YYYY-MM-DD.
     */
    jumpToDate(dateString) {
        if (!dateString) return;
        const [year, month, day] = dateString.split('-').map(Number);
        this.state.currentDate = new Date(year, month - 1, day);
        this.render();
    }

    /**
     * Gère le clic sur le bouton de réservation d'un cours.
     * @param {number} classId - L'identifiant du cours.
     */
    initiateBooking(classId) {
        if (!this.state.currentUser) {
            this.navigate('connexion');
            return;
        }
        const cls = this.state.classes.find(c => c.id === classId);
        const isBooked = cls.bookedUsers.includes(this.state.currentUser.id);

        if (isBooked) {
            fetch(`${API_URL}/classes/cancel/${cls.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: this.state.currentUser.id })
            }).then(() => this.init());
        } else if (cls.bookedUsers.length < cls.capacity) {
            this.state.selectedClassForPayment = cls;
            this.state.paymentMethod = 'card';
            this.state.showPaymentModal = true;
            this.render();
        }
    }

    /** 
     * Finalise la réservation après le tunnel de paiement (simulé).
     */
    async confirmPayment(e) {
        e.preventDefault();
        const cls = this.state.selectedClassForPayment;
        if (cls && cls.bookedUsers.length < cls.capacity) {
            try {
                const endpoint = this.state.paymentMethod === 'credits' ? `/classes/book-credits/${cls.id}` : `/classes/book/${cls.id}`;
                const res = await fetch(`${API_URL}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: this.state.currentUser.id })
                });
                const data = await res.json();
                if (data.success) {
                    if (data.user) this.state.currentUser = data.user;
                    this.showNotification("Réservation confirmée !");
                } else {
                    this.showNotification(data.message, 'error');
                }
            } catch (err) { this.showNotification("Erreur lors de la réservation", 'error'); }
        }
        this.state.showPaymentModal = false;
        this.state.selectedClassForPayment = null;
        this.init();
    }

    /** Ferme le modal de paiement sans réserver */
    cancelPayment() {
        this.state.showPaymentModal = false;
        this.state.selectedClassForPayment = null;
        this.render();
    }

    /** 
     * Simule l'envoi d'un email groupé aux clients.
     */
    sendNewsletter(e) {
        e.preventDefault();
        const subject = document.getElementById('nl-subject').value;
        const message = document.getElementById('nl-message').value;
        const clients = this.state.users.filter(u => u.role !== 'admin');

        if (clients.length === 0) return this.showNotification("Aucun client inscrit.", 'error');
        if (!subject || !message) {
            return this.showNotification("Veuillez remplir tous les champs.", 'error');
        }

        this.showNotification(`Newsletter envoyée à ${clients.length} abonné(s) !`);
        document.getElementById('nl-subject').value = '';
        document.getElementById('nl-message').value = '';
    }

    /** 
     * Enregistre les modifications du profil utilisateur.
     */
    async updateProfile(e) {
        e.preventDefault();
        const password = document.getElementById('prof-password').value;
        const confirmPassword = document.getElementById('prof-confirm-password').value;
        const email = document.getElementById('prof-email').value;
        const phone = document.getElementById('prof-phone').value;

        if (!this.validateEmail(email)) return this.showNotification("Email invalide.", 'error');
        if (phone && !this.validatePhone(phone)) return this.showNotification("Téléphone invalide.", 'error');

        const userData = {
            id: this.state.currentUser.id,
            firstName: document.getElementById('prof-firstname').value,
            lastName: document.getElementById('prof-lastname').value,
            email: email,
            password: "",
            address: document.getElementById('prof-address').value,
            phone: phone,
            zipCode: document.getElementById('prof-zipcode').value,
            city: document.getElementById('prof-city').value
        };

        let passwordUpdated = false;
        if (confirmPassword.trim() !== "") {
            if (password !== confirmPassword) return this.showNotification("Mots de passe différents.", 'error');
            if (!this.validatePassword(password)) return this.showNotification("Mot de passe trop court.", 'error');
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
                this.state.currentUser = data.user;
                localStorage.setItem('pilates_user', JSON.stringify(data.user));
                this.showNotification(passwordUpdated ? "Profil et mot de passe mis à jour !" : "Modifications enregistrées");
                document.getElementById('prof-password').value = "";
                document.getElementById('prof-confirm-password').value = "";
            } else {
                this.showNotification(data.message || "Erreur", 'error');
            }
        } catch (err) { this.showNotification("Erreur serveur", 'error'); }
    }

    /** 
     * Ajoute des crédits au compte de l'utilisateur.
     * @param {Object} pkg - Le pack de crédits sélectionné.
     */
    async buyCredits(pkg) {
        if (!confirm(`Acheter ${pkg.name} ?`)) return;
        const res = await fetch(`${API_URL}/credits/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: this.state.currentUser.id, credits: pkg.credits })
        });
        const data = await res.json();
        if (data.success) {
            this.state.currentUser.credits_balance = data.credits_balance;
            this.showNotification("Crédits ajoutés !");
            this.render();
        }
    }

    /** 
     * Met à jour les informations de contact du studio (Admin).
     */
    async updateStudioSettings(e) {
        e.preventDefault();
        const settings = {
            studioAddress: document.getElementById('admin-studio-address').value,
            studioPhone: document.getElementById('admin-studio-phone').value,
            studioEmail: document.getElementById('admin-studio-email').value
        };
        await fetch(`${API_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        this.showNotification('Paramètres mis à jour.');
        this.init();
    }

    /** 
     * Interroge l'IA pour conseiller un cours à l'élève selon ses besoins.
     */
    async askAi() {
        const promptInput = document.getElementById('ai-prompt').value;
        if (!promptInput.trim()) return;
        this.state.isAiLoading = true;
        this.render();

        const date = new Date(this.state.currentDate);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(date.setDate(diff));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const availableClasses = this.state.classes
            .filter(c => {
                const cDate = new Date(c.date);
                return cDate >= startOfWeek && cDate <= endOfWeek;
            })
            .map(c => `- ${c.title} le ${new Date(c.date).toLocaleDateString('fr-FR', { weekday: 'long' })} à ${c.time} (${c.duration}min) : ${c.description || 'Cours de Pilates'}`)
            .join('\n');

        const fullPrompt = `Tu es un coach de Pilates bienveillant et professionnel. Voici les cours au planning cette semaine dans notre studio :\n${availableClasses}\n\nUn élève te dit : "${promptInput}".\nEn une seule phrase courte et chaleureuse, conseille-lui le cours le plus pertinent de la liste en expliquant rapidement pourquoi. Si aucun cours ne correspond vraiment, propose-lui un cours au hasard en douceur. Ne mets pas de texte en gras.`;

        this.state.aiResponse = await callGemini(fullPrompt);
        this.state.isAiLoading = false;
        this.render();
    }

    /** 
     * Supprime une séance du planning (Admin).
     * @param {number} id - L'identifiant de la séance.
     */
    async deleteClass(id) {
        if (confirm("Voulez-vous vraiment supprimer ce cours ?")) {
            await fetch(`${API_URL}/classes/${id}`, { method: 'DELETE' });
            this.init();
        }
    }

    /** 
     * Utilise l'IA pour rédiger une description de cours attrayante (Admin).
     */
    async generateAdminDescription() {
        const title = document.getElementById('template-title').value;
        if (!title) {
            this.showNotification("Saisissez un titre.", 'error');
            return;
        }

        const btn = document.getElementById('btn-generate-desc');
        btn.innerHTML = 'Génération...';
        btn.disabled = true;

        const prompt = `Agis comme le gérant d'un studio de Pilates moderne. Rédige une description très courte (1 ou 2 phrases maximum) pour un cours qui s'appelle "${title}". Le ton doit être professionnel, apaisant et donner envie de s'inscrire. Ne mets pas de guillemets.`;
        const desc = await callGemini(prompt);

        document.getElementById('template-desc').value = desc;
        btn.innerHTML = "✨ Suggérer avec l'IA";
        btn.disabled = false;
    }

    /** 
     * Enregistre une nouvelle séance dans le planning (Admin).
     */
    async submitAddClass(e) {
        e.preventDefault();
        const title = document.getElementById('planning-title').value;
        const date = document.getElementById('planning-date').value;
        const time = document.getElementById('planning-time').value;

        if (!title) return this.showNotification("Veuillez choisir un modèle de cours.", "error");
        if (!date || !time) return this.showNotification("Veuillez saisir une date et une heure.", "error");

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
        this.showNotification("Séance ajoutée.");
        this.init();
    }

    /** 
     * Remplit le formulaire de séance à partir d'un modèle existant (Admin).
     */
    applyTemplate() {
        const templateId = document.getElementById('planning-template-select').value;
        if (!templateId) return;
        const t = this.state.courseTemplates.find(x => x.id == templateId);
        if (!t) return;
        document.getElementById('planning-title').value = t.title;
        document.getElementById('planning-desc').value = t.description;
        document.getElementById('planning-duration').value = t.duration;
        document.getElementById('planning-price').value = t.default_price;
        document.getElementById('planning-credits-price').value = t.default_credits_price || 1;
    }

    /** 
     * Charge un modèle dans le formulaire d'édition (Admin).
     * @param {number} id - L'identifiant du modèle.
     */
    editTemplate(id) {
        this.state.editingTemplateId = id;
        this.render();
    }

    /** Annule l'édition d'un modèle */
    cancelEditTemplate() {
        this.state.editingTemplateId = null;
        this.render();
    }

    /** 
     * Crée ou met à jour un modèle de cours dans le catalogue (Admin).
     */
    async saveAsTemplate() {
        const template = {
            title: document.getElementById('template-title').value,
            description: document.getElementById('template-desc').value,
            duration: parseInt(document.getElementById('template-duration').value) || 0,
            default_price: parseInt(document.getElementById('template-price').value) || 0,
            default_credits_price: parseInt(document.getElementById('template-credits-price').value) || 1
        };

        const id = this.state.editingTemplateId;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/course-templates/${id}` : `${API_URL}/course-templates`;

        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template)
        });

        this.showNotification(id ? "Modèle mis à jour !" : "Modèle sauvegardé !");
        this.state.editingTemplateId = null;
        await this.init();
    }

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
            this.attachAuthEvents(v);
        } else {
            const viewMap = {
                accueil: homeView,
                'a-propos': aboutView,
                profil: profileView,
                contact: contactView,
                planning: scheduleView,
                administration: adminView
            };
            mainContainer.innerHTML = viewMap[v] ? viewMap[v](this) : '';
        }

        renderPaymentModal(this, mainContainer);
    }

    /** 
     * Gère la soumission des formulaires d'authentification.
     */
    attachAuthEvents(mode) {
        const form = document.getElementById('auth-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;

            if (mode === 'connexion') {
                try {
                    const res = await fetch(`${API_URL}/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });
                    const data = await res.json();
                    if (data.success) {
                        this.state.currentUser = data.user;
                        localStorage.setItem('pilates_user', JSON.stringify(data.user));
                        this.init();
                        this.navigate('planning');
                    } else {
                        this.showNotification(data.message || 'Email ou mot de passe incorrect.', 'error');
                    }
                } catch (err) { this.showNotification("Erreur de connexion", 'error'); }
            } else {
                const firstName = document.getElementById('auth-firstname').value;
                const lastName = document.getElementById('auth-lastname').value;
                const address = document.getElementById('auth-address').value;
                const phone = document.getElementById('auth-phone').value;
                const zipCode = document.getElementById('auth-zipcode').value;
                const city = document.getElementById('auth-city').value;
                const confirmPassword = document.getElementById('auth-confirm-password').value;

                // Validations
                if (!this.validateEmail(email)) return this.showNotification("Email invalide.", 'error');
                if (!this.validatePhone(phone)) return this.showNotification("Téléphone invalide.", 'error');
                if (!this.validatePassword(password)) return this.showNotification("Mot de passe trop court.", 'error');
                if (password !== confirmPassword) return this.showNotification("Mots de passe différents.", 'error');
                if (!firstName || !lastName) return this.showNotification("Nom/Prénom obligatoires.", 'error');

                try {
                    const res = await fetch(`${API_URL}/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ firstName, lastName, email, password, address, phone, zipCode, city })
                    });
                    const data = await res.json();
                    if (data.success) {
                        this.state.currentUser = data.user;
                        localStorage.setItem('pilates_user', JSON.stringify(data.user));
                        this.init();
                        this.navigate('planning');
                    } else {
                        this.showNotification(data.message || 'Erreur inscription.', 'error');
                    }
                } catch (err) { this.showNotification("Erreur inscription.", 'error'); }
            }
        });
    }
}

/** Instanciation et démarrage de l'application */
window.app = new PilatesApp();
window.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});
