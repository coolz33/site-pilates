import { getNotificationHtml } from './components.js';

export const creditsView = (app) => {
    return `
        <div class="pt-20 pb-24 bg-stone-50 min-h-[80vh] animate-fade-in dark:bg-stone-900">
            <div class="max-w-4xl mx-auto px-4">
                <div class="text-center mb-12">
                    <h1 class="text-4xl font-light text-stone-800 mb-4 dark:text-stone-100">Nos Tarifs</h1>
                    <p class="text-stone-600 dark:text-stone-300">Choisissez le pack de crédits qui vous convient. Plus vous en prenez, moins c'est cher !</p>
                </div>
                
                ${getNotificationHtml(app)}

                <div class="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 max-w-2xl mx-auto dark:bg-stone-800 dark:border-stone-700">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead class="text-stone-500 border-b dark:text-stone-400 dark:border-stone-700">
                                <tr>
                                    <th class="pb-4 font-medium">Pack de crédits</th>
                                    <th class="pb-4 font-medium text-center">Nombre</th>
                                    <th class="pb-4 font-medium text-right">Prix Total</th>
                                    <th class="pb-4"></th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-stone-50 dark:divide-stone-700">
                                ${app.state.creditPackages.map(p => `
                                    <tr class="group hover:bg-stone-50/50 transition-colors dark:hover:bg-stone-700/50">
                                        <td class="py-5 font-medium text-stone-800 text-lg dark:text-stone-200">${p.name}</td>
                                        <td class="py-5 text-center">
                                            <span class="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold dark:bg-emerald-900/50 dark:text-emerald-400">${p.credits}</span>
                                        </td>
                                        <td class="py-5 text-right font-semibold text-xl text-stone-900 dark:text-stone-100">${p.price}€</td>
                                        <td class="py-5 text-right">
                                            <button onclick="app.buyCredits(${JSON.stringify(p).replace(/"/g, '&quot;')})" 
                                                    class="bg-emerald-800 text-white px-6 py-2 rounded-xl hover:bg-emerald-900 transition-all shadow-md active:scale-95 dark:bg-emerald-700 dark:hover:bg-emerald-600">
                                                Acheter
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-8 p-4 bg-stone-50 rounded-2xl text-sm text-stone-500 flex flex-col gap-2 dark:bg-stone-700/50 dark:text-stone-400">
                        <p>• 1 crédit correspond à 1€ de valeur lors de la réservation d'un cours.</p>
                        <p>• Les crédits n'ont pas de date d'expiration.</p>
                        ${!app.state.currentUser ? `<p class="text-emerald-700 font-medium mt-2 dark:text-emerald-400">⚠️ Vous devez être connecté pour acheter des crédits.</p>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
};