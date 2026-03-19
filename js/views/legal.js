export const legalView = (app, mode) => {
    const isPrivacy = mode === 'politique-confidentialite';
    
    const content = isPrivacy ? {
        title: "Politique de Confidentialité",
        text: `
            <h2 class="text-xl font-medium text-emerald-800 mb-4 dark:text-emerald-400">Collecte des données</h2>
            <p class="mb-4">Nous collectons uniquement les données nécessaires à la gestion de vos réservations : nom, prénom, email, téléphone et adresse postale.</p>
            <h2 class="text-xl font-medium text-emerald-800 mb-4 dark:text-emerald-400">Utilisation des données</h2>
            <p class="mb-4">Vos données sont utilisées exclusivement pour le suivi de vos séances et la gestion de vos crédits. Elles ne sont jamais revendues à des tiers.</p>
            <h2 class="text-xl font-medium text-emerald-800 mb-4 dark:text-emerald-400">Paiements</h2>
            <p class="mb-4">Les transactions financières sont gérées par Stripe. Nous n'avons jamais accès à vos coordonnées bancaires complètes.</p>
        `
    } : {
        title: "Mentions Légales",
        text: `
            <h2 class="text-xl font-medium text-emerald-800 mb-4 dark:text-emerald-400">Éditeur du site</h2>
            <p class="mb-4">Studio Équilibre Pilates<br>${app.state.studioAddress}<br>Email : ${app.state.studioEmail}</p>
            <h2 class="text-xl font-medium text-emerald-800 mb-4 dark:text-emerald-400">Hébergement</h2>
            <p class="mb-4">Le site est hébergé sur un serveur chez IONOS.</p>
            <h2 class="text-xl font-medium text-emerald-800 mb-4 dark:text-emerald-400">Propriété intellectuelle</h2>
            <p class="mb-4">L'ensemble des contenus (textes, images) est la propriété exclusive du Studio Équilibre Pilates.</p>
        `
    };

    return `
        <div class="pt-8 pb-8 bg-stone-50 min-h-[70vh] animate-fade-in dark:bg-stone-900">
            <div class="max-w-3xl mx-auto px-4">
                <h1 class="text-4xl font-light text-stone-800 mb-8 dark:text-stone-100">${content.title}</h1>
                <div class="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700 text-stone-600 dark:text-stone-300 leading-relaxed">
                    ${content.text}
                    <div class="mt-12 pt-6 border-t border-stone-100 dark:border-stone-700">
                        <button onclick="window.history.back()" class="text-emerald-700 font-medium hover:underline dark:text-emerald-400">
                            ← Retour
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
};