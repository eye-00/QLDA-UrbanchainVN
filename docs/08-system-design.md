# 08. System Design — UrbanChain-VN

> Tài liệu này mô tả thiết kế hệ thống tổng thể cho MVP UrbanChain-VN.  
> File này dùng làm nguồn tham chiếu cho Codex, các AI agents và nhóm PM khi triển khai code.

---

## 1. Mục tiêu thiết kế

UrbanChain-VN là hệ thống MVP mô phỏng quản lý nghiệp vụ đất đai có hỗ trợ blockchain, IPFS và AI OCR. Hệ thống không thay thế hệ thống quản lý đất đai chính thức mà đóng vai trò:

- số hóa hồ sơ và luân chuyển nghiệp vụ;
- lưu trữ tài liệu số qua IPFS/off-chain storage;
- ghi nhận hash/CID và lịch sử giao dịch lên blockchain/testnet;
- hỗ trợ cán bộ bằng OCR, đối chiếu dữ liệu và cảnh báo;
- cung cấp giao diện cho người dân/doanh nghiệp và cán bộ xử lý hồ sơ.

Nguyên tắc quan trọng:

- CSDL nghiệp vụ là nguồn dữ liệu chính của hệ thống.
- Blockchain chỉ là lớp truy vết, xác thực tính toàn vẹn và ghi nhận lịch sử số.
- IPFS lưu tài liệu/hồ sơ số; blockchain chỉ lưu CID/hash và dữ liệu tối thiểu.
- AI chỉ hỗ trợ kiểm tra hồ sơ, không tự động ra quyết định hành chính.
- Mọi quyết định nghiệp vụ phải do vai trò cán bộ/cơ quan có thẩm quyền thực hiện.

## 1.1. Legal Source Reference

- Nguồn pháp lý chuẩn: [00-legal-basis-register.md](./00-legal-basis-register.md)
- Ma trận traceability: [docs-legal-aligned/16-legal-requirement-traceability.md](./docs-legal-aligned/16-legal-requirement-traceability.md)

Ràng buộc thiết kế bắt buộc:

- Authority-routing theo mô hình địa phương 2 cấp.
- Payment model off-chain tách `INTAKE_FEE` và `LAND_FINANCIAL_OBLIGATION`.
- Map module có nhãn nguồn dữ liệu và chính sách VN-2000/reference.
- Blockchain precondition: chỉ ghi sau cập nhật hồ sơ địa chính/CSDL đất đai hợp lệ.

---

## 2. Phạm vi MVP

MVP tập trung vào các nhóm chức năng:

1. Định danh và phân quyền.
2. Số hóa hồ sơ và lưu trữ IPFS.
3. Đăng ký đất đai lần đầu.
4. Duyệt, yêu cầu bổ sung hoặc từ chối hồ sơ.
5. Ghi nhận bản ghi số/NFT đại diện quyền sử dụng đất trên testnet sau khi hồ sơ hợp lệ.
6. Tra cứu thông tin thửa đất và lịch sử xử lý.
7. Đăng ký biến động/chuyển nhượng quyền sử dụng đất ở mức mô phỏng.
8. AI OCR hỗ trợ kiểm tra hồ sơ.
9. Dashboard và báo cáo vận hành.

## 2.1. Target auth and portal model

Target auth model của UrbanChain-VN tách 4 lớp:

- `accountType`: xác định loại tài khoản đăng nhập, portal được phép truy cập và route điều hướng sau đăng nhập.
- `role`: xác định vai trò nghiệp vụ và trách nhiệm xử lý.
- `permission`: xác định hành động cụ thể được phép thực hiện.
- `scope`: xác định phạm vi cơ quan, phòng ban, thủ tục, địa bàn hoặc ownership.

Portal split theo `accountType`:

- `CITIZEN` -> `Portal người dân` -> `/citizen/dashboard`
- `STAFF` -> `Portal cán bộ` -> `/staff/dashboard`
- `AGENCY_ADMIN` -> `Portal quản trị cơ quan` -> `/admin/dashboard`
- `SYSTEM_ADMIN` -> `Portal quản trị hệ thống` -> `/system/dashboard`

Quy tắc boundary:

