# Utilise une image Node.js légère comme base
FROM node:20-slim

# Définit le dossier de travail dans le conteneur
WORKDIR /app

# Copie les fichiers de configuration npm
COPY package*.json ./

# Installe uniquement les dépendances de production
RUN npm install --production

# Copie tout le reste du code source (sauf ce qui est dans .dockerignore)
COPY . .

# Expose le port 5051 (celui défini dans votre .env)
EXPOSE 5051

# Commande pour démarrer le serveur
CMD ["node", "server.js"]