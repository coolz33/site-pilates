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
        const title = app.state.adminTemplateForm?.title?.trim();
        
        if (!title) {
            app.showNotification("Veuillez d'abord saisir un titre pour le modèle.", "warning");
            return;
        }
        app.showNotification("Génération IA en cours...", "info");
        
        try {
            const prompt = `Génère une description riche mais en une seule phrase (maximum 35 mots) pour un modèle de cours de Pilates intitulé "${title}". Décris brièvement le contenu et les bienfaits principaux de la séance. Le ton doit être professionnel, bienveillant et invitant. Ne renvoie que le texte de la description, sans guillemets ni introduction.`;
            
            const desc = await callGemini(prompt, app.state.currentUser?.id);
            
            if (desc && !desc.startsWith("Erreur") && !desc.startsWith("Désolé")) {
                if (!app.state.adminTemplateForm) app.state.adminTemplateForm = {};
                app.state.adminTemplateForm.description = desc.trim();
                app.showNotification("Description générée avec succès !");
            } else {
                app.showNotification("L'IA n'a pas pu générer la description.", "error");
            }
        } catch (err) {
            app.showNotification("Erreur de connexion à l'IA.", "error");
        }
        app.render();
    }
};