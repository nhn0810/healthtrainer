import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const { code } = await req.json();
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (code === 'freecode08100810') {
            const { error } = await supabase.from('profiles').update({ is_premium: true }).eq('id', user.id);
            if (error) throw error;
            return NextResponse.json({ success: true, message: '프리미엄 인증이 완료되었습니다. 무제한으로 이용하실 수 있습니다.' });
        } else {
            return NextResponse.json({ error: '유효하지 않은 코드입니다.' }, { status: 400 });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
    }
}
