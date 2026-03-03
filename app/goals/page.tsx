'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Target, Calendar, ChevronLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function GoalsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [workoutPlan, setWorkoutPlan] = useState<any>(null);

    // Form states
    const [purpose, setPurpose] = useState('');
    const [targetWeight, setTargetWeight] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [bodyTarget, setBodyTarget] = useState('');
    const [injuryHistory, setInjuryHistory] = useState('');

    const supabase = createClient();

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
                setPurpose(profileData.exercise_purpose || '');
                setTargetWeight(profileData.target_weight?.toString() || '');
                setTargetDate(profileData.target_date || '');
                setBodyTarget(profileData.body_target || '');
                setInjuryHistory(profileData.injury_history || '');
            }

            const { data: planData } = await supabase
                .from('workout_plans')
                .select('plan_data')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (planData && planData.plan_data?.workoutRoutines) {
                setWorkoutPlan(planData.plan_data.workoutRoutines);
            }

            setLoading(false);
        }
        loadData();
    }, []);

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('profiles').update({
            exercise_purpose: purpose,
            target_weight: parseFloat(targetWeight) || null,
            target_date: targetDate || null,
            body_target: bodyTarget,
            injury_history: injuryHistory,
        }).eq('id', user.id);

        setSaving(false);
        // Alert could go here
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
    }

    const daysKor = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <div className="flex flex-col min-h-screen p-6 pb-24 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 pt-4">
                <Link href="/dashboard" className="p-2 bg-secondary rounded-xl hover:bg-secondary/80">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold">나의 목표 및 캘린더</h1>
                </div>
            </div>

            {/* Goals Form */}
            <div className="glass p-6 rounded-3xl space-y-5 mb-8 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">운동 목표 설정</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground/70 mb-1">목표 체중 (kg)</label>
                        <input
                            type="number"
                            value={targetWeight}
                            onChange={(e) => setTargetWeight(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-background/50 focus:border-primary transition-colors"
                            placeholder="예: 70"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground/70 mb-1">최종 목표 달성일</label>
                        <input
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-background/50 focus:border-primary transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground/70 mb-1">주된 운동 목적</label>
                        <select
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-background/50 focus:border-primary transition-colors appearance-none"
                        >
                            <option value="">선택해주세요</option>
                            <option value="체중 감량 (다이어트)">체중 감량 (다이어트)</option>
                            <option value="근력 향상 (벌크업)">근력 향상 (벌크업)</option>
                            <option value="체력 증진 (유산소)">체력 증진 (유산소)</option>
                            <option value="체형 교정 및 밸런스">체형 교정 및 밸런스</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground/70 mb-1">집중 타겟 부위</label>
                        <input
                            type="text"
                            value={bodyTarget}
                            onChange={(e) => setBodyTarget(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-background/50 focus:border-primary transition-colors"
                            placeholder="예: 넓은 어깨, 코어 강화, 애플힙"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground/70 mb-1">부상 이력 및 주의사항</label>
                        <textarea
                            value={injuryHistory}
                            onChange={(e) => setInjuryHistory(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-background/50 focus:border-primary transition-colors min-h-[80px]"
                            placeholder="예: 오른쪽 무릎 수술 이력 있음, 손목이 약함"
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
                    >
                        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-5 h-5" />정보 저장 및 AI 반영</>}
                    </button>
                    <p className="text-xs text-center text-foreground/50 mt-3">저장된 정보는 AI 트레이너와의 채팅 및 플랜 변경 시 실시간으로 반영됩니다.</p>
                </div>
            </div>

            {/* Workout Calendar Preview */}
            <div className="glass p-6 rounded-3xl space-y-5 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-accent" />
                    <h2 className="text-lg font-bold">주간 플랜 캘린더</h2>
                </div>

                {workoutPlan ? (
                    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                        {workoutPlan.map((dayPlan: any, idx: number) => {
                            // Extract day from string e.g. "Monday" -> "월요일"
                            const dayInitial = dayPlan.day.substring(0, 3);
                            return (
                                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/20 bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 text-xs font-bold text-primary">
                                        Day {idx + 1}
                                    </div>
                                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl glass bg-secondary/30 ml-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="font-bold text-sm text-foreground">{dayPlan.day}</div>
                                            <div className="text-xs text-foreground/50">{dayPlan.exercises?.length || 0} 종목</div>
                                        </div>
                                        <div className="text-foreground/80 font-medium text-sm text-accent mb-2">{dayPlan.focus}</div>
                                        <div className="text-xs text-foreground/60 line-clamp-2">
                                            {dayPlan.exercises?.map((e: any) => e.name).join(', ')}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-foreground/50 text-sm">
                        트레이너가 아직 플랜을 구성하지 않았습니다.<br />
                        채팅이나 온보딩을 통해 플랜을 생성해주세요.
                    </div>
                )}
            </div>
        </div>
    );
}
