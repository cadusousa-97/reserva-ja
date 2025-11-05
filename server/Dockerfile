FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

COPY prisma/schema.prisma ./prisma/

RUN DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy" npx prisma generate

RUN npm run build && ls -R dist

RUN npm prune --production


FROM node:18-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=builder /usr/src/app/node_modules ./node_modules

COPY --from=builder /usr/src/app/dist ./dist

COPY --from=builder /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client

COPY --from=builder /usr/src/app/prisma/schema.prisma ./prisma/

EXPOSE 3000

CMD [ "node", "dist/src/main" ]