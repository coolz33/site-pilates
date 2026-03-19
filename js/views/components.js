import { icons } from '../icons.js';

/**
 * @file components.js
 * @description Composants d'interface utilisateur globaux (Navbar, Footer, Modales).
 * Construits dynamiquement avec Bootstrap 5 et le CSS personnalisé.
 */

/**
 * Génère et injecte la barre de navigation principale dans le DOM.
 * @param {PilatesApp} app - L'instance principale de l'application.
 */
export const renderNavbar = (app) => {
    const st = app.state;
    const navHtml = `
        <nav class="custom-navbar sticky-top">
            <div class="container-fluid px-3 px-md-4">
                <div class="d-flex justify-content-between align-items-center" style="height: 5rem;">
                    <!-- Logo -->
                    <div class="d-flex align-items-center cursor-pointer" onclick="app.navigate('accueil')">
                        <span class="fs-4 fw-light text-emerald tracking-wider">L'ESPACE<span class="fw-bold">DORÉ</span></span>
                    </div>
                    
                    <!-- Liens Bureau -->
                    <div class="d-none d-md-flex align-items-center gap-4">
                        <button onclick="app.navigate('accueil')" class="btn btn-link text-decoration-none custom-nav-link d-flex align-items-center gap-2 ${st.view === 'accueil' ? 'active' : ''}">${icons.home} Accueil</button>
                        <button onclick="app.navigate('a-propos')" class="btn btn-link text-decoration-none custom-nav-link d-flex align-items-center gap-2 ${st.view === 'a-propos' ? 'active' : ''}">${icons.sparkles} Le Pilates</button>
                        <button onclick="app.navigate('tarifs')" class="btn btn-link text-decoration-none custom-nav-link d-flex align-items-center gap-2 ${st.view === 'tarifs' ? 'active' : ''}">${icons.creditCard} Tarifs</button>
                        <button onclick="app.navigate('planning')" class="btn btn-link text-decoration-none custom-nav-link d-flex align-items-center gap-2 ${st.view === 'planning' ? 'active' : ''}">${icons.calendar} Planning & Réservation</button>
                        <button onclick="app.navigate('contact')" class="btn btn-link text-decoration-none custom-nav-link d-flex align-items-center gap-2 ${st.view === 'contact' ? 'active' : ''}">${icons.mail} Contact</button>
                    </div>
                    
                    <!-- Actions Droite -->
                    <div class="d-flex align-items-center gap-3">
                        <!-- Theme Switcher -->
                        <button onclick="app.toggleTheme(this)" class="btn btn-link text-muted p-2 rounded-circle hover-bg-light transition-colors">
                            ${st.theme === 'light' ? icons.moon : icons.sun}
                        </button>
                        
                        <!-- Espace Auth Bureau -->
                        <div class="d-none d-md-flex align-items-center ps-3 border-start">
                            ${st.currentUser ? `
                            <div class="d-flex align-items-center gap-3">
                                <button onclick="app.navigate('profil')" class="btn btn-link text-decoration-none custom-nav-link d-flex align-items-center gap-2 ${st.view === 'profil' ? 'active' : ''}" style="font-size: 0.875rem; --bs-btn-padding-x: 0.3rem;">
                                    ${icons.user} ${st.currentUser.firstName} <span class="badge badge-emerald ms-1">${st.currentUser.credits_balance || 0}</span>
                                </button>
                                ${st.currentUser.role === 'admin' ? `<button onclick="app.navigate('administration')" class="btn btn-link text-decoration-none custom-nav-link d-flex align-items-center gap-2 ${st.view === 'administration' ? 'active text-decoration-underline' : ''}" style="font-size: 0.85rem; --bs-btn-padding-x: 0.3rem;">${icons.settings} Administration</button>` : ''}
                                <button onclick="app.logout()" class="btn btn-link text-danger text-decoration-none" style="font-size: 0.85rem; --bs-btn-padding-x: 0.3rem;">Déconnexion</button>
                            </div>` : `
                            <div class="d-flex align-items-center gap-2">
                                <button onclick="app.navigate('connexion')" class="btn btn-link text-decoration-none custom-nav-link" style="font-size: 0.85rem; --bs-btn-padding-x: 0.3rem;">Connexion</button>
                                <button onclick="app.navigate('inscription')" class="btn btn-emerald rounded-pill py-1" style="font-size: 0.85rem; --bs-btn-padding-x: 0.3rem;">S'inscrire</button>
                            </div>`}
                        </div>
                        
                        <!-- Toggle Menu Mobile -->
                        <div class="d-flex align-items-center d-md-none">
                            <button onclick="app.toggleMenu()" class="btn btn-link text-muted p-1">${st.isMenuOpen ? icons.close : icons.menu}</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Menu Déroulant Mobile -->
            ${st.isMenuOpen ? `
            <div class="d-md-none mobile-menu px-3 py-3 d-flex flex-column gap-2">
                <button onclick="app.navigate('accueil')" class="btn mobile-nav-btn d-flex align-items-center gap-3 ${st.view === 'accueil' ? 'active' : ''}">${icons.home} Accueil</button>
                <button onclick="app.navigate('a-propos')" class="btn mobile-nav-btn d-flex align-items-center gap-3 ${st.view === 'a-propos' ? 'active' : ''}">${icons.sparkles} Le Pilates</button>
                <button onclick="app.navigate('tarifs')" class="btn mobile-nav-btn d-flex align-items-center gap-3 ${st.view === 'tarifs' ? 'active' : ''}">${icons.creditCard} Tarifs</button>
                <button onclick="app.navigate('planning')" class="btn mobile-nav-btn d-flex align-items-center gap-3 ${st.view === 'planning' ? 'active' : ''}">${icons.calendar} Planning & Réservation</button>
                <button onclick="app.navigate('contact')" class="btn mobile-nav-btn d-flex align-items-center gap-3 ${st.view === 'contact' ? 'active' : ''}">${icons.mail} Contact</button>
                <div class="border-top pt-2 mt-2">
                    ${st.currentUser ? `
                        <button onclick="app.navigate('profil')" class="btn mobile-nav-btn d-flex align-items-center gap-3 ${st.view === 'profil' ? 'active' : ''}">${icons.user} Mon Profil (${st.currentUser.firstName} : ${st.currentUser.credits_balance || 0} )</button>
                        ${st.currentUser.role === 'admin' ? `<button onclick="app.navigate('administration')" class="btn mobile-nav-btn text-emerald d-flex align-items-center gap-3 ${st.view === 'administration' ? 'active' : ''}">${icons.settings} Administration</button>` : ''}
                        <button onclick="app.logout()" class="btn mobile-nav-btn text-danger">Déconnexion</button>
                    ` : `
                        <button onclick="app.navigate('connexion')" class="btn mobile-nav-btn">Connexion</button>
                        <button onclick="app.navigate('inscription')" class="btn mobile-nav-btn text-emerald">S'inscrire</button>
                    `}
                </div>
            </div>` : ''}
        </nav>`;
    document.getElementById('navbar').innerHTML = navHtml;
};

