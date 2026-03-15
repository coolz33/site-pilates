# Utilise une image Node.js légère comme base
FROM node:20-slim

# Définit le dossier de travail dans le conteneur
WORKDIR /app

# Copie les fichiers de configuration npm
COPY package*.json ./

# Installe toutes les dépendances (nécessaire pour compiler Tailwind)
RUN npm install

# Copie tout le reste du code source (sauf ce qui est dans .dockerignore)
COPY . .

# Génère le fichier CSS de production avec Tailwind CLI
RUN npx tailwindcss -i style.css -o style-dist.css --minify

# Supprime les dépendances de développement pour alléger l'image finale
RUN npm prune --production

# Définit les variables d'environnement nécessaires
ENV PORT=5051
ENV NODE_ENV=production

# Expose le port 5051 (celui défini dans votre .env)
EXPOSE 5051

# Commande pour démarrer le serveur
CMD ["node", "server.js"]