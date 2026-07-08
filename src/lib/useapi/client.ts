import { USEAPI_BASE_URL, getServerEnv } from './env';
import { UseApiError, safeProviderMessage } from './errors';

const DEFAULT_TIMEOUT_MS = 90_000;

export async function useapiFetch<T>(path: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const { token } = getServerEnv();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(`${USEAPI_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
      cache: 'no-store'
    });

    const text = await res.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { message: text };
      }
    }

    if (!res.ok) {
      throw new UseApiError(safeProviderMessage(payload, `useapi.net trả lỗi HTTP ${res.status}`), res.status, payload);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof UseApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new UseApiError('Request tới useapi.net quá thời gian chờ', 504);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
