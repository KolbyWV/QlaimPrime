import crypto from "crypto";

const RESET_TOKEN_TTL_MINUTES = Number(
  process.env.RESET_PASSWORD_TOKEN_TTL_MINUTES || 30,
);

export function generatePasswordResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function passwordResetTokenExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + RESET_TOKEN_TTL_MINUTES);
  return expiresAt;
}
