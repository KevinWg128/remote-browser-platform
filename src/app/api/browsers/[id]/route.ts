import { NextResponse } from 'next/server';
import { browserService } from '@/lib/browser-service';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const browser = browserService.getBrowserById(id);

    if (!browser) {
        return NextResponse.json({ error: 'Browser not found' }, { status: 404 });
    }

    return NextResponse.json(browser);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const success = await browserService.closeBrowser(id);

    if (!success) {
        return NextResponse.json({ error: 'Browser not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}

