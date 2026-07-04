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
    const body = await req.json();
    const { lessonId } = body;

    if (!lessonId) {
      return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Toggle lessonId in savedLessonIds array
    let updatedIds = [...user.savedLessonIds];
    const index = updatedIds.indexOf(lessonId);

    if (index > -1) {
      // Remove if exists
      updatedIds.splice(index, 1);
    } else {
      // Add if doesn't exist
      updatedIds.push(lessonId);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        savedLessonIds: updatedIds,
      },
    });

    return NextResponse.json({
      success: true,
      savedLessonIds: updatedUser.savedLessonIds,
    });
  } catch (error) {
    console.error("POST Toggle Bookmark Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch details of all lessons in savedLessonIds
    const savedLessons = await prisma.lesson.findMany({
      where: {
        id: { in: user.savedLessonIds },
      },
    });

    // We need to check completion status for these lessons as well
    const progresses = await prisma.userLessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: user.savedLessonIds },
      },
    });

    const lessonsWithStatus = savedLessons.map((l) => {
      const prog = progresses.find((p) => p.lessonId === l.id);
      return {
        id: l.id,
        title: l.title,
        tags: l.tags,
        sourceDomain: l.sourceDomain,
        summary: l.summary,
        actionableStep: l.actionableStep,
        level: l.level,
        completed: prog ? prog.status === "COMPLETED" : false,
      };
    });

    return NextResponse.json({
      success: true,
      bookmarks: lessonsWithStatus,
    });
  } catch (error) {
    console.error("GET Bookmarks Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
