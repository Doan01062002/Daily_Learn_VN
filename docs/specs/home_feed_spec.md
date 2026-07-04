# Đặc tả Kỹ thuật: Module Phân phối Bài học (Home Feed) & Cập nhật Tiến độ

Tài liệu này đặc tả chi tiết thuật toán gợi ý bài học hằng ngày và API ghi nhận kết quả học tập để cập nhật chỉ số học tập liên tục (Streak).

---

## 1. Thuật toán gợi ý bài học hằng ngày (Today's Feed Algorithm)

Khi học viên gọi API lấy danh sách bài học hôm nay (`GET /api/lessons/today`), hệ thống sẽ lọc bài học theo các bước sau:

1.  **Lọc theo hồ sơ học tập (Profile Filtering)**:
    *   Chỉ chọn các bài học có `topic` nằm trong danh sách chủ đề quan tâm của học viên (`interestedTopics`).
    *   Chỉ chọn các bài học có độ khó tương ứng với trình độ (`currentLevel` - Beginner hoặc Experienced).
2.  **Lọc bỏ bài đã hoàn thành (Progress Exclusion)**:
    *   Truy vấn bảng `UserLessonProgress` để loại bỏ những bài viết học viên đã bấm hoàn thành (`completed: true`).
    *   *Trường hợp ngoại lệ*: Nếu danh sách bài mới bị cạn kiệt, hệ thống sẽ tự động đề xuất lại các bài viết cũ (hoặc bài học phổ biến) để đảm bảo học viên luôn có nội dung để học mỗi ngày.
3.  **Giới hạn số lượng (Daily Quota Limit)**:
    *   Số lượng bài viết đề xuất được tính toán dựa trên mức độ cam kết thời gian của học viên (`commitmentTime`):
        *   `5 phút/ngày` -> Trả về **1 bài viết** (mỗi bài viết có thời lượng đọc khoảng 3-5 phút).
        *   `10 phút/ngày` -> Trả về **2 bài viết**.
        *   `15 phút/ngày` -> Trả về **3 bài viết**.

---

## 2. API Endpoints

### 2.1. API Lấy danh sách bài học hôm nay (`GET /api/lessons/today`)
*   **Xác thực**: Bắt buộc phải đăng nhập (HttpOnly Cookie hoặc Bearer Header).
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "success": true,
      "lessons": [
        {
          "id": "lesson-uuid-1",
          "title": "5 nguyên tắc thiết kế UI tối giản",
          "summary": "Tập trung vào khoảng trắng, typography và màu sắc tối giản.",
          "content": "Nội dung bài viết chi tiết ở đây...",
          "topic": "Design",
          "level": "Beginner",
          "readTime": 4, 
          "completed": false
        }
      ]
    }
    ```

---

### 2.2. API Hoàn thành bài học và cập nhật Streak (`POST /api/lessons/[id]/complete`)
Nhận diện bài học học viên vừa hoàn thành để lưu tiến độ và tính toán Streak học liên tục.

*   **Tham số URL**: `id` là ID của bài học.
*   **Xử lý phía Server (Thuật toán cập nhật Streak)**:
    1.  Lấy thông tin người dùng từ JWT.
    2.  Tạo hoặc cập nhật bản ghi trong bảng `UserLessonProgress` với `completed: true` và `completedAt: CurrentTime`.
    3.  Truy vấn bảng `Streak` của người dùng:
        *   Lấy `lastActive` (Ngày hoạt động gần nhất).
        *   So sánh `lastActive` với ngày hiện tại (theo múi giờ Việt Nam GMT+7):
            *   *Nếu là ngày hôm nay*: Giữ nguyên Streak hiện tại (người dùng học tiếp bài thứ 2 trong ngày).
            *   *Nếu là ngày hôm qua*: Tăng `currentStreak` lên 1. Nếu `currentStreak` vượt qua `maxStreak`, cập nhật `maxStreak = currentStreak`.
            *   *Nếu cách xa hơn ngày hôm qua (đứt chuỗi)*: Reset `currentStreak = 1`.
        *   Cập nhật `lastActive = CurrentTime`.
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "success": true,
      "streak": {
        "currentStreak": 5,
        "maxStreak": 12,
        "lastActive": "2026-07-04T08:30:00Z"
      }
    }
    ```
