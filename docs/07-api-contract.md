# 07-api-contract.md

# UrbanChain-VN – API Contract (MVP)

## 1. Mục đích tài liệu

Tài liệu này mô tả **API contract chuẩn** cho MVP UrbanChain-VN. Mọi thay đổi backend, frontend, test, dashboard và OCR integration phải bám theo tài liệu này.

Nguyên tắc:
- mọi endpoint đều có request validation;
- mọi thay đổi trạng thái phải có audit trail;
- dữ liệu cá nhân nhạy cảm không được trả dư thừa;
- blockchain chỉ trả metadata/hash/transaction cần thiết;
- trạng thái hồ sơ phải dùng enum thống nhất.

## 1.1. Legal Source Reference

- Nguồn pháp lý chuẩn: [00-legal-basis-register.md](./00-legal-basis-register.md)
- Ma trận traceability: [docs-legal-aligned/16-legal-requirement-traceability.md](./docs-legal-aligned/16-legal-requirement-traceability.md)

Rule bắt buộc cho endpoint transition nhạy cảm:
- Có `procedureCode`.
- Có `legalBasisCode`.
- Có `actorRole`.
- Có `reason`.
- Có `evidence` hoặc `evidenceIds`.
- nếu có khác biệt giữa mô tả cũ và legal patch, ưu tiên baseline `docs/docs-legal-aligned`.

---

## 2. Quy ước kỹ thuật

## 2.1. Base path
```text
/api/v1
```

## 2.2. Content type
```http
Content-Type: application/json
```

Riêng upload file dùng `multipart/form-data`.

## 2.3. Response envelope chuẩn

### Success
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "meta": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "fullName",
      "code": "REQUIRED",
      "detail": "fullName is required"
    }
  ]
}
```

## 2.4. Authentication
- Sử dụng Bearer token.
- Header:
```http
Authorization: Bearer <token>
```

## 2.5. Role codes
- `CITIZEN`
- `BUSINESS`
- `RECEPTION_OFFICER`
- `COMMUNE_OFFICER`
- `LAND_REGISTRY_OFFICER`
- `TAX_OFFICER`
- `APPROVAL_AUTHORITY`
- `AUDITOR`
- `ADMIN`

---

## 3. Enum chuẩn

## 3.1. Registration status
- `MOI_TAO`
- `CHO_TIEP_NHAN`
- `CAN_BO_SUNG`
- `DA_TIEP_NHAN`
- `CHO_XAC_NHAN_CAP_XA`
- `DA_XAC_NHAN_CAP_XA`
- `DANG_THAM_DINH_VPDKDD`
- `CHO_THUE`
- `CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH`
- `DA_HOAN_THANH_NGHIA_VU_TAI_CHINH`
- `CHO_KY_CAP`
- `DA_KY_CAP`
- `DA_CAP_NHAT_HO_SO_DIA_CHINH`
- `DA_GHI_BLOCKCHAIN`
- `DA_CAP`
- `DA_TRA_KET_QUA`
- `HUY_HO_SO`
- `TU_CHOI`

## 3.2. Transfer status
- `MOI_TAO_BIEN_DONG`
- `CHO_TIEP_NHAN`
- `CAN_BO_SUNG`
- `DA_TIEP_NHAN`
- `DANG_KIEM_TRA_DIEU_KIEN`
- `DA_CHUYEN_THUE`
- `CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH`
- `DANG_CAP_NHAT_BIEN_DONG`
- `DA_DANG_KY_BIEN_DONG`
- `DA_TRA_KET_QUA`
- `TU_CHOI`

## 3.3. File source/storage status
- `LOCAL_TEMP`
- `UPLOADED_IPFS`
- `IPFS_FAILED`

---

## 4. Auth APIs

## 4.1. POST /auth/register
Tạo tài khoản người dùng.

### Request
```json
{
  "role": "CITIZEN",
  "fullName": "Nguyen Van A",
  "email": "a@example.com",
  "password": "StrongPassword@123",
  "phone": "0901234567",
  "identityNumber": "0482xxxxxxxx"
}
```

### Response data
```json
{
  "userId": "usr_001",
  "role": "CITIZEN",
  "status": "ACTIVE"
}
```
### Quy tắc bắt buộc
- Public register chỉ cho `CITIZEN` hoặc `BUSINESS`.
- Request cố gắng tạo role nội bộ (`ADMIN`, officer roles) phải trả `403`.

## 4.2. POST /auth/login
Đăng nhập hệ thống.

### Request
```json
{
  "email": "a@example.com",
  "password": "StrongPassword@123"
}
```

### Response data
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "user": {
    "userId": "usr_001",
    "fullName": "Nguyen Van A",
    "role": "CITIZEN"
  }
}
```

## 4.3. POST /auth/refresh
Làm mới phiên đăng nhập bằng refresh token.

### Request
```json
{
  "refreshToken": "refresh-token"
}
```

