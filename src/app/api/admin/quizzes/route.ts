import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { hasPermission } from "../../../../lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "manage_quizzes"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const lessonId = searchParams.get("lessonId") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (q) {
      where.question = { contains: q, mode: "insensitive" };
    }

    if (lessonId) {
      where.lessonId = lessonId;
    }

    // Count overall stats
    const totalCount = await prisma.quiz.count();
    const filteredCount = await prisma.quiz.count({ where });

    // Fetch paginated quizzes
    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        lesson: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
      skip,
      take: limit,
    });

    // Fetch simple list of lessons for dropdown select
    const lessons = await prisma.lesson.findMany({
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        title: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      totalCount: filteredCount,
      globalTotalCount: totalCount,
      totalPages: Math.ceil(filteredCount / limit),
      currentPage: page,
      quizzes: quizzes.map((qz) => ({
        id: qz.id,
        lessonId: qz.lessonId,
        lessonTitle: qz.lesson.title,
        question: qz.question,
        options: qz.options,
        correctAnswer: qz.correctAnswer,
        explanation: qz.explanation,
      })),
      lessons,
    });
  } catch (error) {
    console.error("GET Admin Quizzes Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "manage_quizzes"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { lessonId, question, options, correctAnswer, explanation } = body;

    if (!lessonId || !question || !options || !correctAnswer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: "Options must be an array with at least 2 choices" }, { status: 400 });
    }

    const cleanOptions = options.map((o: any) => String(o).trim());
    if (cleanOptions.some((o) => !o)) {
      return NextResponse.json({ error: "Lựa chọn đáp án không được để trống" }, { status: 400 });
    }

    const cleanCorrectAnswer = String(correctAnswer).trim();
    if (!cleanOptions.includes(cleanCorrectAnswer)) {
      return NextResponse.json({ error: "Đáp án đúng phải trùng khớp với một trong các lựa chọn" }, { status: 400 });
    }

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const newQuiz = await prisma.quiz.create({
      data: {
        lessonId,
        question: String(question).trim(),
        options: cleanOptions,
        correctAnswer: cleanCorrectAnswer,
        explanation: explanation || "",
      },
    });

    return NextResponse.json({
      success: true,
      quiz: newQuiz,
    });
  } catch (error) {
    console.error("POST Admin Quizzes Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "manage_quizzes"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, lessonId, question, options, correctAnswer, explanation } = body;

    if (!id || !lessonId || !question || !options || !correctAnswer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: "Options must be an array with at least 2 choices" }, { status: 400 });
    }

    const cleanOptions = options.map((o: any) => String(o).trim());
    if (cleanOptions.some((o) => !o)) {
      return NextResponse.json({ error: "Lựa chọn đáp án không được để trống" }, { status: 400 });
    }

    const cleanCorrectAnswer = String(correctAnswer).trim();
    if (!cleanOptions.includes(cleanCorrectAnswer)) {
      return NextResponse.json({ error: "Đáp án đúng phải trùng khớp với một trong các lựa chọn" }, { status: 400 });
    }

    // Verify quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
    });
    if (!existingQuiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data: {
        lessonId,
        question: String(question).trim(),
        options: cleanOptions,
        correctAnswer: cleanCorrectAnswer,
        explanation: explanation || "",
      },
    });

    return NextResponse.json({
      success: true,
      quiz: updatedQuiz,
    });
  } catch (error) {
    console.error("PUT Admin Quizzes Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "manage_quizzes"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing quiz ID" }, { status: 400 });
    }

    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
    });
    if (!existingQuiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    await prisma.quiz.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    console.error("DELETE Admin Quizzes Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
