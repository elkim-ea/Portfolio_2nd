FROM node:22-alpine AS builder

WORKDIR /app

COPY apps/backend/package*.json ./apps/backend/

WORKDIR /app/apps/backend

RUN npm ci

COPY apps/backend ./ 

RUN npm run build:server


FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY apps/backend/package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/apps/backend/dist-server ./dist-server

EXPOSE 3000

CMD ["node", "dist-server/index.cjs"]