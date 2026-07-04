import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credential, mockEmail, mockName } = body;

    let email = "";
    let name = "";
    let avatarUrl = "";

    // 1. Check for Mock Login in Development mode
    if (process.env.NODE_ENV === "development" && (mockEmail || (credential && credential.startsWith("mock-")))) {
      email = mockEmail || credential.replace("mock-", "") + "@example.com";
      name = mockName || "Mock Student";
      avatarUrl = "https://lh3.googleusercontent.com/a/default-user";
    } 
    // 2. Real Google OAuth Token Verification via Google API
    else if (credential) {
      const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
      const verifyRes = await fetch(googleVerifyUrl);
      
      if (!verifyRes.ok) {
        return NextResponse.json(
          { error: "Invalid Google credential token." },
          { status: 400 }
        );
      }

      const payload = await verifyRes.json();
      
      // Ensure the token has email verified
      if (payload.email_verified !== "true" && payload.email_verified !== true) {
        return NextResponse.json(
          { error: "Google email is not verified." },
          { status: 400 }
        );
      }

      email = payload.email;
      name = payload.name;
      avatarUrl = payload.picture || "";
    } else {
      return NextResponse.json(
        { error: "Missing credential token or email." },
        { status: 400 }
      );
    }

    // 3. Find or Create User in PostgreSQL
    let user = await prisma.user.findUnique({
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

    // 4. Sign JWT Session Token
    const jwtToken = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 5. Save JWT to HttpOnly Cookie for Web
    const cookieStore = await cookies();
    cookieStore.set("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // 6. Return response containing User info and Token (for mobile bearer)
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
    console.error("Login API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
