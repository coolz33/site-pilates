
/**
 * @file credits.js
 * @description Vue des tarifs et des packs de crédits du studio.
 */

/**
 * Génère la vue affichant les différents packs de crédits disponibles à l'achat.
 * @param {PilatesApp} app - L'instance principale de l'application.
 * @returns {string} Le code HTML structuré avec Bootstrap 5.
 */
export const creditsView = (app) => {
    return `
        <div class="pt-4 pb-5 animate-fade-in flex-grow-1">
            <div class="container" style="max-width: 900px;">
                <div class="text-center mb-4 mt-2">
                    <h1 class="fs-2 fw-light mb-2">Nos Tarifs</h1>
                    <p class="small text-muted">Choisissez le pack de crédits qui vous convient. Plus vous en prenez, moins c'est cher !</p>
                </div>
                
                <div class="custom-card p-3 p-md-4 mx-auto" style="max-width: 700px;">
                    <div class="d-flex flex-column gap-2">
                        ${app.state.creditPackages.map(p => `
                            <div class="package-card p-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                                <div class="flex-grow-1">
                                    <div class="fw-medium">${p.name}</div>
                                    <div class="small text-muted">${p.credits} crédits</div>
                                </div>
                                <div class="d-flex align-items-center justify-content-between justify-content-sm-end gap-4">
                                    <div class="fs-5 fw-semibold">${p.price}€</div>
                                    <button onclick="app.buyCredits(${JSON.stringify(p).replace(/"/g, '&quot;')})" 
                                            class="btn btn-emerald px-4 py-2 flex-shrink-0">
                                        Acheter
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-4 p-3 custom-info-box small text-muted d-flex flex-column gap-2">
                        <p class="mb-0">• 1 crédit correspond à 1€ de valeur lors de la réservation d'un cours.</p>
                        <p class="mb-0">• Les crédits n'ont pas de date d'expiration.</p>
                        ${!app.state.currentUser ? `<p class="text-emerald fw-medium mt-2 mb-0">⚠️ Vous devez être connecté pour acheter des crédits.</p>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
};