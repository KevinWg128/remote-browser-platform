'use client';

import { useState, useEffect, useRef } from 'react';

interface ConsoleLog {
    type: string;
    text: string;
    timestamp: string;
}

interface ConsoleViewerProps {
    browserId: string;
}

export default function ConsoleViewer({ browserId }: ConsoleViewerProps) {
    const [logs, setLogs] = useState<ConsoleLog[]>([]);
    const [connected, setConnected] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        // Connect to SSE endpoint
        const eventSource = new EventSource(`/api/browsers/${browserId}/console`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            setConnected(true);
        };

        eventSource.onmessage = (event) => {
            try {
                const log: ConsoleLog = JSON.parse(event.data);
                setLogs(prev => [...prev.slice(-99), log]); // Keep last 100 logs
            } catch (error) {
                console.error('Failed to parse console log:', error);
            }
        };

        eventSource.onerror = () => {
            setConnected(false);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [browserId]);

    const getLogColor = (type: string) => {
        switch (type) {
            case 'error': return 'text-red-400';
            case 'warning': return 'text-yellow-400';
            case 'info': return 'text-blue-400';
            default: return 'text-green-500';
        }
    };

    return (
        <div className="bg-black text-green-500 font-mono p-5 rounded-lg h-[500px] overflow-y-auto border-2 border-neutral-800 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <div className="mb-2.5 border-b border-neutral-800 pb-2.5">
                <span className="mr-2.5">{connected ? '🟢' : '🔴'} {connected ? 'Live' : 'Disconnected'}</span>
                <span>Remote Console Connection</span>
            </div>
            <div>
                {logs.map((log, i) => (
                    <div key={i} className={`mb-1 ${getLogColor(log.type)}`}>
                        <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                        <span className="text-slate-400 uppercase text-xs">{log.type}:</span>{' '}
                        {log.text}
                    </div>
                ))}
                {logs.length === 0 && (
                    <div className="text-slate-500">Waiting for console output...</div>
                )}
                <div className="animate-[blink_1s_step-end_infinite]">_</div>
            </div>
            <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
        </div>
    );
}
