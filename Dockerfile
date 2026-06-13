FROM node:20 AS builder
WORKDIR /app

COPY artifacts/huseyine-saplak/package.json \
     artifacts/huseyine-saplak/package-lock.json ./
RUN npm ci --ignore-scripts

COPY artifacts/huseyine-saplak/ ./
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app

COPY --from=builder /app/package.json ./
RUN npm install --omit=dev --ignore-scripts

COPY --from=builder /app/dist/public ./dist/public
COPY artifacts/huseyine-saplak/serve.json ./

ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "./node_modules/.bin/serve -s dist/public -l ${PORT}"]
