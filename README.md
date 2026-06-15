# BeTon

> 1-vs-1 bet hobby tracking for accountability.

**BeTon turns a private 1-vs-1 bet into a head-to-head fitness season:** two contestants commit to shared weekly targets for training and nutrition, log their days from their own phones, and let a live, boxing-style scoreboard score every round and the overall series — making accountability competitive, transparent, and fun.

This README is the project's **running log**. It captures the vision, every decision and its rationale, the data model, and the status of each feature. It is updated *before* each new feature is built, so there is always a transparent record of what we're building and why. Ambiguous features are resolved as Q&A in the [Decision log](#decision-log-qa) first.

---

## Status

| Area | State |
|---|---|
| Vision | ✅ Proposed — see `VISION.md` |
| Database schema | ✅ Live in Supabase |
| Auth — Google + magic link | 🟢 Google sign-in (no email limits) + magic link |
| User provisioning | ✅ Verified in DB (signup → profile + auto-join via invite) |
| Onboarding — profile setup | ✅ Built (invite-only) |
| Challenge flow — create + invite + accept/decline | ✅ Built & DB-verified |
| Daily logging → DB | ✅ Built — `/log` (calories, protein, junk, gym + muscles, cheat) |
| Live scoreboard from DB | ⬜ Planned |
| Check-ins (photos + review) | ⬜ Planned |

**Current phase: Step 1 — user onboarding & provisioning.**

---

## How BeTon works (rules)

- A **contest** runs for a set number of weeks (currently 15) between two or more participants.
- Each **week is a round**. You earn points: **+1** for hitting the weekly gym target (≥ 4 sessions) and **+1** for staying under the weekly calorie cap (≤ 14,000 kcal, judged only once all 7 days are logged).
- **Round winner** = more points; tiebreak = fewer total calories. Round wins stack into the **series**.
- **Daily log** per person: calories, protein, junk calories, gym (with the muscle groups worked), and whether it was a cheat day.
- **Cheat meals** are capped per person per contest (currently 10 each).
- **Calorie goals** are *effective-dated*: a new goal applies from its date forward and never rewrites past days.
- **Check-ins** at milestone weeks (5, 10, 15) for photos + a progress review.

---

## Architecture

- **Frontend:** Next.js (App Router, TypeScript), deployed on Vercel.
- **Backend:** Supabase — Postgres 17, Auth, and Row Level Security.
- **Auth:** passwordless **email magic link**.
- **Hosting:** Vercel project `be-ton` → https://be-ton.vercel.app
- **Database:** Supabase project `BeTon` (`tsnukavodlfpswqjrrhn`, eu-west-1).

The original in-browser prototype (React + Babel mockup) is kept in the repo as the **design reference**; the Next.js app supersedes it as the real, multi-device product.

---

## Data model

All tables live in `public` with Row Level Security enabled. The canonical DDL is in `supabase/schema.sql`.

| Table | Purpose |
|---|---|
| `profiles` | One row per signed-in user (display name, handle, avatar, theme, reminders). 1:1 with `auth.users`. |
| `contests` | A season/bet with **all rules as configurable columns** (weeks, gym target, calorie cap, cheat allowance, default daily goal, check-in weeks, start/end, status). |
| `contest_participants` | Who is in each contest, plus their corner **color**. |
| `contest_invites` | Provisions a person into a contest **by email**, before they have signed up. |
| `daily_logs` | One row per person per day: calories, protein, junk calories, gym, `muscles[]`, cheat. |
| `calorie_goals` | **Effective-dated** daily calorie goals — history-preserving timeline. |
| `checkins` | Milestone-week photo + review entries. |

**Progress views** (computed live from `daily_logs`, so there is one source of truth):

- `v_weekly_participant_summary` — per person, per week totals.
- `v_weekly_scored` — adds the contest's scoring rules (gym hit, calorie hit, points).
- `v_weekly_results` — the round winner each week (points, then fewer calories; only once the round is "decided").
- `v_series_standings` — rounds won per participant.

**Security model:** every table is RLS-protected. You can **read** data for any contest you're a participant in (so you can see your opponent's progress — the whole point), and you can **write only your own rows**. Contest owners can manage their contest and invites.

