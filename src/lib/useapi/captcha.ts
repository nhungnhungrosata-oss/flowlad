import { getServerEnv } from './env';
import { useapiFetch } from './client';

let configuredThisRuntime = false;

export async function configureCaptchaProviderIfAvailable() {
  if (configuredThisRuntime) return;

  const { antiCaptchaKey } = getServerEnv();
  if (!antiCaptchaKey) return;

  await useapiFetch<Record<string, unknown>>('/accounts/captcha-providers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ AntiCaptcha: antiCaptchaKey })
  });

  configuredThisRuntime = true;
}
