import bcrypt from "bcryptjs";
import { z } from "zod";

export const passwordSchema = z.string()
  .min(8, "Пароль должен быть не короче 8 символов")
  .regex(/[A-Za-zА-Яа-я]/, "Пароль должен содержать хотя бы одну букву")
  .regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру");

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash?: string | null) {
  if (!passwordHash) return false;
  return bcrypt.compare(password, passwordHash);
}