- Người dân và doanh nghiệp/external applicant chỉ dùng `Portal người dân`.
- Cán bộ nghiệp vụ chỉ dùng `Portal cán bộ`.
- Quản trị cơ quan không truy cập chức năng chỉ dành cho `SYSTEM_ADMIN`.
- `accountType` quyết định portal entry; `role + permission + scope` quyết định hành động bên trong portal.

Runtime mismatch note:

- Đã hoàn thành đồng bộ: Kiến trúc xác thực (Target Auth Model) và cổng đăng nhập riêng biệt theo phân hệ Portal hiện tại đã được triển khai hoàn chỉnh cả ở backend lẫn frontend.
- Cấu trúc cơ sở dữ liệu mới (CitizenProfile & StaffProfile) đã được áp dụng và kiểm thử thành công qua 100% các bộ test suites.

---

## 3. Kiến trúc tổng thể

### 3.1. Các lớp chính

```text
[Người dân / Doanh nghiệp]
        |
        v
[Frontend Citizen Portal - React]
        |
        v
[Backend API - Node.js/Express]
        |
        +--> [Database - MySQL/Prisma]
        |
        +--> [IPFS Storage Service]
        |
        +--> [OCR/AI Support Service]
        |
        +--> [Blockchain Adapter - Ethers/Web3]
                    |
                    v
          [Smart Contract - Ethereum Testnet/Ganache]

[Cán bộ / Cơ quan xử lý]
        |
        v
[Frontend Staff Portal - React]
        |
        v
[Backend API]

[Quản trị cơ quan]
        |
        v
[Frontend Agency Admin Portal - React]
        |
        v
[Backend API]

[Quản trị hệ thống]
        |
        v
[Frontend System Admin Portal - React]
        |
        v
[Backend API]
```

### 3.2. Thành phần hệ thống

| Thành phần          | Công nghệ đề xuất                      | Vai trò                                                                                      |
| ------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------- |
| Citizen Portal      | React, TypeScript, Vite                | Giao diện `accountType = CITIZEN`: nộp hồ sơ, theo dõi trạng thái, tra cứu                   |
| Staff Portal        | React, TypeScript, Ant Design/Tailwind | Giao diện `accountType = STAFF`: tiếp nhận, kiểm tra, duyệt/từ chối, dashboard               |
| Agency Admin Portal | React, TypeScript, Ant Design/Tailwind | Giao diện `accountType = AGENCY_ADMIN`: quản lý người dùng, cấu hình scope trong một cơ quan |
| System Admin Portal | React, TypeScript, Ant Design/Tailwind | Giao diện `accountType = SYSTEM_ADMIN`: cấu hình liên cơ quan, quản trị hệ thống             |
| Backend API         | Node.js, Express, TypeScript           | Xử lý nghiệp vụ, API, phân quyền, điều phối DB/IPFS/Blockchain/OCR                           |
| Database            | MySQL + Prisma                         | Lưu người dùng, hồ sơ, trạng thái, metadata, audit logs                                      |
| IPFS Service        | IPFS node / local mock / gateway       | Lưu tài liệu scan và hồ sơ số                                                                |
| Smart Contract      | Solidity + Hardhat                     | Ghi nhận bản ghi đất và lịch sử chuyển nhượng số                                             |
| OCR Service         | Mock OCR / Tesseract / PaddleOCR       | Trích xuất dữ liệu từ tài liệu scan, cảnh báo sai lệch                                       |
| DevOps              | Docker Compose, Hardhat, scripts       | Chạy môi trường local/demo                                                                   |

### 3.3. Legal-aligned architecture baseline (2026-05-10)

Các thành phần bắt buộc bổ sung từ Sprint 2+ theo legal baseline:

| Thành phần                      | Mục đích                                             | Legal backlog mapping      |
| ------------------------------- | ---------------------------------------------------- | -------------------------- |
| `Procedure Registry`            | Lưu `procedureCode`, `legalBasis`, actor thẩm quyền  | `LEG-S2-001`               |
| `Authority Matrix`              | Ràng buộc `role x action x status` theo thủ tục      | `LEG-S2-001`, `LEG-S2-005` |
| `Document Versioning`           | Mỗi lần upload/thay thế tạo version mới              | `LEG-S2-002`               |
| `Submit Snapshot`               | Khóa snapshot tài liệu tại thời điểm submit          | `LEG-S2-004`               |
| `Payment Obligation`            | Tách `INTAKE_FEE` và `LAND_FINANCIAL_OBLIGATION`     | `LEG-S2-003`, `LEG-S5-001` |
| `Blockchain Precondition Guard` | Chặn ghi on-chain nếu chưa hoàn tất off-chain hợp lệ | `LEG-S4-001`, `LEG-S7-001` |

