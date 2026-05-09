# Stage 1 — compile TypeScript
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2 — production runtime
FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 8000
CMD ["node", "dist/index.js"]