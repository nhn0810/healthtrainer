'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, UploadCloud, Loader2, Utensils, ChevronLeft, CalendarClock } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function DietLogPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [todayLogs, setTodayLogs] = useState<any[]>([]);
    const [analysisResult, setAnalysisResult] = useState<any | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [extraText, setExtraText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    useEffect(() => {
        async function loadLogs() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const todayString = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('food_logs')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', todayString)
                .order('id', { ascending: false });

            if (data) setTodayLogs(data);
        }
        loadLogs();
    }, [analysisResult]); // Reload when new analysis is done

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setImagePreview(URL.createObjectURL(file));
        setAnalysisResult(null);
        setError('');
        setExtraText('');
    };

    const handleUploadAndAnalyze = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setError('');
        setAnalysisResult(null);

        try {
            // 1. Image Compression (Max 500kb WebP)
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1200,
                useWebWorker: true,
                fileType: 'image/webp'
            };

            const compressedBlob = await imageCompression(selectedFile, options);

            // 2. Blob to Base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Data = reader.result as string;

                // 3. Request API (Gemini Flash Vision)
                const response = await fetch('/api/diet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        base64Data,
                        mimeType: 'image/webp',
                        extraText
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error);

                setAnalysisResult({ ...data.analysis, id: data.log.id });
                setSelectedFile(null); // Reset selection
                setLoading(false);
            };

            reader.readAsDataURL(compressedBlob);

        } catch (err: any) {
            console.error(err);
            setError(err.message || '이미지 분석 중 오류가 발생했습니다.');
            setLoading(false);
        }
    };

    const totalCalories = todayLogs.reduce((acc, log) => acc + (log.calories || 0), 0);
    const totalProtein = todayLogs.reduce((acc, log) => acc + (log.nutrients?.protein_g || 0), 0);

    return (
        <div className="flex flex-col min-h-screen p-6 pb-24 max-w-md mx-auto relative bg-background">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 pt-4 sticky top-0 bg-background/80 backdrop-blur-md z-20 pb-4">
                <Link href="/dashboard" className="p-2 bg-secondary rounded-xl hover:bg-secondary/80">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold">식단 기록</h1>
                    <p className="text-xs text-foreground/60">Gemini Vision AI 자동 분석</p>
                </div>
            </div>

            {/* Summary Chips */}
            <div className="flex gap-4 mb-8">
                <div className="flex-1 p-4 rounded-2xl bg-secondary/30 border border-border">
                    <p className="text-xs text-foreground/60 font-medium">오늘 섭취 칼로리</p>
                    <p className="text-2xl font-bold mt-1 text-primary">{totalCalories} <span className="text-sm font-medium">kcal</span></p>
                </div>
                <div className="flex-1 p-4 rounded-2xl bg-secondary/30 border border-border">
                    <p className="text-xs text-foreground/60 font-medium">단백질</p>
                    <p className="text-2xl font-bold mt-1">{totalProtein} <span className="text-sm font-medium">g</span></p>
                </div>
            </div>

            {/* Camera / Upload Action */}
            <div className="mb-10 text-center relative">
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                />

                {!selectedFile && !loading && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="w-48 h-48 mx-auto rounded-full bg-gradient-to-tr from-primary/30 to-accent/30 border-4 border-primary/20 flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 shadow-[0_0_40px_rgba(0,123,255,0.2)]"
                    >
                        <Camera className="w-12 h-12 text-primary mb-2" />
                        <span className="font-bold">사진으로 기록하기</span>
                    </button>
                )}

                {/* Confirm & Context Input UI */}
                {selectedFile && !loading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 glass rounded-2xl">
                        <div
                            className="w-full h-48 bg-cover bg-center rounded-xl overflow-hidden shadow-inner mb-4 relative"
                            style={{ backgroundImage: `url(${imagePreview})` }}
                        />
                        <input
                            type="text"
                            maxLength={100}
                            placeholder="추가 코멘트 (예: 고기 2점 추가, 밥 반공기 남김)"
                            value={extraText}
                            onChange={(e) => setExtraText(e.target.value)}
                            className="w-full p-3 rounded-xl bg-background/50 border border-white/10 text-sm mb-4"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setSelectedFile(null)} className="flex-1 p-3 rounded-xl bg-secondary text-foreground/70 font-bold hover:bg-secondary/80 transition-colors">
                                취소
                            </button>
                            <button onClick={handleUploadAndAnalyze} className="flex-1 p-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                                <UploadCloud className="w-5 h-5" />
                                분석 시작
                            </button>
                        </div>
                    </motion.div>
                )}

                {loading && (
                    <div className="w-48 h-48 mx-auto flex flex-col justify-center items-center">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <span className="font-bold text-sm text-primary">AI 영양사가 분석 중...</span>
                    </div>
                )}

                {error && <p className="text-red-500 text-sm font-bold mt-4">{error}</p>}
            </div>

            {/* Analysis Result (Pop-up inline) */}
            <AnimatePresence>
                {analysisResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-5 glass rounded-2xl border-l-4 border-l-primary relative overflow-hidden"
                    >
                        {/* Background Image Preview */}
                        <div
                            className="absolute inset-0 opacity-10 bg-cover bg-center -z-10 blur-xl scale-110"
                            style={{ backgroundImage: `url(${imagePreview})` }}
                        />

                        <div className="flex items-start justify-between">
                            <div>
                                <span className="inline-flex items-center rounded-md bg-accent/20 px-2 py-1 text-xs font-medium text-accent ring-1 ring-inset ring-accent/10 mb-2">
                                    스마트 분석 완료
                                </span>
                                <h3 className="text-xl font-bold">{analysisResult.foodName || '이름 없음'}</h3>
                                <p className="text-foreground/80 mt-1">{analysisResult.calories} kcal</p>
                            </div>
                            <Utensils className="text-primary w-8 h-8 opacity-80" />
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                            <div className="bg-background/40 p-2 rounded-lg backdrop-blur-sm">
                                <p className="text-xs text-foreground/50">탄수화물</p>
                                <p className="font-bold">{analysisResult.nutrients?.carbs_g}g</p>
                            </div>
                            <div className="bg-background/40 p-2 rounded-lg backdrop-blur-sm shadow-sm ring-1 ring-primary/20">
                                <p className="text-xs text-primary font-bold">단백질</p>
                                <p className="font-bold">{analysisResult.nutrients?.protein_g}g</p>
                            </div>
                            <div className="bg-background/40 p-2 rounded-lg backdrop-blur-sm">
                                <p className="text-xs text-foreground/50">지방</p>
                                <p className="font-bold">{analysisResult.nutrients?.fat_g}g</p>
                            </div>
                        </div>

                        <p className="text-sm mt-4 text-foreground/80 leading-relaxed font-medium bg-background/30 p-3 rounded-xl border border-border">
                            "{analysisResult.feedback}"
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Today's Log List */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <CalendarClock className="w-5 h-5" />
                    오늘의 식사
                </h3>

                {todayLogs.length === 0 ? (
                    <p className="text-foreground/50 text-sm text-center py-6">오늘 아직 기록된 식단이 없습니다.</p>
                ) : (
                    todayLogs.map(log => (
                        <div key={log.id} className="p-4 rounded-xl bg-secondary/40 border border-white/5 flex justify-between items-center">
                            <div>
                                <p className="font-bold">{log.feedback ? 'AI 기록완료' : '식사 기록'}</p>
                                <p className="text-xs text-foreground/60">{log.nutrients?.protein_g}g 단백질 포함</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-primary">{log.calories} <span className="text-xs font-normal">kcal</span></p>
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>
    );
}
