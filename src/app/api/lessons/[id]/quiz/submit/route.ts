import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

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

    // 2. Parse request body
    const body = await req.json();
    const { answers } = body as {
      answers: Array<{ quizId: string; selectedAnswer: string }>;
    };

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Validation Error: answers array is required." },
        { status: 400 }
      );
    }

    // 3. Fetch all actual quizzes for the lesson from DB
    const dbQuizzes = await prisma.quiz.findMany({
      where: { lessonId },
    });

    if (dbQuizzes.length === 0) {
      return NextResponse.json(
        { error: "No quizzes found for this lesson." },
        { status: 404 }
      );
    }

    // 4. Score the answers
    let correctCount = 0;
    const results = dbQuizzes.map((quiz) => {
      const userAnswer = answers.find((ans) => ans.quizId === quiz.id);
      const selectedAnswer = userAnswer?.selectedAnswer || "";
      const isCorrect = selectedAnswer.trim().toLowerCase() === quiz.correctAnswer.trim().toLowerCase();

      if (isCorrect) {
        correctCount++;
      }

      return {
        quizId: quiz.id,
        isCorrect,
        correctAnswer: quiz.correctAnswer,
        explanation: quiz.explanation,
      };
    });

    const totalQuestions = dbQuizzes.length;
    const score = (correctCount / totalQuestions) * 100;

    // 5. Update UserLessonProgress score in PostgreSQL
    await prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        score: Math.round(score),
      },
      create: {
        userId,
        lessonId,
        score: Math.round(score),
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({
      success: true,
      score: Math.round(score),
      totalQuestions,
      correctAnswersCount: correctCount,
      results,
    });
  } catch (error) {
    console.error("POST Submit Quiz API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
