import { icons } from '../icons.js';
import { getNotificationHtml } from './components.js';

export const adminView = (app) => {
    const st = app.state;
    if (!st.currentUser || st.currentUser.role !== 'admin') return '<div class="p-20 text-center">Accès refusé</div>';

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingClasses = st.classes.filter(c => c.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const pastClasses = st.classes.filter(c => c.date < todayStr).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
    const displayClasses = st.adminTab === 'past_sessions' ? pastClasses : upcomingClasses;

    const clients = st.users.filter(u => u.role !== 'admin');

    return `
        <div class="min-h-screen bg-stone-50 pt-12 pb-24 animate-fade-in">
            <div class="max-w-6xl mx-auto px-4">
                <h1 class="text-3xl font-light text-stone-800 mb-8">Tableau de bord Administrateur</h1>
                
                <!-- Onglets Admin -->
                <div class="flex gap-4 mb-8 border-b border-stone-200 overflow-x-auto">
                    <button onclick="app.state.adminTab='planning'; app.render()" class="pb-4 px-2 whitespace-nowrap ${st.adminTab === 'planning' ? 'text-emerald-700 border-b-2 border-emerald-700 font-medium' : 'text-stone-500'}">Séances à venir</button>
                    <button onclick="app.state.adminTab='past_sessions'; app.render()" class="pb-4 px-2 whitespace-nowrap ${st.adminTab === 'past_sessions' ? 'text-emerald-700 border-b-2 border-emerald-700 font-medium' : 'text-stone-500'}">Séances passées</button>
                    <button onclick="app.state.adminTab='templates'; app.render()" class="pb-4 px-2 whitespace-nowrap ${st.adminTab === 'templates' ? 'text-emerald-700 border-b-2 border-emerald-700 font-medium' : 'text-stone-500'}">Modèles de cours</button>
                    <button onclick="app.state.adminTab='users'; app.render()" class="pb-4 px-2 whitespace-nowrap ${st.adminTab === 'users' ? 'text-emerald-700 border-b-2 border-emerald-700 font-medium' : 'text-stone-500'}">Clients</button>
                    <button onclick="app.state.adminTab='newsletter'; app.render()" class="pb-4 px-2 whitespace-nowrap ${st.adminTab === 'newsletter' ? 'text-emerald-700 border-b-2 border-emerald-700 font-medium' : 'text-stone-500'}">Newsletter</button>
                    <button onclick="app.state.adminTab='settings'; app.render()" class="pb-4 px-2 whitespace-nowrap ${st.adminTab === 'settings' ? 'text-emerald-700 border-b-2 border-emerald-700 font-medium' : 'text-stone-500'}">Studio</button>
                </div>

                ${getNotificationHtml(app)}

                ${st.adminTab === 'planning' || st.adminTab === 'past_sessions' ? `
                    <div class="grid md:grid-cols-3 gap-8">
                        ${st.adminTab === 'planning' ? `
                        <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                            <h2 class="text-xl font-medium mb-6">Ajouter un cours</h2>
                            <form onsubmit="app.submitAddClass(event)" class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-stone-700 mb-1">Modèle de cours</label>
                                    <select id="planning-template-select" onchange="app.applyTemplate()" class="w-full p-2 border border-stone-200 rounded-lg bg-stone-50 text-sm">
                                        <option value="">-- Sélectionner --</option>
                                        ${st.courseTemplates.map(t => `<option value="${t.id}">${t.title}</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-stone-700 mb-1">Date</label>
                                    <input type="date" id="planning-date" required class="w-full p-2 border border-stone-200 rounded-lg">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-stone-700 mb-1">Heure</label>
                                    <input type="time" id="planning-time" required class="w-full p-2 border border-stone-200 rounded-lg">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-stone-700 mb-1">Capacité</label>
                                    <input type="number" id="planning-capacity" value="10" min="1" class="w-full p-2 border border-stone-200 rounded-lg">
                                </div>
                                <button type="submit" class="w-full py-3 bg-emerald-800 text-white rounded-xl font-medium hover:bg-emerald-900 transition">Ajouter au planning</button>
                                
                                <!-- Champs cachés pour le template -->
                                <input type="hidden" id="planning-title">
                                <textarea id="planning-desc" class="hidden"></textarea>
                                <input type="hidden" id="planning-duration">
                                <input type="hidden" id="planning-price">
                                <input type="hidden" id="planning-credits-price">
                            </form>
                        </div>
                        ` : ''}
                        
                        <div class="${st.adminTab === 'planning' ? 'md:col-span-2' : 'md:col-span-3'} bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                            <div class="p-6 border-b border-stone-100 bg-stone-50">
                                <h2 class="text-xl font-medium text-stone-800">${st.adminTab === 'planning' ? 'Séances à venir' : 'Historique des séances'}</h2>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="w-full text-left border-collapse">
                                    <thead>
                                        <tr class="text-sm text-stone-500 border-b border-stone-100">
                                            <th class="p-4 font-medium">Date & Heure</th>
                                            <th class="p-4 font-medium">Cours</th>
                                            <th class="p-4 font-medium text-center">Inscrits</th>
                                            <th class="p-4 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${displayClasses.length === 0 ? `<tr><td colspan="4" class="p-8 text-center text-stone-400">Aucune séance</td></tr>` : 
                                        displayClasses.map(c => `
                                            <tr class="border-b border-stone-50 hover:bg-stone-50/50 transition">
                                                <td class="p-4">
                                                    <div class="font-medium text-stone-800">${new Date(c.date).toLocaleDateString('fr-FR')}</div>
                                                    <div class="text-xs text-stone-500">${c.time} (${c.duration} min)</div>
                                                </td>
                                                <td class="p-4">
                                                    <div class="font-medium text-emerald-800">${c.title}</div>
                                                    <div class="text-xs text-stone-400">${c.price}€ / ${c.credits_price || 0} crédits</div>
                                                </td>
                                                <td class="p-4 text-center">
                                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bookedUsers.length >= c.capacity ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}">
                                                        ${c.bookedUsers.length} / ${c.capacity}
                                                    </span>
                                                </td>
                                                <td class="p-4 text-right">
                                                    <button onclick="app.deleteClass(${c.id})" class="text-red-400 hover:text-red-600 p-2 transition" title="Supprimer">
                                                        ${icons.trash}
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${st.adminTab === 'templates' ? `
                    <div class="grid md:grid-cols-3 gap-8 animate-fade-in">
                        <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                            <h2 class="text-xl font-medium text-stone-800 mb-6">${st.editingTemplateId ? 'Modifier le modèle' : 'Nouveau modèle'}</h2>
                            <form onsubmit="event.preventDefault(); app.saveAsTemplate()" class="space-y-4">
                                ${(() => {
                                    const t = st.editingTemplateId ? st.courseTemplates.find(x => x.id === st.editingTemplateId) : null;
                                    return `
                                        <div>
                                            <label class="block text-sm font-medium text-stone-700 mb-1">Titre du cours</label>
                                            <input type="text" id="template-title" required class="w-full p-2 border border-stone-200 rounded-lg" value="${t?.title || ''}">
                                        </div>
                                        <div>
                                            <div class="flex justify-between items-center mb-1">
                                                <label class="block text-sm font-medium text-stone-700">Description</label>
                                                <button type="button" id="btn-generate-desc" onclick="app.generateAdminDescription()" class="text-xs text-emerald-600 hover:text-emerald-800 font-medium">✨ IA</button>
                                            </div>
                                            <textarea id="template-desc" rows="3" class="w-full p-2 border border-stone-200 rounded-lg text-sm">${t ? t.description : ''}</textarea>
                                        </div>
                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <label class="block text-sm font-medium text-stone-700 mb-1">Durée (min)</label>
                                                <input type="number" id="template-duration" required class="w-full p-2 border border-stone-200 rounded-lg" value="${t?.duration || ''}">
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-stone-700 mb-1">Prix (€)</label>
                                                <input type="number" id="template-price" required class="w-full p-2 border border-stone-200 rounded-lg" value="${t?.default_price || ''}">
                                            </div>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-stone-700 mb-1">Prix (Crédits)</label>
                                            <input type="number" id="template-credits-price" required class="w-full p-2 border border-stone-200 rounded-lg" value="${t?.default_credits_price ?? ''}">
                                        </div>
                                    `;
                                })()}
                                <button type="submit" class="w-full py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-900 transition">
                                    ${st.editingTemplateId ? 'Mettre à jour' : 'Enregistrer le modèle'}
                                </button>
                                ${st.editingTemplateId ? `<button type="button" onclick="app.cancelEditTemplate()" class="w-full py-2 text-stone-500 text-sm hover:underline">Annuler</button>` : ''}
                            </form>
                        </div>
                        <div class="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                            <h2 class="text-xl font-medium text-stone-800 mb-6">Catalogue des cours</h2>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                ${st.courseTemplates.map(t => `
                                    <div onclick="app.editTemplate(${t.id})" class="p-4 border border-stone-100 rounded-2xl hover:border-emerald-300 transition cursor-pointer group bg-stone-50/50">
                                        <div class="font-medium text-emerald-800 group-hover:text-emerald-600">${t.title}</div>
                                        <div class="text-xs text-stone-500 mb-2">${t.duration} min • ${t.default_price}€ / ${t.default_credits_price || 0} crédits</div>
                                        <p class="text-xs text-stone-400 line-clamp-2">${t.description || 'Aucune description'}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${st.adminTab === 'users' ? `
                    <div class="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden animate-fade-in">
                        <div class="p-6 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                            <h2 class="text-xl font-medium text-stone-800">Clients inscrits</h2>
                            <span class="text-sm text-stone-500">${clients.length} client(s)</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="text-sm text-stone-500 border-b border-stone-100">
                                        <th class="p-4 font-medium">Nom</th>
                                        <th class="p-4 font-medium">Email</th>
                                        <th class="p-4 font-medium">Téléphone</th>
                                        <th class="p-4 font-medium">Solde</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${clients.map(u => `
                                        <tr class="border-b border-stone-50 hover:bg-stone-50/50 transition">
                                            <td class="p-4 font-medium text-stone-800">${u.firstName} ${u.lastName}</td>
                                            <td class="p-4 text-stone-600 text-sm">${u.email}</td>
                                            <td class="p-4 text-stone-600 text-sm">${u.phone || '-'}</td>
                                            <td class="p-4"><span class="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">${u.credits_balance} crédits</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}

                ${st.adminTab === 'newsletter' ? `
                    <div class="max-w-2xl bg-white p-8 rounded-3xl shadow-sm border border-stone-100 animate-fade-in">
                        <h2 class="text-xl font-medium text-stone-800 mb-6 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            Envoyer une Newsletter
                        </h2>
                        <form onsubmit="app.sendNewsletter(event)" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-stone-700 mb-1">Objet</label>
                                <input type="text" id="nl-subject" required class="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Nouveaux cours disponibles !">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-stone-700 mb-1">Message</label>
                                <textarea id="nl-message" required rows="6" class="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="Bonjour à tous..."></textarea>
                            </div>
                            <button type="submit" class="w-full py-4 bg-emerald-800 text-white rounded-xl font-medium hover:bg-emerald-900 transition">
                                Envoyer aux ${clients.length} clients
                            </button>
                        </form>
                    </div>
                ` : ''}

                ${st.adminTab === 'settings' ? `
                    <div class="max-w-md bg-white p-8 rounded-3xl shadow-sm border border-stone-100 animate-fade-in">
                        <h2 class="text-xl font-medium text-stone-800 mb-6">Paramètres du Studio</h2>
                        <form onsubmit="app.updateStudioSettings(event)" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-stone-700 mb-1">Adresse</label>
                                <input type="text" id="admin-studio-address" required class="w-full p-2 border border-stone-200 rounded-lg" value="${st.studioAddress}">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-stone-700 mb-1">Téléphone</label>
                                <input type="tel" id="admin-studio-phone" required class="w-full p-2 border border-stone-200 rounded-lg" value="${st.studioPhone}">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-stone-700 mb-1">Email</label>
                                <input type="email" id="admin-studio-email" required class="w-full p-2 border border-stone-200 rounded-lg" value="${st.studioEmail}">
                            </div>
                            <button type="submit" class="w-full py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-900 transition">Enregistrer les modifications</button>
                        </form>
                    </div>
                ` : ''}
            </div>
        </div>`;
};
