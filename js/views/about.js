export const aboutView = (app) => `
    <div class="pt-20 pb-24 bg-stone-50 min-h-screen animate-fade-in">
        <div class="max-w-4xl mx-auto px-4 sm:px-6">
            <h1 class="text-4xl md:text-5xl font-light text-stone-800 mb-8 text-center">La Méthode Pilates</h1>
            <div class="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-100 mb-12">
                <h2 class="text-2xl font-medium text-emerald-800 mb-4">Qu'est-ce que le Pilates ?</h2>
                <p class="text-stone-600 leading-relaxed mb-6">Développée par Joseph Pilates au début du 20ème siècle, cette méthode d'entraînement physique vise à renforcer les chaînes musculaires profondes du corps...</p>
                <p class="text-stone-600 leading-relaxed">La méthode repose sur 6 principes fondamentaux : la concentration, le contrôle, le centrage, la précision, la fluidité du mouvement et la respiration.</p>
            </div>
            <div class="grid md:grid-cols-2 gap-8 mb-12">
                <div class="bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
                    <h3 class="text-xl font-medium text-stone-800 mb-4">Les Bienfaits</h3>
                    <ul class="space-y-3 text-stone-600">
                        <li class="flex items-start gap-2"><span class="text-emerald-500 mt-1">•</span> Amélioration de la posture</li>
                        <li class="flex items-start gap-2"><span class="text-emerald-500 mt-1">•</span> Renforcement de la ceinture abdominale</li>
                        <li class="flex items-start gap-2"><span class="text-emerald-500 mt-1">•</span> Soulagement des maux de dos</li>
                    </ul>
                </div>
                <div class="bg-emerald-800 text-white rounded-3xl p-8 shadow-sm">
                    <h3 class="text-xl font-medium mb-4">À qui s'adresse le Pilates ?</h3>
                    <p class="text-emerald-50 leading-relaxed">À tout le monde ! Que vous soyez sportif de haut niveau, sédentaire souhaitant reprendre une activité, ou en rééducation. Les exercices s'adaptent au niveau de chacun.</p>
                </div>
            </div>
        </div>
    </div>
`;
