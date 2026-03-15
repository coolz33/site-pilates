-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost
-- Généré le : ven. 13 mars 2026 à 17:36
-- Version du serveur : 10.11.11-MariaDB
-- Version de PHP : 8.2.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `pilates`
--

-- --------------------------------------------------------

--
-- Structure de la table `bookings`
--

CREATE TABLE `bookings` (
  `class_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Déchargement des données de la table `bookings`
--

INSERT INTO `bookings` (`class_id`, `user_id`) VALUES
(7, 3),
(9, 3);

-- --------------------------------------------------------

--
-- Structure de la table `classes`
--

CREATE TABLE `classes` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `time` varchar(10) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `points_price` int(11) DEFAULT 1,
  `credits_price` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Déchargement des données de la table `classes`
--

INSERT INTO `classes` (`id`, `title`, `date`, `time`, `duration`, `capacity`, `description`, `points_price`, `credits_price`) VALUES
(1, 'Pilates Fondations', '2026-02-23', '09:00', 60, 10, 'Idéal pour acquérir les bases de la méthode, comprendre la respiration et le placement du bassin.', 1, 1),
(2, 'Pilates Flow', '2026-02-24', '18:30', 45, 12, 'Un enchaînement fluide et dynamique pour faire monter le rythme cardiaque tout en contrôlant ses mouvements.', 1, 1),
(3, 'Core & Posture', '2026-02-25', '12:15', 45, 8, 'Focus intense sur la sangle abdominale et les muscles profonds du dos pour redresser la silhouette.', 1, 1),
(4, 'Pilates Avancé', '2026-02-26', '19:00', 60, 10, 'Réservé aux pratiquants réguliers. Des exercices complexes pour défier votre équilibre et votre force.', 1, 1),
(5, 'Stretching & Mobilité', '2026-02-28', '10:00', 60, 15, 'Une séance douce axée sur les étirements profonds et l\'amplitude articulaire pour libérer les tensions.', 1, 1),
(7, 'Pilates Mat Fondamental', '2026-03-09', '10:00', 60, 10, 'Séance au sol axée sur les principes de base.', 1, 20),
(8, 'Pilates Flow Dynamique', '2026-03-09', '17:00', 45, 10, 'Enchaînement fluide pour travailler le cardio et la souplesse.', 1, 22),
(9, 'Spécial Dos & Posture', '2026-03-10', '17:00', 50, 10, 'Focus sur le renforcement des muscles profonds du dos.', 1, 25),
(11, 'Pilates avec Accessoires', '2026-03-13', '15:00', 60, 10, 'Utilisation de ballons, cercles et élastiques.', 1, 23);

-- --------------------------------------------------------

--
-- Structure de la table `course_templates`
--

CREATE TABLE `course_templates` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `default_credits_price` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Déchargement des données de la table `course_templates`
--

INSERT INTO `course_templates` (`id`, `title`, `description`, `duration`, `default_credits_price`) VALUES
(1, 'Pilates Mat Fondamental', 'Séance au sol axée sur les principes de base.', 60, 20),
(2, 'Pilates Flow Dynamique', 'Enchaînement fluide pour travailler le cardio et la souplesse.', 45, 22),
(3, 'Spécial Dos & Posture', 'Focus sur le renforcement des muscles profonds du dos.', 50, 25),
(4, 'Pilates avec Accessoires', 'Utilisation de ballons, cercles et élastiques.', 60, 23);

-- --------------------------------------------------------

--
-- Structure de la table `credit_packages`
--

CREATE TABLE `credit_packages` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `credits` int(11) DEFAULT NULL,
  `price` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Déchargement des données de la table `credit_packages`
--

INSERT INTO `credit_packages` (`id`, `name`, `credits`, `price`) VALUES
(70, 'Pack Découverte', 20, 20),
(71, 'Pack Équilibre (100 crédits)', 100, 80),
(72, 'Pack Sérénité (200 crédits)', 200, 140);

-- --------------------------------------------------------

--
-- Structure de la table `email_verifications`
--

CREATE TABLE `email_verifications` (
  `email` varchar(100) NOT NULL,
  `code` varchar(10) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `password_resets`
--

CREATE TABLE `password_resets` (
  `token` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `point_packages`
--

CREATE TABLE `point_packages` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `points` int(11) DEFAULT NULL,
  `price` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Déchargement des données de la table `point_packages`
--

INSERT INTO `point_packages` (`id`, `name`, `points`, `price`) VALUES
(1, 'Pack Découverte', 1, 20),
(2, 'Pack Équilibre (10 séances)', 10, 180),
(3, 'Pack Sérénité (20 séances)', 20, 320);

-- --------------------------------------------------------

--
-- Structure de la table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `studioAddress` varchar(255) DEFAULT NULL,
  `studioPhone` varchar(50) DEFAULT NULL,
  `studioEmail` varchar(100) DEFAULT NULL,
  `cancellationDelay` int(11) DEFAULT 24
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Déchargement des données de la table `settings`
--

INSERT INTO `settings` (`id`, `studioAddress`, `studioPhone`, `studioEmail`, `cancellationDelay`) VALUES
(1, '12 Rue de la Paix, Paris', '01 23 45 67 89', 'contact@pilates.fr', 128);

-- --------------------------------------------------------

--
-- Structure de la table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `amount` int(11) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Déchargement des données de la table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `type`, `amount`, `description`, `date`) VALUES
(1, 3, 'booking', -25, 'Réservation : undefined', '2026-03-09 17:05:24'),
(2, 3, 'gift', 3, 'Cadeau administrateur', '2026-03-09 17:08:31');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `firstName` varchar(100) DEFAULT NULL,
  `lastName` varchar(100) DEFAULT NULL,
  `name` varchar(200) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `role` varchar(20) DEFAULT 'user',
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `points_balance` int(11) DEFAULT 0,
  `zipCode` varchar(10) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `credits_balance` int(11) DEFAULT 0,
  `newsletter_subscribed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `firstName`, `lastName`, `name`, `email`, `password`, `role`, `address`, `phone`, `points_balance`, `zipCode`, `city`, `credits_balance`, `newsletter_subscribed`) VALUES
