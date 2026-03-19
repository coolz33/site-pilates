import { icons } from '../icons.js';

/**
 * @file home.js
 * @description Composant de la vue d'accueil du studio.
 */

/**
 * Génère la vue de la page d'accueil.
 * Construit la bannière principale (Hero) et la section des fonctionnalités.
 * @param {PilatesApp} app - L'instance principale de l'application.
 * @returns {string} Le code HTML structuré avec Bootstrap 5.
 */
export const homeView = (app) => `
    <div class="animate-fade-in">
        
        <!-- Section Héros (Hero Section) -->
        <section class="position-relative d-flex align-items-center justify-content-center overflow-hidden py-5 mx-auto custom-hero-section">
            
            <!-- Effets lumineux d'arrière-plan -->
            <div class="position-absolute top-0 start-0 w-100 h-100 pe-none" style="opacity: 0.4;">
                <div class="blur-shape-1"></div>
                <div class="blur-shape-2"></div>
            </div>
            
            <!-- Contenu Principal -->
            <div class="position-relative z-1 text-center px-3 mx-auto" style="max-width: 900px;">
                <h1 class="display-4 fw-light mb-3 tracking-tight text-stone-800">
                    Retrouvez votre <span class="fst-italic text-emerald font-serif">harmonie</span>
                </h1>
                <p class="text-stone-600 mb-4 mx-auto fw-light" style="max-width: 600px;">
                    Un espace dédié au mouvement en conscience, pour renforcer le corps et apaiser l'esprit. Rejoignez notre studio au cœur de la ville.
                </p>
                <button onclick="app.navigate('planning')" class="btn btn-hero rounded-pill px-4 py-2 shadow-sm">
                    Voir le planning et réserver
                </button>
            </div>
        </section>
        
        <!-- Section Fonctionnalités (Features) -->
        <section class="custom-feature-section py-5">
            <div class="container" style="max-width: 1200px;">
                <div class="row g-4 text-center">
                    
                    <!-- Carte 1 -->
                    <div class="col-12 col-md-4">
                        <div class="custom-feature-card h-100 p-4">
                            <div class="icon-circle-lg mx-auto mb-3 bg-emerald-light text-emerald-dark">${icons.user}</div>
                            <h3 class="h5 fw-medium mb-2">Accompagnement Personnalisé</h3>
                            <p class="small text-muted fw-light mb-0">Des cours en petits groupes pour garantir des corrections précises et une progression sécuritaire.</p>
                        </div>
                    </div>
                    
                    <!-- Carte 2 -->
                    <div class="col-12 col-md-4">
                        <div class="custom-feature-card h-100 p-4">
                            <div class="icon-circle-lg mx-auto mb-3 bg-emerald-light text-emerald-dark">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                        </div>
                            <h3 class="h5 fw-medium mb-2">Méthode Authentique</h3>
                            <p class="small text-muted fw-light mb-0">Nous enseignons la méthode classique tout en l'adaptant aux connaissances biomécaniques modernes.</p>
                        </div>
                    </div>
                    
                    <!-- Carte 3 -->
                    <div class="col-12 col-md-4">
                        <div class="custom-feature-card h-100 p-4">
                            <div class="icon-circle-lg mx-auto mb-3 bg-emerald-light text-emerald-dark">${icons.calendar}</div>
                            <h3 class="h5 fw-medium mb-2">Flexibilité</h3>
                            <p class="small text-muted fw-light mb-0">Un planning varié adapté à tous les emplois du temps, avec un système de réservation simple en ligne.</p>
                        </div>
                    </div>
                    
                </div>
            </div>
        </section>
    </div>
`;