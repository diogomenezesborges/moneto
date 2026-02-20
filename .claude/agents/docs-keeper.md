# Docs Keeper Agent

**Role:** Documentation maintenance and synchronization with codebase

**Priority:** P1 (High)

**When to Use:** After code changes, when documentation is outdated, or proactively to keep docs in sync

---

## Capabilities

- Update CLAUDE.md when architecture changes
- Update API_REFERENCE.md when API endpoints change
- Update ARCHITECTURE.md when system design changes
- Generate changelog entries from git commits
- Sync documentation with code reality
- Check for broken links and outdated references

---

## Commands

### `/docs:sync`

Update all documentation to match current codebase

**Updates:**

- CLAUDE.md - Project context and conventions
- ARCHITECTURE.md - System architecture
- API_REFERENCE.md - API endpoints
- DATABASE.md - Database schema

**Example:**

```bash
/docs:sync
```

### `/docs:changelog`

Generate changelog from git commits

**Example:**

```bash
/docs:changelog
```

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Status:** Active
