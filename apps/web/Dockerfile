# Multi-stage Dockerfile for production Next.js frontend
FROM node:18-alpine AS base
RUN npm install -g pnpm

# Stage 1: Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY packages/constants/package.json ./packages/constants/
COPY packages/types/package.json ./packages/types/
COPY packages/utilities/package.json ./packages/utilities/
COPY libs/ui/package.json ./libs/ui/
COPY libs/sdk/package.json ./libs/sdk/

RUN pnpm install --frozen-lockfile

# Stage 2: Rebuild the source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/constants/node_modules ./packages/constants/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/utilities/node_modules ./packages/utilities/node_modules
COPY --from=deps /app/libs/ui/node_modules ./libs/ui/node_modules
COPY --from=deps /app/libs/sdk/node_modules ./libs/sdk/node_modules

COPY . .

# Build TS shared packages
RUN pnpm --filter @hiremind/constants build
RUN pnpm --filter @hiremind/types build
RUN pnpm --filter @hiremind/utilities build
RUN pnpm --filter @hiremind/ui build
RUN pnpm --filter @hiremind/sdk build

ENV NEXT_PUBLIC_API_URL=/api/v1
RUN pnpm --filter web build

# Stage 3: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/libs ./libs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "--filter", "web", "start"]
