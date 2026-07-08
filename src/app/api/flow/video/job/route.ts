import { NextResponse } from 'next/server';
import { getVideoJob } from '@/lib/useapi/videos';
import { UseApiError } from '@/lib/useapi/errors';
import { extractUrls } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, message: 'Thiếu id job' }, { status: 400 });
    const raw = await getVideoJob(id);
    const urls = extractUrls(raw, ['videoUrl', 'url', 'downloadUrl']);
    const thumbnails = extractUrls(raw, ['thumbnailUrl', 'thumbnail']);
    return NextResponse.json({ ok: true, raw, videoUrl: urls[0], thumbnailUrl: thumbnails[0] });
  } catch (error) {
    const status = error instanceof UseApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Lỗi poll job video';
    return NextResponse.json({ ok: false, message }, { status });
  }
}
