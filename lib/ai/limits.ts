import { createClient } from '@/lib/supabase/server';

export async function checkAndConsumeAiLimit(userId: string) {
    const supabase = createClient();
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, created_at, api_usage_count, last_api_usage_date')
        .eq('id', userId)
        .single();

    if (!profile) return { allowed: false, reason: 'Profile not found' };

    const today = new Date().toISOString().split('T')[0];
    const createdAt = new Date(profile.created_at);
    const diffDays = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 3600 * 24));

    // Trial 1 week (7 days)
    if (!profile.is_premium && diffDays > 7) {
        return { allowed: false, reason: '무료 체험 기간(가입 후 1주일)이 만료되었습니다. 설정에서 프리미엄 코드를 입력해주세요.' };
    }

    // Reset daily count if different day
    let currentCount = profile.api_usage_count || 0;
    if (profile.last_api_usage_date !== today) {
        currentCount = 0;
    }

    const MAX_FREE = 5; // 하루 무료 횟수 (토큰 낭비 방지)
    const MAX_PREMIUM = 100; // 하루 프리미엄 횟수
    const limit = profile.is_premium ? MAX_PREMIUM : MAX_FREE;

    if (currentCount >= limit) {
        return { allowed: false, reason: `일일 식단/상담 횟수(${limit}회)를 모두 사용했습니다. 서버비가 없어서 무료 제공이 힘들어요 ㅠㅠ 설정 메뉴에서 'freecode08100810'을 입력해 무제한 코드를 해제해주세요!` };
    }

    // Consume limit
    await supabase.from('profiles').update({
        api_usage_count: currentCount + 1,
        last_api_usage_date: today
    }).eq('id', userId);

    return { allowed: true };
}
