FROM node:20 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts

COPY . ./
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app

COPY --from=builder /app/package.json ./
RUN npm install --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY serve.json ./

ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "./node_modules/.bin/serve -s dist -l ${PORT}"]
