import { NextResponse } from 'next/server';
import { getAccount } from '@/lib/useapi/accounts';
import { UseApiError } from '@/lib/useapi/errors';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const data = await getAccount();
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    const status = error instanceof UseApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    return NextResponse.json({ ok: false, message }, { status });
  }
}
