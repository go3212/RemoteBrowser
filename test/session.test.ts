import { chromium } from 'playwright';
import axios from 'axios';
import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function request(method: string, path: string, data?: any) {
    return axios({
        method,
        url: `${BASE_URL}${path}`,
        data,
        validateStatus: () => true
    });
}

async function main() {
    console.log('Running test session...');
    
    // 1. Health
    console.log('Checking health...');
    const healthRes = await request('GET', '/health');
    assert.strictEqual(healthRes.status, 200);
    assert.ok(healthRes.data.orchestratorId);
    console.log('Health OK');

    // 2. Create Session
    console.log('Creating session...');
    const sessionRes = await request('POST', '/sessions');
    assert.strictEqual(sessionRes.status, 200);
    const session = sessionRes.data;
    assert.strictEqual(session.status, 'idle');
    console.log('Session created:', session.id);

    // 3. Start Worker
    console.log('Starting worker...');
    const startRes = await request('POST', `/sessions/${session.id}/start`);
    if (startRes.status !== 200) {
        console.error('Failed to start worker:', startRes.data);
        process.exit(1);
    }
    const { wsEndpoint } = startRes.data;
    console.log('Worker started at:', wsEndpoint);

    // 4. Connect Playwright
    console.log('Connecting Playwright...');
    try {
        const browser = await chromium.connect({ wsEndpoint, timeout: 30000 });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        console.log('Navigating...');
        await page.goto('https://example.com');
        const title = await page.title();
        console.log('Page title:', title);
        assert.strictEqual(title, 'Example Domain');
        
        await browser.close();
        console.log('Playwright test passed');
    } catch (e) {
        console.error('Playwright error:', e);
        process.exit(1);
    }

    // 5. Cleanup
    console.log('Cleaning up...');
    await request('DELETE', `/sessions/${session.id}`);
    console.log('Done.');
}

main().catch(console.error);

