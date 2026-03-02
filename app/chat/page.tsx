'use client';

import { useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Send, Bot, User, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ChatPage() {
    const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
        onError: (err: any) => {
            // the error message might be embedded if it's a generic text response from next.js route 
            console.error(err);
        }
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-screen max-h-screen bg-background relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sticky top-0 bg-background/80 backdrop-blur-md z-20 border-b border-white/5">
                <Link href="/dashboard" className="p-2 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="text-center flex-1 pr-10">
                    <h1 className="text-base font-bold flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        AI 퍼스널 트레이너
                    </h1>
                    <p className="text-[10px] text-foreground/50">Gemini 1.5 Flash</p>
                </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth pb-32">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
                        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                            <Bot className="w-10 h-10 text-primary" />
                        </div>
                        <p className="text-sm font-bold">무엇이든 물어보세요!</p>
                        <p className="text-xs text-foreground/60 max-w-[250px] leading-relaxed">
                            "오늘 무릎이 안 좋은데 대체할 운동 제안해줘" <br />
                            "어제 치킨 먹었는데 오늘 어떻게 만회할까?"
                        </p>
                    </div>
                )}

                <AnimatePresence>
                    {messages.map((m: any) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                        >
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'
                                }`}>
                                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>

                            {/* Message Bubble */}
                            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user'
                                ? 'bg-accent/10 border border-accent/20 text-foreground rounded-tr-sm'
                                : 'bg-secondary border border-border text-foreground rounded-tl-sm shadow-sm'
                                }`}>
                                {m.content}
                            </div>
                        </motion.div>
                    ))}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-3 max-w-[85%] mr-auto"
                        >
                            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-xs leading-relaxed rounded-tl-sm">
                                일일 한도를 초과했습니다! 개발자에게 서버비가 없어요 ㅠㅠ<br />
                                설정 메뉴에서 무제한 코드를 입력해주세요.
                            </div>
                        </motion.div>
                    )}

                    {isLoading && !error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-3 max-w-[85%] mr-auto"
                        >
                            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-secondary border border-border text-foreground rounded-tl-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Form */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-10 pt-10">
                <form
                    onSubmit={handleSubmit}
                    className="relative max-w-md mx-auto flex items-center gap-2"
                >
                    <div className="flex-1 relative">
                        <input
                            value={input}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder="피로도나 궁금증을 입력하세요..."
                            className="w-full pl-4 pr-12 py-4 rounded-full bg-secondary/80 backdrop-blur-md border border-white/10 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all text-sm"
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-foreground/40 hover:text-foreground"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex-shrink-0 flex items-center justify-center hover:scale-105 active:scale-95 disabled:bg-secondary disabled:text-foreground/30 transition-all shadow-[0_4px_15px_rgba(0,123,255,0.3)]"
                    >
                        <Send className="w-5 h-5 -ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
