# GitHub CI/CD Pipeline Documentation

## Overview

This document describes the automated CI/CD pipelines configured for the EduNet Backend project using GitHub Actions.

## Workflow Files

### 1. **CI Pipeline** (`.github/workflows/ci.yml`)
Main continuous integration workflow triggered on push and pull requests.

**Triggers:**
- Push to `main`, `develop`, `release` branches
- Pull requests to `main`, `develop`, `release` branches

**Jobs:**
- **Lint and Format Check**: Runs ESLint and Prettier checks
- **Build Project**: Compiles TypeScript and creates dist folder
- **Run Tests**: Executes unit tests and generates coverage reports
- **TypeScript Type Check**: Validates TypeScript types
- **Security Scan**: Runs npm audit and Trivy vulnerability scanner
- **Integration Check**: Verifies build artifacts and size

**Status Badge:**
```markdown
[![CI Pipeline](https://github.com/your-username/edunet_be/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/edunet_be/actions/workflows/ci.yml)
```

### 2. **Docker Build and Push** (`.github/workflows/docker.yml`)
Builds and pushes Docker images to GitHub Container Registry.

**Triggers:**
- Push to `main`, `release` branches
- Version tags (v*)
- Manual workflow dispatch
- Pull request validation (build only, no push)

**Features:**
- Multi-stage Docker builds with caching
- Automatic semantic versioning
- GitHub Container Registry (GHCR) integration
- Cache optimization using GitHub Actions cache

**Image Tags:**
- `latest` (for default branch)
- `{branch-name}` (for branch pushes)
- `{version}` (for semantic versions)
- `{branch}-{git-sha}` (short commit hash)

### 3. **Database Migration Check** (`.github/workflows/migration-check.yml`)
Validates database migration files and entity definitions.

**Triggers:**
- Push/PR when migration or entity files are changed
- Paths:
  - `src/migrations/**`
  - `src/**/*.entity.ts`
  - `src/core/database/**`

**Jobs:**
- **Validate Migrations**: Checks migration syntax and naming conventions
- **Entity Validation**: Validates entity decorators and structure

### 4. **Code Quality Analysis** (`.github/workflows/code-quality.yml`)
Advanced code quality checks and dependency analysis.

**Triggers:**
- Push to `main`, `develop` branches
- Pull requests to `main`, `develop` branches

**Jobs:**
- **SonarQube Analysis**: Static code analysis (requires SONAR_TOKEN)
- **Dependency Check**: Checks for outdated and duplicate dependencies
- **Code Style**: Verifies code consistency
- **Complexity Check**: Analyzes code complexity

## Setup Instructions

### Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Secrets Configuration** (if needed):
   - `SONAR_TOKEN`: For SonarQube analysis (optional)
   - `DOCKER_HUB_USERNAME`: For Docker Hub (if using instead of GHCR)
   - `DOCKER_HUB_PASSWORD`: For Docker Hub (if using instead of GHCR)

### Enable Workflows

1. Ensure `.github/workflows/` folder is committed to your repository
2. Navigate to **Settings > Actions > General** in your GitHub repository
3. Ensure "Actions permissions" is set to "Allow all actions and reusable workflows"

### Configure Secrets (Optional)

For Docker Hub instead of GHCR:
```
Settings > Secrets and variables > Actions > New repository secret
- Name: DOCKER_HUB_USERNAME
- Value: your-docker-hub-username

- Name: DOCKER_HUB_PASSWORD  
- Value: your-docker-hub-token
```

For SonarQube analysis:
```
Settings > Secrets and variables > Actions > New repository secret
- Name: SONAR_TOKEN
- Value: your-sonar-token-from-sonarcloud.io
```

## Environment Variables

Create a `.env` file in the repository root (never commit to version control):
```env
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password
DATABASE_DB=edunet_db
DATABASE_SCHEMA=public
PORT=3000
JWT_SECRET=your-jwt-secret
PASSWORD_SECRET=your-password-secret
FE_URL=http://localhost:5173
HOST=0.0.0.0
```

