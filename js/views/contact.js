import { icons } from '../icons.js';
import { getNotificationHtml } from './components.js';

export const contactView = (app) => `
    <div class="pt-20 pb-24 bg-white min-h-screen animate-fade-in">
        <div class="max-w-6xl mx-auto px-4 sm:px-6">
            <div class="grid md:grid-cols-2 gap-16">
                <div>
                    <h1 class="text-4xl md:text-5xl font-light text-stone-800 mb-6">Contactez-nous</h1>
                    <p class="text-stone-600 mb-10 text-lg font-light">Une question ? N'hésitez pas à nous écrire.</p>
                    <div class="space-y-6">
                        <div class="flex items-start gap-4 text-stone-600">
                            <div class="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-emerald-700 flex-shrink-0">${icons.mapPin}</div>
                            <div>
                                <div class="font-medium text-stone-800 mb-1">Notre Studio</div>
                                <div class="leading-relaxed">${app.state.studioAddress}</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-4 text-stone-600">
                            <div class="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-emerald-700 flex-shrink-0">${icons.phone}</div>
                            <div><div class="font-medium text-stone-800">Téléphone</div><div>${app.state.studioPhone}</div></div>
                        </div>
                        <div class="flex items-center gap-4 text-stone-600">
                            <div class="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-emerald-700 flex-shrink-0">${icons.mail}</div>
                            <div><div class="font-medium text-stone-800">Email</div><div>${app.state.studioEmail}</div></div>
                        </div>
                    </div>
                    <div class="mt-10 rounded-2xl overflow-hidden border border-stone-200 shadow-sm h-64">
                        <iframe width="100%" height="100%" frameborder="0" src="https://maps.google.com/maps?q=${encodeURIComponent(app.state.studioAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed"></iframe>
                    </div>
                </div>
                <div class="bg-stone-50 p-8 rounded-3xl border border-stone-100">
                    ${getNotificationHtml(app)}
                    <form class="space-y-6" onsubmit="event.preventDefault(); app.showNotification('Message envoyé ! (Simulation)');">
                        <div>
                            <label for="contact-name" class="block text-sm font-medium text-stone-700 mb-2">Nom complet</label>
                            <input type="text" id="contact-name" required class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white" placeholder="Votre nom" />
                        </div>
                        <div>
                            <label for="contact-email" class="block text-sm font-medium text-stone-700 mb-2">Email</label>
                            <input type="email" id="contact-email" required class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white" placeholder="vous@email.com" />
                        </div>
                        <div>
                            <label for="contact-message" class="block text-sm font-medium text-stone-700 mb-2">Message</label>
                            <textarea id="contact-message" required rows="4" class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white" placeholder="Comment pouvons-nous vous aider ?"></textarea>
                        </div>
                        <button type="submit" class="w-full py-4 bg-emerald-800 text-white rounded-xl hover:bg-emerald-900 transition font-medium">Envoyer le message</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
`;
