import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "Vui lòng nhập mã coupon" }, { status: 400 });
    }

    const uppercaseCode = code.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { code: uppercaseCode },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Mã giảm giá không hợp lệ" }, { status: 400 });
    }

    // Check expiry
    const now = new Date();
    if (new Date(coupon.expiresAt) < now) {
      return NextResponse.json({ error: "Mã giảm giá đã hết hạn sử dụng" }, { status: 400 });
    }

    // Check usage count limit
    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Mã giảm giá đã đạt giới hạn sử dụng" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
    });
  } catch (error) {
    console.error("Apply Coupon API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
