# 04-backlog-mvp.md

# Backlog MVP - UrbanChain-VN

> Tài liệu này mô tả Product Backlog và Sprint Backlog cho MVP hệ thống quản lý hồ sơ đất đai, quy hoạch đô thị và giao dịch quyền sử dụng đất có tích hợp Blockchain, IPFS và AI Agents.

---

## 1. Mục tiêu MVP

MVP tập trung chứng minh khả năng số hoá và xác thực hồ sơ đất đai bằng mô hình:

- Lưu **tài liệu pháp lý** trên IPFS.
- Ghi **metadata, mã hồ sơ, trạng thái, hash tài liệu** lên blockchain.
- Quản lý quy trình nghiệp vụ gồm:
  - đăng ký thửa đất;
  - nộp hồ sơ pháp lý;
  - cán bộ tiếp nhận;
  - thẩm định;
  - phê duyệt;
  - phát hành chứng nhận số;
  - tra cứu lịch sử;
  - chuyển nhượng quyền sử dụng đất ở mức mô phỏng.
- Có phân quyền cho các vai trò:
  - Công dân / Chủ sử dụng đất;
  - Cán bộ tiếp nhận;
  - Cán bộ thẩm định;
  - Cán bộ phê duyệt;
  - Công chứng viên;
  - Quản trị hệ thống;
  - Người tra cứu công khai.
- Có AI Agents hỗ trợ:
  - kiểm tra thiếu hồ sơ;
  - gợi ý rủi ro pháp lý;
  - tóm tắt tài liệu;
  - hỗ trợ cán bộ xử lý;
  - hỗ trợ người dân chuẩn bị hồ sơ.

---

## 2. Phạm vi MVP

### 2.1. Trong phạm vi MVP

| Nhóm chức năng | Có trong MVP |
|---|---|
| Đăng nhập / phân quyền | Có |
| Quản lý người dùng | Có |
| Quản lý thửa đất | Có |
| Quản lý hồ sơ đất đai | Có |
| Upload tài liệu lên IPFS | Có |
| Ghi nhận hash lên blockchain | Có |
| Tra cứu lịch sử hồ sơ | Có |
| Quy trình duyệt hồ sơ | Có |
| Mô phỏng chuyển nhượng | Có |
| Dashboard quản trị | Có |
| Nhật ký thao tác | Có |
| AI hỗ trợ kiểm tra hồ sơ | Có |
| Kết nối VNeID thật | Chưa, chỉ mô phỏng |
| Thanh toán thật | Chưa |
| Ký số thật bằng CA quốc gia | Chưa, chỉ mô phỏng |
| Tích hợp CSDL đất đai quốc gia thật | Chưa |

### 2.2. Ngoài phạm vi MVP

- Kết nối trực tiếp với cơ sở dữ liệu đất đai quốc gia thật.
- Ký số pháp lý thật bằng chứng thư số quốc gia.
- Thanh toán thuế/phí/lệ phí thật.
- Liên thông đầy đủ với công chứng, thuế, ngân hàng, địa chính cấp xã/phường.
- Xác thực VNeID production.
- Hệ thống bản đồ GIS chuyên nghiệp đầy đủ lớp dữ liệu.

---

## 3. Vai trò người dùng

| Mã vai trò | Vai trò | Mô tả |
|---|---|---|
| R01 | Citizen | Người dân/chủ sử dụng đất |
| R02 | Reception Officer | Cán bộ tiếp nhận hồ sơ |
| R03 | Appraisal Officer | Cán bộ thẩm định |
| R04 | Approval Officer | Cán bộ phê duyệt |
| R05 | Notary Officer | Công chứng viên, dùng trong luồng chuyển nhượng |
| R06 | Admin | Quản trị hệ thống |
| R07 | Public Viewer | Người tra cứu thông tin công khai |
| R08 | AI Agent | Tác nhân AI hỗ trợ xử lý nghiệp vụ |

---

## 4. Epic Backlog tổng quan

| Epic ID | Tên Epic | Mục tiêu | Độ ưu tiên |
|---|---|---|---|
| EPIC-01 | Project Foundation | Khởi tạo repo, chuẩn hoá cấu trúc, môi trường, CI/CD cơ bản | Must |
| EPIC-02 | Authentication & RBAC | Đăng nhập, phân quyền, mô phỏng VNeID | Must |
| EPIC-03 | User & Organization Management | Quản lý người dùng, đơn vị xử lý, vai trò | Must |
| EPIC-04 | Land Parcel Management | Quản lý thửa đất, thông tin chủ sử dụng, vị trí, diện tích | Must |
| EPIC-05 | IPFS Document Storage | Upload, lưu hash, truy xuất tài liệu pháp lý | Must |
| EPIC-06 | Smart Contract & Blockchain | Ghi nhận hồ sơ, trạng thái, hash và lịch sử lên blockchain | Must |
| EPIC-07 | Land Dossier Workflow | Luồng nộp, tiếp nhận, thẩm định, phê duyệt hồ sơ | Must |
| EPIC-08 | Certificate & Ownership Record | Phát hành chứng nhận số/mô phỏng quyền sử dụng đất | Must |
| EPIC-09 | Transfer Workflow | Mô phỏng chuyển nhượng quyền sử dụng đất | Should |
| EPIC-10 | Search & Public Lookup | Tra cứu thửa đất, hồ sơ, lịch sử blockchain | Must |
| EPIC-11 | Admin Dashboard & Audit Log | Dashboard, nhật ký, thống kê, giám sát | Should |
| EPIC-12 | AI Agent Integration | Tích hợp AI hỗ trợ hồ sơ và cán bộ | Should |
| EPIC-13 | UI/UX & Frontend Flow | Giao diện người dùng theo từng vai trò | Must |
| EPIC-14 | Testing, Security & Deployment | Kiểm thử, bảo mật, seed data, deploy MVP | Must |

---

## 5. Product Backlog chi tiết

### EPIC-01: Project Foundation

| ID | User Story / Task | Mô tả chi tiết | Acceptance Criteria | Priority | Estimate | Sprint |
|---|---|---|---|---|---:|---|
| US-001 | Khởi tạo monorepo | Là developer, tôi muốn có cấu trúc repo rõ ràng để quản lý frontend, backend, smart contract và docs | Có thư mục `frontend`, `backend`, `contracts`, `docs`, `ai`, `scripts`; README chạy được | Must | 3 | Sprint 0 |
| US-002 | Cấu hình Git workflow | Là team lead, tôi muốn chuẩn hoá branch và commit để dễ quản lý tiến độ | Có nhánh `main`, `develop`, convention commit, PR template | Should | 2 | Sprint 0 |
| US-003 | Cấu hình môi trường backend | Là backend dev, tôi muốn có project Node.js/Express/TypeScript để xây API | Backend chạy được lệnh dev; có health check API | Must | 3 | Sprint 0 |
| US-004 | Cấu hình môi trường frontend | Là frontend dev, tôi muốn có React/Vite/TypeScript/Tailwind để xây UI | Frontend chạy được; có layout cơ bản | Must | 3 | Sprint 0 |
| US-005 | Cấu hình smart contract project | Là blockchain dev, tôi muốn có Hardhat để viết và test contract | Hardhat compile được contract mẫu | Must | 3 | Sprint 0 |
| US-006 | Cấu hình database ORM | Là backend dev, tôi muốn có Prisma và MariaDB/PostgreSQL để quản lý dữ liệu | Kết nối DB thành công; chạy migration đầu tiên | Must | 5 | Sprint 0 |
| US-007 | Cấu hình env mẫu | Là developer, tôi muốn có `.env.example` để setup nhanh | Có biến môi trường cho DB, JWT, IPFS, RPC, contract address | Must | 2 | Sprint 0 |
| US-008 | Viết README setup | Là thành viên mới, tôi muốn có hướng dẫn chạy dự án | README có bước cài, chạy backend/frontend/contract | Must | 3 | Sprint 0 |
| US-009 | Seed dữ liệu mẫu ban đầu | Là tester, tôi muốn có dữ liệu mẫu để demo | Có user mẫu, thửa đất mẫu, hồ sơ mẫu | Should | 3 | Sprint 0 |
| US-010 | Thiết lập format/lint | Là developer, tôi muốn code thống nhất | ESLint/Prettier hoạt động cho frontend/backend | Should | 2 | Sprint 0 |

