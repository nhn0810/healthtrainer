'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, LockKeyhole, Image as ImageIcon, LineChart as ChartIcon, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function GalleryPage() {
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [weights, setWeights] = useState<any[]>([]);
    const [unlocked, setUnlocked] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchChanges();
    }, []);

    async function fetchChanges() {
        setLoading(true);
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
            setWeights([]);
        }
        setLoading(false);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!newWeight) return alert('체중을 입력해주세요.');

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('인증되지 않음');

            let photo_url = null;

            if (fileInputRef.current?.files?.length) {
                const file = fileInputRef.current.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError, data } = await supabase.storage
                    .from('gallery')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('gallery')
                    .getPublicUrl(fileName);

                photo_url = publicUrlData.publicUrl;
            }

            const { error } = await supabase
                .from('weight_logs')
                .insert({
                    user_id: user.id,
                    weight: parseFloat(newWeight),
                    photo_url,
                    date: new Date().toISOString().split('T')[0]
                });

            if (error) throw error;

            setShowModal(false);
            setNewWeight('');
            setPreviewUrl(null);
            fetchChanges();

        } catch (error: any) {
            alert('업로드 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const photos = weights.filter(w => w.photo_url).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
                    <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                ) : weights.length > 0 ? (
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
                ) : (
                    <div className="flex items-center justify-center h-full text-foreground/50">아직 등록된 기록이 없습니다.</div>
                )}
            </div>

            {/* Secret Gallery Section */}
            <div className="relative glass p-6 rounded-3xl overflow-hidden border border-white/5 min-h-[400px]">
                <div className="flex items-center justify-between mb-6 relative z-30">
                    <h3 className="font-bold flex items-center gap-2">
                        <ImageIcon className="text-foreground w-5 h-5" /> 눈바디 갤러리
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowModal(true)}
                            className="p-2 bg-secondary text-foreground rounded-xl flex items-center justify-center"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setUnlocked(!unlocked)}
                            className={`px-3 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-colors ${unlocked ? 'bg-accent/20 text-accent' : 'bg-primary text-primary-foreground'
                                }`}
                        >
                            <LockKeyhole className={`w-4 h-4 ${unlocked && 'hidden'}`} />
                            {unlocked ? '가리기' : '잠금 해제'}
                        </button>
                    </div>
                </div>

                <div className={`grid grid-cols-2 gap-4 transition-all duration-700 ${!unlocked ? 'filter blur-xl opacity-50 grayscale' : ''}`}>
                    {photos.length > 0 ? photos.map(photo => (
                        <motion.div
                            key={photo.id}
                            className="aspect-[3/4] bg-secondary rounded-2xl overflow-hidden relative"
                            layout
                        >
                            <img src={photo.photo_url} alt="Body transformation update" className="object-cover w-full h-full" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                <span className="text-white text-xs font-bold">{photo.date}</span>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="col-span-2 text-center text-foreground/50 py-10 text-sm">
                            (+) 버튼을 눌러 첫 눈바디를 기록해보세요.
                        </div>
                    )}
                </div>

                {/* Overlay Block if locked */}
                <AnimatePresence>
                    {!unlocked && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-20 flex flex-col items-center justify-center cursor-pointer pointer-events-none"
                        >
                            <div className="bg-background/80 px-6 py-4 rounded-3xl backdrop-blur-md shadow-2xl flex flex-col items-center border border-white/5">
                                <LockKeyhole className="w-10 h-10 mb-2 opacity-80" />
                                <p className="font-bold">갤러리가 잠겨있습니다</p>
                                <p className="text-xs text-foreground/60 mt-1">버튼을 눌러 해제하세요</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="w-full max-w-sm bg-background border border-border rounded-3xl p-6 shadow-2xl space-y-6"
                        >
                            <h2 className="text-xl font-bold">새로운 기록 추가</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-foreground/70 mb-2 block">오늘의 체중 (kg)</label>
                                    <input
                                        type="number"
                                        value={newWeight}
                                        onChange={(e) => setNewWeight(e.target.value)}
                                        placeholder="예: 70.5"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-foreground/70 mb-2 block">눈바디 사진 (선택)</label>
                                    <div
                                        className="w-full border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors relative"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        {previewUrl ? (
                                            <img src={previewUrl} className="w-full aspect-[3/4] object-cover rounded-lg" alt="Preview" />
                                        ) : (
                                            <div className="py-8 flex flex-col items-center">
                                                <ImageIcon className="w-8 h-8 text-foreground/40 mb-2" />
                                                <span className="text-sm text-foreground/60">사진 선택하기</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setPreviewUrl(null);
                                    }}
                                    className="flex-1 py-3 bg-secondary rounded-xl font-bold hover:bg-secondary/80"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || !newWeight}
                                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold flex justify-center items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50"
                                >
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : '저장하기'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