### Response data
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token-rotated",
  "user": {
    "userId": "usr_001",
    "fullName": "Nguyen Van A",
    "role": "CITIZEN"
  }
}
```

## 4.4. POST /auth/logout
Thu hồi session hiện tại (hoặc toàn bộ session của user nếu không truyền `refreshToken`).

### Request
```json
{
  "refreshToken": "refresh-token-rotated"
}
```

## 4.5. POST /auth/password/reset-request
Yêu cầu tạo reset token.

### Request
```json
{
  "email": "a@example.com"
}
```

## 4.6. POST /auth/password/reset-confirm
Xác nhận đổi mật khẩu bằng reset token.

### Request
```json
{
  "email": "a@example.com",
  "token": "reset-token",
  "newPassword": "NewStrongPassword@123"
}
```

## 4.7. POST /auth/change-password
Đổi mật khẩu khi user đã đăng nhập.

### Request
```json
{
  "currentPassword": "StrongPassword@123",
  "newPassword": "NewStrongPassword@123"
}
```

## 4.8. GET /auth/me
Lấy hồ sơ người dùng hiện tại.

## 4.9. Quy tắc đăng nhập tài khoản bị khoá
- User có `status = LOCKED` không được đăng nhập.
- API trả mã `400` với error envelope chuẩn.
- Hệ thống hỗ trợ auto-lock theo số lần đăng nhập sai vượt ngưỡng.

## 4.10. Wallet APIs (Sprint 1 Epic 13)

> Nhóm API chỉ cho `CITIZEN` và `BUSINESS`, dùng để liên kết và xác minh quyền sở hữu ví.

### POST /wallets/connect
Liên kết ví EVM với tài khoản hiện tại (chưa xác minh).

#### Request
```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "network": "SEPOLIA"
}
```

#### Quy tắc
- Validate địa chỉ EVM hợp lệ.
- Unique `(network,address)` toàn hệ thống.
- Không lưu private key/seed phrase.
- Trạng thái khởi tạo: `PENDING_VERIFICATION`.

### POST /wallets/:id/challenge
Tạo challenge ký xác minh (nonce one-time, có hạn dùng).

#### Response data
```json
{
  "walletId": "wal_001",
  "challengeId": "wch_001",
  "message": "UrbanChain-VN Wallet Verification\n...",
  "nonce": "f8a0...",
  "expiresAt": "2026-05-06T03:35:00.000Z"
}
```

### POST /wallets/:id/verify
Xác minh chữ ký theo EIP-191 bằng `ethers.verifyMessage`.

#### Request
```json
{
  "signature": "0x..."
}
```

#### Quy tắc
- Chỉ xác minh trên challenge chưa dùng và chưa hết hạn.
- Chữ ký sai hoặc challenge hết hạn trả lỗi `400`.
- Xác minh thành công cập nhật trạng thái ví `VERIFIED`.

### GET /wallets/me
Lấy danh sách ví thuộc user hiện tại.

### PATCH /wallets/:id/default
Đặt ví mặc định (chỉ cho ví `VERIFIED`).

#### Quy tắc
- Mỗi user chỉ có 1 ví mặc định trên mỗi network tại một thời điểm.
- Ví không thuộc user hiện tại trả `403`.

### Wallet status
- `PENDING_VERIFICATION`
- `VERIFIED`
- `INACTIVE`

### Wallet audit actions
- `WALLET_CONNECTED`
- `WALLET_CHALLENGE_CREATED`
- `WALLET_VERIFIED`
- `WALLET_DEFAULT_CHANGED`
- `WALLET_VERIFY_FAILED`

---

## 5. User & Organization APIs (Sprint 2)

> Nhóm API này chỉ dành cho vai trò `ADMIN`.

## 5.1. GET /users
Danh sách user có hỗ trợ tìm kiếm/lọc.

### Query params
- `keyword`
- `role`
- `organizationId`
- `status`
- `page`
- `pageSize`

## 5.2. POST /users
Tạo user bởi admin.

### Request
```json
{
  "fullName": "Can bo tiep nhan moi",
  "email": "new-officer@urbanchain.vn",
  "password": "StrongPassword@123",
  "role": "RECEPTION_OFFICER",
  "organizationId": "org_001"
}
```

## 5.3. PATCH /users/:id
Cập nhật thông tin user.

## 5.4. PATCH /users/:id/status
Khoá/mở khoá user.

### Request
```json
{
  "status": "LOCKED"
}
```

## 5.5. GET /organizations
Danh sách đơn vị xử lý.

### Query params
- `keyword`
- `includeInactive`

## 5.6. POST /organizations
Tạo đơn vị.

## 5.7. PATCH /organizations/:id
Cập nhật đơn vị.

## 5.8. DELETE /organizations/:id
Xoá mềm đơn vị (`isActive = false`).

---

## 6. Land Parcel APIs (Sprint 2)

> Vai trò truy cập: officer/admin (`RECEPTION_OFFICER`, `COMMUNE_OFFICER`, `LAND_REGISTRY_OFFICER`, `APPROVAL_AUTHORITY`, `ADMIN`).

## 6.1. GET /lands
Danh sách thửa đất với bộ lọc.

### Query params
- `keyword`
- `provinceCode`
- `communeName`
- `ownerUserId`
- `landUsePurpose`
- `page`
- `pageSize`

## 6.2. POST /lands
Tạo thửa đất.

## 6.3. PATCH /lands/:id
Cập nhật thửa đất.

## 6.4. GET /lands/:id
Lấy chi tiết thửa đất.

## 6.5. GET /lands/search
Endpoint tương thích luồng cũ, nhận query `q`.

## 6.6. Quy tắc chống trùng thửa (`US-031`)
- Unique key: `parcelCode + provinceCode + communeName`.
- Khi trùng, API trả `409 Conflict` với error envelope chuẩn.

## 6.7. Sprint 2 contract verification snapshot (2026-04-28)
- Base path giữ nguyên: `/api/v1`.
- Response envelope giữ chuẩn:
  - success: `{ success: true, message, data }`
  - error: `{ success: false, message, errors }`
- Endpoint nhóm Sprint 2 đã map với implementation:
  - `/users`, `/users/:id`, `/users/:id/status`
  - `/organizations`, `/organizations/:id`
  - `/lands`, `/lands/:id`, `/lands/search`
  - `/dashboard/summary`
- `409 Conflict` cho duplicate parcel được giữ ổn định theo `US-031`.

---

## 7. File APIs

## 7.1. POST /files/upload
Upload tài liệu hồ sơ.

### Request
`multipart/form-data`
- `file`
- `documentType`
- `ownerType`
- `ownerId`
- `registrationId` (optional)

### Response data
```json
{
  "id": "fil_001",
  "documentType": "PROOF_OF_LAND_USE",
  "storageStatus": "UPLOADED_IPFS",
  "cid": "bafy...",
  "hash": "0xabc123",
  "provider": "mock"
}
```

`provider` cho biết backend đang upload qua `mock`, `local` hoặc `pinata`.

### Khuyến nghị luồng FE
- Luồng chuẩn cho màn công dân: **upload trước** qua `/files/upload`, nhận `fileId`, sau đó gọi `POST /registrations` với `fileIds`.
- `documentType` do UI chọn từ catalog nghiệp vụ; backend hiện chưa ép enum cứng theo loại giấy tờ.

## 7.2. GET /files/:fileId
Lấy metadata file.

## 7.3. GET /files/:fileId/download
Tải file từ gateway hoặc signed URL.

## 7.4. GET /files/:fileId/integrity
Kiểm tra tính toàn vẹn metadata tệp (`cid`, `hash`, `storageStatus`).

### Response data
```json
{
  "fileId": "fil_001",
  "cid": "bafy...",
  "hash": "0xabc123",
  "storageStatus": "UPLOADED_IPFS",
  "checks": {
    "hasCid": true,
    "hasHash": true,
    "storageStatusValid": true
  },
  "isValid": true
}
```

---

## 8. Registration APIs – Đăng ký đất đai lần đầu

## 8.1. POST /registrations
Tạo hồ sơ đăng ký lần đầu.

### Request
```json
{
  "procedureCode": "DKDD_LANDAU_3380",
  "legalBasisCode": "QĐ3380-INIT-01",
  "landInfo": {
    "provinceCode": "48",
    "communeName": "Hoa Khanh",
    "parcelNumber": "123",
    "mapSheetNumber": "05",
    "area": 120.5,
    "landUsePurpose": "ODT",
    "address": "54 Nguyen Luong Bang"
  },
  "ownerInfo": {
    "ownerType": "INDIVIDUAL",
    "fullName": "Nguyen Van A",
    "identityNumber": "0482xxxxxxxx",
    "address": "Da Nang"
  },
  "attachedFileIds": ["fil_001", "fil_002"]
}
```

> Compatibility note: backend hien cho phep ca `attachedFileIds` va `fileIds` de tuong thich nguoc UI.

### Business rules (attach file)
- Với `CITIZEN`/`BUSINESS`, chỉ được đính kèm file thuộc quyền sở hữu của chính user hoặc file đã gắn registration của chính user.
- Nếu `fileIds` chứa file không tồn tại -> trả `400`.
- Nếu `fileIds` chứa file không thuộc quyền -> trả `403`.

### Response data
```json
{
  "registrationId": "reg_001",
  "registrationCode": "REG-2026-0001",
  "status": "MOI_TAO"
}
```

## 8.2. POST /registrations/:registrationId/submit
Nộp hồ sơ vào luồng xử lý.

### Request
```json
{
  "legalBasisCode": "QĐ3380-SUBMIT-01",
  "note": "Người dân nộp hồ sơ"
}
```

### Response data
```json
{
  "registrationId": "reg_001",
  "status": "CHO_TIEP_NHAN"
}
```

## 8.3. GET /registrations/:registrationId
Lấy chi tiết hồ sơ đăng ký.

### Response data tối thiểu
```json
{
  "registrationId": "reg_001",
  "registrationCode": "REG-2026-0001",
  "status": "DANG_THAM_DINH_VPDKDD",
  "landInfo": {},
  "ownerInfo": {},
  "files": [],
  "ocrWarnings": [],
  "history": []
}
```

## 8.4. GET /registrations
Danh sách hồ sơ, hỗ trợ filter theo vai trò.

### Query params gợi ý
- `status`
- `keyword`
- `page`
- `pageSize`
- `assignedRole`

## 8.5. PATCH /registrations/:registrationId/status
Đổi trạng thái hồ sơ theo workflow.

### Request
```json
{
  "status": "CAN_BO_SUNG",
  "legalBasisCode": "QĐ3380-STATUS-01",
  "reason": "Thieu giay to chung minh quyen su dung dat"
}
```

### Business rules
- Chỉ role phù hợp mới được đổi sang trạng thái tương ứng.
- Mọi thay đổi trạng thái phải lưu audit trail.
- `reason` là bắt buộc với các trạng thái từ chối hoặc yêu cầu bổ sung.
- Khi chuyển trạng thái sai workflow (`currentStatus` -> `nextStatus` không hợp lệ), API trả `409` với error envelope chuẩn.

## 8.6. POST /registrations/:registrationId/commune-confirm
UBND cấp xã xác nhận xử lý.

### Request
```json
{
  "confirmed": true,
  "legalBasisCode": "QĐ3380-COMMUNE-01",
  "notes": "Da xac nhan thong tin thuoc tham quyen",
  "evidenceFileId": "fil_001"
}
```

### Validation rules
- `notes` bat buoc, toi thieu 3 ky tu.
- `evidenceFileId` bat buoc va phai thuoc cung ho so dang ky.

## 8.7. POST /registrations/:registrationId/tax-transfer
Chuyển thông tin sang cơ quan thuế.

### Request
```json
{
  "legalBasisCode": "QĐ3380-TAX-01",
  "taxReferenceNo": "TAX-REQ-001",
  "amount": 350000,
  "notes": "Chuyen thong tin xac dinh nghia vu tai chinh"
}
```

## 8.8. POST /registrations/:registrationId/approve
Phê duyệt/ký cấp kết quả.

### Request
```json
{
  "legalBasisCode": "QĐ3380-APPROVE-01",
  "approvalNumber": "QD-2026-001",
  "approvalDate": "2026-01-15",
  "note": "Ho so du dieu kien phe duyet",
  "landCode": "LAND-2026-0001"
}
```

### Sprint 4 behavior
- Khi `BLOCKCHAIN_SYNC_MODE=rpc`: backend gọi smart contract `UrbanLandRegistry.registerLand`, lưu `txHash`, `tokenId`, `landCode`.
- Khi `BLOCKCHAIN_SYNC_MODE=mock`: backend vẫn trả `txHash`/`tokenId` mock để giữ luồng demo.

## 8.9. POST /registrations/:registrationId/blockchain-sync
Ghi nhận bản ghi số sau khi hồ sơ đã hợp lệ.

### Request
```json
{
  "legalBasisCode": "QĐ3380-BLOCKCHAIN-01",
  "syncMode": "OFFICER_SERVICE_WALLET",
  "cid": "bafy...",
  "metadataHash": "0xabc123",
  "walletAuthorizationId": "swa_001",
  "signerWalletAddress": "0xabc...def",
  "signerChainId": 11155111,
  "signingMessage": "UrbanChain-VN Blockchain Sync Confirmation\\n...",
  "signature": "0x..."
}
```

### Response data
```json
{
  "registrationId": "reg_001",
  "tokenId": 1001,
  "txHash": "0x123456",
  "tokenId": 1001,
  "metadataHash": "0xabc123",
  "blockchainMode": "mock"
}
```

### Business rules
- Chỉ cho phép đồng bộ blockchain khi hồ sơ đã cập nhật địa chính off-chain (`DA_CAP_NHAT_HO_SO_DIA_CHINH`).
- Nếu gọi sai trạng thái hiện tại, API trả `409` với error envelope chuẩn.
- Không cho phép bypass bằng `PATCH /registrations/:id/status -> DA_GHI_BLOCKCHAIN`; phải đi qua endpoint này để ghi nhận tx lifecycle/audit.
- `syncMode=OFFICER_SERVICE_WALLET`:
  - Bắt buộc `walletAuthorizationId`.
  - Ví ký phải khớp quyền ví công vụ đang `ACTIVE`, còn hiệu lực, đúng `network/chainId/roleScope`.
- `syncMode=CITIZEN_DIRECT_SIGN`:
  - Chỉ cho `CITIZEN|BUSINESS`.
  - Hồ sơ phải thuộc `applicantId` của người gọi.
  - Ví ký phải trùng ví mặc định đã `VERIFIED` trên đúng network.

### RBAC
- `LAND_REGISTRY_OFFICER`, `APPROVAL_AUTHORITY`, `CITIZEN`, `BUSINESS` (theo `syncMode`).
- `ADMIN` chỉ quản trị ví công vụ, không thực thi thao tác blockchain-sync.

### Error code contract (để FE map ổn định)
- `STATUS_NOT_READY`
- `walletAuthMissing`
- `OWNERSHIP_DENIED`
- `WRONG_NETWORK`
- `WALLET_MISMATCH`

## 8.9.1. GET /registrations/:registrationId/blockchain-sync/candidates
Trả danh sách ví công vụ khả dụng cho actor hiện tại (dùng cho officer signing mode).

### RBAC
- `LAND_REGISTRY_OFFICER`, `APPROVAL_AUTHORITY`, `ADMIN`.

### Response data
```json
{
  "items": [
    {
      "authorizationId": "swa_001",
      "walletAddress": "0xabc...def",
      "network": "SEPOLIA",
      "chainId": 11155111,
      "roleScope": "APPROVAL_AUTHORITY",
      "effectiveTo": "2026-12-31T16:59:59.000Z",
      "status": "ACTIVE"
    }
  ],
  "total": 1
}
```

## 8.10. GET /registrations/:registrationId/notifications
Lấy lịch sử thông báo kết quả xử lý hồ sơ theo RBAC/ownership.

### Response data
```json
{
  "items": [
    {
      "id": "log_001",
      "status": "CAN_BO_SUNG",
      "note": "Thiếu bản scan giấy tờ nguồn gốc đất",
      "message": "Hồ sơ đã được cập nhật sang trạng thái CAN_BO_SUNG: Thiếu bản scan giấy tờ nguồn gốc đất",
      "createdAt": "2026-04-28T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

### Notification rule
- Mỗi thay đổi trạng thái hồ sơ phải ghi audit event `REGISTRATION_STATUS_UPDATED`.
- Đồng thời phát sinh nhật ký thông báo `REGISTRATION_NOTIFICATION_SENT` để người dùng tra cứu lịch sử cập nhật.

## 8.11. GET /registrations/:registrationId/document-versions
Lấy danh sách phiên bản tài liệu của hồ sơ.

## 8.12. POST /registrations/:registrationId/document-versions
Tạo phiên bản tài liệu mới.

### Request
```json
{
  "documentType": "LAND_CERT_SUPPORT",
  "storageStatus": "UPLOADED_IPFS",
  "cid": "bafy...",
  "hash": "0xabc123",
  "note": "Bổ sung bản scan mới"
}
```

## 8.13. GET /registrations/:registrationId/snapshots
Lấy snapshot version tài liệu đã khóa tại thời điểm submit.

## 8.14. GET /registrations/:registrationId/document-history
Lấy timeline lịch sử hồ sơ từ document versions + submit snapshots + audit status.

### Response data
```json
{
  "items": [
    {
      "id": "evt_001",
      "type": "DOCUMENT_VERSION",
      "at": "2026-05-10T08:00:00.000Z",
      "title": "Phiên bản tài liệu #2",
      "detail": {
        "status": "ACTIVE",
        "documentType": "LAND_CERT_SUPPORT"
      }
    }
  ],
  "total": 1
}
```

## 8.15. POST /registrations/:registrationId/request-supplement
Yeu cau bo sung ho so kem checklist va han bo sung.

### Request
```json
{
  "legalBasisCode": "QĐ3380-SUP-01",
  "note": "Can bo sung bo chung tu nghia vu tai chinh",
  "missingItems": [
    "Thieu ban scan giay to nguon goc dat",
    "Thieu minh chung nghia vu tai chinh"
  ],
  "deadlineAt": "2026-05-20T09:00:00.000Z"
}
```

### Validation rules
- `missingItems` bat buoc, toi thieu 1 muc.
- `deadlineAt` bat buoc va phai la thoi diem tuong lai.

## 8.16. GET /registrations/:registrationId/payment-obligations
Lấy danh sách nghĩa vụ tài chính của hồ sơ.

## 8.17. POST /registrations/:registrationId/payment-obligations
Tạo nghĩa vụ tài chính theo thủ tục pháp lý.

## 8.18. PATCH /registrations/:registrationId/payment-obligations/:obligationId/status
Xác nhận/cập nhật trạng thái nghĩa vụ tài chính (`PENDING|CONFIRMED|CANCELLED`).

## 8.19. POST /registrations/:registrationId/cadastral-update
Ghi nhận đã cập nhật hồ sơ địa chính off-chain trước bước blockchain-sync.

### Legal guard bắt buộc
- Mọi bước submit/chuyển trạng thái xử lý phải truyền `legalBasisCode`.
- `blockchain-sync` chỉ được phép sau khi hồ sơ đạt điều kiện off-chain (`DA_CAP_NHAT_HO_SO_DIA_CHINH`).

## 8.20. GET /registrations/:registrationId/blockchain-status
Đối soát trạng thái on-chain/off-chain cho hồ sơ đăng ký.

### Response data
```json
{
  "registrationId": "reg_001",
  "registrationCode": "REG-2026-0001",
  "landCode": "LAND-2026-0001",
  "offChain": {
    "status": "DA_GHI_BLOCKCHAIN",
    "tokenId": 1001,
    "txHash": "0x123456"
  },
  "onChain": {
    "mode": "rpc",
    "contractAddress": "0xabc...",
    "registrationTokenId": 1001,
    "landTokenId": 1001
  },
  "inSync": true
}
```

### RBAC
- `LAND_REGISTRY_OFFICER`, `APPROVAL_AUTHORITY`, `ADMIN`, `AUDITOR`.

## 8.21. GET /registrations/:registrationId/tx-lifecycle
Lấy vòng đời giao dịch blockchain của hồ sơ (`PENDING|CONFIRMED|FAILED|REJECTED`).

### Response data
```json
{
  "items": [
    {
      "id": "txl_001",
      "action": "BLOCKCHAIN_SYNC",
      "network": "SEPOLIA",
      "chainId": 11155111,
      "walletAddress": "0xabc...def",
      "txHash": "0x123456",
      "explorerUrl": "https://sepolia.etherscan.io/tx/0x123456",
      "status": "CONFIRMED",
      "errorCode": null,
      "errorMessage": null,
      "createdAt": "2026-05-12T04:00:00.000Z",
      "updatedAt": "2026-05-12T04:00:15.000Z"
    }
  ],
  "total": 1
}
```

### RBAC
- `LAND_REGISTRY_OFFICER`, `APPROVAL_AUTHORITY`, `ADMIN`, `AUDITOR`.

## 8.22. Service Wallet Governance APIs (Sprint 4)
> Nhóm API quản trị ví công vụ, chỉ cho `ADMIN`.

### GET /service-wallets
Lấy danh sách quyền ví công vụ, hỗ trợ filter theo `status/network/roleScope/organizationId/chainId`.

### POST /service-wallets
Cấp quyền ví công vụ từ ví đã `VERIFIED`.

#### Request
```json
{
  "walletId": "wal_001",
  "roleScope": "APPROVAL_AUTHORITY",
  "chainId": 11155111,
  "effectiveTo": "2026-12-31T16:59:59.000Z",
  "reason": "Phân công ký giao dịch hồ sơ đăng ký"
}
```

#### Rule bắt buộc
- `roleScope` chỉ cho phép: `LAND_REGISTRY_OFFICER`, `APPROVAL_AUTHORITY`.
- Không cho phép cấp quyền ví công vụ với `roleScope=ADMIN`.

### PATCH /service-wallets/:id/status
Cập nhật trạng thái quyền ví công vụ: `ACTIVE|REVOKED|EXPIRED`.

### GET /service-wallets/:id/audit
Lấy audit trail của quyền ví công vụ.

---

## 9. Transfer APIs – Đăng ký biến động / chuyển nhượng

## 9.1. POST /transfers
Tạo hồ sơ biến động do chuyển nhượng.

### Request
```json
{
  "landId": "land_001",
  "transferorId": "usr_001",
  "transfereeInfo": {
    "fullName": "Tran Thi B",
    "identityNumber": "0482yyyyyyyy",
    "address": "Da Nang"
  },
  "contractFileId": "fil_010",
  "attachedFileIds": ["fil_011"]
}
```

### Response data
```json
{
  "transferId": "trf_001",
  "transferCode": "TRF-2026-0001",
  "status": "MOI_TAO_BIEN_DONG"
}
```

## 9.2. POST /transfers/:transferId/submit
Nộp hồ sơ biến động.

## 9.3. GET /transfers/:transferId
Chi tiết hồ sơ chuyển nhượng.

## 9.4. GET /transfers
Danh sách hồ sơ biến động.

## 9.5. PATCH /transfers/:transferId/status
Đổi trạng thái hồ sơ biến động.

### Request
```json
{
  "status": "DA_CHUYEN_THUE",
  "reason": null
}
```

## 9.6. POST /transfers/:transferId/tax-transfer
Chuyển thông tin nghĩa vụ tài chính.

## 9.7. POST /transfers/:transferId/complete
Hoàn tất cập nhật biến động.

### Request
```json
{
  "landRegistryUpdateRef": "UPD-2026-001",
  "completedDate": "2026-01-20"
}
```

## 9.8. POST /transfers/:transferId/blockchain-sync
Ghi lịch sử giao dịch số hỗ trợ.

### Response data
```json
{
  "txHash": "0x999aaa",
  "previousOwner": "usr_001",
  "newOwner": "usr_002"
}
```

---

## 10. Land / Search APIs

## 10.1. GET /lands/:landId
Chi tiết thửa đất.

### Response data
```json
{
  "landId": "land_001",
  "parcelNumber": "123",
  "mapSheetNumber": "05",
  "area": 120.5,
  "address": "54 Nguyen Luong Bang",
  "currentOwner": {},
  "status": "ACTIVE"
}
```

## 10.2. GET /lands/:landId/history
Lịch sử đăng ký và biến động.

## 10.3. GET /search/lands
Tra cứu theo từ khóa.

### Query params
- `keyword`
- `parcelNumber`
- `mapSheetNumber`
- `ownerName`
- `page`
- `pageSize`

## 10.4. GET /search/registrations
Tra cứu hồ sơ.

---

## 11. OCR / AI Support APIs

## 11.1. POST /ocr/jobs
Tạo job OCR.

### Request
```json
{
  "fileId": "fil_001",
  "registrationId": "reg_001"
}
```

### Response data
```json
{
  "ocrJobId": "ocr_001",
  "status": "QUEUED"
}
```

## 11.2. GET /ocr/jobs/:ocrJobId
Xem trạng thái OCR.

## 11.3. GET /registrations/:registrationId/ocr-result
Lấy kết quả OCR và cảnh báo.

### Response data
```json
{
  "fields": {
    "fullName": "Nguyen Van A",
    "parcelNumber": "123"
  },
  "warnings": [
    {
      "code": "MISSING_DOCUMENT",
      "detail": "Thieu tai lieu chung minh quyen su dung dat"
    }
  ]
}
```

---

## 12. Dashboard / Report APIs

## 12.1. GET /dashboard/summary
Tổng quan hồ sơ.

### Response data
```json
{
  "totalRegistrations": 120,
  "pendingRegistrations": 35,
  "approvedRegistrations": 60,
  "rejectedRegistrations": 10,
  "totalTransfers": 50,
  "pendingTransfers": 12
}
```

### Ghi chú Sprint 2 (`US-098`)
- `/dashboard/summary` trả payload khác nhau theo `role` của user đăng nhập.
- Trường `data.role` luôn có mặt để frontend render theo quyền.

## 12.2. GET /dashboard/transactions
Giám sát giao dịch blockchain.

## 12.3. GET /reports/summary
Báo cáo tổng hợp.

### Query params
- `fromDate`
- `toDate`
- `reportType`

---

## 13. Audit Trail APIs

## 13.1. GET /audit/access-logs
Nhật ký truy cập/xác thực (`AUTH_*`).

### Query params
- `page`
- `pageSize`
- `actorId`
- `action`
- `from`
- `to`

## 13.2. GET /audit/user-actions
Nhật ký thao tác người dùng/cán bộ (`USER_*`, `REGISTRATION_*`, `TRANSFER_*`, `FILE_*`, `AUTH_PASSWORD_*`).

### Query params
- `page`
- `pageSize`
- `actorId`
- `entityType`
- `entityId`
- `action`
- `from`
- `to`

## 13.3. GET /audit/rbac-changes
Nhật ký thay đổi phân quyền (`RBAC_*`).

### Audit record mẫu
```json
{
  "auditId": "aud_001",
  "entityType": "REGISTRATION",
  "entityId": "reg_001",
  "action": "STATUS_CHANGED",
  "fromStatus": "DA_TIEP_NHAN",
  "toStatus": "CAN_BO_SUNG",
  "performedBy": "usr_staff_01",
  "performedAt": "2026-01-10T10:00:00Z",
  "reason": "Thieu tai lieu"
}
```

## 13.4. Sprint 1 closure evidence (Auth/Test/Audit)
- Auth lifecycle và RBAC behavior: [backend/test/auth-rbac.test.ts](../backend/test/auth-rbac.test.ts), [backend/src/modules/auth/auth.routes.ts](../backend/src/modules/auth/auth.routes.ts).
- Audit API RBAC scope: [backend/src/modules/audit/audit.routes.ts](../backend/src/modules/audit/audit.routes.ts).
- CI check names dùng cho required checks: [.github/workflows/ci.yml](../.github/workflows/ci.yml).
- Branch protection / required checks / secret scanning là trạng thái GitHub remote, không thể kết luận chỉ từ local repo.

---

## 14. Validation rules tối thiểu

## 14.1. Auth
- email hợp lệ
- password đủ độ mạnh
- identityNumber theo regex cấu hình

## 14.2. Registration
- `parcelNumber` bắt buộc
- `mapSheetNumber` bắt buộc
- `area > 0`
- `procedureCode` bắt buộc khi tạo hồ sơ
- `legalBasisCode` bắt buộc cho submit và các bước chuyển trạng thái xử lý

## 14.3. Transfer
- phải có `landId`
- phải có `contractFileId`
- phải có thông tin bên nhận tối thiểu: `fullName`, `identityNumber`

## 14.4. Status transitions
Các chuyển trạng thái không hợp lệ phải trả `409 Conflict`.

Ví dụ:
- không được từ `MOI_TAO` sang `DA_CAP`
- không được từ `MOI_TAO_BIEN_DONG` sang `DA_DANG_KY_BIEN_DONG` nếu chưa qua kiểm tra điều kiện

---

## 15. Quy tắc phân quyền endpoint

| Endpoint nhóm | Role tối thiểu |
|---|---|
| Auth self-service | CITIZEN, BUSINESS |
| Auth refresh/logout/password reset | Tất cả role đã xác thực hoặc self-service |
| Tạo/nộp hồ sơ đăng ký | CITIZEN, BUSINESS |
| Tiếp nhận hồ sơ | RECEPTION_OFFICER |
| Xác nhận cấp xã | COMMUNE_OFFICER |
| Thẩm định chuyên môn | LAND_REGISTRY_OFFICER |
| Chuyển/ghi nhận nghĩa vụ tài chính | LAND_REGISTRY_OFFICER, TAX_OFFICER |
| Ký/phê duyệt | APPROVAL_AUTHORITY |
| Dashboard / reports | ADMIN, LAND_REGISTRY_OFFICER |
| OCR result nội bộ | RECEPTION_OFFICER, COMMUNE_OFFICER, LAND_REGISTRY_OFFICER |
| User/Organization management | ADMIN |
| Audit APIs | ADMIN, LAND_REGISTRY_OFFICER, AUDITOR |
| Land parcel management Sprint 2 | RECEPTION_OFFICER, COMMUNE_OFFICER, LAND_REGISTRY_OFFICER, APPROVAL_AUTHORITY, TAX_OFFICER, ADMIN |
| Dashboard summary | Tất cả role đã xác thực (payload theo role) |

---

## 16. Quy ước lỗi chuẩn (`US-111`)
- Validation lỗi: `400`.
- Không có quyền: `403`.
- Không tìm thấy tài nguyên: `404`.
- Trùng dữ liệu ràng buộc unique: `409`.
- Mọi lỗi phải tuân envelope:
```json
{
  "success": false,
  "message": "Conflict error",
  "errors": []
}
```

---

## 17. Những gì không được thay đổi tự ý

- Không đổi tên enum trạng thái nếu chưa cập nhật toàn bộ backend, frontend, tests và docs.
- Không thay đổi request/response shape nếu chưa cập nhật file này.
- Không thêm dữ liệu nhạy cảm vào response ngoài nhu cầu tối thiểu.
- Không ghi dữ liệu cá nhân nhạy cảm trực tiếp lên blockchain.

---

## 18. Mapping API sang module code

| Module | Trách nhiệm |
|---|---|
| `auth` | Đăng ký, đăng nhập, profile, role |
| `files` | Upload, metadata, IPFS sync |
| `registrations` | Hồ sơ đăng ký lần đầu |
| `transfers` | Hồ sơ biến động / chuyển nhượng |
| `lands` | Tra cứu thửa đất |
| `ocr` | OCR jobs, extraction, warnings |
| `dashboard` | Dashboard, reports |
| `audit` | Lịch sử thay đổi |

---

# PHỤ LỤC — Legal-aligned API Patch 2025

## 1. Role codes bổ sung/chuẩn hóa

```text
CITIZEN
BUSINESS
RECEPTION_OFFICER
COMMUNE_OFFICER
LAND_REGISTRY_OFFICER
TAX_OFFICER
APPROVAL_AUTHORITY
ADMIN
AUDITOR
```

## 2. Enum RegistrationStatus chuẩn từ Sprint 2+

```text
MOI_TAO
CHO_TIEP_NHAN
CAN_BO_SUNG
DA_TIEP_NHAN
CHO_XAC_NHAN_CAP_XA
DA_XAC_NHAN_CAP_XA
DANG_THAM_DINH_VPDKDD
CHO_THUE
CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH
DA_HOAN_THANH_NGHIA_VU_TAI_CHINH
CHO_KY_CAP
DA_KY_CAP
DA_CAP
DA_CAP_NHAT_HO_SO_DIA_CHINH
DA_GHI_BLOCKCHAIN
DA_TRA_KET_QUA
TU_CHOI
HUY_HO_SO
```

## 3. Legal procedure metadata endpoints

```http
GET /api/v1/legal/procedures
GET /api/v1/legal/procedures/:procedureCode
GET /api/v1/legal/authority-matrix
```

### `LegalProcedure` DTO

```json
{
  "procedureCode": "1.013978",
  "procedureName": "Đăng ký đất đai, tài sản gắn liền với đất, cấp Giấy chứng nhận lần đầu...",
  "sourceDecision": "3380/QĐ-BNNMT/2025",
  "fallbackSourceDecision": "2304/QĐ-BNNMT/2025",
  "legalBasis": ["151/2025/NĐ-CP", "118/2025/NĐ-CP", "101/2024/NĐ-CP"],
  "level": "CAP_XA|CAP_TINH|TRUNG_UONG",
  "authorityActors": ["RECEPTION_OFFICER", "COMMUNE_OFFICER", "LAND_REGISTRY_OFFICER", "TAX_OFFICER", "APPROVAL_AUTHORITY"],
  "requiresTaxStep": true,
  "requiresCommuneConfirmation": true,
  "isMockedForMvp": true
}
```

## 4. Document version endpoints

```http
GET  /api/v1/documents/:documentId/versions
POST /api/v1/documents/:documentId/versions
POST /api/v1/document-versions/:versionId/lock
POST /api/v1/document-versions/:versionId/supersede
POST /api/v1/document-versions/:versionId/sign/mock
POST /api/v1/document-versions/:versionId/sign/wallet
POST /api/v1/document-versions/:versionId/verify
POST /api/v1/document-versions/:versionId/record-on-chain
```

Rule: không trả PII dư thừa; signature payload chỉ chứa hash/id/timestamp/role, không chứa toàn văn giấy tờ.

## 5. Payment obligation endpoints

```http
POST /api/v1/payment-obligations
GET  /api/v1/payment-obligations/:id
POST /api/v1/payment-obligations/:id/generate-qr-test
POST /api/v1/payment-obligations/:id/mock-confirm
POST /api/v1/payment-obligations/:id/verify-receipt
POST /api/v1/payment-obligations/:id/record-on-chain
```

### `PaymentObligationType`

```text
INTAKE_FEE
LAND_FINANCIAL_OBLIGATION
REGISTRATION_FEE
LATE_FEE
OTHER_LEGAL_FEE
```

Rule: MoMo Test/QR test là mô phỏng. Không mô tả `paidByBlockchain=true` cho thuế/phí thật.

## 6. Map parcel endpoints

```http
GET  /api/v1/map/parcels
GET  /api/v1/map/parcels/:landRecordId
POST /api/v1/map/parcels/:landRecordId/geometry
POST /api/v1/map/parcels/:landRecordId/review
POST /api/v1/map/parcels/:landRecordId/approve-offchain
POST /api/v1/map/parcels/:landRecordId/record-boundary-hash
GET  /api/v1/map/layers
```

### Geometry source enum

```text
DEMO
IMPORTED
OFFICIAL_REFERENCE
UNKNOWN_NEEDS_REVIEW
```

## 7. Workflow transition endpoint rule

```http
POST /api/v1/registrations/:id/transition
```

Request phải có:

```json
{
  "fromStatus": "DA_TIEP_NHAN",
  "toStatus": "CHO_XAC_NHAN_CAP_XA",
  "actorRole": "RECEPTION_OFFICER",
  "reason": "Hồ sơ đủ thành phần",
  "legalBasisCode": "151/2025-ND-CP|3380/QD-BNNMT",
  "evidenceIds": ["docver_..."],
  "requiresPmDecision": false
}
```

Backend phải reject nếu actor/status transition không khớp legal workflow.
