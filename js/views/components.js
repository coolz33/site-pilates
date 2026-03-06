import { icons } from '../icons.js';
import { API_URL } from '../api.js';

export const renderNavbar = (app) => {
    const st = app.state;
    const navHtml = `
        <nav class="bg-white shadow-sm sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-20">
                    <div class="flex items-center cursor-pointer" onclick="app.navigate('accueil')">
                        <span class="text-2xl font-light text-emerald-800 tracking-wider">ÉQUILIBRE<span class="font-semibold">PILATES</span></span>
                    </div>
                    <div class="hidden md:flex items-center space-x-5 ml-12">
                        <button onclick="app.navigate('accueil')" class="h-full px-1 transition-all duration-300 border-b-2 flex items-center gap-2 ${st.view === 'accueil' ? 'border-emerald-700 text-emerald-800 font-medium' : 'border-transparent text-stone-600 hover:text-emerald-700 hover:border-stone-200'}">${icons.home} Accueil</button>
                        <button onclick="app.navigate('a-propos')" class="h-full px-1 transition-all duration-300 border-b-2 flex items-center gap-2 ${st.view === 'a-propos' ? 'border-emerald-700 text-emerald-800 font-medium' : 'border-transparent text-stone-600 hover:text-emerald-700 hover:border-stone-200'}">${icons.sparkles} Le Pilates</button>
                        <button onclick="app.navigate('planning')" class="h-full px-1 transition-all duration-300 border-b-2 flex items-center gap-2 ${st.view === 'planning' ? 'border-emerald-700 text-emerald-800 font-medium' : 'border-transparent text-stone-600 hover:text-emerald-700 hover:border-stone-200'}">${icons.calendar} Planning & Réservation</button>
                        <button onclick="app.navigate('contact')" class="h-full px-1 transition-all duration-300 border-b-2 flex items-center gap-2 ${st.view === 'contact' ? 'border-emerald-700 text-emerald-800 font-medium' : 'border-transparent text-stone-600 hover:text-emerald-700 hover:border-stone-200'}">${icons.mail} Contact</button>
                        ${st.currentUser ? `
                        <div class="flex items-center gap-3 border-l border-stone-200 pl-10 ml-10">
                            <button onclick="app.navigate('profil')" class="text-sm transition-colors flex items-center gap-2 ${st.view === 'profil' ? 'text-emerald-800 font-bold' : 'text-stone-600 hover:text-emerald-700'}">${icons.user} ${st.currentUser.firstName}</button>
                            ${st.currentUser.role === 'admin' ? `<button onclick="app.navigate('administration')" class="text-sm font-medium transition-colors flex items-center gap-2 ${st.view === 'administration' ? 'text-emerald-800 underline underline-offset-4' : 'text-emerald-700 hover:underline'}">${icons.settings} Administration</button>` : ''}
                            <button onclick="app.logout()" class="text-sm text-red-600 hover:text-red-800">Déconnexion</button>
                        </div>` : `
                        <div class="flex items-center gap-4 border-l border-stone-200 pl-10 ml-10">
                            <button onclick="app.navigate('connexion')" class="text-sm font-medium text-stone-600 hover:text-emerald-700">Connexion</button>
                            <button onclick="app.navigate('inscription')" class="px-4 py-2 bg-emerald-700 text-white text-sm rounded-full hover:bg-emerald-800 transition shadow-sm">S'inscrire</button>
                        </div>`}
                    </div>
                    <div class="flex items-center md:hidden">
                        <button onclick="app.toggleMenu()" class="text-stone-600">${st.isMenuOpen ? icons.close : icons.menu}</button>
                    </div>
                </div>
            </div>
            ${st.isMenuOpen ? `
            <div class="md:hidden bg-white border-t border-stone-100 px-4 pt-2 pb-6 space-y-2 shadow-lg flex flex-col">
                <button onclick="app.navigate('accueil')" class="text-left py-3 px-4 rounded-r-xl border-l-4 transition-all flex items-center gap-3 ${st.view === 'accueil' ? 'bg-emerald-50 border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-stone-600 hover:bg-stone-50'}">${icons.home} Accueil</button>
                <button onclick="app.navigate('a-propos')" class="text-left py-3 px-4 rounded-r-xl border-l-4 transition-all flex items-center gap-3 ${st.view === 'a-propos' ? 'bg-emerald-50 border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-stone-600 hover:bg-stone-50'}">${icons.sparkles} Le Pilates</button>
                <button onclick="app.navigate('planning')" class="text-left py-3 px-4 rounded-r-xl border-l-4 transition-all flex items-center gap-3 ${st.view === 'planning' ? 'bg-emerald-50 border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-stone-600 hover:bg-stone-50'}">${icons.calendar} Planning & Réservation</button>
                <button onclick="app.navigate('contact')" class="text-left py-3 px-4 rounded-r-xl border-l-4 transition-all flex items-center gap-3 ${st.view === 'contact' ? 'bg-emerald-50 border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-stone-600 hover:bg-stone-50'}">${icons.mail} Contact</button>
                <div class="border-t border-stone-100 pt-2 mt-2">
                    ${st.currentUser ? `
                        <button onclick="app.navigate('profil')" class="block py-3 px-4 rounded-r-xl border-l-4 transition-all flex items-center gap-3 ${st.view === 'profil' ? 'bg-emerald-50 border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-stone-600'}">${icons.user} Mon Profil (${st.currentUser.firstName})</button>
                        ${st.currentUser.role === 'admin' ? `<button onclick="app.navigate('administration')" class="block py-3 px-4 rounded-r-xl border-l-4 transition-all flex items-center gap-3 ${st.view === 'administration' ? 'bg-emerald-50 border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-emerald-700'}">${icons.settings} Administration</button>` : ''}
                        <button onclick="app.logout()" class="block py-2 text-red-600">Déconnexion</button>
                    ` : `
                        <button onclick="app.navigate('connexion')" class="block py-2 text-stone-600 font-medium">Connexion</button>
                        <button onclick="app.navigate('inscription')" class="block py-2 text-emerald-700 font-medium">S'inscrire</button>
                    `}
                </div>
            </div>` : ''}
        </nav>`;
    document.getElementById('navbar').innerHTML = navHtml;
};

