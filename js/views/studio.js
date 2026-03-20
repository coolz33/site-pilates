/**
 * @file studio.js
 * @description Vue de présentation du studio avec une galerie d'images moderne.
 */

export const studioView = (app) => `
    <div class="pt-4 pb-5 animate-fade-in flex-grow-1">
        <div class="container" style="max-width: 1200px;">
            <div class="text-center mb-5 mt-2">
                <h1 class="fs-2 fw-light mb-2">Notre Studio</h1>
                <p class="text-muted">Un lieu conçu pour votre bien-être et votre pratique.</p>
            </div>
            
            <!-- Première section : Introduction -->
            <div class="row g-5 align-items-center mb-5">
                <div class="col-md-6 order-2 order-md-1">
                    <div class="pe-md-4">
                        <h2 class="fs-3 fw-medium text-emerald mb-4">Un écrin de douceur</h2>
                        <p class="text-muted" style="line-height: 1.8;">
                            Bienvenue dans notre espace dédié à la méthode Pilates. Nous avons pensé chaque détail pour vous offrir un cadre apaisant, lumineux et chaleureux. 
                            Dès votre arrivée, laissez le stress à la porte et plongez dans une bulle de sérénité.
                        </p>
                        <p class="text-muted" style="line-height: 1.8;">
                            Notre matériel haut de gamme et nos espaces épurés vous permettront de vous concentrer pleinement sur vous-même, votre respiration et vos mouvements.
                        </p>
                    </div>
                </div>
                <div class="col-md-6 order-1 order-md-2">
                    <div class="rounded-4 overflow-hidden shadow-sm">
                        <!-- Ajustez le 'src' avec le nom de vos images. Le 'onerror' sert de secours -->
                        <img src="assets/img/studio1.jpg" onerror="this.src='https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'" alt="Le studio" class="img-fluid w-100 object-fit-cover hover-zoom" style="height: 400px;">
                    </div>
                </div>
            </div>

            <!-- Deuxième section : Galerie asymétrique -->
            <div class="row g-4 mb-5">
                <div class="col-md-4">
                    <div class="rounded-4 overflow-hidden shadow-sm h-100">
                        <img src="assets/img/studio2.jpg" onerror="this.src='https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=600&q=80'" alt="Détail du studio" class="img-fluid w-100 object-fit-cover hover-zoom" style="height: 300px;">
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="rounded-4 overflow-hidden shadow-sm h-100">
                        <img src="assets/img/studio3.jpg" onerror="this.src='https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=80'" alt="Salle de pratique" class="img-fluid w-100 object-fit-cover hover-zoom" style="height: 300px;">
                    </div>
                </div>
            </div>
            
            <!-- Troisième section : Équipements -->
            <div class="row g-4">
                <div class="col-md-6">
                    <div class="rounded-4 overflow-hidden shadow-sm h-100">
                        <img src="assets/img/studio4.jpg" onerror="this.src='https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80'" alt="Équipement Pilates" class="img-fluid w-100 object-fit-cover hover-zoom" style="height: 350px;">
                    </div>
                </div>
                <div class="col-md-6 d-flex align-items-center">
                    <div class="p-4 p-md-5 custom-card w-100 h-100 d-flex flex-column justify-content-center">
                        <h3 class="fs-4 fw-medium text-emerald-dark mb-4">Équipements et Confort</h3>
                        <ul class="list-unstyled text-muted d-flex flex-column gap-3 mb-0">
                            <li class="d-flex align-items-start gap-3">
                                <span class="text-emerald mt-1"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span>
                                <span>Tapis confortables et accessoires fournis (cercle, ballon, élastiques...)</span>
                            </li>
                            <li class="d-flex align-items-start gap-3">
                                <span class="text-emerald mt-1"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span>
                                <span>Espace vestiaire pour vous changer en toute tranquillité</span>
                            </li>
                            <li class="d-flex align-items-start gap-3">
                                <span class="text-emerald mt-1"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span>
                                <span>Environnement climatisé pour une température idéale toute l'année</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;