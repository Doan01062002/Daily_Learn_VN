# Đặc tả Kỹ thuật: API Thống kê & Bảng xếp hạng (Stats & Leaderboard Specs)

Tài liệu này đặc tả chi tiết các endpoints phục vụ truy vấn số liệu thống kê cá nhân và lập bảng xếp hạng học tập thi đua toàn diện.

---

## 1. API Endpoints

### 1.1. API Thống kê cá nhân (`GET /api/stats/user`)
*   **Xác thực**: Bắt buộc đăng nhập.
*   **Luồng xử lý trên Server**:
    1.  Lấy `userId` từ JWT.
    2.  Đếm tổng số bài đã hoàn thành:
        ```typescript
        const completedCount = await prisma.userLessonProgress.count({
          where: { userId, status: "COMPLETED" }
        });
        ```
    3.  Tính điểm trắc nghiệm trung bình:
        ```typescript
        const scoreAggregation = await prisma.userLessonProgress.aggregate({
          _avg: { score: true },
          where: { userId, status: "COMPLETED" }
        });
        const averageScore = scoreAggregation._avg.score || 0;
        ```
    4.  Đọc thông tin Streak: Lấy bản ghi `Streak` tương ứng với `userId`.
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "success": true,
      "stats": {
        "completedLessons": 12,
        "averageQuizScore": 85,
        "currentStreak": 5,
        "maxStreak": 14
      }
    }
    ```

---

### 1.2. API Bảng xếp hạng thi đua (`GET /api/stats/leaderboard`)
Truy vấn danh sách Top 10 học viên xuất sắc nhất hệ thống.

*   **Xác thực**: Bắt buộc đăng nhập.
*   **Thuật toán sắp xếp**:
    *   *Tiêu chí 1*: Chuỗi ngày học liên tục (`currentStreak`) giảm dần.
    *   *Tiêu chí 2*: Tổng số bài học đã hoàn thành (`completedLessons`) giảm dần.
*   **Prisma Query**:
    ```typescript
    const leaderboard = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        role: true,
        streaks: {
          select: {
            currentStreak: true,
            maxStreak: true
          }
        },
        progress: {
          where: { status: "COMPLETED" },
          select: { id: true }
        }
      }
    });
    ```
    *Lưu ý*: Server sẽ thực hiện định dạng lại kết quả, đếm số phần tử trong `progress` thành `completedLessons` để tối giản kích thước payload trả về Client.
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "success": true,
      "leaderboard": [
        {
          "rank": 1,
          "name": "Nguyễn Văn Đoan",
          "avatarUrl": "https://...",
          "role": "PREMIUM",
          "currentStreak": 14,
          "completedLessons": 32
        },
        {
          "rank": 2,
          "name": "Trần Anh Tuấn",
          "avatarUrl": "https://...",
          "role": "STUDENT",
          "currentStreak": 8,
          "completedLessons": 15
        }
      ]
    }
    ```
