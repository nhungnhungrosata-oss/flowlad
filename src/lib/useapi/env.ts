export const USEAPI_BASE_URL = 'https://api.useapi.net/v1/google-flow';

function readRequiredEnv(names: string[], label: string) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }

  throw new Error(
    `Chưa cấu hình ${label}. Trên Vercel vào Project Settings → Environment Variables, thêm một trong các biến: ${names.join(
      ' hoặc '
    )}, chọn đúng môi trường Production/Preview, rồi Redeploy.`
  );
}

export function getServerEnv() {
  const token = readRequiredEnv(['USEAPI_TOKEN', 'USEAPI_API_TOKEN', 'NEXT_PRIVATE_USEAPI_TOKEN'], 'USEAPI_TOKEN');
  const email = readRequiredEnv(['GOOGLE_FLOW_EMAIL', 'FLOW_EMAIL', 'USEAPI_GOOGLE_FLOW_EMAIL'], 'GOOGLE_FLOW_EMAIL');
  const antiCaptchaKey = process.env.ANTICAPTCHA_API_KEY?.trim();

  return { token, email, antiCaptchaKey };
}
