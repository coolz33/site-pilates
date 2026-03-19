
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
            <div class="container" style="max-width: 1000px;">
                <div class="text-center mb-5 mt-2">
                    <h1 class="fs-2 fw-light mb-2">Nos Tarifs</h1>
                    <p class="small text-muted">Choisissez le pack de cours qui vous convient. Plus vous en prenez, moins c'est cher !</p>
                </div>
                
                <div class="row g-4 justify-content-center">
                        ${app.state.creditPackages.map(p => `
                            <div class="col-12 col-md-6 col-lg-4 px-3">
                                <div class="pricing-card text-center">
                                    <div class="price-header mx-auto">${p.name}</div>
                                    <div class="price-body">
                                        <div>
                                            <div class="price-title">${p.subtitle || p.credits + ' cours'}</div>
                                            <div class="price-divider"></div>
                                            <div class="price-details text-muted">
                                                ${p.description ? p.description : `<p>${p.credits} cours utilisables librement.</p>`}
                                            </div>
                                        </div>
                                    <button onclick="app.buyCredits(${JSON.stringify(p).replace(/"/g, '&quot;')})" 
                                            class="price-footer btn-emerald w-100 border-0 d-flex justify-content-between align-items-center">
                                        <span>${p.price} euros</span>
                                        <span class="fs-6 fw-normal">Choisir ➔</span>
                                    </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                </div>
                ${!app.state.currentUser ? `
                <div class="mt-5 p-3 custom-info-box small text-muted mx-auto text-center" style="max-width: 700px;">
                    <p class="text-emerald fw-medium mb-0">⚠️ Vous devez être connecté pour acheter des cours.</p>
                </div>` : ''}
            </div>
        </div>
    `;
};