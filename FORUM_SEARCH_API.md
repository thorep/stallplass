# Forum Search API Documentation

## Endpoint
`GET /api/forum/search`

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` or `query` | string | - | Text search in titles and content |
| `categories` | string[] | [] | Array of category IDs (JSON array or comma-separated) |
| `author` | string | - | Search by author name/nickname |
| `hasImages` | boolean | false | Filter posts with images |
| `sortBy` | string | 'relevance' | Sort options: 'relevance', 'newest', 'oldest', 'most_replies' |
| `limit` | number | 20 | Number of results (max 100) |
| `offset` | number | 0 | Pagination offset |

## Example Requests

### Basic Text Search
```
GET /api/forum/search?q=hest&limit=10
```

### Advanced Search with Multiple Filters
```
GET /api/forum/search?q=foring&categories=["cat-id-1","cat-id-2"]&author=Thor&hasImages=true&sortBy=newest&limit=20&offset=0
```

### Search by Author Only
```
GET /api/forum/search?author=Thor&sortBy=most_replies&limit=5
```

### Filter Posts with Images
```
GET /api/forum/search?hasImages=true&sortBy=newest
```

## Response Format

```json
{
  "data": {
    "results": [
      {
        "id": "post-id",
        "type": "thread|reply",
        "title": "Post Title (threads only)",
        "content": "Full post content",
        "excerpt": "Truncated content with search highlights",
        "author": {
          "id": "user-id",
          "nickname": "username",
          "firstname": "First",
          "lastname": "Last"
        },
        "category": {
          "id": "category-id",
          "name": "Category Name",
          "slug": "category-slug",
          "color": "#hex-color"
        },
        "threadId": "parent-thread-id (replies only)",
        "threadTitle": "Parent Thread Title (replies only)",
        "createdAt": "2025-08-13T16:22:57.128Z",
        "hasImages": true,
        "replyCount": 5,
        "relevanceScore": 3.96,
        "reactions": [
          {
            "type": "like",
            "count": 3
          }
        ]
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## Using with React Hook

```typescript
import { useForumSearch } from '@/hooks/useForum';
import type { ForumSearchFilters } from '@/types/forum';

const filters: ForumSearchFilters = {
  query: 'hest',
  categories: ['category-id-1'],
  author: 'Thor',
  hasImages: true,
  sortBy: 'relevance',
  limit: 20,
  offset: 0
};

const { data, isLoading, error } = useForumSearch(filters);

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
if (!data?.results.length) return <div>No results found</div>;

return (
  <div>
    <h2>Found {data.pagination.total} results</h2>
    {data.results.map(result => (
      <div key={result.id}>
        <h3>{result.title || `Reply in: ${result.threadTitle}`}</h3>
        <p>{result.excerpt}</p>
        <small>By {result.author.nickname} • {result.type}</small>
      </div>
    ))}
  </div>
);
```

## Search Features

### Text Search
- Searches in both thread titles and post content
- Case-insensitive matching
- Supports partial word matching

### Relevance Scoring
- Title matches weighted higher than content matches (3:1 ratio)
- Thread posts get slight boost over replies (1.2x multiplier)
- Recent posts (within 7 days) get recency boost (1.1x multiplier)
- Multi-term searches combine scores

### Category Filtering
- Supports filtering by multiple categories
- Searches both direct category matches (threads) and parent thread categories (replies)
- Categories can be passed as JSON array or comma-separated string

### Author Filtering
- Searches across nickname, firstname, and lastname fields
- Case-insensitive partial matching

### Image Filtering
- Filters posts that contain at least one image
- Works for both threads and replies

### Sorting Options
- **relevance**: Score-based ranking (default for text searches)
- **newest**: Most recent posts first
- **oldest**: Oldest posts first  
- **most_replies**: Posts with most replies first (threads only)

## Performance Notes

- Results are cached for 5 minutes on client-side
- Database queries are optimized with proper indexes
- Large result sets (relevance/most_replies sorting) use memory sorting with pagination
- Maximum limit enforced at 100 results per request