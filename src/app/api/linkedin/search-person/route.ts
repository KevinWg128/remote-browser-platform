import { NextRequest } from 'next/server';
import { browserService } from '@/lib/browser-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const { query, browserId } = await request.json();
    if (!query || !browserId) {
        return Response.json({ error: 'query and browserId required' }, { status: 400 });
    }
    const browser = browserService.getBrowserInstance(browserId);
    if (!browser) {
        return Response.json({ error: 'Browser not found' }, { status: 404 });
    }
    const pages = await browser.pages();
    let page = pages[0] ?? await browser.newPage();
    try {
        const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const selector = 'ul.reusable-search__entity-result-list';
        const hasResults = await page.$(selector);
        if (!hasResults) {
            return Response.json({ results: [] });
        }
        await page.waitForSelector(selector, { timeout: 15000 });
        const results = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('ul.reusable-search__entity-result-list li'));
            return items.slice(0, 10).map(item => {
                const nameEl = item.querySelector('span.entity-result__title-text a span[aria-hidden]');
                const name = nameEl?.textContent?.trim() || '';
                const profileLink = (item.querySelector('a.app-aware-link') as HTMLAnchorElement)?.href || '';
                return { name, profileUrl: profileLink };
            });
        });
        return Response.json({ results });
    } catch (error) {
        console.error('LinkedIn person search error:', error);
        return Response.json({ results: [] }, { status: 200 });
    }
}
