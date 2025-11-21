import { NextResponse } from 'next/server';
import { browserService } from '@/lib/browser-service';

export async function GET() {
    try {
        const browsers = browserService.getBrowsers();
        return NextResponse.json(browsers);
    } catch (error) {
        console.error('Error fetching browsers:', error);
        return NextResponse.json({ error: 'Failed to fetch browsers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const name = body.name || 'New Browser';
        const browser = await browserService.launchBrowser(name);
        return NextResponse.json(browser);
    } catch (error) {
        console.error('Error creating browser:', error);
        return NextResponse.json({ error: 'Failed to create browser' }, { status: 500 });
    }
}

