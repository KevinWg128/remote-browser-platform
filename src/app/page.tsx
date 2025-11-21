'use client';

import { useState, useEffect } from 'react';
import { Browser } from '@/types';
import BrowserList from '@/components/BrowserList';

export default function Home() {
  const [browsers, setBrowsers] = useState<Browser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBrowsers();
  }, []);

  const fetchBrowsers = async () => {
    try {
      const res = await fetch('/api/browsers');
      const data = await res.json();
      setBrowsers(data);
    } catch (error) {
      console.error('Failed to fetch browsers:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBrowser = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/browsers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Browser ${browsers.length + 1}` }),
      });
      const newBrowser = await res.json();
      setBrowsers([...browsers, newBrowser]);
    } catch (error) {
      console.error('Failed to create browser:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto py-10 px-5">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="m-0 text-4xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Remote Browser Platform
          </h1>
          <p className="text-slate-400 mt-2">Manage your remote browser instances</p>
        </div>
        <button
          onClick={createBrowser}
          disabled={creating}
          className={`bg-blue-500 text-white border-none py-3 px-6 rounded-lg text-base font-semibold transition-colors duration-200 hover:bg-blue-600 ${creating ? 'opacity-70' : 'opacity-100'}`}
        >
          {creating ? 'Creating...' : '+ New Browser'}
        </button>
      </div>

      {loading ? (
        <div className="text-center p-10 text-slate-400">Loading...</div>
      ) : (
        <BrowserList browsers={browsers} />
      )}
    </main>
  );
}
