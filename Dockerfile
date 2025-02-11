FROM node:23-slim

WORKDIR /usr/src/app

COPY package* /usr/src/app/

RUN npm install

COPY ./ /usr/src/app/

CMD ["node", "index.js"]