Quy tắc kiến trúc:

- Nguồn quyết định nghiệp vụ luôn là off-chain workflow.
- Blockchain chỉ nhận hash/CID/tx metadata sau khi đạt trạng thái off-chain hợp lệ.
- Không đổi ABI smart contract cho Sprint 2/3/4 nếu legal gates chưa đạt.

---

## 4. Kiến trúc module

### 4.1. Backend modules

```text
backend/src/
  app.ts
  server.ts
  shared/
    response.ts
    errors.ts
    auth/
    validation/
  modules/
    auth/
    files/
    registrations/
    transfers/
    lands/
    ocr/
    dashboard/
    audit/
  infrastructure/
    prisma/
    ipfs/
    blockchain/
```

| Module                      | Nhiệm vụ                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `auth`                      | Đăng nhập theo `accountType`, JWT/session lifecycle, route guard theo portal, authorization theo `role + permission + scope` |
| `files`                     | Upload hồ sơ/tài liệu, sinh metadata, gửi IPFS                                                                               |
| `registrations`             | Tạo hồ sơ đăng ký lần đầu, submit, tiếp nhận, bổ sung, từ chối, phê duyệt                                                    |
| `transfers`                 | Khởi tạo/chấp nhận/chuyển xử lý/hoàn tất hồ sơ biến động/chuyển nhượng                                                       |
| `lands`                     | Tra cứu thông tin thửa đất, lịch sử xử lý, lịch sử transaction                                                               |
| `ocr`                       | OCR mock/real, trích xuất trường dữ liệu, sinh cảnh báo                                                                      |
| `dashboard`                 | Thống kê hồ sơ, trạng thái, giao dịch                                                                                        |
| `audit`                     | Lưu nhật ký thao tác                                                                                                         |
| `infrastructure/blockchain` | Adapter gọi smart contract                                                                                                   |
| `infrastructure/ipfs`       | Adapter lưu file lên IPFS                                                                                                    |

### 4.2. Frontend modules

```text
frontend/src/
  app/
  routes/
  components/
  pages/
    citizen/
    staff/
    agency-admin/
    system-admin/
  services/
    api.ts
  types/
  styles/
```

| Module               | Nhiệm vụ                                                                    |
| -------------------- | --------------------------------------------------------------------------- |
| `pages/citizen`      | Portal người dân: nộp hồ sơ lần đầu, theo dõi hồ sơ, tra cứu đất            |
| `pages/staff`        | Portal cán bộ: dashboard, danh sách hồ sơ, chi tiết hồ sơ, xử lý trạng thái |
| `pages/agency-admin` | Portal quản trị cơ quan: quản lý người dùng và scope theo đơn vị            |
| `pages/system-admin` | Portal quản trị hệ thống: cấu hình hệ thống, quản trị liên cơ quan          |
| `services/api.ts`    | Gọi API backend theo `docs/07-api-contract.md`                              |
| `types`              | Kiểu dữ liệu dùng chung với API                                             |
| `components`         | Form, table, status badge, upload widget, confirmation dialog               |

### 4.3. Smart contract modules

```text
contracts/
  contracts/
    UrbanLandRegistry.sol
  scripts/
    deploy.ts
  test/
    UrbanLandRegistry.test.ts
```

Smart contract chỉ xử lý:

- đăng ký bản ghi đất sau khi hồ sơ được phê duyệt hợp lệ;
- lưu CID/hash metadata;
- cập nhật lịch sử chủ thể số khi có biến động hợp lệ;
- emit event để backend đồng bộ;
- kiểm soát role gọi hàm.

Smart contract không xử lý:

- quyết định hồ sơ đủ điều kiện pháp lý hay không;
- lưu dữ liệu cá nhân nhạy cảm;
- lưu bản scan giấy tờ;
- thay thế CSDL đất đai/hồ sơ địa chính.

