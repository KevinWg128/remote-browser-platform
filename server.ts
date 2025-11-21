import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { browserService } from './src/lib/browser-service';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    // Create WebSocket server
    const wss = new WebSocketServer({ noServer: true });

    wss.on('connection', async (ws, req) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const pathParts = url.pathname.split('/');
        const browserId = pathParts[pathParts.length - 1];

        console.log(`[WebSocket] Connection request for browser: ${browserId}`);
        console.log(`[WebSocket] BrowserService instance: ${Object.keys(browserService).length} methods`);
        console.log(`[WebSocket] Available browsers:`, browserService.getBrowsers().map(b => b.id));

        const browser = browserService.getBrowserInstance(browserId);
        if (!browser) {
            console.error(`[WebSocket] Browser not found: ${browserId}`);
            const errorMessage = JSON.stringify({
                type: 'error',
                message: `Browser not found: ${browserId}. It may have been closed or the server was restarted.`
            });

            // Try to send error before closing
            if (ws.readyState === ws.OPEN) {
                ws.send(errorMessage);
            }

            // Wait a moment to ensure message is sent before closing
            setTimeout(() => ws.close(), 100);
            return;
        }

        console.log(`[WebSocket] Browser found, setting up screencast...`);

        try {
            const pages = await browser.pages();
            let page = pages[0];

            if (!page) {
                page = await browser.newPage();
            }

            // Set viewport size
            await page.setViewport({ width: 1280, height: 720 });

            // Get CDP session
            const client = await page.target().createCDPSession();

            // Start screencast
            await client.send('Page.startScreencast', {
                format: 'jpeg',
                quality: 80,
                maxWidth: 1280,
                maxHeight: 720,
            });

            // Handle screencast frames
            client.on('Page.screencastFrame', async (frame: any) => {
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'frame',
                        data: frame.data,
                        metadata: frame.metadata,
                    }));
                }

                // Acknowledge frame
                await client.send('Page.screencastFrameAck', {
                    sessionId: frame.sessionId,
                });
            });

            // Send current URL
            ws.send(JSON.stringify({
                type: 'url',
                url: page.url(),
            }));

            // Handle messages from client
            ws.on('message', async (message: Buffer) => {
                try {
                    const data = JSON.parse(message.toString());

                    switch (data.type) {
                        case 'navigate':
                            const targetUrl = data.url.match(/^https?:\/\//) ? data.url : `https://${data.url}`;
                            await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 10000 });
                            ws.send(JSON.stringify({ type: 'url', url: page.url() }));
                            break;

                        case 'back':
                            await page.goBack({ waitUntil: 'networkidle0', timeout: 10000 });
                            ws.send(JSON.stringify({ type: 'url', url: page.url() }));
                            break;

                        case 'forward':
                            await page.goForward({ waitUntil: 'networkidle0', timeout: 10000 });
                            ws.send(JSON.stringify({ type: 'url', url: page.url() }));
                            break;

                        case 'refresh':
                            await page.reload({ waitUntil: 'networkidle0', timeout: 10000 });
                            break;

                        case 'click':
                            await page.mouse.click(data.x, data.y);
                            break;

                        case 'scroll':
                            await page.evaluate((delta: number) => {
                                window.scrollBy(0, delta);
                            }, data.deltaY);
                            break;

                        case 'type':
                            await page.keyboard.type(data.text);
                            break;

                        case 'keypress':
                            await page.keyboard.press(data.key);
                            break;
                    }
                } catch (error) {
                    console.error('Error handling message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: error instanceof Error ? error.message : String(error),
                    }));
                }
            });

            ws.on('close', async () => {
                console.log(`WebSocket closed for browser: ${browserId}`);
                try {
                    await client.send('Page.stopScreencast');
                    await client.detach();
                } catch (error) {
                    console.error('Error stopping screencast:', error);
                }
            });

        } catch (error) {
            console.error('Error setting up screencast:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: error instanceof Error ? error.message : String(error),
            }));
            ws.close();
        }
    });

    // Handle WebSocket upgrade
    server.on('upgrade', (req, socket, head) => {
        const { pathname } = parse(req.url!);

        if (pathname?.startsWith('/ws/browsers/')) {
            // Handle our custom browser WebSocket connections
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req);
            });
        } else if (pathname?.startsWith('/_next/webpack-hmr')) {
            // Allow Next.js HMR WebSocket connections in development
            // Next.js will handle this internally
        } else {
            socket.destroy();
        }
    });

    server.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> WebSocket server ready on ws://${hostname}:${port}/ws/browsers/{id}`);
    });
});
