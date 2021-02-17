FROM node:15.8-buster
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src .

CMD ["node", "index.js"]
