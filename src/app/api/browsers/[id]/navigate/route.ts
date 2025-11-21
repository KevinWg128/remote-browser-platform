import { NextRequest } from 'next/server';
import { browserService } from '@/lib/browser-service';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const browser = browserService.getBrowserInstance(id);
    if (!browser) {
        return new Response('Browser not found', { status: 404 });
    }

    try {
        const body = await request.json();
        const { action, url } = body;

        const pages = await browser.pages();
        let page = pages[0];

        if (!page) {
            page = await browser.newPage();
        }

        switch (action) {
            case 'goto':
                if (!url) {
                    return Response.json({ error: 'URL required for goto action' }, { status: 400 });
                }
                // Add protocol if missing
                const targetUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
                await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 10000 });
                return Response.json({ success: true, url: page.url() });

            case 'back':
                await page.goBack({ waitUntil: 'networkidle0', timeout: 10000 });
                return Response.json({ success: true, url: page.url() });

            case 'forward':
                await page.goForward({ waitUntil: 'networkidle0', timeout: 10000 });
                return Response.json({ success: true, url: page.url() });

            case 'refresh':
                await page.reload({ waitUntil: 'networkidle0', timeout: 10000 });
                return Response.json({ success: true, url: page.url() });

            default:
                return Response.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Navigation error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return Response.json({ error: errorMessage }, { status: 500 });
    }
}
