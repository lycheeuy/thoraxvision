# syntax=docker/dockerfile:1

# ---- deps: install dependencies with a clean, reproducible lockfile ----
FROM node:20-alpine AS deps
WORKDIR /app
# libc compat some npm packages expect on alpine
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: build the Next.js standalone output ----
FROM node:20-alpine AS builder
WORKDIR /app
# Browser-facing API URL is inlined into the client bundle at BUILD time.
# Default targets the host-published backend; override at build for other envs.
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner: minimal production image, standalone server only ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Run as the built-in non-root 'node' user
USER node
# Standalone server + its traced node_modules
COPY --from=builder --chown=node:node /app/.next/standalone ./
# Static chunks (not included in standalone — copied explicitly)
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
# Public assets
COPY --from=builder --chown=node:node /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]