# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Local Development
- [ ] Test all changes locally with `npm run dev`
- [ ] Run migrations locally: `npm run db:migrate`
- [ ] Verify all features work with local database
- [ ] Run linting: `npm run lint`

### 2. Database Migration Safety
- [ ] Review migration files in `prisma/migrations/`
- [ ] Ensure migrations are backward compatible
- [ ] Test migrations with production-like data volume
- [ ] Backup production database (if needed)

### 3. Environment Variables
- [ ] Verify production environment variables in Vercel dashboard
- [ ] Confirm DATABASE_URL points to production database
- [ ] Check all Firebase environment variables are set

## Deployment Process

### Automatic Deployment (Recommended)
1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Add new feature with database changes"
   git push origin main
   ```

2. **Vercel automatically**:
   - Installs dependencies: `npm ci`
   - Generates Prisma client: `npx prisma generate`
   - Applies migrations: `npx prisma migrate deploy`
   - Builds application: `npm run build`
   - Deploys to production

### Manual Deployment
1. **Check migration status**:
   ```bash
   # Set production DATABASE_URL temporarily
   export DATABASE_URL="your-production-url"
   npx prisma migrate status
   ```

2. **Deploy migrations** (if needed):
   ```bash
   npx prisma migrate deploy
   ```

3. **Deploy application**:
   ```bash
   vercel --prod
   ```

## Migration Commands

### For Production Use
- ✅ `npx prisma migrate deploy` - Apply pending migrations
- ✅ `npx prisma migrate status` - Check migration status
- ✅ `npx prisma generate` - Generate Prisma client

### NEVER Use in Production
- ❌ `npx prisma migrate dev` - Can cause data loss
- ❌ `npx prisma migrate reset` - Deletes all data
- ❌ `npx prisma db push` - Bypasses migration system

## Vercel Configuration

### Environment Variables (in Vercel Dashboard)
```
DATABASE_URL = postgres://your-production-database-url
POSTGRES_URL = postgres://your-production-database-url
PRISMA_DATABASE_URL = prisma+postgres://your-accelerate-url
NEXT_PUBLIC_FIREBASE_API_KEY = your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = your-firebase-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID = your-firebase-project-id
```

### Build Configuration (vercel.json)
```json
{
  "buildCommand": "npx prisma generate && npx prisma migrate deploy && npm run build",
  "installCommand": "npm ci"
}
```

## Troubleshooting

### Migration Fails During Deployment
1. **Check Vercel build logs** for specific error
2. **Verify database connection** in environment variables
3. **Check migration files** for syntax errors
4. **Rollback if needed** using database backup

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check if database is accessible from Vercel
- Ensure connection string includes SSL mode if required

### Common Error Messages
- **"Migration failed"**: Check migration SQL syntax
- **"Database connection failed"**: Verify connection string
- **"Prisma client not found"**: Ensure `npx prisma generate` runs

## Emergency Rollback

### If Deployment Fails
1. **Revert Git commit**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Manual database rollback** (if needed):
   - Restore from backup
   - Run corrective migrations

### If Migration Breaks Production
1. **Create hotfix migration**:
   ```bash
   npx prisma migrate dev --name hotfix-production-issue
   ```

2. **Test locally**, then deploy fix:
   ```bash
   git add .
   git commit -m "Hotfix: Fix production migration issue"
   git push origin main
   ```

## Best Practices

### Development Workflow
1. **Always test locally first**
2. **Use meaningful migration names**
3. **Keep migrations small and focused**
4. **Review migration SQL before deploying**

### Production Safety
1. **Backup before major changes**
2. **Deploy during low-traffic hours**
3. **Monitor application after deployment**
4. **Have rollback plan ready**

### Migration Naming Convention
```
YYYYMMDDHHMMSS_descriptive_name
20250117_add_user_profile_fields
20250117_create_box_management_system
```

## Current Status
- **Local**: PostgreSQL database at `localhost:5432/stallplass_dev`
- **Production**: Prisma.io database via Vercel
- **Migrations**: Automatically applied during Vercel deployment
- **Backup**: Manual backup recommended before major changes