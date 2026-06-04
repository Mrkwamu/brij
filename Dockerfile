FROM node:24

#Inside the container, create/use a folder called /app
WORKDIR /app 

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "start:dev"]