/**
 * Génère et injecte le pied de page dans le DOM.
 * @param {PilatesApp} app - L'instance principale de l'application.
 */
export const renderFooter = (app) => {
    const year = new Date().getFullYear();
    document.getElementById('footer').innerHTML = `
        <footer class="custom-footer pt-5 pb-3">
            <div class="container" style="max-width: 1200px;">
                <div class="row g-4 mb-4">
                    
                    <!-- 1. Branding & Réseaux Sociaux -->
                    <div class="col-12 col-md-6 col-lg-3 d-flex flex-column gap-3">
                        <div class="d-flex align-items-center gap-3 cursor-pointer" onclick="app.navigate('accueil')">
                            <div class="icon-circle bg-emerald-light text-emerald-dark">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z"/><path d="M12 22V12"/></svg>
                            </div>
                            <span class="fs-5 fw-light text-emerald tracking-wider">L'ESPACE<span class="fw-bold">DORÉ</span></span>
                        </div>
                        <p class="small text-stone-500 mb-0">
                            Votre espace de bien-être dédié au mouvement en conscience, pour renforcer le corps et apaiser l'esprit.
                        </p>
                        <div class="d-flex gap-2">
                            ${app.state.studioInstagram ? `<a href="${app.state.studioInstagram}" target="_blank" rel="noopener noreferrer" class="social-btn" title="Instagram"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>` : ''}
                            ${app.state.studioFacebook ? `<a href="${app.state.studioFacebook}" target="_blank" rel="noopener noreferrer" class="social-btn" title="Facebook"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>` : ''}
                            ${app.state.studioTiktok ? `<a href="${app.state.studioTiktok}" target="_blank" rel="noopener noreferrer" class="social-btn" title="TikTok"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg></a>` : ''}
                        </div>
                    </div>

                    <!-- 2. Plan du site -->
                    <div class="col-12 col-md-6 col-lg-3">
                        <h4 class="fs-6 fw-medium mb-3 text-uppercase tracking-wider">Plan du site</h4>
                        <ul class="list-unstyled small d-flex flex-column gap-1">
                            <li><button onclick="app.navigate('accueil')" class="footer-link"><span class="text-emerald">→</span> Accueil</button></li>
                            <li><button onclick="app.navigate('a-propos')" class="footer-link"><span class="text-emerald">→</span> Le Pilates</button></li>
                            <li><button onclick="app.navigate('tarifs')" class="footer-link"><span class="text-emerald">→</span> Tarifs & Packs</button></li>
                            <li><button onclick="app.navigate('planning')" class="footer-link"><span class="text-emerald">→</span> Planning & Réservation</button></li>
                            <li><button onclick="app.navigate('contact')" class="footer-link"><span class="text-emerald">→</span> Nous contacter</button></li>
                            ${!app.state.currentUser ? `
                                <li><button onclick="app.navigate('connexion')" class="footer-link"><span class="text-emerald">→</span> Espace Client</button></li>
                            ` : `
                                <li><button onclick="app.navigate('profil')" class="footer-link"><span class="text-emerald">→</span> Mon Profil</button></li>
                            `}
                        </ul>
                    </div>

                    <!-- 3. Coordonnées -->
                    <div class="col-12 col-md-6 col-lg-3">
                        <h4 class="fs-6 fw-medium mb-3 text-uppercase tracking-wider">Nous trouver</h4>
                        <ul class="list-unstyled small d-flex flex-column gap-1">
                            <li class="d-flex align-items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald mt-1"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                <span>${app.state.studioAddress}</span>
                            </li>
                            <li class="d-flex align-items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                <a href="tel:${app.state.studioPhone.replace(/\s/g, '')}" class="footer-link p-0">${app.state.studioPhone}</a>
                            </li>
                            <li class="d-flex align-items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                                <a href="mailto:${app.state.studioEmail}" class="footer-link p-0 text-decoration-underline">${app.state.studioEmail}</a>
                            </li>
                        </ul>
                    </div>

                    <!-- 4. Légal -->
                    <div class="col-12 col-md-6 col-lg-3">
                        <h4 class="fs-6 fw-medium mb-3 text-uppercase tracking-wider">Informations Légales</h4>
                        <ul class="list-unstyled small d-flex flex-column gap-1">
                            <li><button onclick="app.navigate('mentions-legales')" class="footer-link"><span class="text-muted">→</span> Mentions Légales</button></li>
                            <li><button onclick="app.navigate('politique-confidentialite')" class="footer-link"><span class="text-muted">→</span> Politique de Confidentialité</button></li>
                        </ul>
                    </div>
                </div>
                
                <!-- Copyright Footer Bottom -->
                <div class="pt-3 border-top d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 text-muted small" style="font-size: 0.75rem;">
                    <p class="mb-0">© ${year} L'espace doré. Tous droits réservés.</p>
                    <p class="mb-0 d-flex align-items-center gap-1">Fait avec <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="text-success"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> pour la vitalité</p>
                </div>
            </div>
        </footer>`;
};

