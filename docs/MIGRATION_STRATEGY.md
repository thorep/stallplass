# Migration Strategy & Database Management

## Environment Setup

### Development Environment
- **Local PostgreSQL Database**: `stallplass_dev`
- **Purpose**: Safe testing of schema changes
- **Data**: Test data, can be reset/recreated

### Staging Environment  
- **Staging Database**: Similar to production structure
- **Purpose**: Final testing before production deployment
- **Data**: Production-like test data

### Production Environment
- **Production Database**: Live user data
- **Purpose**: Serving real users
- **Data**: CRITICAL - Never lose data

## Migration Workflow

### 1. Local Development
```bash
# Create new migration
npx prisma migrate dev --name add-user-profile-fields

# Reset local database (safe in development)
npx prisma migrate reset --force

# Test migration
npx prisma migrate dev
```

### 2. Git & Code Review
```bash
# Commit migration files
git add prisma/migrations/
git commit -m "Add user profile fields migration"
git push origin feature/user-profiles
```

### 3. Staging Deployment
```bash
# Deploy to staging
npx prisma migrate deploy

# Test thoroughly in staging environment
npm run test:integration
```

### 4. Production Deployment
```bash
# ONLY run migrate deploy in production
npx prisma migrate deploy

# NEVER run migrate dev in production
# NEVER run migrate reset in production
```

## Commands by Environment

### Development (Local)
- ✅ `npx prisma migrate dev` - Create and apply migrations
- ✅ `npx prisma migrate reset` - Reset database (safe)
- ✅ `npx prisma db push` - Quick prototyping only
- ✅ `npx prisma studio` - Database browser

### Staging/Production
- ✅ `npx prisma migrate deploy` - Apply pending migrations
- ✅ `npx prisma migrate status` - Check migration status
- ❌ `npx prisma migrate dev` - NEVER in production
- ❌ `npx prisma migrate reset` - NEVER in production
- ❌ `npx prisma db push` - NEVER in production

## Database URLs

### Development
```env
DATABASE_URL="postgresql://localhost:5432/stallplass_dev"
```

### Staging
```env
DATABASE_URL="postgresql://staging-host:5432/stallplass_staging"
```

### Production
```env
DATABASE_URL="postgresql://production-host:5432/stallplass_prod"
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Deploy to Vercel
        run: vercel --prod
```

## Safety Checklist

### Before Every Migration
- [ ] Backup production database
- [ ] Test migration in local environment
- [ ] Test migration in staging environment
- [ ] Review migration SQL for data loss potential
- [ ] Plan rollback strategy

### Migration Review Questions
- [ ] Does this migration preserve existing data?
- [ ] Are there any breaking changes?
- [ ] Is there a rollback plan?
- [ ] Have we tested with production-like data volume?

## Rollback Strategy

### If Migration Fails
1. **Don't panic** - Database is still intact
2. **Check logs** - Understand what went wrong
3. **Fix migration** - Create corrective migration
4. **Test thoroughly** - In staging first
5. **Deploy fix** - Apply corrective migration

### Emergency Rollback
1. **Restore from backup** - If available
2. **Revert application** - To previous version
3. **Create hotfix** - For critical issues
4. **Post-mortem** - Learn from incident

## Best Practices

### Do
- ✅ Use migrations for all schema changes
- ✅ Test migrations in staging first
- ✅ Backup before major changes
- ✅ Use descriptive migration names
- ✅ Review migration SQL before applying

### Don't
- ❌ Edit existing migration files
- ❌ Run development commands in production
- ❌ Skip staging environment
- ❌ Make breaking changes without planning
- ❌ Deploy without testing migrations

## Current Status
- **Environment**: Currently using production database for development (⚠️ RISKY)
- **Recommendation**: Set up local development database immediately
- **Next Steps**: 
  1. Set up local PostgreSQL
  2. Create separate staging environment
  3. Update deployment process to use migrate deploy