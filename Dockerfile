FROM node:20 AS builder
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . ./
RUN pnpm run build

FROM node:20-slim AS runner
WORKDIR /app

RUN corepack enable

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
RUN pnpm install --prod --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY serve.json ./

ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "./node_modules/.bin/serve -s dist -l ${PORT}"]
