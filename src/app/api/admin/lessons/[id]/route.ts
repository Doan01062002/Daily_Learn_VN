import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { hasPermission } from "../../../../../lib/permissions";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;
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
    const { title, tags, sourceDomain, summary, actionableStep, level } = body;

    const updateData: any = { ...body };

    if (title !== undefined) {
      const titleClean = String(title).trim();
      if (!titleClean) {
        return NextResponse.json({ error: "Tiêu đề không được để trống." }, { status: 400 });
      }
      updateData.title = titleClean;
    }

    if (sourceDomain !== undefined) {
      const domainClean = String(sourceDomain).trim();
      const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domainClean)) {
        return NextResponse.json({ error: "Nguồn bài học (domain) không hợp lệ (Ví dụ: techcrunch.com)." }, { status: 400 });
      }
      updateData.sourceDomain = domainClean;
    }

    if (actionableStep !== undefined) {
      const actionClean = String(actionableStep).trim();
      if (!actionClean) {
        return NextResponse.json({ error: "Hành động áp dụng không được để trống." }, { status: 400 });
      }
      updateData.actionableStep = actionClean;
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags) || tags.length === 0) {
        return NextResponse.json({ error: "Phải chọn ít nhất 1 chủ đề (tag)." }, { status: 400 });
      }
    }

    if (summary !== undefined) {
      if (!Array.isArray(summary)) {
        return NextResponse.json({ error: "Tóm tắt phải là một danh sách." }, { status: 400 });
      }
      const summaryClean = summary.map((s: any) => String(s).trim()).filter((s) => s.length > 0);
      if (summaryClean.length === 0) {
        return NextResponse.json({ error: "Bài viết phải có ít nhất 1 ý tóm tắt." }, { status: 400 });
      }
      updateData.summary = summaryClean;
    }

    if (level !== undefined) {
      if (level !== "Beginner" && level !== "Experienced") {
        return NextResponse.json({ error: "Trình độ bài học không hợp lệ." }, { status: 400 });
      }
    }

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      lesson,
    });
  } catch (error) {
    console.error("PUT Admin Lesson API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "manage_lessons"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    return NextResponse.json({
      success: true,
      message: "Lesson deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE Admin Lesson API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
