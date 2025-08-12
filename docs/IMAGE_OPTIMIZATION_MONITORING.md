# Image Optimization Monitoring Guide

## Overview
This document outlines the monitoring process for Vercel Image Optimization to manage costs and ensure optimal performance.

## Weekly Monitoring Process

### 1. Check Vercel Dashboard (Every Monday)
- Navigate to: Vercel Dashboard → Your Project → Usage Tab
- Look for "Image Optimization" section
- Record the following metrics:

| Week | Transformations | Cache Reads | Cache Writes | Notes |
|------|----------------|-------------|--------------|-------|
| 2025-01-13 | 0 | 0 | 0 | Baseline after optimization |
| | | | | |

### 2. Threshold Alerts
- **Weekly transformations > 2,000**: Investigate usage spike
- **Monthly trending toward 5K**: Consider additional optimizations
- **Cache hit ratio < 80%**: Review caching configuration

### 3. Browser Verification (Monthly)
- Open Chrome DevTools → Network tab
- Look for `_next/image` requests
- Verify WebP format delivery: `Content-Type: image/webp`
- Check response headers for cache status

## Optimization Settings Implemented

### Configuration Changes (Applied 2025-01-13)
- ✅ Added `formats: ['image/webp']` - reduces transformation variants by 33%
- ✅ Removed unused remote domains (keyassets.timeincuk.net, titangarages)
- ✅ Removed Firebase Storage patterns (no longer used)
- ✅ Optimized BoxListingCard.tsx image usage (replaced fill with dimensions)
- ✅ Added blur placeholder to HeroBanner component

### Current Settings
```typescript
// next.config.ts
images: {
  minimumCacheTTL: 2678400, // 31 days
  formats: ['image/webp'],  // WebP only
  qualities: [50, 75, 100], // Limited quality variants
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
}
```

## Cost Analysis

### Free Tier Limits
- 5K image transformations/month
- 300K image cache reads/month
- 200K image cache writes/month

### Expected Impact of Optimizations
- **30-40% reduction** in transformations (WebP-only)
- **Better cache hit ratios** (31-day cache TTL)
- **Reduced accidental optimizations** (cleaned remote patterns)

## Monthly Review Actions

### If approaching limits:
1. Review which images are being transformed most frequently
2. Consider using `unoptimized` prop for small icons/decorative images
3. Evaluate if additional image format restrictions are needed
4. Check for any new external domains accidentally optimized

### Performance Metrics to Track:
- Core Web Vitals (LCP improvement from optimized images)
- Average image load times
- Cache hit ratio trends
- Transformation success rates

## Contact & Escalation
- Dashboard issues: Check Vercel status page
- Unexpected costs: Review this month's usage patterns
- Performance problems: Verify WebP delivery and cache headers

---
Last updated: 2025-01-13
Next review: 2025-01-20