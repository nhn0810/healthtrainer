'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, Info, Check, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function WorkoutPage() {
    const [loading, setLoading] = useState(true);
    const [todayPlan, setTodayPlan] = useState<any>(null);
    const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
    const [progressId, setProgressId] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function loadWorkout() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Today's Plan
            const { data: planData } = await supabase
                .from('workout_plans')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (planData && planData.plan_data?.workoutRoutines) {
                setTodayPlan(planData.plan_data.workoutRoutines[0]); // Simplifying for prototype
            }

            // 2. Fetch or Init Daily Progress
            const todayString = new Date().toISOString().split('T')[0];
            const { data: progressData } = await supabase
                .from('daily_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', todayString)
                .single();

            if (progressData) {
                setProgressId(progressData.id);
                // Optional: restore completed sets if saved in DB. 
                // For now, tracking in memory/state during the session.
            }
            setLoading(false);
        }
        loadWorkout();
    }, []);

    const totalSets = todayPlan?.exercises?.reduce((acc: number, ex: any) => acc + (ex.sets || 0), 0) || 0;
    const currentCompletedCount = Object.keys(completedSets).length;
    const progressRate = totalSets > 0 ? Math.round((currentCompletedCount / totalSets) * 100) : 0;

    const handleSetComplete = async (exerciseIdx: number, setIdx: number) => {
        const key = `${exerciseIdx}-${setIdx}`;

        // Block undo: if already completed, do nothing!
        if (completedSets[key]) return;

        setCompletedSets(prev => ({
            ...prev,
            [key]: true
        }));

        // Optimistically calculate new progress and push to DB
        if (progressId) {
            const newCompletedCount = currentCompletedCount + 1;
            const newRate = totalSets > 0 ? Math.round((newCompletedCount / totalSets) * 100) : 0;

            await supabase
                .from('daily_progress')
                .update({
                    progress_rate: newRate,
                    workout_completed: newRate >= 100
                })
                .eq('id', progressId);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="flex flex-col min-h-screen p-6 pb-24 max-w-md mx-auto relative bg-background">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 pt-4 sticky top-0 bg-background/80 backdrop-blur-md z-20 pb-4">
                <Link href="/dashboard" className="p-2 bg-secondary rounded-xl hover:bg-secondary/80">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold">오운완 모드</h1>
                    <p className="text-xs text-primary font-bold">진척도 {progressRate}%</p>
                </div>
            </div>

            {progressRate === 100 && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-6 mb-8 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground flex flex-col items-center justify-center shadow-lg"
                >
                    <Trophy className="w-12 h-12 mb-2" />
                    <h2 className="text-xl font-bold">오늘의 운동 완료!</h2>
                    <p className="text-sm opacity-90 mt-1">완벽한 하루를 만들었어요. 대시보드에서 자랑해보세요.</p>
                </motion.div>
            )}

            {/* Routine Tracker */}
            <div className="space-y-6">
                {todayPlan?.exercises?.map((ex: any, eIdx: number) => (
                    <div key={eIdx} className="glass rounded-3xl p-5 border border-white/5 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-bold">{ex.name}</h3>
                                <p className="text-sm text-foreground/60 mt-1">{ex.reps}회 씩 · 총 {ex.sets}세트</p>
                            </div>
                            {ex.notes && (
                                <button className="p-2 bg-primary/10 rounded-full text-primary">
                                    <Info className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {ex.notes && (
                            <div className="p-3 bg-secondary/50 rounded-xl text-xs text-foreground/80 leading-relaxed border-l-2 border-primary">
                                {ex.notes}
                            </div>
                        )}

                        <div className="grid grid-cols-4 gap-2 pt-2">
                            {Array.from({ length: ex.sets || 0 }).map((_, sIdx) => {
                                const key = `${eIdx}-${sIdx}`;
                                const isDone = !!completedSets[key];

                                return (
                                    <motion.button
                                        key={sIdx}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleSetComplete(eIdx, sIdx)}
                                        className={`h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${isDone
                                            ? 'bg-primary text-primary-foreground border-transparent'
                                            : 'bg-secondary/50 text-foreground border border-border hover:border-primary/50'
                                            }`}
                                    >
                                        {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : `${sIdx + 1}세트`}
                                    </motion.button>
                                )
                            })}
                        </div>
                    </div>
                ))}

                {!todayPlan && (
                    <p className="text-center text-foreground/50 py-10">플랜 데이터를 불러올 수 없습니다.</p>
                )}
            </div>
        </div>
    );
}
