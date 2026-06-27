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

    // Use the live URL since the user pushed to GitHub to test on the live website.
    // Replace this with 'http://localhost:5173' if testing locally.
    const APP_URL = 'https://global-financial-terminal.vercel.app/';

    console.log('Navigating both users to the application...');
    await pageA.goto(APP_URL);
    await pageB.goto(APP_URL);

    // --- HELPER FUNCTION: Anonymous Login & Setup ---
    // If the app uses Anonymous Auth automatically, we just need to set a username
    // in the UserProfile. If it requires explicit signup, we would script it here.
    
    // For this simulation, we'll assume the users land on the Social Tab
    // Let's navigate to the Social Tab
    await pageA.click('text=Social'); // Adjust selector based on actual navigation bar
    await pageB.click('text=Social');

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
    // Note: Since users are anonymous, we might just click the first user in the list
    await pageA.locator('button').filter({ hasText: 'Unknown' }).first().click();

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
