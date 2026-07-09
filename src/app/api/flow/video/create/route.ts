import { NextResponse } from 'next/server';
import { createVideo, videoCreateSchema } from '@/lib/useapi/videos';
import { UseApiError } from '@/lib/useapi/errors';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const input = videoCreateSchema.parse(json);
    const result = await createVideo(input);
    return NextResponse.json({ ok: true, jobId: result.jobId, raw: result.raw });
  } catch (error) {
    const status = error instanceof UseApiError ? error.status : 400;
    const message = error instanceof Error ? error.message : 'Lỗi tạo video';
    return NextResponse.json({ ok: false, message }, { status });
  }
}
