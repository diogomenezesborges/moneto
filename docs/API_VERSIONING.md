# API Versioning Guide

> **Last Updated**: 2026-01-25
> **Status**: Implemented (Issue #31)

## Overview

Moneto implements URL-based API versioning to maintain backward compatibility while allowing the API to evolve. This ensures existing clients continue to work when new features are added or breaking changes are introduced.

## Versioning Strategy

### URL-Based Versioning

API version is specified in the URL path:

```
/api/v1/resource    → Version 1 (current stable)
/api/v2/resource    → Version 2 (future)
/api/resource       → Unversioned (backward compatible legacy endpoints)
```

**Why URL-based?**

- ✅ Clear and explicit
- ✅ Easy to cache
- ✅ Simple to test
- ✅ Works with all HTTP clients
- ✅ No custom headers required

### Version Lifecycle

1. **Active** - Current recommended version
2. **Deprecated** - Still supported but discouraged
3. **Sunset** - Scheduled for removal
4. **Removed** - No longer available

## Current Versions

| Version | Status  | Release Date | Deprecation Date | Sunset Date |
| ------- | ------- | ------------ | ---------------- | ----------- |
| **v1**  | Active  | 2026-01-25   | N/A              | N/A         |
| v2      | Planned | TBD          | N/A              | N/A         |

## Using Versioned APIs

### Example: Fetch Transactions (v1)

```bash
# V1 endpoint with pagination
curl https://api.example.com/api/v1/transactions?limit=50&cursor=abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

```typescript
// TypeScript/JavaScript
const response = await fetch('/api/v1/transactions?limit=50', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})

const data = await response.json()
console.log(data.pagination.nextCursor) // For next page
```

### Response Headers

All versioned endpoints include metadata headers:

```http
X-API-Version: v1
X-API-Latest-Version: v1
```

### Deprecated Endpoints

When an endpoint is deprecated, you'll receive warning headers:

```http
X-API-Deprecated: true
X-API-Deprecation-Date: 2026-06-01
X-API-Sunset-Date: 2026-12-01
X-API-Migration-Guide: https://github.com/...
Deprecation: date="2026-06-01"
Sunset: Wed, 01 Dec 2026 00:00:00 GMT
```

## API Version 1 (v1)

### Endpoints

#### Transactions

**GET /api/v1/transactions**

- Fetch transactions with cursor-based pagination
- Query parameters: `cursor`, `limit`, `sortOrder`
- Returns: Paginated response with metadata

**POST /api/v1/transactions**

- Create/import transactions
- Requires: CSRF token
- Validation: Zod schema

**PATCH /api/v1/transactions**

- Update transaction
- Requires: CSRF token
- Validation: Zod schema

**DELETE /api/v1/transactions**

- Delete transaction
- Requires: CSRF token
- Validation: Zod schema

### Breaking Changes from Legacy (Unversioned)

1. **Pagination**: GET now returns paginated data structure:

   ```json
   {
     "data": [...],
     "pagination": {
       "hasNextPage": true,
       "nextCursor": "abc123",
       "pageSize": 50
     }
   }
   ```

2. **Headers**: Versioned endpoints include `X-API-Version` header

## Pagination (v1+)

### Cursor-Based Pagination

V1 uses cursor-based pagination for efficient large dataset handling.

**Benefits**:

- ✅ Consistent results even when data changes
- ✅ More efficient for large datasets
- ✅ No "page drift" issues
- ✅ Better database performance

### Query Parameters

```typescript
interface PaginationParams {
  cursor?: string // Start after this ID (omit for first page)
  limit?: number // Items per page (default: 50, max: 1000)
  sortOrder?: 'asc' | 'desc' // Sort direction (default: 'desc')
}
```

### Response Structure

```typescript
interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    hasNextPage: boolean
    hasPreviousPage: boolean
    nextCursor: string | null
    previousCursor: string | null
    pageSize: number
    totalCount?: number // Optional, expensive to calculate
  }
}
```

### Examples

**First Page**:

```bash
GET /api/v1/transactions?limit=50
```

Response:

```json
{
  "data": [
    /* 50 transactions */
  ],
  "pagination": {
    "hasNextPage": true,
    "hasPreviousPage": false,
    "nextCursor": "cm1234567890",
    "previousCursor": null,
    "pageSize": 50
  }
}
```

**Next Page**:

```bash
GET /api/v1/transactions?limit=50&cursor=cm1234567890
```

**Custom Page Size**:

```bash
GET /api/v1/transactions?limit=100
```

**Ascending Order**:

```bash
GET /api/v1/transactions?limit=50&sortOrder=asc
```

### Client Implementation

```typescript
// React example with pagination
const [transactions, setTransactions] = useState<Transaction[]>([])
const [nextCursor, setNextCursor] = useState<string | null>(null)
const [loading, setLoading] = useState(false)

