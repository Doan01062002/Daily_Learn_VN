import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { lessonId, quizId, type, content } = body;

    if (!content || !type) {
      return NextResponse.json({ error: "Missing required fields: type and content are required." }, { status: 400 });
    }

    // Validate type
    const validTypes = ["TYPO", "WRONG_QUIZ", "TRANSLATION", "OTHER"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid feedback type." }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: decoded.userId,
        lessonId: lessonId || null,
        quizId: quizId || null,
        type: type,
        content: content,
        status: "PENDING",
        priority: "LOW",
      },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error("POST Feedback Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
