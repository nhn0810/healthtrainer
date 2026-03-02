'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

const steps = [
    { id: 'body', title: '신체 정보' },
    { id: 'env', title: '운동 환경' },
    { id: 'goals', title: '목표 설정' }
];

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        height: '',
        currentWeight: '',
        targetWeight: '',
        environment: '자취방 (좁은 공간)',
        equipment: '맨몸',
        duration: '4'
    });

    const handleNext = () => {
        if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep((prev) => prev - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'AI 플랜 생성 중 오류가 발생했습니다.');
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen p-6 max-w-md mx-auto pt-12">
            {/* Progress Bar */}
            <div className="flex gap-2 mb-8">
                {steps.map((_, idx) => (
                    <div key={idx} className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: idx <= currentStep ? '100%' : '0%' }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                ))}
            </div>

            <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                    {currentStep === 0 && (
                        <motion.div
                            key="step1"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-6"
                        >
                            <h1 className="text-2xl font-bold tracking-tight">현재 신체 정보를 알려주세요.</h1>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-foreground/70">키 (cm)</label>
                                    <input
                                        type="number"
                                        value={formData.height}
                                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                        placeholder="175"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-foreground/70">현재 체중 (kg)</label>
                                    <input
                                        type="number"
                                        value={formData.currentWeight}
                                        onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                                        placeholder="70"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 1 && (
                        <motion.div
                            key="step2"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-6"
                        >
                            <h1 className="text-2xl font-bold tracking-tight">어디서, 어떤 장비로 운동하시나요?</h1>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-foreground/70">주 운동 환경</label>
                                    <select
                                        value={formData.environment}
                                        onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none appearance-none"
                                    >
                                        <option value="자취방 (좁은 공간)">자취방 (좁은 공간)</option>
                                        <option value="거실 (어느정도 여유)">거실 (어느정도 여유)</option>
                                        <option value="야외 공원">야외 공원</option>
                                        <option value="헬스장">헬스장</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-foreground/70">보유 장비 (복수 선택 가능 문구 지원)</label>
                                    <input
                                        type="text"
                                        value={formData.equipment}
                                        onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                                        placeholder="예: 맨몸, 5kg 덤벨 2개, 문틀 철봉"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div
                            key="step3"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-6"
                        >
                            <h1 className="text-2xl font-bold tracking-tight">목표를 설정해주세요.</h1>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-foreground/70">목표 체중 (kg)</label>
                                    <input
                                        type="number"
                                        value={formData.targetWeight}
                                        onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                                        placeholder="65"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-foreground/70">목표 달성 기간 (주)</label>
                                    <select
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none appearance-none"
                                    >
                                        <option value="4">4주 (1개월)</option>
                                        <option value="8">8주 (2개월)</option>
                                        <option value="12">12주 (3개월)</option>
                                    </select>
                                </div>

                                {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                            </div>

                            {loading && (
                                <div className="p-6 rounded-2xl glass flex flex-col items-center justify-center space-y-4 mt-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p className="text-sm font-medium animate-pulse text-center">
                                        AI 트레이너가 당신만을 위한<br />초개인화 플랜을 분석하고 있습니다...
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-auto pt-8 pb-4">
                {currentStep > 0 ? (
                    <button
                        onClick={handleBack}
                        disabled={loading}
                        className="p-3 bg-secondary rounded-xl hover:bg-secondary/80 disabled:opacity-50"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                ) : <div />}

                {currentStep < steps.length - 1 ? (
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-3 bg-foreground text-background font-bold rounded-xl hover:scale-105 transition-transform"
                    >
                        다음 <ArrowRight className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.height || !formData.targetWeight}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {loading ? '분석 중...' : '완료하고 플랜 받기'} <CheckCircle2 className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
