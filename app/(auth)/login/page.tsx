'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
// import { Mail } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        } else {
            router.push('/dashboard');
            router.refresh(); // Refresh layout to grab new session
        }
        setLoading(false);
    };

    const handleOAuthLogin = async (provider: 'google' | 'kakao') => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-sm space-y-6 glass p-8 rounded-3xl">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">로그인</h1>
                    <p className="text-sm text-foreground/70">AI 트레이너와 다시 연결하세요</p>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-3 text-left">
                        <input
                            type="email"
                            placeholder="이메일"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            required
                        />
                        <input
                            type="password"
                            placeholder="비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            required
                        />
                        {error && <p className="text-sm text-red-500 font-medium px-1">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center"
                    >
                        {loading ? '로그인 중...' : '이메일로 로그인'}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-foreground/50">또는</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => handleOAuthLogin('google')}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-white text-black font-semibold border border-gray-200 hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        Google로 시작하기
                    </button>
                    <button
                        onClick={() => handleOAuthLogin('kakao')}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-[#FEE500] text-black font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        카카오로 시작하기
                    </button>
                </div>

                <p className="text-sm text-foreground/70 mt-6 pt-4">
                    계정이 없으신가요?{' '}
                    <Link href="/register" className="text-primary font-medium hover:underline">
                        가입하기
                    </Link>
                </p>
            </div>
        </div>
    );
}
