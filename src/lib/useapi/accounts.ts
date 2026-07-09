import { getServerEnv } from './env';
import { UseApiError } from './errors';
import { useapiFetch } from './client';
import { configureCaptchaProviderIfAvailable } from './captcha';

export type FlowAccount = Record<string, unknown>;

function normalizeHealth(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.status === 'string') return record.status;
    if (typeof record.health === 'string') return record.health;
  }
  return undefined;
}

export async function getAccount() {
  const { email } = getServerEnv();
  try {
    const account = await useapiFetch<FlowAccount>(`/accounts/${encodeURIComponent(email)}`);
    const health = normalizeHealth(account.health) || normalizeHealth(account.status) || 'UNKNOWN';
    return { email, account, health };
  } catch (error) {
    if (error instanceof UseApiError && error.status === 404) {
      throw new UseApiError('Email Google Flow chưa được kết nối với useapi.net', 404, error.details);
    }
    throw error;
  }
}

export async function ensureHealthyAccount() {
  await configureCaptchaProviderIfAvailable();
  const account = await getAccount();
  if (account.health.toUpperCase() !== 'OK') {
    throw new UseApiError(`Account health lỗi: ${account.health}`, 400, account.account);
  }
  return account;
}
