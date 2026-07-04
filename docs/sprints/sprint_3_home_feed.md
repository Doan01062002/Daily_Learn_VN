# Sprint 3: Màn hình chính & Phân phối bài học (Home Feed)

- **Mục tiêu chính**: Thiết lập thuật toán gợi ý bài học hằng ngày dựa trên cấu hình học viên và hiển thị Dashboard học tập.

---

## Danh sách công việc (Checklist)

### 1. Specs & Stories Setup
- [x] Tạo tài liệu đặc tả kỹ thuật: `docs/specs/home_feed_spec.md`
- [x] Tạo tài liệu kịch bản sử dụng: `docs/user_stories/home_feed_flow.md`

### 2. Backend & Database Seed
- [ ] Lập trình API `/api/lessons/today` lấy danh sách bài học trong ngày.
- [ ] Triển khai thuật toán tính thời lượng đọc (Read time) tự động từ số từ của bài học.
- [ ] Viết kịch bản Seed cơ sở dữ liệu (`prisma/seed.ts`) tạo sẵn ~15 bài học mẫu với đầy đủ phân loại (Tech, Business, SoftSkills...) để hệ thống có dữ liệu phân phối.

### 3. Frontend & UIs
- [ ] Thiết kế trang Dashboard chính (`/dashboard`) hiển thị danh sách bài học hôm nay dạng thẻ đẹp mắt.
- [ ] Hiển thị widget Streak động và tiến độ học tập (Progress) của ngày hôm nay.
- [ ] Tạo màn hình chi tiết bài học (`/lessons/[id]`) tích hợp nút "Đã học xong" để tăng Streak.

---

## Tài liệu liên quan
- Đặc tả kỹ thuật: [home_feed_spec.md](../specs/home_feed_spec.md)
- Kịch bản sử dụng: [home_feed_flow.md](../user_stories/home_feed_flow.md)
