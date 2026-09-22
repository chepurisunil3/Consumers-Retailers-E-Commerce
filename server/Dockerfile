# Build context must be the repository root, e.g.:
#   docker build -f server/Dockerfile -t crec-api .
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY config ./config
COPY server ./server

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "server/server.js"]
