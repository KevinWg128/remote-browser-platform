import { Browser } from '@/types';
import Link from 'next/link';

interface BrowserCardProps {
    browser: Browser;
}

export default function BrowserCard({ browser }: BrowserCardProps) {
    const statusColors = {
        running: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]',
        stopped: 'bg-slate-400',
        error: 'bg-red-500',
    };

    return (
        <Link href={`/browser/${browser.id}`} className="block group">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-blue-500">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="m-0 text-lg font-semibold text-slate-100">{browser.name}</h3>
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusColors[browser.status]}`} />
                </div>
                <div className="text-slate-400 text-sm space-y-1">
                    <p>ID: {browser.id}</p>
                    {browser.pid && <p>PID: {browser.pid}</p>}
                    {browser.wsEndpoint && (
                        <p className="truncate" title={browser.wsEndpoint}>
                            WS: {browser.wsEndpoint.substring(0, 30)}...
                        </p>
                    )}
                    <p>Created: {new Date(browser.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
        </Link>
    );
}
