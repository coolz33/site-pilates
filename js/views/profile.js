import { getNotificationHtml } from './components.js';

export const profileView = (app) => {
    const u = app.state.currentUser;
    if (!u) return '';

    // Récupération et tri des réservations
    const now = new Date();
    const myBookings = app.state.classes
        .filter(c => c.bookedUsers.includes(u.id))
        .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));

    const futureBookings = myBookings.filter(c => new Date(c.date + 'T' + c.time) >= now);
    const pastBookings = myBookings.filter(c => new Date(c.date + 'T' + c.time) < now).reverse();
    const delayHours = app.state.cancellationDelay || 24;

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
                        <div class="flex items-center gap-3 p-1">
                            <input type="checkbox" id="prof-newsletter" ${u.newsletter_subscribed ? 'checked' : ''} class="w-5 h-5 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500">
                            <label for="prof-newsletter" class="text-sm text-stone-600 cursor-pointer">
                                Je souhaite recevoir les actualités et promotions du studio.
                            </label>
                        </div>
                        <button type="submit" class="w-full py-3 bg-emerald-800 text-white rounded-xl font-medium">Enregistrer</button>
                    </form>
                </div>
                <div class="space-y-6">
                    <div class="bg-emerald-800 text-white p-6 rounded-3xl shadow-lg">
                        <div class="text-sm opacity-80 mb-1">Mon solde</div>
                        <div class="text-4xl font-light">${u.credits_balance || 0} <span class="text-xl">crédits</span></div>
                    </div>
                    <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 text-center">
                        <p class="text-stone-600 text-sm mb-4">Besoin de plus de séances ?</p>
                        <button onclick="app.navigate('tarifs')" class="text-emerald-700 font-medium hover:underline">
                            Voir les packs de crédits →
                        </button>
                    </div>

                    <!-- Réservations à venir -->
                    <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                        <h3 class="font-medium mb-4 text-stone-800">Mes séances à venir</h3>
                        ${futureBookings.length === 0 ? '<p class="text-sm text-stone-400">Aucune séance prévue.</p>' : 
                        `<div class="space-y-3">
                            ${futureBookings.map(c => {
                                const classDate = new Date(c.date + 'T' + c.time);
                                const hoursDiff = (classDate - now) / 1000 / 60 / 60;
                                const canCancel = hoursDiff >= delayHours;
                                return `
                                <div class="p-3 border border-stone-100 rounded-xl bg-stone-50">
                                    <div class="font-medium text-emerald-800">${c.title}</div>
                                    <div class="text-sm text-stone-600">${new Date(c.date).toLocaleDateString('fr-FR')} à ${c.time}</div>
                                    ${canCancel ? 
                                        `<div class="mt-2 flex justify-between items-center">
                                            <span class="text-xs text-stone-500">Annulable jusqu'à ${delayHours}h avant</span>
                                            <button onclick="app.deleteClass(${c.id})" class="text-xs text-red-500 hover:underline">Annuler le cours</button>
                                        </div>` : 
                                        `<div class="mt-2 text-xs text-stone-400">Annulation impossible (moins de ${delayHours}h avant)</div>`
                                    }
                                </div>`;
                            }).join('')}
                        </div>`}
                    </div>

                    <!-- Historique -->
                    <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                        <h3 class="font-medium mb-4 text-stone-800">Historique</h3>
                        ${pastBookings.length === 0 ? '<p class="text-sm text-stone-400">Aucun historique.</p>' : 
                        `<div class="space-y-3 max-h-60 overflow-y-auto pr-2">
                            ${pastBookings.map(c => `
                                <div class="p-3 border border-stone-100 rounded-xl opacity-70">
                                    <div class="font-medium text-stone-700">${c.title}</div>
                                    <div class="text-sm text-stone-500">${new Date(c.date).toLocaleDateString('fr-FR')}</div>
                                </div>
                            `).join('')}
                        </div>`}
                    </div>
                </div>
            </div>
        </div>`;
};
