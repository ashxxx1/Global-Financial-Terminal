# Metrics Definitions

Growth-plan items 17, 18 and 20. These definitions are deliberately strict:
the $100K / 20,000-user target is meaningless unless "user" means one thing.

---

## 17. North Star Metric

> ## Weekly Engaged Users (WEU)
> **Distinct users who performed ≥2 value actions on ≥2 separate days within
> the trailing 7 days.**

### Why this one

A North Star has to (a) represent delivered value, (b) predict retention and
revenue, and (c) be something we can actually move.

- **≥2 value actions** filters out bounces and accidental loads. Someone who
  landed and left did not get value.
- **≥2 separate days** is the crucial part: it measures **habit**, not
  interest. For an orientation product (JTBD 1), habit *is* the value. A user
  who checks in twice a week is on the path to paying; one who binged for an
  hour once is not.
- It is directly moved by the retention work in Phase 2 (digest, alerts,
  portfolio) — so the roadmap and the metric point the same way.

### What we deliberately rejected

| Candidate | Why not |
|---|---|
| Page views / sessions | Vanity. Inflated by bots, bounces and our own reloads. |
| Registered users (cumulative) | Only ever goes up. Hides churn entirely. |
| Time on site | For an orientation tool, *less* time can mean more value. Perverse incentive. |
| MAU alone | Too lagging and too loose to steer weekly decisions. Still tracked as the headline target — see below. |

---

## 18. User state definitions

Precise, mutually exclusive, and instrumented.

| Term | Definition | Source |
|---|---|---|
| **Visitor** | A unique browser loading any page. | PostHog `$pageview` |
| **Registered user** | Completed signup (email or Google). | `signed_up` |
| **Activated user** | Registered *and* performed ≥1 value action within their first session. | `signed_up` → any value action |
| **Active user (MAU)** | A registered user with **≥1 value action** in the trailing 30 days. | value actions |
| **Engaged user (WEU)** | ≥2 value actions on ≥2 distinct days in trailing 7 days. **← North Star** | value actions |
| **Churned** | Was MAU last month, zero value actions this month. | absence |

> **The 20,000-user target refers to MAU as defined above** — registered users
> taking real actions, not page loads. Counting visitors would let us hit
> "20,000" while having nothing.

---

## Value actions

The canonical list. A "value action" is any event that indicates the user got
something out of the product. **All 15 are now instrumented and firing** (item
20 — previously 9 of these were declared in the event map but never actually
sent, which would have made every metric above unmeasurable).

**Counted as value actions:**

| Event | Job served | Why it counts |
|---|---|---|
| `country_opened` | JTBD 1, 2 | Core orientation action |
| `stock_opened` | JTBD 1, 2 | Depth interest |
| `overlay_switched` | JTBD 1 | Active exploration of the globe |
| `watchlist_added` | JTBD 1 | **Strongest** retention predictor — personalisation |
| `alert_created` | JTBD 1 | Intent to return |
| `news_clicked` | JTBD 2 | Interpretation job |
| `search_opened` | JTBD 1, 2 | Directed intent |
| `shared` | JTBD 3 | Advocacy — also the growth loop |

**Not counted** (they happen *to* the user, or are not value delivery):
`page_viewed`, `signed_up`, `signed_in`, `signed_out`, `alert_fired`,
`watchlist_removed`, `upgrade_clicked`.

---

## 19. The funnel to build in PostHog

```
Visitor
  └─ viewed landing
      └─ clicked a CTA            (upgrade_clicked)
          └─ signed up            (signed_up)        ← conversion 1
              └─ first value action within session   ← ACTIVATION
                  └─ returned in week 1              ← W1 retention
                      └─ became WEU                  ← North Star
                          └─ upgraded to Pro         ← conversion 2 (revenue)
```

**Rates to watch, with the targets implied by the plan's math:**

| Step | Target | Why that number |
|---|---|---|
| Visitor → signup | ≥4% | The traffic model assumes it; below this, 1.25M visits isn't enough |
| Signup → activated | ≥60% | Below this, onboarding (items 38–44) is broken |
| Activated → W1 retained | ≥25% | Gate G1 |
| Registered → MAU | ≥40% | The 20K MAU target assumes 50K registered |
| MAU → paid | ≥3% | Gate G4; drives the $108K ARR line |
| Monthly churn | <8% | Above this, LTV collapses below the $150 target |

---

## Hypotheses to test once data flows

Written down now so they can be confirmed or killed honestly later, rather than
rationalised after the fact.

1. **`watchlist_added` is the activation moment.** Users who add ≥1 symbol in
   their first session retain dramatically better than those who don't. If
   true, the entire onboarding should funnel toward it (item 39).
2. **Country pages are the acquisition surface, the globe is the retention
   surface.** SEO lands people on `/country/*`; the globe is what makes them
   come back.
3. **Non-US users retain better** than US users, because their alternatives are
   worse. If true, it sharpens both the ICP and the localisation priority
   (item 148–149).

---

## Review ritual (item 23)

Weekly, same day, written. Four questions only:

1. What is WEU this week vs last?
2. Where did the funnel leak most?
3. What did we ship, and did it move the number we said it would?
4. What is the single biggest constraint right now?
