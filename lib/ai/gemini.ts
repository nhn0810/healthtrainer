import { GoogleGenerativeAI } from '@google/generative-ai';

// Next.js 빌드 시 Vercel 등의 CI 환경에서 시작 시점에 환경변수가 비어있어도 크래시가 나지 않도록 기본값 처리
const apiKey = process.env.GEMINI_API_KEY || 'dummy_key_for_build';
export const genAI = new GoogleGenerativeAI(apiKey);

// Define models mapped to appropriate versions
export const aiModels = {
    // Use 3.1 Pro for deep planning and complex contextual generation
    planning: genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" }),

    // Use 3 Flash for fast vision (diet photo analysis) and quick chat feedback
    fastVision: genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }),
    fastChat: genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }),
};
