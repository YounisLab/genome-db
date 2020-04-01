FROM node:13

WORKDIR /home/

COPY package.*json ./

RUN npm install

COPY . .

CMD ["npm", "run", "dev"]

