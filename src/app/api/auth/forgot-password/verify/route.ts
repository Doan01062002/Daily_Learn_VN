import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otpCode } = body;

    if (!email || !otpCode) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp Email và mã xác thực OTP." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otpCode.trim();

    // Find verification record
    const verification = await prisma.otpVerification.findUnique({
      where: { email: cleanEmail },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Không tìm thấy yêu cầu đặt lại mật khẩu hoặc mã đã hết hạn. Vui lòng thử lại." },
        { status: 400 }
      );
    }

    // Verify expiration
    if (new Date() > verification.expiresAt) {
      // Clean up expired verification
      await prisma.otpVerification.delete({ where: { email: cleanEmail } }).catch(() => {});
      return NextResponse.json(
        { error: "Mã xác thực OTP đã hết hạn. Vui lòng gửi lại yêu cầu đặt lại mật khẩu." },
        { status: 400 }
      );
    }

    // Verify OTP code match
    if (verification.otpCode !== cleanOtp) {
      return NextResponse.json(
        { error: "Mã xác thực OTP không chính xác." },
        { status: 400 }
      );
    }

    // Find user to verify they still exist
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Clean up verification record
      await prisma.otpVerification.delete({ where: { email: cleanEmail } }).catch(() => {});
      return NextResponse.json(
        { error: "Tài khoản không tồn tại trong hệ thống." },
        { status: 400 }
      );
    }

    if (user.isLocked) {
      await prisma.otpVerification.delete({ where: { email: cleanEmail } }).catch(() => {});
      return NextResponse.json(
        { error: "Tài khoản đã bị khóa. Vui lòng liên hệ ban quản trị." },
        { status: 403 }
      );
    }

    // Update the user's password with the new hashed password stored in the verification table
    const updatedUser = await prisma.user.update({
      where: { email: cleanEmail },
      data: {
        password: verification.password,
      },
    });

    // Delete verification record
    await prisma.otpVerification.delete({ where: { email: cleanEmail } }).catch(() => {});

    // Sign JWT Session Token to log the user in automatically
    const jwtToken = signToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    // Save JWT to HttpOnly Cookie for Web
    const cookieStore = await cookies();
    cookieStore.set("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    const isOnboarded = updatedUser.interestedTopics && updatedUser.interestedTopics.length > 0;

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatarUrl: updatedUser.avatarUrl,
        role: updatedUser.role,
        isOnboarded,
      },
      token: jwtToken,
    });
  } catch (error) {
    console.error("Verify Forgot Password OTP API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
