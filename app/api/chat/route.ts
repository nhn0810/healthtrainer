import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { checkAndConsumeAiLimit } from '@/lib/ai/limits';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Secure the API route
        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const limitCheck = await checkAndConsumeAiLimit(user.id);
        if (!limitCheck.allowed) {
            // Return 403 with raw text. useChat might throw it as an error text
            return new Response(limitCheck.reason, { status: 403 });
        }

        // Get user profile to inject into the system prompt
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        const { messages } = await req.json();

        const profileContext = profile
            ? `키 ${profile.height}cm, 체중 ${profile.target_weight}kg(목표), 환경 ${profile.env_info}, 장비 ${profile.equipment}`
            : '초기 정보 없음';

        const result = await streamText({
            model: google('gemini-1.5-flash'),
            system: `당신은 사용자의 멘탈 케어와 운동, 식단을 완벽하게 관리하는 1:1 전담 AI 트레이너입니다. 친근하지만 프로페셔널한 한국어 톤을 유지하세요.
      
      [사용자 정보]
      - ${profileContext}
      
      [상담 규칙]
      1. 부상이나 컨디션 난조를 호소하면, 즉각적으로 운동의 강도를 낮추거나 대체 운동을 매우 구체적으로 제안하세요.
      2. 식단에 죄책감을 느끼면 공감해주고 다음 대처(물 마시기 등)를 추천하세요.
      3. 답변은 간결하고 핵심적인 2~3문단으로 제공하세요. 마크다운 리스트 문법을 활용해서 가독성이 높도록 작성하세요.`,
            messages,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error('Chat API Error:', error);
        return new Response('Error', { status: 500 });
    }
}
