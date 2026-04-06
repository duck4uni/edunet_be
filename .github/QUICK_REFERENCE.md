# GitHub CI/CD Quick Reference

## Common Workflows

### 🔄 Normal Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push to remote
git push origin feature/new-feature

# 4. Create Pull Request to 'develop' branch
# - GitHub Actions automatically runs CI pipeline
# - Fix any failures if needed
# - Request code review

# 5. After approval, merge to develop
# - CI pipeline runs again
# - Auto-deploy to development environment

# 6. Create release
git checkout release
git merge develop
git push origin release
# - CI pipeline validates
# - Auto-deploy to staging

# 7. After testing, merge to main
git checkout main
git merge release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --follow-tags
# - CI pipeline validates
# - Manual approval required for production deployment
# - Auto-deploy to production after approval
```

## Branch Strategy Quick Reference

| Branch | Purpose | Auto Deploy | Approval |
|--------|---------|------------|----------|
| `develop` | Development | Dev env | ❌ None |
| `release` | Release testing | Staging env | ❌ None |
| `main` | Production release | Production | ✅ Required |
| `feature/*` | Feature development | ❌ No | PR review |
| `bugfix/*` | Bug fixes | ❌ No | PR review |

## GitHub Actions Status Check

### View Workflow Results

1. Open your pull request
2. Scroll to "Checks" section
3. See status of each job:
   - ✅ Green = Passed
   - ❌ Red = Failed
   - ⏳ Gray = Running

### Common Failures

#### ESLint Failed
```bash
# Fix locally
npm run lint

# Should auto-fix most issues
# Commit changes
git add .
git commit -m "fix: lint issues"
git push
```

#### Build Failed
```bash
# Check error in GH Actions logs
# Build locally to verify
npm ci
npm run build

# Fix issues
# Push changes
git push
```

#### Tests Failed
```bash
# Run tests locally
npm run test

# Fix issues
# Run specific test if needed
npm run test -- --testNamePattern="test name"

# Push changes
git push
```

#### Type Check Failed
```bash
# Run type check
npx tsc --noEmit

# Fix typing issues
# Push changes
git push
```

## Environment Variables by Branch

### Development (develop)
Uses development database and test credentials:
```
DATABASE_DB=edunet_db_dev
JWT_SECRET=dev-secret
FE_URL=http://localhost:5173
```

### Staging (release)
Uses staging database for QA:
```
DATABASE_DB=edunet_db_staging
JWT_SECRET=staging-secret
FE_URL=https://staging.edunet.com
```

### Production (main)
Production database and credentials:
```
DATABASE_DB=edunet_db_prod
JWT_SECRET=prod-secret
FE_URL=https://edunet.com
```

## Docker Images Generated

### From develop branch
```
ghcr.io/org/edunet_be:develop-latest
ghcr.io/org/edunet_be:develop-abc12345  # short SHA
```

### From release branch
```
ghcr.io/org/edunet_be:release-latest
ghcr.io/org/edunet_be:release-abc12345
```

### From main branch (releases)
```
ghcr.io/org/edunet_be:latest
ghcr.io/org/edunet_be:v1.0.0  # semantic version
ghcr.io/org/edunet_be:v1  # major version
ghcr.io/org/edunet_be:v1.0  # minor version
```

## Database Migrations

### Check Migration Status
```bash
npm run migration:show
```

### List Pending Migrations
```bash
npm run migration:show
# Look for migrations with status "pending"
```

### Run Migrations Locally
```bash
# Ensure database connection is working
npm run migration:migrate

# View all applied migrations
npm run migration:show
```

### Rollback Last Migration
```bash
npm run migration:revert
```

### Generate New Migration
```bash
# After modifying entity files
npm run migration:generate:name

# Follow the prompts to name your migration
# Migration file created in src/migrations/
```

## Troubleshooting Tips

### My PR checks are blocked but I think they passed
- Refresh the page (GitHub caches status)
- Check individual job logs in Actions tab
- Look for format issues in code

### I forgot to run lint before pushing
```bash
npm run lint
git add .
git commit -m "fix: lint issues"
git push
```

### Tests pass locally but fail in CI
- Check node version: `node --version` should be 20.x
- Clear cache: `rm -rf node_modules && npm ci`
- Check env variables in GitHub Actions

### Docker image build is slow
- Happens on first build (no cache)
- Subsequent builds will be faster
- Uses GitHub Actions cache layer

### Want to skip deployment and just check code
- Push to feature branch (starts PR checks)
- Don't merge to develop/release/main yet
- Verify checks pass

## Useful GitHub Actions Features

### Re-run Failed Job
1. Go to Actions tab
2. Click failed workflow run
3. Click "Re-run jobs" or "Re-run failed jobs"

### View Artifact Outputs
1. Go to workflow run
2. Scroll down to see artifacts
3. Download build dist or coverage reports

### Cancel Running Workflow
1. Go to Actions tab
2. Click running workflow
3. Click "Cancel workflow"

## Local Testing with act

Test workflows locally before pushing:

```bash
# Install act: https://github.com/nektos/act

# Run specific job
act -j build -l

# Run with env variables
act --env-file .env

# List all available jobs
act -l

# Run pull request trigger
act pull_request
```

## Tips & Tricks

✅ **Always pull before starting new work**
```bash
git checkout develop
git pull origin develop
```

✅ **Commit early and often**
```bash
# Small, focused commits are better
git commit -m "type: short description"
```

✅ **Write meaningful commit messages**
```
Use conventional commits:
- feat: new feature
- fix: bug fix
- docs: documentation
- style: code formatting
- test: add tests
- chore: dependency updates
```

✅ **Link issues in PR descriptions**
```
Closes #123
Fixes #456
Related to #789
```

✅ **Add PR description with changes**
- What changed and why
- How to test
- Screenshots if UI changes

❌ **Don't force push to main/release/develop**
```bash
# This can break history
git push --force origin main  # DON'T DO THIS!
```

❌ **Don't commit node_modules**
```bash
# .gitignore should exclude
node_modules/
```

❌ **Don't commit .env or secrets**
```bash
# Use .env.example instead
npm_secret=keep_it_secret  # NEVER COMMIT THIS
```

## Getting Help

1. **Check workflow logs**
   - Actions tab → select workflow → click failed run
   - See detailed error messages

2. **Review CI/CD Guide**
   - `.github/CI_CD_GUIDE.md` - Complete documentation

3. **Ask team**
   - Comment on PR
   - Message in Slack
   - Create issue

4. **Common Issues**
   - Check TypeScript types: `npx tsc --noEmit`
   - Check lint issues: `npm run lint`
   - Check tests: `npm run test`
