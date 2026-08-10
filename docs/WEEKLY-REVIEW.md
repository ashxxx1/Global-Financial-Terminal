# The Monday review

**Growth-plan item 23.** Same day, same time, written down. Thirty minutes.

A roadmap without a weekly number check is a wish list. This is the ritual that
turns the plan into something that can be wrong — and therefore something that
can be corrected.

**When:** Monday, 09:00 your local time. Non-negotiable, even in a bad week —
especially in a bad week.

---

## The five numbers

Pull these from PostHog and write them into the log below. Never from memory.

| # | Metric | Where | Target this phase |
|---|---|---|---|
| 1 | **Weekly Engaged Users** (North Star) | PostHog → the WEU insight | growing week over week |
| 2 | New signups | `signed_up` event count | 100 cumulative → Gate G1 |
| 3 | Activation rate | `activated` ÷ `signed_up` | > 40% |
| 4 | Week-1 retention | cohort retention, W1 column | ≥ 25% → Gate G1 |
| 5 | Organic sessions | Search Console → Performance | rising once indexed |

Definitions live in `docs/METRICS.md`. If you find yourself redefining a metric
mid-review, stop and fix the definition first — a moving definition makes every
past week a lie.

---

## The four questions

Answer in writing. Three sentences each, maximum.

1. **What moved, and why?** Name the cause or write "unknown" — never invent one.
2. **What did we ship, and did it show up in the numbers?** If it didn't, say so.
3. **What is the single biggest bottleneck right now?** Exactly one.
4. **What is the one thing we do this week to move it?** Exactly one.

---

## The rules

- **One bottleneck, one action.** A review producing five priorities has produced none.
- **Write "unknown" freely.** A fabricated explanation is worse than an admitted gap — it gets acted on.
- **Do not change the plan on a single week's data.** Two consecutive weeks of a trend, or it's noise.
- **Check the gate.** Are we allowed to be in this phase? Gates are in `GROWTH-PLAN.md`; skipping them is how products die with a big roadmap and no users.
- **If a number can't be pulled, that's the week's bug.** Broken instrumentation outranks any feature.

---

## Log

Newest first. Copy the block, fill it in, keep it short.

```
## Week of YYYY-MM-DD
WEU: —      Signups: —      Activation: —      W1 retention: —      Organic: —
Moved:      
Shipped:    
Bottleneck: 
This week:  
```

<!-- Add each week's block below this line. -->
