FROM node:20-alpine

WORKDIR /app

COPY package* ./

RUN npm install

ADD . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]