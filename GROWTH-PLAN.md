# Road to 20,000 Active Users & $100K ARR

**Status:** Living document. Tick items as we complete them.
**Realistic timeline:** 18–24 months. Anyone promising 6 is selling something.

---

## The math that dictates this plan

**Revenue.** At 20,000 MAU and a realistic 3% free→paid conversion, you get ~600
subscribers. At the $9/mo currently on the landing page that is **$65K ARR — it
does not reach the target.** The same 600 subscribers at **$15/mo produce $108K.**

> **Decision 1: price Pro at $15/mo, not $9.** The target is unreachable at $9
> without best-in-class 5% conversion, which is not a plan, it is a hope.

**Traffic.** 20,000 MAU implies ~50,000 registered users (at 40% monthly-active
ratio), which implies **~1.25M cumulative visitors** at a 4% signup rate —
roughly **70,000 visitors/month sustained**.

> **Decision 2: SEO is the primary channel.** Paid acquisition cannot deliver
> 70K/mo visits on a bootstrapped budget in this vertical (finance keywords are
> among the most expensive in existence). Programmatic SEO across countries,
> tickers and sectors is the only affordable path.

**Blended revenue.** Do not rely on subscriptions alone:
- Subscriptions: 600 × $15/mo = **$108K ARR**
- Broker affiliate: 20K users, 1% convert @ ~$100 CPA = **~$20K**
- Embed/B2B: 3–5 clients @ $200–500/mo = **$7K–30K ARR**

Target the blend. It de-risks the whole thing.

---

## Milestone gates

Do not advance a phase until its gate is met. Skipping gates is how products die
with a big roadmap and no users.

| Gate | Milestone | Criteria |
|---|---|---|
| **G1** | First signal | 100 signups · 15 user interviews · ≥25% week-1 retention |
| **G2** | Retention works | 1,000 MAU · ≥30% D30 retention · digest open rate ≥35% |
| **G3** | Acquisition works | 10,000 MAU · 50K monthly visits · ≥40% of signups from organic |
| **G4** | Money works | $1K MRR · ≥2% conversion · churn <8%/mo |
| **G5** | Target | **20,000 MAU · $100K ARR** |

**Unit economics to hold:** CAC < $5 (organic-led) · LTV > $150 · LTV:CAC > 3:1

---

# PHASE 0 — Foundation & Truth
*Goal: a product that is honest, measurable, and legally safe to charge for.*

### Data integrity (non-negotiable before charging)
- [ ] 1. Wire real delayed equity/index data (Finnhub or Twelve Data free tier)
- [ ] 2. Label every instrument with its true source and delay ("15-min delayed")
- [ ] 3. Make the Risk Index real, or remove it (currently DEMO-tagged)
- [ ] 4. Make AI Sentiment real, or remove it (currently DEMO-tagged)
- [ ] 5. Build a public `/data-sources` page listing every provider
- [ ] 6. Review each provider's ToS for redistribution rights
- [ ] 7. Add a data-freshness indicator per panel (last updated timestamp)
- [ ] 8. Remove or clearly fence any remaining simulated numbers

### Legal & compliance (finance is a regulated-adjacent space)
- [ ] 9. Terms of Service page
- [ ] 10. Privacy Policy page (GDPR + CCPA compliant)
- [ ] 11. Cookie consent banner (required for EU traffic)
- [x] 12. Prominent "not investment advice" disclaimer on every data surface
- [ ] 13. Account deletion + data export flow (GDPR right to erasure)
- [ ] 14. Decide and document jurisdiction of operation
- [ ] 15. Register the business entity before taking payments

### Measurement
- [ ] 16. Add PostHog key to `.env.local` and Vercel (code is already wired)
- [ ] 17. Define the North Star metric (proposed: *weekly active users who view ≥2 sessions*)
- [ ] 18. Define "active user" precisely and write it down
- [ ] 19. Build the core funnel dashboard: visit → signup → activation → W1 → W4
- [ ] 20. Instrument activation events (first watchlist add, first alert, first country open)
- [ ] 21. Add Sentry (or equivalent) for runtime error monitoring
- [ ] 22. Add uptime monitoring with alerting
- [ ] 23. Set a weekly metrics review ritual (same day, same time, written)

### Technical foundation
- [ ] 24. Deploy Firestore security rules (`npx firebase deploy --only firestore:rules`)
- [x] 25. Code-split the bundle (currently 2.3MB / 654KB gzipped — too heavy)
- [x] 26. Lazy-load the globe and Three.js off the critical path
- [ ] 27. Pass Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1)
- [ ] 28. Full mobile responsive audit — finance is a phone habit
- [x] 29. Per-route SEO meta (title/description/canonical)
- [x] 30. `sitemap.xml` + `robots.txt`
- [ ] 31. Set up a staging environment separate from production
- [ ] 32. Automated backups of Firestore
- [ ] 33. Accessibility pass to WCAG 2.2 AA (run the `a11y-audit` skill)

---

# PHASE 1 — First 100 Users & PMF Signal
*Goal: prove someone actually wants this. Gate G1.*

