# Sprint 7: Thống kê & Bảng xếp hạng (Stats & Leaderboard)

- **Mục tiêu chính**: Thiết lập hệ thống thống kê tiến độ học tập cá nhân, tạo dữ liệu seed người dùng giả lập thi đua và hiển thị Bảng xếp hạng (Leaderboard) học tập.

---

## Danh sách công việc (Checklist)

### 1. Specs & Stories Setup
- [x] Tạo tài liệu đặc tả kỹ thuật: `docs/specs/stats_spec.md`
- [x] Tạo tài liệu kịch bản sử dụng: `docs/user_stories/stats_flow.md`

### 2. Backend & Seeding
- [ ] Lập trình API `/api/stats/user` tổng hợp tiến trình học tập cá nhân (Tổng số bài đã học, số ngày streak hiện tại, kỷ lục streak, điểm quiz trung bình).
- [ ] Lập trình API `/api/stats/leaderboard` truy vấn Top 10 học viên có chuỗi streak cao nhất toàn hệ thống.
- [ ] Cập nhật file seed `prisma/seed.ts` tự động tạo sẵn 5 học viên ảo có tên, avatar và các mốc streak phong phú để bảng xếp hạng trông sống động.

### 3. Frontend & UIs
- [ ] Tích hợp Tab "Xếp hạng & Thống kê" kế bên Tab "Bài học hôm nay" trên Dashboard.
- [ ] Thiết kế bảng xếp hạng Leaderboard: Hiển thị thứ hạng (Hạng 1, 2, 3 có huy hiệu đặc biệt), tên, avatar, chỉ số streak hiện tại và tổng số bài đã hoàn thành.
- [ ] Thiết kế khu vực biểu đồ/thống kê cá nhân trực quan.

---

## Tài liệu liên quan
- Đặc tả kỹ thuật: [stats_spec.md](../specs/stats_spec.md)
- Kịch bản sử dụng: [stats_flow.md](../user_stories/stats_flow.md)
