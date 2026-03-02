'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, ChevronRight, Play } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [todayPlan, setTodayPlan] = useState<any>(null);
    const [progress, setProgress] = useState(0); // 0 to 100
    const [currentWeight, setCurrentWeight] = useState(0);
    const supabase = createClient();
    const router = useRouter(); // Import useRouter at the top of the file

    useEffect(() => {
        async function loadDashboardData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            // Redirect to onboarding if profile isn't set up yet
            if (!profileData || !profileData.height) {
                window.location.href = '/onboarding';
                return;
            }

            setProfile(profileData);

            // Fetch Latest Weight
            const { data: weightData } = await supabase
                .from('weight_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            setCurrentWeight(weightData?.weight || 0);

            // Fetch Latest Workout Plan
            const { data: planData } = await supabase
                .from('workout_plans')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (planData && planData.plan_data?.workoutRoutines) {
                // Find today's plan (simplistic: getting the first day or matching actual weekday)
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const todayName = days[new Date().getDay()];

                const routineToday = planData.plan_data.workoutRoutines.find(
                    (r: any) => r.day === todayName || r.day.includes(todayName.slice(0, 3))
                );

                // Fallback to first day if no exact match
                setTodayPlan(routineToday || planData.plan_data.workoutRoutines[0]);
            }

            // Fetch Daily Progress
            const todayString = new Date().toISOString().split('T')[0];
            const { data: progressData } = await supabase
                .from('daily_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', todayString)
                .single();

            if (progressData) {
                setProgress(progressData.progress_rate || 0);
            } else {
                // Create initial progress record for today
                await supabase.from('daily_progress').insert({
                    user_id: user.id,
                    date: todayString,
                    progress_rate: 0
                });
            }

            setLoading(false);
        }

        loadDashboardData();
    }, []);

    // Calculate SVG stroke offset for the circle
    const circumference = 2 * Math.PI * 84; // r=84
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col min-h-screen p-6 pt-12 pb-24 max-w-md mx-auto relative">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">오운완 대시보드</h1>
                    {profile && currentWeight > 0 && (
                        <p className="text-sm text-foreground/70 mt-1">
                            목표까지 <span className="font-bold text-primary">{Math.abs(profile.target_weight - currentWeight).toFixed(1)}kg</span> 남았어요!
                        </p>
                    )}
                </div>
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <span className="font-bold text-sm">AI</span>
                </div>
            </div>

            {/* Circular Progress Component */}
            <div className="flex flex-col items-center justify-center p-8 glass rounded-3xl w-full shadow-2xl mb-8 relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 blur-3xl rounded-full" />

                <div className="w-48 h-48 rounded-full border-[12px] border-primary/10 flex flex-col items-center justify-center relative z-10">
                    <motion.svg
                        className="absolute inset-0 w-full h-full -rotate-90"
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    >
                        <circle
                            cx="96" cy="96" r="84"
                            stroke="var(--primary)"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeLinecap="round"
                        />
                    </motion.svg>
                    <span className="text-4xl font-extrabold text-primary pt-2">{progress}%</span>
                    <span className="text-sm font-medium text-foreground/70 mt-1">오늘의 달성률</span>
                </div>

                <div className="mt-8 text-center space-y-1 z-10">
                    <h2 className="text-xl font-bold">{progress === 100 ? '오운완 달성! 🎉' : '오늘의 운동을 시작하세요'}</h2>
                    <p className="text-foreground/70 text-sm">
                        {todayPlan ? todayPlan.focus : 'AI가 플랜을 준비중입니다.'}
                    </p>
                </div>
            </div>

            {/* Today's Workout Routine Preview */}
            <div className="space-y-4 flex-1">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="text-lg font-bold">오늘의 추천 프로그램</h3>
                </div>

                {loading ? (
                    <div className="h-24 rounded-2xl bg-secondary animate-pulse" />
                ) : todayPlan ? (
                    <div className="space-y-3">
                        {todayPlan.exercises.slice(0, 3).map((ex: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm">
                                        <span className="text-primary font-bold">{idx + 1}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold">{ex.name}</h4>
                                        <p className="text-xs text-foreground/60">{ex.sets}세트 × {ex.reps}</p>
                                    </div>
                                </div>
                                <div className="w-6 h-6 rounded-full border-2 border-border" />
                            </div>
                        ))}
                        {todayPlan.exercises.length > 3 && (
                            <p className="text-center text-xs text-foreground/50 py-2">외 {todayPlan.exercises.length - 3}종목</p>
                        )}
                    </div>
                ) : (
                    <div className="p-8 text-center rounded-2xl glass border border-white/5">
                        <p className="text-sm text-foreground/70">아직 생성된 플랜이 없습니다.</p>
                        <Link href="/onboarding" className="text-primary text-sm font-bold mt-2 inline-block">
                            온보딩 다시하기
                        </Link>
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="fixed bottom-6 left-6 right-6 mx-auto max-w-[380px] z-30 flex justify-center w-auto"
            >
                <Link
                    href="/workout"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-[0_8px_30px_rgb(0,123,255,0.4)] hover:scale-105 active:scale-95 transition-transform"
                >
                    <Play className="w-5 h-5 fill-current" />
                    운동 시작하기
                </Link>
            </motion.div>
        </div>
    );
}
