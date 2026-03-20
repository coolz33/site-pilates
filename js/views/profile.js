
/**
 * @file profile.js
 * @description Vue du profil utilisateur (informations, réservations, historique financier).
 */

/**
 * Génère la vue complète du profil de l'utilisateur connecté.
 * Gère l'affichage par onglets (Infos, Séances, Paiements).
 * @param {PilatesApp} app - L'instance principale de l'application.
 * @returns {string} Le code HTML structuré avec Bootstrap 5.
 */
export const profileView = (app) => {
    const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>`;
    const eyeSlashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z"/><path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z"/></svg>`;

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

    const calculatedBalance = u.activeBatches ? u.activeBatches.reduce((sum, b) => sum + b.credits, 0) : (parseInt(u.credits_balance) || 0);

    // Navigation par onglets
    const navTabs = `
        <div class="d-flex border-bottom mb-4 overflow-auto scrollbar-hide">
            <button onclick="app.setProfileTab('infos')" 
                class="btn btn-link text-decoration-none px-4 py-3 small whitespace-nowrap ${activeTab === 'infos' ? 'tab-active' : 'tab-inactive'}">
                Mon Profil
            </button>
            <button onclick="app.setProfileTab('sessions')" 
                class="btn btn-link text-decoration-none px-4 py-3 small whitespace-nowrap ${activeTab === 'sessions' ? 'tab-active' : 'tab-inactive'}">
                Mes Séances
            </button>
            <button onclick="app.setProfileTab('payments')" 
                class="btn btn-link text-decoration-none px-4 py-3 small whitespace-nowrap ${activeTab === 'payments' ? 'tab-active' : 'tab-inactive'}">
                Paiements & Historique
            </button>
        </div>
    `;

    let tabContent = '';

    if (activeTab === 'infos') {
        tabContent = `
            <div class="row g-4">
                <div class="col-12 col-lg-8">
                    <div class="custom-card p-4">
                    <form onsubmit="app.updateProfile(event)" style="max-width: 600px;">
                        <div class="row mb-2 align-items-center">
                            <label for="prof-firstname" class="col-sm-3 col-form-label col-form-label-sm fw-medium text-muted">Prénom</label>
                            <div class="col-sm-9"><input type="text" id="prof-firstname" value="${u.firstName}" class="form-control form-control-sm"></div>
                        </div>
                        <div class="row mb-2 align-items-center">
                            <label for="prof-lastname" class="col-sm-3 col-form-label col-form-label-sm fw-medium text-muted">Nom</label>
                            <div class="col-sm-9"><input type="text" id="prof-lastname" value="${u.lastName}" class="form-control form-control-sm"></div>
                        </div>
                        <div class="row mb-2 align-items-center">
                            <label for="prof-email" class="col-sm-3 col-form-label col-form-label-sm fw-medium text-muted">Email</label>
                            <div class="col-sm-9"><input type="email" id="prof-email" value="${u.email}" class="form-control form-control-sm"></div>
                        </div>
                        <div class="row mb-2 align-items-center">
                            <label for="prof-password" class="col-sm-3 col-form-label col-form-label-sm fw-medium text-muted">Nouveau mdp</label>
                            <div class="col-sm-9 position-relative">
                                <input type="${app.state.visiblePasswords.includes('prof-password') ? 'text' : 'password'}" id="prof-password" class="form-control form-control-sm pr-5" placeholder="Laisser vide pour ne pas changer">
                                <button type="button" onclick="app.togglePasswordVisibility('prof-password')" class="btn btn-link text-muted position-absolute end-0 top-50 translate-middle-y p-1 me-1 text-decoration-none">
                                    ${app.state.visiblePasswords.includes('prof-password') ? eyeSlashIcon : eyeIcon}
                                </button>
                            </div>
                        </div>
                        <div class="row mb-2 align-items-center">
                            <label for="prof-confirm-password" class="col-sm-3 col-form-label col-form-label-sm fw-medium text-muted">Confirmer mdp</label>
                            <div class="col-sm-9 position-relative">
                                <input type="${app.state.visiblePasswords.includes('prof-confirm-password') ? 'text' : 'password'}" id="prof-confirm-password" class="form-control form-control-sm pr-5">
                                <button type="button" onclick="app.togglePasswordVisibility('prof-confirm-password')" class="btn btn-link text-muted position-absolute end-0 top-50 translate-middle-y p-1 me-1 text-decoration-none">
                                    ${app.state.visiblePasswords.includes('prof-confirm-password') ? eyeSlashIcon : eyeIcon}
                                </button>
                            </div>
                        </div>
                        <div class="row mb-2 align-items-center">
                            <label for="prof-phone" class="col-sm-3 col-form-label col-form-label-sm fw-medium text-muted">Téléphone</label>
                            <div class="col-sm-9"><input type="text" id="prof-phone" value="${u.phone || ''}" class="form-control form-control-sm"></div>
                        </div>
                        <div class="row mb-2 align-items-center">
                            <label for="prof-address" class="col-sm-3 col-form-label col-form-label-sm fw-medium text-muted">Adresse</label>
                            <div class="col-sm-9"><input type="text" id="prof-address" value="${u.address || ''}" class="form-control form-control-sm"></div>
                        </div>
                        <div class="row mb-2 align-items-center">
                            <label for="prof-zipcode" class="col-sm-3 col-form-label col-form-label-sm fw-medium text-muted">Code Postal</label>
                            <div class="col-sm-9"><input type="text" id="prof-zipcode" value="${u.zipCode || ''}" class="form-control form-control-sm"></div>
                        </div>
                        <div class="row mb-3 align-items-center">
                            <label for="prof-city" class="col-sm-3 col-form-label col-form-label-sm fw-medium text-muted">Ville</label>
                            <div class="col-sm-9"><input type="text" id="prof-city" value="${u.city || ''}" class="form-control form-control-sm"></div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-sm-9 offset-sm-3">
                                <div class="form-check">
                                    <input type="checkbox" id="prof-newsletter" ${u.newsletter_subscribed ? 'checked' : ''} class="form-check-input mt-1">
                                    <label for="prof-newsletter" class="form-check-label small text-muted cursor-pointer">
                                        Je souhaite recevoir les actualités.
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="pt-3 mt-2 border-top">
                            <div class="d-flex align-items-center justify-content-between mb-1">
                                <div class="d-flex align-items-center gap-2 text-danger">
                                    <span style="font-size: 0.85rem;">⚠️</span>
                                    <h3 class="small fw-bold text-uppercase tracking-wider mb-0" style="font-size: 0.75rem;">Action irréversible</h3>
                                </div>
                                <button type="button" onclick="app.deleteAccount(${u.id})" class="btn btn-link text-danger p-0 small fw-bold text-decoration-none" style="font-size: 0.75rem;">Supprimer le compte</button>
                            </div>
                            <p class="small text-muted mb-0" style="font-size: 0.75rem;">Perte de tous vos cours.</p>
                        </div>
                        <button type="submit" class="btn btn-sm w-100 btn-emerald py-2 mt-3 fw-medium">Enregistrer les modifications</button>
                    </form>
                    </div>
                </div>
                <div class="col-12 col-lg-4 d-flex flex-column gap-4">
                    <div class="bg-emerald-strong p-4 shadow-sm" style="border-radius: 1.5rem;">
                        <div class="small opacity-75 mb-1">Mon solde actuel</div>
                        <div class="display-5 fw-light mb-0">${u.is_subscribed ? `Abonné` : `${calculatedBalance} <span class="fs-5">cours</span>`}</div>
                        ${u.is_subscribed && calculatedBalance > 0 ? `<div class="fs-6 fw-normal text-white-50 mt-1">+ ${calculatedBalance} cours supplémentaires</div>` : ''}
                        ${(u.activeBatches && u.activeBatches.length > 0) || u.is_subscribed ? `
                            <div class="mt-4 pt-3 border-top border-light border-opacity-25 d-flex flex-column gap-2">
                                <div class="small fw-medium mb-1">Détail des expirations :</div>
                                ${(() => {
                                    const aggregatedBatches = {};
                                    
                                    if (u.is_subscribed) {
                                        aggregatedBatches['sub'] = { isSub: true, expires_at: u.subscription_expires_at };
                                    }

                                    if (u.activeBatches) {
                                        u.activeBatches.forEach(b => {
                                            const key = b.expires_at ? new Date(b.expires_at).toLocaleDateString('fr-FR') : 'none';
                                            if (!aggregatedBatches[key]) {
                                                aggregatedBatches[key] = { credits: 0, expires_at: b.expires_at };
                                            }
                                            aggregatedBatches[key].credits += b.credits;
                                        });
                                    }
                                    
                                    return Object.values(aggregatedBatches).map(b => {
                                        let expText = "Pas d'expiration";
                                        if (b.expires_at) {
                                            const expDate = new Date(b.expires_at);
                                            const daysLeft = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
                                            if (daysLeft <= 7) expText = `<span class="text-warning fw-bold">Expire dans ${daysLeft} jour(s) !</span>`;
                                            else expText = `Expire le ${expDate.toLocaleDateString('fr-FR')}`;
                                        }

                                        let labelHTML = b.isSub ? `<span><span class="fw-bold text-white">Abonnement</span></span>` : `<span><span class="fw-bold text-white">${b.credits}</span> cours</span>`;

                                        return `
                                        <div class="d-flex justify-content-between align-items-center small text-white-50">
                                            ${labelHTML}
                                            <span>${expText}</span>
                                        </div>`;
                                    }).join('');
                                })()}
                            </div>
                        ` : ''}
                        
                        ${u.is_subscribed ? `
                            <div class="mt-3 pt-3 border-top border-light border-opacity-25">
                                <div class="small fw-medium mb-1">Votre semaine en cours :</div>
                                <div class="d-flex align-items-center gap-2 small">
                                    ${u.hasUsedWeeklyBooking 
                                        ? '<span class="text-warning">🔴 Limite atteinte (1/1)</span>' 
                                        : '<span class="text-white" style="color: var(--emerald-200) !important;">🟢 Réservation disponible</span>'}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="custom-card p-4 text-center">
                        <p class="text-muted small mb-3">Besoin de recharger ?</p>
                        <button onclick="app.navigate('tarifs')" class="btn btn-outline-success rounded-pill w-100 fw-medium">
                            Voir les tarifs
                        </button>
                    </div>
                </div>
            </div>`;
    } else if (activeTab === 'sessions') {
        tabContent = `
            <div class="row g-4">
                <div class="col-md-6">
                  <div class="custom-card p-4">
                    <h3 class="fs-5 fw-medium mb-4">Prochaines séances</h3>
                    ${futureBookings.length === 0 ? '<p class="text-muted small">Aucune séance prévue.</p>' : 
                    `<div class="d-flex flex-column gap-3">
                        ${futureBookings.map(c => {
                            const classDate = new Date(c.date + 'T' + c.time);
                            const hoursDiff = (classDate - now) / 1000 / 60 / 60;
                            const canCancel = hoursDiff >= delayHours;
                            return `
                            <div class="profile-session-card p-3">
                                <div class="fw-bold text-emerald">${c.title}</div>
                                <div class="small text-muted">${new Date(c.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${c.time}</div>
                                ${canCancel ? 
                                    `<div class="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                                        <span class="text-muted text-uppercase" style="font-size:0.65rem; letter-spacing:0.05em;">Annulable</span>
                                        <button onclick="app.deleteClass(${c.id})" class="btn btn-link text-danger p-0 text-decoration-none small fw-semibold">Annuler</button>
                                    </div>` : 
                                    `<div class="mt-3 pt-3 border-top text-warning fw-bold text-uppercase" style="font-size:0.65rem; letter-spacing:0.05em;">Délai d'annulation dépassé</div>`
                                }
                            </div>`;
                        }).join('')}
                    </div>`}
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="custom-card p-4">
                    <h3 class="fs-5 fw-medium mb-4">Séances passées</h3>
                    ${pastBookings.length === 0 ? '<p class="text-muted small">Aucun historique.</p>' : 
                    `<div class="d-flex flex-column gap-2 overflow-auto scrollbar-hide pr-2" style="max-height: 500px;">
                        ${pastBookings.map(c => `
                            <div class="p-2 border rounded-3 opacity-75 d-flex justify-content-between align-items-center bg-light">
                                <div>
                                    <div class="small fw-medium">${c.title}</div>
                                    <div class="text-muted" style="font-size:0.75rem;">${new Date(c.date).toLocaleDateString('fr-FR')}</div>
                                </div>
                                <span class="text-muted fw-bold text-uppercase" style="font-size:0.65rem;">Effectué</span>
                            </div>
                        `).join('')}
                    </div>`}
                  </div>
                </div>
            </div>`;
    } else if (activeTab === 'payments') {
        tabContent = `
            <div class="row g-4">
                <div class="col-md-6">
                  <div class="custom-card p-4">
                    <h3 class="fs-5 fw-medium mb-4">Historique des achats</h3>
                    ${paymentHistory.length === 0 ? '<p class="text-muted small">Aucun achat effectué.</p>' : 
                    `<div class="d-flex flex-column gap-2">
                        ${paymentHistory.map(t => `
                            <div class="d-flex justify-content-between align-items-center p-2 border-bottom hover-bg-light transition-colors">
                                <div>
                                    <div class="small fw-medium">${t.description}</div>
                                    <div class="text-muted" style="font-size:0.75rem;">${new Date(t.date).toLocaleDateString('fr-FR')}</div>
                                </div>
                                <div class="fw-bold text-success">+${t.amount} cours</div>
                            </div>
                        `).join('')}
                    </div>`}
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="custom-card p-4">
                    <h3 class="fs-5 fw-medium mb-4">Utilisation des cours</h3>
                    ${creditHistory.length === 0 ? '<p class="text-muted small">Aucun mouvement.</p>' : 
                    `<div class="d-flex flex-column gap-1 overflow-auto scrollbar-hide pr-2" style="max-height: 500px;">
                        ${creditHistory.map(t => {
                            let descriptionText = t.description;
                            if (t.type === 'booking' && t.description.startsWith('Réservation : ')) {
                                descriptionText = `Réservation du cours : ${t.description.substring('Réservation : '.length)}`;
                            } else if (t.type === 'refund' && t.description.startsWith('Annulation : ')) {
                                descriptionText = `Annulation du cours : ${t.description.substring('Annulation : '.length)}`;
                            } else if (t.type === 'adjustment') {
                                descriptionText = `Ajustement : ${t.description}`;
                            }
                            return `
                                <div class="d-flex justify-content-between align-items-center p-2 rounded-3 hover-bg-light transition-colors">
                                    <div>
                                        <div class="small fw-medium">${descriptionText}</div>
                                        <div class="text-muted" style="font-size:0.75rem;">${new Date(t.date).toLocaleString('fr-FR', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                    <div class="fw-bold ${t.amount > 0 ? 'text-success' : 'text-muted'}">${t.amount > 0 ? '+' : ''}${t.amount}</div>
                                </div>`;
                        }).join('')}
                    </div>`}
                  </div>
                </div>
            </div>`;
    }

    return `
        <div class="pt-4 pb-5 animate-fade-in flex-grow-1">
            <div class="container" style="max-width: 1200px;">
                <div class="mb-4">
                    <h1 class="fs-2 fw-light mb-0">Mon Profil</h1>
                </div>

                ${navTabs}

                <div class="animate-fade-in">
                    ${tabContent}
                </div>
            </div>
        </div>`;
};
