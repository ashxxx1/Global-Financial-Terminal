// @ts-check
import { test, expect } from '@playwright/test';

// Configuration for testing two isolated accounts
test.describe('Confluence Social Platform - Dual Account E2E Test', () => {

  test('Create two accounts, post, like, and DM each other', async ({ browser }) => {
    
    // Create two completely isolated browser contexts (like 2 incognito windows)
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Use local dev server URL
    const APP_URL = 'http://localhost:5173/social';

    // Setup User A
    await pageA.goto(APP_URL);
    // Wait for Login page to be fully ready
    await pageA.waitForSelector('text=Access Terminal', { timeout: 30000 });
    
    await pageA.evaluate(() => {
        if (window.setPlaywrightTestUser) {
            window.setPlaywrightTestUser(JSON.stringify({ uid: 'test-user-A', email: 'testa@example.com', displayName: 'Test User A', username: 'usera' }));
        }
    });
    // Wait for the terminal to load (Globe view)
    await pageA.waitForSelector('button[title="Social"]', { timeout: 30000 });
    // Click Social nav item
    await pageA.click('button[title="Social"]');

    // Setup User B
    await pageB.goto(APP_URL);
    await pageB.waitForSelector('text=Access Terminal', { timeout: 30000 });
    
    await pageB.evaluate(() => {
        if (window.setPlaywrightTestUser) {
            window.setPlaywrightTestUser(JSON.stringify({ uid: 'test-user-B', email: 'testb@example.com', displayName: 'Test User B', username: 'userb' }));
        }
    });
    await pageB.waitForSelector('button[title="Social"]', { timeout: 30000 });
    await pageB.click('button[title="Social"]');

    // Wait for the feed to load
    await pageA.waitForSelector('text=Confluence Feed', { timeout: 10000 });
    await pageB.waitForSelector('text=Confluence Feed', { timeout: 10000 });

    // --- TEST 1: Global Feed Interaction ---
    console.log('User A creates a post...');
    const postText = `Hello from User A! End-to-end testing the new Confluence platform #${Date.now()}`;
    await pageA.fill('textarea[placeholder="Share analysis, charts, or macro thesis..."]', postText);
    await pageA.click('button:has-text("Post")');

    console.log('User B sees the post and likes it...');
    // User B waits for the new post to appear in their feed (real-time via Firebase)
    await pageB.waitForSelector(`text=${postText}`, { timeout: 10000 });
    
    // Find the Like button on that specific post
    const postContainer = pageB.locator('.glass-panel', { hasText: postText });
    await postContainer.locator('button', { hasText: '0' }).first().click(); // Clicks Like

    // --- TEST 2: Direct Messaging ---
    console.log('User A opens DMs and messages User B...');
    // Navigate to DM mode
    await pageA.click('button[title="Direct Messages"]', { strict: false });
    
    // User B also opens DMs
    await pageB.click('button[title="Direct Messages"]', { strict: false });

    // Assuming User A can see User B in the list
    // Click on User B's name in the DM list
    await pageA.locator('button').filter({ hasText: 'Test User B' }).first().click();

    const dmText = `Hey User B, this is a real-time DM! ${Date.now()}`;
    await pageA.fill('textarea[placeholder^="Message @"]', dmText);
    await pageA.click('button:has-text("Send")'); // assuming send icon button

    console.log('User B receives the DM...');
    // User B should see the message appear
    await pageB.waitForSelector(`text=${dmText}`, { timeout: 10000 });

    // --- TEST 3: Server Creation ---
    console.log('User A creates a Server...');
    await pageA.click('button:has-text("Create Server")'); // Assuming a '+' button or create server button
    await pageA.fill('input[placeholder="Server Name"]', 'Playwright Test Server');
    await pageA.click('button:has-text("Create")');

    // Wait for server to be created
    await pageA.waitForSelector('text=Playwright Test Server', { timeout: 10000 });
    
    console.log('User A posts in the new server channel...');
    const channelMsg = 'Welcome to my new server!';
    await pageA.fill('textarea[placeholder^="Message #"]', channelMsg);
    await pageA.click('button:has-text("Send")');
    await pageA.waitForSelector(`text=${channelMsg}`);

    console.log('All automated tests passed successfully!');

    // Close contexts
    await contextA.close();
    await contextB.close();
  });
});
