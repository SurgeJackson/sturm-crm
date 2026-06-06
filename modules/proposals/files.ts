import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { ProposalFileData } from "@/modules/proposals/form";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".xls", ".xlsx", ".doc", ".docx"]);
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "proposals");

export function safeProposalFileName(name: string) {
  const parsed = path.parse(name);
  const ext = parsed.ext.toLowerCase();
  const base = parsed.name.replace(/[^a-zA-Z0-9а-яА-Я_-]+/g, "-").slice(0, 80);
  return `${randomUUID()}-${base || "proposal"}${ext}`;
}

export function getProposalFile(formData: FormData) {
  const value = formData.get("file");
  if (!value || typeof value === "string" || value.size === 0) return null;
  return value;
}

export async function saveProposalFile(file: File, userId: string): Promise<ProposalFileData> {
  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error("Поддерживаются только PDF, XLS, XLSX, DOC и DOCX");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Файл КП не должен превышать 20 МБ");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const fileName = safeProposalFileName(file.name);
  const absolutePath = path.join(UPLOAD_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return {
    fileUrl: `/uploads/proposals/${fileName}`,
    fileName: file.name,
    fileSize: file.size,
    fileMimeType: file.type || "application/octet-stream",
    uploadedById: userId,
    uploadedAt: new Date()
  };
}
