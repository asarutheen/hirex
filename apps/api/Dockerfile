FROM node:20-alpine
WORKDIR /app

# Copy root package.json and workspace packages
COPY package.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/db/prisma ./packages/db/prisma
COPY packages/db/index.ts ./packages/db/
COPY packages/db/generated ./packages/db/generated
COPY packages/typescript-config/ ./packages/typescript-config/
COPY packages/db/tsconfig.json ./packages/db/tsconfig.json

# Copy api
COPY apps/api/package.json ./apps/api/
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json

# Replace workspace:* with actual path for npm
RUN cd apps/api && sed -i 's|"@hirex/db": "workspace:\*"|"@hirex/db": "file:../../packages/db"|g' package.json

# Install dependencies for db package first
WORKDIR /app/packages/db
RUN npm install
RUN npx tsc

# Install and build api
WORKDIR /app/apps/api
RUN npm install
RUN npm run build

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]