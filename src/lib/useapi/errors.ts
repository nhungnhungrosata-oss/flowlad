export class UseApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = 'UseApiError';
    this.status = status;
    this.details = details;
  }
}

export function safeProviderMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const msg = record.error || record.message || record.statusText;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}
