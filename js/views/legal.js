/**
 * @file legal.js
 * @description Vues des pages légales (Mentions Légales, Politique de Confidentialité).
 */

/**
 * Génère la vue dynamique pour les textes légaux.
 * @param {PilatesApp} app - L'instance principale de l'application.
 * @param {'mentions-legales'|'politique-confidentialite'|'cgv'} mode - Détermine le contenu à afficher.
 * @returns {string} Le code HTML structuré avec Bootstrap 5.
 */
export const legalView = (app, mode) => {
    let content = {};

    if (mode === 'politique-confidentialite') {
        content = {
            title: "Politique de Confidentialité",
            text: `
                <h2 class="fs-5 fw-medium text-emerald mb-3">1. Collecte des données</h2>
                <p class="mb-4">Dans le cadre de votre inscription et de l'utilisation de nos services, nous collectons les données suivantes : nom, prénom, adresse postale, adresse e-mail, numéro de téléphone et historique de vos réservations.</p>
                <h2 class="fs-5 fw-medium text-emerald mb-3">2. Utilisation des données</h2>
                <p class="mb-4">Ces données sont utilisées pour : la gestion de votre compte, la facturation, le suivi de vos séances, et l'envoi de communications (si vous y avez consenti). Vos données ne sont jamais vendues ou cédées à des tiers à des fins commerciales.</p>
                <h2 class="fs-5 fw-medium text-emerald mb-3">3. Sécurité et Paiements</h2>
                <p class="mb-4">Vos données sont stockées de manière sécurisée. Les paiements par carte bancaire sont traités intégralement par notre prestataire de paiement sécurisé Stripe. Aucune information bancaire (numéro de carte) n'est stockée sur nos serveurs.</p>
                <h2 class="fs-5 fw-medium text-emerald mb-3">4. Vos droits (RGPD)</h2>
                <p class="mb-4">Conformément à la réglementation européenne (RGPD), vous disposez d'un droit d'accès, de rectification, d'opposition et de suppression de vos données personnelles. Vous pouvez exercer ce droit à tout moment depuis votre espace profil ou en nous contactant à l'adresse : <a href="mailto:${app.state.studioEmail}" class="text-emerald">${app.state.studioEmail}</a>.</p>
            `
        };
    } else if (mode === 'cgv') {
        content = {
            title: "Conditions Générales de Vente (CGV)",
            text: `
                <h2 class="fs-5 fw-medium text-emerald mb-3">1. Objet</h2>
                <p class="mb-4">Les présentes Conditions Générales de Vente définissent les droits et obligations des parties dans le cadre de la vente de cours de Pilates, de packs de cours et d'abonnements par L'espace doré.</p>
                <h2 class="fs-5 fw-medium text-emerald mb-3">2. Tarifs et Paiement</h2>
                <p class="mb-4">Les prix sont indiqués en euros, toutes taxes comprises (TTC). Le paiement s'effectue en ligne au moment de la commande par carte bancaire via le système de paiement sécurisé Stripe.</p>
                <h2 class="fs-5 fw-medium text-emerald mb-3">3. Réservation et Annulation</h2>
                <p class="mb-4">La réservation des cours s'effectue directement sur la plateforme en ligne. Toute annulation de séance doit être effectuée au moins <strong>${app.state.cancellationDelay} heures</strong> avant le début du cours. En cas d'annulation hors de ce délai ou d'absence de l'élève, le cours sera dû et décompté du solde de l'utilisateur. Aucune exception ne pourra être faite.</p>
                <h2 class="fs-5 fw-medium text-emerald mb-3">4. Abonnements et Packs de cours</h2>
                <p class="mb-4">Les packs de cours ont une durée de validité stricte communiquée au moment de l'achat. Au-delà de cette période, les cours non utilisés sont expirés et ne peuvent faire l'objet d'un remboursement. L'abonnement engage l'utilisateur pour la durée de la saison sportive telle que décrite lors de l'achat et octroie un crédit de réservation régulier.</p>
                <h2 class="fs-5 fw-medium text-emerald mb-3">5. État de santé</h2>
                <p class="mb-4">L'utilisateur certifie que son état de santé lui permet de pratiquer les activités proposées par L'espace doré. Un certificat médical d'aptitude à la pratique du Pilates est fortement recommandé. Le studio décline toute responsabilité en cas d'accident ou de blessure découlant d'une condition physique non déclarée.</p>
            `
        };
    } else {
        content = {
            title: "Mentions Légales",
            text: `
                <h2 class="fs-5 fw-medium text-emerald mb-3">1. Éditeur du site</h2>
                <p class="mb-4">
                    Le site <strong>L'espace doré</strong> est édité par la société.<br>
                    <strong>Dirigeants :</strong> Justine BIENAIMÉ et Pierre-Edouard, Vincent, Frédéric DALOT<br>
                    <strong>Adresse du siège social :</strong> ${app.state.studioAddress}<br>
                    <strong>SIRET :</strong> ${app.state.studioSiret}<br>
                    <strong>N° TVA Intracommunautaire :</strong> ${app.state.studioTva}<br>
                    <strong>Téléphone :</strong> ${app.state.studioPhone}<br>
                    <strong>Email :</strong> <a href="mailto:${app.state.studioEmail}" class="text-emerald">${app.state.studioEmail}</a>
                </p>
                <h2 class="fs-5 fw-medium text-emerald mb-3">2. Hébergement</h2>
                <p class="mb-4">
                    Le site est hébergé par la société <strong>IONOS SARL</strong>.<br>
                    <strong>Adresse de l'hébergeur :</strong> 7 Place de la Gare, 57200 Sarreguemines, France.<br>
                    <strong>Site web :</strong> <a href="https://www.ionos.fr" target="_blank" class="text-emerald">www.ionos.fr</a>
                </p>
                <h2 class="fs-5 fw-medium text-emerald mb-3">3. Propriété intellectuelle</h2>
                <p class="mb-4">L'ensemble des éléments graphiques, textuels et informatiques figurant sur le site sont protégés par les dispositions du Code de la Propriété Intellectuelle. Toute reproduction, totale ou partielle, est strictement interdite sans autorisation préalable de L'espace doré.</p>
            `
        };
    }

    return `
        <div class="pt-4 pb-5 animate-fade-in flex-grow-1">
            <div class="container" style="max-width: 800px;">
                <h1 class="fs-2 fw-light mb-4 mt-2 text-center">${content.title}</h1>
                <div class="custom-card p-4 p-md-5 text-muted" style="line-height: 1.6;">
                    ${content.text}
                    <div class="mt-4 pt-4 border-top">
                        <button onclick="window.history.back()" class="btn btn-link text-emerald p-0 text-decoration-none fw-medium">
                            ← Retour
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
};