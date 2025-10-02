# Build stage using Node 16 (FROM in uppercase)
FROM node:16-alpine as build

# Set working directory
WORKDIR /project

# Copy package.json and package-lock.json to optimize caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Generate version info with timestamp for logging
RUN export BUILD_VERSION="$(node -p "require('./package.json').version")-$(date -u +"%Y%m%d%H%M%S")" && \
    echo "Version: $BUILD_VERSION" > version.txt && \
    echo "Build Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> version.txt

# Build the application (running gulp)
RUN npm run build

# Production stage using Nginx (FROM in uppercase)
FROM nginx:1.21-alpine

# Copy built files from the build stage into Nginx's HTML folder
COPY --from=build /project/dist /usr/share/nginx/html

# Copy version file for logging
COPY --from=build /project/version.txt /app/version.txt

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
