/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";

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
    user: {
      findMany: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("Admin Manual Remind API Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if token is missing", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue(undefined),
    } as any));

    const req = new NextRequest("http://localhost/api/admin/notifications/remind", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should trigger manual remind for users without completed progress today", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));
    vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { name: "Học viên A", email: "studentA@gmail.com", streaks: [{ currentStreak: 5 }] },
    ] as any);

    const req = new NextRequest("http://localhost/api/admin/notifications/remind", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.notifiedCount).toBe(1);

    expect(sendEmail).toHaveBeenCalledWith({
      to: "studentA@gmail.com",
      subject: expect.stringContaining("đừng để đứt chuỗi Streak"),
      html: expect.stringContaining("Chuỗi <strong>5 ngày học liên tiếp</strong>"),
    });
  });
});
