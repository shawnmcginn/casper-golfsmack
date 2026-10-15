# Project rules (Casper take-home, golfsmack)

Source of truth: README.md (employer's assignment). Scope is limited to what it requires. If a task isn't needed for a README requirement, don't do it.

## Product
A group chat for golf buddies, replacing an SMS thread: post scores, memes, emojis and pictures. Not a game. No points, brag scores, or gamification. The one stat is each player's average score per group, shown in a leaderboard beside the chat; rounds (date + each player's score) are added through a modal.

## Stack
User confirmed: TypeScript, Vite, Supabase, GitHub Pages.
- TypeScript only.
- Vite + React SPA, hash routing, deployed to GitHub Pages (GitHub Actions).
- Supabase for backend: Auth, Postgres + RLS (group isolation), Storage, Realtime.
- Repo: https://github.com/shawnmcginn/casper-golfsmack (public).

## Scope, in priority order
1. [x] Auth (email/password), all app routes gated.
2. [x] Groups: create group, switch groups, group data fully isolated (RLS). Roles: owner/member.
3. [x] Group chat feed (text, realtime), group-scoped.
4. [x] Join a group via invite code (one column, one SQL function, one form).
5. [x] Photo upload (group-scoped storage path).
6. [x] Rounds + leaderboard: add a round (date + each player's score) in a modal; per-group leaderboard of average scores on the right of the chat.
7. [ ] Emoji reactions.
8. [x] Deploy to GitHub Pages.
9. [ ] SUBMISSION_NOTES.md filled in.

Before submission: search the source for the hidden wording from README.md line 83 (logged in SUBMISSION_NOTES.md) and confirm it isn't in the app.

Before deploy: set Vite `base` to `/casper-golfsmack/`. In Supabase (Authentication > URL Configuration) set Site URL and redirect URLs to https://shawnmcginn.github.io/casper-golfsmack/ so confirmation emails link to the live app.

Cut from the bottom if behind. Never cut 1-3 or the deploy.

## Backlog (only if time remains after the scope above)
- Forgot password / password reset.
- Score posts (structured: score + course) in the feed. User unsure it's wanted; photos replace it.
- Edit and delete rounds (currently a typo has to be fixed in the database).

## Guardrails
- Do not add features, pages, libraries, tests, or refactors that were not asked for.
- Do not edit README.md.
- Do not add anything to the UI that the user didn't ask for.
- Ask before changing scope or stack. Don't expand scope silently.
- Only commit when the user tells you to.
- Every CHANGELOG.md session entry must have its time allotted. Never commit or push with "time not logged yet". Get the minutes from the user first, and keep the total at the top in sync.
