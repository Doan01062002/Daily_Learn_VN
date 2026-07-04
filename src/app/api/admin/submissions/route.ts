import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== "ADMIN" && decoded.role !== "CTV" && decoded.role !== "OPERATOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const totalCount = await prisma.submission.count({ where });
    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, avatarUrl: true } },
        assignment: {
          include: {
            lesson: { select: { title: true } },
          },
        },
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      submissions,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("GET Admin Submissions Error:", error);
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
    if (!decoded || (decoded.role !== "ADMIN" && decoded.role !== "CTV" && decoded.role !== "OPERATOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, score, comment, grammarEdits } = body;

    if (!id || score === undefined || score === null) {
      return NextResponse.json({ error: "Submission ID and score are required." }, { status: 400 });
    }

    const numericScore = parseInt(score, 10);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      return NextResponse.json({ error: "Score must be a number between 0 and 100." }, { status: 400 });
    }

    const currentSubmission = await prisma.submission.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, name: true } },
        assignment: {
          include: {
            lesson: { select: { title: true } },
          },
        },
      },
    });

    if (!currentSubmission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        status: "GRADED",
        score: numericScore,
        comment: comment || null,
        grammarEdits: grammarEdits || null,
        gradedById: decoded.userId,
        gradedAt: new Date(),
      },
    });

    // Send result email to student
    try {
      const lessonTitle = currentSubmission.assignment.lesson.title;
      const typeText = currentSubmission.assignment.type === "WRITING" ? "Bài viết" : "Phát âm / Nói";
      const subject = `[Daily Learn VN] Kết quả chấm điểm bài tập tự luận - ${lessonTitle}`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333;">
          <h2 style="color: #991b1b;">Chào ${currentSubmission.user.name},</h2>
          <p>Bài tập tự luận (${typeText}) của bạn cho bài học <strong>${lessonTitle}</strong> đã được chấm điểm.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748B; tracking-wider: 1px; display: block; margin-bottom: 5px;">Điểm số đạt được</span>
            <span style="font-size: 36px; font-weight: 900; color: #991b1b;">${numericScore} / 100</span>
          </div>

          ${grammarEdits ? `
            <div style="margin-top: 20px;">
              <h3 style="color: #1e3a8a; border-bottom: 2px solid #eff6ff; padding-bottom: 5px;">Chi tiết sửa lỗi ngữ pháp / câu từ:</h3>
              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 15px; border-radius: 8px; font-family: monospace; white-space: pre-wrap;">${grammarEdits}</div>
            </div>
          ` : ""}

          ${comment ? `
            <div style="margin-top: 20px;">
              <h3 style="color: #1e3a8a; border-bottom: 2px solid #eff6ff; padding-bottom: 5px;">Nhận xét chung từ giáo viên:</h3>
              <p style="font-style: italic;">"${comment}"</p>
            </div>
          ` : ""}

          <p style="margin-top: 30px;">Tiếp tục phát huy và học tập chăm chỉ mỗi ngày nhé!</p>
          <br />
          <p>Trân trọng,</p>
          <p><strong>Ban đào tạo Daily Learn VN</strong></p>
        </div>
      `;

      await sendEmail({
        to: currentSubmission.user.email,
        subject,
        html,
      });
    } catch (mailErr) {
      console.error("Failed to send grading email:", mailErr);
    }

    return NextResponse.json({ success: true, submission: updatedSubmission });
  } catch (error) {
    console.error("PUT Admin Submission Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
