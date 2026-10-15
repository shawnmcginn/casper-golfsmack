# Changelog

Total so far: ~56 min.

## Session 1: 2026-10-14 (~25 min)

### Setup
- Project constraints file (`.github/copilot-instructions.md`) and `SUBMISSION_NOTES.md`.
- GitHub repo (`shawnmcginn/casper-golfsmack`) connected.
- Supabase project configured (Data API on, new tables not auto-exposed).

### Added
- Vite + React + TypeScript scaffold.
- Email/password authentication with a session gate.
- Groups with owner/member roles, `create_group()`, a group switcher, and hash routing (`/#/g/<group id>`). Row Level Security keeps each group's data isolated.
- Realtime group chat (`messages` table, sender stamped by a database trigger).
- Group invite codes and `join_group()`.
- Supabase SQL in `supabase/`: `schema.sql`, `messages.sql`, `invite.sql`.
- README and this changelog.

## Session 2: 2026-10-14 (~10 min)

### Added
- GitHub Pages deploy: Vite `base` set to `/casper-golfsmack/` and a GitHub Actions workflow that builds and publishes on every push to `main`. Supabase URL and publishable key are passed in as repository secrets.
- Live at https://shawnmcginn.github.io/casper-golfsmack/.

## Session 3: 2026-10-14 (~10 min)

### Added
- Photo uploads in chat: private `chat-photos` Storage bucket, group-scoped paths and policies, and signed URLs for display (`supabase/photos.sql`).

## Session 4: 2026-10-15 (~11 min)

### Added
- Rounds and leaderboard: an Add round modal (date + each player's score) and a per-group leaderboard of average scores beside the chat, updating live. Rounds and scores are saved together by `add_round()` (`supabase/rounds.sql`).
- Per-group nicknames via `set_nickname()`, used on the leaderboard and on new chat messages (`supabase/nicknames.sql`).
