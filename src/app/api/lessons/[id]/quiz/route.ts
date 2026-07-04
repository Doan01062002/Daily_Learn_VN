import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(
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

    // 2. Verify that the lesson exists
    const lessonExists = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lessonExists) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // 3. Fetch quizzes for the lesson, excluding correctAnswer and explanation
    const quizzes = await prisma.quiz.findMany({
      where: { lessonId },
      select: {
        id: true,
        question: true,
        options: true,
      },
    });

    return NextResponse.json({
      success: true,
      quizzes,
    });
  } catch (error) {
    console.error("GET Lesson Quiz API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
