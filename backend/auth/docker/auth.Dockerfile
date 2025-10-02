FROM node:20-alpine

WORKDIR /app

COPY package* ./

RUN npm install

ADD . .

CMD ["node", "server.js"]