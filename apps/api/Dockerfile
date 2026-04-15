FROM node:20-alpine
WORKDIR /app

# Copy everything
COPY package.json ./
COPY apps/api/ ./apps/api/
COPY packages/typescript-config/ ./packages/typescript-config/

# Install using npm directly inside api folder
WORKDIR /app/apps/api
RUN npm install

# Build
RUN npm run build

# Run
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]