import { icons } from '../icons.js';
import { getNotificationHtml } from './components.js';

export const scheduleView = (app) => {
    const st = app.state;
    const date = new Date(st.currentDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(date.setDate(diff));

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
                return `
                    <div class="p-4 rounded-xl border ${isBooked ? 'bg-emerald-800 text-white' : 'bg-white'} mb-3 shadow-sm">
                        <div class="font-medium">${c.time} - ${c.title}</div>
                        <div class="text-xs opacity-80 mb-3">${c.duration} min | ${c.bookedUsers.length}/${c.capacity} pers.</div>
                        <button onclick="app.initiateBooking(${c.id})" class="w-full py-2 rounded-lg text-sm ${isBooked ? 'bg-emerald-600' : 'bg-emerald-50 text-emerald-700'}">
                            ${isBooked ? 'Annuler' : 'Réserver'}
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
                <div class="flex justify-between items-center mb-10">
                    <h1 class="text-3xl font-light">Planning de la semaine</h1>
                    <div class="flex gap-2">
                        <button onclick="app.changeWeek(-1)" class="p-2 border rounded-full">←</button>
                        <button onclick="app.changeWeek(1)" class="p-2 border rounded-full">→</button>
                    </div>
                </div>

                <!-- Section Assistant IA -->
                <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 mb-10">
                    <h2 class="text-xl font-medium text-stone-800 mb-4 flex items-center gap-2">
                        <span class="text-emerald-700">${icons.sparkles}</span> Quel cours est fait pour vous ?
                    </h2>
                    <div class="flex flex-col md:flex-row gap-4">
                        <input type="text" id="ai-prompt" placeholder="Ex: Je cherche un cours dynamique pour renforcer mon dos..." class="flex-1 p-3 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
                        <button onclick="app.askAi()" class="px-6 py-3 bg-emerald-800 text-white rounded-xl hover:bg-emerald-900 transition flex items-center justify-center gap-2 min-w-[160px]">
                            ${st.isAiLoading ? '<span class="animate-spin">⏳</span> Recherche...' : 'Demander à l\'IA'}
                        </button>
                    </div>
                    ${st.aiResponse ? `<div class="mt-4 p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 animate-fade-in">${st.aiResponse}</div>` : ''}
                </div>

                <div class="grid grid-cols-1 md:grid-cols-7 gap-4">${daysHtml}</div>
            </div>
        </div>`;
};
