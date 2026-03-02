import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const hasGateCookie = request.cookies.has('edge_gate_passed');
    const url = request.nextUrl.clone();

    // Ignore static files, api, _next
    if (
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/api') ||
        url.pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Allow the gate page itself and the home screen
    if (url.pathname === '/gate' || url.pathname === '/') {
        return NextResponse.next();
    }

    // If attempting to access the app logic (including auth pages) without passing gate, redirect to gate
    if (!hasGateCookie) {
        url.pathname = '/gate';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
