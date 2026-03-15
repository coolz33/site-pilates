import { getNotificationHtml } from './components.js';

export const profileView = (app) => {
    const u = app.state.currentUser;
    if (!u) return '';

    const activeTab = app.state.profileTab || 'infos';

    // Récupération et tri des réservations
    const now = new Date();
    const classes = Array.isArray(app.state.classes) ? app.state.classes : [];
    const myBookings = classes
        .filter(c => c.bookedUsers.includes(u.id))
        .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));

    const futureBookings = myBookings.filter(c => new Date(c.date + 'T' + c.time) >= now);
    const pastBookings = myBookings.filter(c => new Date(c.date + 'T' + c.time) < now).reverse();
    const delayHours = app.state.cancellationDelay || 24;

    const transactions = u.transactions || [];
    const creditHistory = transactions.filter(t => t.type !== 'purchase');
    const paymentHistory = transactions.filter(t => t.type === 'purchase');

    // Navigation par onglets
    const navTabs = `
        <div class="flex border-b border-stone-200 dark:border-stone-700 mb-8 overflow-x-auto scrollbar-hide">
            <button onclick="app.setProfileTab('infos')" 
                class="px-6 py-3 text-sm font-medium whitespace-nowrap transition-all ${activeTab === 'infos' ? 'tab-active' : 'tab-inactive'}">
                Mon Profil
            </button>
            <button onclick="app.setProfileTab('sessions')" 
                class="px-6 py-3 text-sm font-medium whitespace-nowrap transition-all ${activeTab === 'sessions' ? 'tab-active' : 'tab-inactive'}">
                Mes Séances
            </button>
            <button onclick="app.setProfileTab('payments')" 
                class="px-6 py-3 text-sm font-medium whitespace-nowrap transition-all ${activeTab === 'payments' ? 'tab-active' : 'tab-inactive'}">
                Paiements & Historique
            </button>
        </div>
    `;

    let tabContent = '';

    if (activeTab === 'infos') {
        tabContent = `
            <div class="grid md:grid-cols-3 gap-8">
                <div class="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                    <form onsubmit="app.updateProfile(event)" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="prof-firstname" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Prénom</label>
                                <input type="text" id="prof-firstname" value="${u.firstName}" class="w-full p-3 border rounded-xl dark:bg-stone-700 dark:border-stone-600">
                            </div>
                            <div>
                                <label for="prof-lastname" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Nom</label>
                                <input type="text" id="prof-lastname" value="${u.lastName}" class="w-full p-3 border rounded-xl dark:bg-stone-700 dark:border-stone-600">
                            </div>
                        </div>
                        <div>
                            <label for="prof-email" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Email</label>
                            <input type="email" id="prof-email" value="${u.email}" class="w-full p-3 border rounded-xl dark:bg-stone-700 dark:border-stone-600">
                        </div>
                        <div>
                            <label for="prof-password" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Nouveau mot de passe</label>
                            <input type="password" id="prof-password" class="w-full p-3 border rounded-xl dark:bg-stone-700 dark:border-stone-600" placeholder="Laisser vide pour ne pas changer">
                        </div>
                        <div>
                            <label for="prof-confirm-password" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Confirmer</label>
                            <input type="password" id="prof-confirm-password" class="w-full p-3 border rounded-xl dark:bg-stone-700 dark:border-stone-600">
                        </div>
                        <div>
                            <label for="prof-phone" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Téléphone</label>
                            <input type="text" id="prof-phone" value="${u.phone || ''}" class="w-full p-3 border rounded-xl dark:bg-stone-700 dark:border-stone-600">
                        </div>
                        <div>
                            <label for="prof-address" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Adresse</label>
                            <input type="text" id="prof-address" value="${u.address || ''}" class="w-full p-3 border rounded-xl dark:bg-stone-700 dark:border-stone-600">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="prof-zipcode" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Code Postal</label>
                                <input type="text" id="prof-zipcode" value="${u.zipCode || ''}" class="w-full p-3 border rounded-xl dark:bg-stone-700 dark:border-stone-600">
                            </div>
                            <div>
                                <label for="prof-city" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Ville</label>
                                <input type="text" id="prof-city" value="${u.city || ''}" class="w-full p-3 border rounded-xl dark:bg-stone-700 dark:border-stone-600">
                            </div>
                        </div>
                        <div class="flex items-center gap-3 p-1">
                            <input type="checkbox" id="prof-newsletter" ${u.newsletter_subscribed ? 'checked' : ''} class="w-5 h-5 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500 dark:bg-stone-600 dark:border-stone-500">
                            <label for="prof-newsletter" class="text-sm text-stone-600 cursor-pointer dark:text-stone-300">
                                Je souhaite recevoir les actualités du studio.
                            </label>
                        </div>
                        <div class="pt-8 mt-8 border-t border-stone-100 dark:border-stone-700">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-red-600 dark:text-red-400">⚠️</span>
                                <h3 class="text-xs font-bold text-red-600 uppercase tracking-widest dark:text-red-400">Action irréversible</h3>
                            </div>
                            <p class="text-xs text-stone-500 mb-4 dark:text-stone-400">La suppression de votre compte est définitive. Vous perdrez tous vos crédits restants.</p>
                            <button type="button" onclick="app.deleteAccount(${u.id})" class="text-sm font-semibold text-red-600 hover:underline dark:text-red-400">Supprimer mon compte définitivement</button>
                        </div>
                        <button type="submit" class="w-full py-3 bg-emerald-800 text-white rounded-xl font-medium dark:bg-emerald-700 dark:hover:bg-emerald-600">Enregistrer les modifications</button>
                    </form>
                </div>
                <div class="space-y-6">
                    <div class="bg-emerald-700 text-white p-6 rounded-3xl shadow-lg">
                        <div class="text-sm opacity-80 mb-1">Mon solde actuel</div>
                        <div class="text-4xl font-light">${u.credits_balance || 0} <span class="text-xl">crédits</span></div>
                    </div>
                    <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 text-center dark:bg-stone-800 dark:border-stone-700">
                        <p class="text-stone-600 text-sm mb-4 dark:text-stone-300">Besoin de recharger ?</p>
                        <button onclick="app.navigate('tarifs')" class="w-full py-2 border border-emerald-700 text-emerald-700 rounded-xl font-medium hover:bg-emerald-50 transition dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-900/30">
                            Voir les tarifs
                        </button>
                    </div>
                </div>
            </div>`;
    } else if (activeTab === 'sessions') {
        tabContent = `
            <div class="grid md:grid-cols-2 gap-8">
                <div class="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                    <h3 class="font-medium text-lg mb-6 text-stone-800 dark:text-stone-100">Prochaines séances</h3>
                    ${futureBookings.length === 0 ? '<p class="text-stone-400 dark:text-stone-500">Aucune séance prévue.</p>' : 
                    `<div class="space-y-4">
                        ${futureBookings.map(c => {
                            const classDate = new Date(c.date + 'T' + c.time);
                            const hoursDiff = (classDate - now) / 1000 / 60 / 60;
                            const canCancel = hoursDiff >= delayHours;
                            return `
                            <div class="p-4 border border-stone-100 rounded-2xl bg-stone-50/50 dark:bg-stone-700/50 dark:border-stone-700">
                                <div class="font-bold text-emerald-800 dark:text-emerald-400">${c.title}</div>
                                <div class="text-stone-600 dark:text-stone-300">${new Date(c.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${c.time}</div>
                                ${canCancel ? 
                                    `<div class="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700 flex justify-between items-center">
                                        <span class="text-[10px] text-stone-400 uppercase tracking-wider">Annulable</span>
                                        <button onclick="app.deleteClass(${c.id})" class="text-xs font-semibold text-red-500 hover:underline">Annuler</button>
                                    </div>` : 
                                    `<div class="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700 text-[10px] text-amber-600 font-bold uppercase tracking-wider">Délai d'annulation dépassé</div>`
                                }
                            </div>`;
                        }).join('')}
                    </div>`}
                </div>
                <div class="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                    <h3 class="font-medium text-lg mb-6 text-stone-800 dark:text-stone-100">Séances passées</h3>
                    ${pastBookings.length === 0 ? '<p class="text-stone-400 dark:text-stone-500">Aucun historique.</p>' : 
                    `<div class="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        ${pastBookings.map(c => `
                            <div class="p-3 border border-stone-50 rounded-xl opacity-70 flex justify-between items-center dark:border-stone-700">
                                <div>
                                    <div class="text-sm font-medium text-stone-700 dark:text-stone-300">${c.title}</div>
                                    <div class="text-xs text-stone-500 dark:text-stone-400">${new Date(c.date).toLocaleDateString('fr-FR')}</div>
                                </div>
                                <span class="text-[10px] text-stone-400 font-bold uppercase">Effectué</span>
                            </div>
                        `).join('')}
                    </div>`}
                </div>
            </div>`;
    } else if (activeTab === 'payments') {
        tabContent = `
            <div class="grid md:grid-cols-2 gap-8">
                <div class="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                    <h3 class="font-medium text-lg mb-6 text-stone-800 dark:text-stone-100">Historique des achats</h3>
                    ${paymentHistory.length === 0 ? '<p class="text-stone-400 dark:text-stone-500">Aucun achat effectué.</p>' : 
                    `<div class="space-y-4">
                        ${paymentHistory.map(t => `
                            <div class="flex justify-between items-center p-3 border-b border-stone-50 last:border-0 dark:border-stone-700">
                                <div>
                                    <div class="text-sm font-medium dark:text-stone-300">${t.description}</div>
                                    <div class="text-xs text-stone-400">${new Date(t.date).toLocaleDateString('fr-FR')}</div>
                                </div>
                                <div class="font-bold text-emerald-600">+${t.amount} cr.</div>
                            </div>
                        `).join('')}
                    </div>`}
                </div>
                <div class="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                    <h3 class="font-medium text-lg mb-6 text-stone-800 dark:text-stone-100">Utilisation des crédits</h3>
                    ${creditHistory.length === 0 ? '<p class="text-stone-400 dark:text-stone-500">Aucun mouvement.</p>' : 
                    `<div class="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        ${creditHistory.map(t => `
                            <div class="flex justify-between items-center p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors">
                                <div>
                                    <div class="text-sm font-medium dark:text-stone-300">${t.description}</div>
                                    <div class="text-xs text-stone-400">${new Date(t.date).toLocaleDateString('fr-FR')}</div>
                                </div>
                                <div class="font-bold ${t.amount > 0 ? 'text-emerald-600' : 'text-stone-600 dark:text-stone-400'}">
                                    ${t.amount > 0 ? '+' : ''}${t.amount}
                                </div>
                            </div>
                        `).join('')}
                    </div>`}
                </div>
            </div>`;
    }

    return `
        <div class="pt-24 pb-24 bg-stone-50 min-h-screen animate-fade-in dark:bg-stone-900">
            <div class="max-w-6xl mx-auto px-4">
                <div class="mb-8">
                    <h1 class="text-4xl font-light text-stone-800 dark:text-stone-100">Mon Profil</h1>
                </div>

                ${getNotificationHtml(app)}

                ${navTabs}

                <div class="animate-fade-in">
                    ${tabContent}
                </div>
            </div>
        </div>`;
};
