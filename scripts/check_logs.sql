-- Check total number of custom logs
SELECT COUNT(*) as total_logs FROM "custom_logs";

-- Check logs per horse
SELECT "horseId", COUNT(*) as log_count
FROM "custom_logs"
GROUP BY "horseId"
ORDER BY log_count DESC
LIMIT 10;

-- Check logs per category
SELECT "categoryId", COUNT(*) as log_count
FROM "custom_logs"
GROUP BY "categoryId"
ORDER BY log_count DESC
LIMIT 10;

-- Check recent logs (last 7 days)
SELECT COUNT(*) as recent_logs
FROM "custom_logs"
WHERE "createdAt" > NOW() - INTERVAL '7 days';