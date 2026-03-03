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

        // Get recent food logs (last 3 entries)
        const { data: recentDiet } = await supabase
            .from('food_logs')
            .select('food_name, calories, nutrients, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);

        // Get daily progress (today)
        const todayString = new Date().toISOString().split('T')[0];
        const { data: dailyProgress } = await supabase
            .from('daily_progress')
            .select('progress_rate')
            .eq('user_id', user.id)
            .eq('date', todayString)
            .single();

        const { messages } = await req.json();

        const dietContext = recentDiet && recentDiet.length > 0
            ? recentDiet.map(d => `${d.food_name} (${d.calories}kcal)`).join(', ')
            : '최근 식단 기록 없음';

        const progressContext = dailyProgress ? `${dailyProgress.progress_rate}%` : '0%';

        const profileContext = profile
            ? `키 ${profile.height}cm, 체중 ${profile.target_weight}kg(목표), 환경 ${profile.env_info}, 장비 ${profile.equipment}`
            : '초기 정보 없음';

        const result = await streamText({
            model: google('gemini-1.5-flash'),
            system: `당신은 사용자의 멘탈 케어와 운동, 식단을 완벽하게 관리하는 1:1 전담 초개인화 AI 트레이너입니다. 친근하면서도 목표 달성을 위해 단호한 한국어 톤을 유지하세요.
      
      [사용자 실시간 동기화 정보]
      - 신체/환경 정보: ${profileContext}
      - 오늘 운동 달성률: ${progressContext}
      - 최근 먹은 식단: ${dietContext}
      
      [초개인화 상담 규칙 - 중요!]
      1. 이미 먹은 식단 혹은 오늘 운동 달성률을 반영하여 피드백하세요. (예: "오늘 벌써 피자 드셨네요? 저녁엔 탄수화물을 줄이셔야 합니다!", "운동 달성률이 0이네요. 기초 코어만이라도 할까요?")
      2. 사용자의 환경/장비(${profile?.equipment || '없음'})에 맞지 않는 운동은 절대로 제안하지 마세요.
      3. 부상이나 컨디션 난조를 호소하면, 즉각적으로 운동의 강도를 낮추거나 대체 운동을 매우 구체적으로 제안하세요.
      4. 답변은 간결하고 핵심적인 2~3문단으로 제공하세요. 이모지(🔥, 💪 등)를 적절히 활용하여 동기부여하세요.`,
            messages,
        });

        return result.toTextStreamResponse();
    } catch (error: any) {
        console.error('Chat API Error:', error);
        return new Response(error?.message || 'Server Error', { status: 500 });
    }
}
