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

    // Check if client supports WebSocket upgrade
    const upgrade = request.headers.get('upgrade');
    if (upgrade !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
    }

    try {
        const pages = await browser.pages();
        let page = pages[0];

        if (!page) {
            page = await browser.newPage();
            await page.goto('data:text/html,<h1>Remote Browser</h1><script>console.log("Ready");</script>');
        }

        // Get CDP session
        const client = await page.target().createCDPSession();

        // For Next.js, we need to use native Node.js WebSocket upgrade
        // This is a placeholder - Next.js doesn't directly support WebSocket in route handlers
        // We'll need to use the edge runtime or a custom server
        return new Response(
            'WebSocket endpoints require custom server setup. Please use /api/browsers/[id]/screenshot for now.',
            { status: 501 }
        );

    } catch (error) {
        console.error('Stream error:', error);
        return new Response('Failed to setup stream', { status: 500 });
    }
}
