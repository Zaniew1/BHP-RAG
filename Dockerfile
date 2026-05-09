FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Prisma client
RUN npx prisma generate

# Build TS -> dist
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]