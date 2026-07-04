import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
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

    // Fetch all completed lessons for this user
    const completions = await prisma.userLessonProgress.findMany({
      where: {
        userId,
        status: "COMPLETED",
        completedAt: { not: null },
      },
      select: {
        completedAt: true,
      },
    });

    // Group completion count by date (YYYY-MM-DD) in Vietnam time
    const heatmap: { [dateStr: string]: number } = {};

    for (const c of completions) {
      if (c.completedAt) {
        // "en-CA" locale outputs date as YYYY-MM-DD
        const dateStr = c.completedAt.toLocaleDateString("en-CA", {
          timeZone: "Asia/Ho_Chi_Minh",
        });
        heatmap[dateStr] = (heatmap[dateStr] || 0) + 1;
      }
    }

    return NextResponse.json({
      success: true,
      heatmap,
    });
  } catch (error) {
    console.error("GET Study Heatmap Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
