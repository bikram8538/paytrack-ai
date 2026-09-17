import { prisma } from "@/lib/prisma";

export async function audit(params: { companyId: string; userId?: string; action: string; entity: string; entityId?: string; metadata?: unknown }) {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: params.companyId,
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata as never,
      },
    });
  } catch {
    // Auditing must not break the primary business operation.
  }
}
