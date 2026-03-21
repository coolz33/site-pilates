# Guide de l'Utilisateur et Administrateur - L'Espace Doré

Bienvenue sur la documentation complète d'utilisation de la plateforme **L'Espace Doré**. Ce manuel est découpé spécifiquement pour vous guider en tant que membre du studio de Pilates, mais aussi en tant que Gérant de l'établissement (Administrateur).

---

## I. Section Utilisateur (Client du Studio)

En tant qu'utilisateur de L'Espace Doré, vous pouvez facilement gérer votre compte, suivre vos progressions, vous inscrire à des cours de Pilates interactifs et interagir avec l'assistance IA de notre logiciel.

### 1.1 Inscription, Connexion et Gestion de Sécurité
- **Créer un profil** : Rendez-vous sur la page **S'inscrire**. Saisissez un prénom, un nom, une adresse email valide, et paramétrez un mot de passe robuste muni de la double saisie pour éviter toute faute de frappe. Pour garantir votre identité, **un code OTP vous sera directement envoyé par email**. Vous devrez copier ce code numérique à l'écran suivant pour finaliser votre inscription.
- **Récupérer l'accès** : Si vous oubliez le mot de passe, utilisez la fonctionnalité « Mot de passe oublié » sur l'écran **Connexion**. C'est le studio qui génèrera à distance un lien direct de connexion temporaire envoyé sur votre messagerie.
- **Modification des informations (Profil)** : Dès la page "Informations Personnelles", vous pouvez corriger vos coordonnées en direct : changer d'adresse e-mail, de numéro de téléphone (Utile si un cours de dernière minute s'annule) ou encore de mot de passe à tout moment. Vous pouvez à tout moment cocher/décocher l'abonnement à notre **Newsletter**.

### 1.2 Naviguer dans le Planning
- **Calendrier interactif Hebdomadaire** : Consultez l’ensemble des séances de la semaine grâce à de pratiques clics directionnels (Gauches / Droits). Contrairement à des agendas rigides, ici le planning adapte le rendu des cours selon qu'ils soient terminés, pleins ou à venir !
- **Les 4 états possibles de vos cours** :
  - **« Réserver »** : Le cours a des places disponibles, vous pouvez vous y engager si votre **Solde de Crédits** vous le permet.
  - **« Inscrit »** : Le cours est bloqué dans votre agenda. 
  - **« Complet »** : Malheureusement, tous les slots (la Capacité fixe) ont été consommés par d'autres élèves.
  - **« Terminé »** : La date de la séance a été dépassée, vous ne pouvez plus exécuter d'action dessus.
- **Aide par un assistant Intelligence Artificielle (IA)** : Une barre novatrice "Quel cours pour moi ?" est intégrée par-dessus votre planning. Tapez ce dont votre dos a besoin ce Lundi pour vous régénérer musculairement, l'IA Gemini/Groq scannera le calendrier et vous conseillera en direct la séance associée à votre description (ex: *"Pilates Fondamental à 18H ce Mardi"*).

### 1.3 Gérer les Séances & Annulations
- **Solde de Cours (Crédits)** : Lors de chaque action (inscription ou annulation dans le délai imparti), vos crédits de cours seront actualisés instantanément. Si votre Solde tombe à zéro, une information vous proposera d'accéder au volet "Tarifs".
- **Limites d'annulation** : Il est vital de noter que le studio définit un paramètre drastique pour les abandons soudains ! (Généralement configuré à **12 ou 24 heures**). 
  - Allez au sein de votre Profil, dans l’onglet **Mes Séances**.
  - Si le cours survient dans les **72 prochaines heures quantifiables**, annuler ne sera plus cliquable / grisé. Sinon, le bouton affiché **"Annuler"** remboursera entièrement les droits du cours.
  
### 1.4 Boutique, Paiements & Factures
- **Lister vos paquets de crédits actifs** : Dans votre profil, une section vous affiche rigoureusement la péremption d’un forfait de cours (Certains forfaits peuvent périmer passés 3 mois). Un format en couleur vous alertera des cours **périmant sous les 7 jours** pour éviter le gâchis.
- **Abonnement Illimités** : Acheter des abonnements exclusifs ne requiert aucun débit instantané des crédits — un élève abonné réservera la place standard jusqu'à ce que son mois d'abonnés s’estompe.
- **Le Téléchargement de la Facture** : Dans l'onglet **Paiements et Crédits**, vous pouvez filtrer la comptabilité des 12 derniers mois et appuyer sur l'icône de la flèche de téléchargement en face du cours désiré pour éditer une *Facture formatée en document officiel* pour un remboursement d’entreprise (CSE).

---

## II. Section Administrateur (Gérant)