---

## 5. Mô hình dữ liệu mức cao

### 5.1. Entity chính

| Entity                     | Mô tả                                          |
| -------------------------- | ---------------------------------------------- |
| `User`                     | Người dân, doanh nghiệp, cán bộ, quản trị      |
| `Dossier` / `Registration` | Hồ sơ đăng ký đất đai lần đầu                  |
| `Transfer`                 | Hồ sơ đăng ký biến động/chuyển nhượng          |
| `LandRecord`               | Bản ghi thửa đất trong hệ thống nghiệp vụ      |
| `FileObject`               | Metadata file, CID, hash, loại tài liệu        |
| `OcrResult`                | Kết quả OCR và cảnh báo                        |
| `AuditLog`                 | Nhật ký thao tác                               |
| `BlockchainTx`             | Mapping transaction hash với hồ sơ/land record |

### 5.2. Quan hệ chính

```text
User 1---n Registration
User 1---n Transfer
Registration 1---n FileObject
Transfer 1---n FileObject
Registration 1---n OcrResult
LandRecord 1---n BlockchainTx
LandRecord 1---n Transfer
User 1---n AuditLog
```

### 5.3. User account model (Target model)

Target data model phải tách lớp đăng nhập khỏi lớp phân quyền nghiệp vụ:

```text
users
- id
- username
- email
- passwordHash
- accountType
- status
- createdAt
- updatedAt

citizen_profiles
- id
- userId
- citizenId
- fullName
- phone
- address

staff_profiles
- id
- userId
- staffCode
- officialUsername
- fullName
- agencyId
- departmentId
- position
- officialEmail

roles
- id
- code
- name
- description

permissions
- id
- code
- name
- description

user_roles
- userId
- roleId

role_permissions
- roleId
- permissionId
```

Quy tắc:

- `email` vẫn được giữ lại nhưng không còn là login identifier chính.
- `citizenId` dùng cho người dân và external applicant.
- `officialUsername` hoặc `staffCode` dùng cho cán bộ.
- `username` dùng cho quản trị viên cơ quan và quản trị hệ thống.
- Role cũ vẫn giữ nguyên trong bảng `roles`.
- Không gộp `accountType` và `role` thành một khái niệm.

### 5.4. AccountType x Role x Portal mapping

| accountType    | Portal                     | Role nghiệp vụ giữ nguyên                                                                                       | Ghi chú                                                        |
| -------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `CITIZEN`      | `Portal người dân`         | `CITIZEN`, `BUSINESS`                                                                                           | `BUSINESS` được xem là external applicant role trong MVP       |
| `STAFF`        | `Portal cán bộ`            | `RECEPTION_OFFICER`, `COMMUNE_OFFICER`, `LAND_REGISTRY_OFFICER`, `TAX_OFFICER`, `APPROVAL_AUTHORITY`, `AUDITOR` | Dùng `officialUsername` hoặc `staffCode` để đăng nhập          |
| `AGENCY_ADMIN` | `Portal quản trị cơ quan`  | `ADMIN` với `agency-scoped scope`                                                                               | Chưa tách role admin mới; phân biệt bằng `accountType + scope` |
| `SYSTEM_ADMIN` | `Portal quản trị hệ thống` | `ADMIN` với `system-wide scope`                                                                                 | Không đổi tên hàng loạt role `ADMIN` hiện có                   |

### 5.5. Scope model

`scope` là policy layer tách riêng khỏi `role`, có thể áp vào:

- `agencyId`
- `departmentId`
- `procedureCodes`
- `localityCodes`
- `dataOwnership`

---

## 6. State machine tổng quát

### 6.1. Hồ sơ đăng ký lần đầu

```text
DRAFT
  -> SUBMITTED
  -> INTAKE_REVIEW
  -> SUPPLEMENT_REQUIRED
  -> SUBMITTED
  -> COMMUNE_CONFIRMATION
  -> LAND_OFFICE_REVIEW
  -> TAX_PENDING
  -> TAX_COMPLETED
  -> APPROVED
  -> BLOCKCHAIN_RECORDED
  -> COMPLETED

Các trạng thái kết thúc lỗi:
  -> REJECTED
  -> CANCELLED
```

