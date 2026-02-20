# Database Backup & Restore Strategy

> **Critical**: Automated multi-layer backup system to protect production data

## Overview

This document outlines the **FREE-tier backup strategy** that protects your production database without any recurring costs.

---

## Backup Layers

### Layer 1: Neon Built-In Backups (Automatic) ✅

**Status**: Active (no configuration needed)

**What It Does**:

- Neon automatically backs up your database
- 7-day point-in-time restore capability
- Can restore to ANY point in the last 7 days

**How to Restore**:

1. Go to [Neon Console](https://console.neon.tech)
2. Navigate to your project
3. Click "Restore" tab
4. Select desired timestamp (within last 7 days)
5. Creates new branch from that point
6. Promote branch to main if needed

**Limitations**:

- ⚠️ Only 7 days of history
- ⚠️ Requires Neon account access

**Cost**: FREE ✅

---

### Layer 2: Automated GitHub Backups (Daily) ✅

**Status**: Active via GitHub Actions

**What It Does**:

- Runs daily at 2 AM UTC (3 AM Lisbon time)
- Exports full database to SQL dump (`.sql` file)
- Compresses with gzip (saves ~80% space)
- Commits to `backups` branch in GitHub repo
- Keeps 30 most recent backups
- Can be triggered manually anytime

**Backup Schedule**:

```
Daily: 2:00 AM UTC (3:00 AM Lisbon)
Retention: 30 days
Location: GitHub backups branch
Format: backup_YYYYMMDD_HHMMSS.sql.gz
```

**How to Trigger Manual Backup**:

```bash
# Option 1: Via GitHub CLI
gh workflow run backup-database.yml

# Option 2: Via GitHub Web UI
# → Actions tab → "Database Backup" → "Run workflow"
```

**How to Download Backups**:

```bash
# 1. Switch to backups branch
git fetch origin backups
git checkout backups

# 2. View available backups
ls -lh backups/

# 3. Extract a backup
gunzip backups/backup_20260125_020000.sql.gz

# 4. View backup metadata
cat backups/backup_20260125_020000.meta.json
```

**Backup Location**: GitHub repo → `backups` branch → `backups/` folder

**Limitations**:

- ⚠️ GitHub has 2GB file size limit (database must stay under 2GB compressed)
- ⚠️ Requires GitHub Actions enabled

**Cost**: FREE ✅ (GitHub Actions: 2,000 minutes/month)

---

### Layer 3: Local Backups (On-Demand) ✅

**Status**: Available via script

**What It Does**:

- Manual backup to local machine
- Full SQL dump
- Stored in `backups/` folder (gitignored)
- Full control over backup location

**How to Run**:

```bash
# Run existing backup script
node scripts/backup-database.js

# Output: backups/backup_YYYYMMDD_HHMMSS.sql
```

**Backup Location**: Local `backups/` folder (NOT in git)

**Limitations**:

- ⚠️ Manual only (not automated)
- ⚠️ Local storage only (vulnerable to disk failure)

**Recommendation**:

- Run before major migrations
- Run before bulk data changes
- Store in cloud storage (Google Drive, Dropbox, etc.) for off-site backup

**Cost**: FREE ✅

---

## Restore Procedures

### Scenario 1: Restore Last 7 Days (Neon Built-In)

**When to Use**:

- Accidental data deletion within last 7 days
- Bad migration ran within last 7 days
- Need to revert to specific point in time

**Steps**:

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Click "Restore" → "Point in Time"
4. Select timestamp (any point in last 7 days)
5. Click "Restore" → Creates new branch
6. Review data in new branch
7. If correct, promote to main:
   - Neon Console → Branches → Select restored branch
   - Click "Set as Primary"
   - Confirm promotion

**Recovery Time**: ~5-10 minutes

**Data Loss**: None (if incident was within 7 days)

---

### Scenario 2: Restore from GitHub Backup (30 Days)

**When to Use**:

- Need to restore older than 7 days
- Neon is unavailable
- Want offline restore

**Steps**:

```bash
# 1. Clone backups branch
git fetch origin backups
git checkout backups

# 2. List available backups
ls -lh backups/

# Output:
# backup_20260125_020000.sql.gz  (25 Jan 2026)
# backup_20260124_020000.sql.gz  (24 Jan 2026)
# backup_20260123_020000.sql.gz  (23 Jan 2026)
# ...

# 3. Download and extract backup
cp backups/backup_20260125_020000.sql.gz ./
gunzip backup_20260125_020000.sql.gz

# 4. Restore to database
# ⚠️ WARNING: This will OVERWRITE current database!

# Option A: Restore to Neon (production)
psql "$DATABASE_URL" < backup_20260125_020000.sql

# Option B: Restore to local PostgreSQL first (safer)
psql "postgresql://localhost/moneto_test" < backup_20260125_020000.sql

# 5. Verify restored data
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"Transaction\";"
psql "$DATABASE_URL" -c "SELECT MAX(\"rawDate\") FROM \"Transaction\";"

# 6. Clean up
rm backup_20260125_020000.sql
```

**Recovery Time**: ~10-20 minutes (depending on database size)

**Data Loss**: Depends on backup age (up to 30 days available)

---

### Scenario 3: Restore from Local Backup

**When to Use**:

- Just ran a bad migration
- Have recent local backup
- Fastest restore option

**Steps**:

```bash
# 1. List local backups
ls -lh backups/

# 2. Restore from backup
psql "$DATABASE_URL" < backups/backup_20260125_120000.sql

# 3. Verify
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"Transaction\";"
```

**Recovery Time**: ~5 minutes

**Data Loss**: Depends on when last local backup was made

---

## Backup Verification

**Monthly Checklist**:

- [ ] Verify GitHub Actions backup is running (check Actions tab)
- [ ] Download and verify one backup file (test extraction)
- [ ] Check backup file sizes (should be consistent)
- [ ] Test restore to local database (verify data integrity)

**How to Verify GitHub Backups**:

```bash
# 1. Check latest backup
git fetch origin backups
git checkout backups
ls -lht backups/ | head -5

# 2. Verify backup count (should be ~30)
ls -1 backups/backup_*.sql.gz | wc -l

# 3. Check backup metadata
cat backups/backup_20260125_020000.meta.json

# Example output:
# {
#   "timestamp": "2026-01-25T02:00:00Z",
#   "size_bytes": 1234567,
#   "github_run_id": "12345678",
#   "github_run_number": "42"
# }
```

---

## Disaster Recovery Scenarios

### Scenario A: Neon Account Deleted

**Impact**: Complete loss of production database

**Recovery**:

1. Create new Neon account
2. Create new database
3. Restore from latest GitHub backup (Layer 2)
4. Update `DATABASE_URL` in Vercel
5. Redeploy application

**Data Loss**: 0-24 hours (depends on last backup)

**Recovery Time**: ~30-60 minutes

---

### Scenario B: GitHub Account Compromised

**Impact**: GitHub backups may be deleted

**Recovery**:

1. Use Neon built-in backups (Layer 1) if within 7 days
2. Use local backups (Layer 3) if available
3. Contact GitHub support to restore deleted backups

**Data Loss**: Depends on attack timing

**Prevention**: Enable GitHub 2FA, protect GitHub tokens

---

### Scenario C: Bad Migration Corrupts Data

**Impact**: Data corruption in production

**Recovery**:

1. Immediately stop application (prevent further writes)
2. Assess damage (check what tables/data affected)
3. Restore from Neon point-in-time (Layer 1) if within 7 days
4. OR restore from GitHub backup (Layer 2)
5. Verify data integrity
6. Fix migration script
7. Re-run corrected migration

**Data Loss**: Minimal if caught quickly

**Recovery Time**: ~15-30 minutes

---

## Backup Storage Costs

### Current Setup (FREE Tier)

| Layer          | Storage     | Limit         | Cost    |
| -------------- | ----------- | ------------- | ------- |
| Neon Built-In  | Neon cloud  | 7 days        | FREE ✅ |
| GitHub Backups | GitHub repo | 30 days, <2GB | FREE ✅ |
| Local Backups  | Your disk   | Unlimited     | FREE ✅ |

**Total Monthly Cost**: **$0** 💰

### GitHub Storage Limits

- GitHub repo size limit: **1GB recommended** (5GB soft limit)
- Single file size limit: **2GB**
- GitHub Actions storage: **500MB free**

**Current Database Size**: ~5MB (4,679 transactions)

**Compressed Backup Size**: ~1MB (gzip compression)

**30 Backups Storage**: ~30MB

**Conclusion**: **Well within limits** ✅

---

## Future Enhancements (Optional, Paid)

### Option 1: Neon Pro ($19/month)

- 30-day point-in-time restore
- Persistent staging branch
- Better performance

### Option 2: AWS S3 Backups ($0.023/GB/month)

- Unlimited retention
- Off-site redundancy
- Glacier for long-term storage (~$0.004/GB/month)

### Option 3: Supabase Storage (FREE tier: 1GB)

- Alternative to GitHub backups
- Faster access than GitHub
- RESTful API

**Recommendation**: Stick with FREE tier until database exceeds 500MB

---

## Backup Best Practices

### 1. Test Your Backups! ⚠️

**Monthly Drill**:

```bash
# 1. Download random backup
git checkout backups
BACKUP=$(ls backups/*.sql.gz | shuf -n 1)

# 2. Extract
gunzip $BACKUP

# 3. Restore to local test database
createdb moneto_test
psql moneto_test < ${BACKUP%.gz}

# 4. Verify data
psql moneto_test -c "SELECT COUNT(*) FROM \"Transaction\";"

# 5. Clean up
dropdb moneto_test
```

### 2. Before Major Changes

**Always create backup before**:

- Database migrations
- Bulk data updates
- Schema changes
- Major deployments

```bash
# Quick pre-migration backup
node scripts/backup-database.js
```

### 3. Monitor Backup Health

**GitHub Actions Badge** (add to README):

```markdown
![Backup Status](https://github.com/your-username/moneto/actions/workflows/backup-database.yml/badge.svg)
```

**Set up notifications**:

- GitHub Actions email alerts on failure
- Slack/Discord webhook for backup notifications

---

## Troubleshooting

### Backup Job Failed

**Check**:

1. GitHub Actions logs (Actions tab → Latest run)
2. Database connectivity (DATABASE_URL secret set correctly)
3. GitHub storage limits (repo size)

**Common Issues**:

- `DATABASE_URL` secret not set in GitHub → Settings → Secrets
- PostgreSQL client version mismatch → Update workflow
- Network timeout → Retry workflow

### Backup File Too Large

**Solutions**:

1. Compress backup (already done with gzip)
2. Use incremental backups (advanced)
3. Archive old data to separate table
4. Move to paid storage (S3)

### Can't Restore Backup

**Check**:

1. Backup file is valid (not corrupted): `gunzip -t backup.sql.gz`
2. PostgreSQL version compatibility (Neon uses Postgres 15+)
3. Correct database URL
4. Sufficient permissions (database owner)

**Test Restore**:

```bash
# Always test restore to non-production database first!
psql "postgresql://localhost/test_restore" < backup.sql
```

---

## Recovery Time Objectives (RTO)

| Scenario                    | RTO       | RPO (Data Loss)              |
| --------------------------- | --------- | ---------------------------- |
| Neon point-in-time restore  | 5-10 min  | 0 minutes (if within 7 days) |
| GitHub backup restore       | 10-20 min | 0-24 hours                   |
| Local backup restore        | 5 min     | Depends on backup frequency  |
| Complete disaster (rebuild) | 30-60 min | 0-24 hours                   |

**RTO** = Recovery Time Objective (how long to restore)
**RPO** = Recovery Point Objective (how much data you can afford to lose)

---

## Questions?

- GitHub Actions not running? → Check Actions tab → Enable workflows
- Backup failed? → Check workflow logs for errors
- Need to restore? → Follow scenarios above
- Want to change backup frequency? → Edit `.github/workflows/backup-database.yml` cron schedule

---

**Last Updated**: 2026-01-25
**Version**: 1.0
**Maintained By**: DevOps Team

**Your data is protected.** 🛡️
