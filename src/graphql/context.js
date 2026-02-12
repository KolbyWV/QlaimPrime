
import { verifyAccessToken } from "../auth/tokens.js";


export async function buildContext({ req }){
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  let userId = null;

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

  return { userId, refreshToken };
}
