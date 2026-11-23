import { ApiError } from "./game.ts";

export type SendOtp = (phone: string, otp: string) => Promise<void>;

export async function sendRenflairOtp(phone: string, otp: string): Promise<void> {
  const key = process.env.RENFLAIR_API_KEY;
  if (!key) throw new ApiError(503, "SMS verification is not configured.");
  const url = new URL("https://sms.renflair.in/V1.php");
  url.searchParams.set("API", key);
  url.searchParams.set("PHONE", phone);
  url.searchParams.set("OTP", otp);
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const body = await response.text();
    if (!response.ok || /\b(error|failed|invalid|insufficient)\b/i.test(body))
      throw new Error("SMS provider rejected the request.");
  } catch {
    throw new ApiError(502, "Could not send the verification code. Try again.");
  }
}
