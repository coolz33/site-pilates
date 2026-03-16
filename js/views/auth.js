import { getNotificationHtml } from './components.js';
import '../services/CodeInput.js'; // Assurez-vous que ce chemin est correct et que CodeInput.js définit le custom element.

export const authView = (app, mode) => {
    const isLogin = mode === 'connexion';
    const isVerifying = app.state.isVerifyingEmail;
    const isRegister = mode === 'inscription'; // Ajout de cette variable
    const isResetPassword = mode === 'reset-password';
    const hasResetToken = app.state.resetPasswordToken;
    const regData = app.state.registrationData || {};

    return `
        <div class="min-h-[60vh] md:min-h-[70vh] flex items-center justify-center bg-stone-50 py-8 md:py-12 px-4 dark:bg-stone-900">
            <div class="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                <div class="text-center mb-8">
                    <h2 class="text-3xl font-light text-stone-800 dark:text-stone-100">
                        ${isLogin ? 'Connexion' : (isVerifying ? 'Vérification de l\'email' : (isResetPassword ? (hasResetToken ? 'Nouveau mot de passe' : 'Mot de passe oublié ?') : 'Créer un compte'))}
                    </h2>
                    <p class="mt-2 text-stone-500 dark:text-stone-400">
                        ${isLogin ? 'Accédez à votre espace pour réserver.' : (isVerifying ? 'Un code vous a été envoyé par mail.' : (isResetPassword ? (hasResetToken ? 'Saisissez votre nouveau mot de passe.' : 'Saisissez votre email pour réinitialiser votre mot de passe.') : 'Rejoignez le studio Équilibre Pilates.'))}
                    </p>
                </div>
                <form id="auth-main-form" class="space-y-5 ${isVerifying ? 'hidden' : ''}">
                    ${!isLogin ? `
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="auth-firstname" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Prénom</label>
                            <input type="text" id="auth-firstname" ${isVerifying ? 'disabled' : ''} value="${regData.firstName || ''}" required class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white dark:bg-stone-700 dark:border-stone-600" />
                        </div>
                        <div>
                            <label for="auth-lastname" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Nom</label>
                            <input type="text" id="auth-lastname" ${isVerifying ? 'disabled' : ''} value="${regData.lastName || ''}" required class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white dark:bg-stone-700 dark:border-stone-600" />
                        </div>
                    </div>
                    <div>
                        <label for="auth-address" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Adresse postale</label>
                        <input type="text" id="auth-address" ${isVerifying ? 'disabled' : ''} value="${regData.address || ''}" required placeholder="123 rue de la Paix, 75000 Paris" class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white dark:bg-stone-700 dark:border-stone-600" />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div class="sm:col-span-1">
                            <label for="auth-zipcode" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Code Postal</label>
                            <input type="text" id="auth-zipcode" ${isVerifying ? 'disabled' : ''} value="${regData.zipCode || ''}" required placeholder="75000" class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white dark:bg-stone-700 dark:border-stone-600" />
                        </div>
                        <div class="sm:col-span-2">
                            <label for="auth-city" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Ville</label>
                            <input type="text" id="auth-city" ${isVerifying ? 'disabled' : ''} value="${regData.city || ''}" required placeholder="Paris" class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white dark:bg-stone-700 dark:border-stone-600" />
                        </div>
                    </div>
                    <div>
                        <label for="auth-phone" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Téléphone</label>
                        <input type="tel" id="auth-phone" ${isVerifying ? 'disabled' : ''} value="${regData.phone || ''}" required placeholder="06 12 34 56 78" class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white dark:bg-stone-700 dark:border-stone-600" />
                    </div>
                    ` : ''}
                    <div>
                        <label for="auth-email" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Email</label>
                        <input type="email" id="auth-email" ${isVerifying ? 'disabled' : ''} value="${regData.email || ''}" required class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white dark:bg-stone-700 dark:border-stone-600" />
                    </div>
                    <div>
                        <label for="auth-password" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Mot de passe</label>
                        <input type="password" id="auth-password" ${isVerifying ? 'disabled' : ''} required class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white dark:bg-stone-700 dark:border-stone-600" />
                    </div>
                    ${!isLogin ? `
                    <div>
                        <label for="auth-confirm-password" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Confirmer le mot de passe</label>
                        <input type="password" id="auth-confirm-password" ${isVerifying ? 'disabled' : ''} required class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white dark:bg-stone-700 dark:border-stone-600" />
                    </div>
                    <div class="flex items-center gap-3 p-1 ${isVerifying ? 'opacity-50 pointer-events-none' : ''}">
                        <input type="checkbox" id="auth-newsletter" ${regData.newsletter_subscribed ? 'checked' : ''} class="w-5 h-5 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500 dark:bg-stone-600 dark:border-stone-500">
                        <label for="auth-newsletter" class="text-sm text-stone-600 cursor-pointer dark:text-stone-300">
                            Je souhaite recevoir les actualités et promotions du studio.
                        </label>
                    </div>
                    ${isVerifying ? `
                    <div class="animate-fade-in p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 shadow-inner">
                        <label for="auth-code" class="block text-xs font-bold text-emerald-800 mb-2 text-center uppercase tracking-widest dark:text-emerald-400">Saisissez le code reçu</label>
                        <code-input id="auth-code-input" name="code" size="6" legend=""></code-input>
                        <p class="text-[10px] text-emerald-600 mt-2 text-center dark:text-emerald-400 italic">Vérifiez vos courriers indésirables (spams)</p>
                        <button type="button" onclick="app.resendVerificationCode()" id="resend-code-btn" class="mt-4 w-full py-2 text-sm text-emerald-700 font-medium rounded-xl border border-emerald-200 hover:bg-emerald-50 transition-colors dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/30" ${app.state.resendCodeTimer > 0 ? 'disabled' : ''}>
                            ${app.state.resendCodeTimer > 0 ? `Renvoyer le code (${app.state.resendCodeTimer}s)` : 'Renvoyer le code'}
                        </button>
                    </div>
                    ` : ''}
                    ` : ''}
                    ${isResetPassword ? `
                        ${hasResetToken ? `
                            <div>
                                <label for="reset-password-new" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Nouveau mot de passe</label>
                                <input type="password" id="reset-password-new" required class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white dark:bg-stone-700 dark:border-stone-600" />
                            </div>
                            <div>
                                <label for="reset-password-confirm" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Confirmer le nouveau mot de passe</label>
                                <input type="password" id="reset-password-confirm" required class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white dark:bg-stone-700 dark:border-stone-600" />
                            </div>
                        ` : `<!-- Formulaire pour demander un lien de réinitialisation (email seulement) -->
                            <div>
                                <label for="auth-email" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Votre email</label>
                                <input type="email" id="auth-email" required class="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white dark:bg-stone-700 dark:border-stone-600" />
                            </div>
                        `}
                    ` : ''}
                    <button type="submit" class="w-full py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition font-medium mt-6 dark:bg-emerald-700 dark:hover:bg-emerald-600">
                        ${isLogin ? 'Se connecter' : (isResetPassword ? (hasResetToken ? 'Changer mon mot de passe' : 'Envoyer le lien de réinitialisation') : "Valider l'inscription")}
                    </button>
                </form>

                <!-- Code Verification Section (conditionally displayed) -->
                <form id="auth-code-verification-form" class="space-y-5 ${isRegister && isVerifying ? '' : 'hidden'}">
                    <div class="animate-fade-in p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 shadow-inner">
                        <label for="auth-code-input" class="block text-xs font-bold text-emerald-800 mb-2 text-center uppercase tracking-widest dark:text-emerald-400">Saisissez le code reçu</label>
                        <code-input id="auth-code-input" name="code" size="6" legend=""></code-input>
                        <p class="text-[10px] text-emerald-600 mt-2 text-center dark:text-emerald-400 italic">Vérifiez vos courriers indésirables (spams)</p>
                        <button type="button" onclick="app.resendVerificationCode()" id="resend-code-btn" class="mt-4 w-full py-2 text-sm text-emerald-700 font-medium rounded-xl border border-emerald-200 hover:bg-emerald-50 transition-colors dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/30" ${app.state.resendCodeTimer > 0 ? 'disabled' : ''}>
                            <span id="resend-code-text">${app.state.resendCodeTimer > 0 ? `Renvoyer le code (${app.state.resendCodeTimer}s)` : 'Renvoyer le code'}</span>
                        </button>
                    </div>
                    <button type="submit" class="w-full py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition font-medium mt-6 dark:bg-emerald-700 dark:hover:bg-emerald-600">
                        Finaliser l'inscription
                    </button>
                    <div class="mt-6 text-center text-sm text-stone-600 dark:text-stone-300">
                        <button onclick="app.cancelRegistrationVerification()" class="text-emerald-700 font-medium hover:underline dark:text-emerald-400">Annuler et revenir</button>
                    </div>
                </form>
                <div class="mt-6 text-center text-sm text-stone-600 dark:text-stone-300">
                    ${isLogin ?
                        `Pas encore de compte ? <button onclick="app.navigate('inscription')" class="text-emerald-700 font-medium hover:underline dark:text-emerald-400">S'inscrire</button>
                        <br><br>
                        <button onclick="app.navigate('reset-password')" class="text-emerald-700 font-medium hover:underline dark:text-emerald-400">Mot de passe oublié ?</button>
                        ` : (isResetPassword ? `
                            <button onclick="app.navigate('connexion')" class="text-emerald-700 font-medium hover:underline dark:text-emerald-400">Retour à la connexion</button>
                        ` : `
                            Déjà un compte ? <button onclick="app.navigate('connexion')" class="text-emerald-700 font-medium hover:underline dark:text-emerald-400">Se connecter</button>
                        `)
                    }
                </div>
            </div>
        </div>
    `;
};
