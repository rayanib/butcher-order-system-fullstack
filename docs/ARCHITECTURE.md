# Architecture

## Overview

The application is optimized for a single-shop, tablet-first workflow. React
owns the user interface and in-memory state. State is persisted locally and,
when configured, synchronized to Supabase for authenticated users.

## Data flow

1. `AuthGate` restores or creates the Supabase authentication session.
2. `OrdersProvider` loads the browser copy immediately.
3. After authentication, it fetches the user's remote state.
4. Existing remote data becomes the source of truth. If no remote data exists,
   the local state seeds the first cloud copy.
5. Subsequent changes are debounced before being upserted to Supabase.

## Persistence model

Supabase stores one `app_state` row per user and state category. Categories
include orders, future orders, history, customers, prices, and archives.

This model was chosen to keep the first production deployment simple. It avoids
anonymous public database access and works with a small number of rows.

### Tradeoffs

- Whole JSON documents are written when a category changes.
- Concurrent edits use last-write-wins semantics.
- Relational queries and database-level validation are limited.
- Growing datasets will eventually require normalized tables.

## Security boundary

Supabase Authentication identifies the user. The policies in
`supabase/app_state.sql` require `auth.uid()` to match each row's `user_id` for
select, insert, update, and delete operations.

The browser's anonymous key is not a secret. Security depends on Row Level
Security remaining enabled and correctly configured. A Supabase service-role key
must never be included in the client.

## Local fallback

When Supabase is not configured, the same state categories are stored in
`localStorage`. This is useful for local development and temporary single-device
operation, but it is not encrypted storage and should not be treated as a
conflict-safe offline database.

## Express service

The Express service currently exposes root and health endpoints only. The
frontend does not depend on it for business operations. It remains isolated so a
future API layer can be introduced without misrepresenting the current design.

## Refactoring direction

New business rules should live under `client/src/features`, where pure functions
can be tested without rendering React. Route components should coordinate UI
state rather than own parsers, persistence, and domain calculations.
