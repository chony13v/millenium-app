import { sha256 } from "js-sha256";

function ensureString(value: unknown, label: string): asserts value is string {
  if (value === null || value === undefined) {
    throw new Error(`${label} is required`);
  }
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string`);
  }
  if (value.length === 0) {
    throw new Error(`${label} cannot be empty`);
  }
}

/** SHA-256 hexadecimal de `${salt}:${userId}`. Funciona en RN y Node. */
export function hashUserId(userId: string, salt: string): string {
  ensureString(userId, "userId");
  ensureString(salt, "salt");
  const payload = `${salt}:${userId}`;
  return sha256(payload);
}
