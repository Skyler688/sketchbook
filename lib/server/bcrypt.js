export const runtime = "nodejs";

import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, hashed_password) {
  return await bcrypt.compare(password, hashed_password);
}
