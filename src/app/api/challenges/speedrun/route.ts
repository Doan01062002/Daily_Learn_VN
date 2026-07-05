import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // Fetch leaderboard of speedruns
    if (action === "leaderboard") {
      const records = await prisma.speedrunRecord.findMany({
        orderBy: [
          { score: "desc" },
          { timeSeconds: "asc" }
        ],
        take: 10,
        include: {
          user: {
            select: {
              name: true,
              avatarUrl: true
            }
          }
        }
      });
      
      const formatted = records.map((r, index) => ({
        rank: index + 1,
        name: r.user.name,
        avatarUrl: r.user.avatarUrl,
        score: r.score,
        time: r.timeSeconds,
        date: r.createdAt.toLocaleDateString("vi-VN")
      }));

      return NextResponse.json({
        success: true,
        leaderboard: formatted
      });
    }

    // Fetch quizzes with their lesson tags / titles
    const quizzes = await prisma.quiz.findMany({
      where: {
        lesson: {
          status: "PUBLISHED"
        }
      },
      include: {
        lesson: {
          select: { title: true }
        }
      }
    });

    if (quizzes.length === 0) {
      return NextResponse.json({ success: true, quizzes: [] });
    }

    // Shuffle and slice 5
    const shuffled = [...quizzes].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5).map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      lessonTitle: q.lesson.title
    }));

    return NextResponse.json({
      success: true,
      quizzes: selected
    });
  } catch (error) {
    console.error("GET Speedrun Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
    const { score, timeSeconds } = body;

    if (typeof score !== "number" || typeof timeSeconds !== "number") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    // Find existing record for this user
    const existing = await prisma.speedrunRecord.findUnique({
      where: { userId: decoded.userId }
    });

    let shouldUpdate = false;
    if (!existing) {
      shouldUpdate = true;
    } else {
      // Update if new score is higher, OR if score is same but time is faster
      if (score > existing.score) {
        shouldUpdate = true;
      } else if (score === existing.score && timeSeconds < existing.timeSeconds) {
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      const record = await prisma.speedrunRecord.upsert({
        where: { userId: decoded.userId },
        update: {
          score,
          timeSeconds,
          createdAt: new Date()
        },
        create: {
          userId: decoded.userId,
          score,
          timeSeconds
        }
      });
      return NextResponse.json({ success: true, updated: true, record });
    }

    return NextResponse.json({ success: true, updated: false });
  } catch (error) {
    console.error("POST Speedrun Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
