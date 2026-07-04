import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    let token: string | undefined;

    // 1. Authenticate user
    const cookieStore = await cookies();
    token = cookieStore.get("token")?.value;

    if (!token) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch User and their Onboarding choices
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        progress: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle case where onboarding is not completed
    const interestedTopics = user.interestedTopics || [];
    const currentLevel = user.currentLevel || "Beginner";
    const commitmentTime = user.commitmentTime || 5;

    // 3. Query all PUBLISHED lessons matching user's level
    // We filter by tags (topics) that overlap with user's interested topics
    const matchingLessons = await prisma.lesson.findMany({
      where: {
        status: "PUBLISHED",
        level: currentLevel,
        tags: {
          hasSome: interestedTopics,
        },
      },
    });

    // 4. Map completion status
    const completedLessonIds = new Set(
      user.progress
        .filter((p) => p.status === "COMPLETED")
        .map((p) => p.lessonId)
    );

    const lessonsWithStatus = matchingLessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      tags: lesson.tags,
      sourceDomain: lesson.sourceDomain,
      summary: lesson.summary,
      actionableStep: lesson.actionableStep,
      level: lesson.level,
      completed: completedLessonIds.has(lesson.id),
    }));

    // 5. Apply daily quota calculations
    // commitmentTime: 5 mins -> 1 lesson, 10 mins -> 2 lessons, 15 mins -> 3 lessons
    let dailyLimit = 1;
    if (commitmentTime === 10) dailyLimit = 2;
    if (commitmentTime === 15) dailyLimit = 3;

    // Prioritize uncompleted lessons first
    const uncompleted = lessonsWithStatus.filter((l) => !l.completed);
    const completed = lessonsWithStatus.filter((l) => l.completed);

    let feed = [...uncompleted];
    if (feed.length < dailyLimit) {
      // If not enough new lessons, fill the remaining quota with already completed lessons
      feed = [...feed, ...completed];
    }

    // If still empty (e.g. no lessons matched topics), fallback to any published lessons
    if (feed.length === 0) {
      const fallbackLessons = await prisma.lesson.findMany({
        where: { status: "PUBLISHED" },
        take: dailyLimit,
      });
      feed = fallbackLessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        tags: lesson.tags,
        sourceDomain: lesson.sourceDomain,
        summary: lesson.summary,
        actionableStep: lesson.actionableStep,
        level: lesson.level,
        completed: completedLessonIds.has(lesson.id),
      }));
    } else {
      // Slice to user's daily quota limit
      feed = feed.slice(0, dailyLimit);
    }

    return NextResponse.json({
      success: true,
      lessons: feed,
    });
  } catch (error) {
    console.error("GET Today Lessons API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
