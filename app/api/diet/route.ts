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

        const { base64Data, mimeType } = await req.json();

        if (!base64Data || !mimeType) {
            return NextResponse.json({ error: '데이터가 없습니다.' }, { status: 400 });
        }

        // 1. Analyze with Gemini 1.5 Flash (Vision)
        const prompt = `
      당신은 AI 영양사 및 다이어트 코치입니다.
      첨부된 음식 사진을 분석하여 다음 JSON 스키마 형식으로 응답해주세요. 마크다운 없이 오직 JSON만 반환해야 합니다.

      [요구 스키마]
      {
        "foodName": "음식 이름",
        "calories": 500,
        "nutrients": {
          "carbs_g": 60,
          "protein_g": 30,
          "fat_g": 10
        },
        "feedback": "다이어터 관점의 간단한 조언 한 줄"
      }
    `;

        // Remove the data URI part if attached (e.g. data:image/jpeg;base64,xxxx)
        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');

        const result = await aiModels.fastVision.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Content,
                    mimeType: mimeType
                }
            }
        ]);

        const responseText = result.response.text();
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/({[\s\S]*})/);
        let analysisData;

        if (jsonMatch && jsonMatch[1]) {
            analysisData = JSON.parse(jsonMatch[1]);
        } else {
            analysisData = JSON.parse(responseText);
        }

        // 2. We skip uploading to Supabase Storage temporarily for simple prototyping 
        // since buckets need to be manually created in Supabase first.
        // Base64 storage instead (or you can adjust it to upload to 'diet-images' if needed)

        // 3. Save to DB
        const { data: logData, error: dbError } = await supabase.from('food_logs').insert({
            user_id: user.id,
            // Temporarily store the base64 URL or leave blank until Storage bucket is confirmed
            meal_photo: base64Data.slice(0, 100) + '...', // Saving full base64 in text column limits scale. Best to use Storage for real app!
            calories: analysisData.calories || 0,
            nutrients: analysisData.nutrients || {},
            feedback: analysisData.feedback || '',
            date: new Date().toISOString().split('T')[0]
        }).select().single();

        if (dbError) throw dbError;

        return NextResponse.json({ success: true, log: logData, analysis: analysisData });

    } catch (error: any) {
        console.error("Diet Vision Error:", error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    }
}
