# Training Coach

A high-output training coach linked to Strava. It connects to your Strava account and:

- Tracks fitness/fatigue/form (CTL, ATL, TSB) and acute:chronic workload ratio (ACWR)
  from your recent activities.
- Recommends what to do today — pushing hard when you're fresh and load is safe,
  backing off toward recovery or rest when load risk or fatigue is elevated, and
  deferring to a hard session you've already put on your calendar.
- Generates a periodized training plan (base → build → peak → taper) sized to your
  recent training volume — either a generic rolling 12-week block, or tapered to a
  specific race date you set on the dashboard.
- Optionally syncs two-way with Google Calendar: reads what's already scheduled
  today, and can push the generated plan onto your calendar.

## Setup

1. Create a Strava API application at <https://www.strava.com/settings/api> and note
   its Client ID and Client Secret.
2. Copy `.env.example` to `.env.local` and fill in `STRAVA_CLIENT_ID`,
   `STRAVA_CLIENT_SECRET`, and a random `SESSION_SECRET` (`openssl rand -hex 32`).
3. Set your Strava app's "Authorization Callback Domain" to match where you'll run
   this (e.g. `localhost` for local dev).
4. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

5. Open <http://localhost:3000> and click "Connect with Strava".

### Optional: Google Calendar sync

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   enable the "Google Calendar API" on a project, then create an OAuth 2.0 Client ID
   (application type "Web application") with `<your-app-url>/api/google/callback`
   as an authorized redirect URI.
2. While the OAuth consent screen is in "Testing" mode, add your own Google account
   as a test user (no Google review needed for personal use).
3. Fill in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your environment.
4. Click "Connect Google" on the dashboard, then "Sync plan" to push the generated
   plan onto your calendar. Re-syncing updates existing events instead of
   duplicating them.

This is entirely optional — the app works without it.

## How the coaching logic works

- **Load estimate** (`src/lib/training-load.ts`): each activity's training load
  uses Strava's Relative Effort (`suffer_score`) when available, otherwise a
  Banister TRIMP-style heart-rate-reserve estimate, otherwise a flat
  duration × per-sport intensity fallback.
- **CTL/ATL/TSB**: an exponentially-weighted moving average of daily load with
  42-day (chronic) and 7-day (acute) time constants — the same model behind
  TrainingPeaks' Performance Management Chart.
- **ACWR**: 7-day average load ÷ 28-day average load, banded per Gabbett's
  "sweet spot" (0.8–1.3) injury-risk model.
- **Recommendation & plan** (`src/lib/coach.ts`): a deterministic rule engine
  picks today's session from the load/form state (and today's Google Calendar,
  if connected), and a periodization generator builds a base/build/peak/taper
  plan — 12 weeks by default, or tapered to a race date if one is set.

Strava tokens, Google tokens, and your race goal are each stored in their own
encrypted, httpOnly cookie — there is no database or multi-user account system;
this is designed for a single athlete running their own instance.

## Testing

```bash
npm run test       # vitest unit tests for the training-load and coach engines
npm run typecheck
npm run build
```
