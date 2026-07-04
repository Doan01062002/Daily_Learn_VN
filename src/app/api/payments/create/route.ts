import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    let token: string | undefined;

    // 1. Authenticate user
    const cookieStore = await cookies();
    token = cookieStore.get("token")?.value;

    if (!token) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = decoded.userId;

    // 2. Generate unique transaction code (txCode)
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 900 + 100); // 3-digit random number
    const txCode = `DLVN${timestamp}${randomSuffix}`;

    // 3. Create PENDING transaction in database
    const transaction = await prisma.paymentTransaction.create({
      data: {
        userId,
        amount: 99000,
        status: "PENDING",
        txCode,
      },
    });

    // 4. Construct VietQR link
    const accountNumber = "102870102002";
    const accountName = "NGUYEN VAN DOAN";
    const amountStr = "99000";
    const qrCodeUrl = `https://img.vietqr.io/image/ICB-${accountNumber}-compact.png?amount=${amountStr}&addInfo=${txCode}&accountName=${encodeURIComponent(accountName)}`;

    return NextResponse.json({
      success: true,
      transaction: {
        txCode: transaction.txCode,
        amount: transaction.amount,
        bankName: "VietinBank (ICB)",
        accountNumber,
        accountName,
        qrCodeUrl,
      },
    });
  } catch (error) {
    console.error("POST Create Payment API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
