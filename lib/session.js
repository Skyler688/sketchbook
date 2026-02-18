import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET;

export function createSessionToken(user_id, username) {
  console.log("test->", user_id);
  return jwt.sign({ user_id: user_id, username: username }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function setSessionCookie(token) {
  return serialize("session", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}