/**
 * Génère le HTML pour une notification. (Méthode de compatibilité/réserve)
 * @param {PilatesApp} app - L'instance principale de l'application.
 * @returns {string} Chaîne vide
 */
export const getNotificationHtml = (app) => {
    return '';
};

/**
 * Affiche ou masque la fenêtre modale de paiement / réservation.
 * Si elle n'existe pas dans le DOM, elle est instanciée dynamiquement.
 * @param {PilatesApp} app - L'instance principale de l'application.
 * @param {HTMLElement} [container] - Conteneur cible (optionnel, ajouté au body par défaut).
 */
export const renderPaymentModal = (app, container) => {
    let modal = document.getElementById('payment-modal');

    if (!app.state.showPaymentModal || !app.state.selectedClassForPayment) {
        if (modal) modal.remove(); // Supprime le modal s'il ne doit plus être affiché
        return;
    }

    // Si le modal doit être affiché mais n'existe pas, on le crée
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'payment-modal'; // Assigne un ID pour pouvoir le cibler et le supprimer
        document.body.appendChild(modal); // Attache au body pour qu'il persiste
    }

        const cls = app.state.selectedClassForPayment;
        const userBalance = app.state.currentUser.credits_balance || 0;
        const classCost = cls.credits_price ?? 1;
        const isInsufficient = userBalance < classCost;

        const modalHtml = `
            <div class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 custom-modal-backdrop animate-fade-in">
                <div class="custom-modal-content custom-modal-emerald p-4 p-md-5 w-100 position-relative" style="max-width: 600px;">
                    <h3 class="fs-4 fw-light text-emerald-dark mb-2">Confirmation de réservation</h3>
                    <p class="mb-4 pb-3 border-bottom text-muted">
                        Réservation : <strong class="text-emerald">${cls.title ?? 'Cours inconnu'}</strong>
                    </p>
                    <form onsubmit="app.confirmPayment(event)" class="d-flex flex-column gap-4">
                        
                        ${app.state.modalMessage ? `
                            <div class="p-3 rounded-3 small animate-fade-in ${app.state.modalMessage.type === 'error' ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25' : 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25'}">
                                <p class="d-flex align-items-center gap-2 mb-0">
                                    <span>${app.state.modalMessage.type === 'error' ? '⚠️' : 'ℹ️'}</span>
                                    ${app.state.modalMessage.text}
                                </p>
                                ${app.state.modalMessage.isInsufficientCredits ? `
                                    <button type="button" onclick="app.navigate('tarifs'); app.state.showPaymentModal=false; app.render()" class="btn btn-link text-danger p-0 mt-2 w-100 text-end small fw-bold text-uppercase text-decoration-none">
                                        Acheter des cours →
                                    </button>
                                ` : ''}
                            </div>
                        ` : ''}

                        <div class="p-4 rounded-3 text-center d-flex flex-column gap-1 border ${isInsufficient ? 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25' : 'bg-success bg-opacity-10 text-success border-success border-opacity-25'}">
                            <span class="fw-bold">Coût de la séance : ${classCost} cours</span>
                            <span class="small opacity-75">Votre solde : ${userBalance} cours</span>
                            <div class="mt-3 pt-3 border-top ${isInsufficient ? 'border-danger border-opacity-25' : 'border-success border-opacity-25'} d-flex align-items-center justify-content-center gap-2">
                                <input type="checkbox" id="confirm-credits" ${isInsufficient ? 'disabled' : 'required'} class="form-check-input mt-0">
                                <label for="confirm-credits" class="small fw-medium ${isInsufficient ? 'text-danger' : 'text-success'}">
                                    ${isInsufficient ? 'Solde insuffisant pour réserver' : 'Je confirme l\'utilisation d\'un cours'}
                                </label>
                            </div>
                        </div>
                        <div class="d-flex gap-3 mt-2">
                            <button type="button" onclick="app.cancelPayment()" class="btn btn-light border w-100">Annuler</button>
                            <button type="submit" ${isInsufficient ? 'disabled' : ''} class="btn w-100 ${isInsufficient ? 'btn-secondary disabled' : 'btn-emerald'}">
                                Confirmer
                            </button>
                        </div>
                    </form>
                </div>
            </div>`;
        modal.innerHTML = modalHtml;
};

