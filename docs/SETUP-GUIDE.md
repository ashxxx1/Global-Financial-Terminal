# Setup guide — step by step

Click-by-click instructions for the founder tasks in `YOUR-TASKS.md`.
Companion to that file; do these in order.

**Two things that apply to almost all of them:**

- The project now lives at `~/Downloads/Projects/Global-Financial-Terminal-main`.
  Every terminal command below assumes you start with:
  ```bash
  cd ~/Downloads/Projects/Global-Financial-Terminal-main
  ```
- **`.env.local` is your local machine only. Vercel env vars are the live site.**
  A key added to one does NOT reach the other. Most tasks need it in *both*.
  And because this is a Vite app, env vars are read **at build time** — after
  adding one to Vercel you must trigger a **redeploy** or it won't take effect.

---

## 1. Deploy Firestore security rules  🔴

**Why:** feedback + PMF responses are silently dropped until this runs, and the
database is on permissive console defaults.

1. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Projects/Global-Financial-Terminal-main
   ```
2. Log in to Firebase (opens a browser — pick the Google account that owns the
   `global-financial-terminal` project):
   ```bash
   npx firebase login
   ```
   If it asks about usage collection, either answer is fine.
3. Deploy just the rules:
   ```bash
   npx firebase deploy --only firestore:rules --project global-financial-terminal
   ```
4. Expect: `✔ Deploy complete!`. If it says *"No currently active project"*,
   the `--project` flag above already handles it; if it still complains, run
   `npx firebase use global-financial-terminal` once, then repeat step 3.

**How to confirm it worked:** Firebase console → Firestore Database → Rules tab
should show the `feedback` and `pmf_responses` matches with a recent timestamp.
Then in the live app, open the Feedback button, send a test message, and check
Firestore Database → Data → the `feedback` collection has a new document.

*Tell me once done — I don't need to do anything after, it just starts working.*

---

## 2. PostHog analytics key  🔴

**Why:** every product metric (activation, onboarding, PMF, funnel) is being
thrown away until a key exists.

1. Go to [posthog.com](https://posthog.com) → **Get started free**. Sign up.
2. When it asks the region, **pick US or EU and remember which** — it changes
   the host URL. (US is the default in our code.)
3. In the onboarding, choose **Web** as the product. Skip the snippet install
   step — our code already includes PostHog.
4. Get the key: bottom-left **Settings** (gear) → **Project** → **Project
   variables**. Copy the **Project API Key** (starts with `phc_`).
5. Add it locally. Open `.env.local` in the project and add a line:
   ```
   VITE_POSTHOG_KEY=phc_your_key_here
   ```
   **If you chose the EU region**, also add:
   ```
   VITE_POSTHOG_HOST=https://eu.i.posthog.com
   ```
6. Add it to the live site: [vercel.com](https://vercel.com) → the
   **global-financial-news** project → **Settings** → **Environment Variables**
   → add `VITE_POSTHOG_KEY` (and `VITE_POSTHOG_HOST` if EU), value pasted, tick
   **Production, Preview, Development**, → **Save**.
7. **Redeploy** so the live build picks it up: Vercel → **Deployments** tab →
   the top (latest) deployment → the **⋯** menu → **Redeploy**.

**How to confirm:** open the live site, **accept** the analytics consent banner
(it stays off until you do), click around, then in PostHog → **Activity** (or
**Web analytics**) you should see events appear within a minute or two.

---

## 3. Market data API key (Finnhub)  🔴

**Why:** equity/index prices are simulated until this is set. You can't charge
for fake prices, so this gates monetization.

1. Go to [finnhub.io](https://finnhub.io) → **Get free API key** → sign up.
2. On the dashboard you land on, copy the **API Key** shown at the top.
3. Add it locally in `.env.local`:
   ```
   VITE_FINNHUB_API_KEY=your_key_here
   ```
4. Add it to Vercel exactly like step 2.6 above (same Settings → Environment
   Variables screen), then **redeploy** (step 2.7).

**How to confirm:** on the live site open any US stock (e.g. `/stock/AAPL`); the
source badge should read **LIVE** rather than **SIM** during US market hours.

**Note on the free tier:** it covers US stocks and has a rate limit (~60
calls/min). That's fine now. Non-US equities and index levels stay simulated
until we add a paid tier or another provider — the `/data-sources` page already
tells users this honestly, so nothing misrepresents itself in the meantime.

---

## 4. Google Search Console + sitemap  🔴

**Why:** 660 URLs are live but undiscovered. This starts the SEO clock, and SEO
is the plan's main growth channel.

**Important:** because the site is on a `*.vercel.app` address, you **cannot**
use the "Domain" verification (that needs DNS you don't control). Use the
**URL prefix** method with an HTML tag — steps below.

1. Go to [search.google.com/search-console](https://search.google.com/search-console),
   sign in with your Google account.
2. Click **Add property** → choose the **URL prefix** box (the right-hand one) →
   enter `https://global-financial-news.vercel.app` → **Continue**.
3. It shows verification methods. Expand **HTML tag**. It gives you a line like
   `<meta name="google-site-verification" content="ABC123..." />`.
   **Copy just the `content` value** (the `ABC123...` part) and paste it to me —
   I'll add the tag to `index.html` and push it (takes ~1 min to go live).
   *(Alternative if you'd rather not involve me: download the HTML verification
   file it offers, drop it in the `public/` folder, and I'll push it — or you
   commit it yourself.)*
4. Once I've pushed the tag and Vercel has redeployed, click **Verify** in
   Search Console.
5. After it verifies: left sidebar → **Sitemaps** → in "Add a new sitemap"
   enter `sitemap.xml` → **Submit**.

**How to confirm:** the sitemap row shows **Success** and, over the next few
days, a rising "Discovered URLs" count. Indexing itself takes weeks — that's
normal; the point is starting the clock.

---

## 5–6. Legal + business entity  🟠 (decisions, not clicks)

Not something to "do" in ten minutes — decisions to make before you take money:

- **Where are you operating from / under what entity?** Sole proprietor vs a
  registered company (LLC / Ltd / Pvt Ltd depending on country). Stripe needs a
  real entity and a bank account.
- **Terms of Service + Privacy Policy.** I can draft solid, specific templates,
  but a lawyer should review them before you charge anyone — finance-adjacent
  products get more scrutiny. For a free product with no payments yet, you can
  launch on reviewed templates; the lawyer step gates *taking payment*, not
  launching.

*You don't need these to get your first users. They gate Phase 4 (money).*

---

## 7. Support email  🟠 (30 seconds from you)

Just decide an address (e.g. `hello@` or `support@` on a domain you own, or even
a dedicated Gmail for now) and tell me. I'll wire it into the feedback flow and
the "contact us" points so replies have somewhere to go.

---

## 8. Confirm the ICP  🟠 (read + react)

Open `docs/STRATEGY.md` and read the ICP section. I made a real call: that
**non-US market watchers** are the sharpest segment, because almost every free
tool is US-first while we cover 68 countries. This decision shapes SEO,
localisation, and content priorities. If you disagree, say so now — changing it
later means re-doing work built on top of it.

---

## Recommended order

1 → 2 → 3 first (all quick, all unblock live functionality), then 4 (SEO clock),
then 7 (send me the email), then read 8. Leave 5–6 until you're approaching
payments.
