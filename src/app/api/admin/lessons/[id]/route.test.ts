/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { PUT, DELETE } from "./route";
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
    lesson: {
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("PUT /api/admin/lessons/[id]", () => {
  it("should return 401 if token is missing", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue(undefined),
    } as any));

    const req = new NextRequest("http://localhost/api/admin/lessons/lesson-123", {
      method: "PUT",
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "lesson-123" }) });

    expect(res.status).toBe(401);
  });

  it("should return 403 if user is not ADMIN", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));
    vi.mocked(verifyToken).mockReturnValue({ userId: "user-123", role: "STUDENT" });

    const req = new NextRequest("http://localhost/api/admin/lessons/lesson-123", {
      method: "PUT",
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "lesson-123" }) });

    expect(res.status).toBe(403);
  });

  it("should update lesson status and return 200 on success", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));
    vi.mocked(verifyToken).mockReturnValue({ userId: "admin-123", role: "ADMIN" });

    const mockUpdatedLesson = {
      id: "lesson-123",
      title: "Updated Title",
      status: "PUBLISHED",
    };
    vi.mocked(prisma.lesson.update).mockResolvedValue(mockUpdatedLesson as any);

    const req = new NextRequest("http://localhost/api/admin/lessons/lesson-123", {
      method: "PUT",
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "lesson-123" }) });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.lesson.status).toBe("PUBLISHED");
  });
});

describe("DELETE /api/admin/lessons/[id]", () => {
  it("should return 401 if token is missing", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue(undefined),
    } as any));

    const req = new NextRequest("http://localhost/api/admin/lessons/lesson-123", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "lesson-123" }) });

    expect(res.status).toBe(401);
  });

  it("should delete lesson and return 200 on success", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));
    vi.mocked(verifyToken).mockReturnValue({ userId: "admin-123", role: "ADMIN" });

    vi.mocked(prisma.lesson.delete).mockResolvedValue({ id: "lesson-123" } as any);

    const req = new NextRequest("http://localhost/api/admin/lessons/lesson-123", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "lesson-123" }) });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
