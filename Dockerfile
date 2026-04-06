# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application - show errors
RUN npm run build && echo "Build completed successfully" || (echo "Build failed" && exit 1)

# Verify dist folder exists
RUN ls -la dist/ || (echo "dist folder not found after build" && exit 1)

# Remove dev dependencies, keep prod only
RUN npm prune --omit=dev

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api', (r) => {if (r.statusCode !== 404 && r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to ensure proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main"]
