FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://dummy:dummy@localhost/dummy" npx prisma generate

RUN npm run build

RUN npm prune --production

FROM node:22-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=builder /usr/src/app/dist ./dist

COPY --from=builder /usr/src/app/node_modules ./node_modules

COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000

CMD [ "node", "dist/src/main" ]