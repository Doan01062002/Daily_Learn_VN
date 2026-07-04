import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { hasPermission } from "../../../../lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "manage_payments"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // Build dynamic prisma filter
    const where: any = {};

    if (q) {
      where.OR = [
        { txCode: { contains: q, mode: "insensitive" } },
        {
          user: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    // 1. Fetch overall flow statistics
    const statsTotalCount = await prisma.paymentTransaction.count();
    const statsPendingCount = await prisma.paymentTransaction.count({
      where: { status: "PENDING" },
    });
    const statsFailedCount = await prisma.paymentTransaction.count({
      where: { status: "FAILED" },
    });
    const completedPayments = await prisma.paymentTransaction.findMany({
      where: { status: "COMPLETED" },
      select: { amount: true },
    });
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    // Count matching transactions under active filters
    const filteredCount = await prisma.paymentTransaction.count({ where });

    // 2. Fetch paginated transactions
    const transactions = await prisma.paymentTransaction.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalCount: statsTotalCount,
        pendingCount: statsPendingCount,
        failedCount: statsFailedCount,
        completedCount: statsTotalCount - statsPendingCount - statsFailedCount,
        totalRevenue,
      },
      totalCount: filteredCount,
      totalPages: Math.ceil(filteredCount / limit),
      currentPage: page,
      payments: transactions.map((t) => ({
        id: t.id,
        userId: t.userId,
        amount: t.amount,
        status: t.status,
        txCode: t.txCode,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        userName: t.user.name,
        userEmail: t.user.email,
        userAvatarUrl: t.user.avatarUrl,
        userRole: t.user.role,
      })),
    });
  } catch (error) {
    console.error("GET Admin Payments Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "manage_payments"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { transactionId, status, durationDays } = body;

    if (!transactionId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (status !== "COMPLETED" && status !== "FAILED" && status !== "PENDING") {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Update payment status
    const updatedTx = await prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: { status },
    });

    // If marked completed, promote corresponding user to PREMIUM with expiresAt limit
    if (status === "COMPLETED") {
      let expiresAt: Date | null = null;
      if (durationDays && Number(durationDays) !== 9999) {
        expiresAt = new Date(Date.now() + Number(durationDays) * 24 * 60 * 60 * 1000);
      }
      await prisma.user.update({
        where: { id: updatedTx.userId },
        data: { 
          role: "PREMIUM",
          premiumExpiresAt: expiresAt,
        },
      });
    }

    // Log action to Audit Logs
    try {
      const { createAuditLog } = await import("../../../../lib/audit");
      await createAuditLog({
        userId: decoded.userId,
        userEmail: decoded.email,
        userName: decoded.email.split("@")[0],
        action: "PROCESS_PAYMENT",
        target: `TxCode: ${updatedTx.txCode}, Status: ${status}`,
      });
    } catch (e) {
      console.error("Audit log payments update failed:", e);
    }

    return NextResponse.json({
      success: true,
      payment: updatedTx,
    });
  } catch (error) {
    console.error("PUT Admin Payments Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
