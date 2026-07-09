export const USEAPI_BASE_URL = 'https://api.useapi.net/v1/google-flow';

export function getServerEnv() {
  const token = process.env.USEAPI_TOKEN;
  const email = process.env.GOOGLE_FLOW_EMAIL;
  const antiCaptchaKey = process.env.ANTICAPTCHA_API_KEY;

  if (!token) {
    throw new Error('Chưa cấu hình USEAPI_TOKEN trong .env.local');
  }
  if (!email) {
    throw new Error('Chưa cấu hình GOOGLE_FLOW_EMAIL trong .env.local');
  }
  return { token, email, antiCaptchaKey };
}
