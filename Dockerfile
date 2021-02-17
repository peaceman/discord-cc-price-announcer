FROM node:15.8-buster

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y dumb-init  \
    && rm -rf /var/lib/apt/lists*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src .

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
