import type { Request } from "express";
import { verifyAccessToken } from "../auth/tokens.js";
import { createLoaders, type Loaders } from "./loaders.js";

export interface AppContext {
  userId: string | null;
  refreshToken: string | null;
  loaders: Loaders;
}

export async function buildContext({ req }: { req: Request }): Promise<AppContext> {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  let userId: string | null = null;

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      userId = typeof payload.sub === "string" ? payload.sub : null;
    } catch {
      // invalid/expired access token -> userId stays null
    }
  }

  const refreshTokenHeader = req.headers["x-refresh-token"];
  const refreshToken =
    typeof refreshTokenHeader === "string" ? refreshTokenHeader : null;

  return { userId, refreshToken, loaders: createLoaders() };
}
