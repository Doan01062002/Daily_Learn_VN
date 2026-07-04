# Daily Learn VN - Lược đồ Cơ sở dữ liệu (Database Schema)

Tài liệu này đặc tả các bảng (Tables) trong PostgreSQL sử dụng Prisma ORM.

---

## 1. Các bảng dữ liệu (Tables)

### 1.1. Bảng `User`
Lưu trữ thông tin người dùng và cấu hình Onboarding.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key | ID định danh duy nhất |
| `name` | String | | Tên người dùng (lấy từ Google) |
| `email` | String | Unique | Email người dùng (lấy từ Google) |
| `avatarUrl`| String? | | Ảnh đại diện của người dùng |
| `role` | Enum (Role) | Default: `STUDENT` | Quyền truy cập: `STUDENT`, `PREMIUM`, `ADMIN` |
| `createdAt`| DateTime | Default: `now()` | Thời gian tạo tài khoản |
| `updatedAt`| DateTime | UpdatedAt | Thời gian cập nhật gần nhất |
| **Onboarding** | | | |
| `interestedTopics` | String[] | | Danh sách chủ đề quan tâm (ví dụ: Tech, Business) |
| `currentLevel` | String? | | Trình độ hiện tại: `Beginner`, `Experienced` |
| `commitmentTime`| Int? | | Thời gian cam kết học mỗi ngày (5, 10, 15 phút) |

---

### 1.2. Bảng `Lesson`
Lưu trữ nội dung bài học tĩnh do Admin kiểm duyệt và biên tập từ bản nháp của Gemini.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key | ID định danh bài học |
| `title` | String (100) | | Tiêu đề bài học |
| `tags` | String[] | | Tag danh mục bài học (ví dụ: #Javascript, #Sales) |
| `sourceDomain`| String | | Domain nguồn gốc bài viết (để ghi nhận bản quyền) |
| `summary` | String[] | | Mảng gồm 3 ý chính tóm tắt bài học (dưới 150 ký tự/ý) |
| `actionableStep`| String (Text) | | Hướng dẫn chi tiết từng bước thực hành trong 5 phút |
| `level` | String | | Mức độ phù hợp: `Beginner`, `Experienced` |
| `status` | Enum (Status)| Default: `DRAFT` | Trạng thái bài học: `DRAFT`, `PUBLISHED` |
| `createdAt`| DateTime | Default: `now()` | Ngày tạo bài học |

---

### 1.3. Bảng `Quiz`
Lưu trữ các câu hỏi trắc nghiệm liên kết với bài học (3 câu hỏi/bài học).

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key | ID định danh câu hỏi |
| `lessonId` | String (UUID) | Foreign Key -> `Lesson.id` | Liên kết với bài học tương ứng |
| `question` | String | | Nội dung câu hỏi |
| `options` | String[] | | Mảng chứa 4 đáp án lựa chọn |
| `correctAnswer`| String | | Đáp án chính xác (phải khớp hoàn toàn với 1 trong 4 option) |
| `explanation`| String | | Lời giải thích lý do đáp án đó đúng |

---

### 1.4. Bảng `UserLessonProgress`
Ghi nhận tiến trình học bài và điểm số của học sinh đối với từng bài học.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key | ID tiến trình |
| `userId` | String (UUID) | Foreign Key -> `User.id` | Học sinh thực hiện |
| `lessonId` | String (UUID) | Foreign Key -> `Lesson.id` | Bài học tương ứng |
| `status` | Enum (Progress)| Default: `IN_PROGRESS`| Trạng thái học: `IN_PROGRESS`, `COMPLETED` |
| `score` | Int | Default: 0 | Số câu trả lời đúng của bài Quiz (0, 1, 2, 3) |
| `completedAt`| DateTime? | | Thời gian hoàn thành bài học |

---

### 1.5. Bảng `Streak`
Theo dõi tần suất học liên tục hằng ngày của người dùng.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key | ID streak |
| `userId` | String (UUID) | Foreign Key -> `User.id` | Người dùng tương ứng |
| `currentStreak`| Int | Default: 0 | Chuỗi ngày học liên tục hiện tại |
| `maxStreak` | Int | Default: 0 | Chuỗi ngày học liên tục lớn nhất đã đạt |
| `lastCompleted`| DateTime? | | Ngày gần nhất hoàn thành bài học (dùng check đứt Streak) |

---

### 1.6. Bảng `PaymentTransaction`
Lưu trữ thông tin chuyển khoản nâng cấp Premium bằng QR code tĩnh.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key | ID giao dịch |
| `userId` | String (UUID) | Foreign Key -> `User.id` | Người dùng thanh toán |
| `amount` | Int | | Số tiền thanh toán (ví dụ: 59000) |
| `status` | Enum (TxStatus)| Default: `PENDING` | Trạng thái: `PENDING`, `COMPLETED`, `FAILED` |
| `txCode` | String | Unique | Mã chuyển khoản định danh sinh tự động (ví dụ: DLVN1023) |
| `createdAt`| DateTime | Default: `now()` | Ngày tạo giao dịch chuyển khoản |
| `updatedAt`| DateTime | UpdatedAt | Ngày duyệt giao dịch (khi Admin kích hoạt thành công) |
