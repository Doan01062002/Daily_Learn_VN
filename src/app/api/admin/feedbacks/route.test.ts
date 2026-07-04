/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "./route";
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

vi.mock("@/lib/notifications", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    feedback: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("Admin Feedbacks API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return feedbacks list if admin", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));
    vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });

    vi.mocked(prisma.feedback.count).mockResolvedValue(1);
    vi.mocked(prisma.feedback.findMany).mockResolvedValue([
      {
        id: "fb-1",
        content: "Wrong answer explanation",
        status: "PENDING",
        priority: "LOW",
        user: { name: "Học viên A", email: "student@gmail.com" },
      }
    ] as any);

    const req = new NextRequest("http://localhost/api/admin/feedbacks");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.feedbacks).toHaveLength(1);
  });
});
