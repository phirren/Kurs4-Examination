FROM node:22-alpine

WORKDIR /app

COPY services/shared/package.json services/shared/
COPY services/product-service/package.json services/product-service/

WORKDIR /app/services/shared
RUN npm install

WORKDIR /app/services/product-service
RUN npm install

WORKDIR /app
COPY services/shared/ services/shared/
COPY services/product-service/ services/product-service/

WORKDIR /app/services/shared
RUN npm run build

WORKDIR /app/services/product-service
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/index.js"]
