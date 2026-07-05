import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otpCode, referrerCode } = body;

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
        { error: "Không tìm thấy yêu cầu xác thực hoặc mã đã hết hạn. Vui lòng đăng ký lại." },
        { status: 400 }
      );
    }

    // Verify expiration
    if (new Date() > verification.expiresAt) {
      // Clean up expired verification
      await prisma.otpVerification.delete({ where: { email: cleanEmail } }).catch(() => {});
      return NextResponse.json(
        { error: "Mã xác thực OTP đã hết hạn. Vui lòng đăng ký lại." },
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

    // Check one more time if user was already created (race condition protection)
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      // Clean up verification record
      await prisma.otpVerification.delete({ where: { email: cleanEmail } }).catch(() => {});
      return NextResponse.json(
        { error: "Email này đã được đăng ký tài khoản." },
        { status: 400 }
      );
    }

    const isSystemAdmin = cleanEmail === "admin@gmail.com";

    // Generate unique 8-character referral code for new user
    let referralCode = "";
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const codeCheck = await prisma.user.findUnique({
        where: { referralCode },
      });
      if (!codeCheck) {
        isUnique = true;
      }
      attempts++;
    }
    if (!isUnique) {
      referralCode = `DL${Date.now().toString(36).substring(4).toUpperCase()}`;
    }

    // Validate and find referrer
    let referredById = null;
    if (referrerCode && typeof referrerCode === "string" && referrerCode.trim()) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referrerCode.trim().toUpperCase() },
      });
      if (referrer && referrer.email !== cleanEmail) {
        referredById = referrer.id;
      }
    }

    // Create the User in the database
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: verification.name,
        password: verification.password,
        role: isSystemAdmin ? "ADMIN" : "STUDENT",
        avatarUrl: "https://lh3.googleusercontent.com/a/default-user",
        referralCode,
        referredById,
        streaks: {
          create: {
            currentStreak: 0,
            maxStreak: 0,
          },
        },
      },
    });

    // Delete verification record
    await prisma.otpVerification.delete({ where: { email: cleanEmail } }).catch(() => {});

    // Sign JWT Session Token
    const jwtToken = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
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

    const isOnboarded = user.interestedTopics && user.interestedTopics.length > 0;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isOnboarded,
      },
      token: jwtToken,
    });
  } catch (error) {
    console.error("Verify OTP API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
