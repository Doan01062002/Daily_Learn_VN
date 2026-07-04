# User Stories: Nhắc nhở qua Email giữ Streak (Notifications Flow)

Tài liệu này mô tả kịch bản sử dụng (User Stories) và các tiêu chí nghiệm thu (Acceptance Criteria) cho hệ thống thông báo nhắc nhở giữ chuỗi ngày Streak liên tục.

---

## 1. Chân dung người dùng & Kịch bản

### User Story 1: Nhận email cảnh báo mất chuỗi Streak (Streak Warning Email)
*   **Là** một học viên đang bận rộn đi làm cả ngày (Persona 2).
*   **Tôi muốn** nhận được một bức thư Email nhắc nhở thân thiện vào khoảng tối muộn (ví dụ 20:00 hoặc 21:00) nếu ngày hôm đó tôi chưa đăng nhập và hoàn thành bài đọc học tập nào.
*   **Để** tôi không bị vô tình quên học bài và làm đứt gãy chuỗi ngày Streak 🔥 học tập liên tục cực kỳ quý giá mà tôi đã tích lũy trong nhiều tuần qua.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Email có tiêu đề thu hút, đánh trực tiếp vào tâm lý giữ chuỗi, ví dụ: `"🔥 [Tên học viên], đừng để đứt chuỗi Streak ngày học hôm nay nhé!"` hoặc `"📚 Chỉ 5 phút tự học hôm nay để giữ chuỗi liên tiếp!"`.
*   **AC 2**: Nội dung email hiển thị:
    *   Lời chào cá nhân hóa theo tên học viên.
    *   Số ngày Streak hiện tại đang bị đe dọa (ví dụ: `Chuỗi 7 ngày liên tiếp của bạn sắp hết hạn sau vài giờ nữa!`).
    *   Đường link truy cập trực tiếp về Bảng điều khiển học tập (`/dashboard`) để học viên bấm vào và học ngay lập tức.
*   **AC 3**: Dịch vụ email chạy ổn định, không gửi trùng lặp cho người đã học xong hôm nay.

---

### User Story 2: Lập lịch Cron Job tự động (Automated Cron Job Dispatch)
*   **Là** một quản trị viên vận hành hệ thống Daily Learn VN.
*   **Tôi muốn** hệ thống có một endpoint API đáng tin cậy hỗ trợ xác thực mã khóa an toàn để dịch vụ Cron bên thứ ba (như Vercel Cron hay Cron-Job.org) gọi quét hằng ngày.
*   **Để** tự động hóa hoàn toàn quy trình gửi thư nhắc nhở mỗi tối mà không cần sự can thiệp thủ công từ đội ngũ quản trị.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: API `/api/notifications/remind` từ chối các request thông thường không có mã khóa bảo vệ `CRON_SECRET` trong Header.
*   **AC 2**: Khi gọi API thành công:
    *   Hệ thống xác định chính xác danh sách những ai chưa học.
    *   Gửi email nhắc nhở hàng loạt bằng phương thức bất đồng bộ.
    *   Trả về báo cáo thống kê số lượng email đã gửi thành công để ghi nhận log giám sát.