Legal-aligned canonical states cho đăng ký lần đầu:

```text
MOI_TAO -> CHO_TIEP_NHAN -> CAN_BO_SUNG -> DA_TIEP_NHAN -> CHO_XAC_NHAN_CAP_XA
-> DA_XAC_NHAN_CAP_XA -> DANG_THAM_DINH_VPDKDD -> CHO_THUE
-> CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH -> DA_HOAN_THANH_NGHIA_VU_TAI_CHINH
-> CHO_KY_CAP -> DA_KY_CAP -> DA_CAP -> DA_CAP_NHAT_HO_SO_DIA_CHINH
-> DA_GHI_BLOCKCHAIN -> DA_TRA_KET_QUA
```

### 6.2. Hồ sơ biến động/chuyển nhượng

```text
DRAFT
  -> SUBMITTED
  -> RECEIVER_CONFIRMED
  -> INTAKE_REVIEW
  -> LAND_OFFICE_REVIEW
  -> TAX_PENDING
  -> TAX_COMPLETED
  -> CHANGE_APPROVED
  -> BLOCKCHAIN_RECORDED
  -> COMPLETED

Các trạng thái kết thúc lỗi:
  -> REJECTED
  -> CANCELLED
```

### 6.3. Nguyên tắc state transition

- Chỉ người dân/doanh nghiệp tạo hoặc submit hồ sơ của mình.
- Chỉ cơ quan tiếp nhận/cán bộ có quyền mới được chuyển sang trạng thái tiếp nhận.
- Chỉ cán bộ có thẩm quyền nghiệp vụ mới được yêu cầu bổ sung/từ chối/phê duyệt.
- Ghi blockchain chỉ được thực hiện sau trạng thái `APPROVED` hoặc `CHANGE_APPROVED`.
- Mọi transition phải tạo audit log.

---

## 7. Luồng dữ liệu đăng ký lần đầu

```text
1. Người dân nhập hồ sơ trên Citizen Portal.
2. Frontend gửi dữ liệu đến Backend API.
3. Backend validate dữ liệu và tạo hồ sơ ở trạng thái DRAFT/SUBMITTED.
4. File đính kèm được lưu qua File/IPFS Service.
5. IPFS trả CID/hash; backend lưu vào FileObject.
6. OCR Service đọc file và tạo cảnh báo hỗ trợ.
7. Cơ quan tiếp nhận kiểm tra thành phần hồ sơ.
8. UBND cấp xã xác nhận thông tin thuộc thẩm quyền nếu cần.
9. VPĐKĐĐ/Chi nhánh thẩm định chuyên môn.
10. Cơ quan thuế xử lý nghĩa vụ tài chính nếu phát sinh.
11. Cơ quan có thẩm quyền ký cấp/phê duyệt.
12. VPĐKĐĐ cập nhật hồ sơ địa chính/CSDL đất đai.
13. Backend gọi smart contract để ghi nhận bản ghi số.
14. Smart contract emit event; backend lưu transaction hash.
15. Người dân tra cứu kết quả.
```

---

## 8. Luồng dữ liệu chuyển nhượng/biến động

```text
1. Bên chuyển nhượng đăng nhập `Portal người dân` và tạo hồ sơ biến động.
2. Bên nhận xác nhận thông tin giao dịch.
3. File hợp đồng/văn bản chuyển nhượng được lưu IPFS.
4. Cơ quan tiếp nhận kiểm tra thành phần hồ sơ.
5. VPĐKĐĐ/Chi nhánh kiểm tra điều kiện thực hiện quyền.
6. Nếu có nghĩa vụ tài chính, hệ thống mô phỏng chuyển thông tin sang cơ quan thuế.
7. Sau khi đủ điều kiện, VPĐKĐĐ cập nhật biến động trong CSDL nghiệp vụ.
8. Backend gọi smart contract ghi nhận lịch sử chuyển nhượng số.
9. Backend lưu transaction hash và cập nhật trạng thái.
10. Các bên tra cứu lịch sử.
```

---

## 9. Phân quyền hệ thống

### 9.1. Authorization formula

Authorization model chuẩn của hệ thống là:

- `accountType` + `role` + `permission` + `scope`

