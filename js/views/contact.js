import { icons } from '../icons.js';
import { getNotificationHtml } from './components.js';

export const contactView = (app) => `
    <div class="pt-6 pb-6 bg-white min-h-[60vh] animate-fade-in dark:bg-stone-900">
        <div class="max-w-5xl mx-auto px-4 sm:px-6">
            <div class="grid md:grid-cols-2 gap-6">
                <div>
                    <h1 class="text-3xl md:text-4xl font-light text-stone-800 mb-4 dark:text-stone-100">Contactez-nous</h1>
                    <p class="text-stone-600 mb-4 text-base font-light dark:text-stone-300">Une question ? N'hésitez pas à nous écrire.</p>
                    <div class="space-y-4">
                        <div class="flex items-start gap-3 text-sm text-stone-600 dark:text-stone-300">
                            <div class="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-emerald-700 flex-shrink-0 dark:bg-stone-800 dark:text-emerald-400">${icons.mapPin}</div>
                            <div>
                                <div class="font-medium text-stone-800 mb-1 dark:text-stone-100">Notre Studio</div>
                                <div class="leading-relaxed">${app.state.studioAddress}</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-300">
                            <div class="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-emerald-700 flex-shrink-0 dark:bg-stone-800 dark:text-emerald-400">${icons.phone}</div>
                            <div>
                                <div class="font-medium text-stone-800 dark:text-stone-100">Téléphone</div>
                                <a href="tel:${app.state.studioPhone.replace(/\s/g, '')}" class="hover:text-emerald-700 transition-colors">
                                    ${app.state.studioPhone}
                                </a>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-300">
                            <div class="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-emerald-700 flex-shrink-0 dark:bg-stone-800 dark:text-emerald-400">${icons.mail}</div>
                            <div>
                                <div class="font-medium text-stone-800 dark:text-stone-100">Email</div>
                                <a href="mailto:${app.state.studioEmail}" class="hover:text-emerald-700 transition-colors underline decoration-stone-200 underline-offset-4 dark:decoration-stone-700">
                                    ${app.state.studioEmail}
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="mt-4 rounded-2xl overflow-hidden border border-stone-200 shadow-sm h-48 dark:border-stone-700">
                        <iframe width="100%" height="100%" frameborder="0" src="https://maps.google.com/maps?q=${encodeURIComponent(app.state.studioAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed"></iframe>
                    </div>
                </div>
                <div class="bg-stone-50 p-6 rounded-3xl border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                    <form class="space-y-4" onsubmit="event.preventDefault(); app.showNotification('Message envoyé ! (Simulation)');">
                        <div>
                            <label for="contact-name" class="block text-xs font-medium text-stone-700 mb-1 dark:text-stone-200">Nom complet</label>
                            <input type="text" id="contact-name" required class="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white dark:bg-stone-700 dark:border-stone-600" placeholder="Votre nom" />
                        </div>
                        <div>
                            <label for="contact-email" class="block text-xs font-medium text-stone-700 mb-1 dark:text-stone-200">Email</label>
                            <input type="email" id="contact-email" required class="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white dark:bg-stone-700 dark:border-stone-600" placeholder="vous@email.com" />
                        </div>
                        <div>
                            <label for="contact-message" class="block text-xs font-medium text-stone-700 mb-1 dark:text-stone-200">Message</label>
                            <textarea id="contact-message" required rows="3" class="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white dark:bg-stone-700 dark:border-stone-600" placeholder="Comment pouvons-nous vous aider ?"></textarea>
                        </div>
                        <button type="submit" class="w-full py-2.5 text-sm bg-emerald-800 text-white rounded-xl hover:bg-emerald-900 transition font-medium dark:bg-emerald-700 dark:hover:bg-emerald-600">Envoyer le message</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
`;
