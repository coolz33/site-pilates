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
                                                    <select onchange="app.setAdminClassesLimit(this.value)" class="form-select form-select-sm py-0 ps-2 pe-4 text-muted cursor-pointer" style="width: auto; min-width: 75px; font-size: 0.75rem; height: 26px;">
                                                        <option value="10" ${limitAdminClasses === 10 ? 'selected' : ''}>10</option>
                                                        <option value="20" ${limitAdminClasses === 20 ? 'selected' : ''}>20</option>
                                                        <option value="50" ${limitAdminClasses === 50 ? 'selected' : ''}>50</option>
                                                        <option value="100" ${limitAdminClasses === 100 ? 'selected' : ''}>100</option>
                                                        <option value="all" ${limitAdminClasses === 'all' ? 'selected' : ''}>Tous</option>
                                                    </select>
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
                                        ${totalAdminClassesPages > 1 ? `
                                            <div class="p-2 border-top bg-light d-flex justify-content-between align-items-center" style="border-bottom-left-radius: 1.5rem; border-bottom-right-radius: 1.5rem;">
                                                <span class="text-muted fw-medium" style="font-size: 0.75rem;">Page ${currentAdminClassesPage}/${totalAdminClassesPages}</span>
                                                <div class="d-flex gap-1">
                                                    <button onclick="app.setAdminClassesPage(${currentAdminClassesPage - 1})" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 0.75rem;" ${currentAdminClassesPage === 1 ? 'disabled' : ''}>&lt;</button>
                                                    ${Array.from({length: totalAdminClassesPages}, (_, i) => i + 1).map(p => {
                                                        if (totalAdminClassesPages > 7) {
                                                            if (p === 1 || p === totalAdminClassesPages || (p >= currentAdminClassesPage - 1 && p <= currentAdminClassesPage + 1)) return `<button onclick="app.setAdminClassesPage(${p})" class="btn btn-sm ${p === currentAdminClassesPage ? 'btn-emerald' : 'btn-outline-secondary'} py-0 px-2" style="font-size: 0.75rem;">${p}</button>`;
                                                            else if (p === currentAdminClassesPage - 2 || p === currentAdminClassesPage + 2) return `<span class="px-1 text-muted align-self-end" style="font-size: 0.75rem;">...</span>`;
                                                            return '';
                                                        }
                                                        return `<button onclick="app.setAdminClassesPage(${p})" class="btn btn-sm ${p === currentAdminClassesPage ? 'btn-emerald' : 'btn-outline-secondary'} py-0 px-2" style="font-size: 0.75rem;">${p}</button>`;
                                                    }).join('').replace(/(<span.*?<\/span>)+/g, '<span class="px-1 text-muted align-self-end" style="font-size: 0.75rem;">...</span>')}
                                                    <button onclick="app.setAdminClassesPage(${currentAdminClassesPage + 1})" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 0.75rem;" ${currentAdminClassesPage === totalAdminClassesPages ? 'disabled' : ''}>&gt;</button>
                                                </div>
                                            </div>
                                        ` : `
                                            <div class="border-top bg-light" style="height: 10px; border-bottom-left-radius: 1.5rem; border-bottom-right-radius: 1.5rem;"></div>
                                        `}
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
                                    <div class="custom-card p-3">
                                        <h3 class="fs-6 fw-bold text-muted text-uppercase mb-3" style="font-size: 0.75rem;">Ajouter un cours</h3>
                                        <form onsubmit="app.submitAddClass(event)" id="add-class-form" class="d-flex flex-column gap-2" style="font-size: 0.75rem;">
                                            <div class="row g-2 align-items-center">
                                                <label class="col-auto col-form-label py-0 text-muted pe-1" style="width: 70px;">Modèle</label>
                                                <div class="col ps-1">
                                                    <select id="planning-template-select" onchange="app.handleAdminAddClassFormChange('templateId', this.value); app.applyTemplate();" class="form-select form-select-sm py-0 ps-2 pe-4 text-muted" style="font-size: 0.7rem; height: 24px;">
                                                        <option value="">-- Sélectionner --</option>
                                                        ${st.courseTemplates.map(t => `<option value="${t.id}" ${st.adminAddClassForm.templateId == t.id ? 'selected' : ''}>${t.title}</option>`).join('')}
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="row g-2 align-items-center">
                                                <label class="col-auto col-form-label py-0 text-muted pe-1" style="width: 70px;">Date</label>
                                                <div class="col ps-1">
                                                    <input type="date" id="planning-date" value="${st.adminAddClassForm.date}" oninput="app.handleAdminAddClassFormChange('date', this.value)" required class="form-control form-control-sm py-0 px-2 text-muted" style="font-size: 0.7rem; height: 24px;">
                                                </div>
                                            </div>
                                            <div class="row g-2 align-items-center">
                                                <label class="col-auto col-form-label py-0 text-muted pe-1" style="width: 70px;">Heure</label>
                                                <div class="col ps-1">
                                                    <input type="time" id="planning-time" value="${st.adminAddClassForm.time}" oninput="app.handleAdminAddClassFormChange('time', this.value)" required class="form-control form-control-sm py-0 px-2 text-muted" style="font-size: 0.7rem; height: 24px;">
                                                </div>
                                            </div>
                                            
                                            <div class="form-check mt-1 mb-0 ps-0 d-flex align-items-center gap-2">
                                                <input type="checkbox" id="planning-is-recurring" onchange="app.toggleAdminRecurring()" ${st.isAdminRecurring ? 'checked' : ''} class="form-check-input m-0 cursor-pointer" style="width: 14px; height: 14px;">
                                                <label class="form-check-label text-muted cursor-pointer" for="planning-is-recurring">Cours récurrent</label>
                                            </div>
                                            
                                            <div id="recurring-fields" class="${st.isAdminRecurring ? 'd-flex' : 'd-none'} flex-column gap-2 p-2 bg-light rounded-2 border animate-fade-in mt-1">
                                                <div class="row g-2 align-items-center">
                                                    <label class="col-auto col-form-label py-0 text-muted pe-1" style="width: 70px;">Fréquence</label>
                                                    <div class="col ps-1">
                                                        <select id="planning-recurrence-type" onchange="app.handleAdminAddClassFormChange('recurrenceType', this.value)" class="form-select form-select-sm py-0 ps-2 pe-4 text-muted" style="font-size: 0.7rem; height: 24px;">
                                                            <option value="daily" ${st.adminAddClassForm.recurrenceType === 'daily' ? 'selected' : ''}>Quotidienne</option>
                                                            <option value="weekly" ${st.adminAddClassForm.recurrenceType === 'weekly' ? 'selected' : ''}>Hebdomadaire</option>
                                                            <option value="monthly" ${st.adminAddClassForm.recurrenceType === 'monthly' ? 'selected' : ''}>Mensuelle</option>
                                                            <option value="yearly" ${st.adminAddClassForm.recurrenceType === 'yearly' ? 'selected' : ''}>Annuelle</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="row g-2 align-items-center">
                                                    <label class="col-auto col-form-label py-0 text-muted pe-1" style="width: 70px;">Jusqu'au</label>
                                                    <div class="col ps-1">
                                                        <input type="date" id="planning-recurrence-end" value="${st.adminAddClassForm.recurrenceEnd}" oninput="app.handleAdminAddClassFormChange('recurrenceEnd', this.value)" class="form-control form-control-sm py-0 px-2 text-muted" style="font-size: 0.7rem; height: 24px;">
                                                    </div>
                                                </div>
                                            </div>
                                            <button type="submit" class="btn btn-emerald btn-sm py-1 mt-2 fw-medium w-100" style="font-size: 0.75rem;">Ajouter au planning</button>
                                            
                                            <!-- Champs cachés pour le template -->
                                            <input type="hidden" id="planning-title" value="${st.adminAddClassForm.title}">
                                            <textarea id="planning-desc" class="d-none">${st.adminAddClassForm.description}</textarea>
                                            <input type="hidden" id="planning-duration" value="${st.adminAddClassForm.duration}">
                                        </form>
                                    </div>

                                    <div class="custom-card p-3">
                                        <h3 class="fs-6 fw-bold text-muted text-uppercase mb-3" style="font-size: 0.75rem;">Paramètres</h3>
                                        <form onsubmit="app.updateCancellationDelay(event)" class="d-flex flex-column gap-2" style="font-size: 0.75rem;">
                                            <label class="col-form-label py-0 text-muted mb-0">Délai d'annulation d'un cours (h)</label>
                                            <div class="d-flex gap-2">
                                                <input type="number" id="admin-cancellation-delay" required min="0" class="form-control form-control-sm py-0 px-1 text-muted text-center" style="font-size: 0.7rem; height: 26px; max-width: 80px;" value="${st.cancellationDelay}">
                                                <button type="submit" class="btn btn-emerald btn-sm py-0 px-3 fw-medium" style="font-size: 0.7rem;">OK</button>
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
                                                            <div class="small text-muted">${t.duration} min • ${t.capacity || 10} places</div>
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
                                                const form = st.adminTemplateForm;
                                                return `
                                                    <div>
                                                        <label class="form-label small fw-medium mb-1">Titre du cours</label>
                                                        <input type="text" id="template-title" required class="form-control form-control-sm" value="${form.title}" oninput="app.state.adminTemplateForm.title = this.value">
                                                    </div>
                                                    <div>
                                                        <div class="d-flex justify-content-between align-items-center mb-1">
                                                            <label class="form-label small fw-medium mb-0">Description</label>
                                                            <button type="button" onclick="app.generateAdminDescription()" class="btn btn-link text-emerald p-0 text-decoration-none small fw-medium" style="font-size: 0.75rem;">✨ IA</button>
                                                        </div>
                                                        <textarea id="template-desc" rows="3" class="form-control form-control-sm" oninput="app.state.adminTemplateForm.description = this.value">${form.description}</textarea>
                                                    </div>
                                                    <div class="row g-2">
                                                        <div class="col-6">
                                                            <label class="form-label small fw-medium mb-1">Durée (min)</label>
                                                            <input type="number" id="template-duration" required class="form-control form-control-sm" value="${form.duration}" oninput="app.state.adminTemplateForm.duration = this.value">
                                                        </div>
                                                        <div class="col-6">
                                                            <label class="form-label small fw-medium mb-1">Capacité</label>
                                                            <input type="number" id="template-capacity" required min="1" class="form-control form-control-sm" value="${form.capacity}" oninput="app.state.adminTemplateForm.capacity = this.value">
                                                        </div>
                                                    </div>
                                                `;
                                            })()}
                                    <div class="d-flex flex-column gap-2 mt-2">
                                        <button type="submit" class="btn btn-emerald py-2 fw-medium d-flex align-items-center justify-content-center gap-2 shadow-sm">
                                            ${st.editingTemplateId ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v6h6"/></svg> Mettre à jour le modèle' : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Enregistrer le modèle'}
                                        </button>
                                        ${st.editingTemplateId ? `
                                            <button type="button" onclick="app.cancelEditTemplate()" class="btn btn-outline-secondary py-2 fw-medium small">Annuler</button>
                                        ` : ''}
                                    </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        ${!st.isAdminAiLoading && st.adminTab === 'packages' ? `
                            <div class="custom-card p-4 p-md-5 animate-fade-in">
                                <h2 class="fs-5 fw-medium mb-4">Gestion des Tarifs (Packs de cours)</h2>
                                <form onsubmit="app.updateAllPackages(event)">
                                    <div class="d-flex flex-column gap-3 mb-4">
                                    ${st.creditPackages.map(pkg => `
                                        <div class="p-3 border rounded-3 bg-light package-block" style="font-size: 0.85rem;">
                                            <input type="hidden" name="id" value="${pkg.id}">
                                            <div class="row g-2 align-items-center mb-2">
                                                <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 85px;">Affichage</label>
                                                <div class="col-sm-4 col-md-5">
                                                    <input type="text" name="name" value="${pkg.name}" placeholder="Titre (ex: Carte)" required class="form-control form-control-sm">
                                                </div>
                                                <div class="col-sm-5 col-md-5">
                                                    <input type="text" name="subtitle" value="${pkg.subtitle || ''}" placeholder="Sous-titre (ex: 10 cours)" class="form-control form-control-sm">
                                                </div>
                                            </div>
                                            <div class="row g-2 align-items-center mb-2">
                                                <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 85px;">Détails</label>
                                                <div class="col d-flex flex-wrap align-items-center gap-3">
                                                    <div class="d-flex align-items-center gap-1">
                                                        <input type="number" name="price" value="${pkg.price}" required min="0" class="form-control form-control-sm text-center px-1" style="width: 60px;">
                                                        <span class="text-muted">€</span>
                                                    </div>
                                                    <div class="pack-credits-col ${pkg.is_subscription ? 'd-none' : ''} d-flex align-items-center gap-1 border-start ps-3">
                                                        <input type="number" name="credits" value="${pkg.is_subscription ? 0 : pkg.credits}" min="0" class="form-control form-control-sm text-center px-1" style="width: 60px;">
                                                        <span class="text-muted">cours</span>
                                                    </div>
                                                    <div class="form-check mb-0 border-start ps-4 ms-1">
                                                        <input type="checkbox" id="is-sub-${pkg.id}" name="is_subscription" value="1" class="form-check-input cursor-pointer mt-1" onchange="this.closest('.package-block').querySelector('.pack-credits-col').classList.toggle('d-none', this.checked); this.closest('.package-block').querySelectorAll('.pack-normal-exp-col').forEach(e => e.classList.toggle('d-none', this.checked)); this.closest('.package-block').querySelector('.pack-sub-duration-col').classList.toggle('d-none', !this.checked);" ${pkg.is_subscription ? 'checked' : ''}>
                                                        <label class="form-check-label text-muted cursor-pointer" for="is-sub-${pkg.id}">Abonnement</label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row g-2 align-items-center mb-2">
                                                <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 85px;">Validité</label>
                                                <div class="col d-flex flex-wrap align-items-center gap-3">
                                                    <div class="pack-sub-duration-col ${pkg.is_subscription ? '' : 'd-none'} d-flex align-items-center gap-2">
                                                        <span class="text-muted">Durée :</span>
                                                        <input type="number" name="duration_days" value="${pkg.is_subscription ? (pkg.expires_in_days || 365) : 365}" min="1" class="form-control form-control-sm text-center px-1" style="width: 60px;">
                                                        <span class="text-muted">jours</span>
                                                    </div>
                                                    <div class="pack-normal-exp-col ${pkg.is_subscription ? 'd-none' : ''} d-flex align-items-center gap-3">
                                                        <div class="form-check mb-0">
                                                            <input type="checkbox" id="exp-cb-${pkg.id}" class="form-check-input cursor-pointer mt-1" onchange="document.getElementById('exp-div-${pkg.id}').classList.toggle('d-none', !this.checked); if(!this.checked) document.getElementById('exp-input-${pkg.id}').value = '0';" ${!pkg.is_subscription && pkg.expires_in_days > 0 ? 'checked' : ''}>
                                                            <label class="form-check-label text-muted cursor-pointer" for="exp-cb-${pkg.id}">A une expiration</label>
                                                        </div>
                                                        <div class="${!pkg.is_subscription && pkg.expires_in_days > 0 ? '' : 'd-none'} d-flex align-items-center gap-2 border-start ps-3" id="exp-div-${pkg.id}">
                                                            <span class="text-muted">Expire dans :</span>
                                                            <input type="number" id="exp-input-${pkg.id}" name="expires_in_days" value="${!pkg.is_subscription ? (pkg.expires_in_days || 0) : 0}" min="0" class="form-control form-control-sm text-center px-1" style="width: 60px;">
                                                            <span class="text-muted">jours</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row g-2 align-items-start mt-1">
                                                <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 85px;">Description</label>
                                                <div class="col">
                                                    <textarea name="description" class="form-control form-control-sm" rows="2" placeholder="Sauts de ligne autorisés">${pkg.description || ''}</textarea>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                    </div>
                                    <div class="text-start">
                                        <button type="submit" class="btn btn-emerald px-4 py-2 fw-medium">Enregistrer toutes les modifications</button>
                                    </div>
                                </form>
                                    
                                <div class="pt-4 border-top mt-5">
                                    <h3 class="fs-6 fw-medium mb-3">Ajouter un nouveau pack</h3>
                                    <form onsubmit="app.createPackage(event)" class="p-3 border rounded-3 bg-light package-block" style="font-size: 0.85rem;">
                                        <div class="row g-2 align-items-center mb-2">
                                            <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 85px;">Affichage</label>
                                            <div class="col-sm-4 col-md-5"><input type="text" name="name" placeholder="Titre (ex: Carte)" required class="form-control form-control-sm"></div>
                                            <div class="col-sm-5 col-md-5"><input type="text" name="subtitle" placeholder="Sous-titre (ex: 10 cours)" class="form-control form-control-sm"></div>
                                        </div>
                                        <div class="row g-2 align-items-center mb-2">
                                            <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 85px;">Détails</label>
                                            <div class="col d-flex flex-wrap align-items-center gap-3">
                                                <div class="d-flex align-items-center gap-1">
                                                    <input type="number" name="price" placeholder="Prix" required min="0" class="form-control form-control-sm text-center px-1" style="width: 60px;">
                                                    <span class="text-muted">€</span>
                                                </div>
                                                <div class="pack-credits-col d-flex align-items-center gap-1 border-start ps-3">
                                                    <input type="number" name="credits" placeholder="Qté" min="1" class="form-control form-control-sm text-center px-1" style="width: 60px;">
                                                    <span class="text-muted">cours</span>
                                                </div>
                                                <div class="form-check mb-0 border-start ps-4 ms-1">
                                                    <input type="checkbox" id="is-sub-new" name="is_subscription" value="1" class="form-check-input cursor-pointer mt-1" onchange="this.closest('.package-block').querySelector('.pack-credits-col').classList.toggle('d-none', this.checked); this.closest('.package-block').querySelectorAll('.pack-normal-exp-col').forEach(e => e.classList.toggle('d-none', this.checked)); this.closest('.package-block').querySelector('.pack-sub-duration-col').classList.toggle('d-none', !this.checked);">
                                                    <label class="form-check-label text-muted cursor-pointer" for="is-sub-new">Abonnement</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row g-2 align-items-center mb-2">
                                            <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 85px;">Validité</label>
                                            <div class="col d-flex flex-wrap align-items-center gap-3">
                                                <div class="pack-sub-duration-col d-none d-flex align-items-center gap-2">
                                                    <span class="text-muted">Durée :</span>
                                                    <input type="number" name="duration_days" value="365" min="1" class="form-control form-control-sm text-center px-1" style="width: 60px;">
                                                    <span class="text-muted">jours</span>
                                                </div>
                                                <div class="pack-normal-exp-col d-flex align-items-center gap-3">
                                                    <div class="form-check mb-0">
                                                        <input type="checkbox" id="exp-cb-new" class="form-check-input cursor-pointer mt-1" onchange="document.getElementById('exp-div-new').classList.toggle('d-none', !this.checked); if(!this.checked) document.getElementById('exp-input-new').value = '0';">
                                                        <label class="form-check-label text-muted cursor-pointer" for="exp-cb-new">A une expiration</label>
                                                    </div>
                                                    <div class="d-none d-flex align-items-center gap-2 border-start ps-3" id="exp-div-new">
                                                        <span class="text-muted">Expire dans :</span>
                                                        <input type="number" id="exp-input-new" name="expires_in_days" value="0" min="0" class="form-control form-control-sm text-center px-1" style="width: 60px;">
                                                        <span class="text-muted">jours</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row g-2 align-items-start mt-1">
                                            <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 85px;">Description</label>
                                            <div class="col">
                                                <textarea name="description" placeholder="Description..." class="form-control form-control-sm" rows="2"></textarea>
                                            </div>
                                        </div>
                                        <div class="text-start mt-3">
                                            <button type="submit" class="btn btn-emerald px-4 py-2 fw-medium">Ajouter le pack</button>
                                        </div>
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
                                    <table class="table table-hover align-middle mb-0" style="font-size: 0.8rem;">
                                        <thead>
                                            <tr class="text-muted">
                                                <th class="py-2 px-2 fw-bold">Nom</th>
                                                <th class="py-2 px-2 fw-bold">Email</th>
                                                <th class="py-2 px-2 fw-bold">Téléphone</th>
                                                <th class="py-2 px-2 fw-bold">Solde</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${clients.map(u => `
                                                <tr onclick="app.viewUser(${u.id})" class="cursor-pointer transition-colors">
                                                    <td class="py-1 px-2 fw-medium">
                                                        ${u.firstName} ${u.lastName}
                                                        ${u.role === 'admin' ? '<span class="badge bg-dark ms-2" style="font-size: 0.6rem;">Admin</span>' : ''}
                                                    </td>
                                                    <td class="py-1 px-2 text-muted">${u.email}</td>
                                                    <td class="py-1 px-2 text-muted">${u.phone || '-'}</td>
                                                    <td class="py-1 px-2"><span class="badge badge-emerald">${u.is_subscribed ? 'Abo.' : (parseInt(u.credits_balance) || 0) + ' cours'}</span></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ` : ''}

                        ${!st.isAdminAiLoading && st.adminTab === 'ledger' ? (() => {
                            let ledgerPurchases = (st.adminLedger || []).filter(t => t.type === 'purchase');
                            
                            const parseDate = (dStr) => {
                                const [datePart] = dStr.split(' ');
                                const [d, m, y] = datePart.split('/');
                                return `${y}-${m}-${d}`;
                            };

                            if (st.ledgerFilters.startDate) ledgerPurchases = ledgerPurchases.filter(t => parseDate(t.date) >= st.ledgerFilters.startDate);
                            if (st.ledgerFilters.endDate) ledgerPurchases = ledgerPurchases.filter(t => parseDate(t.date) <= st.ledgerFilters.endDate);

                            const sortCol = st.ledgerSort?.column || 'date';
                            const sortDir = st.ledgerSort?.direction === 'asc' ? 1 : -1;
                            
                            ledgerPurchases.sort((a, b) => {
                                let valA, valB;
                                if (sortCol === 'date') {
                                    const parseSortDate = (dStr) => {
                                        if (!dStr) return '';
                                        const [d, t] = dStr.split(' ');
                                        const [day, mo, yr] = d.split('/');
                                        return `${yr}-${mo}-${day}T${t ? t.padStart(5, '0') : '00:00'}`;
                                    };
                                    valA = parseSortDate(a.date);
                                    valB = parseSortDate(b.date);
                                } else if (sortCol === 'client') {
                                    valA = ((a.firstName || '') + ' ' + (a.lastName || '')).toLowerCase();
                                    valB = ((b.firstName || '') + ' ' + (b.lastName || '')).toLowerCase();
                                } else if (sortCol === 'description') {
                                    valA = (a.description || '').replace(/\s*\(\d+€\)/, '').toLowerCase();
                                    valB = (b.description || '').replace(/\s*\(\d+€\)/, '').toLowerCase();
                                } else if (sortCol === 'amount') {
                                    const matchA = (a.description || '').match(/\((\d+)€\)/); valA = matchA ? parseInt(matchA[1]) : 0;
                                    const matchB = (b.description || '').match(/\((\d+)€\)/); valB = matchB ? parseInt(matchB[1]) : 0;
                                } else if (sortCol === 'achat') {
                                    valA = a.amount >= 999 || (a.amount === 0 && (a.description || '').toLowerCase().includes('abonnement')) ? 'abonnement' : `${a.amount} cours`;
                                    valB = b.amount >= 999 || (b.amount === 0 && (b.description || '').toLowerCase().includes('abonnement')) ? 'abonnement' : `${b.amount} cours`;
                                }
                                if (valA < valB) return -1 * sortDir;
                                if (valA > valB) return 1 * sortDir;
                                return 0;
                            });

                            const limit = st.ledgerPagination.limit;
                            const totalItems = ledgerPurchases.length;
                            const totalPages = limit === 'all' ? 1 : Math.ceil(totalItems / limit);
                            const currentPage = Math.max(1, Math.min(st.ledgerPagination.page, totalPages));

                            let displayedPurchases = ledgerPurchases;
                            if (limit !== 'all') {
                                const startIdx = (currentPage - 1) * limit;
                                displayedPurchases = ledgerPurchases.slice(startIdx, startIdx + limit);
                            }

                            return `
                            <div class="custom-card p-0 overflow-hidden animate-fade-in d-flex flex-column">
                                <div class="p-4 border-bottom bg-light d-flex flex-column gap-3">
                                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                                        <div>
                                            <h2 class="fs-5 fw-medium mb-1">Historique des achats (Livre de recettes)</h2>
                                            <span class="small fw-medium text-muted">${totalItems} encaissement(s) filtré(s)</span>
                                        </div>
                                        <div class="d-flex gap-2">
                                            <button onclick="app.exportLedgerToCSV()" class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2" title="Format comptable standard">CSV</button>
                                            <button onclick="app.exportLedgerToXLSX()" class="btn btn-sm btn-outline-success d-flex align-items-center gap-2" title="Ouvrir avec Excel"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Excel (.xlsx)</button>
                                        </div>
                                    </div>
                                    
                                    <div class="d-flex flex-wrap align-items-center gap-3 pt-2 border-top">
                                        <div class="d-flex align-items-center gap-2 text-nowrap">
                                            <label class="small text-muted mb-0 fw-medium">Du :</label>
                                            <input type="date" value="${st.ledgerFilters.startDate}" oninput="app.handleLedgerFilterChange('startDate', this.value)" class="form-control form-control-sm py-0 px-1 text-muted" style="max-width: 110px; font-size: 0.75rem; height: 26px;">
                                        </div>
                                        <div class="d-flex align-items-center gap-2 text-nowrap">
                                            <label class="small text-muted mb-0 fw-medium">Au :</label>
                                            <input type="date" value="${st.ledgerFilters.endDate}" oninput="app.handleLedgerFilterChange('endDate', this.value)" class="form-control form-control-sm py-0 px-1 text-muted" style="max-width: 110px; font-size: 0.75rem; height: 26px;">
                                        </div>
                                        <div class="d-flex align-items-center gap-2 text-nowrap ms-auto">
                                            <label class="small text-muted mb-0 fw-medium">Afficher :</label>
                                            <select onchange="app.setLedgerLimit(this.value)" class="form-select form-select-sm py-0 ps-2 pe-4 text-muted cursor-pointer" style="width: auto; min-width: 75px; font-size: 0.75rem; height: 26px;">
                                                <option value="10" ${limit === 10 ? 'selected' : ''}>10</option>
                                                <option value="20" ${limit === 20 ? 'selected' : ''}>20</option>
                                                <option value="50" ${limit === 50 ? 'selected' : ''}>50</option>
                                                <option value="100" ${limit === 100 ? 'selected' : ''}>100</option>
                                                <option value="all" ${limit === 'all' ? 'selected' : ''}>Tous</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="table-responsive">
                                    <table class="table table-hover align-middle mb-0" style="font-size: 0.8rem;">
                                        ${(() => {
                                            const renderSortIcon = (col) => {
                                                if (st.ledgerSort?.column === col) {
                                                    return st.ledgerSort.direction === 'asc' ? ' <span class="text-emerald">↑</span>' : ' <span class="text-emerald">↓</span>';
                                                }
                                                return ' <span class="opacity-25">↕</span>';
                                            };
                                            return `
                                        <thead class="text-nowrap" style="user-select: none;">
                                            <tr class="text-muted">
                                                <th class="py-2 px-2 fw-bold position-sticky top-0 border-bottom cursor-pointer hover-bg-light" style="z-index: 10;" onclick="app.handleLedgerSort('date')">Date${renderSortIcon('date')}</th>
                                                <th class="py-2 px-2 fw-bold position-sticky top-0 border-bottom cursor-pointer hover-bg-light" style="z-index: 10;" onclick="app.handleLedgerSort('client')">Client${renderSortIcon('client')}</th>
                                                <th class="py-2 px-2 fw-bold position-sticky top-0 border-bottom cursor-pointer hover-bg-light" style="z-index: 10;" onclick="app.handleLedgerSort('description')">Description${renderSortIcon('description')}</th>
                                                <th class="py-2 px-2 fw-bold position-sticky top-0 border-bottom cursor-pointer hover-bg-light" style="z-index: 10;" onclick="app.handleLedgerSort('achat')">Achat${renderSortIcon('achat')}</th>
                                                <th class="py-2 px-2 fw-bold position-sticky top-0 border-bottom cursor-pointer hover-bg-light" style="z-index: 10;" onclick="app.handleLedgerSort('amount')">Montant HT${renderSortIcon('amount')}</th>
                                                <th class="py-2 px-2 fw-bold position-sticky top-0 border-bottom cursor-pointer hover-bg-light" style="z-index: 10;" onclick="app.handleLedgerSort('amount')">TVA (20%)</th>
                                                <th class="py-2 px-2 fw-bold position-sticky top-0 border-bottom cursor-pointer hover-bg-light" style="z-index: 10;" onclick="app.handleLedgerSort('amount')">Montant TTC</th>
                                            </tr>
                                        </thead>
                                        `;
                                        })()}
                                        <tbody>
                                            ${displayedPurchases.map(t => {
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
                                                    <td class="py-1 px-2 text-muted text-nowrap">${t.date}</td>
                                                    <td class="py-1 px-2 fw-medium"><button class="btn btn-link p-0 text-decoration-none text-emerald text-start" style="font-size: inherit;" onclick="app.viewUser(${t.user_id})">${t.firstName || 'Client'} ${t.lastName || 'Supprimé'}</button></td>
                                                    <td class="py-1 px-2">${descriptionWithoutPrice}</td>
                                                    <td class="py-1 px-2 fw-bold text-success">${productText}</td>
                                                    <td class="py-1 px-2 fw-bold text-muted">${priceHT !== '-' ? priceHT + ' €' : '-'}</td>
                                                    <td class="py-1 px-2 fw-bold text-muted">${tvaAmount !== '-' ? tvaAmount + ' €' : '-'}</td>
                                                    <td class="py-1 px-2 fw-bold">${price !== null ? price.toFixed(2) + ' €' : '-'}</td>
                                                </tr>`;
                                            }).join('')}
                                            ${!displayedPurchases.length ? '<tr><td colspan="7" class="py-3 text-center text-muted">Aucun encaissement trouvé</td></tr>' : ''}
                                        </tbody>
                                    </table>
                                </div>
                                ${totalPages > 1 ? `
                                    <div class="p-2 border-top bg-light d-flex justify-content-between align-items-center">
                                        <span class="text-muted fw-medium" style="font-size: 0.75rem;">Page ${currentPage}/${totalPages}</span>
                                        <div class="d-flex gap-1">
                                            <button onclick="app.setLedgerPage(${currentPage - 1})" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 0.75rem;" ${currentPage === 1 ? 'disabled' : ''}>&lt;</button>
                                            ${Array.from({length: totalPages}, (_, i) => i + 1).map(p => {
                                                if (totalPages > 7) {
                                                    if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) return `<button onclick="app.setLedgerPage(${p})" class="btn btn-sm ${p === currentPage ? 'btn-emerald' : 'btn-outline-secondary'} py-0 px-2" style="font-size: 0.75rem;">${p}</button>`;
                                                    else if (p === currentPage - 2 || p === currentPage + 2) return `<span class="px-1 text-muted align-self-end" style="font-size: 0.75rem;">...</span>`;
                                                    return '';
                                                }
                                                return `<button onclick="app.setLedgerPage(${p})" class="btn btn-sm ${p === currentPage ? 'btn-emerald' : 'btn-outline-secondary'} py-0 px-2" style="font-size: 0.75rem;">${p}</button>`;
                                            }).join('').replace(/(<span.*?<\/span>)+/g, '<span class="px-1 text-muted align-self-end" style="font-size: 0.75rem;">...</span>')}
                                            <button onclick="app.setLedgerPage(${currentPage + 1})" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 0.75rem;" ${currentPage === totalPages ? 'disabled' : ''}>&gt;</button>
                                        </div>
                                    </div>
                                ` : ''}
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
                                            <div class="d-flex flex-column gap-2 overflow-auto pe-3" style="max-height: 300px;">
                                                ${futureBookings.map(b => `
                                                    <div class="d-flex align-items-center justify-content-between p-1 px-2 rounded-3 bg-emerald-light text-emerald-dark small">
                                                        <span>📅 ${new Date(b.date).toLocaleDateString()} à ${b.time} - ${b.title}</span>
                                                        <button onclick="app.adminCancelBookingForUser(${b.class_id}, ${user.id})" class="btn btn-link text-danger p-0" title="Annuler cette réservation">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>
                                                        </button>
                                                    </div>
                                                `).join('')}
                                                ${pastBookings.map(b => `<div class="p-1 px-2 bg-light rounded-3 small text-muted">✔️ ${new Date(b.date).toLocaleDateString()} - ${b.title}</div>`).join('')}
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
                                                    ${(() => {
                                                        if (paymentHistory.length === 0) return '<p class="text-muted small mb-0">Aucun achat effectué.</p>';
                                                        
                                                        let filteredPayments = paymentHistory;
                                                        if (app.state.userPaymentFilters.startDate) filteredPayments = filteredPayments.filter(t => t.date.substring(0, 10) >= app.state.userPaymentFilters.startDate);
                                                        if (app.state.userPaymentFilters.endDate) filteredPayments = filteredPayments.filter(t => t.date.substring(0, 10) <= app.state.userPaymentFilters.endDate);
                                                        
                                                        const limit = app.state.userPaymentPagination.limit;
                                                        const totalItems = filteredPayments.length;
                                                        const totalPages = limit === 'all' ? 1 : Math.ceil(totalItems / limit) || 1;
                                                        const currentPage = Math.max(1, Math.min(app.state.userPaymentPagination.page, totalPages));
                                                        
                                                        let displayedPurchases = filteredPayments;
                                                        if (limit !== 'all') {
                                                            const startIdx = (currentPage - 1) * limit;
                                                            displayedPurchases = filteredPayments.slice(startIdx, startIdx + limit);
                                                        }
                                                        
                                                        return `
                                                        <div class="d-flex flex-wrap gap-1 mb-2 align-items-center bg-light p-1 px-2 rounded-2 border">
                                                            <input type="date" value="${app.state.userPaymentFilters.startDate}" oninput="app.handleUserPaymentFilterChange('startDate', this.value)" class="form-control form-control-sm py-0 px-1 text-muted" style="max-width: 100px; font-size: 0.7rem; height: 24px;">
                                                            <span class="small text-muted">-</span>
                                                            <input type="date" value="${app.state.userPaymentFilters.endDate}" oninput="app.handleUserPaymentFilterChange('endDate', this.value)" class="form-control form-control-sm py-0 px-1 text-muted" style="max-width: 100px; font-size: 0.7rem; height: 24px;">
                                                            <select onchange="app.setUserPaymentLimit(this.value)" class="form-select form-select-sm py-0 ps-1 pe-4 ms-auto text-muted cursor-pointer" style="width: auto; min-width: 75px; font-size: 0.7rem; height: 24px;">
                                                                <option value="10" ${limit === 10 ? 'selected' : ''}>10/p</option>
                                                                <option value="20" ${limit === 20 ? 'selected' : ''}>20/p</option>
                                                                <option value="50" ${limit === 50 ? 'selected' : ''}>50/p</option>
                                                                    <option value="all" ${limit === 'all' ? 'selected' : ''}>Tous</option>
                                                                </select>
                                                        </div>
                                                        ${displayedPurchases.length === 0 ? '<p class="text-muted small mb-0">Aucun résultat pour ces dates.</p>' : `
                                                        <div class="d-flex flex-column gap-1 overflow-auto pe-3" style="max-height: 250px;">
                                                            ${displayedPurchases.map(t => {
                                                            const isSub = t.amount >= 999 || t.description.toLowerCase().includes('abonnement');
                                                            const priceMatch = t.description.match(/\((\d+)€\)/);
                                                            const price = priceMatch ? parseInt(priceMatch[1]) : null;
                                                            let pkg = null;
                                                            if (isSub) {
                                                                pkg = st.creditPackages.find(p => p.is_subscription && (price === null || p.price === price)) || st.creditPackages.find(p => p.is_subscription);
                                                            } else {
                                                                pkg = st.creditPackages.find(p => p.credits === t.amount && (price === null || p.price === price)) || st.creditPackages.find(p => p.credits === t.amount && !p.is_subscription);
                                                            }
                                                            const subtitleText = pkg && pkg.subtitle ? pkg.subtitle : '';
                                                            const descWithoutPrice = t.description.replace(/\s*\(\d+€\)/, '');
                                                            return `
                                                            <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
                                                                <div style="font-size: 0.75rem; line-height: 1.2;">
                                                                    <div class="d-flex align-items-baseline gap-2">
                                                                        <span class="fw-medium">${descWithoutPrice}</span>
                                                                        ${subtitleText ? `<span class="text-emerald" style="font-size: 0.65rem;">${subtitleText}</span>` : ''}
                                                                    </div>
                                                                    <div class="text-muted mt-1">${new Date(t.date).toLocaleString('fr-FR', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}</div>
                                                                </div>
                                                                <div class="d-flex align-items-center gap-3">
                                                                    <div class="small fw-bold text-success">${isSub ? 'Abonnement' : '+' + t.amount + ' cours'}</div>
                                                                    <button onclick="app.downloadInvoice(${JSON.stringify(t).replace(/"/g, '&quot;')}, app.state.selectedUserDetails.user)" class="btn btn-sm btn-link text-muted p-0" title="Télécharger la facture">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        `}).join('')}
                                                        </div>
                                                        ${totalPages > 1 ? `
                                                            <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                                                                <span class="small text-muted" style="font-size: 0.7rem;">Page ${currentPage}/${totalPages}</span>
                                                                <div class="d-flex gap-1">
                                                                    <button onclick="app.setUserPaymentPage(${currentPage - 1})" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 0.7rem;" ${currentPage === 1 ? 'disabled' : ''}>&lt;</button>
                                                                    <button onclick="app.setUserPaymentPage(${currentPage + 1})" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 0.7rem;" ${currentPage === totalPages ? 'disabled' : ''}>&gt;</button>
                                                                </div>
                                                            </div>
                                                        ` : ''}
                                                        `}
                                                        `;
                                                    })()}
                                                </div>
                                                <div class="pt-3 border-top">
                                                    <h4 class="small fw-semibold text-muted mb-2">Mouvements de cours</h4>
                                                    ${(() => {
                                                        if (creditHistory.length === 0) return '<p class="text-muted small mb-0">Aucun mouvement.</p>';
                                                        
                                                        let filteredCredits = creditHistory;
                                                        if (app.state.userCreditFilters.startDate) filteredCredits = filteredCredits.filter(t => t.date.substring(0, 10) >= app.state.userCreditFilters.startDate);
                                                        if (app.state.userCreditFilters.endDate) filteredCredits = filteredCredits.filter(t => t.date.substring(0, 10) <= app.state.userCreditFilters.endDate);
                                                        
                                                        const limit = app.state.userCreditPagination.limit;
                                                        const totalItems = filteredCredits.length;
                                                        const totalPages = limit === 'all' ? 1 : Math.ceil(totalItems / limit) || 1;
                                                        const currentPage = Math.max(1, Math.min(app.state.userCreditPagination.page, totalPages));
                                                        
                                                        let displayedCredits = filteredCredits;
                                                        if (limit !== 'all') {
                                                            const startIdx = (currentPage - 1) * limit;
                                                            displayedCredits = filteredCredits.slice(startIdx, startIdx + limit);
                                                        }
                                                        
                                                        return `
                                                        <div class="d-flex flex-wrap gap-1 mb-2 align-items-center bg-light p-1 px-2 rounded-2 border">
                                                            <input type="date" value="${app.state.userCreditFilters.startDate}" oninput="app.handleUserCreditFilterChange('startDate', this.value)" class="form-control form-control-sm py-0 px-1 text-muted" style="max-width: 100px; font-size: 0.7rem; height: 24px;">
                                                            <span class="small text-muted">-</span>
                                                            <input type="date" value="${app.state.userCreditFilters.endDate}" oninput="app.handleUserCreditFilterChange('endDate', this.value)" class="form-control form-control-sm py-0 px-1 text-muted" style="max-width: 100px; font-size: 0.7rem; height: 24px;">
                                                            <select onchange="app.setUserCreditLimit(this.value)" class="form-select form-select-sm py-0 ps-1 pe-4 ms-auto text-muted cursor-pointer" style="width: auto; min-width: 75px; font-size: 0.7rem; height: 24px;">
                                                                <option value="10" ${limit === 10 ? 'selected' : ''}>10/p</option>
                                                                <option value="20" ${limit === 20 ? 'selected' : ''}>20/p</option>
                                                                <option value="50" ${limit === 50 ? 'selected' : ''}>50/p</option>
                                                                <option value="all" ${limit === 'all' ? 'selected' : ''}>Tous</option>
                                                            </select>
                                                        </div>
                                                        ${displayedCredits.length === 0 ? '<p class="text-muted small mb-0">Aucun résultat pour ces dates.</p>' : `
                                                        <div class="d-flex flex-column gap-1 overflow-auto pe-3" style="max-height: 250px;">
                                                            ${displayedCredits.map(t => {
                                                            let desc = t.description;
                                                            if (t.type === 'booking' && desc.startsWith('Réservation : ')) desc = `Réservation : ${desc.substring(14)}`;
                                                            else if (t.type === 'refund' && desc.startsWith('Annulation : ')) desc = `Annulation : ${desc.substring(13)}`;
                                                            return `
                                                            <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
                                                                <div style="font-size: 0.75rem; line-height: 1.2;">
                                                                    <div class="fw-medium">${desc}</div>
                                                                    <div class="text-muted mt-1">${new Date(t.date).toLocaleString('fr-FR', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}</div>
                                                                </div>
                                                                <div class="small fw-bold ${t.amount > 0 ? 'text-success' : 'text-muted'}">${t.amount >= 999 ? 'Abonnement' : (t.amount > 0 ? '+' : '') + t.amount}</div>
                                                            </div>`;
                                                        }).join('')}
                                                        </div>
                                                        ${totalPages > 1 ? `
                                                            <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                                                                <span class="small text-muted" style="font-size: 0.7rem;">Page ${currentPage}/${totalPages}</span>
                                                                <div class="d-flex gap-1">
                                                                    <button onclick="app.setUserCreditPage(${currentPage - 1})" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 0.7rem;" ${currentPage === 1 ? 'disabled' : ''}>&lt;</button>
                                                                    <button onclick="app.setUserCreditPage(${currentPage + 1})" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 0.7rem;" ${currentPage === totalPages ? 'disabled' : ''}>&gt;</button>
                                                                </div>
                                                            </div>
                                                        ` : ''}
                                                        `}
                                                        `;
                                                    })()}
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
                                        <div class="d-flex flex-column gap-2 overflow-auto pe-3" style="max-height: 400px;">
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
                            <div class="custom-card p-4 p-md-5 mx-auto animate-fade-in" style="max-width: 650px;">
                                <h2 class="fs-5 fw-medium mb-4">Paramètres du Studio</h2>
                                <form onsubmit="app.updateStudioSettings(event)">
                                    <div class="row mb-2 align-items-center">
                                        <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 140px;">Adresse</label>
                                        <div class="col">
                                            <input type="text" id="admin-studio-address" required class="form-control form-control-sm" value="${st.studioAddress}">
                                        </div>
                                    </div>
                                    <div class="row mb-2 align-items-center">
                                        <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 140px;">Téléphone</label>
                                        <div class="col">
                                            <input type="tel" id="admin-studio-phone" required class="form-control form-control-sm" value="${st.studioPhone}">
                                        </div>
                                    </div>
                                    <div class="row mb-2 align-items-center">
                                        <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 140px;">Email</label>
                                        <div class="col">
                                            <input type="email" id="admin-studio-email" required class="form-control form-control-sm" value="${st.studioEmail}">
                                        </div>
                                    </div>
                                    <div class="row mb-2 align-items-center">
                                        <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 140px;">Numéro de SIRET</label>
                                        <div class="col">
                                            <input type="text" id="admin-studio-siret" class="form-control form-control-sm" value="${st.studioSiret || ''}">
                                        </div>
                                    </div>
                                    <div class="row mb-2 align-items-center">
                                        <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 140px;">N° de TVA</label>
                                        <div class="col">
                                            <input type="text" id="admin-studio-tva" class="form-control form-control-sm" value="${st.studioTva || ''}">
                                        </div>
                                    </div>
                                    <div class="row mb-3 align-items-center">
                                        <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 140px;">Moteur IA</label>
                                        <div class="col">
                                            <select id="admin-ai-provider" class="form-select form-select-sm">
                                                <option value="gemini" ${st.aiProvider === 'gemini' ? 'selected' : ''}>Google Gemini 2.0 (Gratuit)</option>
                                                <option value="mistral" ${st.aiProvider === 'mistral' ? 'selected' : ''}>Mistral AI (Français)</option>
                                                <option value="groq" ${st.aiProvider === 'groq' ? 'selected' : ''}>Groq (Ultra-rapide)</option>
                                                <option value="openai" ${st.aiProvider === 'openai' ? 'selected' : ''}>OpenAI (GPT-4o mini)</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div class="pt-3 border-top mt-2">
                                        <div class="row mb-2 align-items-center">
                                            <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 140px;">Lien Instagram</label>
                                            <div class="col">
                                                <div class="position-relative">
                                                    <div class="position-absolute top-50 start-0 translate-middle-y ps-2 text-muted z-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                                                    </div>
                                                    <input type="url" id="admin-studio-instagram" class="form-control form-control-sm" style="padding-left: 2rem !important;" value="${st.studioInstagram}" placeholder="https://instagram.com/...">
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="row mb-2 align-items-center">
                                            <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 140px;">Lien Facebook</label>
                                            <div class="col">
                                                <div class="position-relative">
                                                    <div class="position-absolute top-50 start-0 translate-middle-y ps-2 text-muted z-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                                                    </div>
                                                    <input type="url" id="admin-studio-facebook" class="form-control form-control-sm" style="padding-left: 2rem !important;" value="${st.studioFacebook}" placeholder="https://facebook.com/...">
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="row mb-2 align-items-center">
                                            <label class="col-auto col-form-label col-form-label-sm fw-medium text-muted pe-2" style="width: 140px;">Lien TikTok</label>
                                            <div class="col">
                                                <div class="position-relative">
                                                    <div class="position-absolute top-50 start-0 translate-middle-y ps-2 text-muted z-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                                                    </div>
                                                    <input type="url" id="admin-studio-tiktok" class="form-control form-control-sm" style="padding-left: 2rem !important;" value="${st.studioTiktok}" placeholder="https://tiktok.com/...">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="text-end mt-4">
                                        <button type="submit" class="btn btn-emerald py-2 px-4 fw-medium">
                                            Enregistrer
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>`;
};