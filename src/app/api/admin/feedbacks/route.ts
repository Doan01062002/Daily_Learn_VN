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
    const priority = searchParams.get("priority") || "";
    const type = searchParams.get("type") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;

    const totalCount = await prisma.feedback.count({ where });
    const feedbacks = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true, avatarUrl: true },
        },
        lesson: {
          select: { title: true },
        },
        quiz: {
          select: { question: true },
        },
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      feedbacks,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("GET Admin Feedbacks Error:", error);
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
    const { id, status, priority, adminNote } = body;

    if (!id) {
      return NextResponse.json({ error: "Feedback ID is required." }, { status: 400 });
    }

    // Get current feedback to check status change
    const currentFeedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, name: true } },
        lesson: { select: { title: true } },
      },
    });

    if (!currentFeedback) {
      return NextResponse.json({ error: "Feedback not found." }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (adminNote !== undefined) updateData.adminNote = adminNote;

    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: updateData,
    });

    // Automatically send thank-you email if marked as DONE
    if (status === "DONE" && currentFeedback.status !== "DONE") {
      const lessonTitle = currentFeedback.lesson?.title || "học liệu";
      const subject = `[Daily Learn VN] Cảm ơn góp ý báo cáo lỗi học liệu`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333;">
          <h2 style="color: #991b1b;">Chào ${currentFeedback.user.name},</h2>
          <p>Cảm ơn bạn đã báo cáo lỗi học liệu cho bài học: <strong>${lessonTitle}</strong>.</p>
          <p>Đội ngũ biên tập của chúng tôi đã kiểm tra và tiến hành sửa đổi, hoàn thiện nội dung dựa trên đóng góp quý báu của bạn.</p>
          ${adminNote ? `<p><strong>Phản hồi từ Admin:</strong> <em>${adminNote}</em></p>` : ""}
          <p>Chúc bạn có những trải nghiệm học tập tuyệt vời cùng Daily Learn VN!</p>
          <br />
          <p>Trân trọng,</p>
          <p><strong>Ban quản trị Daily Learn VN</strong></p>
        </div>
      `;
      await sendEmail({
        to: currentFeedback.user.email,
        subject,
        html,
      });
    }

    return NextResponse.json({ success: true, feedback: updatedFeedback });
  } catch (error) {
    console.error("PUT Admin Feedback Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