---

### EPIC-02: Authentication & RBAC

| ID | User Story / Task | Mô tả chi tiết | Acceptance Criteria | Priority | Estimate | Sprint |
|---|---|---|---|---|---:|---|
| US-011 | Đăng nhập bằng email/password | Là người dùng, tôi muốn đăng nhập để sử dụng hệ thống | Đăng nhập thành công trả JWT; sai thông tin báo lỗi | Must | 5 | Sprint 1 |
| US-012 | Đăng xuất | Là người dùng, tôi muốn đăng xuất để bảo vệ tài khoản | Token bị xoá phía client; quay về login | Must | 2 | Sprint 1 |
| US-013 | Middleware xác thực JWT | Là backend, tôi muốn bảo vệ API bằng JWT | API private yêu cầu token hợp lệ | Must | 3 | Sprint 1 |
| US-014 | RBAC theo vai trò | Là admin, tôi muốn giới hạn quyền theo vai trò | Citizen không vào trang cán bộ; admin xem được trang quản trị | Must | 5 | Sprint 1 |
| US-015 | Mô phỏng VNeID login | Là công dân, tôi muốn xác thực danh tính mô phỏng qua VNeID | Có màn hình mock VNeID; trả về thông tin định danh giả lập | Should | 5 | Sprint 1 |
| US-016 | Quản lý thông tin phiên đăng nhập | Là người dùng, tôi muốn thấy tên và vai trò của mình sau khi đăng nhập | Header hiển thị tên, vai trò; reload không mất phiên | Must | 3 | Sprint 1 |
| US-017 | Trang đổi mật khẩu | Là người dùng, tôi muốn đổi mật khẩu | Nhập mật khẩu cũ đúng mới đổi được | Could | 3 | Sprint 2 |
| US-018 | Bảo vệ route frontend | Là người dùng, tôi chỉ được vào đúng trang theo quyền | Route guard hoạt động theo role | Must | 3 | Sprint 1 |

---

### EPIC-03: User & Organization Management

| ID | User Story / Task | Mô tả chi tiết | Acceptance Criteria | Priority | Estimate | Sprint |
|---|---|---|---|---|---:|---|
| US-019 | Tạo user bởi admin | Là admin, tôi muốn tạo tài khoản cán bộ | Admin tạo được user với vai trò cụ thể | Must | 5 | Sprint 2 |
| US-020 | Cập nhật user | Là admin, tôi muốn sửa thông tin tài khoản | Cập nhật tên, email, trạng thái, vai trò | Must | 3 | Sprint 2 |
| US-021 | Khoá/mở khoá user | Là admin, tôi muốn vô hiệu hoá tài khoản không còn sử dụng | User bị khoá không đăng nhập được | Should | 3 | Sprint 2 |
| US-022 | Danh sách user | Là admin, tôi muốn xem danh sách người dùng | Có bảng, phân trang, tìm kiếm theo tên/email/role | Must | 5 | Sprint 2 |
| US-023 | Quản lý đơn vị xử lý | Là admin, tôi muốn quản lý phòng ban/cơ quan xử lý | Tạo/sửa/xoá mềm đơn vị | Should | 5 | Sprint 2 |
| US-024 | Gán cán bộ vào đơn vị | Là admin, tôi muốn gán người dùng vào đơn vị nghiệp vụ | User có organizationId; lọc được theo đơn vị | Should | 3 | Sprint 2 |

---

### EPIC-04: Land Parcel Management

| ID | User Story / Task | Mô tả chi tiết | Acceptance Criteria | Priority | Estimate | Sprint |
|---|---|---|---|---|---:|---|
| US-025 | Tạo thửa đất | Là cán bộ, tôi muốn tạo hồ sơ thửa đất để quản lý thông tin pháp lý | Nhập mã thửa, tờ bản đồ, diện tích, địa chỉ, loại đất, chủ sử dụng | Must | 8 | Sprint 2 |
| US-026 | Cập nhật thửa đất | Là cán bộ, tôi muốn cập nhật thông tin thửa đất khi có thay đổi | Sửa được thông tin chưa bị khoá bởi trạng thái pháp lý | Must | 5 | Sprint 2 |
| US-027 | Danh sách thửa đất | Là cán bộ, tôi muốn xem danh sách thửa đất | Có bảng, tìm kiếm, lọc theo loại đất/trạng thái | Must | 5 | Sprint 2 |
| US-028 | Chi tiết thửa đất | Là người dùng, tôi muốn xem thông tin chi tiết thửa đất | Hiển thị chủ sử dụng, diện tích, địa chỉ, trạng thái, lịch sử | Must | 5 | Sprint 3 |
| US-029 | Gắn chủ sử dụng đất | Là cán bộ, tôi muốn liên kết thửa đất với chủ sử dụng | Một thửa có một hoặc nhiều chủ sử dụng | Must | 5 | Sprint 3 |
| US-030 | Lưu thông tin tọa độ đơn giản | Là cán bộ, tôi muốn lưu vị trí thửa đất để tra cứu bản đồ cơ bản | Lưu lat/lng hoặc polygon mock; hiển thị trên bản đồ đơn giản | Should | 5 | Sprint 3 |
| US-031 | Kiểm tra trùng mã thửa | Là hệ thống, tôi muốn ngăn tạo trùng mã thửa | Không cho tạo trùng `parcelCode` trong cùng khu vực | Must | 3 | Sprint 2 |
| US-032 | Trạng thái pháp lý thửa đất | Là cán bộ, tôi muốn theo dõi trạng thái pháp lý | Có các trạng thái: Draft, Pending, Valid, Disputed, Transferring, Archived | Must | 3 | Sprint 3 |
| US-033 | Tìm kiếm thửa đất theo chủ | Là cán bộ, tôi muốn tìm thửa đất theo tên/CCCD chủ sử dụng | Trả về danh sách thửa liên quan | Should | 3 | Sprint 3 |

---

### EPIC-05: IPFS Document Storage

| ID | User Story / Task | Mô tả chi tiết | Acceptance Criteria | Priority | Estimate | Sprint |
|---|---|---|---|---|---:|---|
| US-034 | Upload tài liệu pháp lý | Là người dân/cán bộ, tôi muốn upload giấy tờ lên hệ thống | Upload PDF/JPG/PNG thành công; lưu metadata | Must | 8 | Sprint 3 |
| US-035 | Kết nối IPFS service | Là hệ thống, tôi muốn đẩy file lên IPFS hoặc gateway pinning | Trả về CID; lưu CID vào database | Must | 8 | Sprint 3 |
| US-036 | Tính hash tài liệu | Là hệ thống, tôi muốn tính SHA-256 để kiểm tra toàn vẹn | Lưu hash file; file đổi thì hash đổi | Must | 5 | Sprint 3 |
| US-037 | Danh sách tài liệu của hồ sơ | Là cán bộ, tôi muốn xem các tài liệu đã nộp | Hiển thị tên file, loại giấy tờ, CID, hash, ngày upload | Must | 5 | Sprint 3 |
| US-038 | Xem tài liệu qua gateway | Là người có quyền, tôi muốn mở tài liệu đã upload | Có nút mở file qua IPFS gateway hoặc local fallback | Should | 3 | Sprint 3 |
| US-039 | Phân loại tài liệu | Là người nộp, tôi muốn chọn loại tài liệu khi upload | Có loại: sổ đỏ, CCCD, bản đồ hiện trạng, hợp đồng, giấy uỷ quyền, biên lai | Must | 3 | Sprint 3 |
| US-040 | Xoá mềm tài liệu | Là cán bộ, tôi muốn xoá mềm tài liệu sai trước khi duyệt | Tài liệu bị đánh dấu inactive, không xoá vật lý | Should | 3 | Sprint 4 |
| US-041 | Kiểm tra tài liệu bắt buộc | Là hệ thống, tôi muốn kiểm tra hồ sơ đã đủ giấy tờ chưa | Thiếu tài liệu bắt buộc thì không cho gửi thẩm định | Must | 5 | Sprint 4 |

---

### EPIC-06: Smart Contract & Blockchain

