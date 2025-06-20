FROM node:latest as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
RUN npm install -g @angular/cli
COPY . .
RUN npm run build --configuration=production

FROM nginx:latest
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/timesheet-ey-client /usr/share/nginx/html
EXPOSE 80

#build: docker build -t timesheet-ey-client-nodejs .
#run: docker run -d -p 8080:80 timesheet-ey-client-nodejs