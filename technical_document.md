# Documentation Technique - L'Espace Doré (Application Pilates)

Ce document décrit l'architecture, le rôle des fichiers et les principes de conception technique de l'application "L'Espace Doré", conçue pour la gestion d'un studio de Pilates.

## 1. Architecture Globale
L'application repose sur une architecture moderne de type **Single Page Application (SPA)** du côté frontend, couplée à une API RESTfull du côté backend.
- **Frontend** : Vanilla JavaScript (ES6 Modules), HTML5, CSS3 (avec l'utilisation de Bootstrap 5 pour la grille et des classes utilitaires personnalisées).
- **Backend / Serveur** : Node.js avec le framework Express.js.
- **Base de données** : SQLite (par défaut via le module natif) / Configurable vers d'autres moteurs SQL. 
- **Authentification** : Basée sur des tokens JWT (JSON Web Tokens) stockés dans le `localStorage` du navigateur.

L'objectif de cette séparation stricte (Frontend / Backend) permet un code plus modulaire, plus facile à maintenir et d'évoluer vers une application mobile ultérieurement si nécessaire.

---

## 2. Arborescence et Rôle des Fichiers Frontend

Le frontend suit le motif **MVC (Model-View-Controller)** adapté pour une SPA Vanilla JS. 

### 2.1. Fichiers Frontends Racines
- **`index.html`** : Le seul point d'entrée de l'application. Ce fichier est délibérément vide de contenu métier. Il ne contient que la structure squelettique (`<div id="navbar">`, `<main id="main">`, `<div id="footer">`), charge la police d'icônes, Bootstrap, le fichier `style.css` et le contrôleur principal (`app.js`).
- **`app.js`** : Véritable chef d'orchestre de l'application (le Contrôleur). 
  - Gère l'**État Global** (`this.state`) qui stocke les utilisateurs, les cours, les templates, et l'utilisateur connecté (`currentUser`).
  - Contient le **Routeur Front-end** (`navigate`, `handleRouteChange`) qui intercepte les changements d'URL (`#hash`) et charge la vue correspondante dans le conteneur `<main>`.
  - Lance l'hydratation des données initiales via l'API.
- **`style.css`** : Le fichier de stylisation globale. Il redéfinit les thèmes de couleurs (émeraude, pierre), corrige certains comportements par défaut de Bootstrap 5 (notamment le mode sombre), et fournit de nombreuses **classes utilitaires** (`max-w-1200`, `fs-0-85rem`, `rounded-3xl`) pour éviter au maximum le CSS inline dans les vues JavaScript.

### 2.2. Le dossier `js/`
Ce dossier contient toute la logique métier de l'application frontend.

- **`js/api.js`** : Centralise la configuration de l'API REST. Exporte la constante `API_URL` utilisée par l'ensemble des services pour contacter le backend.
- **`js/icons.js`** : Bibliothèque d'icônes SVG exportée sous forme de chaînes de caractères. Garder les SVG ici évite d'alourdir les fichiers de vues et rend leur réutilisation extrêmement facile (`${icons.user}`, `${icons.settings}`, etc.).
- **`js/utils.js`** : Fichier contenant les utilitaires transverses réutilisés partout pour respecter le principe DRY (Don't Repeat Yourself) :
  - `generatePaginationHtml` : Générateur de barre de pagination HTML.
  - `generateLimitSelectorHtml` : Générateur du sélecteur "Nombre d'éléments par page".

#### 2.2.1. Les Services (`js/services/`)
Ces fichiers abstraient la communication HTTP (Fetch) avec le backend. Toute requête réseau passe par un service.
- **`authService.js`** : Gestion de l'inscription, connexion, déconnexion, réinitialisation de mot de passe, et vérification par email (OTP).
- **`classService.js`** : Logique liée aux séances de Pilates : récupération du planning, réservation, annulation.
- **`userService.js`** : Appel API pour modifier le profil, charger les utilisateurs (côté admin) et gérer la facturation.
- **`newsletterService.js`** : Gère l'envoi manuel d'emails administratifs (newsletter) à tout ou partie de la base client.
- **`aiService.js`** : Gère l'interface conversationnelle avec l'Intelligence Artificielle (souvent utilisée pour guider les choix de cours des utilisateurs dans le planning).

#### 2.2.2. Les Vues (`js/views/`)
Les Vues génèrent et retournent la chaîne de caractères HTML injectée dans le `<main>` de `index.html`. Elles sont découpées de manière modulaire :
- **Vues Statiques** : `home.js`, `about.js`, `studio.js`, `contact.js`, `legal.js`.
- **`auth.js`** : Écran d'authentification incluant le login, l'enregistrement et la réinitialisation de mot de passe.
- **`schedule.js`** : Le planning interactif. Affiche les cours disponibles avec une pagination par semaine. Intègre un module d'IA pour conseiller l'utilisateur.
- **`credits.js`** / **`tarifs.js`** : La page d'achat des packs de crédits et abonnements (reliée potentiellement à Stripe).
- **`components.js`** : Gère l'interface partagée entre toutes les pages (Navbar globale, Footer global, Modales interactives, Toasts de notification d'erreurs/succès).

#### 2.2.3. Séparation poussée : Les sous-vues
Pour éviter des fichiers monolithes de plusieurs milliers de lignes difficiles à maintenir, les vues complexes ont été réfactoriées en sous-composants abstraits :
- **Le Profil Utilisateur (`profile.js`)** : 
  - `profile.js` gère la navigation (onglets) et le conteneur principal.
  - `profileSubviews.js` contient les fonctions lourdes responsables de générer le HTML de chaque onglet : informations personnelles (`renderProfileInfosTab`), historique des réservations (`renderProfileSessionsTab`), et historique de paiements/crédits (`renderProfilePaymentsTab`).
- **Le Tableau de Bord Admin (`admin.js`)** :
  - `admin.js` est le point d'entrée pour les administrateurs, il gère l'état local du tableau de bord.
  - `adminForms.js` : Composants de formulaires complexes pour gérer les paramètres du studio, l'ajout de templates de cours, et la newsletter.
  - `adminSubviews.js` : Affichage lourd des tableaux de données réactives : l'annuaire client (`renderUsersTab`), la comptabilité/livre des recettes (`renderLedgerTab`), et gestion de la carte utilisateur approfondie (`renderUserDetailsTab`).

---

## 3. Le Backend (Node.js & Express)

Le Backend sécurise et persiste l'application.

- **`server.js`** : Le fichier coeur. Il démarre le serveur web Express. Il configure les middlewares critiques de sécurité (CORS) et gère le module de paiement en interceptant les Webhooks de la passerelle de paiement (avant le parseur JSON).
- **`database.js`** : Responsable de la connexion à la base de données SQLite (ou MongoDB si activé via les branches parallèles). Il instancie les schémas/tables dès le lancement (Méthode `initDb`).
- **`routes/api.js`** : C'est le routeur du Backend métier. Il définit l'intégralité des endpoints (`GET`, `POST`, `PUT`, `DELETE`). Ce fichier contient les contrôleurs de vérification d'authentification (`authenticateToken` / `isAdmin`), procède aux validations métiers (une réservation est-elle possible vis-à-vis du temps limite de l'annulation ?) et gère l'envoi transactionnel d'emails (via Nodemailer).

---

## 4. Principes de Développement & Recommandations
1. **DRY (Don't Repeat Yourself)** : Lors du développement de nouvelles fonctionnalités (par exemple, un nouveau tableau), référez-vous au fichier `utils.js` pour les composants de pagination et de tri. Pour de nouveaux boutons, utilisez les classes préexistantes (`btn-emerald`, `btn-outline-success`).
2. **Externalisation du CSS** : Presque aucun fichier HTML/JS ne doit contenir d'attribut `style="..."`. L'intégralité du design doit être piloté par des classes utilitaires intégrées dans la feuille `style.css` (`fs-0-85rem`, `ml-3`, `max-w-1200`, etc.).
3. **Composants JS Purs** : Étant en Vanilla JS, pensez toujours à assainir (Sanitize) l'input JSON provenant de variables avant d'utiliser des injections littérales de template dans du code HTML `` `<div>${user.name}</div>` `` pour éviter la vulnérabilité Cross-Site Scripting (XSS).
