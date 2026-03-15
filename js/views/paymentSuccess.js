import { icons } from '../icons.js';

export const paymentSuccessView = (app) => {
    const u = app.state.currentUser;
    return `
        <div class="min-h-[70vh] flex items-center justify-center bg-stone-50 py-12 px-4 dark:bg-stone-900">
            <div class="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-stone-100 text-center dark:bg-stone-800 dark:border-stone-700 animate-fade-in">
                <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 class="text-3xl font-light text-stone-800 mb-4 dark:text-stone-100">Paiement effectué avec succès</h1>
                <p class="text-stone-600 mb-8 dark:text-stone-300">
                    Merci pour votre achat ! Votre solde est désormais de :
                    <span class="block text-4xl font-bold text-emerald-700 mt-2 dark:text-emerald-400">
                        ${u ? u.credits_balance : '...'} crédits
                    </span>
                </p>
                <div class="space-y-4">
                    <button onclick="app.navigate('profil')" class="w-full py-4 bg-emerald-800 text-white rounded-xl font-medium hover:bg-emerald-900 transition-all shadow-md dark:bg-emerald-700 dark:hover:bg-emerald-600">
                        Voir mon profil
                    </button>
                    ${window.opener ? `
                        <button onclick="window.close()" class="w-full py-2 text-stone-500 text-sm hover:underline dark:text-stone-400">
                            Fermer cette fenêtre
                        </button>
                    ` : `
                        <button onclick="app.navigate('planning')" class="w-full py-2 text-stone-600 font-medium hover:underline dark:text-stone-300">
                            Retour au planning
                        </button>
                    `}
                </div>
                <p class="mt-8 text-xs text-stone-400 dark:text-stone-500 italic">
                    Un email de confirmation vous a été envoyé.
                </p>
            </div>
        </div>
    `;
};