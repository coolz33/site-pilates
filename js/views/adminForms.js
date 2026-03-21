export const renderAddClassForm = (st) => `
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
`;

export const renderCancellationDelayForm = (st) => `
    <div class="custom-card p-3 mt-3">
        <h3 class="fs-6 fw-bold text-muted text-uppercase mb-3" style="font-size: 0.75rem;">Paramètres</h3>
        <form onsubmit="app.updateCancellationDelay(event)" class="d-flex flex-column gap-2" style="font-size: 0.75rem;">
            <label class="col-form-label py-0 text-muted mb-0">Délai d'annulation d'un cours (h)</label>
            <div class="d-flex gap-2">
                <input type="number" id="admin-cancellation-delay" required min="0" class="form-control form-control-sm py-0 px-1 text-muted text-center" style="font-size: 0.7rem; height: 26px; max-width: 80px;" value="${st.cancellationDelay}">
                <button type="submit" class="btn btn-emerald btn-sm py-0 px-3 fw-medium" style="font-size: 0.7rem;">OK</button>
            </div>
        </form>
    </div>
`;

export const renderPackagesManager = (st) => `
    <div class="custom-card p-4 p-md-5 animate-fade-in">
        <h2 class="fs-5 fw-medium mb-4">Gestion des Tarifs (Packs de cours)</h2>
        <form onsubmit="app.updateAllPackages(event)">
            <div class="d-flex flex-column gap-3 mb-4">
            ${st.creditPackages.map(pkg => `
                <div class="p-3 border rounded-3 bg-light package-block mb-3" style="font-size: 0.85rem;">
                    <input type="hidden" name="id" value="${pkg.id}">
                    <div class="row g-2">
                        <div class="col-md-9">
                            <div class="row g-2 mb-2 align-items-center">
                                <div class="col-sm-6 d-flex align-items-center gap-2">
                                    <span class="small text-muted fw-medium text-nowrap" style="width: 50px;">Titre:</span>
                                    <input type="text" name="name" value="${pkg.name}" placeholder="Nom" required class="form-control form-control-sm border shadow-none bg-white">
                                </div>
                                <div class="col-sm-6 d-flex align-items-center gap-2">
                                    <span class="small text-muted fw-medium text-nowrap">Sous-titre:</span>
                                    <input type="text" name="subtitle" value="${pkg.subtitle || ''}" placeholder="Optionnel" class="form-control form-control-sm border shadow-none bg-white opacity-75">
                                </div>
                            </div>
                            
                            <div class="row g-2 align-items-center">
                                <div class="col d-flex flex-wrap align-items-center gap-3">
                                    <div class="d-flex align-items-center gap-2">
                                        <span class="small text-muted fw-medium text-nowrap" style="width: 50px;">Prix:</span>
                                        <input type="number" name="price" value="${pkg.price}" required min="0" class="form-control form-control-sm border text-center bg-white shadow-none" style="width: 55px;">
                                        <span class="small text-muted">€</span>
                                    </div>

                                    <div class="d-flex align-items-center gap-1 border-start ps-3">
                                        <div class="form-check mb-0">
                                            <input type="checkbox" id="is-sub-${pkg.id}" name="is_subscription" value="1" class="form-check-input cursor-pointer" onchange="this.closest('.package-block').querySelectorAll('.pack-credits-col').forEach(e => e.classList.toggle('d-none', this.checked)); this.closest('.package-block').querySelectorAll('.pack-sub-duration-col').forEach(e => e.classList.toggle('d-none', !this.checked));" ${pkg.is_subscription ? 'checked' : ''}>
                                            <label class="form-check-label text-muted cursor-pointer small fw-medium text-nowrap" for="is-sub-${pkg.id}">Abonnement</label>
                                        </div>
                                    </div>

                                    <div class="pack-credits-col ${pkg.is_subscription ? 'd-none' : ''} d-flex align-items-center gap-1 border-start ps-3">
                                        <span class="small text-muted fw-medium">Nombre:</span>
                                        <input type="number" name="credits" value="${pkg.is_subscription ? 0 : pkg.credits}" min="0" class="form-control form-control-sm border text-center bg-white" style="width: 55px;">
                                        <span class="small text-muted">cours</span>
                                    </div>

                                    <div class="pack-sub-duration-col ${pkg.is_subscription ? '' : 'd-none'} d-flex align-items-center gap-1 border-start ps-3">
                                        <span class="small text-muted fw-medium">Durée:</span>
                                        <input type="number" name="duration_days" value="${pkg.is_subscription ? (pkg.expires_in_days || 365) : 365}" min="1" class="form-control form-control-sm border text-center bg-white" style="width: 55px;">
                                        <span class="small text-muted text-nowrap">${(pkg.expires_in_days || 365) > 1 ? 'jours' : 'jour'}</span>
                                    </div>

                                    <div class="pack-credits-col ${pkg.is_subscription ? 'd-none' : ''} d-flex align-items-center gap-2 border-start ps-3">
                                        <div class="form-check mb-0 d-flex align-items-center gap-1">
                                            <input type="checkbox" id="exp-cb-${pkg.id}" class="form-check-input cursor-pointer mt-0" onchange="document.getElementById('exp-div-${pkg.id}').classList.toggle('d-none', !this.checked); if(!this.checked) document.getElementById('exp-input-${pkg.id}').value = '0';" ${!pkg.is_subscription && pkg.expires_in_days > 0 ? 'checked' : ''}>
                                            <label class="form-check-label text-muted cursor-pointer small fw-medium text-nowrap" for="exp-cb-${pkg.id}">Expiration</label>
                                        </div>
                                        <div class="${!pkg.is_subscription && pkg.expires_in_days > 0 ? '' : 'd-none'} d-flex align-items-center gap-1" id="exp-div-${pkg.id}">
                                            <input type="number" id="exp-input-${pkg.id}" name="expires_in_days" value="${!pkg.is_subscription ? (pkg.expires_in_days || 0) : 0}" min="0" class="form-control form-control-sm border text-center bg-white" style="width: 55px;">
                                            <span class="small text-muted text-nowrap">${(pkg.expires_in_days || 0) > 1 ? 'jours' : 'jour'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <textarea name="description" class="form-control form-control-sm border bg-white" style="height: 65px; font-size: 0.75rem; overflow-y: auto;" placeholder="Note...">${pkg.description || ''}</textarea>
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
            <h3 class="fs-6 fw-medium mb-3">Ajouter un nouveau             <form onsubmit="app.createPackage(event)" class="p-3 border rounded-3 bg-light package-block mb-3" style="font-size: 0.85rem;">
                <!-- Formulaire d'ajout de pack -->
                <div class="row g-2">
                    <div class="col-md-9">
                        <div class="row g-2 mb-2 align-items-center">
                            <div class="col-sm-6 d-flex align-items-center gap-2">
                                <span class="small text-muted fw-medium text-nowrap" style="width: 50px;">Titre:</span>
                                <input type="text" name="name" placeholder="Nom du pack" required class="form-control form-control-sm border shadow-none bg-white">
                            </div>
                            <div class="col-sm-6 d-flex align-items-center gap-2">
                                <span class="small text-muted fw-medium text-nowrap">Sous-titre:</span>
                                <input type="text" name="subtitle" placeholder="Optionnel" class="form-control form-control-sm border shadow-none bg-white opacity-75">
                            </div>
                        </div>
                        
                        <div class="row g-2 align-items-center">
                            <div class="col d-flex flex-wrap align-items-center gap-3">
                                <div class="d-flex align-items-center gap-2">
                                    <span class="small text-muted fw-medium text-nowrap" style="width: 50px;">Prix:</span>
                                    <input type="number" name="price" placeholder="0" required min="0" class="form-control form-control-sm border text-center bg-white shadow-none" style="width: 55px;">
                                    <span class="small text-muted">€</span>
                                </div>

                                <div class="d-flex align-items-center gap-1 border-start ps-3">
                                    <div class="form-check mb-0">
                                        <input type="checkbox" id="is-sub-new" name="is_subscription" value="1" class="form-check-input cursor-pointer" onchange="this.closest('.package-block').querySelectorAll('.pack-credits-col').forEach(e => e.classList.toggle('d-none', this.checked)); this.closest('.package-block').querySelectorAll('.pack-sub-duration-col').forEach(e => e.classList.toggle('d-none', !this.checked));">
                                        <label class="form-check-label text-muted cursor-pointer small fw-medium text-nowrap" for="is-sub-new">Abonnement</label>
                                    </div>
                                </div>

                                <div class="pack-credits-col d-flex align-items-center gap-1 border-start ps-3">
                                    <span class="small text-muted fw-medium">Nombre:</span>
                                    <input type="number" name="credits" placeholder="Nb" min="1" class="form-control form-control-sm border text-center bg-white" style="width: 55px;">
                                    <span class="small text-muted">cours</span>
                                </div>

                                <div class="pack-sub-duration-col d-none d-flex align-items-center gap-1 border-start ps-3">
                                    <span class="small text-muted fw-medium">Durée:</span>
                                    <input type="number" name="duration_days" value="365" min="1" class="form-control form-control-sm border text-center bg-white" style="width: 55px;">
                                    <span class="small text-muted text-nowrap">jours</span>
                                </div>

                                <div class="pack-credits-col d-flex align-items-center gap-2 border-start ps-3">
                                    <div class="form-check mb-0 d-flex align-items-center gap-1">
                                        <input type="checkbox" id="exp-cb-new" class="form-check-input cursor-pointer mt-0" onchange="document.getElementById('exp-div-new').classList.toggle('d-none', !this.checked); if(!this.checked) document.getElementById('exp-input-new').value = '0';">
                                        <label class="form-check-label text-muted cursor-pointer small fw-medium text-nowrap" for="exp-cb-new">Expiration</label>
                                    </div>
                                    <div class="d-none d-flex align-items-center gap-1" id="exp-div-new">
                                        <input type="number" id="exp-input-new" name="expires_in_days" value="0" min="0" class="form-control form-control-sm border text-center bg-white" style="width: 55px;">
                                        <span class="small text-muted text-nowrap">jour</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <textarea name="description" placeholder="Notes..." class="form-control form-control-sm border bg-white" style="height: 65px; font-size: 0.75rem; overflow-y: auto;"></textarea>
                    </div>
                </div>
                <div class="text-end mt-2">
                    <button type="submit" class="btn btn-emerald btn-sm px-4 fw-medium" style="font-size: 0.75rem;">Ajouter le pack</button>
                </div>
            </form>
       </form>
        </div>
    </div>
`;

export const renderNewsletterForm = (st, clients) => `
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
`;

export const renderStudioSettings = (st) => `
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
`;
