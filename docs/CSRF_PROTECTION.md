# CSRF Protection Implementation Guide

> **Last Updated**: 2026-01-27
> **Status**: Completed (Issue #26)

## Overview

Cross-Site Request Forgery (CSRF) protection has been implemented using the **Double Submit Cookie** pattern. This prevents malicious websites from making authenticated requests on behalf of users.

## How It Works

### 1. Token Generation (on Login/Register)

When a user logs in or registers, the server:

1. Generates a cryptographically secure CSRF token
2. Sets the token as an HTTP-only cookie (`csrf-token`)
3. Returns the same token in the response body/header

**Token Format**: `timestamp:randomValue:signature`

```typescript
// Example token
'1706198400000:a1b2c3d4e5f6....:hmacSignature'
```

### 2. Token Validation (on State-Changing Requests)

For state-changing requests (POST, PATCH, DELETE, PUT), the client must:

1. Send the CSRF token from the cookie (automatically sent)
2. Send the same token in the `X-CSRF-Token` header

The server validates:

- ✅ Both tokens exist
- ✅ Both tokens match (double submit)
- ✅ Token signature is valid
- ✅ Token is not expired (24 hours)

### 3. Protected Endpoints

The following API routes require CSRF validation:

#### Authentication

- ✅ `POST /api/auth` (generates token on login/register)

#### Transactions

- ✅ `POST /api/transactions` (create/import)
- ✅ `PATCH /api/transactions` (update)
- ✅ `DELETE /api/transactions` (delete)
- ✅ `POST /api/transactions/ai-classify` (AI classification)
- ✅ `POST /api/transactions/auto-categorize` (auto categorization)
- ✅ `POST /api/transactions/review` (approve/reject review)

#### Rules

- ✅ `POST /api/rules` (create)
- ✅ `DELETE /api/rules` (delete)

#### Categories

- ✅ `POST /api/categories/manage` (create)
- ✅ `PATCH /api/categories/manage` (update)
- ✅ `DELETE /api/categories/manage` (delete)

#### AI Services

- ✅ `POST /api/ai/categorize` (AI categorization suggestions)
- ✅ `POST /api/ai/feedback` (record AI feedback)
- ✅ `POST /api/ai/parse-file` (parse file with AI)

#### Tags

- ✅ `POST /api/tags` (create/update tag definition)
- ✅ `PATCH /api/tags` (update transaction tags)

## Client-Side Integration

### Storing the Token

After login/register, extract the CSRF token from the response:

```typescript
// Login/Register response
const response = await fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'login', name: 'user', pin: '1234' }),
})

const data = await response.json()

// Token is in cookie (automatic) and header
const csrfToken = response.headers.get('X-CSRF-Token')

// Store in memory or localStorage for subsequent requests
localStorage.setItem('csrf-token', csrfToken)
```

### Sending the Token

For all state-changing requests, include the token in the `X-CSRF-Token` header:

```typescript
const csrfToken = localStorage.getItem('csrf-token')

const response = await fetch('/api/transactions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`,
    'X-CSRF-Token': csrfToken // Required!
  },
  body: JSON.stringify({ transactions: [...] })
})
```

### Token Refresh

CSRF tokens expire after 24 hours. If you receive a `403 Forbidden` with "Invalid or expired CSRF token":

1. Re-authenticate the user (triggers new token generation)
2. Update the stored CSRF token
3. Retry the original request

```typescript
async function makeProtectedRequest(url: string, options: RequestInit) {
  const csrfToken = localStorage.getItem('csrf-token')

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': csrfToken,
    },
  })

  if (response.status === 403) {
    const error = await response.json()
    if (error.details?.includes('expired')) {
      // Refresh token by re-authenticating
      await refreshAuth()
      // Retry with new token
      return makeProtectedRequest(url, options)
    }
  }

  return response
}
```

## Security Considerations

### Why Double Submit Cookie?

The Double Submit Cookie pattern is used because:

- ✅ Stateless (no server-side session storage needed)
- ✅ Works well with JWT authentication
- ✅ Simple to implement
- ✅ Effective against CSRF attacks

**How it prevents CSRF**:

- Attacker cannot read cookies from another domain (same-origin policy)
- Attacker cannot set the `X-CSRF-Token` header in a form submission
- Even if attacker tricks user into submitting a form, they cannot provide the matching header

### Token Signature

Tokens are signed with HMAC-SHA256 using the `CSRF_SECRET`:

- Prevents token forgery
- Ensures token integrity
- Uses constant-time comparison to prevent timing attacks

### Token Expiry

Tokens expire after 24 hours:

- Limits the window of opportunity for attacks
- Forces periodic re-authentication
- Reduces risk of token theft

### HTTP-Only Cookies

The CSRF token cookie is set with:

- `httpOnly: true` - Cannot be accessed via JavaScript
- `secure: true` (production) - Only sent over HTTPS
- `sameSite: 'strict'` - Not sent on cross-site requests

## Environment Variables

Add to your `.env` file:

```env
# CSRF Protection (optional, falls back to JWT_SECRET)
CSRF_SECRET=your-csrf-secret-minimum-32-characters-long
```

**Note**: If `CSRF_SECRET` is not set, it falls back to `JWT_SECRET`. For maximum security, use separate secrets.

## Testing

### Manual Testing

1. **Login and get token**:

```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"login","name":"TestUser","pin":"1234"}' \
  -c cookies.txt \
  -D headers.txt
