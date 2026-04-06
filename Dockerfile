# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Start the application (dev mode with watch)
# For production, build the app separately
CMD ["npm", "run", "start:dev"]
