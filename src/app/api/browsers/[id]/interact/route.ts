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
        const { action, x, y, text, deltaY } = body;

        const pages = await browser.pages();
        let page = pages[0];

        if (!page) {
            page = await browser.newPage();
        }

        switch (action) {
            case 'click':
                if (x === undefined || y === undefined) {
                    return Response.json({ error: 'x and y coordinates required for click' }, { status: 400 });
                }
                await page.mouse.click(x, y);
                return Response.json({ success: true });

            case 'type':
                if (!text) {
                    return Response.json({ error: 'text required for type action' }, { status: 400 });
                }
                await page.keyboard.type(text);
                return Response.json({ success: true });

            case 'scroll':
                if (deltaY === undefined) {
                    return Response.json({ error: 'deltaY required for scroll' }, { status: 400 });
                }
                await page.evaluate((delta) => {
                    window.scrollBy(0, delta);
                }, deltaY);
                return Response.json({ success: true });

            case 'keypress':
                if (!text) {
                    return Response.json({ error: 'key required for keypress' }, { status: 400 });
                }
                await page.keyboard.press(text);
                return Response.json({ success: true });

            default:
                return Response.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Interaction error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return Response.json({ error: errorMessage }, { status: 500 });
    }
}
