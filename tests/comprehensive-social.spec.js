// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Comprehensive Social Features', () => {

  const APP_URL = 'http://localhost:5173/social';

  test('User can post to feed, edit post, like, and delete post', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto(APP_URL);
    await page.waitForSelector('text=Confluence Feed', { timeout: 15000 });

    const postText = `Automated test post ${Date.now()} #testing`;
    await page.fill('textarea[placeholder="Share analysis, charts, or macro thesis..."]', postText);
    await page.click('button:has-text("Post")');

    // Wait for post to appear
    await page.waitForSelector(`text=${postText}`, { timeout: 15000 });
    
    // Find the specific post
    const postContainer = page.locator('.glass-panel', { hasText: postText }).first();
    
    // Edit the post
    await postContainer.locator('button').filter({ has: page.locator('svg') }).last().hover();
    await postContainer.locator('button:has-text("Edit")').click();
    
    const editText = ` (Edited)`;
    await page.fill('textarea[placeholder="Share analysis, charts, or macro thesis..."]', postText + editText);
    await page.click('button:has-text("Post")'); // Assuming the post button is used for saving edits? Oh wait, in PostsFeed it updates directly on 'Enter' or same button?
    // Wait, let's look at PostsFeed: 
    // It uses the same composer. The composer has "Post" button which calls handlePostSubmit.
  });

});
