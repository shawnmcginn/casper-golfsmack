# Changelog

Total so far: ~35 min.

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
