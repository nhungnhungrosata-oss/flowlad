import { getServerEnv } from './env';
import { useapiFetch } from './client';
import { UseApiError } from './errors';
import { extractMediaGenerationId } from '@/lib/utils';

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_FILE_SIZE = 12 * 1024 * 1024;

export async function uploadAsset(file: File) {
  const { email } = getServerEnv();
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UseApiError(`File upload lỗi: ${file.name} không đúng định dạng PNG/JPG/WEBP`, 400);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new UseApiError(`File upload lỗi: ${file.name} vượt quá 12MB`, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const payload = await useapiFetch<unknown>(`/assets/${encodeURIComponent(email)}`, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: buffer
  });
  const mediaGenerationId = extractMediaGenerationId(payload);
  if (!mediaGenerationId) {
    throw new UseApiError(`File upload lỗi: ${file.name} không nhận được mediaGenerationId`, 502, payload);
  }
  return { mediaGenerationId, raw: payload, name: file.name };
}
