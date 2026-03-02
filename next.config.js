/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
    dest: 'public',
    register: true,
    skipWaiting: true,
    // 개발 환경에서는 PWA 비활성화 (캐싱 이슈 방지)
    disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
    reactStrictMode: true,
    images: {
        // Supabase Storage 이미지 도메인 허용 설정
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
};

module.exports = withPWA(nextConfig);
