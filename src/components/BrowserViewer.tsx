'use client';

import { useState, useEffect, useRef } from 'react';

interface BrowserViewerProps {
    browserId: string;
}

export default function BrowserViewer({ browserId }: BrowserViewerProps) {
    const [url, setUrl] = useState('');
    const [currentUrl, setCurrentUrl] = useState('about:blank');
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Connect to WebSocket
        const wsUrl = `ws://localhost:3000/ws/browsers/${browserId}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connected');
            setConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                switch (message.type) {
                    case 'frame':
                        // Render frame to canvas
                        if (canvasRef.current) {
                            const ctx = canvasRef.current.getContext('2d');
                            if (ctx) {
                                const img = new Image();
                                img.onload = () => {
                                    const canvas = canvasRef.current!;
                                    canvas.width = message.metadata.deviceWidth || 1280;
                                    canvas.height = message.metadata.deviceHeight || 720;
                                    ctx.drawImage(img, 0, 0);
                                };
                                img.src = 'data:image/jpeg;base64,' + message.data;
                            }
                        }
                        break;

                    case 'url':
                        setCurrentUrl(message.url);
                        break;

                    case 'error':
                        console.error('WebSocket error:', message.message);
                        break;
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setConnected(false);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setConnected(false);
        };

        return () => {
            ws.close();
        };
    }, [browserId]);

    const sendMessage = (message: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    };

    const handleNavigate = (action: string, targetUrl?: string) => {
        setLoading(true);
        sendMessage({ type: action, url: targetUrl });
        setTimeout(() => setLoading(false), 2000);
    };

    const handleGoToUrl = () => {
        if (url) {
            handleNavigate('navigate', url);
        }
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        sendMessage({ type: 'click', x, y });
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        sendMessage({ type: 'scroll', deltaY: e.deltaY });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Prevent default behavior for most keys except browser shortcuts
        if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
        }

        // Send the key to the remote browser
        if (e.key.length === 1) {
            // Regular character keys
            sendMessage({ type: 'type', text: e.key });
        } else {
            // Special keys (Enter, Backspace, Tab, etc.)
            sendMessage({ type: 'keypress', key: e.key });
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-sm">
                <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-slate-400">{connected ? 'Connected' : 'Disconnected'}</span>
            </div>

            {/* Navigation Controls */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => sendMessage({ type: 'back' })}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded border border-slate-600 transition-colors"
                        disabled={loading || !connected}
                    >
                        ←
                    </button>
                    <button
                        onClick={() => sendMessage({ type: 'forward' })}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded border border-slate-600 transition-colors"
                        disabled={loading || !connected}
                    >
                        →
                    </button>
                    <button
                        onClick={() => sendMessage({ type: 'refresh' })}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded border border-slate-600 transition-colors"
                        disabled={loading || !connected}
                    >
                        ⟳
                    </button>

                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGoToUrl()}
                        placeholder={currentUrl}
                        className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 focus:outline-none focus:border-blue-500"
                        disabled={loading || !connected}
                    />

                    <button
                        onClick={handleGoToUrl}
                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white font-semibold transition-colors disabled:opacity-50"
                        disabled={loading || !url || !connected}
                    >
                        Go
                    </button>
                </div>

                <div className="mt-2 text-sm text-slate-400">
                    Current: {currentUrl}
                </div>
            </div>

            {/* Browser Viewport */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <div className="relative bg-white">
                    <canvas
                        ref={canvasRef}
                        onClick={handleClick}
                        onWheel={handleWheel}
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                        className="w-full h-auto block cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ maxWidth: '100%', height: 'auto' }}
                    />
                    {!connected && (
                        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                            <div className="text-white text-lg">Connecting to browser...</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="text-xs text-slate-500 text-center">
                Click to interact • Scroll to navigate • Click canvas and type to enter text • Real-time streaming via WebSocket
            </div>
        </div>
    );
}