(1, 'Admin', 'Istrateur', 'Admin Istrateur', 'admin@pilates.fr', '$2b$10$PVnyRJImFDaRX16n7NoJWeojEk/gyhB9NT7oJy3fK8uTLuSWweMQO', 'admin', '12 Rue de la Paix', '0123456789', 0, '75000', 'Paris', NULL, 1),
(3, 'SEBASTIEN', 'AGIER', 'SEBASTIEN AGIER', 'coolz33@yahoo.fr', '$2b$10$g5.BXLdPbs.EqkjWV4q0g.rA0fUFNzjd5jhquBxEGUlW0PjRHQEDG', 'user', '985 RUE LAMARTINE', '0616524682', 0, '69400', 'VILLEFRANCHE SUR SAONE', 270, 1),
(4, 'Benedictes', 'RUEL', 'Benedictes RUEL', 'coolz33@gmail.com', '$2b$10$RyXzd03Cy4Z9qS4ZIV/wf.LnI7LU8tmzWI17NlicHA0voF5lrrHgm', 'user', '21 Chemin de clavel', '0123456789', 0, '07300', 'TOURNON SUR RHONE', 0, 0),
(11, 'Sébastien', 'Agier', 'Sébastien Agier', 'sebastien.agier@gmail.com', '$2a$10$5ZLC3rSlpmESEuYbqlJYCOt13pPVloxVgrcoZ8oHsHfSWTNSBV9aO', 'user', '985 RUE LAMARTINE aa', '0616524682', 0, '69400', 'VILLEFRANCHE-SUR-SAÔNE', 40, 1);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`class_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `course_templates`
--
ALTER TABLE `course_templates`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `credit_packages`
--
ALTER TABLE `credit_packages`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `email_verifications`
--
ALTER TABLE `email_verifications`
  ADD PRIMARY KEY (`email`);

--
-- Index pour la table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`token`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `point_packages`
--
ALTER TABLE `point_packages`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pour la table `course_templates`
--
ALTER TABLE `course_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `credit_packages`
--
ALTER TABLE `credit_packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

--
-- AUTO_INCREMENT pour la table `point_packages`
--
ALTER TABLE `point_packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
