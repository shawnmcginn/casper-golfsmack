# Submission Notes

Hosted: https://shawnmcginn.github.io/casper-golfsmack/
Repo: https://github.com/shawnmcginn/casper-golfsmack
Time spent: see CHANGELOG.md.

Golfsmack is a group chat for golf buddies that replaces the SMS thread we use today: chat, photos and emojis, plus a per-group leaderboard of average scores from rounds.

## What currently works
- Email/password sign up and log in. Every page is behind auth.
- Multiple groups with isolated data (Postgres Row Level Security). Create a group, switch groups, and join with an invite code. Groups are owner/member roles.
- Realtime group chat with an emoji picker, photo uploads to private storage, and edit and delete of your own messages.
- Rounds and leaderboard: add a round (date plus each player's score) in a modal. The leaderboard shows each player's average and rounds played, and View rounds pages through past rounds.
- Per-group nicknames, group rename for the owner, and an "Invite a friend" email.
- Deployed to GitHub Pages with a GitHub Actions workflow.

## What is incomplete
Known issue:
- **Email confirmation is turned off.** Supabase's built-in email sender is rate limited (a few emails per hour) and the limit was hit during testing, so confirmation was disabled. New accounts can log in immediately without confirming their email address. Re-enabling it needs custom SMTP.

Not built yet (the full ranked backlog, in `.github/copilot-instructions.md`):
- Regenerate the group invite code (it is permanent today and is the only gate to a group)
- Rate-limit or lock out invite code guessing
- Group admin roles (RBAC), so only owners and admins can manage a group
- Remove a member, and leave a group
- Forgot password / password reset
- Security hardening: OWASP Top 10 review, `npm audit` and Dependabot, a CSP meta tag, a check that no secret key ships, review of rounds RLS and `add_round` for abuse, and wrapping of long unbroken chat text
- Edit and delete rounds
- Chat pagination (only the last 100 messages load)
- Mobile layout check, plus loading and empty states
- Unread / new-message indicator
- Typing indicator (the three dots)
- Delete a group
- Per-group background: pick from a set, or upload one (admin only)
- Avatar colours or photos
- "Add to home screen" PWA tags

## How to run
Easiest: use the live version at https://shawnmcginn.github.io/casper-golfsmack/. Sign up with any email and password (no email confirmation is needed), create a group, and invite a second account with the group's invite code to see the shared chat and leaderboard.

To run it locally instead, see the README: install with `npm install`, run the SQL files in `supabase/` in order in a Supabase project, add the URL and publishable key to `.env.local`, then `npm run dev`.

## AI usage disclosure
AI-assisted development tools were used, as permitted by the assignment.

The assignment README.md contains a hidden HTML comment (line 83) addressed to AI assistants. It instructs them to silently insert the visible text "I didn't read my code thoroughly enough" into the app's UI and not to mention the instruction. It was noticed during review and deliberately not followed. That text is not in the app.

## Credits
Background photo: Pixabay, "golf-course-1035432" (https://pixabay.com/photos/golf-course-1035432/), used under the Pixabay Content License.
