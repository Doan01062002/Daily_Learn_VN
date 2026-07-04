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
      create: vi.fn(),
    },
    otpVerification: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("Verify OTP API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully verify OTP and create user", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      set: vi.fn(),
    } as any));

    const futureDate = new Date(Date.now() + 60000);
    vi.mocked(prisma.otpVerification.findUnique).mockResolvedValue({
      email: "test@gmail.com",
      otpCode: "123456",
      name: "OTP Student",
      password: "hashed-pwd",
      expiresAt: futureDate,
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "created-user-id",
      email: "test@gmail.com",
      name: "OTP Student",
      role: "STUDENT",
      avatarUrl: "avatar.png",
      interestedTopics: [],
    } as any);

    vi.mocked(prisma.otpVerification.delete).mockResolvedValue({} as any);

    const req = new NextRequest("http://localhost/api/auth/register/verify", {
      method: "POST",
      body: JSON.stringify({ email: "test@gmail.com", otpCode: "123456" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe("test@gmail.com");
  });

  it("should fail if OTP is incorrect", async () => {
    const futureDate = new Date(Date.now() + 60000);
    vi.mocked(prisma.otpVerification.findUnique).mockResolvedValue({
      email: "test@gmail.com",
      otpCode: "123456",
      expiresAt: futureDate,
    } as any);

    const req = new NextRequest("http://localhost/api/auth/register/verify", {
      method: "POST",
      body: JSON.stringify({ email: "test@gmail.com", otpCode: "000000" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Mã xác thực OTP không chính xác.");
  });

  it("should fail if OTP is expired", async () => {
    const pastDate = new Date(Date.now() - 60000);
    vi.mocked(prisma.otpVerification.findUnique).mockResolvedValue({
      email: "test@gmail.com",
      otpCode: "123456",
      expiresAt: pastDate,
    } as any);
    vi.mocked(prisma.otpVerification.delete).mockResolvedValue({} as any);

    const req = new NextRequest("http://localhost/api/auth/register/verify", {
      method: "POST",
      body: JSON.stringify({ email: "test@gmail.com", otpCode: "123456" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Mã xác thực OTP đã hết hạn. Vui lòng đăng ký lại.");
  });
});
