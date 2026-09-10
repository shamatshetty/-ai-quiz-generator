FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm run setup

# Copy application source
COPY . .

# Generate Prisma client and build frontend
RUN npm run build
RUN cd server && npx prisma db push && node prisma/seed.js

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

CMD ["npm", "start"]
