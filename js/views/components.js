import { icons } from '../icons.js';
import { API_URL } from '../api.js';

export const renderNavbar = (app) => {
    const st = app.state;
    const navHtml = `
        <nav class="bg-white shadow-sm sticky top-0 z-50 dark:bg-stone-800/80 dark:backdrop-blur-sm dark:border-b dark:border-stone-700 dark:shadow-none">
            <div class="w-full px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-20 items-center">
                    <div class="flex-shrink-0 flex items-center cursor-pointer" onclick="app.navigate('accueil')">
                        <span class="text-2xl font-light text-emerald-800 tracking-wider dark:text-emerald-400">ÉQUILIBRE<span class="font-semibold">PILATES</span></span>
                    </div>
                    <div class="hidden md:flex items-center space-x-5">
                        <button onclick="app.navigate('accueil')" class="nav-link whitespace-nowrap h-full px-1 flex items-center gap-2 transition-colors duration-300 ${st.view === 'accueil' ? 'active text-emerald-800 dark:text-emerald-400 font-medium' : 'text-stone-600 hover:text-emerald-700 dark:text-stone-300 dark:hover:text-emerald-400'}">${icons.home} Accueil</button>
                        <button onclick="app.navigate('a-propos')" class="nav-link whitespace-nowrap h-full px-1 flex items-center gap-2 transition-colors duration-300 ${st.view === 'a-propos' ? 'active text-emerald-800 dark:text-emerald-400 font-medium' : 'text-stone-600 hover:text-emerald-700 dark:text-stone-300 dark:hover:text-emerald-400'}">${icons.sparkles} Le Pilates</button>
                        <button onclick="app.navigate('tarifs')" class="nav-link whitespace-nowrap h-full px-1 flex items-center gap-2 transition-colors duration-300 ${st.view === 'tarifs' ? 'active text-emerald-800 dark:text-emerald-400 font-medium' : 'text-stone-600 hover:text-emerald-700 dark:text-stone-300 dark:hover:text-emerald-400'}">${icons.creditCard} Tarifs</button>
                        <button onclick="app.navigate('planning')" class="nav-link whitespace-nowrap h-full px-1 flex items-center gap-2 transition-colors duration-300 ${st.view === 'planning' ? 'active text-emerald-800 dark:text-emerald-400 font-medium' : 'text-stone-600 hover:text-emerald-700 dark:text-stone-300 dark:hover:text-emerald-400'}">${icons.calendar} Planning & Réservation</button>
                        <button onclick="app.navigate('contact')" class="nav-link whitespace-nowrap h-full px-1 flex items-center gap-2 transition-colors duration-300 ${st.view === 'contact' ? 'active text-emerald-800 dark:text-emerald-400 font-medium' : 'text-stone-600 hover:text-emerald-700 dark:text-stone-300 dark:hover:text-emerald-400'}">${icons.mail} Contact</button>
                    </div>
                    <div class="flex items-center gap-4">
                        <button onclick="app.toggleTheme(this)" class="p-2 rounded-full text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
                            ${st.theme === 'light' ? icons.moon : icons.sun}
                        </button>
                        <div class="hidden md:flex items-center pl-4 border-l border-stone-200 dark:border-stone-700">
                            ${st.currentUser ? `
                            <div class="flex items-center gap-6">
                                <button onclick="app.navigate('profil')" class="text-sm transition-colors flex items-center gap-2 ${st.view === 'profil' ? 'text-emerald-800 dark:text-emerald-400 font-bold' : 'text-stone-600 hover:text-emerald-700 dark:text-stone-300 dark:hover:text-emerald-400'}">
                                    ${icons.user} ${st.currentUser.firstName}<span class="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold dark:bg-emerald-900/40 dark:text-emerald-400">${st.currentUser.credits_balance || 0}</span>
                                </button>
                                ${st.currentUser.role === 'admin' ? `<button onclick="app.navigate('administration')" class="text-sm font-medium transition-colors flex items-center gap-2 ${st.view === 'administration' ? 'text-emerald-800 dark:text-emerald-400 underline underline-offset-4' : 'text-emerald-700 dark:text-emerald-400 hover:underline'}">${icons.settings} Administration</button>` : ''}
                                <button onclick="app.logout()" class="text-sm text-red-600 hover:text-red-800">Déconnexion</button>
                            </div>` : `
                            <div class="flex items-center gap-4">
                                <button onclick="app.navigate('connexion')" class="text-sm font-medium text-stone-600 hover:text-emerald-700 dark:text-stone-300 dark:hover:text-emerald-400">Connexion</button>
                                <button onclick="app.navigate('inscription')" class="px-4 py-2 bg-emerald-700 text-white text-sm rounded-full hover:bg-emerald-800 transition shadow-sm dark:bg-emerald-600 dark:hover:bg-emerald-700">S'inscrire</button>
                            </div>`}
                        </div>
                        <div class="flex items-center md:hidden">
                            <button onclick="app.toggleMenu()" class="text-stone-600">${st.isMenuOpen ? icons.close : icons.menu}</button>
                        </div>
                    </div>
                </div>
            </div>
            ${st.isMenuOpen ? `
            <div class="md:hidden bg-white border-t border-stone-100 px-4 pt-2 pb-6 space-y-2 shadow-lg flex flex-col dark:bg-stone-800 dark:border-stone-700">
                <button onclick="app.navigate('accueil')" class="text-left py-3 px-4 rounded-r-xl border-l-4 transition-all flex items-center gap-3 ${st.view === 'accueil' ? 'bg-emerald-50 border-emerald-700 text-emerald-800 font-semibold dark:bg-emerald-900/50 dark:border-emerald-500 dark:text-emerald-300' : 'border-transparent text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-700'}">${icons.home} Accueil</button>
                <button onclick="app.navigate('a-propos')" class="text-left py-3 px-4 rounded-r-xl border-l-4 transition-all flex items-center gap-3 ${st.view === 'a-propos' ? 'bg-emerald-50 border-emerald-700 text-emerald-800 font-semibold dark:bg-emerald-900/50 dark:border-emerald-500 dark:text-emerald-300' : 'border-transparent text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-700'}">${icons.sparkles} Le Pilates</button>
                <button onclick="app.navigate('tarifs')" class="text-left py-3 px-4 rounded-r-xl border-l-4 transition-all flex items-center gap-3 ${st.view === 'tarifs' ? 'bg-emerald-50 border-emerald-700 text-emerald-800 font-semibold dark:bg-emerald-900/50 dark:border-emerald-500 dark:text-emerald-300' : 'border-transparent text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-700'}">${icons.creditCard} Tarifs</button>
                <button onclick="app.navigate('planning')" class="text-left py-3 px-4 rounded-r-xl border-l-4 transition-all flex items-center gap-3 ${st.view === 'planning' ? 'bg-emerald-50 border-emerald-700 text-emerald-800 font-semibold dark:bg-emerald-900/50 dark:border-emerald-500 dark:text-emerald-300' : 'border-transparent text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-700'}">${icons.calendar} Planning & Réservation</button>
                <button onclick="app.navigate('contact')" class="text-left py-3 px-4 rounded-r-xl border-l-4 transition-all flex items-center gap-3 ${st.view === 'contact' ? 'bg-emerald-50 border-emerald-700 text-emerald-800 font-semibold dark:bg-emerald-900/50 dark:border-emerald-500 dark:text-emerald-300' : 'border-transparent text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-700'}">${icons.mail} Contact</button>
                <div class="border-t border-stone-100 pt-2 mt-2 dark:border-stone-700">
                    ${st.currentUser ? `
                        <button onclick="app.navigate('profil')" class="block w-full text-left py-3 px-4 rounded-r-xl border-l-4 transition-all flex items-center gap-3 ${st.view === 'profil' ? 'bg-emerald-50 border-emerald-700 text-emerald-800 font-semibold dark:bg-emerald-900/50 dark:border-emerald-500 dark:text-emerald-300' : 'border-transparent text-stone-600 dark:text-stone-300'}">${icons.user} Mon Profil (${st.currentUser.firstName} : ${st.currentUser.credits_balance || 0} )</button>
                        ${st.currentUser.role === 'admin' ? `<button onclick="app.navigate('administration')" class="block w-full text-left py-3 px-4 rounded-r-xl border-l-4 transition-all flex items-center gap-3 ${st.view === 'administration' ? 'bg-emerald-50 border-emerald-700 text-emerald-800 font-semibold dark:bg-emerald-900/50 dark:border-emerald-500 dark:text-emerald-300' : 'border-transparent text-emerald-700 dark:text-emerald-400'}">${icons.settings} Administration</button>` : ''}
                        <button onclick="app.logout()" class="block py-2 text-red-600">Déconnexion</button>
                    ` : `
                        <button onclick="app.navigate('connexion')" class="block py-2 text-stone-600 font-medium dark:text-stone-300">Connexion</button>
                        <button onclick="app.navigate('inscription')" class="block py-2 text-emerald-700 font-medium dark:text-emerald-400">S'inscrire</button>
                    `}
                </div>
            </div>` : ''}
        </nav>`;
    document.getElementById('navbar').innerHTML = navHtml;
};

