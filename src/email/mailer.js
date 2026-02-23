const RESEND_API_URL = "https://api.resend.com/emails";

function getBaseAppUrl() {
  return process.env.APP_URL || process.env.FRONTEND_URL || "http://localhost:3000";
}

export function buildPasswordResetUrl(token) {
  const url = new URL("/reset-password", getBaseAppUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

export async function sendPasswordResetEmail({ toEmail, resetUrl }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;

  if (!resendApiKey || !fromEmail) {
    console.info(
      `[password-reset] Email provider not configured. Reset link for ${toEmail}: ${resetUrl}`,
    );
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: "Reset your password",
      html: `<p>We received a request to reset your password.</p><p><a href=\"${resetUrl}\">Reset password</a></p><p>If you didn't request this, you can ignore this email.</p>`,
      text: `We received a request to reset your password.\n\nReset password: ${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to send password reset email: ${response.status} ${body}`);
  }
}