export const renderFooter = (app) => {
    document.getElementById('footer').innerHTML = `
        <footer class="bg-stone-900 text-stone-400 py-6 md:py-8">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <span class="text-xl font-light text-white tracking-wider mb-4 block">ÉQUILIBRE<span class="font-semibold">PILATES</span></span>
                    <p class="text-sm">Votre studio de bien-être.</p>
                </div>
                <div>
                    <h4 class="text-white font-medium mb-4">Contact</h4>
                    <ul class="space-y-2 text-sm">
                        <li>${app.state.studioAddress}</li>
                        <li>${app.state.studioEmail}</li>
                    </ul>
                </div>
            </div>
        </footer>`;
};

export const getNotificationHtml = (app) => {
    const notif = app.state.notification;
    if (!notif.visible) return '';
    return `
        <div class="mb-6 p-4 rounded-2xl border animate-fade-in ${notif.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'} font-medium flex items-center gap-3 shadow-sm">
            ${notif.type === 'error' ? '⚠️' : '✅'} ${notif.message}
        </div>`;
};

export const renderPaymentModal = (app, container) => {
    if (app.state.showPaymentModal && app.state.selectedClassForPayment) {
        const cls = app.state.selectedClassForPayment;
        const modalHtml = `
            <div class="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
                <div class="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-xl">
                    <h3 class="text-2xl font-light text-stone-800 mb-2">Paiement en ligne</h3>
                    <p class="mb-6 border-b pb-4 text-stone-600">
                        Réservation : <strong class="text-emerald-800">${cls.title}</strong>
                    </p>
                    <form onsubmit="app.confirmPayment(event)" class="space-y-4">
                        <div class="flex gap-2 mb-6 p-1 bg-stone-100 rounded-xl">
                            <button type="button" onclick="app.state.paymentMethod='card'; app.render()" class="flex-1 py-2 rounded-lg text-sm font-medium ${app.state.paymentMethod==='card' ? 'bg-white shadow-sm text-emerald-800' : 'text-stone-500'}">Carte</button>
                            <button type="button" onclick="app.state.paymentMethod='credits'; app.render()" class="flex-1 py-2 rounded-lg text-sm font-medium ${app.state.paymentMethod==='credits' ? 'bg-white shadow-sm text-emerald-800' : 'text-stone-500'}">Crédits</button>
                        </div>
                        ${app.state.paymentMethod === 'card' ? `
                            <input type="text" placeholder="Numéro de carte" class="w-full p-3 border rounded-xl" required>
                        ` : `
                            <div class="bg-emerald-50 p-4 rounded-xl text-center text-emerald-800">
                                Solde actuel : ${app.state.currentUser.credits_balance} crédits
                            </div>
                        `}
                        <div class="flex gap-3">
                            <button type="button" onclick="app.cancelPayment()" class="flex-1 py-3 border rounded-xl">Annuler</button>
                            <button type="submit" class="flex-1 py-3 bg-emerald-800 text-white rounded-xl">Confirmer</button>
                        </div>
                    </form>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', modalHtml);
    }
};
