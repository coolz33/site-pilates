import { icons } from '../icons.js';
import { API_URL } from '../api.js';

export const renderNavbar = (app) => {
    const st = app.state;
    const navHtml = `
        <nav class="bg-white shadow-sm sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-20">
                    <div class="flex items-center cursor-pointer" onclick="app.navigate('home')">
                        <span class="text-2xl font-light text-emerald-800 tracking-wider">ÉQUILIBRE<span class="font-semibold">PILATES</span></span>
                    </div>
                    <div class="hidden md:flex items-center space-x-8">
                        <button onclick="app.navigate('home')" class="text-stone-600 hover:text-emerald-700 transition ${st.view === 'home' ? 'font-semibold text-emerald-800' : ''}">Accueil</button>
                        <button onclick="app.navigate('about')" class="text-stone-600 hover:text-emerald-700 transition ${st.view === 'about' ? 'font-semibold text-emerald-800' : ''}">Le Pilates</button>
                        <button onclick="app.navigate('schedule')" class="text-stone-600 hover:text-emerald-700 transition ${st.view === 'schedule' ? 'font-semibold text-emerald-800' : ''}">Planning & Réservation</button>
                        <button onclick="app.navigate('contact')" class="text-stone-600 hover:text-emerald-700 transition ${st.view === 'contact' ? 'font-semibold text-emerald-800' : ''}">Contact</button>
                        ${st.currentUser ? `
                        <div class="flex items-center gap-4 border-l pl-6">
                            <button onclick="app.navigate('profile')" class="text-sm text-stone-600 hover:text-emerald-700 font-medium">Bonjour, ${st.currentUser.firstName}</button>
                            ${st.currentUser.role === 'admin' ? `<button onclick="app.navigate('admin')" class="text-sm font-medium text-emerald-700 hover:underline">Admin</button>` : ''}
                            <button onclick="app.logout()" class="text-sm text-red-600 hover:text-red-800">Déconnexion</button>
                        </div>` : `
                        <div class="flex items-center gap-4 border-l pl-6">
                            <button onclick="app.navigate('login')" class="text-sm font-medium text-stone-600 hover:text-emerald-700">Connexion</button>
                            <button onclick="app.navigate('register')" class="px-4 py-2 bg-emerald-700 text-white text-sm rounded-full hover:bg-emerald-800 transition shadow-sm">S'inscrire</button>
                        </div>`}
                    </div>
                    <div class="flex items-center md:hidden">
                        <button onclick="app.toggleMenu()" class="text-stone-600">${st.isMenuOpen ? icons.close : icons.menu}</button>
                    </div>
                </div>
            </div>
            ${st.isMenuOpen ? `<div class="md:hidden bg-white border-t border-stone-100 px-4 pt-2 pb-6 space-y-2 shadow-lg">...</div>` : ''}
        </nav>`;
    document.getElementById('navbar').innerHTML = navHtml;
};

export const renderFooter = (app) => {
    document.getElementById('footer').innerHTML = `
        <footer class="bg-stone-900 text-stone-400 py-12">
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
