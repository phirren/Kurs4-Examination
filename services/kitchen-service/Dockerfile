FROM node:22-alpine

WORKDIR /app

COPY services/shared/package.json services/shared/
COPY services/kitchen-service/package.json services/kitchen-service/

WORKDIR /app/services/shared
RUN npm install

WORKDIR /app/services/kitchen-service
RUN npm install

WORKDIR /app
COPY services/shared/ services/shared/
COPY services/kitchen-service/ services/kitchen-service/

WORKDIR /app/services/shared
RUN npm run build

WORKDIR /app/services/kitchen-service
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/index.js"]
