import { icons } from '../icons.js';
import { generatePaginationHtml, generateLimitSelectorHtml } from '../utils.js';
import { renderAddClassForm, renderCancellationDelayForm, renderPackagesManager, renderNewsletterForm, renderStudioSettings } from './adminForms.js';
import { renderLedgerTab, renderUserDetailsTab, renderTemplatesTab, renderUsersTab } from './adminSubviews.js';

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
      // Application du tri dynamique
    if (st.adminClassesSort && st.adminClassesSort.column) {
        const sortCol = st.adminClassesSort.column;
        const sortDir = st.adminClassesSort.direction === 'asc' ? 1 : -1;
        
        filteredClasses.sort((a, b) => {
            let valA, valB;
            if (sortCol === 'date') {
                valA = `${a.date}T${a.time}`;
                valB = `${b.date}T${b.time}`;
            } else if (sortCol === 'title') {
                valA = (a.title || '').toLowerCase();
                valB = (b.title || '').toLowerCase();
            } else if (sortCol === 'capacity') {
                valA = a.bookedUsers ? a.bookedUsers.length : 0;
                valB = b.bookedUsers ? b.bookedUsers.length : 0;
            }
            if (valA < valB) return -1 * sortDir;
            if (valA > valB) return 1 * sortDir;
            return 0;
        });
    }
    
    // Calcul des limites dynamiques pour les Range Sliders (Heures et Inscrits)
    const bookedCounts = st.classes.map(c => c.bookedUsers.length);
    const minBookingsDb = bookedCounts.length ? Math.min(...bookedCounts) : 0;
    const maxBookingsDb = bookedCounts.length ? Math.max(...bookedCounts) : 20;
    const minBookedVal = f.minBooked !== '' ? parseInt(f.minBooked) : minBookingsDb;
    const maxBookedVal = f.maxBooked !== '' ? parseInt(f.maxBooked) : maxBookingsDb;
    let rangeBookings = maxBookingsDb - minBookingsDb; if (rangeBookings === 0) rangeBookings = 1;
    const bookedPercentMin = Math.max(0, Math.min(100, ((minBookedVal - minBookingsDb) / rangeBookings) * 100));
    const bookedPercentMax = Math.max(0, Math.min(100, ((maxBookedVal - minBookingsDb) / rangeBookings) * 100));
    
    const timesList = st.classes.map(c => c.time).filter(Boolean).sort();
    const minTimeDb = timesList.length ? timesList[0] : '00:00';
    const maxTimeDb = timesList.length ? timesList[timesList.length - 1] : '23:59';
    const timeToMins = t => { const [h,m] = t.split(':'); return parseInt(h)*60 + parseInt(m); };
    const minTimeMins = timesList.length ? timeToMins(minTimeDb) : 0;
    const maxTimeMins = timesList.length ? timeToMins(maxTimeDb) : 1440;
    const currentMinTimeMins = f.startTime ? timeToMins(f.startTime) : minTimeMins;
    const currentMaxTimeMins = f.endTime ? timeToMins(f.endTime) : maxTimeMins;
    let rangeTime = maxTimeMins - minTimeMins; if (rangeTime === 0) rangeTime = 1;
    const timePercentMin = Math.max(0, Math.min(100, ((currentMinTimeMins - minTimeMins) / rangeTime) * 100));
    const timePercentMax = Math.max(0, Math.min(100, ((currentMaxTimeMins - minTimeMins) / rangeTime) * 100));

    const limitAdminClasses = st.adminClassesPagination?.limit || 10;
    const totalAdminClasses = filteredClasses.length;
    const totalAdminClassesPages = limitAdminClasses === 'all' ? 1 : Math.ceil(totalAdminClasses / limitAdminClasses) || 1;
    const currentAdminClassesPage = Math.max(1, Math.min(st.adminClassesPagination?.page || 1, totalAdminClassesPages));
    
    let displayedClasses = filteredClasses;
    if (limitAdminClasses !== 'all') {
        const startIdx = (currentAdminClassesPage - 1) * limitAdminClasses;
        displayedClasses = filteredClasses.slice(startIdx, startIdx + limitAdminClasses);
    }

    return `
       <div class="pt-4 pb-5 animate-fade-in flex-grow-1">
            <div class="container-fluid px-3 px-md-4" style="max-width: 1600px;">
                <div class="d-flex flex-column flex-lg-row gap-4">
                    <!-- Menu Latéral -->
                    <aside class="admin-sidebar-wrapper flex-shrink-0">
                        <div class="custom-card p-2 position-sticky" style="top: 6rem;">
                            <h1 class="fw-bold mb-3 px-2 mt-2 text-muted text-uppercase tracking-wider" style="font-size: 0.7rem;">Administration</h1>
                            <nav class="d-flex flex-column">
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

                    <div class="flex-grow-1 w-100" style="min-width: 0;">
                        ${st.isAdminAiLoading ? '<div class="p-5 text-center text-muted">Chargement des données...</div>' : ''}

                        ${!st.isAdminAiLoading && (st.adminTab === 'planning' || st.adminTab === 'past_sessions') ? `
                            <div class="row g-3">
                                <!-- Liste des Séances -->
                                <div class="col-lg-9">
                                    <div class="custom-card p-0">
                                        ${st.selectedAdminClasses.length > 0 ? `
                                            <div class="p-3 bg-danger bg-opacity-10 border-bottom border-danger border-opacity-25 d-flex justify-content-between align-items-center" style="border-top-left-radius: 1.5rem; border-top-right-radius: 1.5rem;">
                                                <span class="small fw-medium text-danger">${st.selectedAdminClasses.length} séance(s) sélectionnée(s)</span>
                                                <button onclick="app.adminBulkDeleteClasses()" class="btn btn-sm btn-danger d-flex align-items-center gap-2 fw-medium">
                                                    ${icons.trash} Supprimer la sélection
                                                </button>
                                            </div>
                                        ` : `
                                            <div class="p-2 px-3 border-bottom d-flex justify-content-between align-items-center bg-light flex-wrap gap-2" style="border-top-left-radius: 1.5rem; border-top-right-radius: 1.5rem;">
                                                <div class="d-flex align-items-center gap-3">
                                                    <h2 class="fs-6 fw-medium mb-0">${st.adminTab === 'planning' ? 'Séances à venir' : 'Historique des séances'}</h2>
                                                    <span class="small text-muted">${totalAdminClasses} résultat(s)</span>
                                                </div>
                                                <div class="d-flex align-items-center gap-2">
                                                    <label class="small text-muted mb-0 fw-medium">Afficher :</label>
                                                    ${generateLimitSelectorHtml(limitAdminClasses, 'app.setAdminClassesLimit')}
                                                </div>
                                            </div>
                                        `}
                                        <div class="table-responsive overflow-visible">
                                            <table class="table table-hover align-middle mb-0" style="font-size: 0.8rem;">
                                                ${(() => {
                                                    const renderAdminSortIcon = (col) => {
                                                        if (st.adminClassesSort?.column === col) {
                                                            return st.adminClassesSort.direction === 'asc' ? ' <span class="text-emerald">↑</span>' : ' <span class="text-emerald">↓</span>';
                                                        }
                                                        return ' <span class="opacity-25">↕</span>';
                                                    };
                                                    return `
                                                    <thead class="text-nowrap" style="user-select: none;">
                                                        <tr class="text-muted">
                                                            <th class="py-2 px-2" style="width: 40px;">
                                                                <input type="checkbox" onchange="app.toggleAllAdminClasses(this.checked, ${JSON.stringify(displayedClasses.map(c => c.id)).replace(/"/g, '&quot;')})" ${st.selectedAdminClasses.length === displayedClasses.length && displayedClasses.length > 0 ? 'checked' : ''} class="form-check-input cursor-pointer">
                                                            </th>
                                                            <th class="py-2 px-2 fw-bold cursor-pointer hover-bg-light" onclick="app.handleAdminClassesSort('date')">Date & Heure${renderAdminSortIcon('date')}</th>
                                                            <th class="py-2 px-2 fw-bold cursor-pointer hover-bg-light w-50" onclick="app.handleAdminClassesSort('title')">Cours${renderAdminSortIcon('title')}</th>
                                                            <th class="py-2 px-2 fw-bold cursor-pointer hover-bg-light text-center" onclick="app.handleAdminClassesSort('capacity')">Inscrits${renderAdminSortIcon('capacity')}</th>
                                                            <th class="py-2 px-2 fw-medium text-end">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    `;
                                                })()}
                                                <tbody>
                                                    ${displayedClasses.length === 0 ? `<tr><td colspan="5" class="py-3 text-center text-muted">Aucune séance trouvée</td></tr>` : 
                                                    displayedClasses.map(c => `
                                                        <tr class="${st.selectedAdminClasses.includes(c.id) ? 'table-active' : ''}">
                                                            <td class="py-1 px-2">
                                                                <input type="checkbox" onchange="app.toggleAdminClassSelection(${c.id})" ${st.selectedAdminClasses.includes(c.id) ? 'checked' : ''} class="form-check-input cursor-pointer">
                                                            </td>
                                                            <td class="py-1 px-2 text-nowrap">
                                                                <div class="fw-medium">${new Date(c.date).toLocaleDateString('fr-FR')}</div>
                                                                <div class="small text-muted">${c.time} (${c.duration} min)</div>
                                                            </td>
                                                            <td class="py-1 px-2">
                                                                <div class="fw-medium text-emerald">${c.title}</div>
                                                            </td>
                                                            <td class="py-1 px-2 text-center text-nowrap position-relative has-tooltip">
                                                                <span class="badge rounded-pill ${c.bookedUsers.length >= c.capacity ? 'bg-danger' : 'bg-success'} cursor-pointer hover-opacity-75 transition-all" onclick="app.editClassCapacity(${c.id}, ${c.capacity})" title="Cliquez pour modifier la capacité de cette séance">
                                                                    ${c.bookedUsers.length} / ${c.capacity || 10}
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
                                                            <td class="py-1 px-2 text-end text-nowrap">
                                                                <button onclick="app.adminDeleteClass(${c.id})" class="btn btn-link text-danger p-0" title="Supprimer">
                                                                    ${icons.trash}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    `).join('')}
                                                </tbody>
                                            </table>
                                        </div>
                                        ${generatePaginationHtml(currentAdminClassesPage, totalAdminClassesPages, 'app.setAdminClassesPage')}
                                    </div>
                                </div>
                                
                                <!-- Filtres & Ajout -->
                                <div class="col-lg-3 d-flex flex-column gap-3">
                                    <div class="custom-card p-3">
                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                            <h3 class="fs-6 fw-bold text-muted text-uppercase mb-0 d-flex align-items-center gap-2" style="font-size: 0.75rem;">
                                                ${icons.sparkles} Filtres
                                            </h3>
                                            ${Object.values(f).some(v => v !== '' && (!Array.isArray(v) || v.length > 0)) ? `
                                                <button onclick="app.state.adminClassFilters = {startDate:'',endDate:'',startTime:'',endTime:'',titles:[],minBooked:'',maxBooked:'',userName:''}; app.render();" class="btn btn-link text-danger p-0 small text-decoration-none" style="font-size: 0.7rem;">Réinitialiser</button>
                                            ` : ''}
                                        </div>
                                        
                                        <div class="d-flex flex-column gap-2" style="font-size: 0.75rem;">
                                            <div class="row g-2 align-items-center">
                                                <label class="col-auto col-form-label py-0 text-muted pe-1" style="width: 60px;">Période</label>
                                                <div class="col ps-1 d-flex align-items-center gap-1">
                                                    <input type="date" value="${f.startDate}" oninput="app.handleAdminClassFilterChange('startDate', this.value)" class="form-control form-control-sm py-0 px-1 text-muted" style="font-size: 0.7rem; height: 24px;">
                                                    <input type="date" value="${f.endDate}" oninput="app.handleAdminClassFilterChange('endDate', this.value)" class="form-control form-control-sm py-0 px-1 text-muted" style="font-size: 0.7rem; height: 24px;">
                                                </div>
                                            </div>
                                            
                                            <div class="row g-2 align-items-center mt-2">
                                                <label class="col-auto col-form-label py-0 text-muted pe-1" style="width: 60px;">Heures</label>
                                                <div class="col ps-1">
                                                    <div class="d-flex justify-content-between mb-1 text-muted" style="font-size: 0.65rem;">
                                                        <span class="fw-bold">${f.startTime || minTimeDb}</span>
                                                        <span class="fw-bold">${f.endTime || maxTimeDb}</span>
                                                    </div>
                                                    <div class="dual-range-container">
                                                        <div class="dual-range-track"></div>
                                                        <div class="dual-range-fill" style="left: ${timePercentMin}%; width: ${timePercentMax - timePercentMin}%;"></div>
                                                        <input type="range" class="dual-range-input" value="${currentMinTimeMins}" min="${minTimeMins}" max="${maxTimeMins}" step="15" oninput="const p=this.parentNode; const v1=parseInt(p.children[2].value); const v2=parseInt(p.children[3].value); const r=this.max-this.min||1; p.children[1].style.left=((Math.min(v1,v2)-this.min)/r*100)+'%'; p.children[1].style.width=((Math.abs(v1-v2))/r*100)+'%';" onchange="const p=this.parentNode; const v1=parseInt(p.children[2].value); const v2=parseInt(p.children[3].value); const minV=Math.min(v1,v2); const maxV=Math.max(v1,v2); app.state.adminClassFilters.startTime = String(Math.floor(minV/60)).padStart(2,'0')+':'+String(minV%60).padStart(2,'0'); app.handleAdminClassFilterChange('endTime', String(Math.floor(maxV/60)).padStart(2,'0')+':'+String(maxV%60).padStart(2,'0'));">
                                                        <input type="range" class="dual-range-input" value="${currentMaxTimeMins}" min="${minTimeMins}" max="${maxTimeMins}" step="15" oninput="const p=this.parentNode; const v1=parseInt(p.children[2].value); const v2=parseInt(p.children[3].value); const r=this.max-this.min||1; p.children[1].style.left=((Math.min(v1,v2)-this.min)/r*100)+'%'; p.children[1].style.width=((Math.abs(v1-v2))/r*100)+'%';" onchange="const p=this.parentNode; const v1=parseInt(p.children[2].value); const v2=parseInt(p.children[3].value); const minV=Math.min(v1,v2); const maxV=Math.max(v1,v2); app.state.adminClassFilters.startTime = String(Math.floor(minV/60)).padStart(2,'0')+':'+String(minV%60).padStart(2,'0'); app.handleAdminClassFilterChange('endTime', String(Math.floor(maxV/60)).padStart(2,'0')+':'+String(maxV%60).padStart(2,'0'));">
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="row g-2 align-items-center mt-2">
                                                <label class="col-auto col-form-label py-0 text-muted pe-1" style="width: 60px;">Inscrits</label>
                                                <div class="col ps-1">
                                                    <div class="d-flex justify-content-between mb-1 text-muted" style="font-size: 0.65rem;">
                                                        <span class="fw-bold">${minBookedVal}</span>
                                                        <span class="fw-bold">${maxBookedVal}</span>
                                                    </div>
                                                    <div class="dual-range-container">
                                                        <div class="dual-range-track"></div>
                                                        <div class="dual-range-fill" style="left: ${bookedPercentMin}%; width: ${bookedPercentMax - bookedPercentMin}%;"></div>
                                                        <input type="range" class="dual-range-input" value="${minBookedVal}" min="${minBookingsDb}" max="${maxBookingsDb}" step="1" oninput="const p=this.parentNode; const v1=parseInt(p.children[2].value); const v2=parseInt(p.children[3].value); const r=this.max-this.min||1; p.children[1].style.left=((Math.min(v1,v2)-this.min)/r*100)+'%'; p.children[1].style.width=((Math.abs(v1-v2))/r*100)+'%';" onchange="const p=this.parentNode; const v1=parseInt(p.children[2].value); const v2=parseInt(p.children[3].value); app.state.adminClassFilters.minBooked=Math.min(v1,v2); app.handleAdminClassFilterChange('maxBooked', Math.max(v1,v2));">
                                                        <input type="range" class="dual-range-input" value="${maxBookedVal}" min="${minBookingsDb}" max="${maxBookingsDb}" step="1" oninput="const p=this.parentNode; const v1=parseInt(p.children[2].value); const v2=parseInt(p.children[3].value); const r=this.max-this.min||1; p.children[1].style.left=((Math.min(v1,v2)-this.min)/r*100)+'%'; p.children[1].style.width=((Math.abs(v1-v2))/r*100)+'%';" onchange="const p=this.parentNode; const v1=parseInt(p.children[2].value); const v2=parseInt(p.children[3].value); app.state.adminClassFilters.minBooked=Math.min(v1,v2); app.handleAdminClassFilterChange('maxBooked', Math.max(v1,v2));">
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="row g-2 align-items-center mt-1">
                                                <label class="col-auto col-form-label py-0 text-muted pe-1" style="width: 60px;">Client</label>
                                                <div class="col ps-1">
                                                    <select onchange="app.handleAdminClassFilterChange('userName', this.value)" class="form-select form-select-sm py-0 ps-2 pe-4 text-muted cursor-pointer" style="font-size: 0.7rem; height: 24px;">
                                                        <option value="">-- Tous --</option>
                                                        ${st.users.filter(u => u.role !== 'admin').map(u => { const fullName = `${u.firstName} ${u.lastName}`; return `<option value="${fullName}" ${f.userName === fullName ? 'selected' : ''}>${fullName}</option>`; }).join('')}
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <div class="row g-2 align-items-center">
                                                <label class="col-auto col-form-label py-0 text-muted pe-1" style="width: 60px;">Cours</label>
                                                <div class="col ps-1">
                                                    <select onchange="app.handleAdminClassFilterChange('titles', this.value ? [this.value] : [])" class="form-select form-select-sm py-0 ps-2 pe-4 text-muted cursor-pointer" style="font-size: 0.7rem; height: 24px;">
                                                        <option value="">-- Tous --</option>
                                                        ${allTitles.map(t => `<option value="${t}" ${f.titles.includes(t) ? 'selected' : ''}>${t}</option>`).join('')}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    ${st.adminTab === 'planning' ? `
                                        ${renderAddClassForm(st)}
                                        ${renderCancellationDelayForm(st)}
                                    ` : ''}
                                </div>
                            </div>
                        ` : ''}

                        ${!st.isAdminAiLoading && st.adminTab === 'templates' ? renderTemplatesTab(app, st) : ''}

                        ${!st.isAdminAiLoading && st.adminTab === 'packages' ? renderPackagesManager(st) : ''}

                        ${!st.isAdminAiLoading && st.adminTab === 'users' ? renderUsersTab(app, st, clients) : ''}

                        ${!st.isAdminAiLoading && st.adminTab === 'ledger' ? renderLedgerTab(app, st) : ''}

                        ${!st.isAdminAiLoading && st.adminTab === 'user_details' && st.selectedUserDetails && st.selectedUserDetails.user ? renderUserDetailsTab(app, st) : ''}

                        ${!st.isAdminAiLoading && st.adminTab === 'newsletter' ? renderNewsletterForm(st, clients) : ''}

                        ${!st.isAdminAiLoading && st.adminTab === 'settings' ? renderStudioSettings(st) : ''}
                    </div>
                </div>
            </div>
        </div>`;
};