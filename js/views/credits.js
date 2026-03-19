import { getNotificationHtml } from './components.js';

export const creditsView = (app) => {
    return `
        <div class="pt-6 pb-6 bg-stone-50 min-h-[60vh] animate-fade-in dark:bg-stone-900 max-w-5xl mx-auto">
            <div class="max-w-4xl mx-auto px-4">
                <div class="text-center mb-4">
                    <h1 class="text-3xl font-light text-stone-800 mb-2 dark:text-stone-100">Nos Tarifs</h1>
                    <p class="text-sm text-stone-600 dark:text-stone-300">Choisissez le pack de crédits qui vous convient. Plus vous en prenez, moins c'est cher !</p>
                </div>
                
                <div class="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-stone-100 max-w-2xl mx-auto dark:bg-stone-800 dark:border-stone-700">
                    <div class="space-y-3">
                        ${app.state.creditPackages.map(p => `
                            <div class="p-3 sm:p-4 rounded-xl border border-stone-100 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-stone-50/50 transition-colors dark:hover:bg-stone-700/50">
                                <div class="flex-1">
                                    <div class="font-medium text-stone-800 dark:text-stone-200">${p.name}</div>
                                    <div class="text-sm text-stone-500 dark:text-stone-400">${p.credits} crédits</div>
                                </div>
                                <div class="flex items-center justify-between sm:justify-end gap-4">
                                    <div class="font-semibold text-lg text-stone-900 dark:text-stone-100">${p.price}€</div>
                                    <button onclick="app.buyCredits(${JSON.stringify(p).replace(/"/g, '&quot;')})" 
                                            class="bg-emerald-800 text-white px-5 py-2 text-sm rounded-xl hover:bg-emerald-900 transition-all shadow-md active:scale-95 dark:bg-emerald-700 dark:hover:bg-emerald-600 flex-shrink-0">
                                        Acheter
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-4 p-3 bg-stone-50 rounded-2xl text-xs text-stone-500 flex flex-col gap-1.5 dark:bg-stone-700/50 dark:text-stone-400">
                        <p>• 1 crédit correspond à 1€ de valeur lors de la réservation d'un cours.</p>
                        <p>• Les crédits n'ont pas de date d'expiration.</p>
                        ${!app.state.currentUser ? `<p class="text-emerald-700 font-medium mt-2 dark:text-emerald-400">⚠️ Vous devez être connecté pour acheter des crédits.</p>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
};