FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# On ne met PAS de ligne RUN npx tailwindcss ici !
RUN npm prune --production
ENV PORT=5051
ENV NODE_ENV=production
EXPOSE 5051
CMD ["node", "server.js"]