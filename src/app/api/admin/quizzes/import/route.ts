import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { quizzes } = body;

    if (!quizzes || !Array.isArray(quizzes)) {
      return NextResponse.json({ error: "Quizzes must be an array of questions" }, { status: 400 });
    }

    if (quizzes.length === 0) {
      return NextResponse.json({ error: "Quizzes array is empty" }, { status: 400 });
    }

    // Retrieve all active lesson IDs to validate existence in one query
    const allLessons = await prisma.lesson.findMany({ select: { id: true } });
    const activeLessonIds = new Set(allLessons.map((l) => l.id));

    // Validate structure and lesson reference of every item
    for (let i = 0; i < quizzes.length; i++) {
      const qz = quizzes[i];
      if (!qz.lessonId || !qz.question || !qz.options || !qz.correctAnswer) {
        return NextResponse.json({
          error: `Câu hỏi số ${i + 1} bị thiếu các trường bắt buộc (lessonId, question, options, correctAnswer).`
        }, { status: 400 });
      }

      if (!Array.isArray(qz.options) || qz.options.length < 2) {
        return NextResponse.json({
          error: `Câu hỏi số ${i + 1} phải có mảng đáp án (options) chứa ít nhất 2 lựa chọn.`
        }, { status: 400 });
      }

      if (!activeLessonIds.has(qz.lessonId)) {
        return NextResponse.json({
          error: `Mã bài học (lessonId) "${qz.lessonId}" tại câu hỏi số ${i + 1} không tồn tại trong hệ thống.`
        }, { status: 400 });
      }
    }

    // Insert many records
    const insertData = quizzes.map((qz) => ({
      lessonId: qz.lessonId,
      question: qz.question,
      options: qz.options,
      correctAnswer: qz.correctAnswer,
      explanation: qz.explanation || "",
    }));

    const result = await prisma.quiz.createMany({
      data: insertData,
    });

    return NextResponse.json({
      success: true,
      count: result.count,
    });
  } catch (error) {
    console.error("POST Admin Quizzes Import Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