export const renderFooter = (app) => {
    const year = new Date().getFullYear();
    document.getElementById('footer').innerHTML = `
        <footer class="bg-white text-stone-600 pt-8 pb-4 border-t border-stone-200 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-400">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    
                    <!-- 1. Branding & Réseaux Sociaux -->
                    <div class="space-y-3">
                        <div class="flex items-center gap-3 cursor-pointer" onclick="app.navigate('accueil')">
                            <div class="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z"/><path d="M12 22V12"/></svg>
                            </div>
                            <span class="text-xl font-light text-emerald-800 tracking-wider dark:text-emerald-400">ÉQUILIBRE<span class="font-semibold">PILATES</span></span>
                        </div>
                        <p class="text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                            Votre espace de bien-être dédié au mouvement en conscience, pour renforcer le corps et apaiser l'esprit.
                        </p>
                        <div class="flex gap-2 pt-1">
                            ${app.state.studioInstagram ? `<a href="${app.state.studioInstagram}" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-emerald-600 hover:text-white transition-all shadow-sm dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-emerald-700" title="Instagram"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>` : ''}
                            ${app.state.studioFacebook ? `<a href="${app.state.studioFacebook}" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-emerald-600 hover:text-white transition-all shadow-sm dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-emerald-700" title="Facebook"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>` : ''}
                            ${app.state.studioTiktok ? `<a href="${app.state.studioTiktok}" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-emerald-600 hover:text-white transition-all shadow-sm dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-emerald-700" title="TikTok"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg></a>` : ''}
                        </div>
                    </div>

                    <!-- 2. Plan du site -->
                    <div>
                        <h4 class="text-stone-800 font-medium mb-3 uppercase tracking-wider text-sm dark:text-stone-200">Plan du site</h4>
                        <ul class="space-y-2 text-sm">
                            <li><button onclick="app.navigate('accueil')" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2"><span class="text-emerald-600 dark:text-emerald-500">→</span> Accueil</button></li>
                            <li><button onclick="app.navigate('a-propos')" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2"><span class="text-emerald-600 dark:text-emerald-500">→</span> Le Pilates</button></li>
                            <li><button onclick="app.navigate('tarifs')" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2"><span class="text-emerald-600 dark:text-emerald-500">→</span> Tarifs & Packs</button></li>
                            <li><button onclick="app.navigate('planning')" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2"><span class="text-emerald-600 dark:text-emerald-500">→</span> Planning & Réservation</button></li>
                            <li><button onclick="app.navigate('contact')" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2"><span class="text-emerald-600 dark:text-emerald-500">→</span> Nous contacter</button></li>
                            ${!app.state.currentUser ? `
                                <li><button onclick="app.navigate('connexion')" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2"><span class="text-emerald-600 dark:text-emerald-500">→</span> Espace Client</button></li>
                            ` : `
                                <li><button onclick="app.navigate('profil')" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2"><span class="text-emerald-600 dark:text-emerald-500">→</span> Mon Profil</button></li>
                            `}
                        </ul>
                    </div>

                    <!-- 3. Coordonnées -->
                    <div>
                        <h4 class="text-stone-800 font-medium mb-3 uppercase tracking-wider text-sm dark:text-stone-200">Nous trouver</h4>
                        <ul class="space-y-2 text-sm">
                            <li class="flex items-start gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600 dark:text-emerald-500 mt-0.5 flex-shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                <span class="leading-relaxed">${app.state.studioAddress}</span>
                            </li>
                            <li class="flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600 dark:text-emerald-500 flex-shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                <a href="tel:${app.state.studioPhone.replace(/\s/g, '')}" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">${app.state.studioPhone}</a>
                            </li>
                            <li class="flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600 dark:text-emerald-500 flex-shrink-0"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                                <a href="mailto:${app.state.studioEmail}" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors underline-offset-4 decoration-stone-300 dark:decoration-stone-600 underline">${app.state.studioEmail}</a>
                            </li>
                        </ul>
                    </div>

                    <!-- 4. Légal -->
                    <div>
                        <h4 class="text-stone-800 font-medium mb-3 uppercase tracking-wider text-sm dark:text-stone-200">Informations Légales</h4>
                        <ul class="space-y-2 text-sm">
                            <li><button onclick="app.navigate('mentions-legales')" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2"><span class="text-stone-400 dark:text-stone-500">→</span> Mentions Légales</button></li>
                            <li><button onclick="app.navigate('politique-confidentialite')" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2"><span class="text-stone-400 dark:text-stone-500">→</span> Politique de Confidentialité</button></li>
                        </ul>
                    </div>
                </div>
                
                <!-- Copyright Footer Bottom -->
                <div class="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col md:flex-row justify-between items-center gap-2 text-[10px] sm:text-xs text-stone-400 dark:text-stone-500">
                    <p>© ${year} Studio Équilibre Pilates. Tous droits réservés.</p>
                    <p class="flex items-center gap-1">Fait avec <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="text-emerald-500"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> pour la vitalité</p>
                </div>
            </div>
        </footer>`;
};

export const getNotificationHtml = (app) => {
    return '';
};

export const renderPaymentModal = (app, container) => {
    let modal = document.getElementById('payment-modal');

    if (!app.state.showPaymentModal || !app.state.selectedClassForPayment) {
        if (modal) modal.remove(); // Supprime le modal s'il ne doit plus être affiché
        return;
    }

    // Si le modal doit être affiché mais n'existe pas, on le crée
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'payment-modal'; // Assigne un ID pour pouvoir le cibler et le supprimer
        document.body.appendChild(modal); // Attache au body pour qu'il persiste
    }

        const cls = app.state.selectedClassForPayment;
        const userBalance = app.state.currentUser.credits_balance || 0;
        const classCost = cls.credits_price ?? 1;
        const isInsufficient = userBalance < classCost;

        const modalHtml = `
            <div class="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in dark:bg-black/70">
                <div class="bg-emerald-50/95 backdrop-blur-md rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl border border-emerald-100 dark:bg-stone-800/95 dark:border dark:border-stone-700 relative">
                    <h3 class="text-2xl font-light text-emerald-900 mb-2 dark:text-stone-100">Confirmation de réservation</h3>
                    <p class="mb-6 border-b pb-4 text-stone-600 dark:text-stone-300 dark:border-stone-700">
                        Réservation : <strong class="text-emerald-800 dark:text-emerald-400">${cls.title ?? 'Cours inconnu'}</strong>
                    </p>
                    <form onsubmit="app.confirmPayment(event)" class="space-y-6">
                        
                        ${app.state.modalMessage ? `
                            <div class="mb-4 p-3 rounded-xl text-sm ${app.state.modalMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800' : 'bg-blue-50 text-blue-700'} animate-fade-in">
                                <p class="flex items-center gap-2">
                                    <span>${app.state.modalMessage.type === 'error' ? '⚠️' : 'ℹ️'}</span>
                                    ${app.state.modalMessage.text}
                                </p>
                                ${app.state.modalMessage.isInsufficientCredits ? `
                                    <button type="button" onclick="app.navigate('tarifs'); app.state.showPaymentModal=false; app.render()" class="mt-2 text-xs font-bold uppercase tracking-wide text-red-800 hover:underline w-full text-right dark:text-red-300">
                                        Acheter des crédits →
                                    </button>
                                ` : ''}
                            </div>
                        ` : ''}

                        <div class="${isInsufficient ? 'bg-rose-50 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300 border border-rose-100' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'} p-5 rounded-2xl text-center flex flex-col gap-1">
                            <span class="font-bold">Coût de la séance : ${classCost} crédits</span>
                            <span class="text-sm opacity-80">Votre solde : ${userBalance} crédits</span>
                            <div class="mt-3 pt-3 border-t ${isInsufficient ? 'border-rose-200' : 'border-emerald-200/50'} flex items-center justify-center gap-2">
                                <input type="checkbox" id="confirm-credits" ${isInsufficient ? 'disabled' : 'required'} class="w-4 h-4 text-emerald-600 rounded disabled:opacity-30">
                                <label for="confirm-credits" class="text-xs font-medium ${isInsufficient ? 'text-rose-400' : 'text-emerald-800 dark:text-emerald-200'}">
                                    ${isInsufficient ? 'Solde insuffisant pour réserver' : 'Je confirme l\'utilisation de mes crédits'}
                                </label>
                            </div>
                        </div>
                        <div class="flex gap-3">
                            <button type="button" onclick="app.cancelPayment()" class="flex-1 py-3 border rounded-xl dark:border-stone-600 dark:hover:bg-stone-700">Annuler</button>
                            <button type="submit" ${isInsufficient ? 'disabled' : ''} class="flex-1 py-3 ${isInsufficient ? 'bg-stone-300 text-stone-500 cursor-not-allowed' : 'bg-emerald-800 hover:bg-emerald-900 text-white'} rounded-xl transition-all shadow-md">
                                Confirmer
                            </button>
                        </div>
                    </form>
                </div>
            </div>`; // Note: J'ai ajouté 'relative' à la div interne pour une meilleure gestion des positions absolues si besoin.
        modal.innerHTML = modalHtml; // Met à jour le contenu du modal existant ou nouvellement créé
};

// Helper function to format date/time for calendar links
const formatDateForCalendar = (dateStr, timeStr, durationMin) => {
    const startDateTime = new Date(`${dateStr}T${timeStr}:00`);
    const endDateTime = new Date(startDateTime.getTime() + durationMin * 60 * 1000);

    const format = (dt) => {
        const year = dt.getFullYear();
        const month = (dt.getMonth() + 1).toString().padStart(2, '0');
        const day = dt.getDate().toString().padStart(2, '0');
        const hours = dt.getHours().toString().padStart(2, '0');
        const minutes = dt.getMinutes().toString().padStart(2, '0');
        const seconds = dt.getSeconds().toString().padStart(2, '0');
        return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };

    return {
        start: format(startDateTime),
        end: format(endDateTime)
    };
};

export const renderCalendarModal = (app, container) => {
    if (app.state.showCalendarModal && app.state.classForCalendar) {
        const cls = app.state.classForCalendar;
        const { start, end } = formatDateForCalendar(cls.date, cls.time, cls.duration);
        const title = encodeURIComponent(cls.title);
        const description = encodeURIComponent(cls.description || 'Cours de Pilates');
        const location = encodeURIComponent(app.state.studioAddress || 'Studio Équilibre Pilates');

        // Liens pour les calendriers web
        const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${description}&location=${location}&sf=true&output=xml`;
        const outlookCalendarLink = `https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${start}&enddt=${end}&subject=${title}&body=${description}&location=${location}`;
        
        // Contenu pour le fichier .ics (compatible Apple Calendar, Thunderbird, etc.)
        const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//PilatesApp//NONSGML v1.0//EN\nBEGIN:VEVENT\nUID:${cls.id}-${start}\nDTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d{3}/g, '')}\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${title}\nDESCRIPTION:${description}\nLOCATION:${location}\nEND:VEVENT\nEND:VCALENDAR`;
        const icsDataUri = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;

        let modal = document.getElementById('calendar-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'calendar-modal';
            document.body.appendChild(modal); // Attache au body pour qu'il persiste
        }

        const modalHtml = `
            <div class="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in dark:bg-black/70">
                <div class="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                    <h3 class="text-2xl font-light text-stone-800 mb-2 dark:text-stone-100">Ajouter au calendrier</h3>
                    <p class="mb-6 border-b pb-4 text-stone-600 dark:text-stone-300 dark:border-stone-700">
                        Votre réservation pour <strong class="text-emerald-800 dark:text-emerald-400">${cls.title}</strong> est confirmée.
                        Ajoutez-la à votre calendrier pour ne rien oublier !
                    </p>
                    <div class="space-y-4">
                        <a href="${googleCalendarLink}" target="_blank" rel="noopener noreferrer" class="block w-full py-3 bg-blue-600 text-white rounded-xl text-center font-medium hover:bg-blue-700 transition-all shadow-md">
                            Ajouter à Google Calendar
                        </a>
                        <a href="${outlookCalendarLink}" target="_blank" rel="noopener noreferrer" class="block w-full py-3 bg-blue-800 text-white rounded-xl text-center font-medium hover:bg-blue-900 transition-all shadow-md">
                            Ajouter à Outlook Calendar
                        </a>
                        <a href="${icsDataUri}" download="${cls.title.replace(/\s/g, '_')}.ics" class="block w-full py-3 bg-gray-700 text-white rounded-xl text-center font-medium hover:bg-gray-800 transition-all shadow-md">
                            Télécharger le fichier .ics (Apple, autres)
                        </a>
                    </div>
                    <div class="mt-6 flex justify-end">
                        <button type="button" onclick="app.closeCalendarModal()" class="px-6 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>`;
        modal.innerHTML = modalHtml; // Met à jour le contenu du modal existant ou nouvellement créé
    }
};

