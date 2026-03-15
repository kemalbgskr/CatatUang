FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
# prisma schema is needed to generate the client
COPY prisma ./prisma/
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Needs SQLite support at runtime
RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create required directories for persistent sqlite db and Next.js cache
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
RUN mkdir -p /app/.next/cache && chown nextjs:nodejs /app/.next/cache

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
# Prisma needs querying engines which usually get placed in .next/standalone/node_modules
# but better to copy the whole node_modules from builder to be safe or rely on standalone mode.
# Below copies the generated standalone directories from next build.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# We also copy node_modules to guarantee prisma binary exists, but standalone includes it.
# However, just to ensure DB pushes can be done if wanted:
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
