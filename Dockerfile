FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
COPY . .
ARG DATABASE_URL="postgresql://collegepath:collegepath_dev@postgres:5432/collegepath?schema=public"
ARG BETTER_AUTH_SECRET="build-only-secret-not-for-runtime-change-this-value"
ARG NEXT_PUBLIC_APP_URL
ENV DATABASE_URL=$DATABASE_URL
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN test -n "$NEXT_PUBLIC_APP_URL" || { echo "Set NEXT_PUBLIC_APP_URL as a build argument." >&2; exit 1; }
RUN npx prisma generate && npm run build

FROM dependencies AS database-tools
COPY . .
ARG DATABASE_URL="postgresql://collegepath:collegepath_dev@postgres:5432/collegepath?schema=public"
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate
CMD ["npm", "run", "db:deploy"]

FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
