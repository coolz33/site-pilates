export const aboutView = (app) => `
    <div class="pt-6 pb-6 bg-stone-50 min-h-[60vh] animate-fade-in dark:bg-stone-900">
        <div class="max-w-4xl mx-auto px-4 sm:px-6">
            <h1 class="text-3xl md:text-4xl font-light text-stone-800 mb-4 text-center dark:text-stone-100">La Méthode Pilates</h1>
            <div class="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100 mb-6 dark:bg-stone-800 dark:border-stone-700">
                <h2 class="text-xl font-medium text-emerald-800 mb-3 dark:text-emerald-400">Qu'est-ce que le Pilates ?</h2>
                <p class="text-sm text-stone-600 leading-relaxed mb-4 dark:text-stone-300">Développée par Joseph Pilates au début du 20ème siècle, cette méthode d'entraînement physique vise à renforcer les chaînes musculaires profondes du corps...</p>
                <p class="text-sm text-stone-600 leading-relaxed dark:text-stone-300">La méthode repose sur 6 principes fondamentaux : la concentration, le contrôle, le centrage, la précision, la fluidité du mouvement et la respiration.</p>
            </div>
            <div class="grid md:grid-cols-2 gap-4 mb-6">
                <div class="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 dark:bg-stone-800 dark:border-stone-700">
                    <h3 class="text-lg font-medium text-stone-800 mb-3 dark:text-stone-100">Les Bienfaits</h3>
                    <ul class="space-y-2 text-sm text-stone-600 dark:text-stone-300">
                        <li class="flex items-start gap-2"><span class="text-emerald-500 mt-1">•</span> Amélioration de la posture</li>
                        <li class="flex items-start gap-2"><span class="text-emerald-500 mt-1">•</span> Renforcement de la ceinture abdominale</li>
                        <li class="flex items-start gap-2"><span class="text-emerald-500 mt-1">•</span> Soulagement des maux de dos</li>
                    </ul>
                </div>
                <div class="bg-emerald-800 text-white rounded-3xl p-6 shadow-sm dark:bg-emerald-700">
                    <h3 class="text-lg font-medium mb-3">À qui s'adresse le Pilates ?</h3>
                    <p class="text-sm text-emerald-50 leading-relaxed dark:text-emerald-100">À tout le monde ! Que vous soyez sportif de haut niveau, sédentaire souhaitant reprendre une activité, ou en rééducation. Les exercices s'adaptent au niveau de chacun.</p>
                </div>
            </div>
        </div>
    </div>
`;
