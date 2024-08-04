FROM node:14.1-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# dev stage
FROM build-stage as development
EXPOSE 8082
CMD [ "yarn", "start" ]

# production stage
FROM nginx:stable-alpine as production
COPY --from=build-stage /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]