Dès l'authentification avec votre compte gérant, le bouton `Administration` apparaît sur votre volet "Profil". Cette interface est divisée en plusieurs panneaux (Onglets) qui commandent la totalité de L'Espace Doré. 

### 2.1 Le Planning et Les Modèles (Templates) de Cours
Le concept central pour éviter de réécrire 100 fois "Yoga Lundi Matin" est de créer d'abord un modèle (Template), puis d'assigner l'action via le modèle généré :
- **Onglet "Modèles" (Templates de Cours)** :
  - Un modèle dispose d’un Titre descriptif (ex. `Pilates Postural 45min`), d’une Capacité d’Élèves stricte (ex. `10`) et du coût unitaire (Normalement `1` Crédit, mais peut s'évaluer à `2` Crédits pour des cours rares comme le *Reformer*). 
- **Onglet "Planning"** :
  - **Ajouter une Séance Isolée** : Choisissez le format de la date, l'heure et affectez le Modèle désiré ("Reformer" ce jeudi !).
  - **Ajouter des Cours Récurrents** : Créer automatiquement une batterie de modèles réguliers ! Programmez un cours les "Lundis à 18H" et dites au calendrier de répéter cette tâche automatique dans le logiciel jusqu'au `31 décembre 2026`. Le logiciel intégrera les séances d'un coup !
  - **Cliquer sur un cours du calendrier administrateur** : 
      Vous pourrez *forcer* l'élimination libre et arbitraire d’un élève qui s’était inscrit (sans délai maximal pérenne, vous gérant être prioritaire), ou d’annuler la séance complète. L'annulation complète **rembourse instantanément tous les clients inscrits par virement de la devise crédit sur leur profil**, et émet un e-mail transactionnel de déception.

### 2.2 Annuaire des Clients & Comptabilité (Le Livre de Recettes)
Un volet majeur est réservé au suivi de votre activité commerciale et de votre base CRM (Gestion de Relation Client) :
- **Onglet "Utilisateurs"** :
  - Cliquez sur n'importe lequel de vos clients pour observer l’arborescence profonde de ses séances validées ces 2 derniers mois, ou planifiées des lundis prochains.
  - Plus une interface "Ajuster ou Prolonger un Paiement" qui sert souvent à de la fidélisation ! En deçà des plateformes bancaires (Stripe), vous pouvez accorder **« +1 » crédit offert lié commercialement** à un client ! Appliquer un correctif administratif se marquera historiquement d’un ajustement.
- **Onglet « Le Livre Manuscrit De Recettes »** :
  - Affiché à droite, le système vous délivre le calcul du chiffre d'affaires immédiat de la base (sur n'importe quelle date du 1er mai au 10 mai).
  - Deux boutons intégrés permettent aux gérants de générer et imprimer votre Livre Commerçant format **Excel (.xlsx)** ou Numérique brutal **.CSV**.

### 2.3 Configuration Profonde des Délais Studio & Newsletter Massive E-mail
- **Ajuster le Délai Administratif** : 
  - La limite des annulations (Fixée généralement à *12H ou 24H* dans le menu `Paramètres`).
  - La période de renouvellement des Forfaits Uniques d'1 séance (Abonnement Mensuel autorisé `1 cours/semaine`) est configurable : si l'agenda se remet à neuf tous les Lundis avec les abonnements clients. 
- **La Lettre d’Informations (Newsletter / Emailing)** :
  - À partir du bouton de conception de messagerie HTML visuelle (Grâce au standard **Quill Editor** d'hypertexte), écrivez des promotions stylisées (Gras, italique, liens).
  - Le système filtre automatiquement ceux qui ont décoché *« Recevoir des nouvelles du studio »* au tout début de l’inscription ou via leur profil. Le gérant pourra cibler individuellement ce qu'il a perçu, ou « Choisir Tout » pour adresser la promotion massive ! 

---

### III. Contraintes Techniques & Limites Actuelles du Système

Afin de pouvoir anticiper l'utilisation logicielle : 

- Ce n'est **pas une infrastructure locale intégrée (type Logiciel Lourd Windows)**, mais une API Cloud (Service Web), si le service de connectivité au réseau se tarit, les vues des plannings (fetch) vous renverront une interface de chargement constante. 
- Le traitement des mots de passe oubliés exige que l'e-mail du client soit strictement valide et que les serveurs courriers (SMTP/SendGrid) relaient ce signal correctement. Vérifiez votre boîte "Spams" s'il échappe à nos courriers classifiés sains.
- Au sein de la Newsletter de masse, une expédition trop large (Supérieure à *300 destinataires*) peut, selon la robustesse du SMTP du serveur Node.js relié, marquer un goulot d'étranglement ou être délaissée par votre fournisseur. Limitez-vous ou segmentez la communication hebdomadairement !
