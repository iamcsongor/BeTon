# BeTon — Project Links & Access

**Live app:** https://be-ton.vercel.app

| Service | What it's for | Dashboard |
|---|---|---|
| **GitHub** | Source code · push `main` to deploy | https://github.com/iamcsongor/BeTon |
| **Vercel** | Hosting, builds & deploy logs | https://vercel.com/iamcsongors-projects/be-ton |
| **Supabase** | Database, Auth & storage | https://supabase.com/dashboard/project/tsnukavodlfpswqjrrhn |

## Project identifiers

- **Vercel project:** `be-ton` (team `iamcsongors-projects`)
- **Supabase project ref:** `tsnukavodlfpswqjrrhn` (region eu-west-1)
- **Git branch:** `main`

## Deploy flow

Push to `main` on GitHub → Vercel auto-builds and deploys to https://be-ton.vercel.app.

## Schema changes (Supabase)

Repo migrations live in `supabase/migrations/`; the canonical full DDL is in `supabase/schema.sql`.

**Important:** adding a migration file to git does **not** apply it to the live database. After merging schema changes, apply each new migration to Supabase (via the Supabase MCP / dashboard SQL editor / CLI). Verify with `list_tables` or `\d daily_logs` before assuming a column exists in prod.

Applied to live DB on **2026-06-18:**
- `009_daily_logs_coffees` — `daily_logs.coffees int not null default 0`
- `008_checkin_every_three_weeks` — contest check-ins moved from weeks 5/10/15 → 3/6/9/12/15

---

## Recent changes (update this section with every new feature)

### 2026-06-18 — Daily coffee tracking
- **`daily_logs.coffees`** column added (target 3/day, weekly quota 15).
- Tracked in the Log tab and week summary; **not** part of Versus scoring.
- UI shows warnings when daily or weekly limits are exceeded.
- Migration: `supabase/migrations/009_daily_logs_coffees.sql`

### 2026-06-18 — Check-ins every 3 weeks
- Milestone check-ins changed from weeks **5, 10, 15** to **3, 6, 9, 12, 15** (every 3rd week).
- Existing 15-week contests updated in DB.
- Migration: `supabase/migrations/008_checkin_every_three_weeks.sql`

### 2026-06-16 — Extended walk (gym activity)
- New `muscle_group` enum value: **Extended walk** (shown with 🧑‍🦯 emoji in UI).

### 2026-06-16 — Viewer analytics
- Dashboard loads logged to `view_events` (throttled ~30 min); query via `v_viewer_activity`.

### 2026-06-15 — Observer role
- Shareable read-only link (`/join/<token>`); observers see scoreboard only, no Log/Rounds.
