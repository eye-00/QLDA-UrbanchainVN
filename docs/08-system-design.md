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
[Frontend Admin Dashboard - React]
        |
        v
[Backend API]
```

### 3.2. Thành phần hệ thống

| Thành phần | Công nghệ đề xuất | Vai trò |
|---|---|---|
| Citizen Portal | React, TypeScript, Vite | Giao diện người dân/doanh nghiệp: nộp hồ sơ, theo dõi trạng thái, tra cứu |
| Admin Dashboard | React, TypeScript, Ant Design/Tailwind | Giao diện cán bộ: tiếp nhận, kiểm tra, duyệt/từ chối, dashboard |
| Backend API | Node.js, Express, TypeScript | Xử lý nghiệp vụ, API, phân quyền, điều phối DB/IPFS/Blockchain/OCR |
| Database | MySQL + Prisma | Lưu người dùng, hồ sơ, trạng thái, metadata, audit logs |
| IPFS Service | IPFS node / local mock / gateway | Lưu tài liệu scan và hồ sơ số |
| Smart Contract | Solidity + Hardhat | Ghi nhận bản ghi đất và lịch sử chuyển nhượng số |
| OCR Service | Mock OCR / Tesseract / PaddleOCR | Trích xuất dữ liệu từ tài liệu scan, cảnh báo sai lệch |
| DevOps | Docker Compose, Hardhat, scripts | Chạy môi trường local/demo |

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

| Module | Nhiệm vụ |
|---|---|
| `auth` | Đăng nhập demo, JWT, role-based access |
| `files` | Upload hồ sơ/tài liệu, sinh metadata, gửi IPFS |
| `registrations` | Tạo hồ sơ đăng ký lần đầu, submit, tiếp nhận, bổ sung, từ chối, phê duyệt |
| `transfers` | Khởi tạo/chấp nhận/chuyển xử lý/hoàn tất hồ sơ biến động/chuyển nhượng |
| `lands` | Tra cứu thông tin thửa đất, lịch sử xử lý, lịch sử transaction |
| `ocr` | OCR mock/real, trích xuất trường dữ liệu, sinh cảnh báo |
| `dashboard` | Thống kê hồ sơ, trạng thái, giao dịch |
| `audit` | Lưu nhật ký thao tác |
| `infrastructure/blockchain` | Adapter gọi smart contract |
| `infrastructure/ipfs` | Adapter lưu file lên IPFS |

### 4.2. Frontend modules

```text
frontend/src/
  app/
  routes/
  components/
  pages/
    citizen/
    admin/
  services/
    api.ts
  types/
  styles/
```

| Module | Nhiệm vụ |
|---|---|
| `pages/citizen` | Nộp hồ sơ lần đầu, theo dõi hồ sơ, tra cứu đất |
| `pages/admin` | Dashboard, danh sách hồ sơ, chi tiết hồ sơ, xử lý trạng thái |
| `services/api.ts` | Gọi API backend theo `docs/07-api-contract.md` |
| `types` | Kiểu dữ liệu dùng chung với API |
| `components` | Form, table, status badge, upload widget, confirmation dialog |

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

| Entity | Mô tả |
|---|---|
| `User` | Người dân, doanh nghiệp, cán bộ, quản trị |
| `Dossier` / `Registration` | Hồ sơ đăng ký đất đai lần đầu |
| `Transfer` | Hồ sơ đăng ký biến động/chuyển nhượng |
| `LandRecord` | Bản ghi thửa đất trong hệ thống nghiệp vụ |
| `FileObject` | Metadata file, CID, hash, loại tài liệu |
| `OcrResult` | Kết quả OCR và cảnh báo |
| `AuditLog` | Nhật ký thao tác |
| `BlockchainTx` | Mapping transaction hash với hồ sơ/land record |

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
1. Bên chuyển nhượng tạo hồ sơ biến động.
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

| Role | Quyền chính |
|---|---|
| `CITIZEN` | Tạo hồ sơ, upload file, submit, xem trạng thái, tra cứu |
| `BUSINESS` | Tương tự người dân; có thể tham gia hồ sơ chuyển nhượng |
| `INTAKE_STAFF` | Tiếp nhận hồ sơ, kiểm tra thành phần, yêu cầu bổ sung |
| `COMMUNE_STAFF` | Xác nhận cấp xã, ghi nhận ý kiến sơ bộ |
| `LAND_OFFICE_STAFF` | Thẩm định chuyên môn, phê duyệt/từ chối nghiệp vụ |
| `TAX_STAFF` | Xử lý nghĩa vụ tài chính ở mức mô phỏng |
| `ADMIN` | Quản trị dữ liệu demo, dashboard, phân quyền |
| `SYSTEM` | Tác vụ nền: IPFS, OCR, blockchain sync |

---

## 10. API design principles

- Tất cả response dùng envelope thống nhất.
- Tất cả API phải validate request body.
- Tất cả trạng thái phải dùng enum thống nhất.
- Các endpoint thay đổi trạng thái phải yêu cầu role phù hợp.
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

| Nhóm | Yêu cầu |
|---|---|
| Performance | API phản hồi thông thường dưới 5 giây trong demo |
| Security | JWT/role middleware, validate input, không log tài liệu nhạy cảm |
| Reliability | Có audit log, có trạng thái rõ ràng, không mất mapping CID/tx |
| Maintainability | Module tách rõ, docs cập nhật cùng API/ABI |
| Testability | Có unit test, contract test, E2E test cho luồng chính |
| Compliance | AI/blockchain không thay thế quyết định pháp lý |

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