---

## Provisioning model (how people get in)

1. A contest **owner** invites people by email → a row in `contest_invites` (with the corner color).
2. When someone signs in for the first time, a database trigger (`handle_new_user`) creates their `profile` **and auto-accepts any matching invite**, adding them to the contest with the right color.
3. **Seeded so far:** the *BeTon — Csongor vs Peter (Summer 2026)* contest + Csongor's invite (blue). Peter can be challenged by email from inside the app.

---

## Registration & challenge flow

**Registration model: invite-only** (revised 2026-06-15). Sign-in is by magic link. Only **admins** (the `BETON_ADMIN_EMAILS` allowlist) can create contests and send challenges; everyone else can sign in but only takes part in contests they're challenged to.

- **Register / sign in** — **Continue with Google** (recommended; no email limits) or a magic-link email. First sign-in creates the account + profile; new users set their display name + handle.
- **Create a contest** — an **admin** (on the `BETON_ADMIN_EMAILS` allowlist) creates a contest (name, start date, length; rules default to the standard BeTon ruleset) and becomes the blue corner.
- **Challenge by email** — the creator enters an opponent's email, which records an invite (the "challenge") for the red corner.
- **Joining is automatic** — the moment the challenged person signs in (new or existing) they're added to the contest. No accept/decline step (`accept_all_my_invites()` runs on dashboard load; new users also auto-join via the signup trigger).
- **Security** — joining is routed through a `SECURITY DEFINER` `accept_invite` function, and direct inserts into `contest_participants` are restricted to the contest owner, so a user can only join a contest they were genuinely invited to. `get_my_challenges` lets an invitee see the contest + challenger before joining; `decline_invite` removes the challenge.

---

## Setup

