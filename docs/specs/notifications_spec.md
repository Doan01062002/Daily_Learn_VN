# Đặc tả Kỹ thuật: Hệ thống Nhắc nhở & Email Service (Notifications Specs)

Tài liệu này đặc tả cơ chế lọc học viên quên học bài và dịch vụ gửi Email thông báo nhắc nhở giữ chuỗi Streak học tập.

---

## 1. Cơ chế lọc học viên chưa học (Streak Risk Query)

*   **Thời gian chạy**: Thường chạy vào lúc 20:00 tối hằng ngày.
*   **Thuật toán xác định học viên chưa học ngày hôm nay**:
    1.  Xác định mốc thời gian bắt đầu của ngày hiện tại (Start of Day, ví dụ `00:00:00` theo múi giờ local).
    2.  Truy vấn cơ sở dữ liệu tìm tất cả các người dùng:
        *   Đã đăng ký chủ đề học tập (interestedTopics không rỗng).
        *   KHÔNG có bản ghi `UserLessonProgress` nào ở trạng thái `COMPLETED` có trường `completedAt >= Start of Day`.
*   **Prisma Query gợi ý**:
    ```typescript
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const usersToRemind = await prisma.user.findMany({
      where: {
        interestedTopics: { hasSome: ["Tech", "Business", "Design", "SoftSkills", "Health"] },
        progress: {
          none: {
            status: "COMPLETED",
            completedAt: { gte: startOfToday }
          }
        }
      },
      include: {
        streaks: true
      }
    });
    ```

---

## 2. Đặc tả API Trigger (`POST /api/notifications/remind`)

*   **Xác thực bảo vệ**: API này không mở công khai cho người dùng. Bắt buộc kiểm tra Header `Authorization: Bearer <CRON_SECRET>`. Nếu token không khớp, trả về `401 Unauthorized`.
*   **Request Payload**: Trống (hoặc tùy chọn truyền tham số `dryRun: true` để thử nghiệm lọc danh sách mà không thực sự gửi email).
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "success": true,
      "notifiedCount": 3,
      "users": [
        { "email": "student1@gmail.com", "streak": 3 }
      ]
    }
    ```

---

## 3. Dịch vụ gửi Email trừu tượng (`src/lib/notifications.ts`)

Lập trình một mô hình Service độc lập với nhà cung cấp (Provider-agnostic):
*   **Giao diện xuất bản**:
    ```typescript
    export async function sendEmail(params: {
      to: string;
      subject: string;
      html: string;
    }): Promise<boolean>;
    ```
*   **Chế độ phát triển (`process.env.NODE_ENV === 'development'`)**:
    *   Ghi toàn bộ thông tin gửi (Đến, Tiêu đề, Body) ra màn hình Console để lập trình viên gỡ lỗi mà không tốn phí hay spam email thật.
*   **Chế độ vận hành sản xuất (`process.env.NODE_ENV === 'production'`)**:
    *   Tích hợp Nodemailer gửi qua SMTP bảo mật hoặc gọi API Resend.