/**
 * Formate la date et l'heure pour générer des liens d'invitation calendrier.
 * @param {string} dateStr - Date au format YYYY-MM-DD
 * @param {string} timeStr - Heure au format HH:MM
 * @param {number} durationMin - Durée en minutes
 * @returns {{start: string, end: string}} Les dates de début et de fin formatées.
 */
const formatDateForCalendar = (dateStr, timeStr, durationMin) => {
    const startDateTime = new Date(`${dateStr}T${timeStr}:00`);
    const endDateTime = new Date(startDateTime.getTime() + durationMin * 60 * 1000);

    const format = (dt) => {
        const year = dt.getFullYear();
        const month = (dt.getMonth() + 1).toString().padStart(2, '0');
        const day = dt.getDate().toString().padStart(2, '0');
        const hours = dt.getHours().toString().padStart(2, '0');
        const minutes = dt.getMinutes().toString().padStart(2, '0');
        const seconds = dt.getSeconds().toString().padStart(2, '0');
        return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };

    return {
        start: format(startDateTime),
        end: format(endDateTime)
    };
};

/**
 * Affiche ou masque la modale permettant d'ajouter un cours au calendrier.
 * @param {PilatesApp} app - L'instance principale de l'application.
 * @param {HTMLElement} [container] - Conteneur cible (optionnel).
 */
