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

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Get or create a page to monitor
                const pages = await browser.pages();
                let page = pages[0];

                if (!page) {
                    page = await browser.newPage();
                }

                // Listen to console events
                page.on('console', (msg) => {
                    const logEntry = {
                        type: msg.type(),
                        text: msg.text(),
                        timestamp: new Date().toISOString(),
                    };

                    const data = `data: ${JSON.stringify(logEntry)}\n\n`;
                    controller.enqueue(encoder.encode(data));
                });

                // Listen to page errors
                page.on('pageerror', (error) => {
                    const logEntry = {
                        type: 'error',
                        text: error.message,
                        timestamp: new Date().toISOString(),
                    };

                    const data = `data: ${JSON.stringify(logEntry)}\n\n`;
                    controller.enqueue(encoder.encode(data));
                });

                // Send initial connection message
                const connectMsg = {
                    type: 'info',
                    text: 'Console viewer connected',
                    timestamp: new Date().toISOString(),
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectMsg)}\n\n`));

                // Navigate to a blank page to start
                if (page.url() === 'about:blank') {
                    await page.goto('data:text/html,<h1>Remote Browser Console</h1><script>console.log("Browser ready");</script>');
                }

                // Keep connection alive with heartbeat
                const heartbeat = setInterval(() => {
                    try {
                        controller.enqueue(encoder.encode(': heartbeat\n\n'));
                    } catch (error) {
                        clearInterval(heartbeat);
                    }
                }, 30000);

                // Handle client disconnect
                request.signal.addEventListener('abort', () => {
                    clearInterval(heartbeat);
                    controller.close();
                });

            } catch (error) {
                console.error('Console stream error:', error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                controller.error(new Error(errorMessage));
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
