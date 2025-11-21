import { Browser } from '@/types';
import BrowserCard from './BrowserCard';

interface BrowserListProps {
    browsers: Browser[];
}

export default function BrowserList({ browsers }: BrowserListProps) {
    if (browsers.length === 0) {
        return (
            <div className="text-center p-10 text-slate-400">
                <p>No browsers found. Create one to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6 mt-6">
            {browsers.map((browser) => (
                <BrowserCard key={browser.id} browser={browser} />
            ))}
        </div>
    );
}
