/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";

// Mock prisma from @/lib/prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findMany: vi.fn(),
    },
  },
  __esModule: true,
}));

// Mock sendEmail from @/lib/notifications
vi.mock("@/lib/notifications", () => ({
  sendEmail: vi.fn(),
}));

describe("POST /api/notifications/remind - Authentication", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "super-secret-cron-key");
  });

  it("should return 401 if Authorization header is missing", async () => {
    const req = new NextRequest("http://localhost/api/notifications/remind", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 401 if Authorization token is incorrect", async () => {
    const req = new NextRequest("http://localhost/api/notifications/remind", {
      method: "POST",
      headers: {
        Authorization: "Bearer wrong-key",
      },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});

describe("POST /api/notifications/remind - Streak reminders dispatch", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "super-secret-cron-key");
    vi.clearAllMocks();
  });

  it("should query users, trigger email dispatch, and return success", async () => {
    // Mock users who need reminding
    const mockUsersToRemind = [
      {
        id: "user-1",
        email: "student1@gmail.com",
        name: "Nguyễn Hoàng Nam",
        streaks: [
          {
            currentStreak: 4,
          }
        ]
      },
    ];
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsersToRemind as any);
    vi.mocked(sendEmail).mockResolvedValue(true);

    const req = new NextRequest("http://localhost/api/notifications/remind", {
      method: "POST",
      headers: {
        Authorization: "Bearer super-secret-cron-key",
      },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.notifiedCount).toBe(1);

    // Verify sendEmail was called with the correct parameters
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "student1@gmail.com",
        subject: expect.stringContaining("chuỗi Streak"),
      })
    );
  });
});
