import { basename, join } from "path";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { getRequestContext } from "@/lib/request-context";
import { writeSecurityLog } from "@/lib/security-log";
import { enforceSecurityEventLimit } from "@/modules/security/rate-limit";
import { canDownloadProposalFile } from "@/permissions";

type DownloadRouteProps = {
  params: Promise<{ id: string }>;
};

const FILE_DOWNLOAD_ALERT_LIMIT_PER_DAY = 20;
const FILE_DOWNLOAD_BLOCK_LIMIT_PER_DAY = 50;

export async function GET(_request: Request, { params }: DownloadRouteProps) {
  const user = await getCurrentUser();
  const { id } = await params;
  const context = await getRequestContext();

  if (!user) {
    await writeSecurityLog({
      action: "FILE_DOWNLOAD_DENIED",
      entityType: "PROPOSAL",
      entityId: id,
      severity: "WARNING",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { reason: "unauthorized" }
    });
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const proposal = await prisma.commercialProposal.findUnique({
    where: { id },
    select: {
      id: true,
      createdById: true,
      responsibleId: true,
      fileUrl: true,
      fileName: true,
      fileMimeType: true
    }
  });

  if (!proposal?.fileUrl || !canDownloadProposalFile(user, proposal)) {
    await writeSecurityLog({
      action: "FILE_DOWNLOAD_DENIED",
      userId: user.id,
      entityType: "PROPOSAL",
      entityId: id,
      severity: "WARNING",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { reason: proposal?.fileUrl ? "permission" : "missing_file" }
    });
    return new NextResponse("Forbidden", { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const downloadLimit = await enforceSecurityEventLimit({
    userId: user.id,
    eventAction: "FILE_DOWNLOADED",
    deniedAction: "FILE_DOWNLOAD_DENIED",
    limit: FILE_DOWNLOAD_BLOCK_LIMIT_PER_DAY,
    since: today,
    entityType: "PROPOSAL",
    entityId: proposal.id,
    context,
    metadata: { reason: "rate_limit", fileName: proposal.fileName, limitRule: "proposal_file_downloads_per_day_block" }
  });
  if (!downloadLimit.allowed) {
    return new NextResponse("Слишком много скачиваний файлов за день", { status: 429 });
  }

  const fileName = basename(proposal.fileUrl);
  const filePath = join(process.cwd(), "public", "uploads", "proposals", fileName);
  let file: Buffer;
  try {
    file = await readFile(filePath);
  } catch (error) {
    await writeSecurityLog({
      action: "FILE_DOWNLOAD_DENIED",
      userId: user.id,
      entityType: "PROPOSAL",
      entityId: proposal.id,
      severity: "WARNING",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { reason: "file_not_found", fileName: proposal.fileName, storedFileName: fileName, error: error instanceof Error ? error.message : String(error) }
    });
    return new NextResponse("File not found", { status: 404 });
  }

  await writeSecurityLog({
    action: "FILE_DOWNLOADED",
    userId: user.id,
    entityType: "PROPOSAL",
    entityId: proposal.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: { fileName: proposal.fileName, storedFileName: fileName }
  });

  const downloadsToday = downloadLimit.count + 1;
  if (downloadsToday > FILE_DOWNLOAD_ALERT_LIMIT_PER_DAY) {
    await writeSecurityLog({
      action: "MASS_VIEW_DETECTED",
      userId: user.id,
      entityType: "USER",
      entityId: user.id,
      severity: "WARNING",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { rule: "proposal_file_downloads_per_day", downloadsToday }
    });
  }

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "content-type": proposal.fileMimeType ?? "application/octet-stream",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(proposal.fileName ?? fileName)}`
    }
  });
}
