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
        const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const selector = 'ul.jobs-search__results-list';
        const hasResults = await page.$(selector);
        if (!hasResults) {
            return Response.json({ results: [] });
        }
        await page.waitForSelector(selector, { timeout: 15000 });
        const results = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('ul.jobs-search__results-list li'));
            return items.slice(0, 10).map(item => {
                const titleEl = item.querySelector('a.base-card__full-link span');
                const title = titleEl?.textContent?.trim() || '';
                const link = (item.querySelector('a.base-card__full-link') as HTMLAnchorElement)?.href || '';
                const descriptionEl = item.querySelector('p.job-result-card__snippet');
                const description = descriptionEl?.textContent?.trim() || '';
                return { title, applyUrl: link, description };
            });
        });
        return Response.json({ results });
    } catch (error) {
        console.error('LinkedIn job search error:', error);
        return Response.json({ results: [] }, { status: 200 });
    }
}
