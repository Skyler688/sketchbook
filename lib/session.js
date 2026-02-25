import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined, failed to find in .env");
}

export function createSessionToken(user_id, username) {
  console.log("test->", user_id);
  return jwt.sign({ user_id: user_id, username: username }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function setSessionCookie(token) {
  return serialize("session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function validateToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

export function clearSessionCookie() {
  return serialize("session", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0), // Expires immediately.
  });
}
