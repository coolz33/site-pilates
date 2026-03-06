import { callGemini } from '../api.js';

export const aiService = {
    async askAi(app) {
        const promptInput = document.getElementById('ai-prompt').value;
        if (!promptInput.trim()) return;
        app.state.isAiLoading = true;
        app.render();

        const date = new Date(app.state.currentDate);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(date.setDate(diff));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const availableClasses = app.state.classes
            .filter(c => {
                const cDate = new Date(c.date);
                return cDate >= startOfWeek && cDate <= endOfWeek;
            })
            .map(c => `- ${c.title} le ${new Date(c.date).toLocaleDateString('fr-FR', { weekday: 'long' })} à ${c.time} (${c.duration}min) : ${c.description || 'Cours de Pilates'}`)
            .join('\n');

        const fullPrompt = `Tu es un coach de Pilates bienveillant et professionnel. Voici les cours au planning cette semaine dans notre studio :\n${availableClasses}\n\nUn élève te dit : "${promptInput}".\nEn une seule phrase courte et chaleureuse, conseille-lui le cours le plus pertinent de la liste en expliquant rapidement pourquoi. Si aucun cours ne correspond vraiment, propose-lui un cours au hasard en douceur. Ne mets pas de texte en gras.`;

        app.state.aiResponse = await callGemini(fullPrompt, app.state.currentUser?.id);
        app.state.isAiLoading = false;
        app.render();
    },

    async generateAdminDescription(app) {
        const title = document.getElementById('template-title').value;
        if (!title) {
            app.showNotification("Saisissez un titre.", 'error');
            return;
        }

        const btn = document.getElementById('btn-generate-desc');
        btn.innerHTML = 'Génération...';
        btn.disabled = true;

        const prompt = `Agis comme le gérant d'un studio de Pilates moderne. Rédige une description très courte (1 ou 2 phrases maximum) pour un cours qui s'appelle "${title}". Le ton doit être professionnel, apaisant et donner envie de s'inscrire. Ne mets pas de guillemets.`;
        const desc = await callGemini(prompt);

        document.getElementById('template-desc').value = desc;
        btn.innerHTML = "✨ Suggérer avec l'IA";
        btn.disabled = false;
    }
};