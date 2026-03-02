'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GatePage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    // Prevent prompt globally for the gate page
    useEffect(() => {
        const preventInstall = (e: any) => {
            e.preventDefault();
        };
        window.addEventListener('beforeinstallprompt', preventInstall);
        return () => window.removeEventListener('beforeinstallprompt', preventInstall);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'healthtrainer1928') {
            // Set cookie for 30 days to persist access across OAuth redirects and PWA closing
            document.cookie = "edge_gate_passed=true; path=/; max-age=" + 60 * 60 * 24 * 30 + "; SameSite=Lax";
            router.push('/login');
        } else {
            setError('비밀번호가 일치하지 않습니다.');
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-sm space-y-8 glass p-8 rounded-3xl">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter">AI Edge Coach</h1>
                    <p className="text-sm text-foreground/70">관리자 비밀번호를 입력해주세요.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <input
                            type="password"
                            placeholder="비밀번호 입력"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        />
                        {error && <p className="text-sm text-red-500 font-medium text-left px-1">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    >
                        입장하기
                    </button>
                </form>
            </div>
        </div>
    );
}
