import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { lessonId },
    });

    if (!assignment) {
      return NextResponse.json({ success: true, assignment: null });
    }

    // Check if user has already submitted a response
    const submission = await prisma.submission.findFirst({
      where: {
        assignmentId: assignment.id,
        userId: decoded.userId,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, assignment, submission });
  } catch (error) {
    console.error("GET Lesson Assignment Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { lessonId },
    });

    if (!assignment) {
      return NextResponse.json({ error: "No assignment found for this lesson." }, { status: 404 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required." }, { status: 400 });
    }

    // Delete existing uncompleted submission or allow only one active submission
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId: assignment.id,
        userId: decoded.userId,
      },
    });

    if (existingSubmission && existingSubmission.status === "GRADED") {
      return NextResponse.json({ error: "Bài tập của bạn đã được chấm, không thể nộp lại." }, { status: 400 });
    }

    let submission;
    if (existingSubmission) {
      submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          content,
          status: "SUBMITTED",
          score: null,
          comment: null,
          grammarEdits: null,
          gradedAt: null,
          gradedById: null,
        },
      });
    } else {
      submission = await prisma.submission.create({
        data: {
          assignmentId: assignment.id,
          userId: decoded.userId,
          content,
          status: "SUBMITTED",
        },
      });
    }

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error("POST Lesson Assignment Submit Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
