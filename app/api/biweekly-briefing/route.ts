import { NextResponse } from 'next/server';
import { aiModels } from '@/lib/ai/gemini';
import { createClient } from '@/lib/supabase/server';
import { checkAndConsumeAiLimit } from '@/lib/ai/limits';

export const maxDuration = 30; // Vercel limit up to 30s

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

        const { currentWeight, planId } = await req.json();

        // 1. Fetch Profile & Old Plan
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const { data: oldPlan } = await supabase.from('workout_plans').select('*').eq('id', planId).single();

        // 2. Fetch past 14 days of diet evaluation summaries (up to 14)
        const { data: progresses } = await supabase
            .from('daily_progress')
            .select('date, daily_calories, diet_evaluation')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(14);

        let progressSummary = '최근 14일 기록:\n';
        if (progresses && progresses.length > 0) {
            progresses.forEach(p => {
                if (p.daily_calories) {
                    progressSummary += `- [${p.date}] ${p.daily_calories}kcal 섭취: ${p.diet_evaluation || '평가 없음'}\n`;
                }
            });
        } else {
            progressSummary = '최근 등록된 식단 평가 기록이 없습니다.';
        }

        // 3. Ask Gemini to write a briefing AND generate the next 2-week plan
        const prompt = `
            당신은 세계 최고의 AI 퍼스널 트레이너 "AI Edge Coach"입니다.
            사용자의 지난 2주간의 체중 변화, 식단 기록을 분석하여 [초개인화된 결과 브리핑]과 [다음 2주를 위한 완벽한 맞춤 플랜]을 동시에 작성해주세요.
            
            [사용자 상태]
            - 신장: ${profile.height} cm
            - 운동 환경 및 장비: ${profile.env_info} / ${profile.equipment}
            - 집중 목적 및 타겟: ${profile.exercise_purpose || '일반 건강'} / ${profile.body_target || '전신'}
            - 건강/부상 특이사항: ${profile.injury_history || '없음'}
            - 과거 체중(2주전): ${oldPlan?.plan_data?.currentWeight || '알 수 없음'} kg
            - 현재 측정 체중: ${currentWeight} kg
            - 최종 목표 체중: ${profile.target_weight} kg

            [2주간 식단 평가 요약]
            ${progressSummary}

            [요청 사항]
            1. 결과 브리핑(briefing): 과거 체중과 현재 체중을 비교하며 동기부여를 주고, 지난 식단 평가 요약을 바탕으로 잘한 점과 개선할 점을 한국어 단락으로 짧고 굵게 작성하세요.
            2. 다음 2주 플랜(plan_data): 체중과 목적 변화에 맞춰 새로운 2주 플랜 스키마(JSON)를 제공하세요. 일일 타겟 칼로리를 재설정하고, 운동 종목이나 강도를 적절히 높이거나 변경하세요.

            반드시 아래 JSON 스키마 형식으로만 응답해야 합니다.
            {
                "briefing": "체중이 1kg 감량되었습니다! 지난주 탄수화물 초과가 아쉽지만 훌륭합니다...",
                "plan_data": {
                    "summary": "다음 2주는 코어와 하체를 불태우는 볼륨 증가 플랜입니다.",
                    "currentWeight": ${currentWeight},
                    "dailyCaloriesTarget": 1800,
                    "macros": { "protein_g": 140, "carbs_g": 180, "fat_g": 60 },
                    "workoutRoutines": [
                        {
                            "day": "Monday",
                            "focus": "전신 데드리프트 및 코어",
                            "exercises": [ { "name": "데드버그", "sets": 3, "reps": 15, "notes": "허리를 바닥에 밀착하세요" } ]
                        }
                        // 7일치 로테이션 구성
                    ]
                }
            }
        `;

        const result = await aiModels.planning.generateContent(prompt);
        const responseText = result.response.text();

        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/({[\s\S]*})/);
        let parsed;
        if (jsonMatch && jsonMatch[1]) {
            parsed = JSON.parse(jsonMatch[1]);
        } else {
            parsed = JSON.parse(responseText);
        }

        // 4. Update Old Plan as completed
        await supabase.from('workout_plans').update({
            is_completed: true,
            biweekly_briefing: parsed.briefing
        }).eq('id', planId);

        // 5. Insert New Weight Log & Profile Current Target
        await supabase.from('weight_logs').insert({
            user_id: user.id,
            weight: parseFloat(currentWeight)
        });

        // 6. Create New Plan
        const { error: planError } = await supabase.from('workout_plans').insert({
            user_id: user.id,
            plan_data: parsed.plan_data,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 14 days
        });

        if (planError) throw planError;

        return NextResponse.json({ success: true, briefing: parsed.briefing });

    } catch (error: any) {
        console.error("Biweekly Briefing Error:", error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    }
}
