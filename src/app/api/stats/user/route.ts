import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export async function GET(req?: Request) {
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

    // Helper to format date in Vietnam timezone
    const getVNDateString = (date: Date) => {
      return date.toLocaleDateString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
    };

    // 3. Streak details & automatic freeze consumption
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { streaks: true },
    });

    let currentStreak = 0;
    let maxStreak = 0;
    let streakFrozenUsed = false;

    if (user && user.streaks[0]) {
      const streakRecord = user.streaks[0];
      currentStreak = streakRecord.currentStreak;
      maxStreak = streakRecord.maxStreak;

      if (currentStreak > 0 && streakRecord.lastCompleted) {
        const now = new Date();
        const todayStr = getVNDateString(now);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getVNDateString(yesterday);

        const lastCompletedStr = getVNDateString(streakRecord.lastCompleted);

        if (lastCompletedStr !== todayStr && lastCompletedStr !== yesterdayStr) {
          // Streak is broken!
          if (user.streakFreezes > 0) {
            // Consume a freeze!
            await prisma.user.update({
              where: { id: userId },
              data: { streakFreezes: { decrement: 1 } },
            });

            await prisma.streak.update({
              where: { userId },
              data: { lastCompleted: yesterday },
            });

            streakFrozenUsed = true;
          } else {
            // Reset streak to 0
            await prisma.streak.update({
              where: { userId },
              data: { currentStreak: 0 },
            });
            currentStreak = 0;
          }
        }
      }
    }

    // Fetch recently completed lessons for activity timeline log
    const timelineProgress = await prisma.userLessonProgress.findMany({
      where: {
        userId,
        status: "COMPLETED",
        completedAt: { not: null },
      },
      include: {
        lesson: {
          select: {
            title: true,
            tags: true,
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
      take: 10,
    });

    const timeline = timelineProgress.map((tp) => ({
      lessonId: tp.lessonId,
      title: tp.lesson.title,
      tags: tp.lesson.tags,
      score: tp.score,
      completedAt: tp.completedAt,
    }));

    // 4. Calculate competency category progress (Tech, Business, SoftSkills, Design, Health)
    const allLessons = await prisma.lesson.findMany({
      select: {
        id: true,
        tags: true,
      },
    });

    const userCompleted = await prisma.userLessonProgress.findMany({
      where: {
        userId,
        status: "COMPLETED",
      },
      include: {
        lesson: {
          select: {
            tags: true,
          },
        },
      },
    });

    const CATEGORIES = ["Tech", "Business", "SoftSkills", "Design", "Health"];
    const competencyData = CATEGORIES.map((cat) => {
      const catLessons = allLessons.filter((l) => l.tags.includes(cat));
      const total = catLessons.length;

      const catCompleted = userCompleted.filter((uc) => uc.lesson.tags.includes(cat));
      const completed = catCompleted.length;

      const scores = catCompleted.filter((uc) => uc.score !== null).map((uc) => uc.score as number);
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        category: cat,
        completed,
        total,
        progress,
        avgScore: Math.round(avgScore),
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        completedLessons,
        averageQuizScore,
        currentStreak,
        maxStreak,
      },
      streakFrozenUsed,
      timeline,
      competencies: competencyData,
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
