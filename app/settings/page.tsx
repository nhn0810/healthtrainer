'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, LogOut, Moon, Sun, Key, Crown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    // Ensure we're mounted before rendering theme to avoid mismatch
    const [mounted, setMounted] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [code, setCode] = useState('');
    const [codeLoading, setCodeLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        async function fetchProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(data);
            setLoading(false);
        }
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setCodeLoading(true);
        setMessage(null);
        try {
            const res = await fetch('/api/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setMessage({ type: 'success', text: data.message });
            setProfile({ ...profile, is_premium: true });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setCodeLoading(false);
        }
    };

    if (!mounted || loading) return <div className="min-h-screen bg-background" />;

    return (
        <div className="flex flex-col min-h-screen p-6 max-w-md mx-auto relative bg-background">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 pt-4 sticky top-0 bg-background/80 backdrop-blur-md z-20 pb-4 border-b border-border/50">
                <Link href="/dashboard" className="p-2 bg-secondary rounded-xl hover:bg-secondary/80">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold">설정</h1>
                </div>
            </div>

            <div className="space-y-6 flex-1">
                {/* Profile Card */}
                <div className="p-6 glass rounded-3xl space-y-2 relative overflow-hidden border border-border">
                    {profile?.is_premium && (
                        <div className="absolute top-0 right-0 bg-gradient-to-br from-primary to-accent text-primary-foreground px-4 py-1.5 rounded-bl-3xl font-bold text-[10px] flex items-center gap-1 shadow-lg">
                            <Crown className="w-3 h-3" /> 무제한 플랜 활성
                        </div>
                    )}
                    <h2 className="text-lg font-bold">계정 정보</h2>
                    <p className="text-foreground/70 text-sm">{profile?.email}</p>
                    <div className="pt-4 mt-2 border-t border-border flex items-center justify-between text-sm">
                        <span className="text-foreground/70 font-medium">오늘 남은 AI 횟수</span>
                        <span className="font-bold">
                            {profile?.is_premium ? '무제한 ⚡️' : `${Math.max(0, 5 - (profile?.api_usage_count || 0))}회 / 5회`}
                        </span>
                    </div>
                    {!profile?.is_premium && (
                        <p className="text-[10px] text-primary font-bold text-right">(무료 체험: 가입 후 1주일)</p>
                    )}
                </div>

                {/* Premium Upgrade */}
                {!profile?.is_premium && (
                    <div className="p-6 bg-secondary/30 rounded-3xl border border-border space-y-4 shadow-inner">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Key className="w-5 h-5 text-primary" /> 특별 코드 입력
                        </h2>
                        <p className="text-xs text-foreground/60 leading-relaxed">
                            설정한 무료 횟수/기간 무제한 패스 코드를 입력하시면 AI 트레이너를 자유롭게 이용하실 수 있습니다.
                        </p>
                        <form onSubmit={handleVerifyCode} className="flex gap-2 relative">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="코드 입력"
                                className="flex-1 pl-4 pr-16 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
                            />
                            <button
                                type="submit"
                                disabled={codeLoading || !code}
                                className="px-4 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-[1.02] disabled:opacity-50 transition-all text-sm absolute right-1 top-1 bottom-1"
                            >
                                {codeLoading ? '확인...' : '적용'}
                            </button>
                        </form>
                        {message && (
                            <p className={`text-xs font-bold px-2 flex items-center gap-1 ${message.type === 'success' ? 'text-primary' : 'text-red-500'}`}>
                                {message.text}
                            </p>
                        )}
                    </div>
                )}

                {/* Theme Toggle */}
                <div className="p-6 glass rounded-3xl flex items-center justify-between border border-border">
                    <div>
                        <h2 className="text-sm font-bold flex items-center gap-2">
                            {theme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-yellow-500" />}
                            테마 설정
                        </h2>
                        <p className="text-xs text-foreground/50 mt-1">블랙 모드와 화이트 모드를 변경합니다.</p>
                    </div>
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${theme === 'dark'
                                ? 'bg-secondary text-foreground hover:bg-white/5'
                                : 'bg-primary text-primary-foreground shadow-md hover:scale-105'
                            }`}
                    >
                        {theme === 'dark' ? '화이트 전환' : '블랙 전환'}
                    </button>
                </div>
            </div>

            {/* Logout */}
            <div className="mt-8 mb-4">
                <button
                    onClick={handleLogout}
                    className="w-full p-4 rounded-2xl border border-border flex items-center justify-center gap-2 text-red-500/80 hover:text-red-500 hover:bg-red-500/10 font-bold transition-colors text-sm"
                >
                    <LogOut className="w-4 h-4" /> 기기에서 로그아웃
                </button>
            </div>
        </div>
    );
}
