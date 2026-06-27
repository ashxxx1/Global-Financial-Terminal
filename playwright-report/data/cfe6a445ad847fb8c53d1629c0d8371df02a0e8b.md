# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comprehensive-social.spec.js >> Comprehensive Social Features >> User can post to feed, edit post, like, and delete post
- Location: tests\comprehensive-social.spec.js:8:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('text=Confluence Feed') to be visible

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]: S&P 500 +1.24%
    - generic [ref=e6]: NIKKEI +0.79%
    - generic [ref=e7]: NIFTY 50 +0.96%
    - generic [ref=e8]: BTC $67,234
    - generic [ref=e9]: GOLD $2,387
    - generic [ref=e10]: EUR/USD 1.0876
    - generic [ref=e11]: DAX -0.78%
    - generic [ref=e12]: FTSE -0.29%
    - generic [ref=e13]: SSE +1.47%
  - generic [ref=e14]:
    - generic [ref=e15]:
      - generic [ref=e16]: 🌐
      - generic [ref=e17]:
        - generic [ref=e18]: GLOBALFIN TERMINAL
        - generic [ref=e19]: MARKET INTELLIGENCE PLATFORM
    - generic [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]: 25+
        - generic [ref=e23]: Markets Tracked
      - generic [ref=e24]:
        - generic [ref=e25]: 1,800+
        - generic [ref=e26]: Data Points
      - generic [ref=e27]:
        - generic [ref=e28]: "2026"
        - generic [ref=e29]: Live Since
    - generic [ref=e31]:
      - heading "Access Terminal" [level=1] [ref=e32]
      - paragraph [ref=e33]: Institutional-grade global market intelligence. Sign in to request access — approved by admin.
      - button "Continue with Google" [ref=e34] [cursor=pointer]:
        - img [ref=e35]
        - text: Continue with Google
      - paragraph [ref=e40]: 🔒 Access is private and invite-only. New sign-ins require admin approval before terminal access is granted.
    - generic [ref=e41]:
      - generic [ref=e42]: GlobalFin Terminal v0.1.1
      - generic [ref=e43]: ·
      - generic [ref=e44]: Private Beta
      - generic [ref=e45]: ·
      - generic [ref=e46]: © 2026
  - generic [ref=e47]:
    - generic [ref=e48]: What's inside
    - generic [ref=e49]:
      - generic [ref=e50]: 🌍
      - generic [ref=e51]:
        - generic [ref=e52]: 3D Globe Intelligence
        - generic [ref=e53]: Interactive Earth with real-time news heatmap across 25+ markets
    - generic [ref=e54]:
      - generic [ref=e55]: 📰
      - generic [ref=e56]:
        - generic [ref=e57]: Country Drill-Down
        - generic [ref=e58]: Click any nation — top headlines, local index, AI sentiment score
    - generic [ref=e59]:
      - generic [ref=e60]: 📈
      - generic [ref=e61]:
        - generic [ref=e62]: Live Market Data
        - generic [ref=e63]: 18+ global indices, FX rates, commodities, and crypto in one view
    - generic [ref=e64]:
      - generic [ref=e65]: ⚡
      - generic [ref=e66]:
        - generic [ref=e67]: AI Sentiment Engine
        - generic [ref=e68]: News-to-price impact scoring with bullish/bearish signals
    - generic [ref=e69]:
      - generic [ref=e70]: 🔔
      - generic [ref=e71]:
        - generic [ref=e72]: Alerts (Coming)
        - generic [ref=e73]: Custom price alerts and breaking news notifications
```

# Test source

```ts
  1  | // @ts-check
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test.describe('Comprehensive Social Features', () => {
  5  | 
  6  |   const APP_URL = 'http://localhost:5173/social';
  7  | 
  8  |   test('User can post to feed, edit post, like, and delete post', async ({ browser }) => {
  9  |     const context = await browser.newContext();
  10 |     const page = await context.newPage();
  11 |     
  12 |     await page.goto(APP_URL);
> 13 |     await page.waitForSelector('text=Confluence Feed', { timeout: 15000 });
     |                ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  14 | 
  15 |     const postText = `Automated test post ${Date.now()} #testing`;
  16 |     await page.fill('textarea[placeholder="Share analysis, charts, or macro thesis..."]', postText);
  17 |     await page.click('button:has-text("Post")');
  18 | 
  19 |     // Wait for post to appear
  20 |     await page.waitForSelector(`text=${postText}`, { timeout: 15000 });
  21 |     
  22 |     // Find the specific post
  23 |     const postContainer = page.locator('.glass-panel', { hasText: postText }).first();
  24 |     
  25 |     // Edit the post
  26 |     await postContainer.locator('button').filter({ has: page.locator('svg') }).last().hover();
  27 |     await postContainer.locator('button:has-text("Edit")').click();
  28 |     
  29 |     const editText = ` (Edited)`;
  30 |     await page.fill('textarea[placeholder="Share analysis, charts, or macro thesis..."]', postText + editText);
  31 |     await page.click('button:has-text("Post")'); // Assuming the post button is used for saving edits? Oh wait, in PostsFeed it updates directly on 'Enter' or same button?
  32 |     // Wait, let's look at PostsFeed: 
  33 |     // It uses the same composer. The composer has "Post" button which calls handlePostSubmit.
  34 |   });
  35 | 
  36 | });
  37 | 
```