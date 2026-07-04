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

    const userId = decoded.userId;
    const body = await req.json();
    const { challengeId, answers } = body; // answers: { q1: "correct answer text", q2: ... }

    if (!challengeId || !answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Dữ liệu nộp bài không hợp lệ" }, { status: 400 });
    }

    // 1. Fetch challenge
    const challenge = await prisma.weeklyChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Không tìm thấy đấu trường tuần" }, { status: 404 });
    }

    // 2. Verify user hasn't attempted yet
    const existingAttempt = await prisma.weeklyChallengeAttempt.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId,
        },
      },
    });

    if (existingAttempt) {
      return NextResponse.json({ error: "Bạn đã tham gia đấu trường tuần này rồi" }, { status: 400 });
    }

    // 3. Score the attempt
    const questionsRaw = (challenge.questions as any) || [];
    let correctCount = 0;
    const gradingDetails = [];

    for (const q of questionsRaw) {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) {
        correctCount += 1;
      }
      gradingDetails.push({
        id: q.id,
        question: q.question,
        userAnswer,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isCorrect,
      });
    }

    // 4. Calculate points awarded (Score >= 8 wins 100 points)
    const passed = correctCount >= 8;
    const pointsEarned = passed ? challenge.rewardPoints : 0;

    // 5. Update database in a transaction
    await prisma.$transaction(async (tx) => {
      // Record attempt
      await tx.weeklyChallengeAttempt.create({
        data: {
          challengeId,
          userId,
          score: correctCount,
        },
      });

      if (pointsEarned > 0) {
        // Award points
        await tx.user.update({
          where: { id: userId },
          data: {
            knowledgePoints: { increment: pointsEarned },
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      score: correctCount,
      passed,
      pointsEarned,
      details: gradingDetails,
    });
  } catch (error) {
    console.error("POST Submit Challenge API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