Trong đó:

- `accountType` xác định loại tài khoản và portal đăng nhập.
- `role` xác định vai trò nghiệp vụ.
- `permission` xác định hành động cụ thể.
- `scope` xác định phạm vi dữ liệu/cơ quan/phòng ban/thủ tục/địa bàn.

### 9.2. Portal access matrix

| accountType    | Portal được phép truy cập  | Portal bị chặn                                                            |
| -------------- | -------------------------- | ------------------------------------------------------------------------- |
| `CITIZEN`      | `Portal người dân`         | `Portal cán bộ`, `Portal quản trị cơ quan`, `Portal quản trị hệ thống`    |
| `STAFF`        | `Portal cán bộ`            | `Portal người dân`, `Portal quản trị cơ quan`, `Portal quản trị hệ thống` |
| `AGENCY_ADMIN` | `Portal quản trị cơ quan`  | `Portal người dân`, `Portal cán bộ`, `Portal quản trị hệ thống`           |
| `SYSTEM_ADMIN` | `Portal quản trị hệ thống` | `Portal người dân`, `Portal cán bộ`, `Portal quản trị cơ quan`            |

### 9.3. Role matrix giữ nguyên theo repo hiện tại

| Role                    | accountType đi kèm             | Quyền nghiệp vụ chính                                                                          |
| ----------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `CITIZEN`               | `CITIZEN`                      | Tạo hồ sơ, upload file, submit, xem trạng thái, tra cứu dữ liệu thuộc ownership                |
| `BUSINESS`              | `CITIZEN`                      | Tương tự external applicant; có thể tham gia hồ sơ chuyển nhượng trong phạm vi được phép       |
| `RECEPTION_OFFICER`     | `STAFF`                        | Tiếp nhận hồ sơ, kiểm tra thành phần, yêu cầu bổ sung                                          |
| `COMMUNE_OFFICER`       | `STAFF`                        | Xác nhận cấp xã, ghi nhận ý kiến thuộc thẩm quyền                                              |
| `LAND_REGISTRY_OFFICER` | `STAFF`                        | Thẩm định chuyên môn, chuyển thuế, cập nhật hồ sơ địa chính, blockchain sync theo precondition |
| `TAX_OFFICER`           | `STAFF`                        | Xử lý nghĩa vụ tài chính off-chain, xác nhận hoàn thành nghĩa vụ                               |
| `APPROVAL_AUTHORITY`    | `STAFF`                        | Ký cấp/phê duyệt kết quả theo thẩm quyền                                                       |
| `AUDITOR`               | `STAFF`                        | Xem audit log, kiểm tra lịch sử xử lý trong phạm vi được cấp                                   |
| `ADMIN`                 | `AGENCY_ADMIN`, `SYSTEM_ADMIN` | Quản trị dữ liệu, người dùng, cấu hình, dashboard; bị giới hạn thêm bởi `scope`                |

### 9.4. Permission and scope examples

| Role                     | Permission tiêu biểu                                                   | Scope tiêu biểu                                               |
| ------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| `LAND_REGISTRY_OFFICER`  | `VIEW_ASSIGNED_DOSSIER`, `UPDATE_DOSSIER_RESULT`, `REQUEST_SUPPLEMENT` | `agencyId`, `departmentId`, `procedureCodes`, `localityCodes` |
| `RECEPTION_OFFICER`      | `ACCEPT_DOSSIER`, `REQUEST_SUPPLEMENT`, `VIEW_FRONT_COUNTER_QUEUE`     | `agencyId`, `procedureCodes`, `localityCodes`                 |
| `ADMIN` (`AGENCY_ADMIN`) | `MANAGE_USERS`, `ASSIGN_ROLES`, `CONFIGURE_SCOPE`                      | `agencyId`                                                    |
| `ADMIN` (`SYSTEM_ADMIN`) | `MANAGE_SYSTEM_CONFIG`, `VIEW_GLOBAL_AUDIT`, `MANAGE_AGENCIES`         | `system-wide`                                                 |

### 9.5. Data access matrix theo scope