```

2. **Extract token**:

```bash
# From cookie
grep csrf-token cookies.txt

# From header
grep X-CSRF-Token headers.txt
```

3. **Make protected request**:

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -b cookies.txt \
  -d '{"transactions":[...]}'
```

4. **Test without token (should fail)**:

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"transactions":[...]}'

# Expected: 403 Forbidden - "CSRF token missing from header"
```

### Automated Testing

```typescript
// tests/csrf.test.ts
import { describe, it, expect } from 'vitest'
import { generateCsrfToken, verifyCsrfToken } from '@/lib/csrf'

describe('CSRF Protection', () => {
  it('should generate valid token', () => {
    const token = generateCsrfToken()
    expect(token).toMatch(/^\d+:[a-f0-9]+:[a-f0-9]+$/)
  })

  it('should verify valid token', () => {
    const token = generateCsrfToken()
    expect(verifyCsrfToken(token)).toBe(true)
  })

  it('should reject invalid token', () => {
    expect(verifyCsrfToken('invalid')).toBe(false)
  })

  it('should reject expired token', () => {
    // Token from 25 hours ago
    const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000
    const token = `${oldTimestamp}:abc123:signature`
    expect(verifyCsrfToken(token)).toBe(false)
  })
})
```

## Troubleshooting

### 403 Forbidden - "CSRF token missing from cookie"

**Cause**: User session has no CSRF token

**Solution**: User needs to log in again to receive a new token

### 403 Forbidden - "CSRF token missing from header"

**Cause**: Client didn't send the `X-CSRF-Token` header

**Solution**: Update client code to include the header in all POST/PATCH/DELETE requests

### 403 Forbidden - "CSRF token mismatch"

**Cause**: Cookie token ≠ Header token

**Solution**:

- Check that the same token is used in both places
- Verify localStorage/sessionStorage hasn't been corrupted
- Try logging in again

### 403 Forbidden - "Invalid or expired CSRF token"

**Cause**: Token is older than 24 hours or has invalid signature

**Solution**: User needs to log in again

## Migration Guide

### Updating Existing Clients

If you have existing clients that don't support CSRF tokens:

1. **Add grace period** (optional):

```typescript
// Temporarily allow requests without CSRF for backwards compatibility
const csrfValidation = validateCsrfToken(request)
if (!csrfValidation.valid && process.env.CSRF_GRACE_PERIOD === 'true') {
  console.warn('⚠️ Request without CSRF token (grace period)')
} else if (!csrfValidation.valid) {
  return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
}
```

2. **Update client code** to handle tokens

3. **Remove grace period** after migration

### Frontend Integration Checklist

- [ ] Store CSRF token after login/register
- [ ] Include `X-CSRF-Token` header in all POST/PATCH/DELETE requests
- [ ] Handle 403 errors with token refresh logic
- [ ] Clear CSRF token on logout
- [ ] Test all state-changing operations

## API Reference

See [lib/csrf.ts](../lib/csrf.ts) for implementation details.

### Functions

- `generateCsrfToken()` - Create new CSRF token
- `verifyCsrfToken(token)` - Validate token signature and expiry
- `validateCsrfToken(request)` - Full validation (cookie + header + signature)
- `generateCsrfResponse(data)` - Create response with CSRF token
- `withCsrfProtection(request, handler)` - Middleware wrapper

## Best Practices

1. **Always use HTTPS in production** - CSRF protection is less effective over HTTP
2. **Set secure: true for cookies** - Prevents token theft over HTTP
3. **Use sameSite: 'strict'** - Additional CSRF protection
4. **Rotate tokens on privilege changes** - Generate new token after password change
5. **Monitor 403 errors** - High rate may indicate an attack
6. **Log token validation failures** - Helps detect attack patterns

## Related Issues

- [Issue #26](https://github.com/your-username/moneto/issues/26) - Original implementation request
- [Issue #24](https://github.com/your-username/moneto/issues/24) - Input validation (complementary security)
- [Issue #25](https://github.com/your-username/moneto/issues/25) - Security headers (complementary security)

## Further Reading

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)
- [SameSite Cookie Attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
