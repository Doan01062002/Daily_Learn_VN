import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

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

    const { userId } = decoded;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.knowledgePoints < 50) {
      return NextResponse.json(
        { error: "Không đủ điểm tri thức để mua thẻ bảo vệ (Yêu cầu 50 điểm)." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        knowledgePoints: user.knowledgePoints - 50,
        streakFreezes: user.streakFreezes + 1,
      },
    });

    return NextResponse.json({
      success: true,
      knowledgePoints: updatedUser.knowledgePoints,
      streakFreezes: updatedUser.streakFreezes,
    });
  } catch (error) {
    console.error("POST Buy Streak Freeze Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
