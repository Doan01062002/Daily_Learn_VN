import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { promises as fs } from "fs";
import path from "path";

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
      steps: lesson.steps,
    }));

    // 5. Apply daily quota calculations from settings
    let dailyLimit = 1;
    try {
      const filePath = path.join(process.cwd(), "src", "data", "settings.json");
      const data = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(data);
      dailyLimit = Number(parsed.freeDailyLimit) || 1;
    } catch (e) {
      // Fallback
      if (commitmentTime === 10) dailyLimit = 2;
      if (commitmentTime === 15) dailyLimit = 3;
    }

    // Unlimited access for PREMIUM or administrative/operator roles
    if (decoded.role === "PREMIUM" || decoded.role === "ADMIN" || decoded.role === "CTV" || decoded.role === "OPERATOR") {
      dailyLimit = 9999;
    }

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
        steps: lesson.steps,
      }));
    } else {
      // Slice to user's daily quota limit
      feed = feed.slice(0, dailyLimit);
    }

    // Ensure the two interactive mock lessons are always in the feed for testing purposes
    const mockLessonIds = ["ff311538-6cb9-4d6d-93df-a0b70071073c", "0bd10bce-4e68-4c23-8816-189b2babc092"];
    for (const mockId of mockLessonIds) {
      if (!feed.some(l => l.id === mockId)) {
        const foundMock = lessonsWithStatus.find(l => l.id === mockId);
        if (foundMock) {
          feed.unshift(foundMock);
        } else {
          // If not found in filtered list, fetch it directly from database to force append
          const dbMock = await prisma.lesson.findUnique({ where: { id: mockId } });
          if (dbMock) {
            feed.unshift({
              id: dbMock.id,
              title: dbMock.title,
              tags: dbMock.tags,
              sourceDomain: dbMock.sourceDomain,
              summary: dbMock.summary,
              actionableStep: dbMock.actionableStep,
              level: dbMock.level,
              completed: completedLessonIds.has(dbMock.id),
              steps: dbMock.steps,
            });
          }
        }
      }
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
