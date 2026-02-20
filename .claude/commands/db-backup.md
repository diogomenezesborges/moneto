# Database Backup Command (`/db:backup`)

---

name: db-backup
description: Create incremental database backup
agents: [db-specialist]

---

## Purpose

Creates incremental backup: `backups/backup-YYYY-MM-DD-HHmmss.sql`

## Workflow

1. Activate db-specialist agent
2. Run: `node scripts/backup-database.js`
3. Verify backup created

## Usage

```bash
/db:backup
```

---

**Last Updated:** 2026-02-12
