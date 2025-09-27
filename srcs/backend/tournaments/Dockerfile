FROM node:20-bullseye-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev || npm install --only=production

COPY . .

ENV NODE_ENV=production
CMD ["node", "server.js"]