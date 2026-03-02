'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Dumbbell, Utensils, Activity, MessageSquare, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
    { name: '대시보드', icon: Home, href: '/dashboard' },
    { name: '운동', icon: Dumbbell, href: '/workout' },
    { name: '식단', icon: Utensils, href: '/diet' },
    { name: '변화기록', icon: Activity, href: '/gallery' },
    { name: 'AI 트레이너', icon: MessageSquare, href: '/chat' },
    { name: '설정', icon: Settings, href: '/settings' },
];

export default function EdgeSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // 게이트 페이지나 로그인/가입 화면에서는 사이드바 숨김
    const hideSidebar = ['/gate', '/login', '/register', '/'].includes(pathname || '');

    if (hideSidebar) return null;

    return (
        <>
            {/* Edge Handle */}
            {!isOpen && (
                <div
                    className="fixed top-[45%] right-0 w-2 h-20 bg-primary/40 hover:bg-primary/80 rounded-l-2xl cursor-pointer shadow-[0_0_15px_var(--primary)] z-40 transition-colors"
                    onClick={() => setIsOpen(true)}
                />
            )}

            {/* Dimmed Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 22, stiffness: 250 }}
                        className="fixed top-0 right-0 h-full w-[280px] bg-background border-l border-white/10 shadow-2xl z-50 p-6 flex flex-col"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={{ left: 0, right: 1 }}
                        onDragEnd={(e, { offset, velocity }) => {
                            if (offset.x > 80 || velocity.x > 200) {
                                setIsOpen(false);
                            }
                        }}
                    >
                        <div className="flex items-center justify-between mb-10 mt-4">
                            <h2 className="text-xl font-bold tracking-tight text-primary">AI Edge Coach</h2>
                        </div>

                        <nav className="flex-1 space-y-2">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${isActive
                                                ? 'bg-primary/10 text-primary font-bold'
                                                : 'text-foreground/80 hover:bg-white/5 hover:text-foreground'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span>{item.name}</span>
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Drag Handle Indicator */}
                        <div className="absolute top-1/2 left-2 -translate-y-1/2 w-1.5 h-12 bg-white/20 rounded-full" />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
