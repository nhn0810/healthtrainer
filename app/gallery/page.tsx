'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, LockKeyhole, Image as ImageIcon, LineChart as ChartIcon } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GalleryPage() {
    const [loading, setLoading] = useState(true);
    const [weights, setWeights] = useState<any[]>([]);
    const [unlocked, setUnlocked] = useState(false);
    const supabase = createClient();

    // For prototype logic, using placeholders if no photos
    const dummyPhotos = [
        { id: 1, date: '2023-10-01', url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80' },
        { id: 2, date: '2023-10-15', url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80' }
    ];

    useEffect(() => {
        async function fetchChanges() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('weight_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: true });

            if (data && data.length > 0) {
                setWeights(data);
            } else {
                // Fallback for visual testing
                setWeights([
                    { date: '10/01', weight: 80 },
                    { date: '10/10', weight: 78.5 },
                    { date: '10/20', weight: 77 },
                    { date: '10/30', weight: 75.2 },
                ]);
            }
            setLoading(false);
        }
        fetchChanges();
    }, []);

    return (
        <div className="flex flex-col min-h-screen p-6 pb-24 max-w-md mx-auto relative bg-background">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 pt-4 sticky top-0 bg-background/80 backdrop-blur-md z-20 pb-4">
                <Link href="/dashboard" className="p-2 bg-secondary rounded-xl hover:bg-secondary/80">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold">변화 기록 (시크릿)</h1>
                    <p className="text-xs text-foreground/60">당신의 노력을 안전하게 보관합니다</p>
                </div>
            </div>

            {/* Weight Chart */}
            <div className="mb-10 w-full h-[300px] glass p-4 text-xs font-bold rounded-3xl relative">
                <h3 className="mb-4 text-base font-bold flex items-center gap-2">
                    <ChartIcon className="text-primary w-5 h-5" />
                    체중 변화 트렌드
                </h3>
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                    <ResponsiveContainer width="100%" height="80%">
                        <LineChart data={weights}>
                            <XAxis dataKey="date" stroke="var(--foreground)" opacity={0.5} tickMargin={10} />
                            <YAxis domain={['auto', 'auto']} stroke="var(--foreground)" opacity={0.5} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '12px' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="weight"
                                stroke="var(--primary)"
                                strokeWidth={4}
                                dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 6 }}
                                activeDot={{ r: 8, stroke: 'var(--accent)', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Secret Gallery Section */}
            <div className="relative glass p-6 rounded-3xl overflow-hidden border border-white/5">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold flex items-center gap-2">
                        <ImageIcon className="text-foreground w-5 h-5" /> 눈바디 갤러리
                    </h3>
                    <button
                        onClick={() => setUnlocked(!unlocked)}
                        className={`p-3 rounded-xl flex items-center gap-2 font-bold text-sm transition-colors ${unlocked ? 'bg-accent/20 text-accent' : 'bg-primary text-primary-foreground'
                            }`}
                    >
                        <LockKeyhole className={`w-4 h-4 ${unlocked && 'hidden'}`} />
                        {unlocked ? '가리기' : '잠금 해제'}
                    </button>
                </div>

                <div className={`grid grid-cols-2 gap-4 transition-all duration-700 ${!unlocked && 'filter blur-xl opacity-50 grayscale'}`}>
                    {dummyPhotos.map(photo => (
                        <motion.div
                            key={photo.id}
                            className="aspect-[3/4] bg-secondary rounded-2xl overflow-hidden relative"
                            layout
                        >
                            <img src={photo.url} alt="Body transformation update" className="object-cover w-full h-full" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                <span className="text-white text-xs font-bold">{photo.date}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Overlay Block if locked */}
                <AnimatePresence>
                    {!unlocked && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center cursor-pointer pointer-events-none"
                        >
                            <div className="bg-background/80 px-6 py-4 rounded-3xl backdrop-blur-md shadow-2xl flex flex-col items-center">
                                <LockKeyhole className="w-10 h-10 mb-2 opacity-80" />
                                <p className="font-bold">갤러리가 잠겨있습니다</p>
                                <p className="text-xs text-foreground/60 mt-1">버튼을 눌러 해제하세요</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </div>
    );
}
