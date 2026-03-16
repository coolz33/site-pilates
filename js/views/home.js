import { icons } from '../icons.js';
import { getNotificationHtml } from './components.js';

export const homeView = (app) => `
    <div class="animate-fade-in">
        <section class="relative min-h-[35vh] md:min-h-[40vh] flex items-center justify-center bg-stone-100 dark:bg-stone-950/50 overflow-hidden py-8 md:py-12 max-w-screen-2xl mx-auto">
            <div class="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
                <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-200 mix-blend-multiply filter blur-[80px]"></div>
                <div class="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-stone-300 mix-blend-multiply filter blur-[80px]"></div>
            </div>
            <div class="relative z-10 text-center px-4 max-w-4xl mx-auto">
                <h1 class="text-5xl md:text-7xl font-light text-stone-800 mb-6 tracking-tight dark:text-stone-100">
                    Retrouvez votre <span class="italic text-emerald-800 font-serif dark:text-emerald-400">harmonie</span>
                </h1>
                <p class="text-lg md:text-xl text-stone-600 mb-10 max-w-2xl mx-auto font-light leading-relaxed dark:text-stone-300">
                    Un espace dédié au mouvement en conscience, pour renforcer le corps et apaiser l'esprit. Rejoignez notre studio au cœur de la ville.
                </p>
                <button onclick="app.navigate('planning')" class="px-8 py-4 bg-stone-800 text-white rounded-full text-lg hover:bg-emerald-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 dark:bg-emerald-600 dark:hover:bg-emerald-500">
                    Voir le planning et réserver
                </button>
            </div>
        </section>
        <section class="py-8 md:py-12 bg-white dark:bg-stone-800/30">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    <div class="p-6 rounded-2xl bg-stone-50 border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                        <div class="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 mb-6 dark:bg-emerald-900/50 dark:text-emerald-300">${icons.user}</div>
                        <h3 class="text-xl font-medium text-stone-800 mb-4 dark:text-stone-100">Accompagnement Personnalisé</h3>
                        <p class="text-stone-600 font-light dark:text-stone-300">Des cours en petits groupes pour garantir des corrections précises et une progression sécuritaire.</p>
                    </div>
                    <div class="p-6 rounded-2xl bg-stone-50 border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                        <div class="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 mb-6 dark:bg-emerald-900/50 dark:text-emerald-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                        </div>
                        <h3 class="text-xl font-medium text-stone-800 mb-4 dark:text-stone-100">Méthode Authentique</h3>
                        <p class="text-stone-600 font-light dark:text-stone-300">Nous enseignons la méthode classique tout en l'adaptant aux connaissances biomécaniques modernes.</p>
                    </div>
                    <div class="p-6 rounded-2xl bg-stone-50 border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                        <div class="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 mb-6 dark:bg-emerald-900/50 dark:text-emerald-300">${icons.calendar}</div>
                        <h3 class="text-xl font-medium text-stone-800 mb-4 dark:text-stone-100">Flexibilité</h3>
                        <p class="text-stone-600 font-light dark:text-stone-300">Un planning varié adapté à tous les emplois du temps, avec un système de réservation simple en ligne.</p>
                    </div>
                </div>
            </div>
        </section>
    </div>
`;