import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    let token: string | undefined;

    // 1. Read token from Cookie
    const cookieStore = await cookies();
    token = cookieStore.get("token")?.value;

    // 2. Read token from Authorization Header
    if (!token) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    // 3. Unauthorized if no token
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Access token is missing" },
        { status: 401 }
      );
    }

    // 4. Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired token" },
        { status: 401 }
      );
    }

    // 5. Parse request body
    const body = await req.json();
    const { interestedTopics, currentLevel, commitmentTime } = body;

    // Basic Validation
    if (!interestedTopics || !Array.isArray(interestedTopics) || interestedTopics.length === 0) {
      return NextResponse.json(
        { error: "Validation Error: interestedTopics must be a non-empty array." },
        { status: 400 }
      );
    }

    if (!currentLevel || (currentLevel !== "Beginner" && currentLevel !== "Experienced")) {
      return NextResponse.json(
        { error: "Validation Error: currentLevel must be either 'Beginner' or 'Experienced'." },
        { status: 400 }
      );
    }

    const commitmentInt = Number(commitmentTime);
    if (isNaN(commitmentInt) || ![5, 10, 15].includes(commitmentInt)) {
      return NextResponse.json(
        { error: "Validation Error: commitmentTime must be 5, 10, or 15 minutes." },
        { status: 400 }
      );
    }

    // 6. Update user configuration profile in PostgreSQL
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        interestedTopics,
        currentLevel,
        commitmentTime: commitmentInt,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        isOnboarded: true,
        interestedTopics: updatedUser.interestedTopics,
        currentLevel: updatedUser.currentLevel,
        commitmentTime: updatedUser.commitmentTime,
      },
    });
  } catch (error) {
    console.error("Onboarding API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
