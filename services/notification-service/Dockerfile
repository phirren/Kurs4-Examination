FROM node:22-alpine

WORKDIR /app

COPY services/shared/package.json services/shared/
COPY services/notification-service/package.json services/notification-service/

WORKDIR /app/services/shared
RUN npm install

WORKDIR /app/services/notification-service
RUN npm install

WORKDIR /app
COPY services/shared/ services/shared/
COPY services/notification-service/ services/notification-service/

WORKDIR /app/services/shared
RUN npm run build

WORKDIR /app/services/notification-service
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/index.js"]
