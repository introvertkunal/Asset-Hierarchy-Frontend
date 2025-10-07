
FROM node:18 AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine


COPY --from=build /app/dist /usr/share/nginx/html


COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY localhost+2.pem /etc/nginx/certs/localhost+2.pem

COPY localhost+2-key.pem /etc/nginx/certs/localhost+2-key.pem

EXPOSE 80 443
