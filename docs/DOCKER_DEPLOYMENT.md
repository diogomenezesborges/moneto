# Docker Deployment Guide

> **Last Updated**: 2026-01-25
> **Status**: Implemented (Issue #30)

## Overview

This guide covers deploying Moneto using Docker containers with PostgreSQL and Redis.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose V2
- 2GB RAM minimum
- 10GB disk space

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-username/moneto.git
cd moneto
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.docker .env.docker.local

# Edit with your values
nano .env.docker.local
```

**Required configuration**:

```env
# Change these secrets!
JWT_SECRET=your_very_long_random_secret_minimum_32_characters
CSRF_SECRET=your_csrf_secret_minimum_32_characters
POSTGRES_PASSWORD=your_secure_database_password
REDIS_PASSWORD=your_secure_redis_password

# Add your Gemini API key
GEMINI_API_KEY=your_api_key_here
```

### 3. Build and Start

```bash
# Build and start all services
docker-compose --env-file .env.docker.local up -d

# View logs
docker-compose logs -f

# Check service health
docker-compose ps
```

### 4. Initialize Database

```bash
# Run Prisma migrations
docker-compose exec app npx prisma db push

# Seed taxonomy (optional)
docker-compose exec app node prisma/seed-taxonomy-v4.js
```

### 5. Access Application

- **Application**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555 (dev profile only)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Docker Architecture

```
┌─────────────────────────────────────────────────┐
│            Docker Compose Network                │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  PostgreSQL  │  │    Redis     │            │
│  │   (DB)       │  │ (Rate Limit) │            │
│  └──────┬───────┘  └──────┬───────┘            │
│         │                  │                     │
│         └──────────┬───────┘                     │
│                    │                             │
│            ┌───────▼────────┐                    │
│            │   Next.js App  │                    │
│            │   (Port 3000)  │                    │
│            └────────────────┘                    │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Services

### Application (Next.js)

**Image**: Custom (built from Dockerfile)
**Port**: 3000
**Dependencies**: PostgreSQL, Redis
**Health Check**: HTTP GET /api/health

**Environment Variables**:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Authentication secret
- `CSRF_SECRET` - CSRF protection secret
- `GEMINI_API_KEY` - AI classification
- `REDIS_URL` - Redis connection string

### PostgreSQL

**Image**: postgres:16-alpine
**Port**: 5432
**Volume**: `postgres_data`
**Health Check**: pg_isready

**Default Credentials**:

- User: `moneto`
- Password: Set in `.env.docker.local`
- Database: `moneto`

### Redis

**Image**: redis:7-alpine
**Port**: 6379
**Volume**: `redis_data`
**Health Check**: redis-cli ping

**Default Password**: Set in `.env.docker.local`

### Prisma Studio (Optional - Dev Only)

**Image**: node:22-alpine
**Port**: 5555
**Profile**: dev

To start with Prisma Studio:

```bash
docker-compose --profile dev up -d
```

## Production Deployment

### 1. Use Production Secrets

```bash
# Generate strong secrets
openssl rand -base64 48  # JWT_SECRET
openssl rand -base64 48  # CSRF_SECRET
openssl rand -base64 32  # POSTGRES_PASSWORD
openssl rand -base64 32  # REDIS_PASSWORD
```

### 2. Configure Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # CSRF and security headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Enable Auto-Restart

```yaml
# In docker-compose.yml, ensure all services have:
restart: unless-stopped
```

### 4. Set Up Backups

```bash
# Create backup script
cat > scripts/backup-docker-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U moneto moneto | gzip > backups/backup_${DATE}.sql.gz
find backups/ -name "*.sql.gz" -mtime +30 -delete  # Keep 30 days
EOF

chmod +x scripts/backup-docker-db.sh

# Add to crontab for daily backups at 2 AM
0 2 * * * /path/to/moneto/scripts/backup-docker-db.sh
```

### 5. Monitoring

```bash
# View real-time stats
docker stats

# Monitor logs
docker-compose logs -f --tail=100

# Check health
docker-compose ps
```

## Common Commands

### Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart app

# View logs
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis

# Execute command in container
docker-compose exec app npm run build
docker-compose exec postgres psql -U moneto -d moneto
```

### Database Operations

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U moneto -d moneto

# Run Prisma Studio
docker-compose --profile dev up prisma-studio

# Backup database
docker-compose exec postgres pg_dump -U moneto moneto > backup.sql

# Restore database
docker-compose exec -T postgres psql -U moneto -d moneto < backup.sql

# Reset database
docker-compose down -v  # WARNING: Deletes all data!
docker-compose up -d
docker-compose exec app npx prisma db push
```

### Build and Update

```bash
# Rebuild application
docker-compose build app

# Pull latest images
docker-compose pull

# Update and restart
docker-compose down
docker-compose pull
docker-compose build
docker-compose up -d
```

## Volume Management

### Backup Volumes

```bash
# Backup PostgreSQL data
docker run --rm \
  --volumes-from moneto-db \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres-data-$(date +%Y%m%d).tar.gz /var/lib/postgresql/data

# Backup Redis data
docker run --rm \
  --volumes-from moneto-redis \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/redis-data-$(date +%Y%m%d).tar.gz /data
```

### Clean Up

```bash
# Remove unused volumes
docker volume prune

# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Full cleanup (WARNING: Destructive!)
docker-compose down -v --rmi all
```

## Troubleshooting

### Application Won't Start

1. Check logs:

```bash
docker-compose logs app
```

2. Verify environment variables:

```bash
docker-compose exec app env | grep -E 'DATABASE_URL|JWT_SECRET'
```

3. Test database connection:

```bash
docker-compose exec app npx prisma db pull
```

### Database Connection Errors

1. Check PostgreSQL is running:

```bash
docker-compose ps postgres
```

2. Test connection:

```bash
docker-compose exec postgres pg_isready -U moneto
```

3. Verify password:

```bash
docker-compose exec postgres psql -U moneto -d moneto -c "SELECT 1;"
```

### Performance Issues

1. Check resource usage:

```bash
docker stats
```

2. Increase container limits:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2'
```

3. Optimize PostgreSQL:

```yaml
postgres:
  command:
    - 'postgres'
    - '-c'
    - 'shared_buffers=256MB'
    - '-c'
    - 'max_connections=200'
```

### Port Conflicts

If ports are already in use:

```env
# In .env.docker.local
APP_PORT=3001
POSTGRES_PORT=5433
REDIS_PORT=6380
PRISMA_STUDIO_PORT=5556
```

## Security Best Practices

1. **Never commit secrets** - Use `.env.docker.local` (gitignored)
2. **Use strong passwords** - Generate with `openssl rand -base64 48`
3. **Enable firewall** - Only expose necessary ports
4. **Regular updates** - Keep Docker images up to date
5. **Monitor logs** - Watch for suspicious activity
6. **Backup regularly** - Automate daily backups
7. **Use HTTPS** - Deploy behind reverse proxy with SSL
8. **Limit access** - Use VPN or IP whitelist for Prisma Studio

## Multi-Environment Setup

### Development

```bash
docker-compose --env-file .env.docker.dev --profile dev up
```

### Staging

```bash
docker-compose --env-file .env.docker.staging up -d
```

### Production

```bash
docker-compose --env-file .env.docker.production up -d
```

## Health Monitoring

### Built-in Health Checks

All services have health checks configured:

```bash
# Check health status
docker-compose ps

# Expected output:
# NAME                     STATUS
# moneto-app      Up (healthy)
# moneto-db       Up (healthy)
# moneto-redis    Up (healthy)
```

### Custom Health Check Endpoint

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        application: 'running',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
```

## Performance Optimization

### 1. Multi-stage Build

The Dockerfile uses multi-stage builds to minimize image size:

- Stage 1: Dependencies (node_modules)
- Stage 2: Build (compile TypeScript)
- Stage 3: Runtime (minimal production image)

### 2. Layer Caching

Order of operations in Dockerfile optimized for cache hits:

1. Install dependencies (changes rarely)
2. Copy source code (changes frequently)
3. Build application

### 3. Standalone Output

Next.js standalone output reduces runtime dependencies:

```javascript
// next.config.js
module.exports = {
  output: 'standalone',
}
```

## Related Documentation

- [Multi-Environment Strategy](./MULTI_ENVIRONMENT_STRATEGY.md)
- [Backup and Restore](./BACKUP_RESTORE_STRATEGY.md)
- [Security Guide](../CLAUDE.md#critical-security-notes)

## Support

For issues or questions:

- GitHub Issues: https://github.com/your-username/moneto/issues
- Tag: `docker`, `deployment`
