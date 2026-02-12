import jwt from "jsonwebtoken";
import crypto from "crypto";

function mustEnv(name){
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 14);

const JWT_ACCESS_SECRET = mustEnv("JWT_ACCESS_SECRET");

export function signAccessToken({ userId }){
  const options = {
    expiresIn: ACCESS_TTL,
    issuer: process.env.JWT_ISSUER || undefined,
    audience: process.env.JWT_AUDIENCE || undefined,
  };

  return jwt.sign({ sub: userId }, JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token){
  const decoded = jwt.verify(token, JWT_ACCESS_SECRET, {
    issuer: process.env.JWT_ISSUER || undefined,
    audience: process.env.JWT_AUDIENCE || undefined,
  });

  if (typeof decoded === "string") return { sub: decoded };
  return decoded;
}

export function generateRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashRefreshToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function refreshTokenExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS);
  return expiresAt;
}
