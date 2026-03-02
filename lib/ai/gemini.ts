import { GoogleGenerativeAI } from '@google/generative-ai';

// Next.js 빌드 시 Vercel 등의 CI 환경에서 시작 시점에 환경변수가 비어있어도 크래시가 나지 않도록 기본값 처리
const apiKey = process.env.GEMINI_API_KEY || 'dummy_key_for_build';
export const genAI = new GoogleGenerativeAI(apiKey);

// Define models mapped to appropriate versions
export const aiModels = {
    // Use 1.5 Flash instead of 1.5 Pro to avoid quota or "not found" model API errors
    planning: genAI.getGenerativeModel({ model: "gemini-1.5-flash" }),

    // Use 1.5 Flash for fast vision (diet photo analysis) and quick chat feedback
    fastVision: genAI.getGenerativeModel({ model: "gemini-1.5-flash" }),
    fastChat: genAI.getGenerativeModel({ model: "gemini-1.5-flash" }),
};
