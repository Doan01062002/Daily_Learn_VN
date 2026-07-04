import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { hasPermission } from "../../../../lib/permissions";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded || !(await hasPermission(decoded.role, "manage_lessons"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const topic = searchParams.get("topic") || "";
  const level = searchParams.get("level") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "8", 10);
  const skip = (page - 1) * limit;

  // Build dynamic where filter
  const where: any = {};

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { sourceDomain: { contains: q, mode: "insensitive" } },
    ];
  }

  if (topic) {
    where.tags = {
      has: topic,
    };
  }

  if (level) {
    where.level = level;
  }

  if (status) {
    where.status = status;
  }

  // Count total matching lessons
  const totalCount = await prisma.lesson.count({ where });

  // Fetch paginated lessons
  const lessons = await prisma.lesson.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: { quizzes: true },
      },
      mediaFiles: true,
    },
    skip,
    take: limit,
  });

  // Count database-wide overview statistics
  const dbTotalLessons = await prisma.lesson.count();
  const dbPublishedLessons = await prisma.lesson.count({
    where: { status: "PUBLISHED" },
  });
  const dbDraftLessons = dbTotalLessons - dbPublishedLessons;

  return NextResponse.json({
    success: true,
    lessons,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    stats: {
      totalLessons: dbTotalLessons,
      publishedLessons: dbPublishedLessons,
      draftLessons: dbDraftLessons,
    },
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
    if (!decoded || !(await hasPermission(decoded.role, "manage_lessons"))) {
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
      assignment,
    } = body;

    // Validate required fields
    if (
      !title ||
      !tags ||
      !sourceDomain ||
      !summary ||
      !actionableStep ||
      !level
    ) {
      return NextResponse.json(
        { error: "Missing required fields: Vui lòng điền đầy đủ các thông tin bắt buộc." },
        { status: 400 }
      );
    }

    const titleClean = String(title).trim();
    const domainClean = String(sourceDomain).trim();
    const actionClean = String(actionableStep).trim();

    if (!titleClean || !domainClean || !actionClean) {
      return NextResponse.json(
        { error: "Tiêu đề, nguồn và hành động không được chỉ chứa khoảng trắng." },
        { status: 400 }
      );
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { error: "Phải chọn ít nhất 1 chủ đề (tag)." },
        { status: 400 }
      );
    }

    const summaryClean = Array.isArray(summary)
      ? summary.map((s: any) => String(s).trim()).filter((s) => s.length > 0)
      : [];
    if (summaryClean.length === 0) {
      return NextResponse.json(
        { error: "Bài viết phải có ít nhất 1 ý tóm tắt." },
        { status: 400 }
      );
    }

    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domainClean)) {
      return NextResponse.json(
        { error: "Nguồn bài học (domain) không hợp lệ (Ví dụ: techcrunch.com)." },
        { status: 400 }
      );
    }

    if (level !== "Beginner" && level !== "Experienced") {
      return NextResponse.json(
        { error: "Trình độ bài học không hợp lệ." },
        { status: 400 }
      );
    }

    // Create Lesson with nested Quizzes and optional Assignment if present
    const lesson = await prisma.lesson.create({
      data: {
        title: titleClean,
        tags,
        sourceDomain: domainClean,
        summary: summaryClean,
        actionableStep: actionClean,
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
        assignment:
          assignment && assignment.prompt
            ? {
                create: {
                  type: assignment.type,
                  prompt: assignment.prompt,
                },
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