| ID | User Story / Task | Mô tả chi tiết | Acceptance Criteria | Priority | Estimate | Sprint |
|---|---|---|---|---|---:|---|
| US-042 | Thiết kế LandRegistry contract | Là blockchain dev, tôi muốn contract quản lý metadata thửa đất | Contract có struct LandRecord, mapping, event | Must | 8 | Sprint 3 |
| US-043 | Hàm tạo bản ghi đất | Là cán bộ/phê duyệt, tôi muốn ghi bản ghi đất lên blockchain | Gọi `createLandRecord` thành công; emit event | Must | 8 | Sprint 4 |
| US-044 | Hàm cập nhật trạng thái hồ sơ | Là cán bộ, tôi muốn ghi nhận thay đổi trạng thái lên blockchain | Có event `StatusUpdated`; truy xuất được lịch sử | Must | 8 | Sprint 4 |
| US-045 | Lưu document hash/CID | Là hệ thống, tôi muốn lưu hash/CID tài liệu trên blockchain | Contract lưu CID/hash hoặc hash tổng hợp của hồ sơ | Must | 5 | Sprint 4 |
| US-046 | Truy vấn record từ contract | Là frontend, tôi muốn đọc dữ liệu blockchain để xác minh | API/backend đọc được record theo landId | Must | 5 | Sprint 4 |
| US-047 | Test smart contract | Là blockchain dev, tôi muốn test contract để tránh lỗi logic | Có unit test cho create/update/query | Must | 8 | Sprint 4 |
| US-048 | Deploy local/testnet | Là developer, tôi muốn deploy contract lên Hardhat local hoặc Sepolia | Có script deploy; lưu contract address | Must | 5 | Sprint 4 |
| US-049 | Backend blockchain adapter | Là backend, tôi muốn gọi contract thông qua service riêng | Có service `BlockchainService`; xử lý lỗi RPC | Must | 8 | Sprint 4 |
| US-050 | Lưu transaction hash | Là hệ thống, tôi muốn lưu txHash sau mỗi thao tác blockchain | Database có txHash; UI xem được link explorer/gateway | Must | 5 | Sprint 4 |
| US-051 | Event log sync cơ bản | Là hệ thống, tôi muốn đồng bộ event blockchain về DB | Có script hoặc service đọc event và cập nhật audit log | Should | 8 | Sprint 6 |

---

### EPIC-07: Land Dossier Workflow

| ID | User Story / Task | Mô tả chi tiết | Acceptance Criteria | Priority | Estimate | Sprint |
|---|---|---|---|---|---:|---|
| US-052 | Tạo hồ sơ đất đai | Là công dân, tôi muốn tạo hồ sơ đăng ký/xử lý đất đai | Tạo hồ sơ với loại thủ tục, thửa đất, mô tả | Must | 8 | Sprint 4 |
| US-053 | Chọn loại thủ tục | Là công dân, tôi muốn chọn loại hồ sơ phù hợp | Có loại: đăng ký mới, cập nhật, cấp đổi, chuyển nhượng, tra cứu xác minh | Must | 3 | Sprint 4 |
| US-054 | Nộp hồ sơ | Là công dân, tôi muốn gửi hồ sơ cho cơ quan xử lý | Chỉ nộp khi đủ thông tin và tài liệu bắt buộc | Must | 5 | Sprint 4 |
| US-055 | Tiếp nhận hồ sơ | Là cán bộ tiếp nhận, tôi muốn kiểm tra và tiếp nhận hồ sơ | Có nút Accept/Reject; ghi lý do nếu từ chối | Must | 8 | Sprint 5 |
| US-056 | Yêu cầu bổ sung hồ sơ | Là cán bộ, tôi muốn yêu cầu người dân bổ sung giấy tờ | Trạng thái chuyển `NeedSupplement`; người dân upload bổ sung được | Must | 8 | Sprint 5 |
| US-057 | Phân công thẩm định | Là cán bộ tiếp nhận, tôi muốn phân công cán bộ thẩm định | Hồ sơ có `assignedOfficerId`; người được giao thấy trong danh sách | Must | 5 | Sprint 5 |
| US-058 | Thẩm định hồ sơ | Là cán bộ thẩm định, tôi muốn ghi nhận kết quả thẩm định | Có form nhận xét, rủi ro, kết luận đạt/không đạt | Must | 8 | Sprint 5 |
| US-059 | Trình phê duyệt | Là cán bộ thẩm định, tôi muốn chuyển hồ sơ lên cấp phê duyệt | Trạng thái chuyển `PendingApproval`; có lịch sử | Must | 5 | Sprint 5 |
| US-060 | Phê duyệt hồ sơ | Là cán bộ phê duyệt, tôi muốn phê duyệt/từ chối hồ sơ | Phê duyệt ghi blockchain; từ chối bắt buộc lý do | Must | 8 | Sprint 5 |
| US-061 | Theo dõi trạng thái hồ sơ | Là công dân, tôi muốn xem hồ sơ đang ở bước nào | Timeline hiển thị các mốc xử lý | Must | 5 | Sprint 5 |
| US-062 | Lịch sử xử lý hồ sơ | Là cán bộ, tôi muốn xem toàn bộ lịch sử thao tác | Hiển thị người xử lý, thời gian, hành động, ghi chú | Must | 5 | Sprint 5 |
| US-063 | Bộ máy trạng thái hồ sơ | Là hệ thống, tôi muốn kiểm soát trạng thái hợp lệ | Không cho chuyển trạng thái sai luồng | Must | 5 | Sprint 4 |
| US-064 | Thông báo nội bộ | Là người dùng, tôi muốn nhận thông báo khi hồ sơ đổi trạng thái | Có notification trong app | Should | 5 | Sprint 6 |

---

### EPIC-08: Certificate & Ownership Record

| ID | User Story / Task | Mô tả chi tiết | Acceptance Criteria | Priority | Estimate | Sprint |
|---|---|---|---|---|---:|---|
| US-065 | Phát hành chứng nhận số mô phỏng | Là cán bộ phê duyệt, tôi muốn phát hành chứng nhận số sau khi duyệt | Tạo certificateCode, issueDate, owner, parcelId | Must | 8 | Sprint 6 |
| US-066 | Ghi nhận chứng nhận lên blockchain | Là hệ thống, tôi muốn ghi hash chứng nhận lên blockchain | Có txHash, certificateHash, event issued | Must | 8 | Sprint 6 |
| US-067 | Xem chứng nhận số | Là công dân, tôi muốn xem chứng nhận của thửa đất | UI hiển thị thông tin chứng nhận và trạng thái | Must | 5 | Sprint 6 |
| US-068 | Tải chứng nhận PDF mô phỏng | Là công dân, tôi muốn tải bản PDF chứng nhận | Sinh PDF đơn giản có mã tra cứu/hash | Should | 8 | Sprint 6 |
| US-069 | Xác minh chứng nhận | Là người tra cứu, tôi muốn nhập mã để xác minh chứng nhận | Trả về hợp lệ/không hợp lệ và hash blockchain | Must | 5 | Sprint 6 |
| US-070 | Khoá chứng nhận khi tranh chấp | Là cán bộ, tôi muốn đánh dấu chứng nhận đang tranh chấp | Trạng thái đổi `Disputed`; không cho chuyển nhượng | Should | 5 | Sprint 7 |

---

### EPIC-09: Transfer Workflow

