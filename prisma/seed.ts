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
    quizzes: [
      {
        question: "RESTful API sử dụng phương thức HTTP nào để tạo mới tài nguyên?",
        options: ["GET", "POST", "PUT", "DELETE"],
        correctAnswer: "POST",
        explanation: "Phương thức POST được thiết kế để gửi dữ liệu lên server để tạo mới một tài nguyên con.",
      }
    ]
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
    quizzes: [
      {
        question: "Thách thức lớn nhất khi thiết kế cơ sở dữ liệu trong Microservices là gì?",
        options: ["Hiệu năng truy vấn chậm", "Tính nhất quán dữ liệu (Data Consistency)", "Khó sao lưu dữ liệu", "Không dùng được PostgreSQL"],
        correctAnswer: "Tính nhất quán dữ liệu (Data Consistency)",
        explanation: "Do mô hình mỗi dịch vụ quản lý một database riêng, việc đồng bộ dữ liệu giữa các dịch vụ để đảm bảo tính nhất quán rất phức tạp.",
      }
    ]
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
    quizzes: [
      {
        question: "Sự khác biệt cốt lõi giúp Container khởi động nhanh hơn Virtual Machine là gì?",
        options: ["Chạy trực tiếp file exe", "Không cần ổ đĩa cứng", "Chia sẻ chung nhân hệ điều hành (Kernel)", "Không dùng RAM"],
        correctAnswer: "Chia sẻ chung nhân hệ điều hành (Kernel)",
        explanation: "Container chia sẻ nhân OS của máy Host và chỉ đóng gói các thư viện ứng dụng, trong khi VM phải khởi chạy toàn bộ Guest OS riêng.",
      }
    ]
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
    quizzes: [
      {
        question: "Yếu tố nào trong 5 lực lượng cạnh tranh nói về sức ép từ đối thủ cùng ngành?",
        options: ["Sức ép từ khách hàng", "Mức độ cạnh tranh của các đối thủ hiện tại", "Nguy cơ sản phẩm thay thế", "Sức ép từ nhà cung cấp"],
        correctAnswer: "Mức độ cạnh tranh của các đối thủ hiện tại",
        explanation: "Đây là cường độ cạnh tranh trực tiếp giữa các doanh nghiệp đang cùng kinh doanh một dòng sản phẩm trên thị trường.",
      }
    ]
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
    quizzes: [
      {
        question: "Tỷ lệ LTV / CAC lý tưởng tối thiểu của một startup bền vững là bao nhiêu?",
        options: ["Lớn hơn 1", "Lớn hơn 3", "Bằng 0.5", "Lớn hơn 10"],
        correctAnswer: "Lớn hơn 3",
        explanation: "Tỷ lệ LTV/CAC > 3 chứng tỏ giá trị thu về từ một khách hàng cao gấp 3 lần chi phí bỏ ra để có khách hàng đó.",
      }
    ]
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
    quizzes: [
      {
        question: "Mục đích quan trọng nhất của việc sử dụng khoảng trắng (Whitespace) trong UI là gì?",
        options: ["Làm trang web dài hơn", "Nhóm các phần tử và tạo hệ thống phân cấp thị giác", "Giảm dung lượng trang web", "Tránh sử dụng màu sắc"],
        correctAnswer: "Nhóm các phần tử và tạo hệ thống phân cấp thị giác",
        explanation: "Khoảng trắng giúp mắt người dùng dễ phân biệt các cụm thông tin và nhận diện yếu tố quan trọng nhất trên màn hình.",
      }
    ]
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
    quizzes: [
      {
        question: "Tại sao hệ thống lưới 12 cột lại được ưa chuộng rộng rãi trong thiết kế Responsive?",
        options: ["Vì nó chia đều được cho 2, 3, 4 và 6", "Vì nó bắt buộc bởi Apple", "Vì nó tốn ít CSS nhất", "Vì nó hiển thị được 12 hình ảnh"],
        correctAnswer: "Vì nó chia đều được cho 2, 3, 4 và 6",
        explanation: "Số 12 chia hết cho nhiều số giúp chia bố cục linh hoạt thành 2, 3, 4 hoặc 6 phần bằng nhau.",
      }
    ]
  },
  {
    title: "Áp dụng Luật Fitts trong Thiết kế Tương tác",
    tags: ["Design"],
    sourceDomain: "nngroup.com",
    summary: [
      "Thời gian người dùng click/chạm vào một nút phụ thuộc vào khoảng cách địa lý và kích thước nút đó.",
      "Đặt các nút hành động quan trọng (như Nút Thanh Toán) ở vùng ngón cái dễ chạm đến nhất trên điện thoại.",
      "Thiết kế kích thước nút bấm tối thiểu đạt 48x48px để tránh bấm nhầm và cải thiện trải nghiệm sử dụng."
    ],
    actionableStep: "Kiểm tra và tăng kích thước vùng chạm của nút 'Đăng xuất' trên màn hình điện thoại đạt chuẩn 48px.",
    level: "Experienced",
    status: "PUBLISHED" as const,
    quizzes: [
      {
        question: "Theo Luật Fitts, hai yếu tố nào quyết định thời gian người dùng tương tác với một nút bấm?",
        options: ["Màu sắc và viền của nút", "Khoảng cách và kích thước của nút", "Font chữ và đổ bóng của nút", "Độ trong suốt và tốc độ mạng"],
        correctAnswer: "Khoảng cách và kích thước của nút",
        explanation: "Luật Fitts phát biểu thời gian di chuyển tới mục tiêu tỷ lệ thuận với khoảng cách và tỷ lệ nghịch với kích thước mục tiêu.",
      }
    ]
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
    quizzes: [
      {
        question: "Một chu kỳ làm việc Pomodoro tiêu chuẩn kéo dài bao nhiêu phút tập trung?",
        options: ["15 phút", "25 phút", "50 phút", "60 phút"],
        correctAnswer: "25 phút",
        explanation: "Một Pomodoro tiêu chuẩn gồm 25 phút làm việc tập trung hoàn toàn và nghỉ ngắn 5 phút.",
      }
    ]
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
    quizzes: [
      {
        question: "Theo Nguyên tắc Kim tự tháp Minto, thông tin nào nên được trình bày đầu tiên?",
        options: ["Các lập luận chi tiết", "Quy trình khảo sát", "Kết luận cốt lõi", "Lời chào hỏi dài dòng"],
        correctAnswer: "Kết luận cốt lõi",
        explanation: "Nguyên tắc Minto khuyên cấu trúc giao tiếp đi xuống: đưa kết luận chính lên trước, giải thích chứng minh theo sau.",
      }
    ]
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
    quizzes: [
      {
        question: "Thời lượng trung bình của một chu kỳ giấc ngủ hoàn chỉnh ở người trưởng thành là bao nhiêu?",
        options: ["45 phút", "90 phút", "120 phút", "180 phút"],
        correctAnswer: "90 phút",
        explanation: "Mỗi chu kỳ giấc ngủ kéo dài trung bình 90 phút. Thức dậy vào cuối chu kỳ giúp cơ thể sảng khoái nhất.",
      }
    ]
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
    quizzes: [
      {
        question: "Tư thế đặt chân chuẩn xác nhất khi ngồi làm việc trước máy tính là gì?",
        options: ["Bắt chéo chân", "Đặt phẳng trên mặt sàn", "Gác chân lên ghế", "Duỗi thẳng chân về trước"],
        correctAnswer: "Đặt phẳng trên mặt sàn",
        explanation: "Bàn chân chạm phẳng thoải mái trên sàn nhà giúp giảm sức ép lên đùi và phân bổ đều trọng lượng lên hông.",
      }
    ]
  },
  // APPLICATION PRACTICE TOPIC
  {
    title: "Thực hành khởi tạo Git & GitHub",
    tags: ["Tech"],
    sourceDomain: "github.com",
    summary: [
      "Lệnh git init dùng để khởi tạo một local repository mới.",
      "Lệnh git commit ghi lại các thay đổi của bạn kèm thông điệp rõ ràng.",
      "Lệnh git push đẩy lịch sử code cục bộ lên máy chủ đám mây GitHub."
    ],
    actionableStep: "Mở Terminal và gõ 'git init' để bắt đầu quản lý phiên bản mã nguồn của bạn.",
    level: "Beginner",
    status: "PUBLISHED" as const,
    steps: [
      {
        stepNumber: 1,
        title: "Khởi tạo Kho chứa cục bộ (git init)",
        instruction: "Hãy mở ứng dụng Terminal trên máy tính, di chuyển đến thư mục dự án và gõ lệnh sau để khởi tạo Git:\n\n`git init`",
        appType: "terminal",
        actionKey: "git_init",
        imageUrl: "/git_terminal.png",
        hotspotX: 25.5,
        hotspotY: 42.0,
        hotspotRadius: 6
      },
      {
        stepNumber: 2,
        title: "Theo dõi tệp tin và Đóng gói (git commit)",
        instruction: "Sử dụng lệnh sau để thêm tất cả các tệp thay đổi vào vùng chờ (Staging Area), sau đó đóng gói chúng kèm thông điệp:\n\n`git add .`  \n`git commit -m 'initial commit'`",
        appType: "terminal",
        actionKey: "git_commit",
        imageUrl: "/git_terminal.png",
        hotspotX: 42.5,
        hotspotY: 55.0,
        hotspotRadius: 6
      },
      {
        stepNumber: 3,
        title: "Đẩy mã nguồn lên GitHub (git push)",
        instruction: "Liên kết kho chứa cục bộ với kho chứa từ xa trên GitHub và đẩy mã nguồn lên nhánh chính (main):\n\n`git remote add origin <url>`  \n`git push -u origin main`",
        appType: "terminal",
        actionKey: "git_push",
        imageUrl: "/git_terminal.png",
        hotspotX: 68.0,
        hotspotY: 72.0,
        hotspotRadius: 6
      }
    ],
    quizzes: [
      {
        question: "Lệnh nào được dùng để kiểm tra trạng thái thay đổi của các tệp tin trong thư mục Git?",
        options: ["git init", "git status", "git commit", "git push"],
        correctAnswer: "git status",
        explanation: "Lệnh 'git status' hiển thị trạng thái của các tệp đã được đưa vào staging area hoặc chưa được theo dõi bởi Git."
      }
    ]
  },
  {
    title: "Thiết kế Frame đầu tiên trên Figma",
    tags: ["Design"],
    sourceDomain: "figma.com",
    summary: [
      "Frame trong Figma là vùng chứa bố cục (Artboard) chứa các thành phần thiết kế.",
      "Phím tắt F mở nhanh công cụ chọn kích thước Frame chuẩn ở bảng điều khiển bên phải.",
      "Sử dụng Auto Layout để thiết kế giao diện tự động căn lề và co giãn linh hoạt."
    ],
    actionableStep: "Mở Figma, tạo một file mới và vẽ một Frame iPhone 14 Pro Max chuẩn.",
    level: "Beginner",
    status: "PUBLISHED" as const,
    steps: [
      {
        stepNumber: 1,
        title: "Chọn Công cụ vẽ Frame",
        instruction: "Nhấp chuột vào biểu tượng **Frame** trên thanh công cụ góc trái phía trên hoặc nhấn phím tắt **F** để kích hoạt chế độ vẽ vùng chứa.",
        appType: "figma",
        actionKey: "frame_tool",
        imageUrl: "/figma_preset.png",
        hotspotX: 18.0,
        hotspotY: 22.5,
        hotspotRadius: 5
      },
      {
        stepNumber: 2,
        title: "Chọn Kích thước Thiết bị chuẩn",
        instruction: "Tại bảng tùy chọn xuất hiện ở menu bên phải, nhấp chọn mục **Phone** và chọn kích thước **iPhone 14 / 15 Pro** để tự động tạo kích thước Canvas chuẩn.",
        appType: "figma",
        actionKey: "select_preset",
        imageUrl: "/figma_preset.png",
        hotspotX: 82.5,
        hotspotY: 38.0,
        hotspotRadius: 5
      },
      {
        stepNumber: 3,
        title: "Áp dụng Màu nền & Bo góc",
        instruction: "Nhấp chọn Frame vừa tạo, di chuyển sang bảng Fill để đổi màu nền thành `#F9F7F4`, đồng thời thiết lập Corner Radius (bo góc) bằng `24px` ở bảng Design.",
        appType: "figma",
        actionKey: "border_radius",
        imageUrl: "/figma_preset.png",
        hotspotX: 86.0,
        hotspotY: 64.5,
        hotspotRadius: 5
      }
    ],
    quizzes: [
      {
        question: "Phím tắt nào giúp mở nhanh công cụ vẽ Frame trong Figma?",
        options: ["F", "V", "R", "T"],
        correctAnswer: "F",
        explanation: "Phím tắt F (hoặc A) kích hoạt ngay công cụ Frame Tool giúp vẽ nhanh các vùng chứa thiết kế trong Figma."
      }
    ]
  }
];
async function main() {
  console.log("Cleaning Database...");
  await prisma.userLessonProgress.deleteMany({});
  await prisma.streak.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          "student1@gmail.com",
          "student2@gmail.com",
          "student3@gmail.com",
          "student4@gmail.com",
          "student5@gmail.com",
        ],
      },
    },
  });

  console.log("Seeding Lessons and Quizzes...");
  const createdLessons = [];
  for (const lessonData of LESSONS) {
    const { quizzes, ...lessonFields } = lessonData;
    const l = await prisma.lesson.create({
      data: {
        ...lessonFields,
        quizzes: {
          create: quizzes,
        },
      },
    });
    createdLessons.push(l);
  }
  console.log(`Successfully seeded ${createdLessons.length} lessons and quizzes.`);

  const virtualUsers = [
    {
      email: "student1@gmail.com",
      name: "Nguyễn Hoàng Nam",
      role: "STUDENT" as const,
      currentStreak: 3,
      maxStreak: 5,
      completedCount: 3,
      quizScore: 80,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    },
    {
      email: "student2@gmail.com",
      name: "Trần Thị Lan",
      role: "STUDENT" as const,
      currentStreak: 7,
      maxStreak: 10,
      completedCount: 5,
      quizScore: 90,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    },
    {
      email: "student3@gmail.com",
      name: "Lê Văn Đạt",
      role: "STUDENT" as const,
      currentStreak: 12,
      maxStreak: 12,
      completedCount: 8,
      quizScore: 85,
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
    },
    {
      email: "student4@gmail.com",
      name: "Phạm Hồng Nhung",
      role: "PREMIUM" as const,
      currentStreak: 15,
      maxStreak: 20,
      completedCount: 11,
      quizScore: 95,
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    },
    {
      email: "student5@gmail.com",
      name: "Đỗ Minh Đức",
      role: "PREMIUM" as const,
      currentStreak: 2,
      maxStreak: 3,
      completedCount: 2,
      quizScore: 70,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
  ];

  console.log("Seeding Virtual Users, Streaks, and Progress...");
  for (const vu of virtualUsers) {
    const user = await prisma.user.create({
      data: {
        email: vu.email,
        name: vu.name,
        role: vu.role,
        avatarUrl: vu.avatarUrl,
        streaks: {
          create: {
            currentStreak: vu.currentStreak,
            maxStreak: vu.maxStreak,
            lastCompleted: new Date(),
          },
        },
      },
    });

    const lessonsToComplete = createdLessons.slice(0, vu.completedCount);
    for (const lesson of lessonsToComplete) {
      await prisma.userLessonProgress.create({
        data: {
          userId: user.id,
          lessonId: lesson.id,
          status: "COMPLETED",
          score: vu.quizScore,
          completedAt: new Date(),
        },
      });
    }
  }

  console.log("Successfully seeded database with virtual students and leaderboard data.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
