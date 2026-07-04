import prisma from "./prisma";

export async function createAuditLog(params: {
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  target: string;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        userEmail: params.userEmail,
        userName: params.userName,
        action: params.action,
        target: params.target,
        ipAddress: params.ipAddress || null,
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to create audit log:", error);
    return false;
  }
}
