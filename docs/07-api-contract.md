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

## 4.3. GET /auth/me
Lấy hồ sơ người dùng hiện tại.

---

## 5. File APIs

## 5.1. POST /files/upload
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

## 5.2. GET /files/:fileId
Lấy metadata file.

## 5.3. GET /files/:fileId/download
Tải file từ gateway hoặc signed URL.

---

## 6. Registration APIs – Đăng ký đất đai lần đầu

## 6.1. POST /registrations
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

## 6.2. POST /registrations/:registrationId/submit
Nộp hồ sơ vào luồng xử lý.

### Response data
```json
{
  "registrationId": "reg_001",
  "status": "CHO_TIEP_NHAN"
}
```

## 6.3. GET /registrations/:registrationId
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

## 6.4. GET /registrations
Danh sách hồ sơ, hỗ trợ filter theo vai trò.

### Query params gợi ý
- `status`
- `keyword`
- `page`
- `pageSize`
- `assignedRole`

## 6.5. PATCH /registrations/:registrationId/status
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

## 6.6. POST /registrations/:registrationId/commune-confirm
UBND cấp xã xác nhận xử lý.

### Request
```json
{
  "confirmed": true,
  "notes": "Da xac nhan thong tin thuoc tham quyen"
}
```

## 6.7. POST /registrations/:registrationId/tax-transfer
Chuyển thông tin sang cơ quan thuế.

### Request
```json
{
  "taxReferenceNo": "TAX-REQ-001",
  "notes": "Chuyen thong tin xac dinh nghia vu tai chinh"
}
```

## 6.8. POST /registrations/:registrationId/approve
Phê duyệt/ký cấp kết quả.

### Request
```json
{
  "approvalNumber": "QD-2026-001",
  "approvalDate": "2026-01-15"
}
```

## 6.9. POST /registrations/:registrationId/blockchain-sync
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

## 7. Transfer APIs – Đăng ký biến động / chuyển nhượng

## 7.1. POST /transfers
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

## 7.2. POST /transfers/:transferId/submit
Nộp hồ sơ biến động.

## 7.3. GET /transfers/:transferId
Chi tiết hồ sơ chuyển nhượng.

## 7.4. GET /transfers
Danh sách hồ sơ biến động.

## 7.5. PATCH /transfers/:transferId/status
Đổi trạng thái hồ sơ biến động.

### Request
```json
{
  "status": "DA_CHUYEN_THUE",
  "reason": null
}
```

## 7.6. POST /transfers/:transferId/tax-transfer
Chuyển thông tin nghĩa vụ tài chính.

## 7.7. POST /transfers/:transferId/complete
Hoàn tất cập nhật biến động.

### Request
```json
{
  "landRegistryUpdateRef": "UPD-2026-001",
  "completedDate": "2026-01-20"
}
```

## 7.8. POST /transfers/:transferId/blockchain-sync
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

## 8. Land / Search APIs

## 8.1. GET /lands/:landId
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

## 8.2. GET /lands/:landId/history
Lịch sử đăng ký và biến động.

## 8.3. GET /search/lands
Tra cứu theo từ khóa.

### Query params
- `keyword`
- `parcelNumber`
- `mapSheetNumber`
- `ownerName`
- `page`
- `pageSize`

## 8.4. GET /search/registrations
Tra cứu hồ sơ.

---

## 9. OCR / AI Support APIs

## 9.1. POST /ocr/jobs
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

## 9.2. GET /ocr/jobs/:ocrJobId
Xem trạng thái OCR.

## 9.3. GET /registrations/:registrationId/ocr-result
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

## 10. Dashboard / Report APIs

## 10.1. GET /dashboard/summary
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

## 10.2. GET /dashboard/transactions
Giám sát giao dịch blockchain.

## 10.3. GET /reports/summary
Báo cáo tổng hợp.

### Query params
- `fromDate`
- `toDate`
- `reportType`

---

## 11. Audit Trail APIs

## 11.1. GET /audit/registrations/:registrationId
Lịch sử thay đổi hồ sơ đăng ký.

## 11.2. GET /audit/transfers/:transferId
Lịch sử thay đổi hồ sơ biến động.

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

---

## 12. Validation rules tối thiểu

## 12.1. Auth
- email hợp lệ
- password đủ độ mạnh
- identityNumber theo regex cấu hình

## 12.2. Registration
- `parcelNumber` bắt buộc
- `mapSheetNumber` bắt buộc
- `area > 0`
- ít nhất 1 `attachedFileId`

## 12.3. Transfer
- phải có `landId`
- phải có `contractFileId`
- phải có thông tin bên nhận tối thiểu: `fullName`, `identityNumber`

## 12.4. Status transitions
Các chuyển trạng thái không hợp lệ phải trả `409 Conflict`.

Ví dụ:
- không được từ `MOI_TAO` sang `DA_CAP`
- không được từ `MOI_TAO_BIEN_DONG` sang `DA_DANG_KY_BIEN_DONG` nếu chưa qua kiểm tra điều kiện

---

## 13. Quy tắc phân quyền endpoint

| Endpoint nhóm | Role tối thiểu |
|---|---|
| Auth self-service | CITIZEN, BUSINESS |
| Tạo/nộp hồ sơ đăng ký | CITIZEN, BUSINESS |
| Tiếp nhận hồ sơ | RECEPTION_OFFICER |
| Xác nhận cấp xã | COMMUNE_OFFICER |
| Thẩm định chuyên môn | LAND_REGISTRY_OFFICER |
| Ký/phê duyệt | APPROVAL_AUTHORITY |
| Dashboard / reports | ADMIN, LAND_REGISTRY_OFFICER |
| OCR result nội bộ | RECEPTION_OFFICER, COMMUNE_OFFICER, LAND_REGISTRY_OFFICER |

---

## 14. Những gì không được thay đổi tự ý

- Không đổi tên enum trạng thái nếu chưa cập nhật toàn bộ backend, frontend, tests và docs.
- Không thay đổi request/response shape nếu chưa cập nhật file này.
- Không thêm dữ liệu nhạy cảm vào response ngoài nhu cầu tối thiểu.
- Không ghi dữ liệu cá nhân nhạy cảm trực tiếp lên blockchain.

---

## 15. Mapping API sang module code

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

