import { icons } from '../icons.js';
import { generatePaginationHtml, generateLimitSelectorHtml } from '../utils.js';

export const renderLedgerTab = (app, st) => {
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

    const renderSortIcon = (col) => {
        if (st.ledgerSort?.column === col) {
            return st.ledgerSort.direction === 'asc' ? ' <span class="text-emerald">↑</span>' : ' <span class="text-emerald">↓</span>';
        }
        return ' <span class="opacity-25">↕</span>';
    };

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
                    ${generateLimitSelectorHtml(limit, 'app.setLedgerLimit')}
                </div>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0" style="font-size: 0.8rem;">
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
        ${generatePaginationHtml(currentPage, totalPages, 'app.setLedgerPage')}
    </div>
    `;
};

export const renderUserDetailsTab = (app, st) => {
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

    const renderPaymentHistory = () => {
        if (paymentHistory.length === 0) return '<p class="text-muted small mb-0">Aucun achat effectué.</p>';
        
        let filteredPayments = paymentHistory;
        if (st.userPaymentFilters.startDate) filteredPayments = filteredPayments.filter(t => t.date.substring(0, 10) >= st.userPaymentFilters.startDate);
        if (st.userPaymentFilters.endDate) filteredPayments = filteredPayments.filter(t => t.date.substring(0, 10) <= st.userPaymentFilters.endDate);
        
        const limit = st.userPaymentPagination.limit;
        const totalItems = filteredPayments.length;
        const totalPages = limit === 'all' ? 1 : Math.ceil(totalItems / limit) || 1;
        const currentPage = Math.max(1, Math.min(st.userPaymentPagination.page, totalPages));
        
        let displayedPurchases = filteredPayments;
        if (limit !== 'all') {
            const startIdx = (currentPage - 1) * limit;
            displayedPurchases = filteredPayments.slice(startIdx, startIdx + limit);
        }
        
        return `
        <div class="d-flex flex-wrap gap-1 mb-2 align-items-center bg-light p-1 px-2 rounded-2 border">
            <input type="date" value="${st.userPaymentFilters.startDate}" oninput="app.handleUserPaymentFilterChange('startDate', this.value)" class="form-control form-control-sm py-0 px-1 text-muted" style="max-width: 100px; font-size: 0.7rem; height: 24px;">
            <span class="small text-muted">-</span>
            <input type="date" value="${st.userPaymentFilters.endDate}" oninput="app.handleUserPaymentFilterChange('endDate', this.value)" class="form-control form-control-sm py-0 px-1 text-muted" style="max-width: 100px; font-size: 0.7rem; height: 24px;">
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
                    <button onclick='app.downloadInvoice(${JSON.stringify(t)}, app.state.selectedUserDetails.user)' class="btn btn-sm btn-link text-muted p-0" title="Télécharger la facture">
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
    };

    const renderCreditHistory = () => {
        if (creditHistory.length === 0) return '<p class="text-muted small mb-0">Aucun mouvement.</p>';
        
        let filteredCredits = creditHistory;
        if (st.userCreditFilters.startDate) filteredCredits = filteredCredits.filter(t => t.date.substring(0, 10) >= st.userCreditFilters.startDate);
        if (st.userCreditFilters.endDate) filteredCredits = filteredCredits.filter(t => t.date.substring(0, 10) <= st.userCreditFilters.endDate);
        
        const limit = st.userCreditPagination.limit;
        const totalItems = filteredCredits.length;
        const totalPages = limit === 'all' ? 1 : Math.ceil(totalItems / limit) || 1;
        const currentPage = Math.max(1, Math.min(st.userCreditPagination.page, totalPages));
        
        let displayedCredits = filteredCredits;
        if (limit !== 'all') {
            const startIdx = (currentPage - 1) * limit;
            displayedCredits = filteredCredits.slice(startIdx, startIdx + limit);
        }
        
        return `
        <div class="d-flex flex-wrap gap-1 mb-2 align-items-center bg-light p-1 px-2 rounded-2 border">
            <input type="date" value="${st.userCreditFilters.startDate}" oninput="app.handleUserCreditFilterChange('startDate', this.value)" class="form-control form-control-sm py-0 px-1 text-muted" style="max-width: 100px; font-size: 0.7rem; height: 24px;">
            <span class="small text-muted">-</span>
            <input type="date" value="${st.userCreditFilters.endDate}" oninput="app.handleUserCreditFilterChange('endDate', this.value)" class="form-control form-control-sm py-0 px-1 text-muted" style="max-width: 100px; font-size: 0.7rem; height: 24px;">
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
    };

    const renderActiveBatches = () => {
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
                    <button type="button" onclick='app.promptRemoveSpecificCredits(${user.id}, ${b.credits}, ${idsJson})' class="btn btn-sm btn-outline-secondary py-0 px-2 fw-medium" style="font-size:0.75rem;">Retirer...</button>
                    <button type="button" onclick='app.removeSpecificCredits(${user.id}, ${b.credits}, ${idsJson})' class="btn btn-sm btn-outline-danger py-0 px-2" title="Supprimer tout ce lot">${icons.trash}</button>
                </div>
            </div>`;
        }).join('');
    };

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
                            <button onclick="app.toggleSubscription(event, ${user.id}, ${user.is_subscribed})" class="btn btn-sm ${user.is_subscribed ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'} rounded-circle d-flex align-items-center justify-content-center p-0" style="width: 32px; height: 32px; transition: all 0.2s;">
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
                            ${renderActiveBatches()}
                        </div>
                    ` : '<p class="small text-muted mb-0">Aucun cours disponible.</p>'}
                </div>

                <form onsubmit="app.adjustUserCredits(event, ${user.id})" class="p-3 bg-light border rounded-3 mt-3">
                    <div class="d-flex flex-column gap-3">
                        <div class="d-flex flex-wrap align-items-center gap-3">
                            <div style="min-width: 150px;">
                                <label class="fw-medium small mb-1 d-block">Type d'ajout :</label>
                                <select name="transactionType" class="form-select form-select-sm" onchange="const form = this.closest('form'); const isPurchase = this.value === 'purchase'; form.querySelector('.payment-details').classList.toggle('d-none', !isPurchase); if(isPurchase) { form.querySelector('[name=price]').required = true; } else { form.querySelector('[name=price]').required = false; }">
                                    <option value="adjustment">🎁 Cadeau / Manuel</option>
                                    <option value="purchase">💰 Paiement (Hors Stripe)</option>
                                </select>
                            </div>

                            <div class="payment-details d-none d-flex flex-wrap align-items-center gap-3">
                                <div>
                                    <label class="fw-medium small mb-1 d-block">Moyen :</label>
                                    <select name="paymentMethod" class="form-select form-select-sm">
                                        <option value="Espèces">Espèces</option>
                                        <option value="Chèque">Chèque</option>
                                        <option value="Virement">Virement</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="fw-medium small mb-1 d-block">Prix payé (€) :</label>
                                    <input type="number" name="price" placeholder="Ex: 150" class="form-control form-control-sm text-center" style="width: 80px;">
                                </div>
                            </div>
                        </div>

                        <div class="d-flex flex-wrap align-items-center gap-3 pt-2 border-top">
                            <div>
                                <label class="fw-medium small mb-1 d-block">Quantité :</label>
                                <input type="number" name="amount" placeholder="Qté" required min="1" class="form-control form-control-sm text-center" style="width: 60px;">
                            </div>
                            
                            <div class="form-check mb-0 mt-3 d-flex align-items-center gap-2">
                                <input type="checkbox" id="admin-exp-cb" class="form-check-input mt-0 cursor-pointer" onchange="document.getElementById('admin-exp-div').classList.toggle('d-none', !this.checked); if(!this.checked) document.getElementById('admin-exp-input').value = '0';">
                                <label class="form-check-label small text-muted cursor-pointer text-nowrap" style="padding-top: 2px;" for="admin-exp-cb">A une expiration ?</label>
                            </div>
                            <div class="d-none d-flex align-items-center gap-2 mt-3" id="admin-exp-div">
                                <label class="small text-muted mb-0">Expire dans :</label>
                                <input type="number" id="admin-exp-input" name="expires_in_value" value="0" min="0" class="form-control form-control-sm text-center" style="width: 70px;">
                                <select name="expires_in_unit" class="form-select form-select-sm text-muted small" style="width: auto; padding-right: 2rem; cursor: pointer;">
                                    <option value="days">jours</option>
                                    <option value="months">mois</option>
                                    <option value="years">années</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-emerald btn-sm ms-auto px-4 mt-3">Ajouter les cours</button>
                        </div>
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
                                <button onclick="app.adminCancelBookingForUser(event, ${b.class_id}, ${user.id})" class="btn btn-link text-danger p-0" title="Annuler cette réservation">
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
                            ${renderPaymentHistory()}
                        </div>
                        <div class="pt-3 border-top">
                            <h4 class="small fw-semibold text-muted mb-2">Mouvements de cours</h4>
                            ${renderCreditHistory()}
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
};

export const renderTemplatesTab = (app, st) => {
    return `
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
    `;
};

export const renderUsersTab = (app, st, clients) => {
    return `
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
    `;
};