| ID | User Story / Task | Mô tả chi tiết | Acceptance Criteria | Priority | Estimate | Sprint |
|---|---|---|---|---|---:|---|
| US-071 | Tạo yêu cầu chuyển nhượng | Là chủ sử dụng đất, tôi muốn tạo yêu cầu chuyển nhượng cho người nhận | Nhập bên chuyển, bên nhận, thửa đất, tài liệu hợp đồng | Should | 8 | Sprint 6 |
| US-072 | Kiểm tra điều kiện chuyển nhượng | Là hệ thống, tôi muốn kiểm tra thửa đất có được chuyển nhượng không | Không cho chuyển nếu đang tranh chấp/chưa có chứng nhận | Must | 5 | Sprint 6 |
| US-073 | Công chứng viên xác nhận | Là công chứng viên, tôi muốn xác nhận hợp đồng chuyển nhượng | Có bước NotaryVerified, lưu nhận xét | Should | 8 | Sprint 7 |
| US-074 | Cán bộ thẩm định chuyển nhượng | Là cán bộ, tôi muốn kiểm tra hồ sơ chuyển nhượng | Có kết quả thẩm định riêng cho chuyển nhượng | Should | 8 | Sprint 7 |
| US-075 | Phê duyệt chuyển nhượng | Là cán bộ phê duyệt, tôi muốn phê duyệt đổi chủ sử dụng | Owner của thửa đất được cập nhật; ghi blockchain | Should | 8 | Sprint 7 |
| US-076 | Lịch sử sở hữu | Là người tra cứu có quyền, tôi muốn xem lịch sử chủ sử dụng đất | Hiển thị owner cũ/mới, ngày hiệu lực, txHash | Should | 5 | Sprint 7 |
| US-077 | Từ chối chuyển nhượng | Là cán bộ, tôi muốn từ chối hồ sơ chuyển nhượng khi không hợp lệ | Bắt buộc nhập lý do; trạng thái rejected | Should | 3 | Sprint 7 |

---

### EPIC-10: Search & Public Lookup

| ID | User Story / Task | Mô tả chi tiết | Acceptance Criteria | Priority | Estimate | Sprint |
|---|---|---|---|---|---:|---|
| US-078 | Tìm kiếm hồ sơ | Là cán bộ, tôi muốn tìm kiếm hồ sơ theo mã, chủ, trạng thái | Tìm kiếm có phân trang và filter | Must | 5 | Sprint 5 |
| US-079 | Tìm kiếm thửa đất công khai | Là người dân, tôi muốn tra cứu thông tin cơ bản thửa đất | Chỉ hiện dữ liệu công khai, không lộ tài liệu nhạy cảm | Must | 5 | Sprint 6 |
| US-080 | Tra cứu theo mã chứng nhận | Là người dân, tôi muốn kiểm tra mã chứng nhận | Nhập certificateCode trả về trạng thái xác minh | Must | 5 | Sprint 6 |
| US-081 | Xem lịch sử blockchain | Là người dùng, tôi muốn xem các giao dịch blockchain liên quan | Hiển thị txHash, blockNumber, action, timestamp | Must | 5 | Sprint 6 |
| US-082 | Bộ lọc nâng cao | Là cán bộ, tôi muốn lọc hồ sơ theo ngày, loại thủ tục, cán bộ xử lý | Filter hoạt động kết hợp | Should | 5 | Sprint 7 |
| US-083 | Trang public lookup không cần đăng nhập | Là người dân, tôi muốn tra cứu nhanh chứng nhận/thửa đất công khai | Có route public; giới hạn dữ liệu hiển thị | Should | 5 | Sprint 7 |

---

### EPIC-11: Admin Dashboard & Audit Log

| ID | User Story / Task | Mô tả chi tiết | Acceptance Criteria | Priority | Estimate | Sprint |
|---|---|---|---|---|---:|---|
| US-084 | Dashboard tổng quan | Là admin, tôi muốn xem số lượng hồ sơ, thửa đất, user, giao dịch | Có card thống kê cơ bản | Should | 5 | Sprint 7 |
| US-085 | Thống kê hồ sơ theo trạng thái | Là admin, tôi muốn biết số hồ sơ đang chờ, đã duyệt, bị từ chối | Có biểu đồ hoặc bảng tổng hợp | Should | 5 | Sprint 7 |
| US-086 | Nhật ký thao tác | Là admin, tôi muốn xem audit log để truy vết | Ghi log đăng nhập, tạo hồ sơ, duyệt, upload, blockchain tx | Must | 8 | Sprint 6 |
| US-087 | Chi tiết audit log | Là admin, tôi muốn xem chi tiết một hành động | Hiển thị actor, action, target, payload summary, time | Should | 3 | Sprint 7 |
| US-088 | Lọc audit log | Là admin, tôi muốn lọc nhật ký theo user/action/date | Filter hoạt động | Could | 3 | Sprint 8 |
| US-089 | Cảnh báo lỗi blockchain/IPFS | Là admin, tôi muốn biết khi IPFS/RPC lỗi | Có log lỗi và trạng thái service | Should | 5 | Sprint 8 |

---

### EPIC-12: AI Agent Integration

| ID | User Story / Task | Mô tả chi tiết | Acceptance Criteria | Priority | Estimate | Sprint |
|---|---|---|---|---|---:|---|
| US-090 | AI kiểm tra thiếu hồ sơ | Là công dân, tôi muốn AI kiểm tra hồ sơ còn thiếu gì | AI trả danh sách giấy tờ thiếu dựa trên loại thủ tục | Should | 8 | Sprint 7 |
| US-091 | AI tóm tắt hồ sơ | Là cán bộ, tôi muốn AI tóm tắt nội dung hồ sơ để xử lý nhanh | AI tạo summary ngắn, không thay thế quyết định cán bộ | Should | 8 | Sprint 7 |
| US-092 | AI gợi ý rủi ro pháp lý | Là cán bộ, tôi muốn AI gợi ý các điểm cần kiểm tra | AI liệt kê rủi ro: thiếu chủ ký, tranh chấp, sai diện tích, thiếu bản đồ | Should | 8 | Sprint 8 |
| US-093 | AI assistant chat nội bộ | Là người dùng, tôi muốn hỏi trợ lý về quy trình hồ sơ | Chat trả lời dựa trên tài liệu nghiệp vụ đã cấu hình | Could | 8 | Sprint 8 |
| US-094 | Lưu kết quả AI vào hồ sơ | Là hệ thống, tôi muốn lưu kết quả AI để tham khảo | Có bảng `ai_reviews`; lưu prompt version, result, timestamp | Should | 5 | Sprint 8 |
| US-095 | Cảnh báo AI không có giá trị pháp lý | Là hệ thống, tôi muốn hiển thị disclaimer cho kết quả AI | UI có cảnh báo: AI chỉ hỗ trợ tham khảo | Must | 2 | Sprint 7 |

---

### EPIC-13: UI/UX & Frontend Flow

| ID | User Story / Task | Mô tả chi tiết | Acceptance Criteria | Priority | Estimate | Sprint |
|---|---|---|---|---|---:|---|
| US-096 | Layout chính | Là người dùng, tôi muốn giao diện có sidebar/header rõ ràng | Có layout responsive cơ bản | Must | 5 | Sprint 1 |
| US-097 | Trang đăng nhập | Là người dùng, tôi muốn đăng nhập dễ dàng | Form login có validate và lỗi rõ ràng | Must | 3 | Sprint 1 |
| US-098 | Dashboard theo role | Là người dùng, tôi muốn thấy chức năng phù hợp vai trò | Citizen thấy hồ sơ của tôi; cán bộ thấy hồ sơ cần xử lý | Must | 8 | Sprint 2 |
| US-099 | Form tạo hồ sơ | Là công dân, tôi muốn tạo hồ sơ từng bước | Wizard có bước thông tin, tài liệu, xác nhận | Must | 8 | Sprint 4 |
| US-100 | Trang xử lý hồ sơ cán bộ | Là cán bộ, tôi muốn xem danh sách hồ sơ cần xử lý | Có tab pending/assigned/done | Must | 8 | Sprint 5 |
| US-101 | Timeline hồ sơ | Là người dùng, tôi muốn xem tiến trình hồ sơ | Timeline rõ trạng thái, thời gian, người xử lý | Must | 5 | Sprint 5 |
| US-102 | Trang chi tiết thửa đất | Là người dùng, tôi muốn xem dữ liệu thửa đất tập trung | Có thông tin pháp lý, tài liệu, blockchain, lịch sử | Must | 8 | Sprint 6 |
| US-103 | Trang tra cứu công khai | Là người dân, tôi muốn tra cứu không cần đăng nhập | Có ô nhập mã thửa/mã chứng nhận | Should | 5 | Sprint 7 |
| US-104 | UI trạng thái blockchain | Là người dùng, tôi muốn biết giao dịch blockchain thành công hay lỗi | Có badge pending/success/failed, txHash | Must | 5 | Sprint 6 |
| US-105 | Toast/notification | Là người dùng, tôi muốn biết kết quả thao tác | Có thông báo thành công/lỗi | Should | 3 | Sprint 2 |

---

