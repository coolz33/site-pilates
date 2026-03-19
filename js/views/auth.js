import { getNotificationHtml } from './components.js';
import '../services/CodeInput.js'; // Assurez-vous que ce chemin est correct et que CodeInput.js définit le custom element.

export const authView = (app, mode) => {
    const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>`;
    const eyeSlashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z"/><path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z"/></svg>`;

    const isLogin = mode === 'connexion';
    const isVerifying = app.state.isVerifyingEmail;
    const isRegister = mode === 'inscription'; // Ajout de cette variable
    const isResetPassword = mode === 'reset-password';
    const hasResetToken = app.state.resetPasswordToken;
    const regData = app.state.registrationData || {};
    
    const containerMaxWidth = (isRegister && !isVerifying) ? 'max-w-3xl' : 'max-w-md';

    return `
        <div class="min-h-[60vh] flex items-center justify-center bg-stone-50 py-4 px-4 dark:bg-stone-900">
            <div class="${containerMaxWidth} w-full bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700 transition-all duration-300">
                <div class="text-center mb-4">
                    <h2 class="text-2xl font-light text-stone-800 dark:text-stone-100">
                        ${isLogin ? 'Connexion' : (isVerifying ? 'Vérification de l\'email' : (isResetPassword ? (hasResetToken ? 'Nouveau mot de passe' : 'Mot de passe oublié ?') : 'Créer un compte'))}
                    </h2>
                    <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
                        ${isLogin ? 'Accédez à votre espace pour réserver.' : (isVerifying ? 'Un code vous a été envoyé par mail.' : (isResetPassword ? (hasResetToken ? 'Saisissez votre nouveau mot de passe.' : 'Saisissez votre email pour réinitialiser votre mot de passe.') : 'Rejoignez le studio Équilibre Pilates.'))}
                    </p>
                </div>
                <form id="auth-main-form" class="space-y-4 ${isVerifying ? 'hidden' : ''}">
                    ${isLogin ? `
                        <div class="space-y-2.5">
                            <div>
                                <label for="auth-email" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Email</label>
                                <input type="email" id="auth-email" required class="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm dark:bg-stone-700 dark:border-stone-600" />
                            </div>
                            <div>
                                <label for="auth-password" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Mot de passe</label>
                                <div class="relative">
                                    <input type="${app.state.visiblePasswords.includes('auth-password') ? 'text' : 'password'}" id="auth-password" required class="w-full px-3 py-2 pr-10 rounded-xl border border-stone-200 bg-white text-sm dark:bg-stone-700 dark:border-stone-600" />
                                    <button type="button" onclick="app.togglePasswordVisibility('auth-password')" class="absolute inset-y-0 right-0 flex items-center px-3 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
                                        ${app.state.visiblePasswords.includes('auth-password') ? eyeSlashIcon : eyeIcon}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    ${isRegister ? `
                        <div class="grid grid-cols-1 md:grid-cols-2 md:gap-x-10 gap-y-4">
                            <!-- Colonne 1: Infos Personnelles -->
                            <div class="space-y-3">
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label for="auth-firstname" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Prénom</label>
                                        <input type="text" id="auth-firstname" value="${regData.firstName || ''}" required class="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm dark:bg-stone-700 dark:border-stone-600" />
                                    </div>
                                    <div>
                                        <label for="auth-lastname" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Nom</label>
                                        <input type="text" id="auth-lastname" value="${regData.lastName || ''}" required class="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm dark:bg-stone-700 dark:border-stone-600" />
                                    </div>
                                </div>
                                <div>
                                    <label for="auth-address" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Adresse postale</label>
                                    <input type="text" id="auth-address" value="${regData.address || ''}" required placeholder="123 rue de la Paix, 75000 Paris" class="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm dark:bg-stone-700 dark:border-stone-600" />
                                </div>
                                <div class="grid grid-cols-3 gap-3">
                                    <div class="col-span-1">
                                        <label for="auth-zipcode" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Code Postal</label>
                                        <input type="text" id="auth-zipcode" value="${regData.zipCode || ''}" required placeholder="75000" class="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm dark:bg-stone-700 dark:border-stone-600" />
                                    </div>
                                    <div class="col-span-2">
                                        <label for="auth-city" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Ville</label>
                                        <input type="text" id="auth-city" value="${regData.city || ''}" required placeholder="Paris" class="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm dark:bg-stone-700 dark:border-stone-600" />
                                    </div>
                                </div>
                                <div>
                                    <label for="auth-phone" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Téléphone</label>
                                    <input type="tel" id="auth-phone" value="${regData.phone || ''}" required placeholder="06 12 34 56 78" class="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm dark:bg-stone-700 dark:border-stone-600" />
                                </div>
                            </div>
                            <!-- Colonne 2: Infos Compte -->
                            <div class="space-y-3">
                                <div>
                                    <label for="auth-email" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Email</label>
                                    <input type="email" id="auth-email" value="${regData.email || ''}" required class="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm dark:bg-stone-700 dark:border-stone-600" />
                                </div>
                                <div>
                                    <label for="auth-password" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Mot de passe</label>
                                    <div class="relative">
                                        <input type="${app.state.visiblePasswords.includes('auth-password') ? 'text' : 'password'}" id="auth-password" required class="w-full px-3 py-2 pr-10 rounded-xl border border-stone-200 bg-white text-sm dark:bg-stone-700 dark:border-stone-600" />
                                        <button type="button" onclick="app.togglePasswordVisibility('auth-password')" class="absolute inset-y-0 right-0 flex items-center px-3 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
                                            ${app.state.visiblePasswords.includes('auth-password') ? eyeSlashIcon : eyeIcon}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label for="auth-confirm-password" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Confirmer le mot de passe</label>
                                    <div class="relative">
                                        <input type="${app.state.visiblePasswords.includes('auth-confirm-password') ? 'text' : 'password'}" id="auth-confirm-password" required class="w-full px-3 py-2 pr-10 rounded-xl border border-stone-200 bg-white text-sm dark:bg-stone-700 dark:border-stone-600" />
                                        <button type="button" onclick="app.togglePasswordVisibility('auth-confirm-password')" class="absolute inset-y-0 right-0 flex items-center px-3 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
                                            ${app.state.visiblePasswords.includes('auth-confirm-password') ? eyeSlashIcon : eyeIcon}
                                        </button>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3 pt-2">
                                    <input type="checkbox" id="auth-newsletter" ${regData.newsletter_subscribed ? 'checked' : ''} class="w-5 h-5 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500 dark:bg-stone-600 dark:border-stone-500">
                                    <label for="auth-newsletter" class="text-sm text-stone-600 cursor-pointer dark:text-stone-300">
                                        Je souhaite recevoir les actualités et promotions du studio.
                                    </label>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    ${isResetPassword ? `
                        ${hasResetToken ? `
                            <div>
                                <label for="reset-password-new" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Nouveau mot de passe</label>
                                <div class="relative">
                                    <input type="${app.state.visiblePasswords.includes('reset-password-new') ? 'text' : 'password'}" id="reset-password-new" required class="w-full px-3 py-2 pr-10 rounded-xl border border-stone-200 bg-white text-sm dark:bg-stone-700 dark:border-stone-600" />
                                    <button type="button" onclick="app.togglePasswordVisibility('reset-password-new')" class="absolute inset-y-0 right-0 flex items-center px-3 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
                                        ${app.state.visiblePasswords.includes('reset-password-new') ? eyeSlashIcon : eyeIcon}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label for="reset-password-confirm" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Confirmer le nouveau mot de passe</label>
                                <div class="relative">
                                    <input type="${app.state.visiblePasswords.includes('reset-password-confirm') ? 'text' : 'password'}" id="reset-password-confirm" required class="w-full px-3 py-2 pr-10 rounded-xl border border-stone-200 bg-white text-sm dark:bg-stone-700 dark:border-stone-600" />
                                    <button type="button" onclick="app.togglePasswordVisibility('reset-password-confirm')" class="absolute inset-y-0 right-0 flex items-center px-3 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
                                        ${app.state.visiblePasswords.includes('reset-password-confirm') ? eyeSlashIcon : eyeIcon}
                                    </button>
                                </div>
                            </div>
                        ` : `<!-- Formulaire pour demander un lien de réinitialisation (email seulement) -->
                            <div>
                                <label for="auth-email" class="block text-sm font-medium text-stone-700 mb-1 dark:text-stone-200">Votre email</label>
                                <input type="email" id="auth-email" required class="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm dark:bg-stone-700 dark:border-stone-600" />
                            </div>
                        `}
                    ` : ''}
                    <button type="submit" class="w-full py-2.5 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition font-medium mt-4 dark:bg-emerald-700 dark:hover:bg-emerald-600">
                        ${isLogin ? 'Se connecter' : (isResetPassword ? (hasResetToken ? 'Changer mon mot de passe' : 'Envoyer le lien de réinitialisation') : "Valider l'inscription")}
                    </button>
                </form>

                <!-- Code Verification Section (conditionally displayed) -->
                <form id="auth-code-verification-form" class="space-y-4 ${isRegister && isVerifying ? '' : 'hidden'}">
                    <div class="animate-fade-in p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 shadow-inner">
                        <label for="auth-code-input" class="block text-xs font-bold text-emerald-800 mb-2 text-center uppercase tracking-widest dark:text-emerald-400">Saisissez le code reçu</label>
                        <code-input id="auth-code-input" name="code" size="6" legend=""></code-input>
                        <p class="text-[10px] text-emerald-600 mt-2 text-center dark:text-emerald-400 italic">Vérifiez vos courriers indésirables (spams)</p>
                        <button type="button" onclick="app.resendVerificationCode()" id="resend-code-btn" class="mt-4 w-full py-2 text-sm text-emerald-700 font-medium rounded-xl border border-emerald-200 hover:bg-emerald-50 transition-colors dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/30" ${app.state.resendCodeTimer > 0 ? 'disabled' : ''}>
                            <span id="resend-code-text">${app.state.resendCodeTimer > 0 ? `Renvoyer le code (${app.state.resendCodeTimer}s)` : 'Renvoyer le code'}</span>
                        </button>
                    </div>
                    <button type="submit" class="w-full py-2.5 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition font-medium mt-4 dark:bg-emerald-700 dark:hover:bg-emerald-600">
                        Finaliser l'inscription
                    </button>
                    <div class="mt-4 text-center text-sm text-stone-600 dark:text-stone-300">
                        <button onclick="app.cancelRegistrationVerification()" class="text-emerald-700 font-medium hover:underline dark:text-emerald-400">Annuler et revenir</button>
                    </div>
                </form>
                <div class="mt-4 text-center text-sm text-stone-600 dark:text-stone-300">
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
