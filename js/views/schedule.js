import { icons } from '../icons.js';
import { getNotificationHtml } from './components.js';

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
            ? `<div class="text-center text-stone-400 text-sm py-4">Aucun cours</div>`
            : dayClasses.map(c => {
                const isBooked = st.currentUser && c.bookedUsers.includes(st.currentUser.id);
                const isPast = new Date(`${c.date}T${c.time}`) < new Date();

                return `
                    <div class="p-4 rounded-xl border ${isBooked ? 'bg-emerald-800 text-white' : (isPast ? 'bg-stone-100 text-stone-500' : 'bg-white')} mb-3 shadow-sm">
                        <div class="font-medium">${c.time} - ${c.title}</div>
                        <div class="text-xs opacity-80 mb-2">${c.duration} min | ${c.bookedUsers.length}/${c.capacity} pers.</div>
                        <div class="text-xs font-semibold mb-3 ${isBooked ? 'text-emerald-200' : (isPast ? 'text-stone-400' : 'text-emerald-700')}">${c.credits_price || 1} crédits</div>
                        <button onclick="app.initiateBooking(${c.id})" ${isBooked || isPast ? 'disabled' : ''} class="w-full py-2 rounded-lg text-sm ${isBooked ? 'bg-emerald-900 text-emerald-200 cursor-default' : (isPast ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}">
                            ${isBooked ? 'Inscrit' : (isPast ? 'Terminé' : 'Réserver')}
                        </button>
                    </div>`;
            }).join('');

        return `
            <div class="flex flex-col">
                <div class="text-center mb-4">
                    <div class="text-sm text-stone-500 uppercase">${d.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                    <div class="text-2xl font-light">${d.getDate()}</div>
                </div>
                ${classesHtml}
            </div>`;
    }).join('');

    return `
        <div class="min-h-[70vh] bg-stone-50 pt-8 pb-12 animate-fade-in">
            <div class="max-w-7xl mx-auto px-4">
                ${getNotificationHtml(app)}
                <!-- Section Assistant IA -->
                <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 mb-10">
                    <h2 class="text-xl font-medium text-stone-800 mb-4 flex items-center gap-2">
                        <span class="text-emerald-700">${icons.sparkles}</span> Quel cours est fait pour vous ?
                    </h2>
                    <div class="flex flex-col md:flex-row gap-4">
                        <input type="text" id="ai-prompt" placeholder="Ex: Je cherche un cours dynamique pour renforcer mon dos..." class="flex-1 p-3 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
                        <button onclick="app.askAi()" class="px-6 py-3 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 min-w-[160px] active:scale-[0.98]">
                            ${st.isAiLoading ? '<span class="animate-spin">⏳</span> Recherche...' : 'Demander à l\'IA'}
                        </button>
                    </div>
                    ${st.aiResponse ? `<div class="mt-4 p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 animate-fade-in">${st.aiResponse}</div>` : ''}
                </div>

                <div class="flex justify-between items-center mb-10">
                    <h1 class="text-3xl font-light capitalize">Planning - ${monthName}</h1>
                    <div class="flex gap-2">
                        <button onclick="app.changeWeek(-1)" class="p-2 border rounded-full">←</button>
                        <button onclick="app.changeWeek(1)" class="p-2 border rounded-full">→</button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-7 gap-4">${daysHtml}</div>
            </div>
        </div>`;
};
