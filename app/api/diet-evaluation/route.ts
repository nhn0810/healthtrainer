import { NextResponse } from 'next/server';
import { aiModels } from '@/lib/ai/gemini';
import { createClient } from '@/lib/supabase/server';
import { checkAndConsumeAiLimit } from '@/lib/ai/limits';

export async function POST(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const limitCheck = await checkAndConsumeAiLimit(user.id);
        if (!limitCheck.allowed) {
            return NextResponse.json({ error: limitCheck.reason }, { status: 403 });
        }

        const { consumedCalories, userNote, targetCalories } = await req.json();

        // Use Gemini 3.1 Pro (Planning) or Flash depending on speed preference. Let's use Flash for quicker day-to-day evaluation
        const prompt = `
      당신은 AI 영양사 "AI Edge Coach"입니다.
      사용자가 오늘 하루 섭취한 칼로리와 메모를 바탕으로 식습관을 짧게 평가해주세요.
      목표 칼로리는 ${targetCalories}kcal 이고, 오늘 섭취한 칼로리는 ${consumedCalories}kcal 입니다.
      사용자 메모: "${userNote || '없음'}"

      반드시 아래 JSON 형식으로만 짧고 명확하게 응답하세요. (마크다운 없이 순수 JSON만 반환)
      {"evaluation": "목표치보다 200kcal 초과했습니다. 내일은 탄수화물을 조금 줄여보세요!"}
    `;

        const result = await aiModels.fastChat.generateContent(prompt);
        const responseText = result.response.text();

        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/({[\s\S]*})/);
        let evaluationText = "식단 분석 완료";

        if (jsonMatch && jsonMatch[1]) {
            const parsed = JSON.parse(jsonMatch[1]);
            evaluationText = parsed.evaluation;
        } else {
            const parsed = JSON.parse(responseText);
            evaluationText = parsed.evaluation;
        }

        // Save to daily_progress
        const todayString = new Date().toISOString().split('T')[0];

        // Upsert or update progress
        const { error: updateError } = await supabase
            .from('daily_progress')
            .update({
                daily_calories: parseInt(consumedCalories),
                diet_evaluation: evaluationText
            })
            .eq('user_id', user.id)
            .eq('date', todayString);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, evaluation: evaluationText });

    } catch (error: any) {
        console.error("Diet Eval Error:", error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    }
}
