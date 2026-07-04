import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { hasPermission } from "../../../../../lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "view_analytics"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Fetch all failed attempts
    const failedAttempts = await prisma.quizAttempt.findMany({
      where: { passed: false },
      select: {
        userId: true,
        lessonId: true,
        score: true,
      },
    });

    // 2. Group by userId + lessonId in memory
    const groupings: Record<string, { userId: string; lessonId: string; count: number; failedScores: number[] }> = {};
    for (const att of failedAttempts) {
      const key = `${att.userId}_${att.lessonId}`;
      if (!groupings[key]) {
        groupings[key] = {
          userId: att.userId,
          lessonId: att.lessonId,
          count: 0,
          failedScores: [],
        };
      }
      groupings[key].count++;
      groupings[key].failedScores.push(att.score);
    }

    // 3. Filter candidates struggling (failed count >= 3)
    const strugglingCandidates = Object.values(groupings).filter((g) => g.count >= 3);

    // 4. Hydrate user and lesson details
    const strugglingList = await Promise.all(
      strugglingCandidates.map(async (c) => {
        const [user, lesson] = await Promise.all([
          prisma.user.findUnique({
            where: { id: c.userId },
            select: { name: true, email: true },
          }),
          prisma.lesson.findUnique({
            where: { id: c.lessonId },
            select: { title: true },
          }),
        ]);

        return {
          userId: c.userId,
          lessonId: c.lessonId,
          userName: user?.name || "Học viên ẩn danh",
          userEmail: user?.email || "",
          lessonTitle: lesson?.title || "Bài học",
          failedCount: c.count,
          failedScores: c.failedScores,
        };
      })
    );

    return NextResponse.json({
      success: true,
      struggling: strugglingList,
    });
  } catch (error) {
    console.error("GET Admin Struggling Students Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