### EPIC-14: Testing, Security & Deployment

| ID | User Story / Task | Mô tả chi tiết | Acceptance Criteria | Priority | Estimate | Sprint |
|---|---|---|---|---|---:|---|
| US-106 | Unit test backend service | Là developer, tôi muốn test service quan trọng | Có test cho auth, dossier, land parcel | Should | 8 | Sprint 8 |
| US-107 | Unit test smart contract | Là blockchain dev, tôi muốn đảm bảo contract đúng logic | Test pass cho create/update/transfer | Must | 8 | Sprint 4 |
| US-108 | API integration test | Là QA, tôi muốn test API end-to-end | Có test luồng login → tạo hồ sơ → duyệt | Should | 8 | Sprint 8 |
| US-109 | Kiểm tra bảo mật JWT/RBAC | Là QA, tôi muốn chắc chắn user không vượt quyền | Test role không được gọi API ngoài quyền | Must | 5 | Sprint 8 |
| US-110 | Validate input | Là hệ thống, tôi muốn ngăn dữ liệu sai | Có schema validation cho API chính | Must | 5 | Sprint 5 |
| US-111 | Xử lý lỗi tập trung | Là developer, tôi muốn API trả lỗi thống nhất | Có error middleware và format lỗi chuẩn | Must | 3 | Sprint 2 |
| US-112 | Docker compose dev | Là developer, tôi muốn chạy toàn bộ bằng docker compose | Có service db, backend, frontend tùy chọn | Should | 8 | Sprint 8 |
| US-113 | Build production | Là developer, tôi muốn build frontend/backend không lỗi | Lệnh build pass | Must | 5 | Sprint 8 |
| US-114 | Demo script dữ liệu | Là nhóm thuyết trình, tôi muốn có kịch bản demo MVP | Có account mẫu, dữ liệu mẫu, flow demo | Must | 5 | Sprint 8 |
| US-115 | Kiểm thử UAT theo vai trò | Là nhóm dự án, tôi muốn kiểm thử theo từng actor | Có checklist UAT Citizen/Officer/Admin/Public | Must | 8 | Sprint 8 |

---

## 6. Sprint Planning chi tiết

> Gợi ý: mỗi sprint có thể kéo dài 1 tuần hoặc 2 tuần tuỳ tiến độ nhóm. Với đồ án/môn học, có thể dùng Sprint 0–8 tương ứng 8–9 tuần triển khai.

---

## Sprint 0 - Khởi tạo nền tảng dự án

### Mục tiêu

Thiết lập repository, môi trường phát triển, cấu trúc thư mục và dữ liệu mẫu ban đầu để các AI agents/Codex có thể làm việc đồng bộ.

### User stories / Tasks

| ID | Công việc | Estimate | Người/Agent phụ trách |
|---|---|---:|---|
| US-001 | Khởi tạo monorepo | 3 | AI_01 System Architect |
| US-002 | Cấu hình Git workflow | 2 | AI_01 System Architect |
| US-003 | Cấu hình backend Express TypeScript | 3 | AI_04 Backend API Developer |
| US-004 | Cấu hình frontend React TypeScript | 3 | AI_07 Frontend Developer |
| US-005 | Cấu hình Hardhat | 3 | AI_02 Blockchain Core Developer |
| US-006 | Cấu hình Prisma + DB | 5 | AI_06 Database Engineer |
| US-007 | Tạo `.env.example` | 2 | AI_04 Backend API Developer |
| US-008 | README setup | 3 | AI_13 Technical Writer |
| US-009 | Seed data mẫu | 3 | AI_06 Database Engineer |
| US-010 | ESLint/Prettier | 2 | AI_11 QA Engineer |

### Deliverables

- Repo chạy được frontend/backend/contract.
- Database kết nối được.
- README có hướng dẫn setup.
- Seed dữ liệu tối thiểu.

### Definition of Done

- `npm install` / `pnpm install` chạy thành công.
- Backend có `/health`.
- Frontend render trang Home/Login.
- Hardhat compile contract mẫu.
- Prisma migration đầu tiên chạy được.

---

## Sprint 1 - Authentication, RBAC và Layout nền tảng

### Mục tiêu

Xây dựng đăng nhập, phân quyền và giao diện khung để các sprint sau gắn chức năng nghiệp vụ.

### User stories / Tasks

| ID | Công việc | Estimate | Người/Agent phụ trách |
|---|---|---:|---|
| US-011 | Đăng nhập email/password | 5 | AI_04 Backend API Developer |
| US-012 | Đăng xuất | 2 | AI_07 Frontend Developer |
| US-013 | JWT middleware | 3 | AI_04 Backend API Developer |
| US-014 | RBAC theo vai trò | 5 | AI_05 Auth/VNeID Agent |
| US-015 | Mô phỏng VNeID login | 5 | AI_05 Auth/VNeID Agent |
| US-016 | Quản lý session frontend | 3 | AI_07 Frontend Developer |
| US-018 | Bảo vệ route frontend | 3 | AI_07 Frontend Developer |
| US-096 | Layout chính | 5 | AI_08 UI/UX Agent |
| US-097 | Trang đăng nhập | 3 | AI_08 UI/UX Agent |

### Deliverables

- Login/logout hoạt động.
- Có JWT và route guard.
- Có layout dashboard theo role.
- Mock VNeID ở mức giao diện và dữ liệu giả lập.

### Definition of Done

- Citizen không truy cập được trang officer/admin.
- Admin truy cập được dashboard quản trị.
- Token hết hạn hoặc sai token bị từ chối.
- UI hiển thị tên và vai trò người dùng.

---

## Sprint 2 - Quản lý người dùng, đơn vị và thửa đất cơ bản

### Mục tiêu

Hoàn thiện dữ liệu nền: người dùng, đơn vị xử lý, thửa đất và các màn hình quản lý cơ bản.

### User stories / Tasks

| ID | Công việc | Estimate | Người/Agent phụ trách |
|---|---|---:|---|
| US-017 | Đổi mật khẩu | 3 | AI_04 Backend API Developer |
| US-019 | Tạo user bởi admin | 5 | AI_04 Backend API Developer |
| US-020 | Cập nhật user | 3 | AI_04 Backend API Developer |
| US-021 | Khoá/mở khoá user | 3 | AI_04 Backend API Developer |
| US-022 | Danh sách user | 5 | AI_07 Frontend Developer |
| US-023 | Quản lý đơn vị xử lý | 5 | AI_06 Database Engineer |
| US-024 | Gán cán bộ vào đơn vị | 3 | AI_06 Database Engineer |
| US-025 | Tạo thửa đất | 8 | AI_04 Backend API Developer |
| US-026 | Cập nhật thửa đất | 5 | AI_04 Backend API Developer |
| US-027 | Danh sách thửa đất | 5 | AI_07 Frontend Developer |
| US-031 | Kiểm tra trùng mã thửa | 3 | AI_06 Database Engineer |
| US-098 | Dashboard theo role | 8 | AI_07 Frontend Developer |
| US-105 | Toast/notification | 3 | AI_08 UI/UX Agent |
| US-111 | Xử lý lỗi tập trung | 3 | AI_04 Backend API Developer |

### Deliverables

- Admin quản lý được user và đơn vị.
- Cán bộ tạo/sửa/xem danh sách thửa đất.
- Có dashboard ban đầu theo vai trò.

### Definition of Done

- Không tạo được mã thửa trùng.
- Admin có thể khoá user.
- Form frontend validate dữ liệu cơ bản.
- API trả lỗi theo format thống nhất.

---

## Sprint 3 - Hồ sơ thửa đất, IPFS và tài liệu pháp lý

### Mục tiêu

Xây dựng khả năng lưu trữ tài liệu pháp lý bằng IPFS và liên kết tài liệu với thửa đất/hồ sơ.

### User stories / Tasks

