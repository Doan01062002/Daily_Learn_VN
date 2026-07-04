import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";
import { hasPermission } from "../../../../../../lib/permissions";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "view_analytics"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, lessonId } = body;

    if (!userId || !lessonId) {
      return NextResponse.json({ error: "Missing userId or lessonId" }, { status: 400 });
    }

    const [user, lesson] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.lesson.findUnique({ where: { id: lessonId } }),
    ]);

    if (!user || !lesson) {
      return NextResponse.json({ error: "User or Lesson not found" }, { status: 404 });
    }

    // Send supportive email
    const subject = `[Daily Learn VN] Hỗ trợ học tập bài học: ${lesson.title}`;
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #991b1b; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-top: 0;">Daily Learn VN • Hỗ trợ Học tập</h2>
        <p style="font-size: 14px; color: #0f172a; line-height: 1.6;">Chào <strong>${user.name}</strong>,</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Hệ thống ghi nhận bạn đang tham gia luyện tập bài học <strong>"${lesson.title}"</strong> nhưng chưa vượt qua được bài thi trắc nghiệm. Đừng lo lắng nhé! Học tập là một quá trình kiên trì tích lũy.
        </p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Dưới đây là một số mẹo nhỏ giúp bạn ôn tập tốt hơn:
        </p>
        <ul style="font-size: 13px; color: #475569; line-height: 1.6; padding-left: 20px;">
          <li>Đọc kỹ lại phần tóm tắt bài học (summary) trên màn hình chính.</li>
          <li>Chú ý các keyword và ví dụ thực tế được nêu trong nội dung bài học.</li>
          <li>Ghi lại các câu sai để ghi nhớ từ vựng và cấu trúc ngữ pháp kỹ hơn.</li>
        </ul>
        <p style="font-size: 14px; color: #334155; line-height: 1.6; background-color: #f8fafc; padding: 14px; border-radius: 10px; border-left: 4px solid #991b1b;">
          Nếu bạn cần thêm giải thích chi tiết, bạn có thể phản hồi trực tiếp email này hoặc liên hệ Hotline Hỗ trợ học viên để được giải đáp 1-1. Chúc bạn sớm vượt qua bài thi!
        </p>
        <div style="text-align: center; margin-top: 28px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="background-color: #991b1b; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold; display: inline-block;">Quay lại học tập</a>
        </div>
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #f1f5f9; pt: 16px;">
          Email được gửi tự động bởi hệ thống chăm sóc học viên Daily Learn VN.
        </p>
      </div>
    `;

    const success = await sendEmail({
      to: user.email,
      subject,
      html: htmlBody,
    });

    // Log the assistance action in Audit Logs
    try {
      const { createAuditLog } = await import("../../../../../../lib/audit");
      await createAuditLog({
        userId: decoded.userId,
        userEmail: decoded.email,
        userName: decoded.email.split("@")[0],
        action: "SEND_STUDENT_ASSISTANCE",
        target: `User: ${user.email}, Lesson: ${lesson.title}`,
      });
    } catch (e) {
      console.error("Audit log send assistance failed:", e);
    }

    return NextResponse.json({ success });
  } catch (error) {
    console.error("POST Struggling assist API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