| Scope field      | Áp cho actor          | Ý nghĩa                                                                             |
| ---------------- | --------------------- | ----------------------------------------------------------------------------------- |
| `dataOwnership`  | `CITIZEN`, `BUSINESS` | Chỉ xem và thao tác hồ sơ/thửa đất thuộc chính mình hoặc hồ sơ được ủy quyền hợp lệ |
| `agencyId`       | `STAFF`, `ADMIN`      | Chỉ xem và xử lý dữ liệu thuộc cơ quan được gán                                     |
| `departmentId`   | `STAFF`               | Chỉ thao tác trong phòng ban/chức năng chuyên môn được phân công                    |
| `procedureCodes` | `STAFF`, `ADMIN`      | Chỉ xử lý các thủ tục nằm trong phạm vi nghiệp vụ được cấp                          |
| `localityCodes`  | `STAFF`, `ADMIN`      | Chỉ truy cập dữ liệu thuộc địa bàn được giao                                        |

### 9.6. Mock VNeID boundary

- `VNeID mock` là adapter định danh demo nội bộ của module `auth`.
- Input chính là `identityNumber`; backend map identity này vào user `CITIZEN` hoặc `BUSINESS` trong dữ liệu demo.
- `VNeID mock` không gọi API VNeID thật, không xác minh công dân ngoài đời thực, không thay thế chữ ký số hay giấy tờ pháp lý.
- Kết quả của `VNeID mock` chỉ dùng để:
  - mở session demo,
  - tăng độ tin cậy đầu vào cho luồng công dân/doanh nghiệp,
  - kiểm thử UX/API trước khi có tích hợp định danh thật.
- Không cho phép dùng `VNeID mock` để đăng nhập các role nội bộ như `ADMIN`, `RECEPTION_OFFICER`, `LAND_REGISTRY_OFFICER`.
- Các session `VNeID mock` chỉ được mở vào `Portal người dân`.

---

## 10. API design principles

- Tất cả response dùng envelope thống nhất.
- Tất cả API phải validate request body.
- Tất cả trạng thái phải dùng enum thống nhất.
- Các endpoint thay đổi trạng thái phải yêu cầu `accountType` và `role` phù hợp.
- Portal route guard kiểm tra `accountType`; action guard kiểm tra `role + permission + scope`.
- Mọi endpoint quan trọng phải ghi audit log.
- API không trả dữ liệu nhạy cảm không cần thiết cho frontend.
- API contract được quản lý tại `docs/07-api-contract.md`.

Response envelope chuẩn:

```json
{
  "success": true,
  "data": {},
  "message": "OK",
  "errors": []
}
```

---

## 11. Smart contract design principles

- Contract là lớp ghi nhận số, không phải cơ quan phê duyệt.
- Backend chỉ gọi contract sau khi workflow nghiệp vụ hợp lệ.
- Mỗi hành động contract phải emit event.
- Role gọi contract phải được kiểm soát.
- Không lưu họ tên, CCCD, địa chỉ chi tiết hoặc bản scan on-chain.
- Metadata nhạy cảm phải off-chain; on-chain chỉ lưu hash/CID.
- Test contract phải bao gồm happy path, forbidden access, duplicate action và bad state.

---

## 12. AI/OCR design principles

- OCR chỉ hỗ trợ nội bộ.
- OCR không được tự động duyệt/từ chối.
- Kết quả OCR phải lưu confidence và source file.
- Các cảnh báo OCR phải hiển thị cho cán bộ như “gợi ý kiểm tra”.
- Cán bộ vẫn phải ra quyết định cuối cùng.
- Nếu confidence thấp, hệ thống chỉ cảnh báo, không tự điền dữ liệu bắt buộc.

---

## 13. Audit trail

Mọi thao tác sau phải tạo audit log:

- đăng nhập;
- tạo hồ sơ;
- upload file;
- submit hồ sơ;
- yêu cầu bổ sung;
- từ chối;
- phê duyệt;
- chuyển trạng thái thuế;
- ghi nhận blockchain;
- cập nhật biến động;
- tra cứu dữ liệu nhạy cảm.

Audit log tối thiểu gồm:

```text
actorId
actorRole
action
targetType
targetId
previousState
nextState
timestamp
metadata
```

---

## 14. Tích hợp và đồng bộ

### 14.1. Backend ↔ IPFS

Backend gửi file hoặc mock file metadata đến IPFS adapter. IPFS trả:

