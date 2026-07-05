import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch quizzes with their lesson tags / titles
    const quizzes = await prisma.quiz.findMany({
      where: {
        lesson: {
          status: "PUBLISHED"
        }
      },
      include: {
        lesson: {
          select: { title: true }
        }
      }
    });

    if (quizzes.length === 0) {
      return NextResponse.json({ success: true, quizzes: [] });
    }

    // Shuffle and slice 5
    const shuffled = [...quizzes].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5).map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      lessonTitle: q.lesson.title
    }));

    return NextResponse.json({
      success: true,
      quizzes: selected
    });
  } catch (error) {
    console.error("GET Speedrun Quizzes Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
