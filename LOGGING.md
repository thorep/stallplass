# Logging Configuration for Stallplass

This project uses [Pino](https://getpino.io/) for structured JSON logging on the server-side, optimized for Vercel's serverless environment.

## Vercel Environment Variables

### Required Environment Variable

Set the following environment variable in your Vercel dashboard:

```bash
LOG_LEVEL=info
```

### Available Log Levels

| Level | Numeric | Description | Recommended For |
|-------|---------|-------------|-----------------|
| `trace` | 10 | Most detailed logging, includes all operations | Local debugging only |
| `debug` | 20 | Detailed debug information, SQL queries, detailed flow | Development/Preview |
| `info` | 30 | General information, API calls, business operations | **Production (Default)** |
| `warn` | 40 | Warning conditions, deprecated usage, recoverable errors | Production (minimal) |
| `error` | 50 | Error conditions, failed operations, caught exceptions | Production (errors only) |
| `fatal` | 60 | Application cannot continue, system failures | Production (critical only) |

### Recommended Settings by Environment

#### Production
```bash
LOG_LEVEL=info
```
- Logs business operations, API requests/responses, and errors
- Good balance between visibility and performance
- Helps track user behavior and system health

#### Preview/Staging
```bash
LOG_LEVEL=debug
```
- More detailed logging for testing
- Includes database queries and detailed flow
- Helps with debugging integration issues

#### Development (Local)
```bash
LOG_LEVEL=debug
```
Set in your local `.env.local` file.

## Log Structure

All logs are structured JSON with the following standard fields:

```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00.000Z",
  "service": "stallplass-api",
  "environment": "production",
  "vercelEnv": "production",
  "region": "iad1",
  "requestId": "req_abc123",
  "endpoint": "/api/stables",
  "method": "POST",
  "userId": "user_123",
  "msg": "→ POST /api/stables [User: user_123]",
  "req": {
    "method": "POST",
    "url": "https://stallplass.no/api/stables",
    "userAgent": "Mozilla/5.0...",
    "ip": "192.168.1.1"
  }
}
```

## Log Types and Examples

### 1. API Request/Response Logging
Automatically logged by middleware:

```typescript
// Incoming request
"→ POST /api/stables [User: user_123]"

// Successful response  
"← 201 POST /api/stables [User: user_123] (145ms)"

// Error response
"✗ ERROR POST /api/stables [User: user_123] (89ms): Validation failed"
```

### 2. Business Operation Logging
For important business logic:

```typescript
// Success
"✅ create_stable success [stable:stable_123]"

// Failure
"⚠️ create_stable failure"
```

### 3. Error Logging
Structured error information:

```json
{
  "level": "error",
  "err": {
    "type": "ValidationError",
    "message": "Name is required",
    "stack": "ValidationError: Name is required\\n    at..."
  },
  "userId": "user_123",
  "duration": 89,
  "msg": "Failed to create stable"
}
```

## Viewing Logs in Vercel

### 1. Vercel Dashboard
- Go to your project in Vercel Dashboard
- Click on "Functions" tab
- Click on any function execution
- View structured logs in the "Logs" section

### 2. Vercel CLI
```bash
# View real-time logs
vercel logs

# View logs for specific deployment
vercel logs --url your-deployment-url.vercel.app

# Filter logs by function
vercel logs --filter="/api/stables"
```

### 3. Log Analysis

The structured JSON format makes it easy to:
- Filter by user ID: Search for `"userId":"user_123"`
- Filter by endpoint: Search for `"endpoint":"/api/stables"`
- Filter by errors: Search for `"level":"error"`
- Track request timing: Look for `duration` field
- Monitor business operations: Search for `operation` field

## Performance Considerations

### Log Level Impact
- `trace`/`debug`: High overhead, avoid in production
- `info`: Moderate overhead, good for production monitoring
- `warn`/`error`: Low overhead, minimal performance impact

### Vercel Function Limits
- Logs are included in function execution time
- Higher log levels may impact serverless function performance
- JSON serialization adds minimal overhead

## Common Log Patterns

### Success Pattern
```typescript
import { logger, logBusinessOperation } from '@/lib/logger';

// Log the operation
logger.info({ userId, resourceData }, 'Creating resource');

// Perform operation
const result = await createResource(data);

// Log business success
logBusinessOperation('create_resource', 'success', {
  userId,
  resourceId: result.id,
  resourceType: 'stable',
  duration: Date.now() - startTime
});
```

### Error Pattern
```typescript
try {
  // ... operation
} catch (error) {
  // Log business failure
  logBusinessOperation('create_resource', 'failure', {
    userId,
    duration: Date.now() - startTime,
    details: { error: error.message }
  });

  // Log detailed error
  logger.error({ 
    error,
    userId,
    requestData,
    errorType: error.constructor.name
  }, 'Operation failed');
  
  throw error;
}
```

## Security Notes

1. **Production Filtering**: Sensitive data (passwords, tokens) is automatically filtered in production
2. **Headers**: Only safe headers are logged (User-Agent, IP, Host)
3. **Body Logging**: Request bodies are only logged in development mode
4. **User Data**: Email addresses are only logged in development mode

## Monitoring and Alerting

Consider setting up alerts based on log patterns:

1. **Error Rate**: Alert when error logs exceed threshold
2. **Response Time**: Alert when `duration` field exceeds limits  
3. **Business Operations**: Monitor failure rates for critical operations
4. **User Activity**: Track user engagement through operation logs

This logging setup provides comprehensive visibility into your Stallplass application's behavior in production while maintaining good performance and security practices.