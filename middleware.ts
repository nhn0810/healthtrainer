import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const hasGateCookie = request.cookies.has('edge_gate_passed');
    const url = request.nextUrl.clone();
    const isPwa = url.searchParams.get('source') === 'pwa';

    // Ignore static files, api, _next
    if (
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/api') ||
        url.pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // If PWA, automatically grant gate access and send to login
    if (isPwa && !hasGateCookie) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.set('edge_gate_passed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 30 });
        return response;
    }

    // Allow the gate page itself
    if (url.pathname === '/gate') {
        return NextResponse.next();
    }

    // If attempting to access anything else without passing gate, redirect to gate
    if (!hasGateCookie) {
        url.pathname = '/gate';
        return NextResponse.redirect(url);
    }

    // Instead of just passing, update the cookie to renew the 30-day session
    // We clone the response to allow setting cookies
    const response = NextResponse.next();
    response.cookies.set('edge_gate_passed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 30 });
    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