### Know who this is for
- [ ] 34. Write the ICP in one paragraph — who specifically, not "investors"
- [ ] 35. Define the top 3 jobs-to-be-done the product serves
- [ ] 36. Write the positioning statement (for X who Y, we are Z unlike W)
- [ ] 37. Identify the 3 closest competitors and your honest wedge vs each

### Onboarding & activation
- [ ] 38. Design the first-run experience (what happens in the first 60 seconds)
- [ ] 39. Guided onboarding: pick 3 stocks to watch → instant personalized value
- [ ] 40. Define the activation moment and instrument it
- [ ] 41. Fill every empty state with a next action (not just "nothing here")
- [ ] 42. Add a product tour or coach marks for the globe interactions
- [ ] 43. Welcome email on signup
- [ ] 44. Reduce signup friction — test social-only vs email

### Talk to humans
- [ ] 45. Recruit and run 15 user interviews (30 min each, recorded)
- [ ] 46. Write up interview findings into a themes document
- [ ] 47. Add an in-app feedback widget
- [ ] 48. Set up a support channel (email or Crisp/Intercom)
- [ ] 49. Run the Sean Ellis PMF survey ("how disappointed if this disappeared?")
- [ ] 50. Publish a public changelog to show momentum

### First distribution push
- [ ] 51. Post to r/investing, r/stocks, r/dataisbeautiful (value-first, not spam)
- [ ] 52. Show HN launch
- [ ] 53. Product Hunt launch (prepare assets, hunter, day-of plan)
- [ ] 54. Indie Hackers build-in-public post
- [ ] 55. X/Twitter launch thread with the globe as the hook
- [ ] 56. Post to relevant Discord/Slack communities
- [ ] 57. Email personal network for first users and feedback

---

# PHASE 2 — The Retention Engine
*Goal: people come back without being asked. Gate G2.*
*Do this BEFORE scaling acquisition — filling a leaky bucket wastes every visitor.*

### Email infrastructure
- [ ] 58. Choose and integrate a transactional email provider (Resend/Postmark)
- [ ] 59. Set up SPF, DKIM, DMARC (deliverability is make-or-break)
- [ ] 60. Build the email template system matching the brand
- [ ] 61. Preference centre + one-click unsubscribe (legally required)

### The digest — highest-leverage retention feature in fintech
- [ ] 62. Build the daily market digest (watchlist moves + world overnight)
- [ ] 63. Cron job to generate and send it
- [ ] 64. Personalize by the user's watchlist and countries
- [ ] 65. A/B test send time and subject lines
- [ ] 66. Track open rate, click rate, and its effect on retention
- [ ] 67. Weekly digest variant for less-engaged users

### Alerts that actually reach people
- [ ] 68. Off-site alert delivery via email (in-app toasts already exist)
- [ ] 69. PWA setup — installable app
- [ ] 70. Web push notifications
- [ ] 71. Alert types: price level, % move, unusual volume, news on a holding
- [ ] 72. Alert management UI (list, edit, snooze, delete)

### Sticky features
- [ ] 73. Portfolio tracking (manual entry + CSV import — no brokerage integration)
- [ ] 74. Portfolio performance over time with charts
- [ ] 75. Watchlist depth: notes, tags, target prices, multiple lists
- [ ] 76. Economic calendar (Fed, CPI, earnings) plotted on the globe/timeline
- [ ] 77. Saved views and custom layouts
- [ ] 78. Recently viewed / jump back in
- [ ] 79. Country deep-dive pages worth returning to

### Retention analytics
- [ ] 80. Cohort retention curves in PostHog
- [ ] 81. Identify the "aha" action correlated with retention, then push new users to it
- [ ] 82. Churn survey on account deletion
- [ ] 83. Re-engagement email campaign for dormant users
- [ ] 84. Measure D1/D7/D30 and set improvement targets

---

# PHASE 3 — The Acquisition Machine
*Goal: 70K visitors/month, mostly organic. Gate G3.*

### The SSR decision (blocks all SEO)
- [ ] 85. **Decide: migrate to Next.js for SSR/SSG.** Current Vite SPA is largely invisible to search. This is the single biggest unlock in the plan.
- [ ] 86. Migrate routing and rendering
- [ ] 87. Verify server-rendered HTML for all public pages
- [ ] 88. Set up ISR/revalidation for data-driven pages

### Programmatic SEO — the volume play
- [ ] 89. Build 68 country pages: "[Country] Stock Market Today — Live Index, Currency & News"
- [ ] 90. Build ticker pages for every symbol in the registry
- [ ] 91. Build sector pages
- [ ] 92. Build index pages (S&P 500, FTSE, Nikkei…)
- [ ] 93. Build currency pair pages
- [ ] 94. Build crypto asset pages
- [ ] 95. Template comparison pages ("X vs Y")
- [ ] 96. Auto-generated OG image per page (huge for social CTR)
- [ ] 97. Schema.org structured data (FinancialProduct, Dataset, BreadcrumbList)
- [ ] 98. Internal linking strategy across the page graph
- [ ] 99. Keyword research to prioritize which templates ship first
- [ ] 100. Ensure pages have genuine unique value — thin programmatic pages get penalized

