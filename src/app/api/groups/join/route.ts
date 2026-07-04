import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

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

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Mã nhóm không hợp lệ" }, { status: 400 });
    }

    const upperCode = code.trim().toUpperCase();

    // 1. Find group by code
    const group = await prisma.studyGroup.findUnique({
      where: { code: upperCode },
    });

    if (!group) {
      return NextResponse.json({ error: "Không tìm thấy nhóm học tập với mã này" }, { status: 404 });
    }

    // 2. Check if user is already a member
    const existingMembership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: decoded.userId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ error: "Bạn đã tham gia nhóm này rồi" }, { status: 400 });
    }

    // 3. Create membership
    await prisma.groupMembership.create({
      data: {
        groupId: group.id,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã tham gia nhóm ${group.name} thành công`,
      group,
    });
  } catch (error) {
    console.error("POST Group Join API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
