# Golfsmack

A group chat for golf buddies, replacing the SMS thread. Each group has its own private feed, leaderboard and rounds, and nothing is shared between groups.

Built for the Casper engineering take-home (see [README-CASPER.md](README-CASPER.md)). Status and submission details are in [SUBMISSION_NOTES.md](SUBMISSION_NOTES.md). The change history with time spent is in [CHANGELOG.md](CHANGELOG.md).

Live: https://shawnmcginn.github.io/casper-golfsmack/

## What works

- Email/password sign up and log in (with email confirmation). The whole app is gated behind auth.
- Multiple groups: create groups, switch between them, and join one with an invite code. Group data is isolated with Postgres Row Level Security, so one group never sees another's chat, photos or rounds.
- Realtime group chat, with an emoji picker beside the message box, photo uploads (private storage, visible only to group members), and edit and delete for your own messages.
- Rounds and leaderboard: add a round (date plus each player's score) in a modal. A leaderboard beside the chat shows each player's average score and rounds played, updating live. View rounds opens a carousel of past rounds with their dates and scores.
- Per-group nicknames, shown on the leaderboard and in chat.
- The group owner can rename the group.
- "Invite a friend" opens an email draft with the group's invite code and sign-up steps.
- Golf-themed UI with a photo background. The avatar menu opens a Settings modal (nickname, group name, create or join a group, log out).

## Not built yet

- Email confirmation relies on Supabase's built-in sender, which is rate limited (the limit was hit during testing)
- Group admin roles beyond the creator (owner), removing members, regenerating the invite code
- Forgot password
- Edit and delete rounds
- Chat pagination (the last 100 messages load)

The ranked list of what's next is in the Backlog section of [.github/copilot-instructions.md](.github/copilot-instructions.md).

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
   7. `supabase/features.sql`
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
