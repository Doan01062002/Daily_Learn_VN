import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

function getVNDateString(date: Date): string {
  return date.toLocaleDateString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;
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

    const userId = decoded.userId;

    // 2. Verify that the lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // 3. Mark the lesson as completed
    await prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // 4. Update the user's learning Streak
    const now = new Date();
    const todayStr = getVNDateString(now);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getVNDateString(yesterday);

    let streakRecord = await prisma.streak.findUnique({
      where: { userId },
    });

    let currentStreak = 1;
    let maxStreak = 1;

    if (!streakRecord) {
      // First time streak init
      streakRecord = await prisma.streak.create({
        data: {
          userId,
          currentStreak: 1,
          maxStreak: 1,
          lastCompleted: now,
        },
      });
      currentStreak = 1;
      maxStreak = 1;
    } else {
      const lastCompleted = streakRecord.lastCompleted;
      
      if (!lastCompleted) {
        currentStreak = 1;
        maxStreak = Math.max(streakRecord.maxStreak, 1);
      } else {
        const lastCompletedStr = getVNDateString(lastCompleted);

        if (lastCompletedStr === todayStr) {
          // Already completed a lesson today - keep current streak
          currentStreak = streakRecord.currentStreak;
          maxStreak = streakRecord.maxStreak;
        } else if (lastCompletedStr === yesterdayStr) {
          // Continuing streak from yesterday - increment
          currentStreak = streakRecord.currentStreak + 1;
          maxStreak = Math.max(streakRecord.maxStreak, currentStreak);
        } else {
          // Broke streak - reset to 1
          currentStreak = 1;
          maxStreak = Math.max(streakRecord.maxStreak, 1);
        }
      }

      // Update the Streak record in database
      streakRecord = await prisma.streak.update({
        where: { userId },
        data: {
          currentStreak,
          maxStreak,
          lastCompleted: now,
        },
      });
    }

    return NextResponse.json({
      success: true,
      streak: {
        currentStreak: streakRecord.currentStreak,
        maxStreak: streakRecord.maxStreak,
        lastCompleted: streakRecord.lastCompleted,
      },
    });
  } catch (error) {
    console.error("POST Complete Lesson API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
