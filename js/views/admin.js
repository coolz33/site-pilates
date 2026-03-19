import { icons } from '../icons.js';
import { getNotificationHtml } from './components.js';

export const adminView = (app) => {
    const st = app.state;
    if (!st.currentUser || st.currentUser.role !== 'admin') return '<div class="p-20 text-center">Accès refusé</div>';

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingClasses = st.classes.filter(c => c.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const pastClasses = st.classes.filter(c => c.date < todayStr).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

    const query = (st.userSearchQuery || '').toLowerCase();
    const clients = st.users.filter(u => u.role !== 'admin').filter(u => {
        if (!query) return true;
        return (u.firstName?.toLowerCase().includes(query) || 
                u.lastName?.toLowerCase().includes(query) || 
                u.email?.toLowerCase().includes(query) || 
                u.phone?.includes(query));
    });

    // Logique de filtrage avancée pour les séances
    const f = st.adminClassFilters;
    let filteredClasses = st.adminTab === 'past_sessions' ? pastClasses : upcomingClasses;
    
    filteredClasses = filteredClasses.filter(c => {
        if (f.startDate && c.date < f.startDate) return false;
        if (f.endDate && c.date > f.endDate) return false;
        if (f.startTime && c.time < f.startTime) return false;
        if (f.endTime && c.time > f.endTime) return false;
        if (f.titles.length > 0 && !f.titles.includes(c.title)) return false;
        if (f.minBooked !== '' && c.bookedUsers.length < parseInt(f.minBooked)) return false;
        if (f.maxBooked !== '' && c.bookedUsers.length > parseInt(f.maxBooked)) return false;
        if (f.userName) {
            const q = f.userName.toLowerCase();
            const hasUser = c.bookedUsers.some(uid => {
                const u = st.users.find(user => user.id === uid);
                return u && (u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q));
            });
            if (!hasUser) return false;
        }
        return true;
    });

    const allTitles = [...new Set(st.classes.map(c => c.title))].sort();

    return `
        <div class="min-h-[70vh] bg-stone-50 pt-6 pb-8 animate-fade-in dark:bg-stone-900 max-w-[85%] md:max-w-[80%] mx-auto">
            <div class="w-full px-4">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <!-- Menu Latéral -->
                    <aside class="md:col-span-3 bg-white dark:bg-stone-800 p-4 rounded-2xl self-start shadow-sm border border-stone-100 dark:border-stone-700">
                        <h1 class="text-2xl font-light text-stone-800 mb-6 px-2 dark:text-stone-100">Administration</h1>
                        <nav class="space-y-1">
                            <button onclick="app.setAdminTab('planning')" class="w-full text-left px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${st.adminTab === 'planning' ? 'bg-emerald-50 text-emerald-800 font-medium dark:bg-emerald-900/50 dark:text-emerald-300' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700'}">📅 Séances à venir</button>
                            <button onclick="app.setAdminTab('past_sessions')" class="w-full text-left px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${st.adminTab === 'past_sessions' ? 'bg-emerald-50 text-emerald-800 font-medium dark:bg-emerald-900/50 dark:text-emerald-300' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700'}">🕰️ Séances passées</button>
                            <button onclick="app.setAdminTab('templates')" class="w-full text-left px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${st.adminTab === 'templates' ? 'bg-emerald-50 text-emerald-800 font-medium dark:bg-emerald-900/50 dark:text-emerald-300' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700'}">📋 Modèles de cours</button>
                            <button onclick="app.setAdminTab('packages')" class="w-full text-left px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${st.adminTab === 'packages' ? 'bg-emerald-50 text-emerald-800 font-medium dark:bg-emerald-900/50 dark:text-emerald-300' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700'}">💳 Tarifs & Packs</button>
                            <button onclick="app.setAdminTab('users')" class="w-full text-left px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${st.adminTab === 'users' ? 'bg-emerald-50 text-emerald-800 font-medium dark:bg-emerald-900/50 dark:text-emerald-300' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700'}">👥 Clients</button>
                            <button onclick="app.setAdminTab('newsletter')" class="w-full text-left px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${st.adminTab === 'newsletter' ? 'bg-emerald-50 text-emerald-800 font-medium dark:bg-emerald-900/50 dark:text-emerald-300' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700'}">✉️ Newsletter</button>
                            <button onclick="app.setAdminTab('settings')" class="w-full text-left px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${st.adminTab === 'settings' ? 'bg-emerald-50 text-emerald-800 font-medium dark:bg-emerald-900/50 dark:text-emerald-300' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700'}">⚙️ Studio</button>
                        </nav>
                    </aside>

                    ${st.isAdminAiLoading ? '<div class="md:col-span-9 p-10 text-center text-stone-500 animate-pulse">Chargement des données...</div>' : ''}

                    ${!st.isAdminAiLoading && (st.adminTab === 'planning' || st.adminTab === 'past_sessions') ? `
                        <!-- Colonne 2: Liste des Séances (Élargie) -->
                        <div class="md:col-span-6 space-y-6">
                            <div class="bg-white rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                                ${st.selectedAdminClasses.length > 0 ? `
                                    <div class="p-4 bg-red-50 border-b border-red-100 rounded-t-3xl flex justify-between items-center animate-fade-in dark:bg-red-900/20 dark:border-red-900/30">
                                        <span class="text-sm font-medium text-red-800 dark:text-red-300">${st.selectedAdminClasses.length} séance(s) sélectionnée(s)</span>
                                        <button onclick="app.adminBulkDeleteClasses()" class="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-2">
                                            ${icons.trash} Supprimer la sélection
                                        </button>
                                    </div>
                                ` : `
                            <div class="p-6 border-b border-stone-100 bg-stone-50 rounded-t-3xl dark:bg-stone-800 dark:border-stone-700">
                                <div class="flex justify-between items-center">
                                    <h2 class="text-xl font-medium text-stone-800 dark:text-stone-100">${st.adminTab === 'planning' ? 'Séances à venir' : 'Historique des séances'}</h2>
                                    <span class="text-xs text-stone-400">${filteredClasses.length} résultat(s)</span>
                                </div>
                            </div>
                                `}
                            <div class="overflow-x-auto">
                                <table class="w-full text-left border-collapse">
                                    <thead>
                                        <tr class="text-sm text-stone-500 border-b border-stone-100 dark:text-stone-400 dark:border-stone-700">
                                            <th class="p-4 w-10">
                                                <input 
                                                    type="checkbox" 
                                                    onchange="app.toggleAllAdminClasses(this.checked, ${JSON.stringify(filteredClasses.map(c => c.id)).replace(/"/g, '&quot;')})" 
                                                    ${st.selectedAdminClasses.length === filteredClasses.length && filteredClasses.length > 0 ? 'checked' : ''}
                                                    class="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                                >
                                            </th>
                                            <th class="p-4 font-medium">Date & Heure</th>
                                            <th class="p-4 font-medium w-1/2">Cours</th>
                                            <th class="p-4 font-medium text-center w-1/8">Inscrits</th>
                                            <th class="p-4 font-medium text-right w-1/8">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${filteredClasses.length === 0 ? `<tr><td colspan="5" class="p-8 text-center text-stone-400 dark:text-stone-500">Aucune séance trouvée</td></tr>` : 
                                        filteredClasses.map(c => `
                                            <tr class="border-b border-stone-50 hover:bg-stone-50/50 transition dark:border-stone-700/50 dark:hover:bg-stone-700/50 ${st.selectedAdminClasses.includes(c.id) ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}">
                                                <td class="p-4">
                                                    <input 
                                                        type="checkbox" 
                                                        onchange="app.toggleAdminClassSelection(${c.id})" 
                                                        ${st.selectedAdminClasses.includes(c.id) ? 'checked' : ''}
                                                        class="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                                    >
                                                </td>
                                                <td class="p-4 whitespace-nowrap">
                                                    <div class="font-medium text-stone-800 dark:text-stone-200">${new Date(c.date).toLocaleDateString('fr-FR')}</div>
                                                    <div class="text-xs text-stone-500 dark:text-stone-400">${c.time} (${c.duration} min)</div>
                                                </td>
                                                <td class="p-4 truncate-single-line">
                                                    <div class="font-medium text-emerald-800 dark:text-emerald-400">${c.title}</div>
                                                    <div class="text-xs text-stone-400 dark:text-stone-500">${c.credits_price || 1} crédits</div>
                                                </td>
                                                <td class="p-4 text-center whitespace-nowrap relative group">
                                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bookedUsers.length >= c.capacity ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'}">
                                                        ${c.bookedUsers.length} / ${c.capacity}
                                                    </span>
                                                    ${c.bookedUsers.length > 0 ? `
                                                        <div class="planning-tooltip admin-booked-users-tooltip absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-[100] shadow-2xl pointer-events-none">
                                                            <h4 class="font-bold mb-1 text-sm">Inscrits:</h4>
                                                            <ul class="list-disc list-inside text-left text-xs space-y-0.5">
                                                                ${c.bookedUsers.map(userId => {
                                                                    const user = st.users.find(u => u.id === userId);
                                                                    return user ? `<li>${user.firstName} ${user.lastName}</li>` : '';
                                                                }).join('')}
                                                            </ul>
                                                            <div class="absolute border-8 border-transparent border-t-[rgba(240,253,244,0.92)] dark:border-t-[rgba(6,78,59,0.9)] -bottom-4 left-1/2 -translate-x-1/2"></div>
                                                        </div>
                                                    ` : ''}
                                                </td>
                                                <td class="p-4 text-right whitespace-nowrap">
                                                    <button onclick="app.adminDeleteClass(${c.id})" class="text-red-400 hover:text-red-600 p-2 transition" title="Supprimer">
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
                        <!-- Colonne 3: Filtres, Ajouter un cours & Paramètres -->
                        <div class="md:col-span-3 space-y-6">
                            <!-- Zone de Filtres Avancés -->
                            <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                                <h3 class="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    ${icons.sparkles} Filtres de recherche
                                </h3>
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-[10px] font-bold text-stone-400 uppercase mb-1">Période (Du / Au)</label>
                                        <div class="flex gap-2">
                                            <input type="date" id="filter-date-start" value="${f.startDate}" oninput="app.handleAdminClassFilterChange('startDate', this.value)" class="w-full p-2 text-xs border border-stone-100 rounded-lg dark:bg-stone-700 dark:border-stone-600 dark:[color-scheme:dark]">
                                            <input type="date" id="filter-date-end" value="${f.endDate}" oninput="app.handleAdminClassFilterChange('endDate', this.value)" class="w-full p-2 text-xs border border-stone-100 rounded-lg dark:bg-stone-700 dark:border-stone-600 dark:[color-scheme:dark]">
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-bold text-stone-400 uppercase mb-1">Heures (De / À)</label>
                                        <div class="flex gap-2">
                                            <input type="time" id="filter-time-start" value="${f.startTime}" oninput="app.handleAdminClassFilterChange('startTime', this.value)" class="w-full p-2 text-xs border border-stone-100 rounded-lg dark:bg-stone-700 dark:border-stone-600 dark:[color-scheme:dark]">
                                            <input type="time" id="filter-time-end" value="${f.endTime}" oninput="app.handleAdminClassFilterChange('endTime', this.value)" class="w-full p-2 text-xs border border-stone-100 rounded-lg dark:bg-stone-700 dark:border-stone-600 dark:[color-scheme:dark]">
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-bold text-stone-400 uppercase mb-1">Nb Inscrits (Min / Max)</label>
                                        <div class="flex gap-2">
                                            <input type="number" placeholder="Min" value="${f.minBooked}" oninput="app.handleAdminClassFilterChange('minBooked', this.value)" class="w-full p-2 text-xs border border-stone-100 rounded-lg dark:bg-stone-700 dark:border-stone-600">
                                            <input type="number" placeholder="Max" value="${f.maxBooked}" oninput="app.handleAdminClassFilterChange('maxBooked', this.value)" class="w-full p-2 text-xs border border-stone-100 rounded-lg dark:bg-stone-700 dark:border-stone-600">
                                        </div>
                                    </div>
                                    <div class="relative">
                                        <label class="block text-[10px] font-bold text-stone-400 uppercase mb-1">Nom inscrit</label>
                                        <input list="filter-users-list" id="filter-user-name" placeholder="Rechercher un client..." value="${f.userName}" oninput="app.handleAdminClassFilterChange('userName', this.value)" class="w-full p-2 pr-7 text-xs border border-stone-100 rounded-lg dark:bg-stone-700 dark:border-stone-600">
                                        <datalist id="filter-users-list">
                                            ${st.users.filter(u => u.role !== 'admin').map(u => `<option value="${u.firstName} ${u.lastName}">`).join('')}
                                        </datalist>
                                        ${f.userName ? `
                                            <button 
                                                type="button"
                                                onclick="app.handleAdminClassFilterChange('userName', ''); document.getElementById('filter-user-name')?.focus();" 
                                                class="absolute right-2 top-[22px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1"
                                                title="Effacer"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                            </button>
                                        ` : ''}
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-bold text-stone-400 uppercase mb-1">Type de cours</label>
                                        <input list="filter-titles-list" placeholder="Sélectionner un cours..." value="${f.titles[0] || ''}" oninput="app.handleAdminClassFilterChange('titles', this.value ? [this.value] : [])" class="w-full p-2 text-xs border border-stone-100 rounded-lg dark:bg-stone-700 dark:border-stone-600">
                                        <datalist id="filter-titles-list">
                                            ${allTitles.map(t => `<option value="${t}">`).join('')}
                                        </datalist>
                                    </div>
                                </div>
                                ${Object.values(f).some(v => v !== '' && (!Array.isArray(v) || v.length > 0)) ? `
                                    <button onclick="app.state.adminClassFilters = {startDate:'',endDate:'',startTime:'',endTime:'',titles:[],minBooked:'',maxBooked:'',userName:''}; app.render();" class="mt-4 text-[10px] text-stone-400 hover:text-red-500 underline uppercase tracking-tighter">
                                        Réinitialiser tous les filtres
                                    </button>
                                ` : ''}
                            </div>

                            ${st.adminTab === 'planning' ? `
                            <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                                <h2 class="text-xl font-medium mb-6 dark:text-stone-100">Ajouter un cours</h2>
                                <form onsubmit="app.submitAddClass(event)" id="add-class-form" class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Modèle de cours</label>
                                        <select id="planning-template-select" onchange="app.handleAdminAddClassFormChange('templateId', this.value); app.applyTemplate();" class="w-full p-2 border border-stone-200 rounded-lg bg-stone-50 text-sm dark:bg-stone-700 dark:border-stone-600">
                                            <option value="">-- Sélectionner --</option>
                                            ${st.courseTemplates.map(t => `<option value="${t.id}" ${st.adminAddClassForm.templateId == t.id ? 'selected' : ''}>${t.title}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Date</label>
                                        <input type="date" id="planning-date" value="${st.adminAddClassForm.date}" oninput="app.handleAdminAddClassFormChange('date', this.value)" required class="w-full p-2 border border-stone-200 rounded-lg dark:bg-stone-700 dark:border-stone-600 dark:[color-scheme:dark]">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Heure</label>
                                        <input type="time" id="planning-time" value="${st.adminAddClassForm.time}" oninput="app.handleAdminAddClassFormChange('time', this.value)" required class="w-full p-2 border border-stone-200 rounded-lg dark:bg-stone-700 dark:border-stone-600 dark:[color-scheme:dark]">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Capacité</label>
                                        <input type="number" id="planning-capacity" value="${st.adminAddClassForm.capacity}" oninput="app.handleAdminAddClassFormChange('capacity', this.value)" min="1" class="w-full p-2 border border-stone-200 rounded-lg dark:bg-stone-700 dark:border-stone-600">
                                    </div>
                                    <div>
                                        <label class="flex items-center gap-2 cursor-pointer mb-2">
                                            <input type="checkbox" id="planning-is-recurring" onchange="app.toggleAdminRecurring()" ${st.isAdminRecurring ? 'checked' : ''} class="w-4 h-4 text-emerald-600 rounded">
                                            <span class="text-sm font-medium text-stone-700 dark:text-stone-200">Rendre ce cours récurrent</span>
                                        </label>
                                    </div>
                                    <div id="recurring-fields" class="${st.isAdminRecurring ? '' : 'hidden'} space-y-4 p-4 bg-stone-50 rounded-xl border border-stone-100 dark:bg-stone-700/30 dark:border-stone-600 animate-fade-in">
                                        <div>
                                            <label class="block text-xs font-medium text-stone-500 mb-1 dark:text-stone-400">Fréquence</label>
                                            <select id="planning-recurrence-type" onchange="app.handleAdminAddClassFormChange('recurrenceType', this.value)" class="w-full p-2 border border-stone-200 rounded-lg text-sm dark:bg-stone-700 dark:border-stone-600">
                                                <option value="daily" ${st.adminAddClassForm.recurrenceType === 'daily' ? 'selected' : ''}>Quotidienne</option>
                                                <option value="weekly" ${st.adminAddClassForm.recurrenceType === 'weekly' ? 'selected' : ''}>Hebdomadaire</option>
                                                <option value="monthly" ${st.adminAddClassForm.recurrenceType === 'monthly' ? 'selected' : ''}>Mensuelle</option>
                                                <option value="yearly" ${st.adminAddClassForm.recurrenceType === 'yearly' ? 'selected' : ''}>Annuelle</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="block text-xs font-medium text-stone-500 mb-1 dark:text-stone-400">Jusqu'au (inclus)</label>
                                            <input type="date" id="planning-recurrence-end" value="${st.adminAddClassForm.recurrenceEnd}" oninput="app.handleAdminAddClassFormChange('recurrenceEnd', this.value)" class="w-full p-2 border border-stone-200 rounded-lg text-sm dark:bg-stone-700 dark:border-stone-600 dark:[color-scheme:dark]">
                                        </div>
                                    </div>
                                    <button type="submit" class="w-full py-3 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-[0.98] dark:from-emerald-600 dark:to-emerald-800">Ajouter au planning</button>
                                    
                                    <!-- Champs cachés pour le template -->
                                    <input type="hidden" id="planning-title" value="${st.adminAddClassForm.title}">
                                    <textarea id="planning-desc" class="hidden">${st.adminAddClassForm.description}</textarea>
                                    <input type="hidden" id="planning-duration" value="${st.adminAddClassForm.duration}">
                                    <input type="hidden" id="planning-credits-price" value="${st.adminAddClassForm.creditsPrice}">
                                </form>
                            </div>

                            <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                                <h2 class="text-lg font-medium mb-4 text-stone-800 dark:text-stone-100">Paramètres</h2>
                                <form onsubmit="app.updateCancellationDelay(event)">
                                    <label class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Délai d'annulation (heures)</label>
                                    <div class="flex gap-2">
                                        <input type="number" id="admin-cancellation-delay" required min="0" class="w-full p-2 border border-stone-200 rounded-lg dark:bg-stone-700 dark:border-stone-600" value="${st.cancellationDelay}">
                                        <button type="submit" class="px-4 py-2 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-900 transition text-sm">OK</button>
                                    </div>
                                </form>
                            </div>
                        ` : ''}
                        </div>
                    ` : ''}

                ${!st.isAdminAiLoading && st.adminTab === 'templates' ? `
                    <div class="md:col-span-9 grid md:grid-cols-3 gap-8 animate-fade-in">
                        <div class="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                            <h2 class="text-xl font-medium text-stone-800 mb-6 dark:text-stone-100">Catalogue des cours</h2>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                ${st.courseTemplates.map(t => `
                                    <div class="relative py-2 px-3 border border-stone-100 rounded-2xl hover:border-emerald-300 transition group bg-stone-50/50 dark:border-stone-700 dark:hover:border-emerald-600 dark:bg-stone-700/50">
                                        <div onclick="app.editTemplate(${t.id})" class="cursor-pointer">
                                            <div class="font-medium text-emerald-800 group-hover:text-emerald-600 dark:text-emerald-400 dark:group-hover:text-emerald-300 line-clamp-2">${t.title}</div>
                                            <div class="text-xs text-stone-500 dark:text-stone-400">${t.duration} min • ${t.default_credits_price || 1} crédits</div>
                                        </div>
                                        <button onclick="app.deleteTemplate(${t.id})" class="absolute top-1 right-1 p-1 text-stone-400 hover:text-red-500 transition-colors">
                                            ${icons.trash}
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                            <h2 class="text-xl font-medium text-stone-800 mb-6 dark:text-stone-100">${st.editingTemplateId ? 'Modifier le modèle' : 'Nouveau modèle'}</h2>
                            <form onsubmit="event.preventDefault(); app.saveAsTemplate()" class="space-y-4">
                                ${(() => {
                                    const t = st.editingTemplateId ? st.courseTemplates.find(x => x.id === st.editingTemplateId) : null;
                                    return `
                                        <div>
                                            <label class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Titre du cours</label>
                                            <input type="text" id="template-title" required class="w-full p-2 border border-stone-200 rounded-lg dark:bg-stone-700 dark:border-stone-600" value="${t?.title || ''}">
                                        </div>
                                        <div>
                                            <div class="flex justify-between items-center mb-1">
                                                <label class="block text-sm font-medium text-stone-700 dark:text-stone-200">Description</label>
                                                <button type="button" id="btn-generate-desc" onclick="app.generateAdminDescription()" class="text-xs text-emerald-600 hover:text-emerald-800 font-medium dark:text-emerald-400 dark:hover:text-emerald-300">✨ IA</button>
                                            </div>
                                            <textarea id="template-desc" rows="3" class="w-full p-2 border border-stone-200 rounded-lg text-sm dark:bg-stone-700 dark:border-stone-600">${t ? t.description : ''}</textarea>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Durée (min)</label>
                                            <input type="number" id="template-duration" required class="w-full p-2 border border-stone-200 rounded-lg dark:bg-stone-700 dark:border-stone-600" value="${t?.duration || ''}">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Prix (Crédits)</label>
                                            <input type="number" id="template-credits-price" required class="w-full p-2 border border-stone-200 rounded-lg dark:bg-stone-700 dark:border-stone-600" value="${t?.default_credits_price ?? ''}">
                                        </div>
                                    `;
                                })()}
                                <button type="submit" class="w-full py-3 bg-gradient-to-r from-stone-700 to-stone-900 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-[0.98] dark:from-stone-600 dark:to-stone-800">
                                    ${st.editingTemplateId ? 'Mettre à jour' : 'Enregistrer le modèle'}
                                </button>
                                ${st.editingTemplateId ? `<button type="button" onclick="app.cancelEditTemplate()" class="w-full py-2 text-stone-500 text-sm hover:underline dark:text-stone-400">Annuler</button>` : ''}
                            </form>
                        </div>
                    </div>
                ` : ''}

                ${!st.isAdminAiLoading && st.adminTab === 'packages' ? `
                    <div class="md:col-span-9 bg-white p-8 rounded-3xl shadow-sm border border-stone-100 animate-fade-in dark:bg-stone-800 dark:border-stone-700">
                        <h2 class="text-xl font-medium text-stone-800 mb-6 dark:text-stone-100">Gestion des Tarifs (Packs de crédits)</h2>
                        <div class="space-y-6">
                            ${st.creditPackages.map(pkg => `
                                <form onsubmit="app.updatePackage(event, ${pkg.id})" class="flex flex-col md:flex-row gap-4 items-end p-4 border border-stone-100 rounded-xl bg-stone-50/50 dark:border-stone-700 dark:bg-stone-700/50">
                                    <div class="flex-1 w-full">
                                        <label class="block text-xs font-medium text-stone-500 mb-1 dark:text-stone-400">Nom du pack</label>
                                        <input type="text" name="name" value="${pkg.name}" required class="w-full p-2 border border-stone-200 rounded-lg text-sm dark:bg-stone-700 dark:border-stone-600">
                                    </div>
                                    <div class="w-full md:w-24">
                                        <label class="block text-xs font-medium text-stone-500 mb-1 dark:text-stone-400">Crédits</label>
                                        <input type="number" name="credits" value="${pkg.credits}" required min="1" class="w-full p-2 border border-stone-200 rounded-lg text-sm text-center dark:bg-stone-700 dark:border-stone-600">
                                    </div>
                                    <div class="w-full md:w-24">
                                        <label class="block text-xs font-medium text-stone-500 mb-1 dark:text-stone-400">Prix (€)</label>
                                        <input type="number" name="price" value="${pkg.price}" required min="0" class="w-full p-2 border border-stone-200 rounded-lg text-sm text-center dark:bg-stone-700 dark:border-stone-600">
                                    </div>
                                    <button type="submit" class="w-full md:w-auto px-5 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-900 transition-all shadow-sm active:scale-[0.98] dark:bg-stone-600 dark:hover:bg-stone-500">Mettre à jour</button>
                                </form>
                            `).join('')}
                            
                            <div class="pt-6 border-t border-stone-100 dark:border-stone-700">
                                <h3 class="text-sm font-medium text-stone-800 mb-4 dark:text-stone-100">Ajouter un nouveau pack</h3>
                                <form onsubmit="app.createPackage(event)" class="flex flex-col md:flex-row gap-4 items-end">
                                    <input type="text" name="name" placeholder="Nom (ex: Pack Découverte)" required class="flex-1 w-full p-2 border border-stone-200 rounded-lg text-sm dark:bg-stone-700 dark:border-stone-600">
                                    <input type="number" name="credits" placeholder="Crédits" required min="1" class="w-full md:w-24 p-2 border border-stone-200 rounded-lg text-sm text-center dark:bg-stone-700 dark:border-stone-600">
                                    <input type="number" name="price" placeholder="Prix €" required min="0" class="w-full md:w-24 p-2 border border-stone-200 rounded-lg text-sm text-center dark:bg-stone-700 dark:border-stone-600">
                                    <button type="submit" class="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white rounded-xl text-sm font-medium hover:shadow-md transition-all active:scale-[0.98] dark:from-emerald-500 dark:to-emerald-700">Ajouter le pack</button>
                                </form>
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${!st.isAdminAiLoading && st.adminTab === 'users' ? `
                    <div class="md:col-span-9 bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden animate-fade-in dark:bg-stone-800 dark:border-stone-700">
                        <div class="p-6 border-b border-stone-100 bg-stone-50 flex flex-col md:flex-row justify-between items-center gap-4 dark:bg-stone-800 dark:border-stone-700">
                            <h2 class="text-xl font-medium text-stone-800 dark:text-stone-100">Clients inscrits</h2>
                            <div class="relative w-full md:w-80">
                                <input 
                                    type="text" 
                                    id="admin-user-search"
                                    placeholder="Nom, email ou téléphone..." 
                                    value="${st.userSearchQuery || ''}"
                                    oninput="app.handleUserSearch(this.value)"
                                    class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:bg-stone-700 dark:border-stone-600 dark:text-stone-200"
                                >
                                <div class="absolute left-3 top-3 text-stone-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                </div>
                                ${st.userSearchQuery ? `
                                    <button 
                                        type="button"
                                        onclick="app.handleUserSearch(''); document.getElementById('admin-user-search')?.focus();" 
                                        class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1 focus:outline-none"
                                        title="Effacer le filtre"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                    </button>
                                ` : ''}
                            </div>
                            <span class="text-sm text-stone-500 font-medium dark:text-stone-400">${clients.length} client(s)</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="text-sm text-stone-500 border-b border-stone-100 dark:text-stone-400 dark:border-stone-700">
                                        <th class="p-4 font-medium">Nom</th>
                                        <th class="p-4 font-medium">Email</th>
                                        <th class="p-4 font-medium">Téléphone</th>
                                        <th class="p-4 font-medium">Solde</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${clients.map(u => `
                                        <tr onclick="app.viewUser(${u.id})" class="border-b border-stone-50 hover:bg-stone-50/50 transition cursor-pointer dark:border-stone-700/50 dark:hover:bg-stone-700/50">
                                            <td class="p-4 font-medium text-stone-800 dark:text-stone-200">${u.firstName} ${u.lastName}</td>
                                            <td class="p-4 text-stone-600 text-sm dark:text-stone-300">${u.email}</td>
                                            <td class="p-4 text-stone-600 text-sm dark:text-stone-300">${u.phone || '-'}</td>
                                            <td class="p-4"><span class="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold dark:bg-emerald-900/50 dark:text-emerald-300">${u.credits_balance || 0} crédits</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}

                ${!st.isAdminAiLoading && st.adminTab === 'user_details' && st.selectedUserDetails && st.selectedUserDetails.user ? (() => {
                    const { user, bookings, transactions } = st.selectedUserDetails;
                    const now = new Date();
                    const futureBookings = bookings.filter(b => new Date(b.date + 'T' + b.time) >= now);
                    const pastBookings = bookings.filter(b => new Date(b.date + 'T' + b.time) < now);
                    
                    const creditHistory = transactions.filter(t => t.type !== 'purchase');
                    const paymentHistory = transactions.filter(t => t.type === 'purchase');

                    return `<div class="md:col-span-9 space-y-6 animate-fade-in">
                        <button onclick="app.setAdminTab('users')" class="flex items-center gap-2 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 mb-4">
                            ← Retour à la liste
                        </button>
                        
                        <div class="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                            <div class="flex justify-between items-start mb-6">
                                <div>
                                    <h2 class="text-2xl font-medium text-stone-800 dark:text-stone-100">${user.firstName} ${user.lastName}</h2>
                                    <p class="text-stone-500 dark:text-stone-400">${user.email} • ${user.phone || 'Pas de téléphone'}</p>
                                    <p class="text-sm text-stone-400 mt-1">${user.address || ''} ${user.zipCode || ''} ${user.city || ''}</p>
                                </div>
                                <div class="text-right">
                                    <div class="text-3xl font-light text-emerald-700 dark:text-emerald-400">${user.credits_balance} <span class="text-sm">crédits</span></div>
                                </div>
                            </div>
                            <div class="pt-6 border-t border-stone-100 dark:border-stone-700">
                                <h3 class="text-sm font-medium mb-3 dark:text-stone-200">Ajuster les crédits</h3>
                                <form onsubmit="app.adjustCredits(event, ${user.id})" class="flex flex-col gap-3 max-w-xs">
                                    <input type="number" name="amount" placeholder="Quantité" required class="w-full p-2 border border-stone-200 rounded-lg dark:bg-stone-700 dark:border-stone-600 text-sm">
                                    <div class="flex gap-2">
                                        <button type="submit" data-mode="add" class="flex-1 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 text-sm transition-colors">Ajouter</button>
                                        <button type="submit" data-mode="remove" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors">Retirer</button>
                                    </div>
                                </form>
                            </div>
                            <div class="pt-6 mt-6 border-t border-stone-100 dark:border-stone-700">
                                <div class="flex items-center gap-2 mb-3">
                                    <span class="text-red-600 dark:text-red-400">⚠️</span>
                                    <h3 class="text-xs font-bold text-red-600 uppercase tracking-widest dark:text-red-400">Action irréversible</h3>
                                </div>
                                <button onclick="app.deleteAccount(${user.id}, true)" class="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm transition-colors dark:border-red-900 dark:hover:bg-red-900/20">
                                    Supprimer définitivement ce compte client
                                </button>
                            </div>
                        </div>

                        <div class="grid md:grid-cols-2 gap-6">
                            <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                                <h3 class="text-lg font-medium mb-4 dark:text-stone-200">Historique des réservations</h3>
                                <div class="space-y-2 max-h-60 overflow-y-auto">
                                    ${futureBookings.map(b => `
                                        <div class="flex items-center justify-between p-2 bg-emerald-50 rounded-lg text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                            <span>📅 ${new Date(b.date).toLocaleDateString()} à ${b.time} - ${b.title}</span>
                                            <button
                                                onclick="app.adminCancelBookingForUser(${b.class_id}, ${user.id})"
                                                class="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200 transition-colors p-1 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900"
                                                title="Annuler cette réservation"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    `).join('')}
                                    ${pastBookings.map(b => `<div class="p-2 bg-stone-50 rounded-lg text-sm text-stone-600 dark:bg-stone-700/50 dark:text-stone-400">✔️ ${new Date(b.date).toLocaleDateString()} - ${b.title}</div>`).join('')}
                                    ${bookings.length === 0 ? '<p class="text-stone-400 text-sm">Aucune réservation</p>' : ''}
                                </div>
                            </div>
                            
                            <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                                <h3 class="text-lg font-medium mb-4 dark:text-stone-200">Historique financier</h3>
                                <div class="space-y-4">
                                    <div>
                                        <h4 class="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Achats (Paiements)</h4>
                                        <div class="space-y-2 max-h-32 overflow-y-auto pr-2">
                                            ${paymentHistory.map(t => `
                                                <div class="flex justify-between items-center p-2 border-b border-stone-50 dark:border-stone-700 last:border-0">
                                                    <div class="text-xs">
                                                        <div class="font-medium dark:text-stone-300">${t.description}</div>
                                                        <div class="text-stone-400">${new Date(t.date).toLocaleDateString()}</div>
                                                    </div>
                                                    <div class="text-sm font-bold text-emerald-600">+${t.amount}</div>
                                                </div>
                                            `).join('')}
                                            ${paymentHistory.length === 0 ? '<p class="text-stone-400 text-xs">Aucun achat</p>' : ''}
                                        </div>
                                    </div>
                                    <div class="pt-4 border-t border-stone-100 dark:border-stone-700">
                                        <h4 class="text-sm font-semibold text-stone-600 dark:text-stone-300 mb-2">Mouvements de crédits</h4>
                                        <div class="space-y-2 max-h-32 overflow-y-auto pr-2">
                                            ${creditHistory.map(t => `
                                                ${(() => { // IIFE pour définir descriptionText et transactionDate
                                                    let descriptionText = t.description; // Par défaut, utilise la description brute
                                                    // Adapte la description pour les réservations et annulations afin de mettre en avant le cours
                                                    if (t.type === 'booking' && t.description.startsWith('Réservation : ')) { // Vérifie le type et le préfixe
                                                        descriptionText = `Réservation du cours : ${t.description.substring('Réservation : '.length)}`; // Extrait le titre du cours
                                                    } else if (t.type === 'refund' && t.description.startsWith('Annulation : ')) { // Vérifie le type et le préfixe
                                                        descriptionText = `Annulation du cours : ${t.description.substring('Annulation : '.length)}`; // Extrait le titre du cours
                                                    } else if (t.type === 'adjustment') { // Pour les ajustements manuels
                                                        descriptionText = `Ajustement : ${t.description}`; // Utilise la description telle quelle
                                                    }                                                    return `
                                                        <div class="flex justify-between items-center p-2 border-b border-stone-50 dark:border-stone-700 last:border-0">
                                                            <div class="text-xs">
                                                                <div class="font-medium dark:text-stone-300">${descriptionText}</div>
                                                                <div class="text-stone-400">${new Date(t.date).toLocaleString('fr-FR', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                                            </div>
                                                            <div class="text-sm font-bold ${t.amount > 0 ? 'text-emerald-600' : 'text-stone-600 dark:text-stone-400'}">${t.amount > 0 ? '+' : ''}${t.amount}</div>
                                                        </div>`;
                                                })()}
                                            `).join('')}
                                            ${creditHistory.length === 0 ? '<p class="text-stone-400 text-xs">Aucun mouvement</p>' : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="grid md:grid-cols-1 gap-6">
                            <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                                <h3 class="text-lg font-medium mb-4 dark:text-stone-200">Envoyer un message au client</h3>
                                <form onsubmit="app.sendUserMessage(event, ${user.id})" class="space-y-3">
                                    <input type="text" id="user-message-editor-subject" name="subject" placeholder="Sujet" required class="w-full p-2 border border-stone-200 rounded-lg dark:bg-stone-700 dark:border-stone-600">
                                    <div class="quill-editor-wrapper">
                                        <div id="user-message-editor" class="dark:bg-stone-800"></div>
                                    </div>
                                    <button type="submit" ${st.isSendingAdminMessage ? 'disabled' : ''} class="w-full py-2 ${st.isSendingAdminMessage ? 'bg-stone-400 cursor-not-allowed' : 'bg-stone-800 hover:bg-stone-900 dark:bg-stone-600 dark:hover:bg-stone-500'} text-white rounded-lg transition-colors">
                                        ${st.isSendingAdminMessage ? 'Envoi en cours...' : 'Envoyer le message'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>`;
                })() : ''}

                ${!st.isAdminAiLoading && st.adminTab === 'newsletter' ? `
                    <div class="md:col-span-9 grid md:grid-cols-12 gap-8 animate-fade-in">
                        <div class="md:col-span-7 bg-white p-8 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                        <h2 class="text-xl font-medium text-stone-800 mb-6 flex items-center gap-2 dark:text-stone-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600 dark:text-emerald-400"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            Envoyer une Newsletter
                        </h2>
                        <form onsubmit="app.sendNewsletter(event)" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Objet</label>
                                <input type="text" id="nl-subject" required class="w-full p-3 border border-stone-200 rounded-xl outline-none text-sm dark:bg-stone-700 dark:border-stone-600" placeholder="Ex: Nouveaux cours disponibles !">
                            </div>
                            <div>
                                <div class="flex justify-between items-center mb-1">
                                    <label class="block text-sm font-medium text-stone-700 dark:text-stone-200">Message</label>
                                    <button type="button" onclick="app.toggleHtmlView()" class="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1 dark:text-emerald-400 dark:hover:text-emerald-300">
                                        ${st.isHtmlView ? '👁️ Voir le rendu visuel' : '💻 Voir le code HTML'}
                                    </button>
                                </div>
                                ${st.isHtmlView ? `
                                    <textarea id="nl-html-area" class="w-full p-3 border border-stone-200 rounded-xl outline-none text-sm font-mono min-h-[280px] mb-4">${st.newsletterContent}</textarea>
                                ` : `
                                    <div class="quill-editor-wrapper mb-4">
                                        <div id="nl-editor" class="bg-white dark:bg-stone-800"></div>
                                    </div>
                                `}
                            </div>
                            <button type="submit" class="w-full py-4 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-emerald-900 transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
                                Envoyer aux ${st.selectedNewsletterRecipients.length} destinataires
                            </button>
                        </form>
                        </div>

                        <div class="md:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                            <div class="flex justify-between items-center mb-4">
                                <h2 class="text-lg font-medium text-stone-800 dark:text-stone-100">Destinataires</h2>
                                <div class="flex gap-2">
                                    <button onclick="app.state.selectedNewsletterRecipients = app.state.users.filter(u => u.role !== 'admin').map(u => u.id); app.render()" class="text-[10px] bg-stone-100 px-2 py-1 rounded hover:bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600">Tous</button>
                                    <button onclick="app.setAdminTab('newsletter')" class="text-[10px] bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-900">Abonnés</button>
                                </div>
                            </div>
                            <div class="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                ${clients.map(u => {
                                    const isSelected = st.selectedNewsletterRecipients.includes(u.id);
                                    const isSubscribed = Number(u.newsletter_subscribed) === 1;
                                    return `
                                        <div onclick="app.toggleNewsletterRecipient(${u.id})" class="flex flex-col p-3 rounded-xl border cursor-pointer transition ${isSelected ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/50 dark:border-emerald-800' : 'bg-stone-50 border-stone-100 opacity-60 dark:bg-stone-700/50 dark:border-stone-700'} min-w-0">
                                            <div class="text-sm flex items-center justify-between gap-2 mb-1">
                                                <div class="flex items-center gap-2 truncate-single-line">
                                                <span class="font-medium ${isSelected ? 'text-emerald-900 dark:text-emerald-200' : 'text-stone-700 dark:text-stone-300'}">${u.firstName} ${u.lastName}</span>
                                                ${isSubscribed ? `<span class="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase font-bold dark:bg-emerald-900 dark:text-emerald-300 flex-shrink-0">Abonné</span>` : ''}
                                            </div>
                                            <div class="w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-stone-300 dark:bg-stone-600 dark:border-stone-500'}">
                                                ${isSelected ? '✓' : ''}
                                            </div>
                                        </div>
                                            <span class="text-xs text-stone-500 dark:text-stone-400 truncate-single-line">${u.email}</span>
                                    </div>
                                    `;
                                }).join('')}
                            </div>
                            <div class="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-500 dark:border-stone-700 dark:text-stone-400">
                                ${st.selectedNewsletterRecipients.length} destinataire(s) sélectionné(s).
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${!st.isAdminAiLoading && st.adminTab === 'settings' ? `
                    <div class="md:col-span-9 max-w-md bg-white p-8 rounded-3xl shadow-sm border border-stone-100 animate-fade-in dark:bg-stone-800 dark:border-stone-700">
                        <h2 class="text-xl font-medium text-stone-800 mb-6 dark:text-stone-100">Paramètres du Studio</h2>
                        <form onsubmit="app.updateStudioSettings(event)" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Adresse</label>
                                <input type="text" id="admin-studio-address" required class="w-full p-2 border border-stone-200 rounded-lg dark:bg-stone-700 dark:border-stone-600" value="${st.studioAddress}">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Téléphone</label>
                                <input type="tel" id="admin-studio-phone" required class="w-full p-2 border border-stone-200 rounded-lg dark:bg-stone-700 dark:border-stone-600" value="${st.studioPhone}">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Email</label>
                                <input type="email" id="admin-studio-email" required class="w-full p-2 border border-stone-200 rounded-lg dark:bg-stone-700 dark:border-stone-600" value="${st.studioEmail}">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Moteur d'Intelligence Artificielle</label>
                                <select id="admin-ai-provider" class="w-full p-2 border border-stone-200 rounded-lg dark:bg-stone-700 dark:border-stone-600">
                                    <option value="gemini" ${st.aiProvider === 'gemini' ? 'selected' : ''}>Google Gemini 2.0 (Gratuit)</option>
                                    <option value="mistral" ${st.aiProvider === 'mistral' ? 'selected' : ''}>Mistral AI (Français)</option>
                                    <option value="groq" ${st.aiProvider === 'groq' ? 'selected' : ''}>Groq (Ultra-rapide)</option>
                                    <option value="openai" ${st.aiProvider === 'openai' ? 'selected' : ''}>OpenAI (GPT-4o mini)</option>
                                </select>
                            </div>
                            <div class="pt-4 border-t border-stone-100 dark:border-stone-700">
                                <label class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Lien Instagram</label>
                                <input type="url" id="admin-studio-instagram" class="w-full p-2 mb-3 border border-stone-200 rounded-lg dark:bg-stone-700 dark:border-stone-600" value="${st.studioInstagram}" placeholder="https://instagram.com/...">
                                
                                <label class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Lien Facebook</label>
                                <input type="url" id="admin-studio-facebook" class="w-full p-2 mb-3 border border-stone-200 rounded-lg dark:bg-stone-700 dark:border-stone-600" value="${st.studioFacebook}" placeholder="https://facebook.com/...">
                                
                                <label class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Lien TikTok</label>
                                <input type="url" id="admin-studio-tiktok" class="w-full p-2 border border-stone-200 rounded-lg dark:bg-stone-700 dark:border-stone-600" value="${st.studioTiktok}" placeholder="https://tiktok.com/...">
                            </div>
                            <button type="submit" class="w-full py-3.5 mt-2 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-[0.98] dark:from-emerald-600 dark:to-emerald-800 flex justify-center items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                Enregistrer les paramètres
                            </button>
                        </form>
                    </div>
                ` : ''}
                </div>
            </div>
        </div>`;
};