```text
cid
hash
size
mimeType
gatewayUrl
```

### 14.2. Backend ↔ Blockchain

Backend gọi contract qua blockchain adapter:

```text
registerLand(...)
recordTransfer(...)
getLand(...)
```

Backend lưu:

```text
txHash
blockNumber
contractAddress
eventName
status
```

### 14.3. Backend ↔ OCR

Backend gửi file reference cho OCR service. OCR trả:

```text
extractedFields
confidence
warnings
sourceFileId
```

---

## 15. Non-functional requirements

| Nhóm            | Yêu cầu                                                          |
| --------------- | ---------------------------------------------------------------- |
| Performance     | API phản hồi thông thường dưới 5 giây trong demo                 |
| Security        | JWT/role middleware, validate input, không log tài liệu nhạy cảm |
| Reliability     | Có audit log, có trạng thái rõ ràng, không mất mapping CID/tx    |
| Maintainability | Module tách rõ, docs cập nhật cùng API/ABI                       |
| Testability     | Có unit test, contract test, E2E test cho luồng chính            |
| Compliance      | AI/blockchain không thay thế quyết định pháp lý                  |

---

## 16. Definition of Done kiến trúc

Một feature chỉ được xem là hoàn thành khi:

- map được với backlog/use case;
- không phá state machine;
- API/contract nếu đổi đã cập nhật tài liệu;
- có test phù hợp;
- không lưu dữ liệu nhạy cảm on-chain;
- có audit log cho thao tác quan trọng;
- UI hiển thị rõ trạng thái và lỗi;
- compliance review không còn blocking issue.

---

## 17. Thứ tự triển khai đề xuất

1. Auth/role.
2. Registration dossier create/submit.
3. File upload + IPFS metadata.
4. Admin intake/review.
5. Registration approval.
6. Smart contract register land.
7. Land search.
8. Transfer/change registration.
9. OCR warning.
10. Dashboard/report.
11. E2E + deployment.

---

# PHỤ LỤC — Legal-aligned System Design Patch 2025

## 1. Module mới/bắt buộc từ Sprint 2+

```text
Legal Procedure Registry
Document Versioning Service
Intake & Workflow Engine
Commune Confirmation Module
Land Registry Review Module
Tax/Payment Obligation Module
Approval & Issuance Module
Cadastral Update Module
Map Parcel Service
Blockchain Evidence Recorder
```

## 2. Ranh giới hệ thống

| Lớp               | Nguồn sự thật                                        | Ghi chú                          |
| ----------------- | ---------------------------------------------------- | -------------------------------- |
| Nghiệp vụ đất đai | Off-chain DB + hồ sơ địa chính/CSDL đất đai mô phỏng | Blockchain không thay thế        |
| Tài liệu scan/PDF | IPFS/off-chain object storage                        | DB lưu metadata/CID/hash         |
| Blockchain        | Hash/CID/tx/event                                    | Chỉ ghi sau khi off-chain hợp lệ |
| AI OCR            | OCR result/warning                                   | Không chuyển trạng thái tự động  |
| Bản đồ            | GeoJSON/geometry off-chain                           | Ghi hash ranh giới nếu đã duyệt  |
| Thanh toán        | Payment obligation/receipt off-chain                 | MoMo Test/QR chỉ mô phỏng        |

## 3. Service interaction cho đăng ký lần đầu

```text
Citizen Portal
 -> Registration API
 -> Document Versioning + IPFS
 -> OCR Assistant
 -> Intake Workflow
 -> Commune Confirmation
 -> Land Registry Review
 -> Tax/Payment Obligation
 -> Approval & Issuance
 -> Cadastral Update
 -> Blockchain Evidence Recorder
 -> Result Notification
```

## 4. Sprint 1 wallet đã xong — tác động tới thiết kế

Wallet module được giữ như lớp xác minh ví/ký kỹ thuật:

- dùng để ký nonce/challenge;
- ký hash tài liệu hoặc xác nhận thao tác demo;
- không dùng để tự động phê duyệt hồ sơ;
- không dùng để nộp thuế/phí thật bằng crypto/token;
- mọi chữ ký ví phải gắn với tài khoản đã RBAC và audit log.
