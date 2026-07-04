import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

// Mock questions for seeding
const MOCK_QUESTIONS = [
  {
    id: "q1",
    question: "Nguyên tắc Minto Pyramid khuyên điều gì đầu tiên khi giao tiếp?",
    options: ["Trình bày luận cứ trước", "Đưa ra kết luận cốt lõi đầu tiên", "Kể một câu chuyện dẫn dắt", "Giải thích phương pháp nghiên cứu"],
    correctAnswer: "Đưa ra kết luận cốt lõi đầu tiên",
    explanation: "Minto Pyramid khuyên đưa kết luận lên đầu để người nghe dễ nắm bắt ý chính lập tức.",
  },
  {
    id: "q2",
    question: "Phương pháp Pomodoro tiêu chuẩn khuyên thời gian làm việc tập trung là bao lâu?",
    options: ["15 phút", "25 phút", "45 phút", "60 phút"],
    correctAnswer: "25 phút",
    explanation: "Pomodoro tiêu chuẩn đề xuất làm việc 25 phút, nghỉ ngắn 5 phút.",
  },
  {
    id: "q3",
    question: "Trong Git, lệnh nào được dùng để lưu trữ tạm thời các thay đổi chưa commit?",
    options: ["git cache", "git backup", "git stash", "git save"],
    correctAnswer: "git stash",
    explanation: "git stash lưu tạm các file sửa đổi chưa commit vào stack để bạn có thể dọn dẹp thư mục làm việc.",
  },
  {
    id: "q4",
    question: "Từ khóa 'defer' trong Go có tác dụng gì?",
    options: ["Bỏ qua hàm hiện tại", "Trì hoãn thực thi một hàm cho đến khi hàm bao ngoài trả về", "Chạy hàm song song", "Xử lý ngoại lệ khẩn cấp"],
    correctAnswer: "Trì hoãn thực thi một hàm cho đến khi hàm bao ngoài trả về",
    explanation: "defer đảm bảo hàm được gọi ngay trước khi hàm chứa nó thoát, thường dùng để dọn dẹp tài nguyên.",
  },
  {
    id: "q5",
    question: "Trong thiết kế cơ sở dữ liệu, ACID viết tắt của các đặc tính nào?",
    options: [
      "Atomicity, Consistency, Isolation, Durability",
      "Accuracy, Completeness, Integrity, Database",
      "Access, Control, Indexing, Direct",
      "Atomicity, Concurrency, Isolation, Distribution",
    ],
    correctAnswer: "Atomicity, Consistency, Isolation, Durability",
    explanation: "ACID đảm bảo tính nhất quán và độ tin cậy của các giao dịch trong cơ sở dữ liệu.",
  },
  {
    id: "q6",
    question: "Giao thức HTTPS chạy trên cổng mặc định nào?",
    options: ["80", "8080", "443", "22"],
    correctAnswer: "443",
    explanation: "HTTPS sử dụng cổng 443 làm cổng giao thức mã hóa mặc định (HTTP là 80).",
  },
  {
    id: "q7",
    question: "Mô hình OSI có bao nhiêu tầng (layer)?",
    options: ["5", "6", "7", "8"],
    correctAnswer: "7",
    explanation: "Mô hình OSI tiêu chuẩn có 7 tầng: Vật lý, Liên kết dữ liệu, Mạng, Giao vận, Phiên, Trình diễn, Ứng dụng.",
  },
  {
    id: "q8",
    question: "Trong JavaScript, kiểu dữ liệu nào sau đây là kiểu tham chiếu (Reference Type)?",
    options: ["String", "Number", "Boolean", "Array"],
    correctAnswer: "Array",
    explanation: "Mảng (Array) và Đối tượng (Object) là các kiểu dữ liệu tham chiếu, các kiểu cơ bản còn lại là kiểu tham trị.",
  },
  {
    id: "q9",
    question: "Phương pháp Scrum định nghĩa độ dài tối đa của một Sprint là bao lâu?",
    options: ["1 tuần", "4 tuần", "6 tuần", "2 tháng"],
    correctAnswer: "4 tuần",
    explanation: "Sprint trong Scrum có độ dài cố định, từ 1 đến tối đa là 4 tuần.",
  },
  {
    id: "q10",
    question: "Chỉ số Core Web Vitals nào đo lường tốc độ tải trang trực quan?",
    options: ["FID", "CLS", "LCP", "INP"],
    correctAnswer: "LCP",
    explanation: "LCP (Largest Contentful Paint) đo lường thời điểm phần tử lớn nhất trên trang được hiển thị đầy đủ.",
  },
];

export async function GET() {
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
    const now = new Date();

    // 1. Search for an active challenge
    let challenge = await prisma.weeklyChallenge.findFirst({
      where: {
        startTime: { lte: now },
        endTime: { gte: now },
      },
    });

    // 2. If no active challenge exists, let's seed one active mock challenge for testing!
    if (!challenge) {
      const currentYear = now.getFullYear();
      // Calculate a rough week number
      const startOfYear = new Date(currentYear, 0, 1);
      const pastDays = (now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000);
      const weekNumber = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);

      const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // Started 2h ago
      const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Ends in 7 days

      challenge = await prisma.weeklyChallenge.upsert({
        where: { weekNumber },
        update: {
          startTime,
          endTime,
        },
        create: {
          weekNumber,
          title: `Đấu Trường Tuần ${weekNumber} - Thử Thách Trí Tuệ`,
          description: "Tổng hợp 10 câu hỏi trắc nghiệm hóc búa nhất về kiến thức tuần qua. Trả lời đúng từ 8/10 câu để nhận ngay 100💎 thưởng!",
          questions: MOCK_QUESTIONS as any,
          startTime,
          endTime,
          rewardPoints: 100,
        },
      });
    }

    // 3. Check if user already attempted this challenge
    const attempt = await prisma.weeklyChallengeAttempt.findUnique({
      where: {
        challengeId_userId: {
          challengeId: challenge.id,
          userId,
        },
      },
    });

    // 4. Secure the questions list by omitting the correctAnswer and explanation fields
    const questionsRaw = (challenge.questions as any) || [];
    const securedQuestions = questionsRaw.map((q: any) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));

    return NextResponse.json({
      success: true,
      challenge: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        endTime: challenge.endTime,
        rewardPoints: challenge.rewardPoints,
      },
      questions: securedQuestions,
      alreadyAttempted: !!attempt,
      attemptScore: attempt ? attempt.score : null,
    });
  } catch (error) {
    console.error("GET Active Challenge API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
