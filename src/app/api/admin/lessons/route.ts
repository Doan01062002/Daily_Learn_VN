import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all lessons ordered by creation time
  const lessons = await prisma.lesson.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: { quizzes: true },
      },
    },
  });

  return NextResponse.json({
    success: true,
    lessons,
  });
}

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
    const {
      title,
      tags,
      sourceDomain,
      summary,
      actionableStep,
      level,
      status,
      quizzes,
    } = body;

    // Validate required fields
    if (
      !title ||
      !tags ||
      !Array.isArray(tags) ||
      !sourceDomain ||
      !summary ||
      !Array.isArray(summary) ||
      !actionableStep ||
      !level
    ) {
      return NextResponse.json(
        { error: "Missing required fields in payload." },
        { status: 400 }
      );
    }

    // Create Lesson with nested Quizzes if present
    const lesson = await prisma.lesson.create({
      data: {
        title,
        tags,
        sourceDomain,
        summary,
        actionableStep,
        level,
        status: status || "DRAFT",
        quizzes:
          quizzes && Array.isArray(quizzes) && quizzes.length > 0
            ? {
                create: quizzes.map((q) => ({
                  question: q.question,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation,
                })),
              }
            : undefined,
      },
    });

    return NextResponse.json(
      {
        success: true,
        lesson,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Admin Lesson API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
