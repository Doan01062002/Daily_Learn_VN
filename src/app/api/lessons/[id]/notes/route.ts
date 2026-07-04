import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

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

    const { userId } = decoded;

    const progress = await prisma.userLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      select: {
        notes: true,
      },
    });

    return NextResponse.json({
      success: true,
      notes: progress?.notes || "",
    });
  } catch (error) {
    console.error("GET Lesson Notes Error:", error);
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

    const { userId } = decoded;
    const body = await req.json();
    const { notes } = body;

    if (notes === undefined) {
      return NextResponse.json({ error: "Notes field is required" }, { status: 400 });
    }

    const progress = await prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        notes,
      },
      create: {
        userId,
        lessonId,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      notes: progress.notes,
    });
  } catch (error) {
    console.error("POST Save Lesson Notes Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
