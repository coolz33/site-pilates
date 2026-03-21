
/**
 * @file profile.js
 * @description Vue du profil utilisateur (informations, réservations, historique financier).
 */
import { generatePaginationHtml, generateLimitSelectorHtml } from '../utils.js';
import { renderProfileInfosTab, renderProfileSessionsTab, renderProfilePaymentsTab } from './profileSubviews.js';

/**
 * Génère la vue complète du profil de l'utilisateur connecté.
 * Gère l'affichage par onglets (Infos, Séances, Paiements).
 * @param {PilatesApp} app - L'instance principale de l'application.
 * @returns {string} Le code HTML structuré avec Bootstrap 5.
 */
export const profileView = (app) => {
    const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>`;
    const eyeSlashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z"/><path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z"/></svg>`;

    const u = app.state.currentUser;
    if (!u) return '';

    const activeTab = app.state.profileTab || 'infos';

    // Récupération et tri des réservations
    const now = new Date();
    const classes = Array.isArray(app.state.classes) ? app.state.classes : [];
    const myBookings = classes
        .filter(c => c.bookedUsers.includes(u.id))
        .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));

    const futureBookings = myBookings.filter(c => new Date(c.date + 'T' + c.time) >= now);
    const pastBookings = myBookings.filter(c => new Date(c.date + 'T' + c.time) < now).reverse();
    const delayHours = app.state.cancellationDelay || 24;

    const transactions = u.transactions || [];
    const creditHistory = transactions.filter(t => t.type !== 'purchase');
    const paymentHistory = transactions.filter(t => t.type === 'purchase');

    const calculatedBalance = u.activeBatches ? u.activeBatches.reduce((sum, b) => sum + b.credits, 0) : (parseInt(u.credits_balance) || 0);

    // Navigation par onglets
    const navTabs = `
        <div class="d-flex border-bottom mb-4 overflow-auto scrollbar-hide">
            <button onclick="app.setProfileTab('infos')" 
                class="btn btn-link text-decoration-none px-4 py-3 small whitespace-nowrap ${activeTab === 'infos' ? 'tab-active' : 'tab-inactive'}">
                Mon Profil
            </button>
            <button onclick="app.setProfileTab('sessions')" 
                class="btn btn-link text-decoration-none px-4 py-3 small whitespace-nowrap ${activeTab === 'sessions' ? 'tab-active' : 'tab-inactive'}">
                Mes Séances
            </button>
            <button onclick="app.setProfileTab('payments')" 
                class="btn btn-link text-decoration-none px-4 py-3 small whitespace-nowrap ${activeTab === 'payments' ? 'tab-active' : 'tab-inactive'}">
                Paiements & Historique
            </button>
        </div>
    `;

    let tabContent = '';

    if (activeTab === 'infos') {
        tabContent = renderProfileInfosTab(app, u, calculatedBalance);
    } else if (activeTab === 'sessions') {
        tabContent = renderProfileSessionsTab(app, futureBookings, pastBookings, delayHours);
    } else if (activeTab === 'payments') {
        tabContent = renderProfilePaymentsTab(app, paymentHistory, creditHistory);
    }

    return `
        <div class="pt-4 pb-5 animate-fade-in flex-grow-1">
            <div class="container" style="max-width: 1200px;">
                <div class="mb-4">
                    <h1 class="fs-2 fw-light mb-0">Mon Profil</h1>
                </div>

                ${navTabs}

                <div class="animate-fade-in">
                    ${tabContent}
                </div>
            </div>
        </div>`;
};
