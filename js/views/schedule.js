import { icons } from '../icons.js';

/**
 * @file schedule.js
 * @description Vue du planning et de la réservation.
 */

/**
 * Génère la vue du calendrier hebdomadaire.
 * Affiche l'assistant IA et le calendrier des 7 jours à venir avec les statuts des cours.
 * @param {PilatesApp} app - L'instance principale de l'application.
 * @returns {string} Code HTML structuré avec Bootstrap 5.
 */
export const scheduleView = (app) => {
    const st = app.state;
    const date = new Date(st.currentDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(date.setDate(diff));
    const monthName = startOfWeek.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        weekDays.push(d);
    }

    const formatObjDate = (d) => d.toISOString().split('T')[0];

    let daysHtml = weekDays.map(d => {
        const dayString = formatObjDate(d);
        const dayClasses = st.classes.filter(c => c.date === dayString).sort((a, b) => a.time.localeCompare(b.time));
        
        let classesHtml = dayClasses.length === 0 
            ? `<div class="text-center text-muted small py-4">Aucun cours</div>`
            : dayClasses.map(c => {
                const isBooked = st.currentUser && c.bookedUsers.includes(st.currentUser.id);
                const isPast = new Date(`${c.date}T${c.time}`) < new Date();
                const isFull = c.bookedUsers.length >= c.capacity;

                let buttonText, buttonClasses, buttonDisabled = '';
                let cardStateClass = isBooked ? 'card-booked' : (isPast ? 'card-past' : 'card-available');

                if (isBooked) {
                    buttonText = 'Inscrit';
                    buttonClasses = 'btn-booked';
                    buttonDisabled = 'disabled';
                } else if (isPast) {
                    buttonText = 'Terminé';
                    buttonClasses = 'btn-past';
                    buttonDisabled = 'disabled';
                } else if (isFull) {
                    buttonText = 'Complet';
                    buttonClasses = 'btn-full';
                    buttonDisabled = 'disabled';
                } else {
                    buttonText = 'Réserver';
                    buttonClasses = 'btn-available';
                }

                return `
                    <div class="schedule-card ${cardStateClass} mb-2 shadow-sm">
                        <div class="fw-semibold mb-1 lh-sm fs-0-85rem ${isPast && !isBooked ? 'text-muted' : ''}">${c.time} - ${c.title}</div>
                        <div class="opacity-75 mb-1 fs-0-75rem ${isPast && !isBooked ? 'text-muted' : ''}">${c.duration} min | ${c.bookedUsers.length}/${c.capacity} pers.</div>
                        <button onclick="app.initiateBooking(${c.id})" ${buttonDisabled} class="btn btn-sm w-100 fw-medium rounded-pill py-1 fs-0-75rem ${buttonClasses}">
                            ${buttonText}
                        </button>
                        
                        <!-- Info-bulle (Tooltip) -->
                        <div class="planning-tooltip schedule-tooltip shadow-lg">
                            ${c.description || 'Séance de Pilates'}
                            <div class="tooltip-arrow"></div>
                        </div>
                    </div>`;
            }).join('');

        return `
            <div class="col-12 col-md">
                <div class="text-center mb-3">
                    <div class="small text-muted text-uppercase tracking-wider fw-medium mb-1">${d.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                    <div class="fs-3 fw-normal text-stone-800">${d.getDate()}</div>
                </div>
                ${classesHtml}
            </div>`;
    }).join('');

    return `
        <div class="pt-4 pb-5 animate-fade-in flex-grow-1 w-100 mx-auto max-w-1536">
            <div class="container-fluid px-3 px-md-4">
                
                <!-- Section Assistant IA -->
                <div class="custom-card p-2 p-md-3 mb-4 mx-auto max-w-900">
                    <div class="d-flex flex-column flex-md-row align-items-md-center gap-2">
                        <h2 class="fw-medium mb-0 d-flex align-items-center gap-2 text-nowrap fs-0-9rem">
                            <span class="text-emerald">${icons.sparkles}</span> Quel cours pour moi ?
                        </h2>
                        <input type="text" id="ai-prompt" placeholder="Ex: Je cherche un cours dynamique pour le dos..." class="form-control form-control-sm rounded-pill px-3 py-1">
                        <button onclick="app.askAi()" class="btn btn-emerald rounded-pill px-3 py-1 d-flex align-items-center justify-content-center gap-2 btn-sm min-w-110">
                            ${st.isAiLoading ? '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ...' : 'Demander'}
                        </button>
                    </div>
                    ${st.aiResponse ? `<div class="mt-3 p-2 rounded-3 bg-emerald-light text-emerald-dark border border-success border-opacity-25 animate-fade-in small">${st.aiResponse}</div>` : ''}
                </div>

                <!-- En-tête Navigation Planning -->
                <div class="d-flex flex-column flex-md-row align-items-center justify-content-center justify-content-md-start mb-4 mx-auto gap-3 max-w-1400">
                    <h1 class="fs-2 fw-medium text-capitalize mb-0 text-emerald">Planning - ${monthName}</h1>
                    <!-- Navigation Semaine -->
                    <div class="d-flex align-items-center gap-2 bg-white rounded-pill p-1 shadow-sm border border-stone-200">
                        <button onclick="app.changeWeek(-1)" class="nav-round-btn w-2rem h-2rem fs-0-875rem">←</button>
                        <button onclick="app.changeWeek(1)" class="nav-round-btn w-2rem h-2rem fs-0-875rem">→</button>
                    </div>
                </div>

                <!-- Grille du calendrier (7 colonnes via CSS) -->
                <div class="row g-2 g-md-3 mx-auto max-w-1400">
                    ${daysHtml}
                </div>
                
            </div>
        </div>`;
};