export const renderCalendarModal = (app, container) => {
    if (app.state.showCalendarModal && app.state.classForCalendar) {
        const cls = app.state.classForCalendar;
        const { start, end } = formatDateForCalendar(cls.date, cls.time, cls.duration);
        const title = encodeURIComponent(cls.title);
        const description = encodeURIComponent(cls.description || 'Cours de Pilates');
        const location = encodeURIComponent(app.state.studioAddress || 'L\'espace doré');

        // Liens pour les calendriers web
        const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${description}&location=${location}&sf=true&output=xml`;
        const outlookCalendarLink = `https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${start}&enddt=${end}&subject=${title}&body=${description}&location=${location}`;
        
        // Contenu pour le fichier .ics (compatible Apple Calendar, Thunderbird, etc.)
        const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//PilatesApp//NONSGML v1.0//EN\nBEGIN:VEVENT\nUID:${cls.id}-${start}\nDTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d{3}/g, '')}\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${title}\nDESCRIPTION:${description}\nLOCATION:${location}\nEND:VEVENT\nEND:VCALENDAR`;
        const icsDataUri = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;

        let modal = document.getElementById('calendar-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'calendar-modal';
            document.body.appendChild(modal); // Attache au body pour qu'il persiste
        }

        const modalHtml = `
            <div class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 custom-modal-backdrop animate-fade-in">
                <div class="custom-modal-content p-4 p-md-5 w-100" style="max-width: 600px;">
                    <h3 class="fs-4 fw-light mb-2">Ajouter au calendrier</h3>
                    <p class="mb-4 pb-3 border-bottom text-muted">
                        Votre réservation pour <strong class="text-emerald">${cls.title}</strong> est confirmée.
                        Ajoutez-la à votre calendrier pour ne rien oublier !
                    </p>
                    <div class="d-flex flex-column gap-3">
                        <a href="${googleCalendarLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary w-100 py-2">
                            Ajouter à Google Calendar
                        </a>
                        <a href="${outlookCalendarLink}" target="_blank" rel="noopener noreferrer" class="btn btn-info text-white w-100 py-2" style="background-color: #0078d4;">
                            Ajouter à Outlook Calendar
                        </a>
                        <a href="${icsDataUri}" download="${cls.title.replace(/\s/g, '_')}.ics" class="btn btn-secondary w-100 py-2">
                            Télécharger le fichier .ics (Apple, autres)
                        </a>
                    </div>
                    <div class="mt-4 d-flex justify-content-end">
                        <button type="button" onclick="app.closeCalendarModal()" class="btn btn-light border">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>`;
        modal.innerHTML = modalHtml; // Met à jour le contenu du modal existant ou nouvellement créé
    }
};

/**
 * Affiche ou masque la modale générique de confirmation d'action (Danger/Info).
 * @param {PilatesApp} app - L'instance principale de l'application.
 */
export const renderConfirmModal = (app) => {
    let modal = document.getElementById('confirm-modal');
    
    if (!app.state.confirmModal || !app.state.confirmModal.isOpen) {
        if (modal) modal.remove();
        return;
    }

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'confirm-modal';
        document.body.appendChild(modal);
    }

    const { message, confirmText, cancelText, type } = app.state.confirmModal;
    
    const confirmBtnClass = type === 'danger' ? 'btn-danger' : 'btn-emerald';

    const iconHtml = type === 'danger' 
        ? '<span class="text-danger fs-3">⚠️</span>' 
        : '<span class="text-warning fs-3">❓</span>';

    modal.innerHTML = `
        <div class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 custom-modal-backdrop animate-fade-in" style="z-index: 1060;">
            <div class="custom-modal-content p-4 p-md-5 w-100" style="max-width: 500px;">
                <div class="d-flex align-items-center gap-3 mb-3">
                    ${iconHtml}
                    <h3 class="fs-5 fw-medium mb-0">${type === 'danger' ? 'Attention' : 'Confirmation'}</h3>
                </div>
                <p class="mb-4 text-muted whitespace-pre-line" style="white-space: pre-line;">${message}</p>
                <div class="d-flex gap-3 justify-content-end">
                    <button type="button" onclick="app.state.confirmModal.onCancel()" class="btn btn-light border">${cancelText}</button>
                    <button type="button" onclick="app.state.confirmModal.onConfirm()" class="btn ${confirmBtnClass}">${confirmText}</button>
                </div>
            </div>
        </div>
    `;
};
