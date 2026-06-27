import { test, expect } from '@playwright/test';

test('Test creating a post', async ({ page }) => {
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    logs.push(err.message);
  });

  await page.goto('http://localhost:5173/');
  
  await page.evaluate(() => {
    if (window.setPlaywrightTestUser) {
      window.setPlaywrightTestUser(JSON.stringify({ 
        uid: 'user123', 
        email: 'test@test.com', 
        displayName: 'Aarush Kapoor', 
        username: 'ashura' 
      }));
    }
  });

  // Wait for the app to load
  await page.waitForTimeout(2000);
  
  // Click Social tab
  await page.click('button:has-text("Social")');
  await page.waitForTimeout(1000);

  // Type in the post box
  await page.fill('textarea[placeholder="Share analysis, charts, or macro thesis..."]', 'hi');
  await page.waitForTimeout(500);

  // Click Post
  await page.click('button:has-text("Post")');
  await page.waitForTimeout(2000);

  console.log('--- ERRORS START ---');
  console.log(logs.join('\\n'));
  console.log('--- ERRORS END ---');
});
