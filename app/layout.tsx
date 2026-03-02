import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import EdgeSidebar from '@/components/layout/EdgeSidebar';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'AI Edge Coach',
    description: 'AI-based personal training and diet management',
    manifest: '/manifest.json',
    themeColor: '#000000',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'AI Edge Coach',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko" className="dark" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
                    <EdgeSidebar />
                    <main className="min-h-screen">
                        {children}
                    </main>
                </ThemeProvider>
            </body>
        </html>
    );
}
