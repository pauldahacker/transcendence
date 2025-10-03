FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package* ./

RUN npm install

ADD . .

CMD ["npm", "run", "dev"]