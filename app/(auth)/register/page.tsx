'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== passwordConfirm) {
            setError('비밀번호가 일치하지 않습니다.');
            setLoading(false);
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
        } else {
            // If email confirmation is required, inform user. Otherwise:
            router.push('/onboarding');
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-sm space-y-6 glass p-8 rounded-3xl">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">회원가입</h1>
                    <p className="text-sm text-foreground/70">가입하고 나만의 AI 플랜을 받으세요</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
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
                        <input
                            type="password"
                            placeholder="비밀번호 확인"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            required
                        />
                        {error && <p className="text-sm text-red-500 font-medium px-1">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    >
                        {loading ? '가입 중...' : '계정 만들기'}
                    </button>
                </form>

                <p className="text-sm text-foreground/70 mt-6 pt-4">
                    이미 계정이 있으신가요?{' '}
                    <Link href="/login" className="text-primary font-medium hover:underline">
                        로그인하기
                    </Link>
                </p>
            </div>
        </div>
    );
}
