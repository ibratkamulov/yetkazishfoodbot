# ===== Build stage =====
FROM node:20-slim AS builder        # alpine → slim
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# OpenSSL qo'shing
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY . .
RUN npx prisma generate
RUN npm run build

# ===== Runtime stage =====
FROM node:20-slim AS runner          # alpine → slim
WORKDIR /app

ENV NODE_ENV=production

# OpenSSL + tini
RUN apt-get update -y && apt-get install -y openssl tini && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

RUN mkdir -p logs uploads

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/main.js"]