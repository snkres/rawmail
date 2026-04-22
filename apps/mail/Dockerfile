FROM node:20-alpine
WORKDIR /app
COPY apps/mail/package.json ./
COPY apps/mail/server.js ./
RUN npm install
CMD ["node", "server.js"]
