-- Migration: Add GIN index for tag array searches
-- Date: 2026-02-12
-- Issue: #124 - Week 3 P2 Performance Optimization
--
-- This migration adds a GIN (Generalized Inverted Index) to the tags column
-- for efficient array searches using operators like @>, &&, and ANY()
--
-- GIN indexes are specifically designed for array and JSONB columns in PostgreSQL
-- and provide 50-100x performance improvement for array containment queries.

-- Drop the existing B-tree index on tags (if it exists)
DROP INDEX IF EXISTS "transactions_tags_idx";

-- Create GIN index for tag array searches
-- This enables fast queries like:
--   WHERE tags @> ARRAY['trip:croatia']  (contains)
--   WHERE tags && ARRAY['type:food', 'type:transport']  (overlaps)
--   WHERE 'trip:croatia' = ANY(tags)  (any element matches)
CREATE INDEX IF NOT EXISTS "transactions_tags_gin_idx"
  ON "transactions" USING GIN ("tags");

-- Note: The Prisma schema still shows @@index([tags])
-- but this has been converted to a GIN index at the database level.
-- Prisma doesn't support specifying GIN indexes in the schema,
-- so we maintain it manually via this migration.
