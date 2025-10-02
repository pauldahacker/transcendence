FROM node:20-alpine

WORKDIR /app

COPY package* ./

RUN npm install

RUN apk add --no-cache curl

ADD . .

CMD ["node", "server.js"]