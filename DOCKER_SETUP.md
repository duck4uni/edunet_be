# Docker Setup Guide for EduNet Backend

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Quick Start

### 1. Copy environment configuration
```bash
cp .env.example .env
# or
cp .env.docker .env
```

### 2. Build and run the application
```bash
docker-compose up --build
```

This will:
- Build the NestJS application
- Start PostgreSQL database
- Start the backend application
- Run database migrations automatically

### 3. Access the application
- **API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/docs
- **PostgreSQL**: localhost:5432

## Common Commands

### Start services
```bash
# Build and start (first time)
docker-compose up --build

# Start without rebuilding
docker-compose up

# Start in background
docker-compose up -d
```

### Stop services
```bash
docker-compose down

# With volume cleanup (deletes database)
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs app
docker-compose logs postgres

# Follow logs
docker-compose logs -f app
```

### Execute commands in running container
```bash
# Run migrations
docker-compose exec app npm run migration:migrate

# Run seeds
docker-compose exec app npm run seed:migrate

# Access container shell
docker-compose exec app /bin/sh
```

### Rebuild application after code changes
```bash
docker-compose up --build

# or
docker-compose rebuild app
docker-compose restart app
```

## Environment Variables

All environment variables from `.env` file will be used. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_HOST | postgres | PostgreSQL hostname (use 'postgres' in Docker) |
| DATABASE_PORT | 5432 | PostgreSQL port |
| DATABASE_USER | postgres | PostgreSQL username |
| DATABASE_PASSWORD | 123456 | PostgreSQL password |
| DATABASE_DB | edunet_db | Database name |
| PORT | 3000 | Application port |
| JWT_SECRET | - | JWT signing secret (generate one) |
| FE_URL | http://localhost:5173 | Frontend URL for CORS |

## Database Management

### First run setup
```bash
# Migrations run automatically when container starts
# If you need to manually run:
docker-compose exec app npm run migration:migrate

# Seed data:
docker-compose exec app npm run seed:migrate
```

### Reset database
```bash
docker-compose down -v
docker-compose up --build
```

### Access PostgreSQL directly
```bash
docker-compose exec postgres psql -U postgres -d edunet_db

# Show tables:
\dt

# Exit:
\q
```

## Production Deployment

For production, consider:

1. Use environment-specific `.env` files
2. Set stronger JWT_SECRET and PASSWORD_SECRET
3. Disable source volume mounts (remove volumes in docker-compose.yml)
4. Use persistent named volumes for database
5. Implement backup strategy for database volumes
6. Add reverse proxy (nginx)
7. Use Docker secrets for sensitive data

Example production docker-compose:
```yaml
app:
  build:
    context: .
    dockerfile: Dockerfile
  environment:
    NODE_ENV: production
    # ... production environment variables
  # Remove volumes section
  restart: always
```

## Troubleshooting

### Port already in use
```bash
# Change port in .env
PORT=3001

# Or kill existing process
docker-compose down
```

### Database connection refused
```bash
# Check if postgres is running
docker-compose ps

# View postgres logs
docker-compose logs postgres

# Check database readiness
docker-compose exec app npm run migration:show
```

### Application crashes on startup
```bash
# View application logs
docker-compose logs app

# Access shell and debug
docker-compose exec app /bin/sh
npm run migration:show
```

### Out of disk space
```bash
# Clean up unused Docker resources
docker system prune -a --volumes
```

## Development Tips

- Source code is mounted as a volume, changes reflect immediately (hot-reload)
- Database persists in `postgres_data` volume between restarts
- Use `docker-compose logs -f` to follow logs during development
- Run `docker-compose down -v` to reset everything and start fresh
