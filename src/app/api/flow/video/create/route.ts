import { NextResponse } from 'next/server';
import { createVideo, videoCreateSchema } from '@/lib/useapi/videos';
import { UseApiError } from '@/lib/useapi/errors';
import { extractJobId } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const input = videoCreateSchema.parse(json);
    const raw = await createVideo(input);
    const jobId = extractJobId(raw);
    if (!jobId) {
      return NextResponse.json({ ok: false, message: 'Không nhận được jobId từ useapi.net', raw }, { status: 502 });
    }
    return NextResponse.json({ ok: true, jobId, raw });
  } catch (error) {
    const status = error instanceof UseApiError ? error.status : 400;
    const message = error instanceof Error ? error.message : 'Lỗi tạo video';
    return NextResponse.json({ ok: false, message }, { status });
  }
}
