FROM node:20-alpine AS builder

WORKDIR /app

# 1. Build frontend
COPY package.json package-lock.json ./
RUN npm ci

COPY src ./src
COPY index.html ./
COPY public ./public
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY tsconfig.json ./
RUN npm run build

# 2. Build backend
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci

COPY server/prisma ./prisma
COPY server/src ./src
COPY server/tsconfig.json ./
RUN npx prisma generate && npx prisma db push --accept-data-loss && npm run build

# 3. Production image
FROM node:20-alpine

WORKDIR /app

# Install production deps
COPY server/package.json server/package-lock.json ./
RUN npm ci --production

# Copy built backend
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/server/node_modules/.prisma ./node_modules/.prisma

# Copy built frontend (so backend can serve static files)
COPY --from=builder /app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=10000
ENV DATABASE_URL=file:/data/prod.db

EXPOSE 10000

CMD ["node", "dist/index.js"]
