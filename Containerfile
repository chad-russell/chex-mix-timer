## Stage 1: Build frontend and server
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

## Build frontend
RUN npm run build
## Build server (standalone tsconfig)
RUN npx tsc -p server/tsconfig.json

## Stage 2: Run with Node (serves static + API)
FROM node:24-alpine

WORKDIR /app

# Copy node_modules to run web server
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package*.json /app/

# App assets
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/server/dist /app/server/dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server/dist/index.js"]