export const renderConfirmModal = (app) => {
    let modal = document.getElementById('confirm-modal');
    
    if (!app.state.confirmModal || !app.state.confirmModal.isOpen) {
        if (modal) modal.remove();
        return;
    }

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'confirm-modal';
        document.body.appendChild(modal);
    }

    const { message, confirmText, cancelText, type } = app.state.confirmModal;
    
    let confirmBtnClass = "bg-emerald-600 hover:bg-emerald-700 text-white";
    if (type === 'danger') {
        confirmBtnClass = "bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-600";
    }

    const iconHtml = type === 'danger' 
        ? '<span class="text-red-500 text-2xl">⚠️</span>' 
        : '<span class="text-amber-500 text-2xl">❓</span>';

    modal.innerHTML = `
        <div class="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in dark:bg-black/70">
            <div class="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                <div class="flex items-center gap-3 mb-4">
                    ${iconHtml}
                    <h3 class="text-xl font-medium text-stone-800 dark:text-stone-100">${type === 'danger' ? 'Attention' : 'Confirmation'}</h3>
                </div>
                <p class="mb-8 text-stone-600 dark:text-stone-300 whitespace-pre-line leading-relaxed">${message}</p>
                <div class="flex gap-3 justify-end">
                    <button type="button" onclick="app.state.confirmModal.onCancel()" class="px-5 py-2.5 border rounded-xl text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700 transition-colors font-medium">${cancelText}</button>
                    <button type="button" onclick="app.state.confirmModal.onConfirm()" class="px-5 py-2.5 rounded-xl transition-all shadow-md font-medium ${confirmBtnClass}">${confirmText}</button>
                </div>
            </div>
        </div>
    `;
};
