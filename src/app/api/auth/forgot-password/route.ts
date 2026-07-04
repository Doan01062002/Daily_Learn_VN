import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email: rawEmail, newPassword } = body;

    if (!rawEmail || !newPassword) {
      return NextResponse.json(
        { error: "Vui lòng nhập địa chỉ Email và Mật khẩu mới." },
        { status: 400 }
      );
    }

    const email = rawEmail.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Định dạng Email không hợp lệ." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu mới phải có độ dài từ 6 ký tự trở lên." },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản liên kết với địa chỉ Email này." },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(newPassword);

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Save OTP verification to database
    await prisma.otpVerification.upsert({
      where: { email },
      update: {
        otpCode,
        name: existingUser.name,
        password: hashedPassword,
        expiresAt,
      },
      create: {
        email,
        otpCode,
        name: existingUser.name,
        password: hashedPassword,
        expiresAt,
      },
    });

    const { sendEmail } = await import("@/lib/notifications");
    const subject = "[Daily Learn VN] Mã xác thực đặt lại mật khẩu";
    const html = `
      <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333;">
        <h2 style="color: #991b1b;">Chào ${existingUser.name},</h2>
        <p>Bạn đã gửi yêu cầu đặt lại mật khẩu cho tài khoản Daily Learn VN của mình.</p>
        <p>Dưới đây là mã xác thực (OTP) đặt lại mật khẩu của bạn. Mã này có hiệu lực trong vòng 5 phút:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin: 20px 0; text-align: center;">
          <span style="font-size: 28px; font-weight: 900; color: #991b1b; letter-spacing: 4px;">${otpCode}</span>
        </div>

        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và mật khẩu của bạn sẽ giữ nguyên.</p>
        <br />
        <p>Trân trọng,</p>
        <p><strong>Ban đào tạo Daily Learn VN</strong></p>
      </div>
    `;

    await sendEmail({ to: email, subject, html });

    return NextResponse.json({
      success: true,
      otpSent: true,
      email,
    });
  } catch (error) {
    console.error("Forgot Password API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
