/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

vi.mock("@/lib/hash", () => ({
  hashPassword: vi.fn().mockReturnValue("hashed-password-result"),
}));

vi.mock("@/lib/notifications", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    otpVerification: {
      upsert: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("Forgot Password API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully trigger OTP for forgot password request if user exists", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@gmail.com",
      name: "Test User",
    } as any);

    vi.mocked(prisma.otpVerification.upsert).mockResolvedValue({} as any);

    const req = new NextRequest("http://localhost/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "test@gmail.com", newPassword: "newpassword123" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.otpSent).toBe(true);
    expect(data.email).toBe("test@gmail.com");
  });

  it("should fail if user does not exist", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "notfound@gmail.com", newPassword: "newpassword123" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Không tìm thấy tài khoản liên kết với địa chỉ Email này.");
  });
});