async function fetchTransactions(cursor?: string) {
  setLoading(true)

  const params = new URLSearchParams({
    limit: '50',
    ...(cursor && { cursor }),
  })

  const response = await fetch(`/api/v1/transactions?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json()

  setTransactions(prev => (cursor ? [...prev, ...data.data] : data.data))
  setNextCursor(data.pagination.nextCursor)
  setLoading(false)
}

// Load first page
useEffect(() => {
  fetchTransactions()
}, [])

// Load more (infinite scroll)
function loadMore() {
  if (nextCursor && !loading) {
    fetchTransactions(nextCursor)
  }
}
```

## Migration Guide

### From Legacy to v1

#### Change 1: Response Structure

**Before (Legacy)**:

```typescript
const response = await fetch('/api/transactions')
const transactions = await response.json() // Array directly
```

**After (v1)**:

```typescript
const response = await fetch('/api/v1/transactions')
const { data, pagination } = await response.json()
const transactions = data // Array in data field
```

#### Change 2: Pagination

**Before (Legacy)** - No pagination, returns all:

```typescript
// Returns ALL transactions (can be slow for large datasets)
const response = await fetch('/api/transactions')
const allTransactions = await response.json()
```

**After (v1)** - Cursor-based pagination:

```typescript
// Returns paginated results
const response = await fetch('/api/v1/transactions?limit=50')
const { data, pagination } = await response.json()

// Load next page
if (pagination.hasNextPage) {
  const nextResponse = await fetch(`/api/v1/transactions?limit=50&cursor=${pagination.nextCursor}`)
}
```

#### Change 3: Headers

**After (v1)** - Check version:

```typescript
const response = await fetch('/api/v1/transactions')
const version = response.headers.get('X-API-Version') // 'v1'
```

### Compatibility Layer

To support both legacy and v1 in your client:

```typescript
async function fetchTransactions(useV1 = true) {
  const endpoint = useV1 ? '/api/v1/transactions' : '/api/transactions'
  const response = await fetch(endpoint)
  const data = await response.json()

  // Normalize response structure
  if (useV1) {
    return {
      transactions: data.data,
      pagination: data.pagination,
    }
  } else {
    return {
      transactions: data,
      pagination: null,
    }
  }
}
```

## Version Negotiation

### Header-Based Version Selection (Optional)

In addition to URL-based versioning, you can optionally specify version in Accept header:

```http
Accept: application/vnd.moneto.v1+json
```

However, URL-based versioning is recommended for simplicity.

## Error Handling

### Unsupported Version

```http
GET /api/v99/transactions

400 Bad Request
{
  "error": "Unsupported API version",
  "requestedVersion": "v99",
  "supportedVersions": ["v1"],
  "latestVersion": "v1",
  "message": "API version 'v99' is not supported. Please use one of the supported versions."
}
```

### Deprecated Version

```http
GET /api/v0/transactions

200 OK
X-API-Deprecated: true
X-API-Deprecation-Date: 2026-06-01
X-API-Sunset-Date: 2026-12-01
Deprecation: date="2026-06-01"

{
  "data": [...],
  "warning": "This API version is deprecated and will be removed on 2026-12-01"
}
```

## Best Practices

### For API Consumers

1. **Always specify version** - Use `/api/v1/` instead of `/api/`
2. **Check version headers** - Monitor for deprecation warnings
3. **Handle pagination** - Don't assume all data in one response
4. **Set reasonable limits** - Don't request more data than needed
5. **Cache responses** - Use ETags and cache headers when available

### For API Developers

1. **Never break v1** - Once released, v1 must remain stable
2. **Use version headers** - Always include `X-API-Version`
3. **Document changes** - Maintain migration guides
4. **Deprecate gracefully** - Give 6-12 months notice before sunset
5. **Test all versions** - Ensure backward compatibility

## Version Planning

### When to Create a New Version

Create a new version (v2) when:

- ❌ Removing required fields
- ❌ Changing response structure
- ❌ Renaming endpoints
- ❌ Changing authentication methods
- ❌ Breaking existing behavior

**Don't** create a new version for:

- ✅ Adding optional fields
- ✅ Adding new endpoints
- ✅ Adding new query parameters
- ✅ Performance improvements
- ✅ Bug fixes

### Deprecation Schedule

1. **Announce** - 6 months before deprecation
2. **Deprecate** - Add deprecation headers
3. **Grace Period** - 6-12 months
4. **Sunset** - Remove old version

Example timeline:

```
2026-01-25: v1 released
2026-12-01: v2 released, v1 still active
2027-06-01: v1 deprecated (headers added)
2027-12-01: v1 sunset (removed)
```

## Testing

### Test Versioned Endpoints

```bash
# Check version header
curl -I https://api.example.com/api/v1/transactions \
  -H "Authorization: Bearer TOKEN"

# Expected:
# X-API-Version: v1
# X-API-Latest-Version: v1

# Test pagination
curl "https://api.example.com/api/v1/transactions?limit=10" \
  -H "Authorization: Bearer TOKEN" | jq '.pagination'

# Expected:
# {
#   "hasNextPage": true,
#   "nextCursor": "...",
#   "pageSize": 10
# }
```

### Automated Tests

```typescript
describe('API Versioning', () => {
  it('should include version headers', async () => {
    const response = await fetch('/api/v1/transactions')
    expect(response.headers.get('X-API-Version')).toBe('v1')
  })

  it('should reject unsupported versions', async () => {
    const response = await fetch('/api/v99/transactions')
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Unsupported API version')
  })

  it('should paginate results', async () => {
    const response = await fetch('/api/v1/transactions?limit=10')
    const data = await response.json()
    expect(data.pagination).toBeDefined()
    expect(data.data.length).toBeLessThanOrEqual(10)
  })
})
```

## Related Documentation

- [Pagination Guide](./PAGINATION.md)
- [API Reference](../CLAUDE.md#api-routes)
- [Migration Guide v1 → v2](./MIGRATION_V1_V2.md) (when available)

## Support

For questions or issues:

- GitHub Issues: https://github.com/your-username/moneto/issues
- Tag: `api`, `versioning`, `pagination`
