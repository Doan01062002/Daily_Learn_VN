import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { promises as fs } from "fs";
import path from "path";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;
    let token: string | undefined;

    // 1. Authenticate user
    const cookieStore = await cookies();
    token = cookieStore.get("token")?.value;

    if (!token) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = decoded.userId;

    // 2. Parse request body
    const body = await req.json();
    const { answers } = body as {
      answers: Array<{ quizId: string; selectedAnswer: string }>;
    };

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Validation Error: answers array is required." },
        { status: 400 }
      );
    }

    // 3. Fetch all actual quizzes for the lesson from DB
    const dbQuizzes = await prisma.quiz.findMany({
      where: { lessonId },
    });

    if (dbQuizzes.length === 0) {
      return NextResponse.json(
        { error: "No quizzes found for this lesson." },
        { status: 404 }
      );
    }

    // 4. Score the answers
    let correctCount = 0;
    const results = dbQuizzes.map((quiz) => {
      const userAnswer = answers.find((ans) => ans.quizId === quiz.id);
      const selectedAnswer = userAnswer?.selectedAnswer || "";
      const isCorrect = selectedAnswer.trim().toLowerCase() === quiz.correctAnswer.trim().toLowerCase();

      if (isCorrect) {
        correctCount++;
      }

      return {
        quizId: quiz.id,
        isCorrect,
        correctAnswer: quiz.correctAnswer,
        explanation: quiz.explanation,
      };
    });

    const totalQuestions = dbQuizzes.length;
    const score = (correctCount / totalQuestions) * 100;

    // Read minQuizScoreToPass from settings.json
    let minScoreThreshold = 75;
    try {
      const filePath = path.join(process.cwd(), "src", "data", "settings.json");
      const fileData = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(fileData);
      minScoreThreshold = Number(parsed.minQuizScoreToPass) || 75;
    } catch (e) {
      // fallback
    }

    const passed = score >= minScoreThreshold;

    // Check if they already completed this lesson
    const existingProgress = await prisma.userLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    const isFirstTimeCompletion = passed && (!existingProgress || existingProgress.status !== "COMPLETED");

    // 5. Update UserLessonProgress score in PostgreSQL
    await prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        score: Math.round(score),
        status: passed ? "COMPLETED" : "IN_PROGRESS",
        completedAt: passed ? (existingProgress?.completedAt || new Date()) : undefined,
      },
      create: {
        userId,
        lessonId,
        score: Math.round(score),
        status: passed ? "COMPLETED" : "IN_PROGRESS",
        completedAt: passed ? new Date() : undefined,
      },
    });

    // Award 10 Knowledge Points if passing for the first time
    if (isFirstTimeCompletion) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            knowledgePoints: { increment: 10 },
          },
        });

        // Check if this is the user's first completed lesson
        const completedLessonsCount = await prisma.userLessonProgress.count({
          where: {
            userId,
            status: "COMPLETED",
          },
        });

        if (completedLessonsCount === 1) {
          const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { referredById: true, name: true, referralRewarded: true },
          });

          if (currentUser?.referredById && !currentUser.referralRewarded) {
            const referrerId = currentUser.referredById;

            // Transactionally reward both users
            await prisma.$transaction([
              prisma.user.update({
                where: { id: userId },
                data: {
                  knowledgePoints: { increment: 50 },
                  streakFreezes: { increment: 1 },
                  referralRewarded: true,
                },
              }),
              prisma.user.update({
                where: { id: referrerId },
                data: {
                  knowledgePoints: { increment: 50 },
                  streakFreezes: { increment: 1 },
                },
              }),
            ]);

            // Send notification emails
            try {
              const referrer = await prisma.user.findUnique({
                where: { id: referrerId },
                select: { email: true, name: true },
              });
              const refereeEmail = decoded.email || "";

              const { sendEmail } = await import("@/lib/notifications");

              if (referrer) {
                await sendEmail({
                  to: referrer.email,
                  subject: "[Daily Learn VN] Quà tặng giới thiệu bạn học mới thành công!",
                  html: `
                    <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333;">
                      <h2 style="color: #4f46e5;">Chào ${referrer.name},</h2>
                      <p>Chúc mừng! Bạn học <strong>${currentUser.name}</strong> mà bạn giới thiệu đã hoàn thành bài học đầu tiên trên Daily Learn VN.</p>
                      <p>Hệ thống đã tự động gửi tặng bạn phần thưởng giới thiệu:</p>
                      <ul style="font-size: 14px; font-weight: bold; color: #4f46e5;">
                        <li>+50 Điểm tích lũy (Knowledge Points) 💎</li>
                        <li>+1 Thẻ bảo vệ chuỗi Streak ❄️</li>
                      </ul>
                      <p>Hãy tiếp tục chia sẻ mã giới thiệu của mình để cùng nhau xây dựng thói quen học tập tốt mỗi ngày nhé!</p>
                      <br />
                      <p>Trân trọng,</p>
                      <p><strong>Daily Learn VN</strong></p>
                    </div>
                  `,
                }).catch(() => {});
              }

              if (refereeEmail) {
                await sendEmail({
                  to: refereeEmail,
                  subject: "[Daily Learn VN] Chúc mừng nhận quà chào mừng giới thiệu bạn học!",
                  html: `
                    <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333;">
                      <h2 style="color: #4f46e5;">Chào ${currentUser.name},</h2>
                      <p>Chúc mừng bạn đã hoàn thành xuất sắc bài học đầu tiên trên Daily Learn VN!</p>
                      <p>Vì bạn được giới thiệu bởi thành viên khác, bạn nhận được quà chào mừng đặc biệt:</p>
                      <ul style="font-size: 14px; font-weight: bold; color: #4f46e5;">
                        <li>+50 Điểm tích lũy (Knowledge Points) 💎</li>
                        <li>+1 Thẻ bảo vệ chuỗi Streak ❄️</li>
                      </ul>
                      <p>Hãy sử dụng Điểm tích lũy để thăng cấp và mua sắm Thẻ bảo vệ Streak khi cần thiết nhé!</p>
                      <br />
                      <p>Trân trọng,</p>
                      <p><strong>Daily Learn VN</strong></p>
                    </div>
                  `,
                }).catch(() => {});
              }
            } catch (mailErr) {
              console.error("Failed to send referral reward emails:", mailErr);
            }
          }
        }
      } catch (err) {
        console.error("Failed to award knowledge points or referral bonus:", err);
      }
    }

    // Log the quiz attempt to DB
    try {
      await prisma.quizAttempt.create({
        data: {
          userId,
          lessonId,
          score: Math.round(score),
          passed,
        },
      });
    } catch (e) {
      console.error("Failed to log quiz attempt:", e);
    }

    return NextResponse.json({
      success: true,
      score: Math.round(score),
      totalQuestions,
      correctAnswersCount: correctCount,
      passed,
      results,
    });
  } catch (error) {
    console.error("POST Submit Quiz API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
