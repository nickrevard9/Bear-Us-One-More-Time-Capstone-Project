FROM node:22.19.0

WORKDIR /app

COPY package*.json ./api-backend

RUN npm install && npm cache clean --force

COPY . .

ENV PORT=8888

EXPOSE 8888

CMD ["node", "api-backend/server.js"]