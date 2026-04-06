# GitHub Actions Deployment Strategy Guide

## Multi-Environment Deployment

This guide explains how to set up deployments to different environments (dev, staging, production) using GitHub Actions.

## Architecture

```
┌─────────────┐
│ Commit/PR   │
└──────┬──────┘
       │
       ▼
   ┌────────────────┐
   │ CI Pipeline    │
   │ - Lint         │
   │ - Build        │
   │ - Test         │
   │ - Type Check   │
   │ - Security     │
   └────────┬───────┘
           │
           ├─ (Fail) → ❌ Block Merge
           │
           └─ (Success) → ✅ Proceed
                        │
                        ▼
                   ┌──────────────┐
                   │ Branch Check │
                   └──────┬───────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
         develop        main          release
            │             │             │
            ▼             ▼             ▼
          DEV         STAGING       PRODUCTION
        Docker       Docker          Docker
        Build        Build & Push    Build & Push
```

## Deployment Environment Secrets

For each environment, set up these secrets in GitHub:

### Development (Automatic on develop branch)
```
Settings > Environments > development > Add secret
- DATABASE_URL
- JWT_SECRET
- FE_URL (dev)
```

### Staging (Automatic on release branch)
```
Settings > Environments > staging > Add secret
- DATABASE_URL (staging)
- JWT_SECRET (staging)
- FE_URL (staging)
- SLACK_WEBHOOK (optional notifications)
```

### Production (Manual approval required on main branch)
```
Settings > Environments > production > Add secret
- DATABASE_URL (prod)
- JWT_SECRET (prod)
- FE_URL (prod)
- SLACK_WEBHOOK
- DEPLOYMENT_KEY (SSH key for deployment)

Settings > Environments > production > Deployment branches
- Select "Protected branches" and "main"
```

## Deployment Workflow Example

To implement multi-environment deployments, create a new workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, release, develop]
  workflow_run:
    workflows: ["CI Pipeline"]
    types: [completed]
    branches: [main, release, develop]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  deploy-dev:
    name: Deploy to Development
    runs-on: ubuntu-latest
    environment: development
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to dev server
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          FE_URL: ${{ secrets.FE_URL }}
        run: |
          echo "Deploying to development..."
          # Add your deployment script here

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment: staging
    if: github.ref == 'refs/heads/release'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to staging server
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          FE_URL: ${{ secrets.FE_URL }}
        run: |
          echo "Deploying to staging..."
          # Add your deployment script here

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Request approval
        run: echo "Waiting for production deployment approval..."

      - name: Deploy to production
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          FE_URL: ${{ secrets.FE_URL }}
        run: |
          echo "Deploying to production..."
          # Add your deployment script here

      - name: Post deployment notification
        if: always()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"Production deployment completed"}'
```

## Branch Strategy

### develop
- Integration branch for features
- Auto-deploys to development environment
- No approval required
- Latest code from feature branches

### main
- Production branch
- Requires pull request review
- Manual deployment approval in GitHub
- Tagged releases (v1.0.0)

### release
- Staging/QA branch
- Auto-deploys to staging environment
- Used for release candidate testing
- Merge back to main after approval

### feature/* | bugfix/*
- Feature/bugfix development
- Create PR to develop
- Requires CI checks to pass

## CI/CD Integration with Docker

### Step 1: Build and Tag

```bash
# Automatically done by GitHub Actions
docker build -t ghcr.io/org/repo:develop-abc123 .
docker build -t ghcr.io/org/repo:develop-latest .
```

### Step 2: Push to Registry

```bash
docker push ghcr.io/org/repo:develop-abc123
docker push ghcr.io/org/repo:develop-latest
```

### Step 3: Deploy Container

```bash
# SSH into server
ssh user@server.com

# Pull latest image
docker pull ghcr.io/org/repo:develop-latest

# Stop old container
docker stop edunet_backend || true

# Run new container
docker run -d \
  --name edunet_backend \
  --env-file .env \
  -p 3000:3000 \
  ghcr.io/org/repo:develop-latest
```

## Monitoring Deployments

### GitHub Deployments API

View deployments and rollbacks:
```bash
# List deployments
curl https://api.github.com/repos/owner/repo/deployments \
  -H "Authorization: token YOUR_TOKEN"

# Check deployment status
curl https://api.github.com/repos/owner/repo/deployments/12345/statuses \
  -H "Authorization: token YOUR_TOKEN"
```

### GitHub Actions Status

1. Go to **Actions** tab
2. Filter by branch or environment
3. Click workflow run to see detailed logs
4. Review deployment status and outputs

## Rollback Strategy

### Automatic Rollback

If deployment fails:

```yaml
- name: Rollback on failure
  if: failure()
  run: |
    docker pull ghcr.io/org/repo:develop-previous
    docker run -d --name edunet_backend ghcr.io/org/repo:develop-previous
```

### Manual Rollback

```bash
# SSH into server
ssh user@server.com

# List available images
docker images | grep edunet

# Stop current container
docker stop edunet_backend

# Run previous version
docker run -d --name edunet_backend ghcr.io/org/repo:main-v1.0.0
```

## Notifications

### Slack Integration

Add to workflow:
```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Deployment to ${{ github.environment }} ${{ job.status }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Deployment Status*\nEnvironment: ${{ github.environment }}\nStatus: ${{ job.status }}"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Email Notifications

Configure in GitHub Settings:
1. **Settings > Notifications**
2. Enable email for workflow runs
3. Set failure-only or all notifications

## Security Best Practices

1. **Secrets Management**
   - Use environment-specific secrets
   - Rotate secrets regularly
   - Never log secrets in workflow output

2. **Access Control**
   - Require approval for production deployments
   - Use branch protection rules
   - Implement code review requirements

3. **Audit Logging**
   - Enable audit log retention
   - Monitor deployment history
   - Track secret access

4. **Deployment Windows**
   - Schedule deployments during business hours
   - Avoid deployments during peak traffic
   - Require team availability

## Troubleshooting Deployments

### Issue: Environment Not Found
```
Solution: Create environment in Settings > Environments
```

### Issue: Secrets Not Available
```
Solution: Ensure secrets are set for the correct environment, not just repository
```

### Issue: Deployment Timeout
```
Solution: Increase timeout or break into smaller tasks
```

### Issue: Container Won't Start
```
Solution: Check logs with: docker logs edunet_backend
```

## Next Steps

1. Set up environments in GitHub repository settings
2. Add deployment secrets for each environment
3. Create deployment workflow from provided template
4. Test with develop branch first
5. Gradually roll out to staging and production
6. Monitor and refine as needed
