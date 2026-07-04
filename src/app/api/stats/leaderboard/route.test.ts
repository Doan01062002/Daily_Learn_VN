/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

// Mock cookies from next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => ({
    get: vi.fn().mockReturnValue(undefined),
  })),
}));

// Mock verifyToken from @/lib/jwt
vi.mock("@/lib/jwt", () => ({
  verifyToken: vi.fn(),
}));

// Mock prisma from @/lib/prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findMany: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("GET /api/stats/leaderboard - Authentication", () => {
  it("should return 401 if token is missing", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue(undefined),
    } as any));

    const res = await GET();

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });
});

describe("GET /api/stats/leaderboard - Ranking Compilation", () => {
  it("should compile and return ranked leaderboard list", async () => {
    // Mock cookies
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));

    // Mock verifyToken
    vi.mocked(verifyToken).mockReturnValue({ userId: "user-123", role: "STUDENT" });

    // Mock findMany list of users with streaks and progress count
    const mockUsers = [
      {
        id: "user-1",
        name: "Lê Văn Đạt",
        avatarUrl: "http://dat.com",
        role: "STUDENT",
        streaks: [
          {
            currentStreak: 12,
            maxStreak: 12,
          }
        ],
        progress: [
          { id: "p1" }, { id: "p2" }, { id: "p3" }
        ]
      },
      {
        id: "user-2",
        name: "Trần Thị Lan",
        avatarUrl: "http://lan.com",
        role: "PREMIUM",
        streaks: [
          {
            currentStreak: 8,
            maxStreak: 10,
          }
        ],
        progress: [
          { id: "p1" }, { id: "p2" }
        ]
      }
    ];

    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);

    const res = await GET();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.leaderboard).toHaveLength(2);
    
    // Check rank indices
    expect(data.leaderboard[0]).toEqual({
      rank: 1,
      name: "Lê Văn Đạt",
      avatarUrl: "http://dat.com",
      role: "STUDENT",
      currentStreak: 12,
      completedLessons: 3,
    });
    expect(data.leaderboard[1]).toEqual({
      rank: 2,
      name: "Trần Thị Lan",
      avatarUrl: "http://lan.com",
      role: "PREMIUM",
      currentStreak: 8,
      completedLessons: 2,
    });
  });
});
