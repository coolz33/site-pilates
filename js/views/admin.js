import { icons } from '../icons.js';
import { getNotificationHtml } from './components.js';

/**
 * Vue d'administration du système (Tableau de bord).
 * @param {PilatesApp} app - L'instance principale de l'application.
 * @returns {string} Le code HTML structuré avec Bootstrap 5 pour l'administration.
 */
export const adminView = (app) => {
    const st = app.state;
    if (!st.currentUser || st.currentUser.role !== 'admin') {
        return '<div class="p-5 text-center">Accès refusé</div>';
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingClasses = st.classes.filter(c => c.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const pastClasses = st.classes.filter(c => c.date < todayStr).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

    const query = (st.userSearchQuery || '').toLowerCase();
    const clients = st.users.filter(u => {
        if (!query) return true;
        return (u.firstName?.toLowerCase().includes(query) || 
                u.lastName?.toLowerCase().includes(query) || 
                u.email?.toLowerCase().includes(query) || 
                u.phone?.includes(query));
    });

    const f = st.adminClassFilters;
    let filteredClasses = st.adminTab === 'past_sessions' ? pastClasses : upcomingClasses;
    
    // Application des filtres multicritères
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
       <div class="pt-4 pb-5 animate-fade-in flex-grow-1">
            <div class="container-fluid px-3 px-md-4" style="max-width: 1600px;">
                <div class="row g-4">
                    <!-- Menu Latéral -->
                    <aside class="col-12 col-lg-3 col-xl-2">
                        <div class="custom-card p-3 position-sticky" style="top: 6rem;">
                            <h1 class="fs-5 fw-light mb-4 px-2">Administration</h1>
                            <nav class="d-flex flex-column gap-1">
                                <button onclick="app.setAdminTab('planning')" class="admin-nav-btn ${st.adminTab === 'planning' ? 'active' : ''}">📅 Séances à venir</button>
                                <button onclick="app.setAdminTab('past_sessions')" class="admin-nav-btn ${st.adminTab === 'past_sessions' ? 'active' : ''}">🕰️ Séances passées</button>
                                <button onclick="app.setAdminTab('templates')" class="admin-nav-btn ${st.adminTab === 'templates' ? 'active' : ''}">📋 Modèles de cours</button>
                                <button onclick="app.setAdminTab('packages')" class="admin-nav-btn ${st.adminTab === 'packages' ? 'active' : ''}">💳 Tarifs & Packs</button>
                                <button onclick="app.setAdminTab('users')" class="admin-nav-btn ${st.adminTab === 'users' ? 'active' : ''}">👥 Clients</button>
                                <button onclick="app.setAdminTab('ledger')" class="admin-nav-btn ${st.adminTab === 'ledger' ? 'active' : ''}">📖 Livre de recettes</button>
                                <button onclick="app.setAdminTab('newsletter')" class="admin-nav-btn ${st.adminTab === 'newsletter' ? 'active' : ''}">✉️ Newsletter</button>
                                <button onclick="app.setAdminTab('settings')" class="admin-nav-btn ${st.adminTab === 'settings' ? 'active' : ''}">⚙️ Studio</button>
                            </nav>
                        </div>
                    </aside>

                    <div class="col-12 col-lg-9 col-xl-10">
                        ${st.isAdminAiLoading ? '<div class="p-5 text-center text-muted">Chargement des données...</div>' : ''}

                        ${!st.isAdminAiLoading && (st.adminTab === 'planning' || st.adminTab === 'past_sessions') ? `
                            <div class="row g-4">
                                <!-- Liste des Séances -->
                                <div class="col-lg-8">
                                    <div class="custom-card p-0">
                                        ${st.selectedAdminClasses.length > 0 ? `
                                            <div class="p-3 bg-danger bg-opacity-10 border-bottom border-danger border-opacity-25 d-flex justify-content-between align-items-center" style="border-top-left-radius: 1.5rem; border-top-right-radius: 1.5rem;">
                                                <span class="small fw-medium text-danger">${st.selectedAdminClasses.length} séance(s) sélectionnée(s)</span>
                                                <button onclick="app.adminBulkDeleteClasses()" class="btn btn-sm btn-danger d-flex align-items-center gap-2 fw-medium">
                                                    ${icons.trash} Supprimer la sélection
                                                </button>
                                            </div>
                                        ` : `
                                            <div class="p-3 border-bottom d-flex justify-content-between align-items-center bg-light" style="border-top-left-radius: 1.5rem; border-top-right-radius: 1.5rem;">
                                                <h2 class="fs-6 fw-medium mb-0">${st.adminTab === 'planning' ? 'Séances à venir' : 'Historique des séances'}</h2>
                                                <span class="small text-muted">${filteredClasses.length} résultat(s)</span>
                                            </div>
                                        `}
                                        <div class="table-responsive overflow-visible">
                                            <table class="table table-hover align-middle mb-0">
                                                <thead>
                                                    <tr class="small text-muted">
                                                        <th class="p-3" style="width: 40px;">
                                                            <input type="checkbox" onchange="app.toggleAllAdminClasses(this.checked, ${JSON.stringify(filteredClasses.map(c => c.id)).replace(/"/g, '&quot;')})" ${st.selectedAdminClasses.length === filteredClasses.length && filteredClasses.length > 0 ? 'checked' : ''} class="form-check-input cursor-pointer">
                                                        </th>
                                                        <th class="p-3 fw-medium">Date & Heure</th>
                                                        <th class="p-3 fw-medium w-50">Cours</th>
                                                        <th class="p-3 fw-medium text-center">Inscrits</th>
                                                        <th class="p-3 fw-medium text-end">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${filteredClasses.length === 0 ? `<tr><td colspan="5" class="p-4 text-center text-muted">Aucune séance trouvée</td></tr>` : 
                                                    filteredClasses.map(c => `
                                                        <tr class="${st.selectedAdminClasses.includes(c.id) ? 'table-active' : ''}">
                                                            <td class="p-3">
                                                                <input type="checkbox" onchange="app.toggleAdminClassSelection(${c.id})" ${st.selectedAdminClasses.includes(c.id) ? 'checked' : ''} class="form-check-input cursor-pointer">
                                                            </td>
                                                            <td class="p-3 text-nowrap">
                                                                <div class="fw-medium">${new Date(c.date).toLocaleDateString('fr-FR')}</div>
                                                                <div class="small text-muted">${c.time} (${c.duration} min)</div>
                                                            </td>
                                                            <td class="p-3">
                                                                <div class="fw-medium text-emerald">${c.title}</div>
                                                            </td>
                                                            <td class="p-3 text-center text-nowrap position-relative has-tooltip">
                                                                <span class="badge rounded-pill ${c.bookedUsers.length >= c.capacity ? 'bg-danger' : 'bg-success'}">
                                                                    ${c.bookedUsers.length} / ${c.capacity}
                                                                </span>
                                                                ${c.bookedUsers.length > 0 ? `
                                                                    <div class="planning-tooltip schedule-tooltip admin-booked-users-tooltip shadow-lg">
                                                                        <h4 class="fw-bold mb-1 small">Inscrits:</h4>
                                                                        <ul class="list-unstyled text-start small mb-0 d-flex flex-column gap-1">
                                                                            ${c.bookedUsers.map(userId => {
                                                                                const user = st.users.find(u => u.id === userId);
                                                                                return user ? `<li>• ${user.firstName} ${user.lastName}</li>` : '';
                                                                            }).join('')}
                                                                        </ul>
                                                                        <div class="tooltip-arrow"></div>
                                                                    </div>
                                                                ` : ''}
                                                            </td>
                                                            <td class="p-3 text-end text-nowrap">
                                                                <button onclick="app.adminDeleteClass(${c.id})" class="btn btn-link text-danger p-1" title="Supprimer">
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
                                
                                <!-- Filtres & Ajout -->
                                <div class="col-lg-4 d-flex flex-column gap-4">
                                    <div class="custom-card p-4">
                                        <h3 class="fs-6 fw-bold text-muted text-uppercase mb-3 d-flex align-items-center gap-2">
                                            ${icons.sparkles} Filtres de recherche
                                        </h3>
                                        <div class="d-flex flex-column gap-3">
                                            <div>
                                                <label class="form-label text-muted fw-bold text-uppercase mb-1" style="font-size: 0.65rem;">Période (Du / Au)</label>
                                                <div class="d-flex gap-2">
                                                    <input type="date" value="${f.startDate}" oninput="app.handleAdminClassFilterChange('startDate', this.value)" class="form-control form-control-sm">
                                                    <input type="date" value="${f.endDate}" oninput="app.handleAdminClassFilterChange('endDate', this.value)" class="form-control form-control-sm">
                                                </div>
                                            </div>
                                            <div>
                                                <label class="form-label text-muted fw-bold text-uppercase mb-1" style="font-size: 0.65rem;">Heures (De / À)</label>
                                                <div class="d-flex gap-2">
                                                    <input type="time" value="${f.startTime}" oninput="app.handleAdminClassFilterChange('startTime', this.value)" class="form-control form-control-sm">
                                                    <input type="time" value="${f.endTime}" oninput="app.handleAdminClassFilterChange('endTime', this.value)" class="form-control form-control-sm">
                                                </div>
                                            </div>
                                            <div>
                                                <label class="form-label text-muted fw-bold text-uppercase mb-1" style="font-size: 0.65rem;">Nb Inscrits (Min / Max)</label>
                                                <div class="d-flex gap-2">
                                                    <input type="number" placeholder="Min" value="${f.minBooked}" oninput="app.handleAdminClassFilterChange('minBooked', this.value)" class="form-control form-control-sm">
                                                    <input type="number" placeholder="Max" value="${f.maxBooked}" oninput="app.handleAdminClassFilterChange('maxBooked', this.value)" class="form-control form-control-sm">
                                                </div>
                                            </div>
                                            <div class="position-relative">
                                                <label class="form-label text-muted fw-bold text-uppercase mb-1" style="font-size: 0.65rem;">Nom inscrit</label>
                                                <input list="filter-users-list" id="filter-user-name" placeholder="Rechercher un client..." value="${f.userName}" oninput="app.handleAdminClassFilterChange('userName', this.value)" class="form-control form-control-sm pr-4">
                                                <datalist id="filter-users-list">
                                                    ${st.users.filter(u => u.role !== 'admin').map(u => `<option value="${u.firstName} ${u.lastName}">`).join('')}
                                                </datalist>
                                                ${f.userName ? `
                                                    <button type="button" onclick="app.handleAdminClassFilterChange('userName', ''); document.getElementById('filter-user-name')?.focus();" class="btn btn-link text-muted position-absolute end-0 bottom-0 p-1 text-decoration-none">×</button>
                                                ` : ''}
                                            </div>
                                            <div>
                                                <label class="form-label text-muted fw-bold text-uppercase mb-1" style="font-size: 0.65rem;">Type de cours</label>
                                                <input list="filter-titles-list" placeholder="Sélectionner un cours..." value="${f.titles[0] || ''}" oninput="app.handleAdminClassFilterChange('titles', this.value ? [this.value] : [])" class="form-control form-control-sm">
                                                <datalist id="filter-titles-list">
                                                    ${allTitles.map(t => `<option value="${t}">`).join('')}
                                                </datalist>
                                            </div>
                                        </div>
                                        ${Object.values(f).some(v => v !== '' && (!Array.isArray(v) || v.length > 0)) ? `
                                            <button onclick="app.state.adminClassFilters = {startDate:'',endDate:'',startTime:'',endTime:'',titles:[],minBooked:'',maxBooked:'',userName:''}; app.render();" class="btn btn-link text-danger p-0 mt-3 small text-decoration-none text-uppercase fw-bold" style="font-size: 0.65rem;">
                                                Réinitialiser tous les filtres
                                            </button>
                                        ` : ''}
                                    </div>

                                    ${st.adminTab === 'planning' ? `
                                    <div class="custom-card p-4">
                                        <h2 class="fs-5 fw-medium mb-4">Ajouter un cours</h2>
                                        <form onsubmit="app.submitAddClass(event)" id="add-class-form" class="d-flex flex-column gap-3">
                                            <div>
                                                <label class="form-label small fw-medium mb-1">Modèle de cours</label>
                                                <select id="planning-template-select" onchange="app.handleAdminAddClassFormChange('templateId', this.value); app.applyTemplate();" class="form-select form-select-sm">
                                                    <option value="">-- Sélectionner --</option>
                                                    ${st.courseTemplates.map(t => `<option value="${t.id}" ${st.adminAddClassForm.templateId == t.id ? 'selected' : ''}>${t.title}</option>`).join('')}
                                                </select>
                                            </div>
                                            <div>
                                                <label class="form-label small fw-medium mb-1">Date</label>
                                                <input type="date" id="planning-date" value="${st.adminAddClassForm.date}" oninput="app.handleAdminAddClassFormChange('date', this.value)" required class="form-control form-control-sm">
                                            </div>
                                            <div>
                                                <label class="form-label small fw-medium mb-1">Heure</label>
                                                <input type="time" id="planning-time" value="${st.adminAddClassForm.time}" oninput="app.handleAdminAddClassFormChange('time', this.value)" required class="form-control form-control-sm">
                                            </div>
                                            <div>
                                                <label class="form-label small fw-medium mb-1">Capacité</label>
                                                <input type="number" id="planning-capacity" value="${st.adminAddClassForm.capacity}" oninput="app.handleAdminAddClassFormChange('capacity', this.value)" min="1" class="form-control form-control-sm">
                                            </div>
                                            
                                            <div class="form-check mt-2">
                                                <input type="checkbox" id="planning-is-recurring" onchange="app.toggleAdminRecurring()" ${st.isAdminRecurring ? 'checked' : ''} class="form-check-input">
                                                <label class="form-check-label small fw-medium cursor-pointer" for="planning-is-recurring">Rendre ce cours récurrent</label>
                                            </div>
                                            
                                            <div id="recurring-fields" class="${st.isAdminRecurring ? 'd-flex' : 'd-none'} flex-column gap-3 p-3 bg-light rounded-3 border animate-fade-in">
                                                <div>
                                                    <label class="form-label small text-muted mb-1">Fréquence</label>
                                                    <select id="planning-recurrence-type" onchange="app.handleAdminAddClassFormChange('recurrenceType', this.value)" class="form-select form-select-sm">
                                                        <option value="daily" ${st.adminAddClassForm.recurrenceType === 'daily' ? 'selected' : ''}>Quotidienne</option>
                                                        <option value="weekly" ${st.adminAddClassForm.recurrenceType === 'weekly' ? 'selected' : ''}>Hebdomadaire</option>
                                                        <option value="monthly" ${st.adminAddClassForm.recurrenceType === 'monthly' ? 'selected' : ''}>Mensuelle</option>
                                                        <option value="yearly" ${st.adminAddClassForm.recurrenceType === 'yearly' ? 'selected' : ''}>Annuelle</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label class="form-label small text-muted mb-1">Jusqu'au (inclus)</label>
                                                    <input type="date" id="planning-recurrence-end" value="${st.adminAddClassForm.recurrenceEnd}" oninput="app.handleAdminAddClassFormChange('recurrenceEnd', this.value)" class="form-control form-control-sm">
                                                </div>
                                            </div>
                                            <button type="submit" class="btn btn-emerald py-2 mt-2 fw-medium">Ajouter au planning</button>
                                            
                                            <!-- Champs cachés pour le template -->
                                            <input type="hidden" id="planning-title" value="${st.adminAddClassForm.title}">
                                            <textarea id="planning-desc" class="d-none">${st.adminAddClassForm.description}</textarea>
                                            <input type="hidden" id="planning-duration" value="${st.adminAddClassForm.duration}">
                                        </form>
                                    </div>

                                    <div class="custom-card p-4">
                                        <h2 class="fs-6 fw-medium mb-3">Paramètres</h2>
                                        <form onsubmit="app.updateCancellationDelay(event)">
                                            <label class="form-label small fw-medium mb-1">Délai d'annulation (heures)</label>
                                            <div class="d-flex gap-2">
                                                <input type="number" id="admin-cancellation-delay" required min="0" class="form-control form-control-sm" value="${st.cancellationDelay}">
                                                <button type="submit" class="btn btn-dark btn-sm fw-medium">OK</button>
                                            </div>
                                        </form>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                        ` : ''}

                        ${!st.isAdminAiLoading && st.adminTab === 'templates' ? `
                            <div class="row g-4 animate-fade-in">
                                <div class="col-lg-8">
                                    <div class="custom-card p-4">
                                        <h2 class="fs-5 fw-medium mb-4">Catalogue des cours</h2>
                                        <div class="row g-3">
                                            ${st.courseTemplates.map(t => `
                                                <div class="col-md-6">
                                                    <div class="position-relative p-3 border rounded-3 bg-light hover-bg-light transition-colors">
                                                        <div onclick="app.editTemplate(${t.id})" class="cursor-pointer pe-4">
                                                            <div class="fw-medium text-emerald text-truncate">${t.title}</div>
                                                            <div class="small text-muted">${t.duration} min</div>
                                                        </div>
                                                        <button onclick="app.deleteTemplate(${t.id})" class="btn btn-link text-danger position-absolute top-0 end-0 p-2">
                                                            ${icons.trash}
                                                        </button>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-lg-4">
                                    <div class="custom-card p-4">
                                        <h2 class="fs-5 fw-medium mb-4">${st.editingTemplateId ? 'Modifier le modèle' : 'Nouveau modèle'}</h2>
                                        <form onsubmit="event.preventDefault(); app.saveAsTemplate()" class="d-flex flex-column gap-3">
                                            ${(() => {
                                                const t = st.editingTemplateId ? st.courseTemplates.find(x => x.id === st.editingTemplateId) : null;
                                                return `
                                                    <div>
                                                        <label class="form-label small fw-medium mb-1">Titre du cours</label>
                                                        <input type="text" id="template-title" required class="form-control form-control-sm" value="${t?.title || ''}">
                                                    </div>
                                                    <div>
                                                        <div class="d-flex justify-content-between align-items-center mb-1">
                                                            <label class="form-label small fw-medium mb-0">Description</label>
                                                            <button type="button" onclick="app.generateAdminDescription()" class="btn btn-link text-emerald p-0 text-decoration-none small fw-medium" style="font-size: 0.75rem;">✨ IA</button>
                                                        </div>
                                                        <textarea id="template-desc" rows="3" class="form-control form-control-sm">${t ? t.description : ''}</textarea>
                                                    </div>
                                                    <div>
                                                        <label class="form-label small fw-medium mb-1">Durée (min)</label>
                                                        <input type="number" id="template-duration" required class="form-control form-control-sm" value="${t?.duration || ''}">
                                                    </div>
                                                `;
                                            })()}
                                            <button type="submit" class="btn btn-dark py-2 mt-2 fw-medium">
                                                ${st.editingTemplateId ? 'Mettre à jour' : 'Enregistrer le modèle'}
                                            </button>
                                            ${st.editingTemplateId ? `<button type="button" onclick="app.cancelEditTemplate()" class="btn btn-link text-muted p-0 small text-decoration-none">Annuler</button>` : ''}
                                        </form>
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        ${!st.isAdminAiLoading && st.adminTab === 'packages' ? `
                            <div class="custom-card p-4 p-md-5 animate-fade-in">
                                <h2 class="fs-5 fw-medium mb-4">Gestion des Tarifs (Packs de cours)</h2>
                                <form onsubmit="app.updateAllPackages(event)">
                                    <div class="d-flex flex-column gap-4 mb-4">
                                    ${st.creditPackages.map(pkg => `
                                        <div class="d-flex flex-column gap-2 p-3 border rounded-3 bg-light package-block">
                                            <input type="hidden" name="id" value="${pkg.id}">
                                            <div class="row g-2">
                                                <div class="col-md-4">
                                                    <label class="form-label small text-muted mb-1">Titre (En-tête)</label>
                                                    <input type="text" name="name" value="${pkg.name}" required class="form-control form-control-sm">
                                                </div>
                                                <div class="col-md-4">
                                                    <label class="form-label small text-muted mb-1">Sous-titre</label>
                                                    <input type="text" name="subtitle" value="${pkg.subtitle || ''}" class="form-control form-control-sm">
                                                </div>
                                                <div class="col-md-2">
                                                    <label class="form-label small text-muted mb-1">Prix (€)</label>
                                                    <input type="number" name="price" value="${pkg.price}" required min="0" class="form-control form-control-sm text-center px-1">
                                                </div>
                                                 <div class="col-md-2 pack-credits-col ${pkg.is_subscription ? 'd-none' : ''}">
                                                    <label class="form-label small text-muted mb-1 text-nowrap">Nb. cours</label>
                                                    <input type="number" name="credits" value="${pkg.is_subscription ? 0 : pkg.credits}" min="0" class="form-control form-control-sm text-center px-1">
                                                </div>

                                                <div class="col-12 d-flex flex-wrap align-items-center gap-4 mt-2">
                                                    <div class="form-check mb-0">
                                                        <input type="checkbox" id="is-sub-${pkg.id}" name="is_subscription" value="1" class="form-check-input cursor-pointer" onchange="this.closest('.package-block').querySelector('.pack-credits-col').classList.toggle('d-none', this.checked); this.closest('.package-block').querySelectorAll('.pack-normal-exp-col').forEach(e => e.classList.toggle('d-none', this.checked)); this.closest('.package-block').querySelector('.pack-sub-duration-col').classList.toggle('d-none', !this.checked);" ${pkg.is_subscription ? 'checked' : ''}>
                                                        <label class="form-check-label small text-muted cursor-pointer" for="is-sub-${pkg.id}">Format Abonnement</label>
                                                    </div>
                                                    <div class="form-check mb-0 pack-normal-exp-col ${pkg.is_subscription ? 'd-none' : ''}">
                                                        <input type="checkbox" id="exp-cb-${pkg.id}" class="form-check-input cursor-pointer" onchange="document.getElementById('exp-div-${pkg.id}').classList.toggle('d-none', !this.checked); if(!this.checked) document.getElementById('exp-input-${pkg.id}').value = '0';" ${!pkg.is_subscription && pkg.expires_in_days > 0 ? 'checked' : ''}>
                                                        <label class="form-check-label small text-muted cursor-pointer" for="exp-cb-${pkg.id}">A une date d'expiration ?</label>
                                                    </div>
                                                </div>

                                                <div class="col-12 d-flex flex-wrap gap-4 mt-1">
                                                    <div class="pack-sub-duration-col ${pkg.is_subscription ? '' : 'd-none'} d-flex align-items-center gap-2">
                                                        <label class="small text-muted mb-0">Durée :</label>
                                                        <input type="number" name="duration_days" value="${pkg.is_subscription ? (pkg.expires_in_days || 365) : 365}" min="1" class="form-control form-control-sm text-center px-1" style="width: 70px;">
                                                        <label class="small text-muted mb-0">jours</label>
                                                    </div>
                                                    <div class="pack-normal-exp-col ${pkg.is_subscription ? 'd-none' : ''} ${!pkg.is_subscription && pkg.expires_in_days > 0 ? '' : 'd-none'}" id="exp-div-${pkg.id}">
                                                        <div class="d-flex align-items-center gap-2">
                                                            <label class="small text-muted mb-0">Expire dans :</label>
                                                            <input type="number" id="exp-input-${pkg.id}" name="expires_in_days" value="${!pkg.is_subscription ? (pkg.expires_in_days || 0) : 0}" min="0" class="form-control form-control-sm text-center px-1" style="width: 70px;">
                                                            <label class="small text-muted mb-0">jours</label>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-12 mt-2">
                                                    <label class="form-label small text-muted mb-1">Description (Sauts de ligne autorisés)</label>
                                                    <textarea name="description" class="form-control form-control-sm" rows="3">${pkg.description || ''}</textarea>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                    </div>
                                    <button type="submit" class="btn btn-dark px-4 py-2 fw-medium">Enregistrer toutes les modifications</button>
                                </form>
                                    
                                <div class="pt-4 border-top mt-5">
                                        <h3 class="fs-6 fw-medium mb-3">Ajouter un nouveau pack</h3>
                                    <form onsubmit="app.createPackage(event)" class="d-flex flex-column gap-2 p-3 border rounded-3 bg-light package-block">
                                        <div class="row g-2">
                                            <div class="col-md-4"><input type="text" name="name" placeholder="En-tête" required class="form-control form-control-sm"></div>
                                            <div class="col-md-4"><input type="text" name="subtitle" placeholder="Sous-titre" class="form-control form-control-sm"></div>
                                            <div class="col-md-2"><input type="number" name="price" placeholder="Prix €" required min="0" class="form-control form-control-sm text-center px-1"></div>
                                            <div class="col-md-2 pack-credits-col"><input type="number" name="credits" placeholder="Nb. cours" min="1" class="form-control form-control-sm text-center px-1"></div>

                                            <div class="col-12 d-flex flex-wrap align-items-center gap-4 mt-2">
                                                <div class="form-check mb-0">
                                                    <input type="checkbox" id="is-sub-new" name="is_subscription" value="1" class="form-check-input cursor-pointer" onchange="this.closest('.package-block').querySelector('.pack-credits-col').classList.toggle('d-none', this.checked); this.closest('.package-block').querySelectorAll('.pack-normal-exp-col').forEach(e => e.classList.toggle('d-none', this.checked)); this.closest('.package-block').querySelector('.pack-sub-duration-col').classList.toggle('d-none', !this.checked);">
                                                    <label class="form-check-label small text-muted cursor-pointer" for="is-sub-new">Format Abonnement</label>
                                                </div>
                                                <div class="form-check mb-0 pack-normal-exp-col">
                                                    <input type="checkbox" id="exp-cb-new" class="form-check-input cursor-pointer" onchange="document.getElementById('exp-div-new').classList.toggle('d-none', !this.checked); if(!this.checked) document.getElementById('exp-input-new').value = '0';">
                                                    <label class="form-check-label small text-muted cursor-pointer" for="exp-cb-new">A une date d'expiration ?</label>
                                                </div>
                                            </div>

                                            <div class="col-12 d-flex flex-wrap gap-4 mt-1">
                                                <div class="pack-sub-duration-col d-none d-flex align-items-center gap-2">
                                                    <label class="small text-muted mb-0">Durée :</label>
                                                    <input type="number" name="duration_days" value="365" min="1" class="form-control form-control-sm text-center px-1" style="width: 70px;">
                                                    <label class="small text-muted mb-0">jours</label>
                                                </div>
                                                
                                                <div class="pack-normal-exp-col d-none" id="exp-div-new">
                                                    <div class="d-flex align-items-center gap-2">
                                                        <label class="small text-muted mb-0">Expire dans :</label>
                                                        <input type="number" id="exp-input-new" name="expires_in_days" value="0" min="0" class="form-control form-control-sm text-center px-1" style="width: 70px;">
                                                        <label class="small text-muted mb-0">jours</label>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="col-12"><textarea name="description" placeholder="Description..." class="form-control form-control-sm" rows="2"></textarea></div>
                                        </div>
                                        <div class="text-end mt-2"><button type="submit" class="btn btn-emerald btn-sm px-4 fw-medium">Ajouter le pack</button></div>
                                        </form>
                                    </div>
                            </div>
                        ` : ''}

                        ${!st.isAdminAiLoading && st.adminTab === 'users' ? `
                            <div class="custom-card p-0 overflow-hidden animate-fade-in">
                                <div class="p-4 border-bottom bg-light d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                                    <h2 class="fs-5 fw-medium mb-0">Clients inscrits</h2>
                                    <div class="position-relative" style="width: 100%; max-width: 300px;">
                                        <input type="text" id="admin-user-search" placeholder="Nom, email ou téléphone..." value="${st.userSearchQuery || ''}" oninput="app.handleUserSearch(this.value)" class="form-control pe-4 pl-4 rounded-pill">
                                        ${st.userSearchQuery ? `
                                            <button type="button" onclick="app.handleUserSearch(''); document.getElementById('admin-user-search')?.focus();" class="btn btn-link text-muted position-absolute end-0 top-50 translate-middle-y p-1 text-decoration-none">×</button>
                                        ` : ''}
                                    </div>
                                    <span class="small fw-medium text-muted">${clients.length} client(s)</span>
                                </div>
                                <div class="table-responsive">
                                    <table class="table table-hover align-middle mb-0">
                                        <thead>
                                            <tr class="small text-muted">
                                                <th class="p-3 fw-bold">Nom</th>
                                                <th class="p-3 fw-bold">Email</th>
                                                <th class="p-3 fw-bold">Téléphone</th>
                                                <th class="p-3 fw-bold">Solde</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${clients.map(u => `
                                                <tr onclick="app.viewUser(${u.id})" class="cursor-pointer transition-colors">
                                                    <td class="p-3 fw-medium">
                                                        ${u.firstName} ${u.lastName}
                                                        ${u.role === 'admin' ? '<span class="badge bg-dark ms-2" style="font-size: 0.6rem;">Admin</span>' : ''}
                                                    </td>
                                                    <td class="p-3 small text-muted">${u.email}</td>
                                                    <td class="p-3 small text-muted">${u.phone || '-'}</td>
                                                    <td class="p-3"><span class="badge badge-emerald">${u.is_subscribed ? 'Abo.' : (parseInt(u.credits_balance) || 0) + ' cours'}</span></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ` : ''}

                        ${!st.isAdminAiLoading && st.adminTab === 'ledger' ? (() => {
                            const ledgerPurchases = (st.adminLedger || []).filter(t => t.type === 'purchase');
                            return `
                            <div class="custom-card p-0 overflow-hidden animate-fade-in">
                                <div class="p-4 border-bottom bg-light d-flex justify-content-between align-items-center">
                                    <h2 class="fs-5 fw-medium mb-0">Livre de recettes (Encaissements)</h2>
                                    <div class="d-flex align-items-center gap-3">
                                        <span class="small fw-medium text-muted">${ledgerPurchases.length} encaissement(s)</span>
                                        <div class="d-flex gap-2">
                                            <button onclick="app.exportLedgerToCSV()" class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2" title="Format comptable standard">
                                                CSV
                                            </button>
                                            <button onclick="app.exportLedgerToXLSX()" class="btn btn-sm btn-outline-success d-flex align-items-center gap-2" title="Ouvrir directement avec Excel">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                                Excel (.xlsx)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="table-responsive" style="max-height: 700px; overflow-y: auto;">
                                    <table class="table table-hover align-middle mb-0">
                                        <thead>
                                            <tr class="small text-muted">
                                                <th class="p-3 fw-bold position-sticky top-0 border-bottom" style="z-index: 10;">Date</th>
                                                <th class="p-3 fw-bold position-sticky top-0 border-bottom" style="z-index: 10;">Client</th>
                                                <th class="p-3 fw-bold position-sticky top-0 border-bottom" style="z-index: 10;">Description</th>
                                                <th class="p-3 fw-bold position-sticky top-0 border-bottom" style="z-index: 10;">Achat</th>
                                                <th class="p-3 fw-bold position-sticky top-0 border-bottom" style="z-index: 10;">Montant HT</th>
                                                <th class="p-3 fw-bold position-sticky top-0 border-bottom" style="z-index: 10;">TVA (20%)</th>
                                                <th class="p-3 fw-bold position-sticky top-0 border-bottom" style="z-index: 10;">Montant TTC</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${ledgerPurchases.map(t => {
                                                let productText = '';
                                                const isSub = t.amount >= 999 || (t.amount === 0 && t.description.toLowerCase().includes('abonnement'));
                                                
                                                const priceMatch = t.description.match(/\((\d+)€\)/);
                                                const price = priceMatch ? parseInt(priceMatch[1]) : null;
                                                
                                                const descriptionWithoutPrice = t.description.replace(/\s*\(\d+€\)/, '');

                                                let pkg = null;
                                                if (isSub) {
                                                    pkg = st.creditPackages.find(p => p.is_subscription && (price === null || p.price === price)) || st.creditPackages.find(p => p.is_subscription);
                                                    productText = pkg ? (pkg.subtitle || pkg.name) : 'Abonnement';
                                                } else {
                                                    pkg = st.creditPackages.find(p => p.credits === t.amount && (price === null || p.price === price)) || st.creditPackages.find(p => p.credits === t.amount && !p.is_subscription);
                                                    productText = pkg ? (pkg.subtitle || pkg.name) : `${t.amount} cours`;
                                                }

                                                // Calculs comptables
                                                const priceTTC = price !== null ? price : 0;
                                                const priceHT = priceTTC > 0 ? (priceTTC / 1.2).toFixed(2) : '-';
                                                const tvaAmount = priceTTC > 0 ? (priceTTC - (priceTTC / 1.2)).toFixed(2) : '-';

                                                return `
                                                <tr>
                                                    <td class="p-3 small text-muted text-nowrap">${t.date}</td>
                                                    <td class="p-3 fw-medium"><button class="btn btn-link p-0 text-decoration-none text-emerald text-start" onclick="app.viewUser(${t.user_id})">${t.firstName || 'Client'} ${t.lastName || 'Supprimé'}</button></td>
                                                    <td class="p-3 small">${descriptionWithoutPrice}</td>
                                                    <td class="p-3 fw-bold text-success">${productText}</td>
                                                    <td class="p-3 fw-bold text-muted">${priceHT !== '-' ? priceHT + ' €' : '-'}</td>
                                                    <td class="p-3 fw-bold text-muted">${tvaAmount !== '-' ? tvaAmount + ' €' : '-'}</td>
                                                    <td class="p-3 fw-bold">${price !== null ? price.toFixed(2) + ' €' : '-'}</td>
                                                </tr>`;
                                            }).join('')}
                                            ${!ledgerPurchases.length ? '<tr><td colspan="7" class="p-4 text-center text-muted">Aucun encaissement trouvé</td></tr>' : ''}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        `;})() : ''}

                        ${!st.isAdminAiLoading && st.adminTab === 'user_details' && st.selectedUserDetails && st.selectedUserDetails.user ? (() => {
                            const { user, bookings, transactions, activeBatches } = st.selectedUserDetails;
                            const now = new Date();
                            const futureBookings = bookings.filter(b => new Date(b.date + 'T' + b.time) >= now);
                            const pastBookings = bookings.filter(b => new Date(b.date + 'T' + b.time) < now);
                            const creditHistory = transactions.filter(t => t.type !== 'purchase');
                            const paymentHistory = transactions.filter(t => t.type === 'purchase');

                            let subExpirationAdmin = '';
                            if (user.is_subscribed && user.subscription_expires_at) {
                                subExpirationAdmin = new Date(user.subscription_expires_at).toLocaleDateString('fr-FR');
                            }

                            return `<div class="d-flex flex-column gap-4 animate-fade-in">
                                <div>
                                    <button onclick="app.setAdminTab('users')" class="btn btn-link text-muted p-0 text-decoration-none d-flex align-items-center gap-2">
                                        ← Retour à la liste
                                    </button>
                                </div>
                                
                                <div class="custom-card p-4">
                                    <div class="d-flex justify-content-between align-items-start mb-4">
                                        <div>
                                            <h2 class="fs-4 fw-medium mb-1">
                                                ${user.firstName} ${user.lastName}
                                                ${user.role === 'admin' ? '<span class="badge bg-dark ms-2 align-middle" style="font-size: 0.7rem;">Admin</span>' : ''}
                                            </h2>
                                            <p class="text-muted mb-1">${user.email} • ${user.phone || 'Pas de téléphone'}</p>
                                            <p class="small text-muted mb-0">${user.address || ''} ${user.zipCode || ''} ${user.city || ''}</p>
                                            
                                            <div class="d-flex align-items-center gap-2 mt-3">
                                                <div class="position-relative has-tooltip">
                                                    <button onclick="app.toggleSubscription(${user.id}, ${user.is_subscribed})" class="btn btn-sm ${user.is_subscribed ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'} rounded-circle d-flex align-items-center justify-content-center p-0" style="width: 32px; height: 32px; transition: all 0.2s;">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                                    </button>
                                                    <div class="planning-tooltip schedule-tooltip icon-tooltip shadow-lg text-center">
                                                        ${user.is_subscribed ? "Désactiver l'abonnement" : "Activer l'abonnement"}
                                                        <div class="tooltip-arrow"></div>
                                                    </div>
                                                </div>
                                                <div class="position-relative has-tooltip">
                                                    <button onclick="app.toggleUserRole(${user.id}, '${user.role}')" class="btn btn-sm ${user.role === 'admin' ? 'btn-secondary' : 'btn-outline-secondary'} rounded-circle d-flex align-items-center justify-content-center p-0" style="width: 32px; height: 32px; transition: all 0.2s;">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                                    </button>
                                                    <div class="planning-tooltip schedule-tooltip icon-tooltip shadow-lg text-center">
                                                        ${user.role === 'admin' ? 'Retirer les droits administrateur' : 'Nommer administrateur'}
                                                        <div class="tooltip-arrow"></div>
                                                    </div>
                                                </div>
                                                <div class="position-relative has-tooltip">
                                                    <button onclick="app.deleteAccount(${user.id}, true)" class="btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center p-0" style="width: 32px; height: 32px; transition: all 0.2s;">
                                                        ${icons.trash}
                                                    </button>
                                                    <div class="planning-tooltip schedule-tooltip icon-tooltip shadow-lg text-center">
                                                        Supprimer le compte
                                                        <div class="tooltip-arrow"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="text-end">
                                            <div class="display-6 fw-light text-emerald">${user.is_subscribed ? 'Abonné' : `${parseInt(user.credits_balance) || 0} <span class="fs-6">cours</span>`}</div>
                                            ${user.is_subscribed && subExpirationAdmin ? `<div class="small text-muted mt-1">Jusqu'au ${subExpirationAdmin}</div>` : ''}
                                        </div>
                                    </div>
                                    <div class="pt-4 border-top">
                                        <h3 class="fs-6 fw-medium mb-3">Gestion des cours</h3>
                                        
                                        <div class="mb-3">
                                            ${activeBatches && activeBatches.length > 0 ? `
                                                <div class="d-flex flex-column gap-1">
                                                    ${(() => {
                                                        const aggregatedBatches = {};
                                                        activeBatches.forEach(b => {
                                                            const key = b.expires_at ? new Date(b.expires_at).toLocaleDateString('fr-FR') : 'none';
                                                            if (!aggregatedBatches[key]) {
                                                                aggregatedBatches[key] = { credits: 0, expires_at: b.expires_at, ids: [] };
                                                            }
                                                            aggregatedBatches[key].credits += b.credits;
                                                            aggregatedBatches[key].ids.push(b.id);
                                                        });
                                                    
                                                    const validBatches = Object.values(aggregatedBatches).filter(b => !(user.is_subscribed && b.credits >= 50));
                                                    if (validBatches.length === 0) return '<p class="small text-muted mb-0">Pas de cours supplémentaires.</p>';

                                                    return validBatches.map(b => {
                                                            let expText = "Pas d'expiration";
                                                            if (b.expires_at) {
                                                                const expDate = new Date(b.expires_at);
                                                                const daysLeft = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
                                                                if (daysLeft <= 7) expText = `<span class="text-danger fw-bold">Expire dans ${daysLeft} j</span>`;
                                                                else expText = `Expire le ${expDate.toLocaleDateString('fr-FR')}`;
                                                            }

                                                            const idsJson = JSON.stringify(b.ids);
                                                            return `
                                                            <div class="d-flex justify-content-between align-items-center p-2 border rounded-3 bg-light transition-colors hover-bg-light">
                                                                <div>
                                                                <span class="fw-bold text-emerald">${b.credits} cours</span>
                                                                    <span class="text-muted small ms-2">${expText}</span>
                                                                </div>
                                                                <div class="d-flex gap-2">
                                                                    <button type="button" onclick="app.promptRemoveSpecificCredits(${user.id}, ${b.credits}, ${idsJson.replace(/"/g, '&quot;')})" class="btn btn-sm btn-outline-secondary py-0 px-2 fw-medium" style="font-size:0.75rem;">Retirer...</button>
                                                                    <button type="button" onclick="app.removeSpecificCredits(${user.id}, ${b.credits}, ${idsJson.replace(/"/g, '&quot;')})" class="btn btn-sm btn-outline-danger py-0 px-2" title="Supprimer tout ce lot">${icons.trash}</button>
                                                                </div>
                                                            </div>`;
                                                        }).join('');
                                                    })()}
                                                </div>
                                            ` : '<p class="small text-muted mb-0">Aucun cours disponible.</p>'}
                                        </div>

                                        <form onsubmit="app.adjustUserCredits(event, ${user.id})" class="p-3 bg-light border rounded-3 mt-3">
                                            <div class="d-flex flex-wrap align-items-center gap-3">
                                                <label class="fw-medium small mb-0 text-nowrap">Ajouter des cours :</label>
                                                <input type="number" name="amount" placeholder="Qté" required min="1" class="form-control form-control-sm text-center px-1" style="width: 60px;">
                                                
                                                <div class="form-check mb-0 ms-1 d-flex align-items-center gap-2">
                                                    <input type="checkbox" id="admin-exp-cb" class="form-check-input mt-0 cursor-pointer" onchange="document.getElementById('admin-exp-div').classList.toggle('d-none', !this.checked); if(!this.checked) document.getElementById('admin-exp-input').value = '0';">
                                                    <label class="form-check-label small text-muted cursor-pointer text-nowrap" style="padding-top: 2px;" for="admin-exp-cb">A une expiration ?</label>
                                                </div>
                                                <div class="d-none d-flex align-items-center gap-2" id="admin-exp-div">
                                                    <label class="small text-muted mb-0">Expire dans :</label>
                                                    <input type="number" id="admin-exp-input" name="expires_in_value" value="0" min="0" class="form-control form-control-sm text-center" style="width: 70px;">
                                                    <select name="expires_in_unit" class="form-select form-select-sm text-muted small" style="width: auto; padding-right: 2rem; cursor: pointer;">
                                                        <option value="days">jours</option>
                                                        <option value="months">mois</option>
                                                        <option value="years">années</option>
                                                    </select>
                                                </div>
                                                <button type="submit" class="btn btn-emerald btn-sm ms-auto px-4">Ajouter</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                <div class="row g-4">
                                    <div class="col-md-6">
                                        <div class="custom-card p-4 h-100">
                                            <h3 class="fs-5 fw-medium mb-3">Historique des réservations</h3>
                                            <div class="d-flex flex-column gap-2 overflow-auto pr-2" style="max-height: 300px;">
                                                ${futureBookings.map(b => `
                                                    <div class="d-flex align-items-center justify-content-between p-2 rounded-3 bg-emerald-light text-emerald-dark small">
                                                        <span>📅 ${new Date(b.date).toLocaleDateString()} à ${b.time} - ${b.title}</span>
                                                        <button onclick="app.adminCancelBookingForUser(${b.class_id}, ${user.id})" class="btn btn-link text-danger p-0" title="Annuler cette réservation">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>
                                                        </button>
                                                    </div>
                                                `).join('')}
                                                ${pastBookings.map(b => `<div class="p-2 bg-light rounded-3 small text-muted">✔️ ${new Date(b.date).toLocaleDateString()} - ${b.title}</div>`).join('')}
                                                ${bookings.length === 0 ? '<p class="text-muted small mb-0">Aucune réservation</p>' : ''}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <div class="custom-card p-4 h-100">
                                            <h3 class="fs-5 fw-medium mb-3">Historique financier</h3>
                                            <div class="d-flex flex-column gap-3">
                                                <div>
                                                    <h4 class="small fw-semibold text-emerald mb-2">Achats (Paiements)</h4>
                                                    <div class="d-flex flex-column gap-1 overflow-auto pr-2" style="max-height: 120px;">
                                                        ${paymentHistory.map(t => {
                                                            const isSub = t.amount >= 999 || t.description.toLowerCase().includes('abonnement');
                                                            return `
                                                            <div class="d-flex justify-content-between align-items-center p-1 border-bottom">
                                                                <div style="font-size: 0.75rem;">
                                                                    <div class="fw-medium">${t.description}</div>
                                                                    <div class="text-muted">${new Date(t.date).toLocaleString('fr-FR', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}</div>
                                                                </div>
                                                                <div class="small fw-bold text-success">${isSub ? 'Abonnement' : '+' + t.amount}</div>
                                                            </div>
                                                        `}).join('')}
                                                        ${paymentHistory.length === 0 ? '<p class="text-muted small mb-0">Aucun achat</p>' : ''}
                                                    </div>
                                                </div>
                                                <div class="pt-3 border-top">
                                                    <h4 class="small fw-semibold text-muted mb-2">Mouvements de cours</h4>
                                                    <div class="d-flex flex-column gap-1 overflow-auto pr-2" style="max-height: 120px;">
                                                        ${creditHistory.map(t => {
                                                            let desc = t.description;
                                                            if (t.type === 'booking' && desc.startsWith('Réservation : ')) desc = `Réservation : ${desc.substring(14)}`;
                                                            else if (t.type === 'refund' && desc.startsWith('Annulation : ')) desc = `Annulation : ${desc.substring(13)}`;
                                                            return `
                                                            <div class="d-flex justify-content-between align-items-center p-1 border-bottom">
                                                                <div style="font-size: 0.75rem;">
                                                                    <div class="fw-medium">${desc}</div>
                                                                    <div class="text-muted">${new Date(t.date).toLocaleString('fr-FR', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}</div>
                                                                </div>
                                                                <div class="small fw-bold ${t.amount > 0 ? 'text-success' : 'text-muted'}">${t.amount >= 999 ? 'Abonnement' : (t.amount > 0 ? '+' : '') + t.amount}</div>
                                                            </div>`;
                                                        }).join('')}
                                                        ${creditHistory.length === 0 ? '<p class="text-muted small mb-0">Aucun mouvement</p>' : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="custom-card p-4">
                                    <h3 class="fs-5 fw-medium mb-3">Envoyer un message au client</h3>
                                    <form onsubmit="app.sendUserMessage(event, ${user.id})" class="d-flex flex-column gap-3">
                                        <input type="text" id="user-message-editor-subject" name="subject" placeholder="Sujet" required class="form-control form-control-sm">
                                        <div class="quill-editor-wrapper">
                                            <div id="user-message-editor"></div>
                                        </div>
                                        <button type="submit" ${st.isSendingAdminMessage ? 'disabled' : ''} class="btn btn-emerald w-100 fw-medium">
                                            ${st.isSendingAdminMessage ? 'Envoi en cours...' : 'Envoyer le message'}
                                        </button>
                                    </form>
                                </div>
                            </div>`;
                        })() : ''}

                        ${!st.isAdminAiLoading && st.adminTab === 'newsletter' ? `
                            <div class="row g-4 animate-fade-in">
                                <div class="col-lg-8">
                                    <div class="custom-card p-4">
                                        <h2 class="fs-5 fw-medium mb-4 d-flex align-items-center gap-2">
                                            <span class="text-emerald">✉️</span> Envoyer une Newsletter
                                        </h2>
                                        <form onsubmit="app.sendNewsletter(event)" class="d-flex flex-column gap-3">
                                            <div>
                                                <label class="form-label small fw-medium mb-1">Objet</label>
                                                <input type="text" id="nl-subject" required class="form-control" placeholder="Ex: Nouveaux cours disponibles !">
                                            </div>
                                            <div>
                                                <div class="d-flex justify-content-between align-items-center mb-1">
                                                    <label class="form-label small fw-medium mb-0">Message</label>
                                                    <button type="button" onclick="app.toggleHtmlView()" class="btn btn-link text-emerald p-0 text-decoration-none small">
                                                        ${st.isHtmlView ? '👁️ Voir le rendu visuel' : '💻 Voir le code HTML'}
                                                    </button>
                                                </div>
                                                ${st.isHtmlView ? `
                                                    <textarea id="nl-html-area" class="form-control font-monospace" style="min-height: 280px;">${st.newsletterContent}</textarea>
                                                ` : `
                                                    <div class="quill-editor-wrapper">
                                                        <div id="nl-editor"></div>
                                                    </div>
                                                `}
                                            </div>
                                            <button type="submit" class="btn btn-emerald py-3 mt-2 fw-medium">
                                                Envoyer aux ${st.selectedNewsletterRecipients.length} destinataires
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                <div class="col-lg-4">
                                    <div class="custom-card p-4">
                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                            <h2 class="fs-6 fw-medium mb-0">Destinataires</h2>
                                            <div class="d-flex gap-2">
                                                <button type="button" onclick="app.state.selectedNewsletterRecipients = []; app.render()" class="btn btn-outline-secondary btn-sm py-0" style="font-size: 0.75rem;">Aucun</button>
                                                <button type="button" onclick="app.state.selectedNewsletterRecipients = app.state.users.map(u => u.id); app.render()" class="btn btn-outline-secondary btn-sm py-0" style="font-size: 0.75rem;">Tous</button>
                                                <button type="button" onclick="app.setAdminTab('newsletter')" class="btn btn-emerald btn-sm py-0" style="font-size: 0.75rem;">Abonnés</button>
                                            </div>
                                        </div>
                                        <div class="d-flex flex-column gap-2 overflow-auto pr-2" style="max-height: 400px;">
                                            ${clients.map(u => {
                                                const isSelected = st.selectedNewsletterRecipients.includes(u.id);
                                                const isSubscribed = Number(u.newsletter_subscribed) === 1;
                                                return `
                                                    <div onclick="app.toggleNewsletterRecipient(${u.id})" class="p-2 rounded-3 border cursor-pointer transition-colors ${isSelected ? 'bg-emerald-light border-success' : 'bg-light'}">
                                                        <div class="d-flex justify-content-between align-items-center mb-1">
                                                            <div class="d-flex align-items-center gap-2 text-truncate">
                                                                <span class="small fw-medium ${isSelected ? 'text-emerald-dark' : 'text-muted'}">${u.firstName} ${u.lastName}</span>
                                                                ${isSubscribed ? `<span class="badge bg-emerald-light text-emerald border border-success border-opacity-25" style="font-size: 0.6rem;">Abonné</span>` : ''}
                                                            </div>
                                                            <div class="rounded-circle border d-flex align-items-center justify-content-center" style="width: 18px; height: 18px; ${isSelected ? 'background-color: var(--emerald-600); border-color: var(--emerald-600); color: white; font-size: 10px;' : 'background-color: white;'}">
                                                                ${isSelected ? '✓' : ''}
                                                            </div>
                                                        </div>
                                                        <div class="text-truncate text-muted" style="font-size: 0.7rem;">${u.email}</div>
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                                        <div class="mt-3 pt-3 border-top text-muted small">
                                            ${st.selectedNewsletterRecipients.length} destinataire(s) sélectionné(s).
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        ${!st.isAdminAiLoading && st.adminTab === 'settings' ? `
                            <div class="custom-card p-4 p-md-5 mx-auto animate-fade-in" style="max-width: 600px;">
                                <h2 class="fs-5 fw-medium mb-4">Paramètres du Studio</h2>
                                <form onsubmit="app.updateStudioSettings(event)" class="d-flex flex-column gap-3">
                                    <div>
                                        <label class="form-label small fw-medium mb-1">Adresse</label>
                                        <input type="text" id="admin-studio-address" required class="form-control" value="${st.studioAddress}">
                                    </div>
                                    <div>
                                        <label class="form-label small fw-medium mb-1">Téléphone</label>
                                        <input type="tel" id="admin-studio-phone" required class="form-control" value="${st.studioPhone}">
                                    </div>
                                    <div>
                                        <label class="form-label small fw-medium mb-1">Email</label>
                                        <input type="email" id="admin-studio-email" required class="form-control" value="${st.studioEmail}">
                                    </div>
                                    <div>
                                        <label class="form-label small fw-medium mb-1">Moteur d'Intelligence Artificielle</label>
                                        <select id="admin-ai-provider" class="form-select">
                                            <option value="gemini" ${st.aiProvider === 'gemini' ? 'selected' : ''}>Google Gemini 2.0 (Gratuit)</option>
                                            <option value="mistral" ${st.aiProvider === 'mistral' ? 'selected' : ''}>Mistral AI (Français)</option>
                                            <option value="groq" ${st.aiProvider === 'groq' ? 'selected' : ''}>Groq (Ultra-rapide)</option>
                                            <option value="openai" ${st.aiProvider === 'openai' ? 'selected' : ''}>OpenAI (GPT-4o mini)</option>
                                        </select>
                                    </div>
                                    <div class="pt-3 border-top mt-2">
                                        <label class="form-label small fw-medium mb-1">Lien Instagram</label>
                                        <div class="position-relative mb-3">
                                            <div class="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted z-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                                            </div>
                                            <input type="url" id="admin-studio-instagram" class="form-control" style="padding-left: 2.5rem !important;" value="${st.studioInstagram}" placeholder="https://instagram.com/...">
                                        </div>
                                        
                                        <label class="form-label small fw-medium mb-1">Lien Facebook</label>
                                        <div class="position-relative mb-3">
                                            <div class="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted z-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                                            </div>
                                            <input type="url" id="admin-studio-facebook" class="form-control" style="padding-left: 2.5rem !important;" value="${st.studioFacebook}" placeholder="https://facebook.com/...">
                                        </div>
                                        
                                        <label class="form-label small fw-medium mb-1">Lien TikTok</label>
                                        <div class="position-relative mb-2">
                                            <div class="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted z-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                                            </div>
                                            <input type="url" id="admin-studio-tiktok" class="form-control" style="padding-left: 2.5rem !important;" value="${st.studioTiktok}" placeholder="https://tiktok.com/...">
                                        </div>
                                    </div>
                                    <button type="submit" class="btn btn-emerald py-2 mt-3 fw-medium">
                                        Enregistrer les paramètres
                                    </button>
                                </form>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>`;
};