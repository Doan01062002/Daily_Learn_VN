import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { hasPermission } from "../../../../lib/permissions";

export const dynamic = "force-dynamic";

// GET: List all coupons
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "manage_settings"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    console.error("GET Admin Coupons Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Create a new coupon
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "manage_settings"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { code, discountPercent, maxUses, expiresAt } = body;

    if (!code || discountPercent === undefined || maxUses === undefined || !expiresAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const uppercaseCode = code.trim().toUpperCase();
    const codeRegex = /^[A-Z0-9_-]+$/;
    if (!codeRegex.test(uppercaseCode)) {
      return NextResponse.json({ error: "Mã coupon chỉ được chứa chữ cái, số, dấu gạch ngang hoặc gạch dưới" }, { status: 400 });
    }

    const pct = parseInt(discountPercent, 10);
    if (isNaN(pct) || pct < 1 || pct > 100) {
      return NextResponse.json({ error: "Phần trăm giảm giá phải từ 1 đến 100" }, { status: 400 });
    }

    const uses = parseInt(maxUses, 10);
    if (isNaN(uses) || uses < 1) {
      return NextResponse.json({ error: "Số lượt sử dụng tối đa phải lớn hơn hoặc bằng 1" }, { status: 400 });
    }

    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      return NextResponse.json({ error: "Ngày hết hạn phải ở tương lai" }, { status: 400 });
    }

    // Check if code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: uppercaseCode },
    });

    if (existing) {
      return NextResponse.json({ error: "Mã coupon đã tồn tại" }, { status: 400 });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: uppercaseCode,
        discountPercent: pct,
        maxUses: uses,
        expiresAt: expiryDate,
      },
    });

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error) {
    console.error("POST Admin Coupons Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