### Content & authority
- [ ] 101. Launch a blog on the same domain
- [ ] 102. Publish a weekly market-visualization post (your unfair advantage)
- [ ] 103. Build an educational glossary (SEO gold in finance)
- [ ] 104. Data-story posts using your own visuals ("what the world's markets did in 2026")
- [ ] 105. Guest posts on finance blogs for backlinks
- [ ] 106. Digital PR: publish an original data study journalists will cite
- [ ] 107. Get listed in fintech/tool directories
- [ ] 108. Build a backlink acquisition process

### Viral & social loops
- [ ] 109. Per-country and per-stock shareable snapshot cards
- [ ] 110. "Share this view" deep links that preserve globe state
- [ ] 111. Embeddable widget (also the B2B product)
- [ ] 112. Automated X/Twitter bot posting daily market visuals
- [ ] 113. Daily market recap video/GIF for TikTok/Reels/Shorts
- [ ] 114. Referral programme ("give a month, get a month")
- [ ] 115. Instrument and track viral coefficient (K-factor)

### Community
- [ ] 116. Launch a newsletter as a standalone growth asset
- [ ] 117. Build a Discord or community space
- [ ] 118. Sustained authentic presence in 3 finance subreddits
- [ ] 119. Build in public — weekly progress posts

---

# PHASE 4 — Monetization
*Goal: first real revenue, clean unit economics. Gate G4.*

### Billing infrastructure
- [ ] 120. Integrate Stripe (Checkout + Customer Portal)
- [ ] 121. **Set Pro at $15/mo** (see the math — $9 cannot reach the target)
- [ ] 122. Add an annual plan at ~20% discount (cash up front, lower churn)
- [ ] 123. Implement subscription state in Firestore + webhook sync
- [ ] 124. Stripe Tax for VAT/GST compliance
- [ ] 125. Dunning flow for failed payments
- [ ] 126. Refund and cancellation policy
- [ ] 127. Invoice/receipt emails
- [ ] 128. Test the full billing lifecycle in Stripe test mode

### Paywall design
- [ ] 129. Define exact Free vs Pro limits (proposed Free: 3 watchlist symbols, no email alerts, no digest, no portfolio)
- [ ] 130. Enforce limits server-side, not just in the UI
- [ ] 131. Design upgrade prompts at the moment of limit-hit (not random nags)
- [ ] 132. Free trial of Pro (test 7-day vs 14-day vs none)
- [ ] 133. Build the in-app upgrade flow with `upgrade_clicked` instrumentation (already partly wired)
- [ ] 134. Grandfather early users as a launch incentive

### Revenue diversification
- [ ] 135. Apply to broker affiliate programmes (highest-yield line in fintech content)
- [ ] 136. Build tasteful "trade this" affiliate placements — never disguised as advice
- [ ] 137. Package and price the embeddable widget for B2B
- [ ] 138. Build a B2B landing page + outbound list of fintech blogs/brokers
- [ ] 139. Close the first 3 embed customers
- [ ] 140. Consider a developer API tier

### Conversion optimization
- [ ] 141. Set up an A/B testing framework (PostHog feature flags)
- [ ] 142. Test pricing page layout and plan ordering
- [ ] 143. Test paywall trigger points
- [ ] 144. Analyze the free→paid funnel and fix the biggest drop
- [ ] 145. Add social proof (user count, testimonials) once real
- [ ] 146. Measure and reduce monthly churn below 8%

---

# PHASE 5 — Scale to Target
*Goal: 20,000 MAU · $100K ARR. Gate G5.*

- [ ] 147. Double down on whichever acquisition channel proved best — kill the rest
- [ ] 148. Internationalization (i18n) — finance is global and you already cover 68 countries
- [ ] 149. Localized SEO pages for top non-English markets
- [ ] 150. Native mobile app (or polished PWA) if mobile is >50% of traffic
- [ ] 151. Advanced Pro features to justify a higher tier (screeners, backtesting, API)
- [ ] 152. Consider a Teams/Pro+ tier at higher ARPU
- [ ] 153. Hire or contract: content/SEO first, then support
- [ ] 154. Build a partnership pipeline (brokers, fintech newsletters, educators)
- [ ] 155. Quarterly strategy review against the gates in this document

---

## Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Market data licensing violation | **Critical** | Items 1–8, legal review before charging |
| SEO migration doesn't land | High | Item 85 is the single biggest bet — validate with a pilot page set first |
| Retention too low to hold 20K MAU | High | Phase 2 gate before scaling acquisition |
| Conversion below 3% | High | Blended revenue (135–140) covers the gap |
| Solo-founder bandwidth | High | Ruthless phase gating; do not parallelize |
| Incumbent copies the globe | Medium | Speed + community, not secrecy |
| Firebase costs at scale | Medium | Monitor from item 22; cache aggressively |

## Anti-goals — things NOT to do

- Do **not** build a mobile app before Gate G3
- Do **not** buy paid ads before organic proves out (finance CPCs are brutal)
- Do **not** add features not requested by interviewed users
- Do **not** chase real-time tick data — it is a capital-intensive trap
- Do **not** scale acquisition before Gate G2 retention holds
