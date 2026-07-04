/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => ({
    get: vi.fn().mockReturnValue(undefined),
  })),
}));

vi.mock("@/lib/jwt", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    weeklyChallenge: {
      findUnique: vi.fn(),
    },
    weeklyChallengeAttempt: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation(async (callback) => {
      const txPrisma = {
        weeklyChallengeAttempt: {
          create: vi.fn(),
        },
        user: {
          update: vi.fn(),
        },
      };
      return callback(txPrisma);
    }),
  },
  __esModule: true,
}));

describe("POST /api/challenges/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if unauthorized", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue(undefined),
    } as any));

    const req = {
      json: async () => ({ challengeId: "chal-1", answers: {} }),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should grade answers and award 100 points if score is >= 8", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));
    vi.mocked(verifyToken).mockReturnValue({ userId: "user-123", role: "STUDENT" } as any);

    // Mock active challenge
    const mockChallenge = {
      id: "chal-1",
      title: "Đấu trường tuần",
      description: "Mô tả",
      rewardPoints: 100,
      questions: [
        { id: "q1", question: "Q1", correctAnswer: "A" },
        { id: "q2", question: "Q2", correctAnswer: "B" },
        { id: "q3", question: "Q3", correctAnswer: "C" },
        { id: "q4", question: "Q4", correctAnswer: "D" },
        { id: "q5", question: "Q5", correctAnswer: "E" },
        { id: "q6", question: "Q6", correctAnswer: "F" },
        { id: "q7", question: "Q7", correctAnswer: "G" },
        { id: "q8", question: "Q8", correctAnswer: "H" },
        { id: "q9", question: "Q9", correctAnswer: "I" },
        { id: "q10", question: "Q10", correctAnswer: "J" },
      ],
    };

    vi.mocked(prisma.weeklyChallenge.findUnique).mockResolvedValue(mockChallenge as any);
    vi.mocked(prisma.weeklyChallengeAttempt.findUnique).mockResolvedValue(null as any);

    const userAnswers = {
      q1: "A", q2: "B", q3: "C", q4: "D", q5: "E",
      q6: "F", q7: "G", q8: "H", q9: "WRONG", q10: "WRONG",
    };

    const req = {
      json: async () => ({ challengeId: "chal-1", answers: userAnswers }),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.score).toBe(8); // 8 correct answers
    expect(data.passed).toBe(true);
    expect(data.pointsEarned).toBe(100);
  });

  it("should grade answers but award 0 points if score is < 8", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));
    vi.mocked(verifyToken).mockReturnValue({ userId: "user-123", role: "STUDENT" } as any);

    const mockChallenge = {
      id: "chal-1",
      title: "Đấu trường tuần",
      description: "Mô tả",
      rewardPoints: 100,
      questions: [
        { id: "q1", question: "Q1", correctAnswer: "A" },
        { id: "q2", question: "Q2", correctAnswer: "B" },
        { id: "q3", question: "Q3", correctAnswer: "C" },
        { id: "q4", question: "Q4", correctAnswer: "D" },
        { id: "q5", question: "Q5", correctAnswer: "E" },
        { id: "q6", question: "Q6", correctAnswer: "F" },
        { id: "q7", question: "Q7", correctAnswer: "G" },
        { id: "q8", question: "Q8", correctAnswer: "H" },
        { id: "q9", question: "Q9", correctAnswer: "I" },
        { id: "q10", question: "Q10", correctAnswer: "J" },
      ],
    };

    vi.mocked(prisma.weeklyChallenge.findUnique).mockResolvedValue(mockChallenge as any);
    vi.mocked(prisma.weeklyChallengeAttempt.findUnique).mockResolvedValue(null as any);

    const userAnswers = {
      q1: "A", q2: "B", q3: "C", q4: "WRONG", q5: "WRONG",
      q6: "WRONG", q7: "WRONG", q8: "WRONG", q9: "WRONG", q10: "WRONG",
    };

    const req = {
      json: async () => ({ challengeId: "chal-1", answers: userAnswers }),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.score).toBe(3); // only 3 correct answers
    expect(data.passed).toBe(false);
    expect(data.pointsEarned).toBe(0);
  });
});
