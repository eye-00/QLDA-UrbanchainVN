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
- `APPROVAL_AUTHORITY`
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
- `CHO_KY_CAP`
- `DA_KY_CAP`
- `DA_CAP`
- `DA_TRA_KET_QUA`
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
- `districtName`
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
- Unique key: `parcelCode + provinceCode + districtName + communeName`.
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

### Response data
```json
{
  "fileId": "fil_001",
  "documentType": "PROOF_OF_LAND_USE",
  "storageStatus": "UPLOADED_IPFS",
  "cid": "bafy...",
  "hash": "0xabc123"
}
```

## 7.2. GET /files/:fileId
Lấy metadata file.

## 7.3. GET /files/:fileId/download
Tải file từ gateway hoặc signed URL.

---

## 8. Registration APIs – Đăng ký đất đai lần đầu

## 8.1. POST /registrations
Tạo hồ sơ đăng ký lần đầu.

### Request
```json
{
  "applicantId": "usr_001",
  "landInfo": {
    "provinceCode": "48",
    "districtName": "Lien Chieu",
    "communeName": "Hoa Khanh",
    "parcelNumber": "123",
    "mapSheetNumber": "05",
    "area": 120.5,
    "landUsePurpose": "ODT",
    "address": "54 Nguyen Luong Bang"
  },
  "ownerInfo": {
    "fullName": "Nguyen Van A",
    "identityNumber": "0482xxxxxxxx",
    "address": "Da Nang"
  },
  "attachedFileIds": ["fil_001", "fil_002"]
}
```

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
  "reason": "Thieu giay to chung minh quyen su dung dat"
}
```

### Business rules
- Chỉ role phù hợp mới được đổi sang trạng thái tương ứng.
- Mọi thay đổi trạng thái phải lưu audit trail.
- `reason` là bắt buộc với các trạng thái từ chối hoặc yêu cầu bổ sung.

## 8.6. POST /registrations/:registrationId/commune-confirm
UBND cấp xã xác nhận xử lý.

### Request
```json
{
  "confirmed": true,
  "notes": "Da xac nhan thong tin thuoc tham quyen"
}
```

## 8.7. POST /registrations/:registrationId/tax-transfer
Chuyển thông tin sang cơ quan thuế.

### Request
```json
{
  "taxReferenceNo": "TAX-REQ-001",
  "notes": "Chuyen thong tin xac dinh nghia vu tai chinh"
}
```

## 8.8. POST /registrations/:registrationId/approve
Phê duyệt/ký cấp kết quả.

### Request
```json
{
  "approvalNumber": "QD-2026-001",
  "approvalDate": "2026-01-15"
}
```

## 8.9. POST /registrations/:registrationId/blockchain-sync
Ghi nhận bản ghi số sau khi hồ sơ đã hợp lệ.

### Request
```json
{
  "cid": "bafy...",
  "metadataHash": "0xabc123"
}
```

### Response data
```json
{
  "txHash": "0x123456",
  "tokenId": "1001"
}
```

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
- ít nhất 1 `attachedFileId`

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
| Ký/phê duyệt | APPROVAL_AUTHORITY |
| Dashboard / reports | ADMIN, LAND_REGISTRY_OFFICER |
| OCR result nội bộ | RECEPTION_OFFICER, COMMUNE_OFFICER, LAND_REGISTRY_OFFICER |
| User/Organization management | ADMIN |
| Audit APIs | ADMIN, LAND_REGISTRY_OFFICER |
| Land parcel management Sprint 2 | RECEPTION_OFFICER, COMMUNE_OFFICER, LAND_REGISTRY_OFFICER, APPROVAL_AUTHORITY, ADMIN |
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
