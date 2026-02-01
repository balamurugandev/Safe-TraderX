# 🧠 Lessons Learned & Technical Decisions

## 1. Hybrid Projections Logic
**Challenge:** The user required a projection system that shows "compound growth" but also "resets" daily to the actual balance, without overwriting future projections with today's fluctuation immediately, but also not getting out of sync.
**Solution:**
- We implemented a **Hybrid Logic** in `app/projections/page.tsx`.
- **Future Days**: Show a *Static* "Start Balance" (based on the last known Reality) but a *Dynamic* "Projected End" (based on theoretical compounding).
- **Benefit**: This allows the user to see the "Gap" between their current path and the ideal path without the entire table recalculating confusingly every second.

## 2. Skipped Day Handling
**Challenge:** How to handle days where no trade is logged? Should the equity grow automatically?
**Solution:**
- Verified mathematically that `Start Equity = Initial Capital + SUM(Past Trades)`.
- If a day is skipped, `SUM` adds 0.
- Thus, the equity line remains *flat*. Use of this formula ensures robustness without needing "special" skipped day handling logic. It works by definition.

## 3. Strict Morning Balance
**Challenge:** The "Start Balance" for "Today" was fluctuating with live P&L, making it look like the user started the day with more/less money.
**Solution:**
- Implemented `pastPnLStrict` calculation.
- We strictly exclude "Today's" trades from the "Start Balance" calculation for the "Today" row. This freezes the opening balance to the true morning state.

## 4. UI/UX "Edit Mode"
**Challenge:** Settings were too easy to accidentally change.
**Solution:**
- Implemented an `isEditing` state per field.
- Inputs are `disabled` by default.
- "Edit" (Pencil) icons toggle the state.
- "Save" button only enables when `isDirty` (deep comparison with `initialData`).

## 5. Supabase Real-time & Validation
**Challenge:** Ensuring frontend math matches backend reality.
**Solution:**
- Used Node.js scripts (`tsx`) to simulate database inserts (losses/skipped days) and verify the resulting math independently of the UI. This proved crucial for trusting the complex projection formulas.
