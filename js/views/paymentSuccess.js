import { icons } from '../icons.js';

/**
 * @file paymentSuccess.js
 * @description Vue affichée après un paiement (achat de crédits ou réservation) réussi.
 */

/**
 * Génère la vue de succès de paiement.
 * Si la vue est chargée dans un popup (ex: Stripe Checkout), propose un bouton pour fermer la fenêtre parente.
 * @param {PilatesApp} app - L'instance principale de l'application.
 * @returns {string} Code HTML structuré avec Bootstrap 5.
 */
export const paymentSuccessView = (app) => {
    const u = app.state.currentUser;
    const urlParams = new URLSearchParams(window.location.search);
    const packageName = urlParams.get('package') || '';
    const creditsAdded = urlParams.get('credits') || '';

    const isSubscription = packageName.toLowerCase().includes('abonnement');

    return `
        <div class="d-flex flex-grow-1 align-items-center justify-content-center py-5 px-3">
            <div class="custom-card p-4 p-md-5 w-100 text-center shadow animate-fade-in" style="max-width: 500px;">
                <div class="icon-circle-xl bg-emerald-light text-emerald mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" style="width: 2.5rem; height: 2.5rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                ${isSubscription ? `
                    <h1 class="fs-3 fw-light mb-3">Merci pour votre achat !</h1>
                    <p class="text-muted mb-4">
                        <span class="d-block display-6 fw-bold text-emerald mt-2">Abonnement activé.</span>
                    </p>
                ` : `
                    <h1 class="fs-3 fw-light mb-3">Paiement effectué avec succès</h1>
                    <p class="text-muted mb-4">
                        Merci pour votre achat ! 
                        ${creditsAdded ? `<span class="d-block display-5 fw-bold text-emerald mt-2 mb-3">${creditsAdded} cours ajoutés</span>` : ''}
                        Votre solde total est désormais de : <strong class="text-stone-800">${u ? (u.credits_balance || 0) : '...'} cours</strong>
                    </p>
                `}
                <div class="d-flex flex-column gap-3">
                    <button onclick="app.navigate('profil')" class="btn btn-emerald w-100 py-3 fw-medium shadow-sm">
                        Voir mon profil
                    </button>
                    ${window.opener ? `
                        <button onclick="window.close()" class="btn btn-link text-muted small text-decoration-none w-100">
                            Fermer cette fenêtre
                        </button>
                    ` : `
                        <button onclick="app.navigate('planning')" class="btn btn-link text-muted fw-medium text-decoration-none w-100">
                            Retour au planning
                        </button>
                    `}
                </div>
                <p class="mt-4 pt-3 border-top text-muted small fst-italic mb-0" style="font-size: 0.75rem;">
                    Un email de confirmation vous a été envoyé.
                </p>
            </div>
        </div>
    `;
};