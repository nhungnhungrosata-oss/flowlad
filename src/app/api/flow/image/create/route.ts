import { NextResponse } from 'next/server';
import { createImage, imageCreateSchema } from '@/lib/useapi/images';
import { UseApiError } from '@/lib/useapi/errors';
import { extractUrls } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const input = imageCreateSchema.parse(json);
    const raw = await createImage(input);
    const imageUrls = extractUrls(raw, ['fifeUrl', 'imageUrl', 'url', 'downloadUrl']);
    return NextResponse.json({ ok: true, imageUrls, raw });
  } catch (error) {
    const status = error instanceof UseApiError ? error.status : 400;
    const message = error instanceof Error ? error.message : 'Lỗi tạo hình ảnh';
    return NextResponse.json({ ok: false, message }, { status });
  }
}
