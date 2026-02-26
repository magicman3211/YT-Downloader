# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install -D @types/node
COPY . .
RUN npm run build

# Production runtime stage
FROM nginx:alpine
# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html
# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
