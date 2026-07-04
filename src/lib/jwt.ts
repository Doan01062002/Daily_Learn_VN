import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "daily_learn_vn_fallback_jwt_secret_key_1234567890";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Signs a new JWT token for a user session
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

/**
 * Verifies and decodes a JWT token. Returns null if invalid or expired.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
