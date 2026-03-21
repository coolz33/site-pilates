/**
 * @file utils.js
 * @description Boîte à outils contenant des fonctions réutilisables.
 * Simplifie le code et évite la duplication dans d'autres fichiers de l'application.
 */

/**
 * Trie un tableau d'objets en fonction d'une colonne et d'une direction.
 * @param {Array} array - Le tableau à trier.
 * @param {string} column - La clé (colonne) sur laquelle trier.
 * @param {string} direction - 'asc' pour croissant, 'desc' pour décroissant (par défaut 'asc').
 * @returns {Array} Le tableau trié.
 */
export function sortArray(array, column, direction = 'asc') {
    if (!array || !Array.isArray(array)) return [];
    
    return array.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // Gère les valeurs null/undefined
        if (valA == null) valA = '';
        if (valB == null) valB = '';

        // Si ce sont des dates françaises (JJ/MM/AAAA)
        if (typeof valA === 'string' && valA.match(/^\d{2}\/\d{2}\/\d{4}/)) {
            valA = valA.split('/').reverse().join('-');
        }
        if (typeof valB === 'string' && valB.match(/^\d{2}\/\d{2}\/\d{4}/)) {
            valB = valB.split('/').reverse().join('-');
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Filtre un tableau d'objets (comptabilité) ayant une propriété "date" (format JJ/MM/AAAA ou YYYY-MM-DD).
 * @param {Array} array - Le tableau à filtrer
 * @param {string} startDate - Date de début (YYYY-MM-DD)
 * @param {string} endDate - Date de fin (YYYY-MM-DD)
 * @returns {Array} Le tableau filtré
 */
export function filterArrayByDateRange(array, startDate, endDate) {
    if (!array || !Array.isArray(array)) return [];

    const parseDate = (dStr) => {
        // Supprime l'heure si présente
        const datePart = dStr.split(' ')[0];
        // Format FR : JJ/MM/AAAA
        if (datePart.includes('/')) {
            const [d, m, y] = datePart.split('/');
            return `${y}-${m}-${d}`;
        }
        return datePart;
    };

    return array.filter(item => {
        if (!item.date) return false;
        const itemDate = parseDate(item.date);
        
        let isValid = true;
        if (startDate && itemDate < startDate) isValid = false;
        if (endDate && itemDate > endDate) isValid = false;
        return isValid;
    });
}

/**
 * Formate un nombre en prix (€).
 * @param {number} price - Le prix.
 * @returns {string} Le prix formaté.
 */
export function formatPrice(price) {
    if (isNaN(price)) return '0,00 €';
    return Number(price).toFixed(2).replace('.', ',') + ' €';
}

/**
 * Tronque une chaîne de caractères longue.
 * @param {string} str - La chaîne à tronquer.
 * @param {number} maxLength - La taille maximale.
 * @returns {string} La chaîne tronquée avec "..."
 */
export function truncateText(str, maxLength = 50) {
    if (!str || typeof str !== 'string') return '';
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

/**
 * Envoie un email (Fonction simulée centralisée, à relier à une vraie API si besoin).
 * @param {string} to - Adresse de destination.
 * @param {string} subject - Sujet de l'email.
 * @param {string} body - Contenu du corps du message.
 */
export function sendEmailMock(to, subject, body) {
    // Dans une vraie application, faire un fetch("/api/newsletter/send") ici
    console.log(`[EMAIL] Envoi à: ${to}`);
    console.log(`[EMAIL] Sujet: ${subject}`);
    console.log(`[EMAIL] Body: ${body}`);
    return Promise.resolve({ success: true, message: 'Email simulé envoyé' });
}

/**
 * Génère le composant HTML de pagination (Prev, 1, 2, 3... Next)
 * @param {number} currentPage - Page courante
 * @param {number} totalPages - Nombre total de pages
 * @param {string} onPageChangeFnName - Nom de la fonction (ex: 'app.setAdminClassesPage')
 * @returns {string} Le code HTML de la pagination
 */
export function generatePaginationHtml(currentPage, totalPages, onPageChangeFnName) {
    if (totalPages <= 1) return `
        <div class="border-top bg-light" style="height: 10px; border-bottom-left-radius: 1.5rem; border-bottom-right-radius: 1.5rem;"></div>
    `;

    return `
        <div class="p-2 border-top bg-light d-flex justify-content-between align-items-center" style="border-bottom-left-radius: 1.5rem; border-bottom-right-radius: 1.5rem;">
            <span class="text-muted fw-medium" style="font-size: 0.75rem;">Page ${currentPage}/${totalPages}</span>
            <div class="d-flex gap-1">
                <button onclick="${onPageChangeFnName}(${currentPage - 1})" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 0.75rem;" ${currentPage === 1 ? 'disabled' : ''}>&lt;</button>
                ${Array.from({length: totalPages}, (_, i) => i + 1).map(p => {
                    if (totalPages > 7) {
                        if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) return `<button onclick="${onPageChangeFnName}(${p})" class="btn btn-sm ${p === currentPage ? 'btn-emerald' : 'btn-outline-secondary'} py-0 px-2" style="font-size: 0.75rem;">${p}</button>`;
                        else if (p === currentPage - 2 || p === currentPage + 2) return `<span class="px-1 text-muted align-self-end" style="font-size: 0.75rem;">...</span>`;
                        return '';
                    }
                    return `<button onclick="${onPageChangeFnName}(${p})" class="btn btn-sm ${p === currentPage ? 'btn-emerald' : 'btn-outline-secondary'} py-0 px-2" style="font-size: 0.75rem;">${p}</button>`;
                }).join('').replace(/(<span.*?<\/span>)+/g, '<span class="px-1 text-muted align-self-end" style="font-size: 0.75rem;">...</span>')}
                <button onclick="${onPageChangeFnName}(${currentPage + 1})" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 0.75rem;" ${currentPage === totalPages ? 'disabled' : ''}>&gt;</button>
            </div>
        </div>
    `;
}

/**
 * Génère un sélecteur de limite de résultats (10, 20, 50, Tous)
 * @param {number|string} currentLimit - Limite actuellement sélectionnée
 * @param {string} onLimitChangeFnName - Nom de la fonction appelée lors du changement
 * @returns {string} Le code HTML du selecteur
 */
export function generateLimitSelectorHtml(currentLimit, onLimitChangeFnName) {
    return `
        <select onchange="${onLimitChangeFnName}(this.value)" class="form-select form-select-sm py-0 ps-2 pe-4 text-muted cursor-pointer" style="width: auto; min-width: 75px; font-size: 0.75rem; height: 26px;">
            <option value="10" ${currentLimit === 10 || currentLimit === '10' ? 'selected' : ''}>10</option>
            <option value="20" ${currentLimit === 20 || currentLimit === '20' ? 'selected' : ''}>20</option>
            <option value="50" ${currentLimit === 50 || currentLimit === '50' ? 'selected' : ''}>50</option>
            <option value="100" ${currentLimit === 100 || currentLimit === '100' ? 'selected' : ''}>100</option>
            <option value="all" ${currentLimit === 'all' ? 'selected' : ''}>Tous</option>
        </select>
    `;
}
