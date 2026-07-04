# User Stories: Báo cáo Thống kê & Bảng xếp hạng (Stats & Leaderboard Flow)

Tài liệu này mô tả các kịch bản sử dụng (User Stories) và tiêu chí nghiệm thu (Acceptance Criteria) cho module thống kê tiến độ và bảng xếp hạng thi đua.

---

## 1. Chân dung người dùng & Kịch bản

### User Story 1: Theo dõi tiến độ học tập cá nhân (Personal Stats Analytics)
*   **Là** một học viên muốn học tập nghiêm túc (Persona 2: Người đi làm bận rộn).
*   **Tôi muốn** xem báo cáo tóm tắt quá trình học tập của mình gồm: tổng bài đã học, số ngày streak hiện tại, kỷ lục streak, và điểm thi trắc nghiệm trung bình.
*   **Để** tôi tự đánh giá mức độ chuyên cần và hiệu quả tiếp thu kiến thức của mình sau một khoảng thời gian tự học.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Trên Dashboard chính, cung cấp cấu trúc chuyển đổi giữa 2 tab: "Hôm nay" (danh sách bài học hằng ngày) và "Báo cáo & Thi đua" (Thống kê & Xếp hạng).
*   **AC 2**: Tab Thống kê hiển thị 4 hộp chỉ số đo lường với thiết kế Sleek:
    *   *Tổng số bài đã học* (ví dụ: `12 bài`).
    *   *Điểm Quiz trung bình* (ví dụ: `85%`).
    *   *Chuỗi Streak hiện tại* (ví dụ: `5 ngày`).
    *   *Kỷ lục chuỗi Streak* (ví dụ: `14 ngày`).
*   **AC 3**: Dữ liệu được cập nhật tự động sau mỗi lần người học hoàn thành bài đọc hoặc làm xong Quiz.

---

### User Story 2: Bảng thi đua xếp hạng Leaderboard (Social Gamification)
*   **Là** một người học thích sự thi đua và tính thử thách (Persona 1: Sinh viên công nghệ).
*   **Tôi muốn** nhìn thấy bảng xếp hạng Top 10 học viên có chuỗi học tập liên tục (Streak) cao nhất toàn hệ thống.
*   **Để** tôi có thêm động lực học tập đều đặn hằng ngày nhằm duy trì vị trí hoặc leo hạng trên Leaderboard.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Dưới phần Thống kê cá nhân là Bảng xếp hạng thi đua (Leaderboard) hiển thị Top 10.
*   **AC 2**: Mỗi hàng trong bảng xếp hạng hiển thị:
    *   Thứ hạng (Hạng 1, 2, 3 được trang trí màu Vàng, Bạc, Đồng kèm biểu tượng huy chương 🥇, 🥈, 🥉 nổi bật).
    *   Ảnh đại diện (Avatar), tên học viên (có nhãn Premium nếu là thành viên trả phí).
    *   Số ngày Streak hiện tại (icon 🔥 kèm số ngày).
    *   Tổng số bài học đã hoàn thành.
*   **AC 3**: Vị trí của người dùng hiện tại trong bảng xếp hạng sẽ được làm nổi bật với màu nền khác biệt để họ dễ dàng định vị bản thân.
