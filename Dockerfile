# --- Stage 1: build the frontend ---
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Stage 2: production server ---
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY server ./server
COPY --from=frontend-build /app/dist ./dist
EXPOSE 4000
CMD ["node", "server/index.js"]