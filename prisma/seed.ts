import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/**
 * Extracts the direct PostgreSQL connection string from the Prisma Postgres (prisma+postgres://) URL
 * by base64-decoding the api_key query parameter. Returns the original URL if not prisma+postgres.
 */
function getDirectConnectionString(url: string): string {
  if (url.startsWith("prisma+postgres://")) {
    try {
      const parsedUrl = new URL(url);
      const apiKey = parsedUrl.searchParams.get("api_key");
      if (apiKey) {
        const decoded = Buffer.from(apiKey, "base64").toString("utf-8");
        const json = JSON.parse(decoded);
        if (json.databaseUrl) {
          return json.databaseUrl;
        }
      }
    } catch (error) {
      console.error("Failed to parse Prisma Postgres DATABASE_URL, using fallback:", error);
    }
  }
  return url;
}

const rawConnectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";
const directConnectionString = getDirectConnectionString(rawConnectionString);

const pool = new Pool({ connectionString: directConnectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const LESSONS = [
  // TECH TOPIC
  {
    title: "Hiểu nhanh về RESTful API",
    tags: ["Tech"],
    sourceDomain: "medium.com",
    summary: [
      "RESTful API sử dụng các phương thức HTTP chuẩn như GET (đọc), POST (tạo), PUT (sửa), DELETE (xóa).",
      "Mọi request phải đảm bảo tính phi trạng thái (stateless) - không lưu trữ context trên server.",
      "Đặt tên URL sử dụng danh từ số nhiều đại diện cho tài nguyên, ví dụ: /api/v1/users thay vì /api/getUsers."
    ],
    actionableStep: "Thực hành thiết kế 3 Endpoint RESTful chuẩn cho thực thể 'Bài viết' (Posts).",
    level: "Beginner",
    status: "PUBLISHED" as const,
  },
  {
    title: "Kiến trúc Microservices cơ bản",
    tags: ["Tech"],
    sourceDomain: "dev.to",
    summary: [
      "Chia nhỏ một khối Monolith cồng kềnh thành các dịch vụ nhỏ độc lập giao tiếp qua HTTP hoặc Message Broker.",
      "Cho phép các team phát triển và mở rộng hạ tầng (scale) độc lập theo từng chức năng.",
      "Thử thách lớn nhất là đảm bảo tính nhất quán dữ liệu (Data Consistency) và quản lý log phân tán."
    ],
    actionableStep: "Vẽ sơ đồ luồng đi của request từ API Gateway đến 2 microservices: Users và Orders.",
    level: "Experienced",
    status: "PUBLISHED" as const,
  },
  {
    title: "Docker và Container hóa",
    tags: ["Tech"],
    sourceDomain: "docker.com",
    summary: [
      "Docker container đóng gói toàn bộ code và dependencies chạy ổn định trên mọi máy tính.",
      "Khác với VM chạy cả hệ điều hành riêng, Container chia sẻ chung nhân hệ điều hành (Kernel) của máy Host.",
      "Giúp khởi động dịch vụ chỉ trong vài mili giây và cực kỳ tiết kiệm bộ nhớ RAM."
    ],
    actionableStep: "Viết một tệp Dockerfile tối giản để container hóa ứng dụng Node.js hiện tại.",
    level: "Beginner",
    status: "PUBLISHED" as const,
  },

  // BUSINESS TOPIC
  {
    title: "Mô hình 5 lực lượng cạnh tranh của Porter",
    tags: ["Business"],
    sourceDomain: "hbr.org",
    summary: [
      "Xác định sức ép cạnh tranh từ nhà cung cấp và khả năng thương lượng giá của khách hàng.",
      "Đánh giá rào cản gia nhập ngành của các đối thủ mới tiềm năng.",
      "Nhận diện nguy cơ từ sản phẩm thay thế và phân tích mức độ khốc liệt của các đối thủ hiện tại trong ngành."
    ],
    actionableStep: "Áp dụng mô hình Porter để phân tích sơ bộ mức độ cạnh tranh của thị trường App Học tập tại Việt Nam.",
    level: "Beginner",
    status: "PUBLISHED" as const,
  },
  {
    title: "Chỉ số Unit Economics trong Startup",
    tags: ["Business"],
    sourceDomain: "techcrunch.com",
    summary: [
      "Unit Economics là phân tích lợi nhuận dựa trên một đơn vị khách hàng hoặc giao dịch đơn lẻ.",
      "Chi phí sở hữu khách hàng (CAC) và Giá trị trọn đời khách hàng (LTV) là hai chỉ số sống còn.",
      "Một mô hình startup khỏe mạnh cần đạt tỷ lệ LTV/CAC tối thiểu lớn hơn 3 lần."
    ],
    actionableStep: "Tính toán chỉ số CAC nếu bạn chi 10 triệu VND chạy quảng cáo thu về được 50 học viên trả phí.",
    level: "Experienced",
    status: "PUBLISHED" as const,
  },

  // DESIGN TOPIC
  {
    title: "Quy tắc khoảng trắng (Whitespace) trong UI",
    tags: ["Design"],
    sourceDomain: "refactoringui.com",
    summary: [
      "Khoảng trắng không phải là không gian lãng phí, nó giúp giao diện dễ thở và tăng tính thẩm mỹ.",
      "Hỗ trợ phân cấp thị giác (Visual Hierarchy), dẫn dắt mắt người đọc tập trung vào nội dung quan trọng.",
      "Áp dụng nguyên tắc khoảng cách đệm đồng đều (Consistent spacing system) để giao diện trông premium."
    ],
    actionableStep: "Tăng khoảng cách padding từ 12px lên 24px cho một thẻ sản phẩm để thấy sự khác biệt về độ thoáng.",
    level: "Beginner",
    status: "PUBLISHED" as const,
  },
  {
    title: "Hệ thống lưới (Grid System) trong Layout",
    tags: ["Design"],
    sourceDomain: "smashingmagazine.com",
    summary: [
      "Hệ thống lưới 12 cột giúp thiết kế giao diện có cấu trúc cân đối và dễ dàng căn lề.",
      "Số 12 là số chia hết cho 2, 3, 4, 6 mang lại sự linh hoạt tối đa khi chia layout thành nhiều cột.",
      "Giúp lập trình viên dễ dàng chuyển đổi bố cục giao diện responsive mượt mà từ PC sang Mobile."
    ],
    actionableStep: "Phác thảo layout 12 cột trên giấy và vẽ cách chia bố cục khi ở màn hình PC (3 cột) và Mobile (1 cột).",
    level: "Beginner",
    status: "PUBLISHED" as const,
  },
  {
    title: "Áp dụng Luật Fitts trong Thiết kế Tương tác",
    summary: [
      "Thời gian người dùng click/chạm vào một nút phụ thuộc vào khoảng cách địa lý và kích thước nút đó.",
      "Đặt các nút hành động quan trọng (như Nút Thanh Toán) ở vùng ngón cái dễ chạm đến nhất trên điện thoại.",
      "Thiết kế kích thước nút bấm tối thiểu đạt 48x48px để tránh bấm nhầm và cải thiện trải nghiệm sử dụng."
    ],
    actionableStep: "Kiểm tra và tăng kích thước vùng chạm của nút 'Đăng xuất' trên màn hình điện thoại đạt chuẩn 48px.",
    tags: ["Design"],
    sourceDomain: "nngroup.com",
    level: "Experienced",
    status: "PUBLISHED" as const,
  },

  // SOFTSKILLS TOPIC
  {
    title: "Kỹ thuật quả cà chua Pomodoro",
    tags: ["SoftSkills"],
    sourceDomain: "mindtools.com",
    summary: [
      "Chia thời gian làm việc thành chu kỳ 25 phút tập trung cao độ và nghỉ ngắn 5 phút để tái tạo năng lượng.",
      "Trong suốt 25 phút học, tắt toàn bộ thông báo và chỉ tập trung vào một nhiệm vụ duy nhất.",
      "Sau mỗi 4 chu kỳ Pomodoro, tự thưởng cho mình một khoảng nghỉ dài từ 15-30 phút."
    ],
    actionableStep: "Thiết lập đồng hồ đếm ngược đúng 25 phút và hoàn thành việc đọc sách không cầm vào điện thoại.",
    level: "Beginner",
    status: "PUBLISHED" as const,
  },
  {
    title: "Nguyên tắc giao tiếp Minto Pyramid",
    tags: ["SoftSkills"],
    sourceDomain: "mckinsey.com",
    summary: [
      "Nguyên tắc cấu trúc giao tiếp đi xuống: Luôn đưa ra kết luận cốt lõi ở câu đầu tiên.",
      "Sau khi đưa ra kết luận, trình bày các luận điểm chứng minh rõ ràng ở các phần tiếp theo.",
      "Giúp tiết kiệm tối đa thời gian cho người nghe bận rộn và làm luận điểm của bạn có sức thuyết phục cao."
    ],
    actionableStep: "Viết lại một email xin nghỉ phép theo chuẩn Minto: Đưa lý do và ngày nghỉ lên dòng đầu tiên.",
    level: "Experienced",
    status: "PUBLISHED" as const,
  },

  // HEALTH TOPIC
  {
    title: "Nhịp sinh học và Giấc ngủ ngon",
    tags: ["Health"],
    sourceDomain: "sleepfoundation.org",
    summary: [
      "Một chu kỳ giấc ngủ đầy đủ kéo dài 90 phút qua các giai đoạn ru ngủ, ngủ nông, ngủ sâu và mơ (REM).",
      "Thức dậy sảng khoái nhất là khi cơ thể nằm ở cuối chu kỳ (khi giấc ngủ nông nhất).",
      "Nên ngủ đủ tối thiểu 5-6 chu kỳ mỗi đêm (khoảng 7.5 đến 9 tiếng) để phục hồi não bộ toàn diện."
    ],
    actionableStep: "Lên lịch ngủ tối nay sao cho thời gian từ lúc nhắm mắt đến lúc báo thức chia hết cho 90 phút.",
    level: "Beginner",
    status: "PUBLISHED" as const,
  },
  {
    title: "Tác hại của ngồi nhiều & tư thế làm việc chuẩn",
    tags: ["Health"],
    sourceDomain: "mayoclinic.org",
    summary: [
      "Ngồi liên tục trên 6 tiếng mỗi ngày làm chậm quá trình trao đổi chất và tăng nguy cơ đau cột sống.",
      "Tư thế chuẩn: Màn hình ngang tầm mắt, khuỷu tay vuông góc 90 độ, chân đặt phẳng trên sàn nhà.",
      "Áp dụng quy tắc 50-2: Sau 50 phút ngồi làm việc, đứng dậy đi lại nhẹ nhàng trong 2 phút."
    ],
    actionableStep: "Cài đặt ứng dụng nhắc nhở đứng dậy vận động sau mỗi 50 phút làm việc liên tục.",
    level: "Beginner",
    status: "PUBLISHED" as const,
  },
];

async function main() {
  console.log("Cleaning Database...");
  await prisma.userLessonProgress.deleteMany({});
  await prisma.lesson.deleteMany({});

  console.log("Seeding Lessons...");
  for (const lesson of LESSONS) {
    await prisma.lesson.create({
      data: lesson,
    });
  }

  console.log(`Successfully seeded ${LESSONS.length} lessons.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
