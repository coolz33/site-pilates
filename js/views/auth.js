import '../services/CodeInput.js'; // Assurez-vous que ce chemin est correct et que CodeInput.js définit le custom element.

/**
 * @file auth.js
 * @description Vue d'authentification (Connexion, Inscription, Réinitialisation de mot de passe).
 */

/**
 * Génère la vue d'authentification dynamique selon le mode sélectionné.
 * Gère l'affichage contextuel (Formulaire classique vs Saisie de code de vérification).
 * 
 * @param {PilatesApp} app - L'instance principale de l'application.
 * @param {'connexion'|'inscription'|'reset-password'} mode - Le mode d'authentification courant.
 * @returns {string} Code HTML structuré avec Bootstrap 5.
 */
export const authView = (app, mode) => {
    const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>`;
    const eyeSlashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z"/><path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z"/></svg>`;

    const isLogin = mode === 'connexion';
    const isVerifying = app.state.isVerifyingEmail;
    const isRegister = mode === 'inscription';
    const isResetPassword = mode === 'reset-password';
    const hasResetToken = app.state.resetPasswordToken;
    const regData = app.state.registrationData || {};
    
    const containerMaxWidthClass = (isRegister && !isVerifying) ? 'auth-container-wide' : 'auth-container';

    return `
        <div class="d-flex flex-grow-1 align-items-center justify-content-center py-5 px-3">
            <div class="custom-card p-4 p-md-5 w-100 transition-all ${containerMaxWidthClass}">
                <div class="text-center mb-4 mt-2">
                    <h2 class="fs-3 fw-light mb-2">
                        ${isLogin ? 'Connexion' : (isVerifying ? 'Vérification de l\'email' : (isResetPassword ? (hasResetToken ? 'Nouveau mot de passe' : 'Mot de passe oublié ?') : 'Créer un compte'))}
                    </h2>
                    <p class="small text-muted mb-0">
                        ${isLogin ? 'Accédez à votre espace pour réserver.' : (isVerifying ? 'Un code vous a été envoyé par mail.' : (isResetPassword ? (hasResetToken ? 'Saisissez votre nouveau mot de passe.' : 'Saisissez votre email pour réinitialiser votre mot de passe.') : 'Rejoignez L\'espace doré.'))}
                    </p>
                </div>
                
                <form id="auth-main-form" class="${isVerifying ? 'd-none' : 'd-flex flex-column gap-3'}">
                    ${isLogin ? `
                        <div>
                            <label for="auth-email" class="form-label small fw-medium mb-1">Email</label>
                            <input type="email" id="auth-email" required class="form-control" />
                        </div>
                        <div>
                            <label for="auth-password" class="form-label small fw-medium mb-1">Mot de passe</label>
                            <div class="position-relative">
                                <input type="${app.state.visiblePasswords.includes('auth-password') ? 'text' : 'password'}" id="auth-password" required class="form-control pr-5" />
                                <button type="button" onclick="app.togglePasswordVisibility('auth-password')" class="btn btn-link text-muted position-absolute end-0 top-50 translate-middle-y p-2 text-decoration-none">
                                    ${app.state.visiblePasswords.includes('auth-password') ? eyeSlashIcon : eyeIcon}
                                </button>
                            </div>
                        </div>
                    ` : ''}

                    ${isRegister ? `
                        <div class="row g-4">
                            <!-- Colonne 1: Infos Personnelles -->
                            <div class="col-md-6 d-flex flex-column gap-3">
                                <div class="row g-2">
                                    <div class="col-6">
                                        <label for="auth-firstname" class="form-label small fw-medium mb-1">Prénom</label>
                                        <input type="text" id="auth-firstname" value="${regData.firstName || ''}" required class="form-control" />
                                    </div>
                                    <div class="col-6">
                                        <label for="auth-lastname" class="form-label small fw-medium mb-1">Nom</label>
                                        <input type="text" id="auth-lastname" value="${regData.lastName || ''}" required class="form-control" />
                                    </div>
                                </div>
                                <div>
                                    <label for="auth-address" class="form-label small fw-medium mb-1">Adresse postale</label>
                                    <input type="text" id="auth-address" value="${regData.address || ''}" required placeholder="123 rue de la Paix" class="form-control" />
                                </div>
                                <div class="row g-2">
                                    <div class="col-4">
                                        <label for="auth-zipcode" class="form-label small fw-medium mb-1">Code Postal</label>
                                        <input type="text" id="auth-zipcode" value="${regData.zipCode || ''}" required placeholder="75000" class="form-control" />
                                    </div>
                                    <div class="col-8">
                                        <label for="auth-city" class="form-label small fw-medium mb-1">Ville</label>
                                        <input type="text" id="auth-city" value="${regData.city || ''}" required placeholder="Paris" class="form-control" />
                                    </div>
                                </div>
                                <div>
                                    <label for="auth-phone" class="form-label small fw-medium mb-1">Téléphone</label>
                                    <input type="tel" id="auth-phone" value="${regData.phone || ''}" required placeholder="06 12 34 56 78" class="form-control" />
                                </div>
                            </div>
                            
                            <!-- Colonne 2: Infos Compte -->
                            <div class="col-md-6 d-flex flex-column gap-3">
                                <div>
                                    <label for="auth-email" class="form-label small fw-medium mb-1">Email</label>
                                    <input type="email" id="auth-email" value="${regData.email || ''}" required class="form-control" />
                                </div>
                                <div>
                                    <label for="auth-password" class="form-label small fw-medium mb-1">Mot de passe</label>
                                    <div class="position-relative">
                                        <input type="${app.state.visiblePasswords.includes('auth-password') ? 'text' : 'password'}" id="auth-password" required class="form-control pr-5" />
                                        <button type="button" onclick="app.togglePasswordVisibility('auth-password')" class="btn btn-link text-muted position-absolute end-0 top-50 translate-middle-y p-2 text-decoration-none">
                                            ${app.state.visiblePasswords.includes('auth-password') ? eyeSlashIcon : eyeIcon}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label for="auth-confirm-password" class="form-label small fw-medium mb-1">Confirmer le mot de passe</label>
                                    <div class="position-relative">
                                        <input type="${app.state.visiblePasswords.includes('auth-confirm-password') ? 'text' : 'password'}" id="auth-confirm-password" required class="form-control pr-5" />
                                        <button type="button" onclick="app.togglePasswordVisibility('auth-confirm-password')" class="btn btn-link text-muted position-absolute end-0 top-50 translate-middle-y p-2 text-decoration-none">
                                            ${app.state.visiblePasswords.includes('auth-confirm-password') ? eyeSlashIcon : eyeIcon}
                                        </button>
                                    </div>
                                </div>
                                <div class="form-check mt-2">
                                    <input type="checkbox" id="auth-newsletter" ${regData.newsletter_subscribed ? 'checked' : ''} class="form-check-input">
                                    <label for="auth-newsletter" class="form-check-label small text-muted cursor-pointer">
                                        Je souhaite recevoir les actualités et promotions du studio.
                                    </label>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    ${isResetPassword ? `
                        ${hasResetToken ? `
                            <div>
                                <label for="reset-password-new" class="form-label small fw-medium mb-1">Nouveau mot de passe</label>
                                <div class="position-relative">
                                    <input type="${app.state.visiblePasswords.includes('reset-password-new') ? 'text' : 'password'}" id="reset-password-new" required class="form-control pr-5" />
                                    <button type="button" onclick="app.togglePasswordVisibility('reset-password-new')" class="btn btn-link text-muted position-absolute end-0 top-50 translate-middle-y p-2 text-decoration-none">
                                        ${app.state.visiblePasswords.includes('reset-password-new') ? eyeSlashIcon : eyeIcon}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label for="reset-password-confirm" class="form-label small fw-medium mb-1">Confirmer le nouveau mot de passe</label>
                                <div class="position-relative">
                                    <input type="${app.state.visiblePasswords.includes('reset-password-confirm') ? 'text' : 'password'}" id="reset-password-confirm" required class="form-control pr-5" />
                                    <button type="button" onclick="app.togglePasswordVisibility('reset-password-confirm')" class="btn btn-link text-muted position-absolute end-0 top-50 translate-middle-y p-2 text-decoration-none">
                                        ${app.state.visiblePasswords.includes('reset-password-confirm') ? eyeSlashIcon : eyeIcon}
                                    </button>
                                </div>
                            </div>
                        ` : `<!-- Formulaire pour demander un lien de réinitialisation (email seulement) -->
                            <div>
                                <label for="auth-email" class="form-label small fw-medium mb-1">Votre email</label>
                                <input type="email" id="auth-email" required class="form-control" />
                            </div>
                        `}
                    ` : ''}
                    
                    <button type="submit" class="btn btn-auth w-100 py-2 mt-4 fw-medium">
                        ${isLogin ? 'Se connecter' : (isResetPassword ? (hasResetToken ? 'Changer mon mot de passe' : 'Envoyer le lien de réinitialisation') : "Valider l'inscription")}
                    </button>
                </form>

                <!-- Code Verification Section (conditionally displayed) -->
                <form id="auth-code-verification-form" class="${isRegister && isVerifying ? 'd-flex flex-column gap-3' : 'd-none'}">
                    <div class="verification-box p-4 text-center animate-fade-in mb-3">
                        <label for="auth-code-input" class="d-block small fw-bold text-emerald-dark text-uppercase tracking-wider mb-3">Saisissez le code reçu</label>
                        <code-input id="auth-code-input" name="code" size="6" legend=""></code-input>
                        <p class="small text-emerald mt-3 mb-0 fst-italic">Vérifiez vos courriers indésirables (spams)</p>
                        
                        <button type="button" onclick="app.resendVerificationCode()" id="resend-code-btn" class="btn btn-outline-success w-100 mt-3 py-2 btn-sm fw-medium" ${app.state.resendCodeTimer > 0 ? 'disabled' : ''}>
                            <span id="resend-code-text">${app.state.resendCodeTimer > 0 ? `Renvoyer le code (${app.state.resendCodeTimer}s)` : 'Renvoyer le code'}</span>
                        </button>
                    </div>
                    
                    <button type="submit" class="btn btn-auth w-100 py-2 fw-medium">
                        Finaliser l'inscription
                    </button>
                    
                    <div class="mt-3 text-center">
                        <button type="button" onclick="app.cancelRegistrationVerification()" class="link-emerald small">Annuler et revenir</button>
                    </div>
                </form>
                
                <div class="mt-4 pt-3 border-top text-center small text-muted">
                    ${isLogin ?
                        `Pas encore de compte ? <button onclick="app.navigate('inscription')" class="link-emerald">S'inscrire</button>
                        <div class="mt-2">
                            <button onclick="app.navigate('reset-password')" class="link-emerald">Mot de passe oublié ?</button>
                        </div>
                        ` : (isResetPassword ? `
                            <button onclick="app.navigate('connexion')" class="link-emerald">Retour à la connexion</button>
                        ` : `
                            Déjà un compte ? <button onclick="app.navigate('connexion')" class="link-emerald">Se connecter</button>
                        `)
                    }
                </div>
            </div>
        </div>
    `;
};
