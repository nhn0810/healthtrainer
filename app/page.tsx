import Link from 'next/link';

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-8">
            <div className="space-y-4">
                <h1 className="text-5xl font-bold text-primary tracking-tight">AI Edge Coach</h1>
                <p className="text-lg text-foreground/80 max-w-md mx-auto">
                    당신보다 당신을 더 잘 아는 AI 트레이너. 지금 바로 시작해보세요.
                </p>
            </div>

            <div className="flex flex-col w-full max-w-xs space-y-4">
                <Link
                    href="/gate"
                    className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg hover:scale-105 active:scale-95 transition-transform"
                >
                    시작하기
                </Link>
            </div>
        </div>
    );
}
