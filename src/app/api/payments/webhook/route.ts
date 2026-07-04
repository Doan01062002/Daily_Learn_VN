import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate webhook client via Authorization header
    const authHeader = req.headers.get("Authorization");
    const requiredToken = "Bearer mock-payment-webhook-secret-token";

    if (!authHeader || authHeader !== requiredToken) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid Webhook Signature/Token." },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const { txCode, status } = body as { txCode: string; status: string };

    if (!txCode || !status) {
      return NextResponse.json(
        { error: "Validation Error: txCode and status are required." },
        { status: 400 }
      );
    }

    // 3. Find the pending transaction in database
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { txCode },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 404 }
      );
    }

    if (transaction.status !== "PENDING") {
      return NextResponse.json(
        { error: `Transaction is already in status ${transaction.status}.` },
        { status: 400 }
      );
    }

    // 4. Update transaction status
    const updatedTransaction = await prisma.paymentTransaction.update({
      where: { txCode },
      data: {
        status: status === "COMPLETED" ? "COMPLETED" : "FAILED",
      },
    });

    // 5. Upgrade user role if payment completed successfully
    if (status === "COMPLETED") {
      await prisma.user.update({
        where: { id: transaction.userId },
        data: {
          role: "PREMIUM",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Transaction ${txCode} marked as ${updatedTransaction.status}. User updated accordingly.`,
      transactionStatus: updatedTransaction.status,
      userId: transaction.userId,
    });
  } catch (error) {
    console.error("POST Payment Webhook API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
