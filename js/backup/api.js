// En production, on utilise un chemin relatif pour que le navigateur 
// contacte le NAS sur lequel il a chargé la page.
export const API_URL = '/api';

export const callGemini = async (prompt, userId = null) => {
    try {
        const response = await fetch(`${API_URL}/ai/consult`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, userId })
        });
        
        const data = await response.json();
        if (!response.ok) {
            return data.answer || data.error || `Erreur (${response.status})`;
        }
        return data.answer || "Je n'ai pas pu formuler de réponse.";
    } catch (error) {
        console.error("Erreur IA:", error);
        return "Désolé, l'assistant est momentanément indisponible.";
    }
};