/**
 * @file legal.js
 * @description Vues des pages légales (Mentions Légales, Politique de Confidentialité).
 */

/**
 * Génère la vue dynamique pour les textes légaux.
 * @param {PilatesApp} app - L'instance principale de l'application.
 * @param {'mentions-legales'|'politique-confidentialite'} mode - Détermine le contenu à afficher.
 * @returns {string} Le code HTML structuré avec Bootstrap 5.
 */
export const legalView = (app, mode) => {
    const isPrivacy = mode === 'politique-confidentialite';
    
    const content = isPrivacy ? {
        title: "Politique de Confidentialité",
        text: `
            <h2 class="fs-5 fw-medium text-emerald mb-3">Collecte des données</h2>
            <p class="mb-4">Nous collectons uniquement les données nécessaires à la gestion de vos réservations : nom, prénom, email, téléphone et adresse postale.</p>
            <h2 class="fs-5 fw-medium text-emerald mb-3">Utilisation des données</h2>
            <p class="mb-4">Vos données sont utilisées exclusivement pour le suivi de vos séances et la gestion de vos crédits. Elles ne sont jamais revendues à des tiers.</p>
            <h2 class="fs-5 fw-medium text-emerald mb-3">Paiements</h2>
            <p class="mb-4">Les transactions financières sont gérées par Stripe. Nous n'avons jamais accès à vos coordonnées bancaires complètes.</p>
        `
    } : {
        title: "Mentions Légales",
        text: `
            <h2 class="fs-5 fw-medium text-emerald mb-3">Éditeur du site</h2>
            <p class="mb-4">L'espace doré<br>${app.state.studioAddress}<br>Email : ${app.state.studioEmail}</p>
            <h2 class="fs-5 fw-medium text-emerald mb-3">Hébergement</h2>
            <p class="mb-4">Le site est hébergé sur un serveur chez IONOS.</p>
            <h2 class="fs-5 fw-medium text-emerald mb-3">Propriété intellectuelle</h2>
            <p class="mb-4">L'ensemble des contenus (textes, images) est la propriété exclusive de L'espace doré.</p>
        `
    };

    return `
        <div class="pt-4 pb-5 animate-fade-in flex-grow-1">
            <div class="container" style="max-width: 800px;">
                <h1 class="fs-2 fw-light mb-4 mt-2 text-center">${content.title}</h1>
                <div class="custom-card p-4 p-md-5 text-muted" style="line-height: 1.6;">
                    ${content.text}
                    <div class="mt-4 pt-4 border-top">
                        <button onclick="window.history.back()" class="btn btn-link text-emerald p-0 text-decoration-none fw-medium">
                            ← Retour
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
};