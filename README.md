# Golfsmack

A group chat for golf buddies, replacing the SMS thread. Each group has its own private feed, and nothing is shared between groups.

Built for the Casper engineering take-home (see [README-CASPER.md](README-CASPER.md)). Status and submission details are in [SUBMISSION_NOTES.md](SUBMISSION_NOTES.md).

## What works

- Email/password sign up and log in (with email confirmation). The app is gated behind auth.
- Create groups and switch between them. Group data is isolated with Postgres Row Level Security.
- Realtime text chat, scoped to the current group.
- Photo uploads in chat, stored in a private bucket and visible only to group members.
- Add a round (date + each player's score) in a modal. A per-group leaderboard beside the chat shows each player's average score and rounds played, updating live.
- Per-group nicknames.
- Join a group with an invite code (shown on the group page).
- Deployed to GitHub Pages: https://shawnmcginn.github.io/casper-golfsmack/

## Not built yet

- Emoji reactions
- Score posts (backlog)
- Forgot password (backlog)

## Stack

TypeScript, Vite, React, React Router (hash routing), Supabase (Auth, Postgres + RLS, Realtime, Storage), GitHub Pages (deployed by GitHub Actions on every push to `main`).

## Run locally

1. Install dependencies:
   ```sh
   npm install
   ```
2. Create a Supabase project. Keep "Enable Data API" on and "Automatically expose new tables" off.
3. In the Supabase SQL editor, run these files in order:
   1. `supabase/schema.sql`
   2. `supabase/messages.sql`
   3. `supabase/invite.sql`
   4. `supabase/photos.sql`
   5. `supabase/rounds.sql`
   6. `supabase/nicknames.sql`
4. Create `.env.local` in the project root:
   ```
   VITE_SUPABASE_URL=<your project URL>
   VITE_SUPABASE_PUBLISHABLE_KEY=<your publishable key>
   ```
5. Start the dev server and open http://localhost:5173/casper-golfsmack/ (the Vite `base` path is set for Pages):
   ```sh
   npm run dev
   ```

To try groups, sign up two users, create a group as the first, and join with its invite code as the second.
