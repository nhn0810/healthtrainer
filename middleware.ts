import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    // This explicitly sets persistent cookies to prevent app from logging out
                    request.cookies.set({ name, value, ...options, maxAge: 60 * 60 * 24 * 365, path: '/' })
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    })
                    response.cookies.set({ name, value, ...options, maxAge: 60 * 60 * 24 * 365, path: '/' })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // IMPORTANT: This triggers token refresh implicitly if needed properly extending Google session!
    await supabase.auth.getUser()

    const hasGateCookie = request.cookies.has('edge_gate_passed');
    const url = request.nextUrl.clone();
    const isPwa = url.searchParams.get('source') === 'pwa';

    // Ignore static files, api, _next
    if (
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/api') ||
        url.pathname.includes('.')
    ) {
        return response;
    }

    // If PWA or gate passed, continuously renew the gate cookie
    if (isPwa || hasGateCookie) {
        if (!hasGateCookie && url.pathname !== '/login') {
            url.pathname = '/login';
            response = NextResponse.redirect(url);
        }
        response.cookies.set('edge_gate_passed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 30 });
        return response;
    }

    // Allow the gate page itself
    if (url.pathname === '/gate') {
        return response;
    }

    // Redirect to gate
    url.pathname = '/gate';
    return NextResponse.redirect(url);
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
