/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // 혹은 'media'. CSS Variable 호환을 위해 'class' 기반 추천, 실제 테마 적용은 CSS 변수 사용
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // CSS Variables 기반 테마 매핑 (블랙 & 화이트)
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                primary: {
                    DEFAULT: 'var(--primary)',
                    foreground: 'var(--primary-foreground)',
                },
                secondary: {
                    DEFAULT: 'var(--secondary)',
                    foreground: 'var(--secondary-foreground)',
                },
                border: 'var(--border)',
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)',
                },
            },
            // 삼성 엣지 스타일 사이드바를 위한 위치 조정 및 z-index 등 확장 가능
            zIndex: {
                'edge-sidebar': '100',
            },
        },
    },
    plugins: [],
};
