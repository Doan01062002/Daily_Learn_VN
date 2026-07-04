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
    const { groupId, receiverId, emoji } = body;

    const allowedEmojis = ["🔥", "👏", "💪"];

    if (!groupId || !receiverId || !emoji || !allowedEmojis.includes(emoji)) {
      return NextResponse.json({ error: "Dữ liệu phản hồi không hợp lệ" }, { status: 400 });
    }

    // 1. Verify sender membership
    const senderMember = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: decoded.userId,
        },
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    if (!senderMember) {
      return NextResponse.json({ error: "Bạn không phải thành viên nhóm này" }, { status: 403 });
    }

    // 2. Verify receiver membership
    const receiverMember = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: receiverId,
        },
      },
    });

    if (!receiverMember) {
      return NextResponse.json({ error: "Người nhận không thuộc nhóm học này" }, { status: 404 });
    }

    // 3. Create group reaction
    const reaction = await prisma.groupReaction.create({
      data: {
        groupId,
        senderId: decoded.userId,
        senderName: senderMember.user.name,
        receiverId,
        emoji,
      },
    });

    return NextResponse.json({
      success: true,
      reaction,
    });
  } catch (error) {
    console.error("POST Group React API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
