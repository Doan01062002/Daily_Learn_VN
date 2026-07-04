import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { promises as fs } from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { verifyPassword } from "@/lib/hash";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credential, mockEmail, mockName, email: formEmail, password } = body;

    let email = "";
    let name = "";
    let avatarUrl = "";
    let user = null;

    // 1. Check for email & password login
    if (formEmail && password) {
      email = formEmail.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Định dạng Email không hợp lệ." },
          { status: 400 }
        );
      }

      user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Tài khoản không tồn tại." },
          { status: 400 }
        );
      }

      if (!user.password) {
        return NextResponse.json(
          { error: "Tài khoản này được đăng ký bằng Google. Vui lòng đăng nhập qua Google." },
          { status: 400 }
        );
      }

      const isValid = verifyPassword(password, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "Mật khẩu không chính xác." },
          { status: 400 }
        );
      }
    } 
    // 2. Check for Mock Login in Development mode
    else if (process.env.NODE_ENV === "development" && (mockEmail || (credential && credential.startsWith("mock-")))) {
      email = mockEmail || credential.replace("mock-", "") + "@example.com";
      name = mockName || "Mock Student";
      avatarUrl = "https://lh3.googleusercontent.com/a/default-user";
    } 
    // 3. Real Google OAuth Token Verification via Google API
    else if (credential) {
      const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
      console.log(`[Google Auth Verify] Verifying token at: ${googleVerifyUrl}`);
      try {
        const verifyRes = await fetch(googleVerifyUrl);
        
        if (!verifyRes.ok) {
          const errText = await verifyRes.text();
          console.error(`[Google Auth Verify] Google API returned status ${verifyRes.status}:`, errText);
          return NextResponse.json(
            { error: `Invalid Google credential token: ${errText}` },
            { status: 400 }
          );
        }

        const payload = await verifyRes.json();
        console.log("[Google Auth Verify] Successfully verified token. Payload email:", payload.email);
        
        // Ensure the token has email verified
        if (payload.email_verified !== "true" && payload.email_verified !== true) {
          console.error("[Google Auth Verify] Email is not verified by Google:", payload);
          return NextResponse.json(
            { error: "Google email is not verified." },
            { status: 400 }
          );
        }

        email = payload.email;
        name = payload.name || payload.email.split("@")[0] || "Google User";
        avatarUrl = payload.picture || "";
      } catch (fetchErr) {
        console.error("[Google Auth Verify] Network request failed:", fetchErr);
        return NextResponse.json(
          { error: "Failed to connect to Google verification server." },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ email và mật khẩu." },
        { status: 400 }
      );
    }

    // 4. Find or Create User in PostgreSQL (if not already loaded via email/password)
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        const isSystemAdmin = email.toLowerCase() === "admin@gmail.com";
        
        // Create user and automatically initialize a Streak record
        user = await prisma.user.create({
          data: {
            email,
            name,
            avatarUrl,
            role: isSystemAdmin ? "ADMIN" : "STUDENT",
            streaks: {
              create: {
                currentStreak: 0,
                maxStreak: 0,
              },
            },
          },
        });
      } else if (email.toLowerCase() === "admin@gmail.com" && user.role !== "ADMIN") {
        // Auto-promote existing database record to ADMIN in development
        user = await prisma.user.update({
          where: { email },
          data: { role: "ADMIN" },
        });
      }
    }

    if (user.isLocked) {
      return NextResponse.json(
        { error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị." },
        { status: 403 }
      );
    }

    // 5. Sign JWT Session Token
    const jwtToken = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 6. Save JWT to HttpOnly Cookie for Web
    const cookieStore = await cookies();
    cookieStore.set("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // 7. Resolve permissions dynamically for administrative roles
    let permissions: string[] = [];
    if (user.role === "ADMIN") {
      permissions = [
        "manage_lessons",
        "manage_quizzes",
        "manage_users",
        "manage_payments",
        "manage_notifications",
        "view_analytics",
        "manage_settings",
        "manage_coupons",
        "manage_feedbacks",
        "manage_media",
        "manage_grading",
      ];
    } else if (user.role === "CTV" || user.role === "OPERATOR") {
      try {
        const filePath = path.join(process.cwd(), "src", "data", "settings.json");
        const fileData = await fs.readFile(filePath, "utf-8");
        const parsed = JSON.parse(fileData);
        permissions = parsed.rolePermissions?.[user.role] || [];
      } catch {
        // Fallbacks
        if (user.role === "CTV") {
          permissions = ["manage_lessons", "manage_quizzes", "manage_feedbacks", "manage_media", "manage_grading"];
        } else if (user.role === "OPERATOR") {
          permissions = ["manage_users", "manage_payments", "manage_notifications", "manage_coupons", "manage_feedbacks", "manage_media"];
        }
      }
    }

    // 8. Return response containing User info and Token (for mobile bearer)
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
        permissions,
      },
      token: jwtToken,
    });
  } catch (error) {
    console.error("Login API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
