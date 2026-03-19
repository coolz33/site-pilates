import { icons } from '../icons.js';

/**
 * @file contact.js
 * @description Vue de la page de contact (informations, carte, formulaire).
 */

/**
 * Génère la page Contact.
 * @param {PilatesApp} app - L'instance principale de l'application.
 * @returns {string} Le code HTML structuré avec Bootstrap 5.
 */
export const contactView = (app) => `
    <div class="pt-4 pb-5 animate-fade-in flex-grow-1">
        <div class="container" style="max-width: 1000px;">
            <div class="row g-5 mt-2">
                <!-- Informations de contact et Carte -->
                <div class="col-md-6 d-flex flex-column gap-4">
                            <div>
                        <h1 class="fs-2 fw-light mb-2">Contactez-nous</h1>
                        <p class="text-muted fw-light">Une question ? N'hésitez pas à nous écrire.</p>
                        </div>
                    
                    <div class="d-flex flex-column gap-3">
                        <div class="d-flex align-items-start gap-3">
                            <div class="icon-circle bg-emerald-light text-emerald flex-shrink-0" style="width: 2.5rem; height: 2.5rem;">${icons.mapPin}</div>
                            <div>
                                <div class="fw-medium mb-1">Notre Studio</div>
                                <div class="text-muted small">${app.state.studioAddress}</div>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-3">
                            <div class="icon-circle bg-emerald-light text-emerald flex-shrink-0" style="width: 2.5rem; height: 2.5rem;">${icons.phone}</div>
                            <div>
                                <div class="fw-medium">Téléphone</div>
                                <a href="tel:${app.state.studioPhone.replace(/\s/g, '')}" class="text-muted small text-decoration-none hover-emerald transition-colors">
                                    ${app.state.studioPhone}
                                </a>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-3">
                            <div class="icon-circle bg-emerald-light text-emerald flex-shrink-0" style="width: 2.5rem; height: 2.5rem;">${icons.mail}</div>
                            <div>
                                <div class="fw-medium">Email</div>
                                <a href="mailto:${app.state.studioEmail}" class="text-muted small text-decoration-underline hover-emerald transition-colors">
                                    ${app.state.studioEmail}
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="rounded-3 overflow-hidden border shadow-sm mt-2" style="height: 200px;">
                        <iframe width="100%" height="100%" frameborder="0" src="https://maps.google.com/maps?q=${encodeURIComponent(app.state.studioAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed"></iframe>
                    </div>
                </div>
                
                <!-- Formulaire de contact -->
                <div class="col-md-6">
                    <div class="custom-card p-4 p-md-5 h-100">
                        <form class="d-flex flex-column gap-3" onsubmit="event.preventDefault(); app.showNotification('Message envoyé ! (Simulation)');">
                            <div>
                                <label for="contact-name" class="form-label small fw-medium mb-1">Nom complet</label>
                                <input type="text" id="contact-name" required class="form-control" placeholder="Votre nom" />
                            </div>
                            <div>
                                <label for="contact-email" class="form-label small fw-medium mb-1">Email</label>
                                <input type="email" id="contact-email" required class="form-control" placeholder="vous@email.com" />
                            </div>
                            <div>
                                <label for="contact-message" class="form-label small fw-medium mb-1">Message</label>
                                <textarea id="contact-message" required rows="4" class="form-control" placeholder="Comment pouvons-nous vous aider ?"></textarea>
                            </div>
                            <button type="submit" class="btn btn-emerald w-100 py-2 mt-2 fw-medium">Envoyer le message</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
