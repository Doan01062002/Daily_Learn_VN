/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";
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
    userLessonProgress: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("GET /api/lessons/[id]/notes", () => {
  it("should return 401 if unauthorized", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue(undefined),
    } as any));

    const req = new NextRequest("http://localhost/api/lessons/lesson-1/notes");
    const res = await GET(req, { params: Promise.resolve({ id: "lesson-1" }) });
    expect(res.status).toBe(401);
  });

  it("should return empty string if no notes found", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));

    vi.mocked(verifyToken).mockReturnValue({ userId: "user-123", role: "STUDENT", email: "student@test.com" } as any);
    vi.mocked(prisma.userLessonProgress.findUnique).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/lessons/lesson-1/notes");
    const res = await GET(req, { params: Promise.resolve({ id: "lesson-1" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.notes).toBe("");
  });
});

describe("POST /api/lessons/[id]/notes", () => {
  it("should save notes successfully", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));

    vi.mocked(verifyToken).mockReturnValue({ userId: "user-123", role: "STUDENT", email: "student@test.com" } as any);
    vi.mocked(prisma.userLessonProgress.upsert).mockResolvedValue({
      id: "progress-1",
      userId: "user-123",
      lessonId: "lesson-1",
      notes: "Hello testing notes",
    } as any);

    const req = new NextRequest("http://localhost/api/lessons/lesson-1/notes", {
      method: "POST",
      body: JSON.stringify({ notes: "Hello testing notes" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "lesson-1" }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.notes).toBe("Hello testing notes");
  });
});
