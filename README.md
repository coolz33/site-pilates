# 🧘‍♀️ Studio Pilates Web Application (Client Project)

![Pilates Studio Banner](https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=2000&h=600)

> **Note au recruteur / visiteur :** Ce projet a été développé pour un **vrai client**. Le code est mis à disposition publiquement **uniquement à des fins de démonstration pour mon portfolio**. L'utilisation commerciale, la copie ou la republication de ce code sont strictement interdites (voir le fichier `LICENSE`).

---

## 📖 Présentation du Projet

Ce projet est une application web **Fullstack** sur-mesure conçue pour un studio de Pilates. Elle permet aux gérants du studio de gérer leur activité en ligne et aux élèves de :
- Découvrir le studio, son équipe et ses valeurs.
- S'inscrire et se connecter de manière sécurisée (Espace Membre).
- Gérer leurs informations et leurs réservations.
- Acheter des forfaits ou des séances uniques en ligne de manière sécurisée.

L'objectif principal était de fournir une expérience utilisateur fluide, rapide et moderne tout en assurant une sécurité rigoureuse pour les données du client (RGPD et paiements).

---

## 🌐 Démo en Ligne

Vous pouvez tester l'application directement en ligne depuis mon NAS (cliquez sur le lien ci-dessous) :

- **URL :** [https://demo.pilates.coolz.fr/](https://demo.pilates.coolz.fr/)
- **Accès Administrateur / Test :**
  - **Email :** `admin@pilates.fr`
  - **Mot de passe :** `admin`
  - **Carte de test :** `4242 4242 4242 4242` (Date future, code CVC au choix)
---

## ⚡ Fonctionnalités Clés

- 🔐 **Authentification Sécurisée :** Système de création de compte et de connexion protégé avec hashage de mot de passe (`bcryptjs`).
- 💳 **Paiement en ligne :** Intégration complète de l'API **Stripe** pour la vente de séances et d'abonnements en toute sécurité.
- 📧 **Communication intégrée :** Formulaire de contact et envoi d'emails transactionnels gérés avec `Nodemailer`.
- 🗄️ **Base de Données Relationnelle :** Gestion des utilisateurs, des réservations et des produits via `MySQL` pour garantir l'intégrité des données.
- 🐳 **Déploiement Facilité :** Conteneurisation du projet avec **Docker** et `docker-compose` pour un hébergement stable et indépendant de l'environnement matériel.

---

## 🛠️ Stack Technique

Le projet a été pensé pour allier robustesse côté serveur et légèreté côté interface client :

### **Frontend**
- **HTML5 / CSS3** : Architecture sémantique avec un design moderne (animations, responsive design).
- **Vanilla JavaScript ES6+** : Gestion de l'état local et de l'interface sans surcharger l'application avec un framework lourd. Communication fluide avec l'API (via fetch)

### **Backend**
- **Node.js** & **Express** : API RESTful performante servant de pont entre l'interface et la base de données locale.
- **MySQL (via `mysql2`)** : Architecture relationnelle robuste traitée avec des requêtes préparées pour contrer les injections SQL.
- **Stripe & Nodemailer** : Services tiers pour gérer des aspects critiques.

---

## 🚀 Installation & Lancement (Environnement de test)

1. **Cloner le projet**
   ```bash
   git clone https://github.com/votre_nom/votre-depot-pilates.git
   cd Pilate
   ```

2. **Configuration de l'environnement (.env)**
   Créez un fichier `.env` à la racine pour vous y brancher et configurez les clés factices :
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=pilates
   STRIPE_SECRET_KEY=sk_test_...
   ```

3. **Lancement via Docker (Recommandé)**
   ```bash
   docker-compose up --build
   ```
   L'application sera accessible sur `http://localhost:3000` (ou le port défini).

---

## ✨ Points d'intérêts pour mon Portfolio

Afin de vous faciliter la lecture du code, voici les parties que je vous invite à analyser :
- **Architecture de l'API :** Regardez les fichiers `app.js` ou `server.js` pour analyser le routage.
- **Sécurisation :** La gestion des mots de passe (avec hachage) et les interactions base de données via `database.js` qui utilise des pools de requêtes.
- **Organisation Frontend :** Le dossier `/js/views/` et le cloisonnement de la logique (exemple : `studio.js` et les services interactifs).

---
*Ce projet démontre ma capacité à gérer le cycle de vie complet d'une application : depuis l'analyse des besoins du client, le design de la BDD, le développement "From scratch", l'intégration du paiement en ligne, jusqu'au déploiement Dockerisé.*
