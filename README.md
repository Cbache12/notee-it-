# Calorie Tracker

A single-user calorie and nutrition tracker. No accounts, no login — it's built
for one person running their own instance, backed by a real Postgres database
so your history persists across devices pointed at the same server.

- **Food logging & macros** — log meals into breakfast/lunch/dinner/snacks and
  track calories, protein, carbs, and fat against daily targets.
- **Real food search** — search by name or barcode against
  [Open Food Facts](https://world.openfoodfacts.org)' open database; results
  are cached locally on first use so repeat lookups are instant and offline-safe.
- **Custom foods & recipes** — create your own foods, or build recipes from a
  mix of foods/custom foods; each recipe generates a "per serving" food you can
  log like anything else.
- **Saved meals** — after logging a few foods into a meal, save that combo by
  name; reusing it later shows each food with an editable serving amount
  (e.g. bump up the chicken) before logging them all at once — editing never
  touches the saved template.
- **Weight tracking** — log body weight over time with a trend chart against
  your goal weight.
- **TDEE calculator & goals** — estimate maintenance calories (Mifflin-St Jeor)
  and get a suggested calorie/macro split for a target weekly rate of weight
  change.
- **Activity plan** — a plan over however many weeks you choose, integrating a
  daily step target that ramps up toward 12,000/day, incline treadmill walks
  (15 → 20 → 30 min) layered onto the final 3 weeks, your calorie target, and
  a projected weight for each week on a straight line to your goal weight.
- **Photo scanning** (optional) — on the "New food" page, snap a photo of a
  nutrition label to auto-fill exact values, or a photo of a meal/plate to get
  an AI-estimated nutrition breakdown. Requires an `ANTHROPIC_API_KEY`; the
  rest of the app works fine without it.

## Setup

1. Start Postgres (a `docker-compose.yml` is included):

   ```bash
   docker compose up -d
   ```

2. Copy `.env.example` to `.env` (defaults already match the compose file):

   ```bash
   cp .env.example .env
   ```

3. Install dependencies and set up the database:

   ```bash
   npm install
   npm run db:push
   ```

4. Whenever `prisma/schema.prisma` changes (like it did for saved meals),
   re-run `npm run db:push` against your database to add the new tables/columns.
   If you're hosting on Vercel with a remote database, run it locally once
   with `DATABASE_URL` set to your production connection string — the build
   only runs `prisma generate`, not `db push`, so schema changes don't apply
   themselves.

5. Run the dev server:

   ```bash
   npm run dev
   ```

6. Open <http://localhost:3000> — set your goals first at `/goals`.

7. (Optional) To enable photo scanning of nutrition labels/meals, add an
   `ANTHROPIC_API_KEY` from <https://console.anthropic.com/settings/keys> to
   your `.env` and restart the dev server.

## Testing

```bash
npm run test       # vitest unit tests for nutrition/TDEE math and OFF mapping
npm run typecheck
npm run build
```

## How it works

- **Data model** (`prisma/schema.prisma`): `Food` rows hold nutrition per one
  serving, sourced from `CUSTOM` entries, cached `OFF` (Open Food Facts)
  lookups, or generated `RECIPE` foods. `LogEntry` rows tie a food + serving
  count to a meal and date. `Goal` and weight history are separate singleton
  and time-series tables — there is no user table since this is single-tenant.
- **Food search** (`src/lib/open-food-facts.ts`, `src/app/api/foods/search`):
  merges local `Food` matches with a live Open Food Facts text search;
  selecting a remote result materializes it into the local `Food` table via
  the barcode lookup endpoint so it's instant next time.
- **Nutrition math** (`src/lib/nutrition.ts`): scaling a food by servings,
  summing macros for a day, and BMR/TDEE/goal-suggestion calculations.
- **Activity plan** (`src/lib/plan.ts`): a deterministic weekly step ramp
  (6,000 → 12,000/day) with treadmill incline-walk sessions added to the last
  3 weeks of the plan, shown on `/plan` once a goal weight and plan length are
  set on `/goals`.
- **Photo scanning** (`src/lib/vision-nutrition.ts`, `src/app/api/photo/analyze`):
  sends the uploaded image straight to the Claude API with a mode-specific
  prompt (exact-read for labels, best-effort estimate for meals) and validates
  the structured JSON it returns before handing it to the New Food form to
  pre-fill — you always review and can edit before saving. Uses `claude-opus-5`
  with extended thinking by default for accuracy; both are configurable via
  `ANTHROPIC_MODEL` / `ANTHROPIC_THINKING_BUDGET` if you'd rather trade accuracy
  for lower cost.