| ID | Công việc | Estimate | Người/Agent phụ trách |
|---|---|---:|---|
| US-028 | Chi tiết thửa đất | 5 | AI_07 Frontend Developer |
| US-029 | Gắn chủ sử dụng đất | 5 | AI_04 Backend API Developer |
| US-030 | Lưu tọa độ đơn giản | 5 | AI_07 Frontend Developer |
| US-032 | Trạng thái pháp lý thửa đất | 3 | AI_04 Backend API Developer |
| US-033 | Tìm kiếm thửa đất theo chủ | 3 | AI_04 Backend API Developer |
| US-034 | Upload tài liệu pháp lý | 8 | AI_04 Backend API Developer |
| US-035 | Kết nối IPFS service | 8 | AI_03 IPFS/Storage Agent |
| US-036 | Tính hash tài liệu | 5 | AI_03 IPFS/Storage Agent |
| US-037 | Danh sách tài liệu của hồ sơ | 5 | AI_07 Frontend Developer |
| US-038 | Xem tài liệu qua gateway | 3 | AI_07 Frontend Developer |
| US-039 | Phân loại tài liệu | 3 | AI_04 Backend API Developer |
| US-042 | Thiết kế LandRegistry contract | 8 | AI_02 Blockchain Core Developer |

### Deliverables

- Upload tài liệu lên IPFS/local mock.
- Lưu CID/hash vào DB.
- Trang chi tiết thửa đất hiển thị tài liệu.
- Smart contract LandRegistry được thiết kế ban đầu.

### Definition of Done

- File upload có hash SHA-256.
- CID được lưu cùng metadata.
- Tài liệu liên kết đúng với hồ sơ/thửa đất.
- Contract compile thành công.

---

## Sprint 4 - Smart Contract, Blockchain adapter và tạo hồ sơ

### Mục tiêu

Kết nối backend với smart contract, ghi nhận metadata hồ sơ lên blockchain và cho phép công dân tạo/nộp hồ sơ.

### User stories / Tasks

| ID | Công việc | Estimate | Người/Agent phụ trách |
|---|---|---:|---|
| US-040 | Xoá mềm tài liệu | 3 | AI_04 Backend API Developer |
| US-041 | Kiểm tra tài liệu bắt buộc | 5 | AI_04 Backend API Developer |
| US-043 | Hàm tạo bản ghi đất | 8 | AI_02 Blockchain Core Developer |
| US-044 | Hàm cập nhật trạng thái hồ sơ | 8 | AI_02 Blockchain Core Developer |
| US-045 | Lưu document hash/CID | 5 | AI_02 Blockchain Core Developer |
| US-046 | Truy vấn record từ contract | 5 | AI_02 Blockchain Core Developer |
| US-047 | Test smart contract | 8 | AI_11 QA Engineer |
| US-048 | Deploy local/testnet | 5 | AI_02 Blockchain Core Developer |
| US-049 | Backend blockchain adapter | 8 | AI_04 Backend API Developer |
| US-050 | Lưu transaction hash | 5 | AI_04 Backend API Developer |
| US-052 | Tạo hồ sơ đất đai | 8 | AI_04 Backend API Developer |
| US-053 | Chọn loại thủ tục | 3 | AI_07 Frontend Developer |
| US-054 | Nộp hồ sơ | 5 | AI_07 Frontend Developer |
| US-063 | Bộ máy trạng thái hồ sơ | 5 | AI_04 Backend API Developer |
| US-099 | Form tạo hồ sơ | 8 | AI_07 Frontend Developer |
| US-107 | Unit test smart contract | 8 | AI_11 QA Engineer |

### Deliverables

- Smart contract có các hàm chính.
- Backend gọi được contract.
- Lưu được txHash.
- Công dân tạo và nộp hồ sơ.
- Kiểm tra tài liệu bắt buộc trước khi nộp.

### Definition of Done

- Tạo hồ sơ thành công sinh record DB.
- Gửi hồ sơ đổi trạng thái hợp lệ.
- Blockchain transaction thành công hoặc lỗi được xử lý.
- Contract test pass.

---

## Sprint 5 - Quy trình tiếp nhận, thẩm định, phê duyệt hồ sơ

### Mục tiêu

Hoàn thiện workflow nghiệp vụ cốt lõi: tiếp nhận, yêu cầu bổ sung, phân công, thẩm định, trình duyệt, phê duyệt/từ chối.

### User stories / Tasks

| ID | Công việc | Estimate | Người/Agent phụ trách |
|---|---|---:|---|
| US-055 | Tiếp nhận hồ sơ | 8 | AI_04 Backend API Developer |
| US-056 | Yêu cầu bổ sung hồ sơ | 8 | AI_04 Backend API Developer |
| US-057 | Phân công thẩm định | 5 | AI_04 Backend API Developer |
| US-058 | Thẩm định hồ sơ | 8 | AI_04 Backend API Developer |
| US-059 | Trình phê duyệt | 5 | AI_04 Backend API Developer |
| US-060 | Phê duyệt hồ sơ | 8 | AI_04 Backend API Developer |
| US-061 | Theo dõi trạng thái hồ sơ | 5 | AI_07 Frontend Developer |
| US-062 | Lịch sử xử lý hồ sơ | 5 | AI_07 Frontend Developer |
| US-078 | Tìm kiếm hồ sơ | 5 | AI_04 Backend API Developer |
| US-100 | Trang xử lý hồ sơ cán bộ | 8 | AI_07 Frontend Developer |
| US-101 | Timeline hồ sơ | 5 | AI_08 UI/UX Agent |
| US-110 | Validate input | 5 | AI_11 QA Engineer |

### Deliverables

- Hồ sơ đi được từ Submitted → Received → Appraising → PendingApproval → Approved/Rejected.
- Cán bộ tiếp nhận và thẩm định có màn hình riêng.
- Người dân xem được timeline trạng thái.

### Definition of Done

- Không chuyển trạng thái sai luồng.
- Mỗi thao tác có lịch sử.
- Phê duyệt hồ sơ ghi được txHash blockchain.
- Từ chối/yêu cầu bổ sung bắt buộc nhập lý do.

---

## Sprint 6 - Chứng nhận số, tra cứu và audit log

### Mục tiêu

Sau khi hồ sơ được duyệt, hệ thống phát hành chứng nhận số mô phỏng, cho phép tra cứu/xác minh và ghi nhật ký hệ thống.

### User stories / Tasks

| ID | Công việc | Estimate | Người/Agent phụ trách |
|---|---|---:|---|
| US-051 | Event log sync cơ bản | 8 | AI_02 Blockchain Core Developer |
| US-064 | Thông báo nội bộ | 5 | AI_07 Frontend Developer |
| US-065 | Phát hành chứng nhận số mô phỏng | 8 | AI_04 Backend API Developer |
| US-066 | Ghi nhận chứng nhận lên blockchain | 8 | AI_02 Blockchain Core Developer |
| US-067 | Xem chứng nhận số | 5 | AI_07 Frontend Developer |
| US-068 | Tải chứng nhận PDF mô phỏng | 8 | AI_04 Backend API Developer |
| US-069 | Xác minh chứng nhận | 5 | AI_04 Backend API Developer |
| US-071 | Tạo yêu cầu chuyển nhượng | 8 | AI_04 Backend API Developer |
| US-072 | Kiểm tra điều kiện chuyển nhượng | 5 | AI_04 Backend API Developer |
| US-079 | Tìm kiếm thửa đất công khai | 5 | AI_07 Frontend Developer |
| US-080 | Tra cứu theo mã chứng nhận | 5 | AI_07 Frontend Developer |
| US-081 | Xem lịch sử blockchain | 5 | AI_07 Frontend Developer |
| US-086 | Nhật ký thao tác | 8 | AI_06 Database Engineer |
| US-102 | Trang chi tiết thửa đất | 8 | AI_07 Frontend Developer |
| US-104 | UI trạng thái blockchain | 5 | AI_08 UI/UX Agent |

### Deliverables

- Phát hành chứng nhận số sau khi duyệt.
- Tra cứu mã chứng nhận.
- Xem lịch sử blockchain.
- Audit log hoạt động.

### Definition of Done

- Chứng nhận có mã duy nhất.
- Hash chứng nhận được ghi blockchain.
- Public lookup không lộ dữ liệu nhạy cảm.
- Mỗi thao tác quan trọng có audit log.

---

## Sprint 7 - Chuyển nhượng, public lookup và dashboard quản trị

### Mục tiêu

Hoàn thiện luồng chuyển nhượng mô phỏng, trang tra cứu công khai và dashboard thống kê cho admin/cán bộ.

### User stories / Tasks

