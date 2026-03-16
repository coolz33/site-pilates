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
                            <div class="flex items-center gap-3">
                                <button onclick="app.navigate('profil')" class="text-sm transition-colors flex items-center gap-2 ${st.view === 'profil' ? 'text-emerald-800 dark:text-emerald-400 font-bold' : 'text-stone-600 hover:text-emerald-700 dark:text-stone-300 dark:hover:text-emerald-400'}">${icons.user} ${st.currentUser.firstName}</button>
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
                        <button onclick="app.navigate('profil')" class="block w-full text-left py-3 px-4 rounded-r-xl border-l-4 transition-all flex items-center gap-3 ${st.view === 'profil' ? 'bg-emerald-50 border-emerald-700 text-emerald-800 font-semibold dark:bg-emerald-900/50 dark:border-emerald-500 dark:text-emerald-300' : 'border-transparent text-stone-600 dark:text-stone-300'}">${icons.user} Mon Profil (${st.currentUser.firstName})</button>
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
    document.getElementById('footer').innerHTML = `
        <footer class="bg-stone-800 text-stone-400 py-6 md:py-8 dark:bg-stone-900">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <span class="text-xl font-light text-white tracking-wider mb-4 block dark:text-stone-200">ÉQUILIBRE<span class="font-semibold">PILATES</span></span>
                    <p class="text-sm">Votre studio de bien-être.</p>
                </div>
                <div>
                    <h4 class="text-white font-medium mb-4 dark:text-stone-200">Contact</h4>
                    <ul class="space-y-2 text-sm">
                        <li>${app.state.studioAddress}</li>
                        <li>${app.state.studioEmail}</li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-white font-medium mb-4 dark:text-stone-200">Légal</h4>
                    <ul class="space-y-2 text-sm">
                        <li><button onclick="app.navigate('mentions-legales')" class="hover:text-white transition-colors">Mentions Légales</button></li>
                        <li><button onclick="app.navigate('politique-confidentialite')" class="hover:text-white transition-colors">Confidentialité</button></li>
                    </ul>
                </div>
            </div>
        </footer>`;
};

export const getNotificationHtml = (app) => {
    return '';
};

export const renderPaymentModal = (app, container) => {
    if (app.state.showPaymentModal && app.state.selectedClassForPayment) {
        const cls = app.state.selectedClassForPayment;
        const userBalance = app.state.currentUser.credits_balance || 0;
        const classCost = cls.credits_price ?? 1;
        const isInsufficient = userBalance < classCost;

        const modalHtml = `
            <div class="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in dark:bg-black/70">
                <div class="bg-emerald-50/95 backdrop-blur-md rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl border border-emerald-100 dark:bg-stone-800/95 dark:border dark:border-stone-700">
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
            </div>`;
        container.insertAdjacentHTML('beforeend', modalHtml);
    }
};
