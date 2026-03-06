import { getNotificationHtml } from './components.js';

export const authView = (app, mode) => {
    const isLogin = mode === 'connexion';
    return `
        <div class="min-h-[60vh] md:min-h-[70vh] flex items-center justify-center bg-stone-50 py-8 md:py-12 px-4 animate-fade-in">
            <div class="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
                <div class="text-center mb-8">
                    <h2 class="text-3xl font-light text-stone-800">${isLogin ? 'Connexion' : 'Créer un compte'}</h2>
                    <p class="mt-2 text-stone-500">${isLogin ? 'Accédez à votre espace pour réserver.' : 'Rejoignez le studio Équilibre Pilates.'}</p>
                </div>
                ${getNotificationHtml(app)}
                <form id="auth-form" class="space-y-5">
                    ${!isLogin ? `
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="auth-firstname" class="block text-sm font-medium text-stone-700 mb-1">Prénom</label>
                            <input type="text" id="auth-firstname" required class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white" />
                        </div>
                        <div>
                            <label for="auth-lastname" class="block text-sm font-medium text-stone-700 mb-1">Nom</label>
                            <input type="text" id="auth-lastname" required class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white" />
                        </div>
                    </div>
                    <div>
                        <label for="auth-address" class="block text-sm font-medium text-stone-700 mb-1">Adresse postale</label>
                        <input type="text" id="auth-address" required placeholder="123 rue de la Paix, 75000 Paris" class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white" />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div class="sm:col-span-1">
                            <label for="auth-zipcode" class="block text-sm font-medium text-stone-700 mb-1">Code Postal</label>
                            <input type="text" id="auth-zipcode" required placeholder="75000" class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white" />
                        </div>
                        <div class="sm:col-span-2">
                            <label for="auth-city" class="block text-sm font-medium text-stone-700 mb-1">Ville</label>
                            <input type="text" id="auth-city" required placeholder="Paris" class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white" />
                        </div>
                    </div>
                    <div>
                        <label for="auth-phone" class="block text-sm font-medium text-stone-700 mb-1">Téléphone</label>
                        <input type="tel" id="auth-phone" required placeholder="06 12 34 56 78" class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white" />
                    </div>
                    ` : ''}
                    <div>
                        <label for="auth-email" class="block text-sm font-medium text-stone-700 mb-1">Email</label>
                        <input type="email" id="auth-email" required class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white" />
                    </div>
                    <div>
                        <label for="auth-password" class="block text-sm font-medium text-stone-700 mb-1">Mot de passe</label>
                        <input type="password" id="auth-password" required class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white" />
                    </div>
                    ${!isLogin ? `
                    <div>
                        <label for="auth-confirm-password" class="block text-sm font-medium text-stone-700 mb-1">Confirmer le mot de passe</label>
                        <input type="password" id="auth-confirm-password" required class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white" />
                    </div>
                    <div class="flex items-center gap-3 p-1">
                        <input type="checkbox" id="auth-newsletter" class="w-5 h-5 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500">
                        <label for="auth-newsletter" class="text-sm text-stone-600 cursor-pointer">
                            Je souhaite recevoir les actualités et promotions du studio.
                        </label>
                    </div>` : ''}
                    <button type="submit" class="w-full py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition font-medium mt-6">
                        ${isLogin ? 'Se connecter' : "S'inscrire"}
                    </button>
                </form>
                <div class="mt-6 text-center text-sm text-stone-600">
                    ${isLogin ?
                        `Pas encore de compte ? <button onclick="app.navigate('inscription')" class="text-emerald-700 font-medium hover:underline">S'inscrire</button>` :
                        `Déjà un compte ? <button onclick="app.navigate('connexion')" class="text-emerald-700 font-medium hover:underline">Se connecter</button>`
                    }
                </div>
            </div>
        </div>
    `;
};
