# Your side — things only you can do

Claude maintains this file. Everything here is blocked on credentials, an
account, a legal decision, or your voice. Tick items off and tell me when
something's done so I can unblock the work behind it.

Last updated: 2026-08-02 (rev 2)

---

## 🔴 Blocking — costing you something every day

### 1. Deploy Firestore security rules  ✅ DONE 2026-08-02
**Blocks:** all feedback and PMF survey responses are silently discarded right
now. The UI says thank-you; nothing is stored. Your database is also still on
console defaults rather than the owner-only rules in `firestore.rules`.

```bash
npx firebase login && npx firebase deploy --only firestore:rules
```
*Plan item 24. ~2 minutes.*

---

### 2. PostHog key
**Blocks:** every analytics event is firing into the void — `activated`,
`onboarding_completed`, `pmf_answered`, `feedback_submitted`, plus 20 others.
Until this exists, every product decision is a guess.

1. Create a free project at [posthog.com](https://posthog.com)
2. Add to **both** `.env.local` and Vercel → Settings → Environment Variables:
```
VITE_POSTHOG_KEY=phc_xxxxx
```
*Plan item 16.* ⚠️ 2026-08-08: verified the live build has NO PostHog key. The var did not take — check in Vercel that it is named EXACTLY `VITE_POSTHOG_KEY`, value starts `phc_`, and Production is ticked. Then redeploy (or ping me).

---

### 3. Market data API key  ✅ DONE + verified live (2026-08-08)
**Blocks:** equity and index prices are still simulated. **You cannot charge
money until this is real** — it gates all of monetization.

Key is set locally and now used via the /api/quote **proxy** (key stays
server-side). Remaining: add **FINNHUB_API_KEY** (no VITE_ prefix) on Vercel +
redeploy. Steps in docs/SETUP-GUIDE.md §3. Rotate the key once live.

*Plan item 1. Vercel step ~3 minutes.*

---

### 4. Submit the sitemap to Google Search Console  ⏳ tag live — click Verify + submit
**Blocks:** 660 URLs (68 countries + 587 tickers + core pages) are live and
undiscovered. This is where the SEO clock starts, and SEO is the primary
acquisition channel in the plan.

1. Add `global-financial-terminal-eight.vercel.app` at
   [search.google.com/search-console](https://search.google.com/search-console)
2. Verify ownership (DNS or the HTML tag — tell me if you want the tag added)
3. Submit `https://global-financial-terminal-eight.vercel.app/sitemap.xml`

*Plan item 30 follow-up. ~10 minutes.*

---

## 🟠 Decisions only you can make

### 5. Legal review before taking payments
The Terms and Privacy Policy I can draft are **templates, not legal advice**.
Before charging anyone, have a lawyer review them — finance-adjacent products
attract more scrutiny than most.
*Plan items 9, 10, 14, 15.*

### 6. Jurisdiction and business entity
Where is this operating from, and under what entity? Required before Stripe.
*Plan items 14, 15.*

### 7. A support email address  ✅ DONE — aarushkapoor23@gmail.com wired into feedback + footer
The feedback widget captures messages, but replies need a real address.
Tell me what to use and I'll wire it in.
*Plan item 48.*

### 8. Confirm the ICP
Read `docs/STRATEGY.md`. I made a real call — that **non-US market watchers**
are the sharpest segment. It shapes SEO, localisation and content priorities.
Disagree now rather than after we've built to it.

---

## 🟡 Your voice — I can write it, only you can send it

I can draft every word of these. I cannot be you.

- **15 user interviews** (items 45–46) — I'll write the recruiting message,
  interview script and synthesis template.
- **Reddit posts** to r/investing, r/stocks, r/dataisbeautiful (item 51)
- **Show HN** launch (item 52)
- **Product Hunt** launch (item 53)
- **Indie Hackers** build-in-public post (item 54)
- **X/Twitter** launch thread (item 55)
- **Personal network** email (item 57)

**This is Gate G1's real bottleneck.** The product side of Phase 1 is done —
no further building gets you closer to *100 signups · 15 interviews · 25% W1
retention*. Say the word and I'll write the whole launch kit.

---

## 🔵 Later — not urgent yet

- **Stripe account** (item 120) — needed only when we build billing
- **Email provider** (item 58) — Resend/Postmark, for the digest and welcome
  emails in Phase 2
- **Broker affiliate applications** (item 135) — after you have traffic
- **Sentry DSN** (item 21) — free tier, for runtime error monitoring

---

## ✅ Done

- Firebase Auth providers enabled (email + Google)
- Authorized domain added for the live site
- Firestore security rules deployed + enforcing (verified: anon writes blocked)
- Google Search Console verification tag live on production