### 1. Environment variables
Copy `.env.local.example` to `.env.local` (already filled with this project's public values), and set the same three in Vercel → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://tsnukavodlfpswqjrrhn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_2RmDoM-L-yQNVqOqpWUFpw_uykwoNFt
BETON_ADMIN_EMAILS=iamcsongor@gmail.com
```

### 2. Supabase Auth config (one-time, in the dashboard)
- **Authentication → URL Configuration:** Site URL = `https://be-ton.vercel.app`; add Redirect URLs `https://be-ton.vercel.app/auth/confirm`, `https://be-ton.vercel.app/auth/callback`, and the same for `http://localhost:3000` for local dev.
- **Authentication → Email templates → Magic Link:** point the link at the SSR confirm route:
  ```
  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
  ```

### 3. Run locally
```
cd BeTon
npm install
npm run dev      # http://localhost:3000
```

### 4. Deploy
Push to GitHub — Vercel auto-builds the Next.js app. Make sure the two env vars are set in Vercel.

---

## Decision log (Q&A)

### 2026-06-15 — Project kickoff
- **Login method?** → **Email magic link** (passwordless).
- **Prototype → live architecture?** → **Next.js** on Vercel. Chosen after comparing against a CDN-augmented mockup and a Vite SPA; the multi-user goal favors a framework with secure server-side logic, and Next.js is Vercel-native.
- **Data model scope?** → **Full multi-user platform** (any number of users, multiple contests). Built generally; seeded with just Csongor + Peter for now.
- **Assumed contest parameters** (taken from the prototype — please confirm or adjust): 15 weeks, ≥ 4 gym sessions/week, ≤ 14,000 kcal/week, 10 cheat meals each, default daily goal 2,000 kcal, check-ins at weeks 5/10/15, contest runs **15 Jun → 26 Sep 2026**.

### 2026-06-15 — Onboarding, challenges & registration
- **Challenge flow:** an admin creates a contest and challenges an opponent by email → an invite. New invitees auto-join on first sign-in; existing users get an in-app Accept/Decline. Joining is routed through a secure `accept_invite` function so a user can only join a contest they were actually invited to.
- **Registration → invite-only.** Only admins on the `BETON_ADMIN_EMAILS` allowlist can create contests and send challenges; everyone else can sign in but only joins contests they're challenged to.
- **No custom domain yet** → magic-link login uses Supabase's built-in mailer for now (low volume, may land in spam). Custom SMTP (Resend/Postmark/SES) + a domain are deferred; login already works without them.
- **App lives at the repo root** so Vercel auto-detects Next.js with no root-directory setting; the prototype stays alongside as the design reference.

---

## Open questions / to confirm

1. **Peter's email** — needed to seed his red-corner invite so he's auto-provisioned on first login.
2. **Contest parameters** — confirm the assumed values above (or change them).
3. **Phone-responsive shell** — the prototype is a fixed iOS *device frame* scaled to a desktop window. The real app fills the phone screen; this rework happens as screens are ported.

---

## Roadmap

1. ✅ Database schema + RLS + provisioning + progress views.
2. ✅ **Onboarding & challenge flow** — magic-link login, profile setup, create-contest + challenge-by-email, accept/decline for existing users, dashboard showing challenges + the live series.
3. ⬜ Port the daily **Log** screen and write `daily_logs` to the DB.
4. ⬜ Port the **Versus** + **Rounds** screens, reading the live progress views.
5. ⬜ Effective-dated goal editing, cheat-meal tracking UI.
6. ⬜ Check-ins (photo upload via Supabase Storage) + reminders.

---

## Changelog

- **2026-06-15** — Initial Supabase schema applied (7 tables, RLS policies, `handle_new_user` provisioning trigger, 4 progress views); function privileges hardened per the security advisor. Vision proposed (`VISION.md`). Next.js onboarding scaffold added (`beton-app/`). Contest + Csongor's invite seeded.
- **2026-06-15** — Verified at the database level: a simulated signup created a profile, auto-joined the contest via its invite (red corner), and the scoring views computed a full week correctly (4 gym + under cap = 2 points, round complete). All test data removed afterward; Csongor's invite remains intact and unaccepted. Next.js scaffold passes a syntax/transpile check (full type-check runs on Vercel build).
- **2026-06-15** — Decided registration model: **open platform**. Built the onboarding + challenge flow: profile-setup page, create-contest + challenge-by-email page, and in-app accept/decline of challenges on the dashboard. Added `get_my_challenges` / `accept_invite` / `decline_invite` SQL functions and restricted direct participant inserts to contest owners (joins now go only through an invite). Verified end-to-end in the DB across two simulated users (create → challenge → see → accept → both in standings); test data removed. All app files pass syntax checks.
- **2026-06-15** — Revised to **invite-only** (admin allowlist via `BETON_ADMIN_EMAILS`); non-admins only join contests they're challenged to. Wrote the full app into the local git clone at the repo root. Magic-link login uses Supabase's built-in mailer for now; custom SMTP + domain deferred. Cleared the orphaned seed contest.
- **2026-06-15** — First Vercel build of the app failed on a Supabase typed-client type error (`update(...)` inferred `never`). Set `typescript.ignoreBuildErrors` + `eslint.ignoreDuringBuilds` in `next.config.mjs` to ship; the queries are correct at runtime. Tech debt: realign `@supabase/*` versions with the generated types later and remove these overrides.
- **2026-06-15** — Added **Google sign-in** (no email rate limits; both players use Gmail) alongside magic link. Made challenges **auto-join on login** and removed the Accept/Decline step.
- **2026-06-15** — Built the **daily logging screen** (`/log`): record calories, protein, junk, gym + muscle groups, and cheat per day (any date), upserting to `daily_logs`. Dashboard now has a **Log today** button. Scoreboard views fill from these logs.
