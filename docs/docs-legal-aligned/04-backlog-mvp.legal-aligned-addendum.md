# 04-backlog-mvp — Legal Alignment Addendum after Sprint 1 Wallet

> Không thay thế toàn bộ backlog 690 US hiện có. File này là addendum cần merge vào `04-backlog-mvp.md` sau khi review. Mục tiêu: chỉnh Sprint 2+ bám sát quy định pháp luật trong các file docx đã upload.

## 1. Trạng thái hiện tại

- Sprint 1 bản wallet đã xong theo thông tin người dùng.
- Không sửa lại Sprint 1 trừ khi có regression/security issue.
- Từ Sprint 2 trở đi phải thêm gate pháp lý cho workflow đất đai.

## 2. Backlog bổ sung cần gắn vào Sprint 2

| ID tạm | Sprint | Feature | User story | Acceptance Criteria | Agent |
|---|---|---|---|---|---|
| LEG-S2-001 | Sprint 2 | Legal Procedure Registry | As system, I want lưu danh mục thủ tục pháp lý liên quan để workflow biết thủ tục nào dùng nguồn nào | Có procedureCode, sourceDecision, legalBasis, level, authorityActors, requiresTaxStep | AI_04 Backend API |
| LEG-S2-002 | Sprint 2 | Document Versioning | As citizen, I want mỗi lần upload/thay thế tạo phiên bản mới | Không ghi đè bản cũ; mỗi version có CID/hash/status | AI_06 DB & IPFS |
| LEG-S2-003 | Sprint 2 | Intake Fee Flag | As system, I want đánh dấu thủ tục có phí/lệ phí khi nộp hồ sơ | Có type `INTAKE_FEE`, không dùng crypto/token thật | AI_04 Backend API |
| LEG-S2-004 | Sprint 2 | Legal Form Snapshot | As officer, I want snapshot bộ hồ sơ tại thời điểm submit | Submit khóa version hiện hành vào application snapshot | AI_04 Backend API |
| LEG-S2-005 | Sprint 2 | Audit Legal Basis | As auditor, I want mỗi transition có legalBasis/reason | Transition thiếu legalBasis/reason bị reject với workflow nhạy cảm | AI_15 Compliance |

## 3. Backlog bổ sung cần gắn vào Sprint 3

| ID tạm | Sprint | Feature | User story | Acceptance Criteria | Agent |
|---|---|---|---|---|---|
| LEG-S3-001 | Sprint 3 | Commune Confirmation | As commune officer, I want xác nhận thông tin thuộc thẩm quyền cấp xã | Có trạng thái vào/ra, lý do, file evidence, audit log | AI_08 Frontend Admin + AI_04 Backend |
| LEG-S3-002 | Sprint 3 | Supplement Request | As reception officer, I want yêu cầu bổ sung phân biệt với từ chối | Bắt buộc có danh mục thiếu và deadline/ghi chú | AI_04 Backend API |
| LEG-S3-003 | Sprint 3 | Document Version History | As officer, I want xem lịch sử phiên bản tài liệu | Có timeline upload/replaced/locked/signed | AI_07/AI_08 Frontend |

## 4. Backlog bổ sung cần gắn vào Sprint 4-7

| ID tạm | Sprint | Feature | User story | Acceptance Criteria | Agent |
|---|---|---|---|---|---|
| LEG-S4-001 | Sprint 4 | Approval Precondition | As system, I want chỉ ghi on-chain nếu hồ sơ đã ký cấp/cập nhật CSDL | Contract call bị block nếu status chưa đủ | AI_04 + AI_02 |
| LEG-S5-001 | Sprint 5 | Tax/Financial Obligation | As tax officer, I want xác định nghĩa vụ tài chính off-chain | Có obligation, notice, receipt, status | AI_04 + AI_08 |
| LEG-S5-002 | Sprint 5 | Map Legal Source | As officer, I want biết nguồn dữ liệu bản đồ là demo hay chính thức | UI hiển thị source_type và warning demo | AI_08 |
| LEG-S7-001 | Sprint 7 | On-chain Evidence Only | As auditor, I want blockchain chỉ có hash/CID/tx | Test kiểm tra không có PII/polygon/full document on-chain | AI_03 + AI_15 |

## 5. Rule merge backlog

- Các ID `LEG-*` là ID tạm để tránh phá sequence US hiện có.
- Khi merge chính thức, đổi thành US tiếp theo sau file hiện tại.
- Không đóng Sprint 2+ nếu thiếu mapping legalBasis cho workflow đất đai.