| ID | Công việc | Estimate | Người/Agent phụ trách |
|---|---|---:|---|
| US-070 | Khoá chứng nhận khi tranh chấp | 5 | AI_04 Backend API Developer |
| US-073 | Công chứng viên xác nhận | 8 | AI_04 Backend API Developer |
| US-074 | Cán bộ thẩm định chuyển nhượng | 8 | AI_04 Backend API Developer |
| US-075 | Phê duyệt chuyển nhượng | 8 | AI_02 Blockchain Core Developer |
| US-076 | Lịch sử sở hữu | 5 | AI_07 Frontend Developer |
| US-077 | Từ chối chuyển nhượng | 3 | AI_04 Backend API Developer |
| US-082 | Bộ lọc nâng cao | 5 | AI_07 Frontend Developer |
| US-083 | Trang public lookup không cần đăng nhập | 5 | AI_07 Frontend Developer |
| US-084 | Dashboard tổng quan | 5 | AI_07 Frontend Developer |
| US-085 | Thống kê hồ sơ theo trạng thái | 5 | AI_07 Frontend Developer |
| US-087 | Chi tiết audit log | 3 | AI_07 Frontend Developer |
| US-090 | AI kiểm tra thiếu hồ sơ | 8 | AI_09 AI Agent Engineer |
| US-091 | AI tóm tắt hồ sơ | 8 | AI_09 AI Agent Engineer |
| US-095 | Cảnh báo AI không có giá trị pháp lý | 2 | AI_08 UI/UX Agent |
| US-103 | Trang tra cứu công khai | 5 | AI_07 Frontend Developer |

### Deliverables

- Luồng chuyển nhượng mô phỏng.
- Dashboard thống kê.
- Public lookup hoàn chỉnh.
- AI kiểm tra thiếu hồ sơ và tóm tắt hồ sơ.

### Definition of Done

- Không chuyển nhượng được đất đang tranh chấp.
- Chuyển nhượng thành công cập nhật owner và lịch sử.
- Public lookup không yêu cầu đăng nhập.
- AI có disclaimer rõ ràng.

---

## Sprint 8 - AI nâng cao, kiểm thử, bảo mật và chuẩn bị demo

### Mục tiêu

Hoàn thiện chất lượng MVP: kiểm thử, bảo mật, AI nâng cao, docker, build production và kịch bản demo.

### User stories / Tasks

| ID | Công việc | Estimate | Người/Agent phụ trách |
|---|---|---:|---|
| US-088 | Lọc audit log | 3 | AI_07 Frontend Developer |
| US-089 | Cảnh báo lỗi blockchain/IPFS | 5 | AI_04 Backend API Developer |
| US-092 | AI gợi ý rủi ro pháp lý | 8 | AI_09 AI Agent Engineer |
| US-093 | AI assistant chat nội bộ | 8 | AI_09 AI Agent Engineer |
| US-094 | Lưu kết quả AI vào hồ sơ | 5 | AI_06 Database Engineer |
| US-106 | Unit test backend service | 8 | AI_11 QA Engineer |
| US-108 | API integration test | 8 | AI_11 QA Engineer |
| US-109 | Kiểm tra bảo mật JWT/RBAC | 5 | AI_11 QA Engineer |
| US-112 | Docker compose dev | 8 | AI_12 DevOps Agent |
| US-113 | Build production | 5 | AI_12 DevOps Agent |
| US-114 | Demo script dữ liệu | 5 | AI_13 Technical Writer |
| US-115 | Kiểm thử UAT theo vai trò | 8 | AI_11 QA Engineer |

### Deliverables

- Test cơ bản cho backend, smart contract, API flow.
- Docker compose hoặc hướng dẫn chạy đầy đủ.
- Demo script hoàn chỉnh.
- Tài liệu UAT theo vai trò.
- AI risk suggestion ở mức hỗ trợ tham khảo.

### Definition of Done

- Build không lỗi.
- Test quan trọng pass.
- Có tài khoản demo cho từng vai trò.
- Có dữ liệu demo đủ luồng.
- Có checklist demo và UAT.

---

## 7. Sprint Roadmap tóm tắt

| Sprint | Chủ đề | Mục tiêu chính | Kết quả cuối sprint |
|---|---|---|---|
| Sprint 0 | Foundation | Khởi tạo repo, môi trường, DB, Hardhat | Dự án chạy được cơ bản |
| Sprint 1 | Auth & RBAC | Đăng nhập, phân quyền, layout | Người dùng vào đúng dashboard |
| Sprint 2 | Users & Land Parcels | Quản lý user, đơn vị, thửa đất | Có dữ liệu nền nghiệp vụ |
| Sprint 3 | IPFS & Documents | Upload tài liệu, lưu CID/hash | Hồ sơ có tài liệu pháp lý |
| Sprint 4 | Blockchain & Dossier Creation | Contract, adapter, tạo/nộp hồ sơ | Hồ sơ ghi được blockchain metadata |
| Sprint 5 | Dossier Workflow | Tiếp nhận, thẩm định, phê duyệt | Luồng nghiệp vụ cốt lõi hoàn chỉnh |
| Sprint 6 | Certificate & Lookup | Chứng nhận số, tra cứu, audit | Xác minh chứng nhận và txHash |
| Sprint 7 | Transfer & Dashboard | Chuyển nhượng, public lookup, thống kê | Demo được giao dịch quyền sử dụng đất |
| Sprint 8 | QA & Demo | AI nâng cao, test, security, deploy | MVP sẵn sàng báo cáo/demo |

---

## 8. Phân loại ưu tiên MoSCoW

### Must Have

- Auth/RBAC.
- Quản lý thửa đất.
- Upload tài liệu lên IPFS.
- Lưu hash/CID.
- Tạo/nộp hồ sơ.
- Tiếp nhận/thẩm định/phê duyệt.
- Ghi nhận blockchain.
- Tra cứu trạng thái/lịch sử.
- Phát hành chứng nhận mô phỏng.
- Audit log.
- Kiểm thử bảo mật phân quyền.

### Should Have

- Mô phỏng VNeID.
- Chuyển nhượng quyền sử dụng đất.
- Dashboard thống kê.
- Public lookup không cần đăng nhập.
- AI kiểm tra thiếu hồ sơ.
- AI tóm tắt hồ sơ.
- PDF chứng nhận mô phỏng.
- Event sync blockchain.

### Could Have

- AI chat assistant nội bộ.
- Lọc audit nâng cao.
- Đổi mật khẩu.
- Bản đồ polygon chi tiết.
- Cảnh báo lỗi IPFS/RPC nâng cao.

### Won't Have trong MVP

- Ký số thật.
- Thanh toán thật.
- Kết nối VNeID production.
- Kết nối hệ thống thuế/công chứng/ngân hàng thật.
- GIS chuyên sâu.
- Token hoá giao dịch có giá trị pháp lý thật.

---

## 9. Luồng demo MVP đề xuất

### Demo 1: Đăng nhập và phân quyền

1. Admin đăng nhập.
2. Admin tạo cán bộ tiếp nhận/thẩm định/phê duyệt.
3. Citizen đăng nhập.
4. Citizen chỉ thấy chức năng của người dân.

### Demo 2: Tạo thửa đất và upload tài liệu

1. Cán bộ tạo thửa đất mẫu.
2. Citizen tạo hồ sơ liên quan thửa đất.
3. Upload sổ đỏ, CCCD, bản đồ hiện trạng.
4. Hệ thống lưu CID/hash IPFS.
5. Hiển thị danh sách tài liệu.

### Demo 3: Nộp và xử lý hồ sơ

1. Citizen nộp hồ sơ.
2. Cán bộ tiếp nhận kiểm tra.
3. Cán bộ yêu cầu bổ sung nếu thiếu.
4. Citizen bổ sung tài liệu.
5. Cán bộ thẩm định.
6. Cán bộ phê duyệt.
7. Hệ thống ghi txHash blockchain.

### Demo 4: Phát hành và xác minh chứng nhận

1. Sau khi phê duyệt, hệ thống phát hành chứng nhận số.
2. Hash chứng nhận được ghi blockchain.
3. Citizen xem chứng nhận.
4. Public Viewer nhập mã chứng nhận để xác minh.

### Demo 5: Chuyển nhượng mô phỏng

