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
    const [planDoc, setPlanDoc] = useState<any>(null);
    const [fullPlan, setFullPlan] = useState<any>(null);
    const [dailyProgress, setDailyProgress] = useState<any>(null);
    const [progress, setProgress] = useState(0); // 0 to 100
    const [currentWeight, setCurrentWeight] = useState(0);
    const [evalCalories, setEvalCalories] = useState('');
    const [evalNote, setEvalNote] = useState('');
    const [evalLoading, setEvalLoading] = useState(false);
    const [briefingWeight, setBriefingWeight] = useState('');
    const [briefingLoading, setBriefingLoading] = useState(false);
    const [isPlanExpired, setIsPlanExpired] = useState(false);
    const supabase = createClient();
    const router = useRouter(); // Import useRouter at the top of the file

    useEffect(() => {
        async function loadDashboardData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const todayString = new Date().toISOString().split('T')[0];

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

            if (planData) {
                setPlanDoc(planData);
                const isOver = planData.end_date && new Date(planData.end_date) <= new Date(todayString) && !planData.is_completed;
                if (isOver) setIsPlanExpired(true);

                if (planData.plan_data?.workoutRoutines) {
                    // Find today's plan (simplistic: getting the first day or matching actual weekday)
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const todayName = days[new Date().getDay()];

                    const routineToday = planData.plan_data.workoutRoutines.find(
                        (r: any) => r.day === todayName || r.day.includes(todayName.slice(0, 3))
                    );

                    // Fallback to first day if no exact match
                    setTodayPlan(routineToday || planData.plan_data.workoutRoutines[0]);
                    setFullPlan(planData.plan_data);
                }
            }

            // Fetch Daily Progress
            const { data: progressData } = await supabase
                .from('daily_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', todayString)
                .single();

            if (progressData) {
                setProgress(progressData.progress_rate || 0);
                setDailyProgress(progressData);
            } else {
                // Create initial progress record for today
                const { data: newProgress } = await supabase.from('daily_progress').insert({
                    user_id: user.id,
                    date: todayString,
                    progress_rate: 0
                }).select().single();
                if (newProgress) setDailyProgress(newProgress);
            }

            setLoading(false);
        }

        loadDashboardData();
    }, []);

    const submitDietEvaluation = async () => {
        if (!evalCalories) return;
        setEvalLoading(true);

        try {
            const res = await fetch('/api/diet-evaluation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    consumedCalories: evalCalories,
                    userNote: evalNote,
                    targetCalories: fullPlan?.dailyCaloriesTarget || 2000
                })
            });
            const data = await res.json();
            if (data.success) {
                setDailyProgress((prev: any) => ({ ...prev, diet_evaluation: data.evaluation, daily_calories: evalCalories }));
            }
        } catch (error) {
            console.error(error);
        }
        setEvalLoading(false);
    };

    const submitBiweeklyBriefing = async () => {
        if (!briefingWeight) return;
        setBriefingLoading(true);

        try {
            const res = await fetch('/api/biweekly-briefing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentWeight: briefingWeight, planId: planDoc.id })
            });
            const data = await res.json();
            if (data.success) {
                alert(`[2주간의 성과 요약]\n\n${data.briefing}\n\n새로운 2주 플랜이 성공적으로 발급되었습니다!`);
                window.location.reload();
            } else {
                alert(data.error || '에러가 발생했습니다.');
            }
        } catch (error) {
            console.error(error);
        }
        setBriefingLoading(false);
    };

    // Calculate SVG stroke offset for the circle
    const circumference = 2 * Math.PI * 84; // r=84
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    if (isPlanExpired) {
        return (
            <div className="flex flex-col min-h-screen p-6 pt-12 items-center justify-center max-w-md mx-auto text-center space-y-6">
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-4xl mb-4 shadow-[0_0_30px_rgba(0,123,255,0.4)]">
                    🎉
                </div>
                <h1 className="text-2xl font-bold">2주 플랜 종료!</h1>
                <p className="text-foreground/70">
                    수고하셨습니다! 지난 2주 동안의 식습관과 운동 기록을 종합하여 평가를 진행합니다.
                </p>

                <div className="w-full glass p-6 rounded-3xl mt-4 space-y-4">
                    <label className="block text-sm font-bold text-left">현재 몸무게를 입력해주세요</label>
                    <input
                        type="number"
                        placeholder="예: 70"
                        value={briefingWeight}
                        onChange={(e) => setBriefingWeight(e.target.value)}
                        className="w-full px-4 py-3 text-lg font-bold rounded-xl border border-white/10 bg-background/50 focus:border-primary text-center"
                    />
                    <button
                        onClick={submitBiweeklyBriefing}
                        disabled={briefingLoading || !briefingWeight}
                        className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg mt-4"
                    >
                        {briefingLoading ? 'AI가 2주 결과 분석 및 다음 플랜 수립 중...' : '결과 브리핑 및 다음 2주 플랜 발급받기'}
                    </button>
                    {briefingLoading && <p className="text-xs text-primary/70 mt-2 animate-pulse">평균 10~15초 소요됩니다.</p>}
                </div>
            </div>
        );
    }

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

                <div className="w-48 h-48 flex flex-col items-center justify-center relative z-10">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 192 192">
                        <circle
                            cx="96" cy="96" r="84"
                            className="stroke-primary/10"
                            strokeWidth="12"
                            fill="transparent"
                        />
                    </svg>
                    <motion.svg
                        className="absolute inset-0 w-full h-full -rotate-90"
                        viewBox="0 0 192 192"
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

            {/* Custom Diet Recommendation Preview */}
            <div className="space-y-4 flex-1">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="text-lg font-bold">사용자 맞춤 식단 추천</h3>
                </div>

                {loading ? (
                    <div className="h-24 rounded-2xl bg-secondary animate-pulse" />
                ) : fullPlan ? (
                    <div className="space-y-3">
                        <Link href="/diet" className="block p-5 rounded-2xl bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold">오늘의 식단 목표</h4>
                                <span className="text-primary font-bold">{fullPlan.dailyCaloriesTarget || 2000} kcal</span>
                            </div>
                            <div className="flex justify-between text-sm text-foreground/70">
                                <span>단백질: {fullPlan.macros?.protein_g || 0}g</span>
                                <span>탄수화물: {fullPlan.macros?.carbs_g || 0}g</span>
                                <span>지방: {fullPlan.macros?.fat_g || 0}g</span>
                            </div>
                        </Link>

                        {/* Evening Diet Evaluation */}
                        {dailyProgress && !dailyProgress.diet_evaluation ? (
                            <div className="p-5 rounded-2xl bg-secondary/30 border border-white/5 space-y-3 mt-4">
                                <h4 className="font-bold text-sm">🌙 오늘의 식습관 저녁 평가</h4>
                                <p className="text-xs text-foreground/60">오늘 총 섭취한 칼로리를 입력하면 AI가 평가합니다.</p>
                                <input
                                    type="number"
                                    placeholder="총 섭취 칼로리 (예: 1800)"
                                    value={evalCalories}
                                    onChange={(e) => setEvalCalories(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-white/10 bg-background/50 text-sm focus:border-primary transition-colors"
                                />
                                <input
                                    type="text"
                                    placeholder="특이사항 메모 (옵션)"
                                    value={evalNote}
                                    onChange={(e) => setEvalNote(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-white/10 bg-background/50 text-sm focus:border-primary transition-colors"
                                />
                                <button
                                    onClick={submitDietEvaluation}
                                    disabled={evalLoading || !evalCalories}
                                    className="w-full py-2 bg-primary text-primary-foreground font-bold rounded-xl text-sm"
                                >
                                    {evalLoading ? '평가 중...' : '평가 받기'}
                                </button>
                            </div>
                        ) : dailyProgress?.diet_evaluation ? (
                            <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 space-y-2 mt-4 mt-4">
                                <h4 className="font-bold text-sm text-primary">✨ 오늘의 식습관 평가 완료</h4>
                                <div className="text-sm text-foreground/80 leading-relaxed font-medium">
                                    {dailyProgress.diet_evaluation}
                                </div>
                            </div>
                        ) : null}
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
