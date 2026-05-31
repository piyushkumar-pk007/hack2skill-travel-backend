FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package.json
COPY turbo.json turbo.json
COPY tsconfig.base.json tsconfig.base.json
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install

COPY apps/api apps/api
COPY packages/shared packages/shared

RUN npm run build --workspace @travel-engine/shared
RUN npm run prisma:generate --workspace @travel-engine/api
RUN npm run build --workspace @travel-engine/api

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

EXPOSE 3001

CMD ["sh", "-c", "cd /app/apps/api && npx prisma migrate deploy && node dist/index.js"]
