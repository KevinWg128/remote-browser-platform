'use client';

import { useState, useEffect } from 'react';
import { Browser } from '@/types';
import BrowserViewer from '@/components/BrowserViewer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function BrowserDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [browser, setBrowser] = useState<Browser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch(`/api/browsers/${id}`)
            .then(res => res.json())
            .then(data => {
                setBrowser(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this browser?')) return;
        try {
            await fetch(`/api/browsers/${id}`, { method: 'DELETE' });
            router.push('/');
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const handleStop = async () => {
        try {
            await fetch(`/api/browsers/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'stopped' }),
            });
            if (browser) setBrowser({ ...browser, status: 'stopped' });
        } catch (error) {
            console.error('Failed to stop:', error);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Loading browser details...</div>;
    if (!browser) return <div className="p-10 text-center text-slate-400">Browser not found</div>;

    return (
        <main className="max-w-7xl mx-auto py-10 px-5">
            <div className="mb-5">
                <Link href="/" className="text-blue-500 inline-flex items-center gap-2 hover:text-blue-400">
                    ← Back to Dashboard
                </Link>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="m-0 text-3xl font-bold">{browser.name}</h1>
                    <div className="flex gap-4 mt-2 text-slate-400">
                        <span>ID: {browser.id}</span>
                        <span>Port: {browser.port}</span>
                        <span className={`font-semibold ${browser.status === 'running' ? 'text-green-500' : 'text-red-500'}`}>
                            {browser.status}
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleStop}
                        disabled={browser.status === 'stopped'}
                        className={`py-2.5 px-5 rounded-lg border border-slate-700 bg-transparent text-slate-100 transition-opacity ${browser.status === 'stopped' ? 'opacity-50' : 'opacity-100 hover:bg-slate-800'}`}
                    >
                        Stop
                    </button>
                    <button
                        onClick={handleDelete}
                        className="py-2.5 px-5 rounded-lg border-none bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <BrowserViewer browserId={id} />
        </main>
    );
}
