// En production, on utilise un chemin relatif pour que le navigateur 
// contacte le NAS sur lequel il a chargé la page.
export const API_URL = '/api';

export const callGemini = async (prompt) => {
    const apiKey = ""; // Clé injectée par l'environnement
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    let retries = 5;
    let delay = 1000;

    while (retries > 0) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "Je n'ai pas pu formuler de réponse.";
        } catch (error) {
            retries--;
            if (retries === 0) return "Désolé, l'assistant est momentanément indisponible.";
            await new Promise(res => setTimeout(res, delay));
            delay *= 2;
        }
    }
};