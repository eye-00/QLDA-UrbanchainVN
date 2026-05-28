import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, savedHash] = passwordHash.split(":");
  if (!salt || !savedHash) return false;

  const hashedBuffer = Buffer.from(scryptSync(password, salt, 64).toString("hex"), "hex");
  const savedBuffer = Buffer.from(savedHash, "hex");

  if (hashedBuffer.length !== savedBuffer.length) return false;
  return timingSafeEqual(hashedBuffer, savedBuffer);
}
