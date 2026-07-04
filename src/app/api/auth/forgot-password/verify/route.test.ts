/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/jwt", () => ({
  signToken: vi.fn().mockReturnValue("mock-jwt-token"),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    otpVerification: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("Verify Forgot Password OTP API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully verify OTP, update password and log the user in", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      set: vi.fn(),
    } as any));

    const futureDate = new Date(Date.now() + 60000);
    vi.mocked(prisma.otpVerification.findUnique).mockResolvedValue({
      email: "test@gmail.com",
      otpCode: "123456",
      name: "OTP Student",
      password: "hashed-new-password",
      expiresAt: futureDate,
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@gmail.com",
      name: "OTP Student",
      role: "STUDENT",
      avatarUrl: "avatar.png",
      interestedTopics: [],
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({
      id: "user-1",
      email: "test@gmail.com",
      name: "OTP Student",
      role: "STUDENT",
      avatarUrl: "avatar.png",
      interestedTopics: [],
    } as any);

    vi.mocked(prisma.otpVerification.delete).mockResolvedValue({} as any);

    const req = new NextRequest("http://localhost/api/auth/forgot-password/verify", {
      method: "POST",
      body: JSON.stringify({ email: "test@gmail.com", otpCode: "123456" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe("test@gmail.com");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: "test@gmail.com" },
      data: { password: "hashed-new-password" }
    });
  });

  it("should fail if OTP is incorrect", async () => {
    const futureDate = new Date(Date.now() + 60000);
    vi.mocked(prisma.otpVerification.findUnique).mockResolvedValue({
      email: "test@gmail.com",
      otpCode: "123456",
      expiresAt: futureDate,
    } as any);

    const req = new NextRequest("http://localhost/api/auth/forgot-password/verify", {
      method: "POST",
      body: JSON.stringify({ email: "test@gmail.com", otpCode: "000000" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Mã xác thực OTP không chính xác.");
  });
});
