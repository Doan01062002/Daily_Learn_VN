import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export async function GET() {
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

    // 1. Count completed lessons
    const completedLessons = await prisma.userLessonProgress.count({
      where: {
        userId,
        status: "COMPLETED",
      },
    });

    // 2. Average quiz score
    const scoreAggregation = await prisma.userLessonProgress.aggregate({
      _avg: {
        score: true,
      },
      where: {
        userId,
        status: "COMPLETED",
      },
    });
    const averageQuizScore = scoreAggregation._avg.score || 0;

    // 3. Streak details
    const streakRecord = await prisma.streak.findUnique({
      where: { userId },
    });
    const currentStreak = streakRecord?.currentStreak || 0;
    const maxStreak = streakRecord?.maxStreak || 0;

    return NextResponse.json({
      success: true,
      stats: {
        completedLessons,
        averageQuizScore,
        currentStreak,
        maxStreak,
      },
    });
  } catch (error) {
    console.error("GET User Stats API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
