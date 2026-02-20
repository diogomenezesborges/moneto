# JWT Secret Rotation Guide

> **Related**: Issue #11 - Rotate JWT secret for production security hardening
> **Last Updated**: 2026-01-28

## Overview

This guide provides step-by-step instructions for rotating the JWT secret in production. JWT secret rotation is a security best practice that should be performed periodically (every 90-180 days) or immediately if a security incident occurs.

## When to Rotate

**Periodic Rotation** (Recommended):

- Every 90 days (quarterly) - Security best practice
- Every 180 days (semi-annually) - Minimum recommendation

**Immediate Rotation** (Security Incident):

- JWT secret exposed (logged, committed to git, shared accidentally)
- Suspected unauthorized access
- Employee/contractor with access leaves
- After security breach or incident

## Prerequisites

Before rotating:

- ✅ Access to production environment variables (Vercel Dashboard)
- ✅ Backup of current configuration
- ✅ Plan communication with users (they'll need to re-login)
- ✅ Maintenance window (optional, but recommended)

## Rotation Process

### Step 1: Generate New JWT Secret

Generate a cryptographically secure random string (minimum 32 characters):

```bash
# Option 1: Using OpenSSL (Recommended)
openssl rand -base64 48

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Option 3: Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

**Example output**: `7x9k2mP4qR6sT8vW1yZ3bC5dE7fG9hJ0kL2mN4oP6qR8sT0u`

### Step 2: Update Environment Variable in Vercel

1. **Login to Vercel Dashboard**:
   - Go to: https://vercel.com/your-username-projects/moneto
   - Navigate to: Settings → Environment Variables

2. **Update JWT_SECRET**:
   - Find existing `JWT_SECRET` variable
   - Click "Edit"
   - Paste new secret value
   - Select environments: Production, Preview, Development
   - Click "Save"

3. **Trigger Redeployment**:
   - Navigate to: Deployments tab
   - Click "Redeploy" on latest deployment
   - Select "Use existing Build Cache" (faster)
   - Confirm redeployment

### Step 3: Verify Deployment

**Wait for deployment to complete** (~2-3 minutes)

**Test authentication**:

```bash
# Test login endpoint
curl -X POST https://moneto.vercel.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{"name":"TestUser","pin":"1234"}'

# Should return a new JWT token signed with new secret
# Old tokens should now be invalid
```

### Step 4: User Communication

**All active sessions will be invalidated immediately.**

Notify users:

- "We've updated our security. Please log in again."
- Expected: Users will see login screen on next visit
- Duration: Immediate effect, no grace period

### Step 5: Monitor for Issues

**First 24 hours after rotation**:

- Monitor application logs for authentication errors
- Check user reports for login issues
- Verify no unexpected 401 errors in production

## Rollback Plan

If issues occur after rotation:

### Immediate Rollback (< 5 minutes)

1. **Revert to previous secret**:
   - Vercel Dashboard → Settings → Environment Variables
   - Edit `JWT_SECRET` back to old value
   - Save changes

2. **Redeploy**:
   - Deployments → Redeploy latest
   - Users can resume with old tokens

3. **Investigate issue**:
   - Check application logs
   - Review error messages
   - Identify root cause

## Impact Analysis

**Expected Impact**:

- ✅ All users need to re-login (expected behavior)
- ✅ Active sessions invalidated (expected behavior)
- ✅ New logins work with new secret

**Unexpected Impact** (Issues):

- ❌ Login fails after rotation → Check secret format (32+ chars)
- ❌ Deployment fails → Check env var saved correctly
- ❌ API errors → Check for hardcoded old secret somewhere

## Security Checklist

Before rotation:

- [ ] New secret is cryptographically random (not manually typed)
- [ ] New secret is at least 32 characters (48+ recommended)
- [ ] New secret is different from old secret
- [ ] Users notified about upcoming re-login requirement
- [ ] Rollback plan understood

After rotation:

- [ ] New deployments using new secret (check logs)
- [ ] Old tokens properly rejected (401 errors)
- [ ] New logins successful
- [ ] No unexpected errors in production
- [ ] Old secret securely deleted from history/notes

## Automation (Future Enhancement)

Consider implementing:

- Automated rotation reminders (every 90 days)
- Graceful rotation with overlap period (both secrets valid for 5 minutes)
- Rotation audit log
- Integration with secrets management service (HashiCorp Vault, AWS Secrets Manager)

## Related Documentation

- [Security Documentation](SECURITY.md) - Overall security practices
- [API Reference](API_REFERENCE.md) - Authentication endpoints
- [Multi-Environment Strategy](MULTI_ENVIRONMENT_STRATEGY.md) - Environment management

## Support

If issues occur during rotation:

1. Check Vercel deployment logs
2. Review application error logs
3. Create GitHub issue with `security` label
4. Follow rollback plan if critical

---

**Last Rotation**: _Record date here after completing rotation_

**Next Scheduled Rotation**: _90 days from last rotation_
