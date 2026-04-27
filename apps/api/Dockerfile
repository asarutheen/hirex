FROM node:20-alpine
WORKDIR /app

# Copy root package.json and workspace packages
COPY package.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/db/prisma ./packages/db/prisma
COPY packages/db/index.ts ./packages/db/
COPY packages/db/generated ./packages/db/generated
COPY packages/typescript-config/ ./packages/typescript-config/

# Copy api
COPY apps/api/package.json ./apps/api/
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json

# Replace workspace:* with actual path for npm
RUN cd apps/api && sed -i 's|"@hirex/db": "workspace:\*"|"@hirex/db": "file:../../packages/db"|g' package.json

# Install from api folder
WORKDIR /app/apps/api
RUN npm install

# Build
RUN npm run build

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]