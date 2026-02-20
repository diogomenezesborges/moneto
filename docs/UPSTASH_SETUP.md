# Upstash Redis Setup Guide

## Why Upstash Redis?

The application uses Redis-based rate limiting to prevent brute force attacks on authentication endpoints. Upstash Redis is:

- ✅ **Serverless-friendly**: Works with Vercel and other serverless platforms
- ✅ **Free tier**: 10,000 requests/day for free
- ✅ **Global edge network**: Low latency worldwide
- ✅ **Zero maintenance**: Fully managed service

## Development vs Production

### Development

- **Optional**: The app will fall back to an in-memory rate limiter
- ⚠️ In-memory limiter doesn't persist across serverless function invocations
- Only suitable for local development with `npm run dev`

### Production

- **REQUIRED**: In-memory rate limiter does NOT work in serverless environments
- You MUST configure Upstash Redis for production deployments

## Setup Instructions

### 1. Create Free Upstash Account

1. Go to [https://console.upstash.com/](https://console.upstash.com/)
2. Sign up with GitHub, Google, or email
3. Verify your email

### 2. Create Redis Database

1. Click **"Create Database"**
2. Configure:
   - **Name**: `moneto-ratelimit`
   - **Type**: Choose **Regional** (cheaper) or **Global** (faster worldwide)
   - **Region**: Select closest to your primary users (e.g., `eu-west-1` for Europe)
   - **TLS**: Enable (recommended)
3. Click **"Create"**

### 3. Get Connection Details

1. On the database dashboard, scroll to **"REST API"** section
2. Copy the following:
   - **UPSTASH_REDIS_REST_URL**: `https://your-endpoint.upstash.io`
   - **UPSTASH_REDIS_REST_TOKEN**: `AXxxx...` (long token)

### 4. Add to Environment Variables

#### Local Development (.env)

```env
UPSTASH_REDIS_REST_URL=https://your-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxx...
```

#### Production (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **moneto**
3. Go to **Settings** → **Environment Variables**
4. Add both variables:
   - Name: `UPSTASH_REDIS_REST_URL`
   - Value: `https://your-endpoint.upstash.io`
   - Environment: **Production**, **Preview**, **Development**

   - Name: `UPSTASH_REDIS_REST_TOKEN`
   - Value: `AXxxx...`
   - Environment: **Production**, **Preview**, **Development**

5. Click **Save**
6. **Redeploy** your application for changes to take effect

## Verification

### Check Logs

After deploying, check your application logs. You should see:

```
✅ Redis-based rate limiter initialized successfully
```

If Redis is not configured, you'll see:

```
⚠️  Redis not configured - using in-memory rate limiter (NOT SUITABLE FOR PRODUCTION)
```

### Test Rate Limiting

Try logging in with wrong credentials 6 times quickly:

- First 5 attempts: Should get "Invalid credentials" error
- 6th attempt: Should get "Too many requests, please try again later"

## Monitoring

### Upstash Console

- View request metrics at [https://console.upstash.com/](https://console.upstash.com/)
- Monitor:
  - Requests per day
  - Latency
  - Storage usage
  - Rate limit hits

### Free Tier Limits

- **10,000 requests/day** (rate limit checks count as requests)
- **256 MB storage** (rate limit data is minimal)
- If you exceed, upgrade to **Pay As You Go** (~$0.20 per 100k requests)

## Troubleshooting

### "Failed to initialize Redis rate limiter"

**Causes**:

- Invalid credentials
- Wrong URL format
- Network connectivity issues

**Solutions**:

1. Verify credentials are correct
2. Check URL includes `https://`
3. Try regenerating the token in Upstash console

### Rate limiting not working

**Causes**:

- Environment variables not set in production
- App not redeployed after adding env vars

**Solutions**:

1. Verify env vars in Vercel dashboard
2. Redeploy the application
3. Check application logs for initialization message

### High request usage

**Causes**:

- Each rate limit check = 1 request
- High traffic or bot attacks

**Solutions**:

1. Monitor usage in Upstash console
2. Consider upgrading to paid plan if needed
3. Implement IP-based blocking for malicious actors

## Cost Estimation

### Typical Usage (1000 users/month)

- ~5 login attempts per user = 5,000 requests/month
- Well within free tier (10,000 requests/day = 300,000/month)
- **Cost: $0** ✅

### High Traffic (10,000 users/month)

- ~50,000 requests/month
- Still within free tier
- **Cost: $0** ✅

### Enterprise (100,000 users/month)

- ~500,000 requests/month
- ~17,000 requests/day (exceeds free tier)
- **Cost: ~$1/month** 💵

## Security Best Practices

1. **Never commit credentials**: Always use environment variables
2. **Rotate tokens**: If exposed, regenerate in Upstash console
3. **Use separate databases**: Different DBs for dev/staging/production
4. **Monitor for anomalies**: Check Upstash console for unusual patterns
5. **Set alerts**: Configure Upstash alerts for usage spikes

## Alternative Solutions

If Upstash doesn't fit your needs, consider:

- **Vercel KV**: Similar to Upstash, native Vercel integration
- **Redis Cloud**: More features, slightly more expensive
- **AWS ElastiCache**: Enterprise solution, more complex setup

---

**Need help?** Check [Upstash Documentation](https://docs.upstash.com/redis) or create an issue on GitHub.