## Local Testing

### Test Workflows Locally

Use [act](https://github.com/nektos/act) to test GitHub Actions workflows locally:

```bash
# Install act
# macOS: brew install act
# Windows: choco install act-cli

# Run specific workflow
act -j build -l

# Run all workflows
act -l

# Run with environment file
act --env-file .env
```

## Deployment Strategies

### Strategy 1: Automatic Deployment (Using Docker)

When merged to `main` branch:
1. CI pipeline runs (lint, build, test)
2. Docker image is built and pushed to GHCR
3. Deploy to production using the new image

### Strategy 2: Manual Deployment

1. Create a release tag: `git tag -a v1.0.0 -m "Release version 1.0.0"`
2. Push tag: `git push origin v1.0.0`
3. GitHub Actions builds and tags Docker image with version
4. Deploy manually using the tagged image

### Strategy 3: Merge to Release Branch

1. Merge code to `release` branch
2. CI pipeline validates code
3. Docker image is pushed with `v*` tags
4. Setup manual deployment approval

## Troubleshooting

### Workflow Not Running

1. Check `.github/workflows/` folder exists
2. Verify workflow YAML syntax: `npm install -g js-yaml && yamllint .github/workflows/`
3. Check branch protection rules

### Build Failures

1. View detailed logs in **Actions** tab
2. Check Node.js version matches `NODE_VERSION: '20'`
3. Verify all dependencies are installed: `npm ci`
4. Check for environment variable issues

### Docker Push Failures

1. Verify `GITHUB_TOKEN` has package write permissions
2. Check Docker build context is correct
3. Ensure Dockerfile exists in root directory

## Monitoring and Status

### View Workflow Status

1. Go to **Actions** tab in your GitHub repository
2. Select workflow:
   - CI Pipeline
   - Build and Push Docker
   - Database Migration Check
   - Code Quality and Analysis

3. Click on specific run to view logs

### Add Status Badges to README

```markdown
# EduNet Backend

[![CI Pipeline](https://github.com/your-org/edunet_be/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/edunet_be/actions/workflows/ci.yml)
[![Docker Build](https://github.com/your-org/edunet_be/actions/workflows/docker.yml/badge.svg)](https://github.com/your-org/edunet_be/actions/workflows/docker.yml)
[![Code Quality](https://github.com/your-org/edunet_be/actions/workflows/code-quality.yml/badge.svg)](https://github.com/your-org/edunet_be/actions/workflows/code-quality.yml)
```

## Best Practices

1. **Keep Workflows Simple**: Each workflow should have a single responsibility
2. **Use Caching**: Leverage GitHub Actions cache for npm dependencies
3. **Set Timeouts**: Prevent workflows from running indefinitely
4. **Pin Actions Versions**: Always use specific versions of third-party actions
5. **Environment Secrets**: Never hardcode secrets in workflows or code
6. **Branch Protection**: Use branch protection rules to enforce successful CI checks
7. **Regular Updates**: Keep dependencies and actions up to date
8. **Monitor Costs**: GitHub Actions has usage limits for free accounts

## Advanced Configuration

### Branch Protection Rules

1. Go to **Settings > Branches > Add rule**
2. Set branch name pattern: `main`
3. Enable:
   - ✓ Require status checks to pass before merging
   - ✓ Require branches to be up to date before merging
   - ✓ Require code reviews before merging (minimum 1-2)
4. Select required status checks from CI pipeline jobs

### Scheduled Workflows

To run dependency checks daily:

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
```

### Manual Workflow Dispatch

Workflows can be manually triggered:

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'staging'
```

Trigger manually: **Actions > Select Workflow > Run workflow > Select branch**

## Support & Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Best Practices](https://github.com/actions/community)
- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
