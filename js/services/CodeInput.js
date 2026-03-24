/**
 * @file CodeInput.js
 * @description Définit un élément personnalisé <code-input> pour la saisie d'un code de vérification.
 */

class CodeInput extends HTMLElement {
    constructor() {
        super();
        // Utilisation du Shadow DOM pour encapsuler le style et la structure
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    static get observedAttributes() {
        return ['value'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'value' && oldValue !== newValue) {
            this.value = newValue;
        }
    }

    connectedCallback() {
        this.shadowRoot.querySelectorAll('.code-input-field').forEach((input, index, array) => {
            // Avance au champ suivant lors de la saisie
            input.addEventListener('input', (e) => {
                // On ne garde que les chiffres
                const val = input.value.replace(/\D/g, '');
                input.value = val;

                if (val && index < array.length - 1) {
                    array[index + 1].focus();
                }
                this.updateValue();
                this.checkComplete(); // Vérifie si le code est complet
            });

            // Gestion du copier-coller
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const data = (e.clipboardData || window.clipboardData).getData('text');
                const digits = data.replace(/\D/g, '').split('').slice(0, array.length - index); // Limite au nombre de champs restants
                
                digits.forEach((char, i) => {
                    const targetInput = array[index + i];
                    if (targetInput) {
                        targetInput.value = char;
                    }
                });
                this.updateValue();
                
                // Focus le dernier champ rempli ou le suivant
                const nextToFocus = Math.min(index + digits.length, array.length - 1);
                array[nextToFocus].focus();
                
                this.checkComplete(); // Vérifie si le code est complet après le collage
            });
            // Retourne au champ précédent lors de la suppression (Backspace)
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && input.value === '' && index > 0) {
                    array[index - 1].focus();
                }
            });
        });
    }

    // Médote utilitaire pour envoyer un événement personnalisé quand tout est rempli
    checkComplete() {
        const val = this.value;
        if (val.length === 6) {
            // Délai pour s'assurer que l'attribut value a bien été mis à jour via updateValue()
            setTimeout(() => {
                this.dispatchEvent(new CustomEvent('complete', { 
                    detail: { value: val },
                    bubbles: true 
                }));
            }, 50);
        }
    }

    // Met à jour la valeur combinée de l'élément personnalisé
    updateValue() {
        const value = Array.from(this.shadowRoot.querySelectorAll('.code-input-field'))
                           .map(input => input.value)
                           .join('');
        this.setAttribute('value', value); // Met à jour l'attribut 'value' de l'élément hôte
    }

    // Getter pour récupérer la valeur du code
    get value() {
        return this.getAttribute('value') || '';
    }

    // Setter pour définir la valeur du code (utile si vous voulez pré-remplir)
    set value(val) {
        this.setAttribute('value', val);
        const fields = this.shadowRoot.querySelectorAll('.code-input-field');
        for (let i = 0; i < fields.length; i++) {
            fields[i].value = val[i] || '';
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .code-input-container {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                }
                .code-input-field {
                    width: 40px; /* Ajustez la taille selon vos besoins */
                    height: 40px;
                    text-align: center;
                    font-size: 1.25rem;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    background-color: var(--bg-input-light, #fff); /* Pour le thème */
                    color: var(--text-input-light, #333);
                }
                .code-input-field.is-valid {
                    border-color: #10b981; /* emerald-500 */
                    background-color: #f0fdf4; /* emerald-50 */
                    outline: none;
                }
            </style>
            <div class="code-input-container">
                ${Array(6).fill(0).map(() => `<input type="text" maxlength="1" class="code-input-field" />`).join('')}
            </div>
        `;
    }
}

// Enregistre l'élément personnalisé avec le navigateur
customElements.define('code-input', CodeInput);