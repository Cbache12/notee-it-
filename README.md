# Training Coach

A high-output training coach linked to Strava. It connects to your Strava account and:

- Tracks fitness/fatigue/form (CTL, ATL, TSB) and acute:chronic workload ratio (ACWR)
  from your recent activities.
- Recommends what to do today — pushing hard when you're fresh and load is safe,
  backing off toward recovery or rest when load risk or fatigue is elevated.
- Generates a periodized 12-week training plan (base → build → peak → taper) sized
  to your recent training volume.

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
  picks today's session from the load/form state, and a periodization
  generator builds a 12-week base/build/peak/taper plan.

Session tokens are stored in an encrypted, httpOnly cookie — there is no
database or multi-user account system; this is designed for a single athlete
running their own instance.

## Testing

```bash
npm run test       # vitest unit tests for the training-load and coach engines
npm run typecheck
npm run build
```
