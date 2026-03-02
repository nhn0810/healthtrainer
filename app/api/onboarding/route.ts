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

    const body = await req.json();
    const { height, currentWeight, targetWeight, environment, equipment, duration } = body;

    const prompt = `
      당신은 세계 최고의 AI 퍼스널 트레이너 "AI Edge Coach"입니다.
      아래 사용자의 신체 정보와 환경을 바탕으로 가장 현실적이고 효율적인 1:1 맞춤형 7일 운동 및 식단 가이드라인을 작성해주세요.
      결과는 반드시 JSON 형식으로만 응답해야 하며, 다른 텍스트는 전혀 포함하지 마세요.

      [초개인화 규칙 - 중요!]
      1. 사용자의 목표 체중 도달까지 필요한 일일 칼로리 섭취량(dailyCaloriesTarget)을 정확히 계산하세요. (감량/증량 여부에 맞춰서)
      2. 사용자의 운동 환경(${environment})과 보유 장비(${equipment})에 정확히 일치하는 운동만 추천하세요. (예: 헬스장 환경이면 기구 위주, 홈트이고 맨몸이면 맨몸 운동 위주)
      3. 목표 기간(${duration}주) 내에 목표를 달성할 수 있도록 강도를 점진적으로 설정하세요.

      [사용자 정보]
      - 키: ${height}cm
      - 현재 체중: ${currentWeight}kg
      - 목표 체중: ${targetWeight}kg
      - 감량/증량 목표 갭: ${parseFloat(targetWeight) - parseFloat(currentWeight)}kg
      - 주 운동 환경: ${environment}
      - 보유 장비: ${equipment}
      - 목표 기간: ${duration}주

      [요청 스펙 (JSON 스키마)]
      {
        "summary": "AI 트레이너의 짧은 동기부여 및 총평 (한국어)",
        "dailyCaloriesTarget": 2000,
        "macros": { "protein_g": 150, "carbs_g": 200, "fat_g": 50 },
        "workoutRoutines": [
          {
            "day": "Monday",
            "focus": "전신 근력",
            "exercises": [
              { "name": "푸시업", "sets": 3, "reps": 12, "notes": "무릎을 꿇고 시작해도 좋습니다." }
            ]
          }
          // 7일치 플랜 구성 (휴식일 포함)
        ]
      }
    `;

    const result = await aiModels.planning.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON block in case Gemini wraps it in markdown codeblocks
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/({[\s\S]*})/);
    let planData;

    if (jsonMatch && jsonMatch[1]) {
      planData = JSON.parse(jsonMatch[1]);
    } else {
      planData = JSON.parse(responseText);
    }

    // Update Profile with Onboarding Data
    await supabase.from('profiles').update({
      height: parseFloat(height),
      target_weight: parseFloat(targetWeight),
      env_info: environment,
      equipment: equipment
    }).eq('id', user.id);

    // Initial Weight Log
    await supabase.from('weight_logs').insert({
      user_id: user.id,
      weight: parseFloat(currentWeight)
    });

    // Save Workout Plan
    const { error: planError } = await supabase.from('workout_plans').insert({
      user_id: user.id,
      plan_data: planData,
      start_date: new Date().toISOString().split('T')[0],
      // Calculate end date based on duration (weeks)
      end_date: new Date(Date.now() + parseInt(duration) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    if (planError) throw new Error('Failed to save workout plan: ' + planError.message);

    return NextResponse.json({ success: true, plan: planData });

  } catch (error: any) {
    console.error("Onboarding AI Error:", error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
