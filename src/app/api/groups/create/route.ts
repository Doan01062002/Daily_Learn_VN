import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

// Generate a random 6-character code
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Tên nhóm không hợp lệ" }, { status: 400 });
    }

    // Generate unique code
    let code = generateInviteCode();
    let codeExists = await prisma.studyGroup.findUnique({ where: { code } });
    
    // Retry if collision occurs
    while (codeExists) {
      code = generateInviteCode();
      codeExists = await prisma.studyGroup.findUnique({ where: { code } });
    }

    // Create group & membership in a transaction
    const newGroup = await prisma.$transaction(async (tx) => {
      const g = await tx.studyGroup.create({
        data: {
          name: name.trim(),
          code,
          createdById: decoded.userId,
        },
      });

      await tx.groupMembership.create({
        data: {
          groupId: g.id,
          userId: decoded.userId,
        },
      });

      return g;
    });

    return NextResponse.json({
      success: true,
      group: newGroup,
    });
  } catch (error) {
    console.error("POST Group Create API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
