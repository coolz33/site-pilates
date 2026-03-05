import { getNotificationHtml } from './components.js';

export const profileView = (app) => {
    const u = app.state.currentUser;
    if (!u) return '';

    return `
        <div class="pt-20 pb-24 bg-stone-50 min-h-screen animate-fade-in">
            <div class="max-w-4xl mx-auto px-4 grid md:grid-cols-3 gap-8">
                <div class="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
                    <div class="mb-8">
                        <h1 class="text-3xl font-light">Mon Profil</h1>
                    </div>
                    ${getNotificationHtml(app)}
                    <form onsubmit="app.updateProfile(event)" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="prof-firstname" class="block text-sm font-medium text-stone-700 mb-1">Prénom</label>
                                <input type="text" id="prof-firstname" value="${u.firstName}" class="w-full p-3 border rounded-xl">
                            </div>
                            <div>
                                <label for="prof-lastname" class="block text-sm font-medium text-stone-700 mb-1">Nom</label>
                                <input type="text" id="prof-lastname" value="${u.lastName}" class="w-full p-3 border rounded-xl">
                            </div>
                        </div>
                        <div>
                            <label for="prof-email" class="block text-sm font-medium text-stone-700 mb-1">Email</label>
                            <input type="email" id="prof-email" value="${u.email}" class="w-full p-3 border rounded-xl">
                        </div>
                        <div>
                            <label for="prof-password" class="block text-sm font-medium text-stone-700 mb-1">Nouveau mot de passe</label>
                            <input type="password" id="prof-password" class="w-full p-3 border rounded-xl" placeholder="Laisser vide pour ne pas changer">
                        </div>
                        <div>
                            <label for="prof-confirm-password" class="block text-sm font-medium text-stone-700 mb-1">Confirmer</label>
                            <input type="password" id="prof-confirm-password" class="w-full p-3 border rounded-xl">
                        </div>
                        <div>
                            <label for="prof-phone" class="block text-sm font-medium text-stone-700 mb-1">Téléphone</label>
                            <input type="text" id="prof-phone" value="${u.phone || ''}" class="w-full p-3 border rounded-xl">
                        </div>
                        <div>
                            <label for="prof-address" class="block text-sm font-medium text-stone-700 mb-1">Adresse</label>
                            <input type="text" id="prof-address" value="${u.address || ''}" class="w-full p-3 border rounded-xl">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="prof-zipcode" class="block text-sm font-medium text-stone-700 mb-1">Code Postal</label>
                                <input type="text" id="prof-zipcode" value="${u.zipCode || ''}" class="w-full p-3 border rounded-xl">
                            </div>
                            <div>
                                <label for="prof-city" class="block text-sm font-medium text-stone-700 mb-1">Ville</label>
                                <input type="text" id="prof-city" value="${u.city || ''}" class="w-full p-3 border rounded-xl">
                            </div>
                        </div>
                        <button type="submit" class="w-full py-3 bg-emerald-800 text-white rounded-xl font-medium">Enregistrer</button>
                    </form>
                </div>
                <div class="space-y-6">
                    <div class="bg-emerald-800 text-white p-6 rounded-3xl shadow-lg">
                        <div class="text-sm opacity-80 mb-1">Mon solde</div>
                        <div class="text-4xl font-light">${u.credits_balance || 0} <span class="text-xl">crédits</span></div>
                    </div>
                    <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                        <h3 class="font-medium mb-4">Acheter des crédits</h3>
                        <div class="space-y-3">
                            ${app.state.creditPackages.map(p => `
                                <button onclick="app.buyCredits(${JSON.stringify(p).replace(/"/g, '&quot;')})" class="w-full p-3 text-left border rounded-xl hover:border-emerald-500 transition group">
                                    <div class="font-medium group-hover:text-emerald-700">${p.name}</div>
                                    <div class="text-sm text-stone-500">${p.credits} crédits • ${p.price}€</div>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
};
