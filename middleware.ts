import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options });
                    supabaseResponse = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    supabaseResponse.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options });
                    supabaseResponse = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    supabaseResponse.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    // Refresh context
    const { data: { user } } = await supabase.auth.getUser();

    const hasGateCookie = request.cookies.has('edge_gate_passed');
    const url = request.nextUrl.clone();
    const isPwa = url.searchParams.get('source') === 'pwa';

    // Ignore static files, api, _next
    if (
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/api') ||
        url.pathname.includes('.') ||
        url.pathname.startsWith('/auth/callback')
    ) {
        return supabaseResponse;
    }

    const isAuthPage = url.pathname === '/login' || url.pathname === '/gate' || url.pathname === '/';

    // If logged in and trying to access an auth page (like / or /login), redirect to dashboard
    if (user && isAuthPage) {
        url.pathname = '/dashboard';
        const redirectRes = NextResponse.redirect(url);
        // Copy over any cookies created by auth refresh
        supabaseResponse.cookies.getAll().forEach(c => {
            redirectRes.cookies.set(c.name, c.value, c);
        });
        return redirectRes;
    }

    // Require authentication for protected routes
    if (!user && !isAuthPage) {
        url.pathname = '/login';
        const redirectRes = NextResponse.redirect(url);
        supabaseResponse.cookies.getAll().forEach(c => {
            redirectRes.cookies.set(c.name, c.value, c);
        });
        return redirectRes;
    }

    // PWA & Gate Cookie Renewal
    if (isPwa || hasGateCookie) {
        if (!hasGateCookie && url.pathname !== '/login') {
            url.pathname = '/login';
            const redirectRes = NextResponse.redirect(url);
            redirectRes.cookies.set('edge_gate_passed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 30 });
            return redirectRes;
        }
        supabaseResponse.cookies.set('edge_gate_passed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 30 });
        return supabaseResponse;
    }

    if (url.pathname === '/gate') {
        return supabaseResponse;
    }

    url.pathname = '/gate';
    return NextResponse.redirect(url);
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
