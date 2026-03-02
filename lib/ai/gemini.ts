import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define models mapped to appropriate versions
export const aiModels = {
    // Use 1.5 Pro for deep planning and complex contextual generation
    planning: genAI.getGenerativeModel({ model: "gemini-1.5-pro" }),

    // Use 1.5 Flash for fast vision (diet photo analysis) and quick chat feedback
    fastVision: genAI.getGenerativeModel({ model: "gemini-1.5-flash" }),
    fastChat: genAI.getGenerativeModel({ model: "gemini-1.5-flash" }),
};
