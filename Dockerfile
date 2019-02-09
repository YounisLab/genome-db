FROM node:8

WORKDIR /home/

COPY package.*json ./

RUN npm install

COPY . .

CMD ["npm", "run", "dev"]

