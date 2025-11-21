import puppeteer, { Browser as PuppeteerBrowser } from 'puppeteer';
import { Browser } from '@/types';

interface BrowserInstance {
    browser: PuppeteerBrowser;
    metadata: Browser;
}

class BrowserService {
    private browsers: Map<string, BrowserInstance> = new Map();
    private instanceId: string;

    constructor() {
        this.instanceId = Math.random().toString(36).substring(7);
        console.log(`[BrowserService] New instance created: ${this.instanceId}`);
    }

    async launchBrowser(name: string): Promise<Browser> {
        try {
            console.log(`[BrowserService ${this.instanceId}] Launching browser: ${name}`);
            const browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                ],
            });

            const wsEndpoint = browser.wsEndpoint();
            const process = browser.process();
            const pid = process?.pid;

            const id = Math.random().toString(36).substring(7);
            const metadata: Browser = {
                id,
                name,
                status: 'running',
                port: 0, // Not using port-based connection
                wsEndpoint,
                pid,
                createdAt: new Date().toISOString(),
            };

            this.browsers.set(id, { browser, metadata });
            console.log(`[BrowserService ${this.instanceId}] Browser ${id} added. Total browsers: ${this.browsers.size}`);
            return metadata;
        } catch (error) {
            console.error('Failed to launch browser:', error);
            throw new Error('Failed to launch browser');
        }
    }

    getBrowsers(): Browser[] {
        return Array.from(this.browsers.values()).map((instance) => instance.metadata);
    }

    async closeBrowser(id: string): Promise<boolean> {
        const instance = this.browsers.get(id);
        if (!instance) {
            return false;
        }

        try {
            await instance.browser.close();
            this.browsers.delete(id);
            return true;
        } catch (error) {
            console.error('Failed to close browser:', error);
            return false;
        }
    }

    getBrowserById(id: string): Browser | undefined {
        return this.browsers.get(id)?.metadata;
    }

    getBrowserInstance(id: string): PuppeteerBrowser | undefined {
        return this.browsers.get(id)?.browser;
    }
}

// Create a truly global singleton using globalThis
// This ensures the same instance is used across Next.js and the custom server
declare global {
    var __browserService: BrowserService | undefined;
}

if (!globalThis.__browserService) {
    console.log('[BrowserService] Initializing global singleton');
    globalThis.__browserService = new BrowserService();
}

export const browserService = globalThis.__browserService;
