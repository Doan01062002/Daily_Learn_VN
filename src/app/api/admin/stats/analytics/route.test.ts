/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/jwt", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    userLessonProgress: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    lesson: {
      findUnique: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("Admin Stats Analytics API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return cohort heatmap and statistics if admin", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));
    vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { interestedTopics: ["Tech", "Business"], streaks: [{ currentStreak: 4 }] },
      { interestedTopics: ["Design"], streaks: [{ currentStreak: 0 }] },
    ] as any);

    vi.mocked(prisma.userLessonProgress.findMany).mockResolvedValue([
      { status: "COMPLETED", score: 86 },
    ] as any);

    vi.mocked(prisma.user.count).mockResolvedValue(10);
    vi.mocked(prisma.userLessonProgress.groupBy).mockResolvedValue([]);

    const req = new NextRequest("http://localhost/api/admin/stats/analytics");
    const res = await GET(req);
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.avgQuizScore).toBe(86);
    expect(data.topics).toHaveLength(5);
    expect(data.streakDistribution).toHaveLength(4);
    expect(data.cohorts).toHaveLength(5);
    expect(data.funnel).toHaveLength(5);
    expect(data.topLessons).toHaveLength(3);
    expect(data.challengingLessons).toHaveLength(3);
  });
});
