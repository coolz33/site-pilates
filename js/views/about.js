/**
 * @file about.js
 * @description Vue de présentation de la méthode Pilates et de ses bienfaits.
 */

/**
 * Génère la page "À propos".
 * @param {PilatesApp} app - L'instance principale de l'application.
 * @returns {string} Le code HTML structuré avec Bootstrap 5.
 */
export const aboutView = (app) => `
    <div class="pt-4 pb-5 animate-fade-in flex-grow-1">
        <div class="container" style="max-width: 900px;">
            <h1 class="fs-2 fw-light text-center mb-4 mt-2">La Méthode Pilates</h1>
            
            <div class="custom-card p-4 p-md-5 mb-4">
                <h2 class="fs-4 fw-medium text-emerald mb-3">Qu'est-ce que le Pilates ?</h2>
                <p class="text-muted mb-3">Développée par Joseph Pilates au début du 20ème siècle, cette méthode d'entraînement physique vise à renforcer les chaînes musculaires profondes du corps...</p>
                <p class="text-muted mb-0">La méthode repose sur 6 principes fondamentaux : la concentration, le contrôle, le centrage, la précision, la fluidité du mouvement et la respiration.</p>
            </div>
            
            <div class="row g-4">
                <div class="col-md-6">
                    <div class="custom-card h-100 p-4">
                        <h3 class="fs-5 fw-medium mb-3">Les Bienfaits</h3>
                        <ul class="list-unstyled text-muted d-flex flex-column gap-2 mb-0">
                            <li class="d-flex align-items-start gap-2"><span class="text-emerald mt-1">•</span> Amélioration de la posture</li>
                            <li class="d-flex align-items-start gap-2"><span class="text-emerald mt-1">•</span> Renforcement de la ceinture abdominale</li>
                            <li class="d-flex align-items-start gap-2"><span class="text-emerald mt-1">•</span> Soulagement des maux de dos</li>
                    </ul>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="bg-emerald-strong rounded-3 p-4 h-100 shadow-sm text-white">
                        <h3 class="fs-5 fw-medium mb-3">À qui s'adresse le Pilates ?</h3>
                        <p class="mb-0 text-white-50" style="color: rgba(255,255,255,0.85) !important;">À tout le monde ! Que vous soyez sportif de haut niveau, sédentaire souhaitant reprendre une activité, ou en rééducation. Les exercices s'adaptent au niveau de chacun.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
