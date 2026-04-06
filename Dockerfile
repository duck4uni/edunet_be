# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install all dependencies with verbose output
RUN npm ci --verbose 2>&1 | tail -20

# Copy source code
COPY . .

# Build with verbose output
RUN npm run build 2>&1

# List dist to verify build worked
RUN echo "=== Checking built files ===" && ls -lah dist/main* || echo "ERROR: dist/main not found"

# Remove dev dependencies
RUN npm prune --omit=dev 2>&1 | tail -10

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