1. Chủ sử dụng tạo yêu cầu chuyển nhượng.
2. Công chứng viên xác nhận.
3. Cán bộ thẩm định.
4. Cán bộ phê duyệt.
5. Hệ thống cập nhật chủ mới.
6. Blockchain ghi nhận lịch sử sở hữu.

### Demo 6: AI hỗ trợ hồ sơ

1. Citizen bấm “AI kiểm tra hồ sơ”.
2. AI báo thiếu giấy tờ hoặc đề xuất bổ sung.
3. Cán bộ bấm “AI tóm tắt hồ sơ”.
4. AI đưa ra summary và rủi ro tham khảo.
5. UI hiển thị cảnh báo AI không có giá trị pháp lý.

---

## 10. Mapping backlog với AI Agents

| Agent ID | Vai trò | Backlog chính phụ trách |
|---|---|---|
| AI_01 | System Architect | US-001, US-002, kiến trúc tổng thể |
| AI_02 | Blockchain Core Developer | US-005, US-042 đến US-051, US-066, US-075 |
| AI_03 | IPFS/Storage Agent | US-034 đến US-039 |
| AI_04 | Backend API Developer | Auth, Land, Dossier, Workflow, Certificate, Transfer |
| AI_05 | Auth/VNeID Agent | US-014, US-015, RBAC, mock identity |
| AI_06 | Database Engineer | US-006, US-009, schema, migration, audit, AI reviews |
| AI_07 | Frontend Developer | Dashboard, form, timeline, lookup, officer pages |
| AI_08 | UI/UX Agent | Layout, status badge, timeline, notification, disclaimer |
| AI_09 | AI Agent Engineer | US-090 đến US-094 |
| AI_10 | Legal/Compliance Agent | Review quy trình, disclaimer, dữ liệu công khai/nhạy cảm |
| AI_11 | QA Engineer | US-047, US-106 đến US-110, US-115 |
| AI_12 | DevOps Agent | Docker, build, deploy, env |
| AI_13 | Technical Writer | README, demo script, docs |
| AI_14 | Product Owner Agent | Ưu tiên backlog, nghiệm thu sprint |
| AI_15 | Security Reviewer | RBAC, JWT, input validation, audit, dữ liệu nhạy cảm |

---

## 11. Dependency Map

| Nhóm phụ thuộc | Điều kiện trước | Chức năng phụ thuộc |
|---|---|---|
| Auth/RBAC | User + JWT + roles | Tất cả route private |
| Land Parcel | DB schema + user owner | Dossier, Certificate, Transfer |
| IPFS | Upload service + hash | Dossier submission, Certificate evidence |
| Blockchain | Contract + deploy + adapter | Approval, Certificate, Transfer history |
| Dossier Workflow | Land + Documents + Auth | Approval, Certificate |
| Certificate | Approved Dossier + Blockchain | Public verification, Transfer |
| Transfer | Valid Certificate + Owner | Ownership history |
| AI Review | Dossier + Document metadata | AI checklist, summary, risk suggestion |
| Audit Log | Auth + core actions | Admin dashboard, traceability |

---

## 12. Definition of Ready

Một user story được đưa vào sprint khi:

- Có actor rõ ràng.
- Có mô tả nghiệp vụ rõ.
- Có acceptance criteria.
- Có API/schema/UX mock tối thiểu nếu cần.
- Có estimate tương đối.
- Có phụ thuộc đã xác định.
- Không còn mâu thuẫn về quyền truy cập hoặc trạng thái nghiệp vụ.

---

## 13. Definition of Done chung

Một user story được xem là hoàn thành khi:

- Code đã được implement.
- API chạy được và có xử lý lỗi cơ bản.
- Frontend gọi được API nếu có UI.
- Dữ liệu được lưu đúng schema.
- RBAC được kiểm tra với vai trò liên quan.
- Có log/audit nếu là thao tác nghiệp vụ quan trọng.
- Không phá vỡ luồng demo chính.
- Có test hoặc checklist test thủ công.
- Đã cập nhật tài liệu nếu thay đổi API/schema/contract.

---

## 14. Rủi ro triển khai backlog

| Rủi ro | Tác động | Cách giảm thiểu |
|---|---|---|
| Smart contract thay đổi nhiều lần | Backend/frontend phải sửa theo | Chốt contract interface từ Sprint 4 |
| IPFS gateway không ổn định | Demo không xem được tài liệu | Có local fallback hoặc mock gateway |
| Quy trình nghiệp vụ quá rộng | Không kịp MVP | Ưu tiên luồng đăng ký/phê duyệt trước, chuyển nhượng sau |
| AI trả lời không ổn định | Dễ gây hiểu nhầm pháp lý | Gắn disclaimer, chỉ dùng AI như hỗ trợ tham khảo |
| RBAC sai | Lộ dữ liệu nhạy cảm | Test phân quyền ở Sprint 8 và review từ Sprint 1 |
| Blockchain testnet lỗi/phí gas | Không demo được | Ưu tiên Hardhat local/Ganache, Sepolia là tuỳ chọn |
| Dữ liệu đất đai phức tạp | Form quá dài | MVP chỉ dùng bộ trường tối thiểu |
| Không đồng bộ DB và blockchain | Lịch sử sai lệch | Lưu txHash và trạng thái sync rõ ràng |

---

## 15. Backlog dành cho phiên bản sau MVP

| ID | Chức năng | Mô tả |
|---|---|---|
| POST-MVP-001 | Tích hợp ký số thật | Kết nối nhà cung cấp chữ ký số hợp lệ |
| POST-MVP-002 | Tích hợp VNeID thật | Đăng nhập/xác thực danh tính qua VNeID production |
| POST-MVP-003 | Kết nối hệ thống thuế | Tính và nộp thuế/lệ phí liên quan đất đai |
| POST-MVP-004 | Kết nối công chứng | Đồng bộ hồ sơ công chứng thật |
| POST-MVP-005 | GIS nâng cao | Bản đồ quy hoạch, lớp dữ liệu, overlay vùng |
| POST-MVP-006 | Token hoá RWA nâng cao | Mô hình token đại diện quyền sử dụng đất theo khung pháp lý |
| POST-MVP-007 | Workflow liên thông nhiều cơ quan | Xã/phường, quận/huyện, sở tài nguyên, thuế, công chứng |
| POST-MVP-008 | Mobile app | Ứng dụng cho người dân |
| POST-MVP-009 | AI OCR tài liệu | Trích xuất thông tin từ sổ đỏ, CCCD, hợp đồng |
| POST-MVP-010 | AI phát hiện bất thường | Phát hiện trùng lặp, sai lệch diện tích, hồ sơ đáng ngờ |

---

## 16. Gợi ý sử dụng backlog với Codex

Khi triển khai bằng Codex, nên chia task theo format:

```text
Implement US-052: Create Land Dossier

Context:
- Project: UrbanChain-VN
- Backend: Node.js + Express + TypeScript + Prisma
- Frontend: React + TypeScript + Vite + Tailwind
- Database: MariaDB/PostgreSQL
- Related entities: User, LandParcel, Dossier, Document

Requirements:
- Citizen can create a dossier for a land parcel.
- Dossier has type, status, description, ownerId, parcelId.
- Initial status is Draft.
- Only owner or officer can view detail.
- Add API routes, service, DTO validation, Prisma model if missing.
- Add frontend form if needed.
- Add basic tests or manual test checklist.

Acceptance Criteria:
- POST /api/dossiers creates a dossier.
- GET /api/dossiers/:id returns detail with parcel and documents.
- Unauthorized users cannot access private dossier.
- Invalid parcelId returns 404.
```

---

## 17. Kết luận

Backlog này được thiết kế theo hướng:

- Đủ chi tiết để triển khai thật bằng Codex/AI Agents.
- Có thể dùng trực tiếp trong repo dưới file `docs/04-backlog-mvp.md`.
- Bám theo MVP blockchain đất đai:
  - IPFS lưu tài liệu;
  - blockchain lưu hash/metadata/lịch sử;
  - backend quản lý nghiệp vụ;
  - frontend phục vụ từng vai trò;
  - AI hỗ trợ kiểm tra và xử lý hồ sơ;
  - audit log phục vụ minh bạch và truy vết.
