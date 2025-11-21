import { NextRequest } from 'next/server';
import { browserService } from '@/lib/browser-service';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const browser = browserService.getBrowserInstance(id);
    if (!browser) {
        return new Response('Browser not found', { status: 404 });
    }

    try {
        const pages = await browser.pages();
        let page = pages[0];

        if (!page) {
            page = await browser.newPage();
        }

        // Capture screenshot
        const screenshot = await page.screenshot({
            type: 'png',
            encoding: 'binary',
        });

        return new Response(screenshot as Buffer, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Screenshot error:', error);
        return new Response('Failed to capture screenshot', { status: 500 });
    }
}
