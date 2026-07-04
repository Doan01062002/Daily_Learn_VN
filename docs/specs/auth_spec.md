# Đặc tả Kỹ thuật: Module Xác thực (Authentication) & Onboarding

Tài liệu này đặc tả chi tiết về mặt kỹ thuật (Endpoints, Dữ liệu, Token) cho luồng xác thực người dùng và thiết lập Onboarding.

---

## 1. Cơ chế Xác thực kép (Dual Token Authentication)

Để phục vụ cả Web Client (hiện tại) và Mobile App (tương lai) mà không cần viết lại Backend, cơ chế xác thực sẽ kiểm tra session của người dùng thông qua 2 nguồn:

1.  **HttpOnly Cookie (Cho Web)**:
    *   Sau khi đăng nhập thành công, Next.js API lưu JWT vào cookie tên là `token`.
    *   Ràng buộc Cookie: `HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000` (30 ngày).
    *   Lợi ích: Trình duyệt tự động gửi cookie kèm theo mọi request mà client javascript không thể can thiệp (chống XSS).
2.  **Authorization Header (Cho App di động)**:
    *   Học viên đăng nhập từ App di động sẽ nhận được chuỗi JWT thuần túy.
    *   Khi gửi request lên API, App gửi JWT qua Header: `Authorization: Bearer <JWT_TOKEN>`.

### Cú pháp Middleware xử lý xác thực:
```typescript
// Ý tưởng giải thuật xác thực kép trong Backend:
let token = req.cookies.get("token")?.value;

if (!token) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }
}
```

---

## 2. API Endpoints

### 2.1. API Đăng nhập và tạo Session (`POST /api/auth/login`)
Nhận id_token từ Google Credential, kiểm tra tính hợp lệ và lấy thông tin User.

*   **Request Body**:
    ```json
    {
      "credential": "GOOGLE_OAUTH_ID_TOKEN_STRING"
    }
    ```
*   **Xử lý phía Server**:
    1.  Verify token qua Google Auth Library.
    2.  Lấy thông tin `email`, `name`, `picture` từ payload của Google.
    3.  Kiểm tra trong bảng `User` bằng Prisma:
        *   Nếu chưa tồn tại: Tạo mới user (role: `STUDENT`). Tạo bản ghi trống trong bảng `Streak`.
        *   Nếu đã tồn tại: Lấy thông tin user hiện có.
    4.  Tạo JWT chứa: `{ userId: user.id, email: user.email, role: user.role }`.
    5.  Thiết lập HttpOnly Cookie với JWT vừa tạo.
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "user": {
        "id": "user-uuid-string",
        "name": "Nguyen Van A",
        "email": "a@gmail.com",
        "role": "STUDENT",
        "isOnboarded": false
      },
      "token": "JWT_TOKEN_FOR_MOBILE_APP"
    }
    ```

---

### 2.2. API Lấy thông tin Session hiện tại (`GET /api/auth/session`)
Lấy thông tin người dùng đang đăng nhập dựa trên Cookie hoặc Bearer Header.

*   **Headers/Cookies**: Gửi kèm `token` cookie hoặc `Authorization: Bearer <token>`
*   **Response (200 OK - Đã đăng nhập)**:
    ```json
    {
      "user": {
        "id": "user-uuid-string",
        "name": "Nguyen Van A",
        "email": "a@gmail.com",
        "role": "STUDENT",
        "avatarUrl": "https://avatar-url",
        "isOnboarded": true,
        "interestedTopics": ["Tech", "Business"],
        "currentLevel": "Beginner",
        "commitmentTime": 5
      }
    }
    ```
*   **Response (401 Unauthorized - Chưa đăng nhập/Token hết hạn)**:
    ```json
    {
      "error": "Unauthorized"
    }
    ```

---

### 2.3. API Lưu thông tin Onboarding (`POST /api/auth/onboarding`)
Lưu các lựa chọn chủ đề học và trình độ của học viên mới.

*   **Ràng buộc bảo mật**: Bắt buộc phải đăng nhập trước khi gọi API này.
*   **Request Body**:
    ```json
    {
      "interestedTopics": ["Tech", "SoftSkills"],
      "currentLevel": "Experienced",
      "commitmentTime": 10
    }
    ```
*   **Xử lý phía Server**:
    1.  Verify JWT từ Cookie hoặc Header -> Lấy `userId`.
    2.  Cập nhật thông tin vào bảng `User` bằng Prisma:
        *   `interestedTopics = body.interestedTopics`
        *   `currentLevel = body.currentLevel`
        *   `commitmentTime = body.commitmentTime`
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "user": {
        "id": "user-uuid-string",
        "isOnboarded": true
      }
    }
    ```
