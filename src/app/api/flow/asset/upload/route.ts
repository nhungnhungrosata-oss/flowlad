import { NextResponse } from 'next/server';
import { uploadAsset } from '@/lib/useapi/assets';
import { UseApiError } from '@/lib/useapi/errors';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: 'Không tìm thấy file upload' }, { status: 400 });
    }
    const uploaded = await uploadAsset(file);
    return NextResponse.json({ ok: true, ...uploaded });
  } catch (error) {
    const status = error instanceof UseApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Lỗi upload file';
    return NextResponse.json({ ok: false, message }, { status });
  }
}
