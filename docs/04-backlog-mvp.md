# 04-backlog-mvp.md

> Bản backlog MVP đã được đồng bộ theo file Excel `Project15_sprint.xlsx`.

## 1. Thông tin đồng bộ

| Hạng mục | Giá trị |
|---|---:|
| Tổng user stories | 546 |
| Tổng sprint | 8 |
| Số epic | 12 |
| Số agent phụ trách trong Excel | 13 |
| ID đầu/cuối | US-001 → US-546 |
| Kiểm tra trùng ID | Không có |
| Kiểm tra thiếu ID | Không có |

**Nguồn dữ liệu dùng để chỉnh file:**

- Sheet `PD_Backlog` / `Project15_backlog`: backlog tổng 546 user stories.
- Sheet `Tong Quan Sprint`: mục tiêu và số lượng backlog theo sprint.
- Sheet `S1` đến `S8`: sprint backlog chi tiết.

> Ghi chú: Mã user story trong từng sprint không nhất thiết liên tục, vì Excel đã phân bổ một số nhóm QA, DevOps, documentation và compliance vào các sprint phù hợp theo tiến độ triển khai.

## 2. Sprint overview

| Sprint | Mục tiêu sprint | Số backlog | Rất Cao | Cao | Trung Bình | Thấp |
|---|---|---:|---:|---:|---:|---:|
| Sprint 1 | Nền tảng hệ thống: xác thực, phân quyền, repository, môi trường demo và kiểm thử nền. | 90 | 22 | 68 | 0 | 0 |
| Sprint 2 | Số hóa hồ sơ và IPFS: upload tài liệu, CID/hash, khai báo thông tin thửa đất và chủ sử dụng. | 72 | 28 | 44 | 0 | 0 |
| Sprint 3 | Hoàn thiện tạo/gửi hồ sơ và luồng duyệt sơ bộ: danh sách hồ sơ, xử lý, trạng thái, yêu cầu bổ sung. | 72 | 28 | 32 | 12 | 0 |
| Sprint 4 | Phê duyệt và ghi nhận blockchain đăng ký đất: mint bản ghi quyền sử dụng đất, event, tx hash, test đăng ký. | 78 | 34 | 44 | 0 | 0 |
| Sprint 5 | Tra cứu và lịch sử: tra cứu thửa đất, hồ sơ, lịch sử giao dịch; dashboard tra cứu cốt lõi. | 60 | 8 | 34 | 18 | 0 |
| Sprint 6 | Chuyển nhượng quyền sử dụng đất: tạo giao dịch, xác nhận, sang tên, test chuyển nhượng và báo cáo đầu ra. | 78 | 34 | 38 | 6 | 0 |
| Sprint 7 | AI hỗ trợ MVP và giám sát: OCR, kiểm tra hồ sơ, cảnh báo AI, KPI, tài liệu API và compliance dữ liệu. | 78 | 6 | 41 | 31 | 0 |
| Sprint 8 | Đóng gói, hướng dẫn sử dụng và bàn giao cuối kỳ. | 18 | 2 | 15 | 1 | 0 |

## 2.1. Legal rebaseline snapshot (2026-05-10)

Theo bo tai lieu `docs/docs-legal-aligned`, closure status sprint duoc cap nhat:

| Sprint | Trang thai |
|---|---|
| Sprint 1 | Done |
| Sprint 2 | Partial |
| Sprint 3 | Partial |

Ly do Sprint 2/3 duoc dua ve `Partial`: chua dat day du legal gates moi (legal procedure registry, document versioning + submit snapshot, payment model off-chain, transition legal guard, blockchain precondition guard).

## 2.2. Legal backlog injection (addendum)

Nguon: [docs/docs-legal-aligned/04-backlog-mvp.legal-aligned-addendum.md](./docs-legal-aligned/04-backlog-mvp.legal-aligned-addendum.md)

### Sprint 2 - LEG-S2

| ID tạm | Feature | User story | Acceptance Criteria | Agent owner |
|---|---|---|---|---|
| LEG-S2-001 | Legal Procedure Registry | As system, I want lưu danh mục thủ tục pháp lý liên quan để workflow biết thủ tục nào dùng nguồn nào | Có `procedureCode`, `sourceDecision`, `legalBasis`, `level`, `authorityActors`, `requiresTaxStep` | AI_04 Backend API |
| LEG-S2-002 | Document Versioning | As citizen, I want mỗi lần upload/thay thế tạo phiên bản mới | Không ghi đè bản cũ; mỗi version có CID/hash/status | AI_06 DB & IPFS |
| LEG-S2-003 | Intake Fee Flag | As system, I want đánh dấu thủ tục có phí/lệ phí khi nộp hồ sơ | Có type `INTAKE_FEE`, không dùng crypto/token thật | AI_04 Backend API |
| LEG-S2-004 | Legal Form Snapshot | As officer, I want snapshot bộ hồ sơ tại thời điểm submit | Submit khóa version hiện hành vào application snapshot | AI_04 Backend API |
| LEG-S2-005 | Audit Legal Basis | As auditor, I want mỗi transition có legalBasis/reason | Transition thiếu legalBasis/reason bị reject với workflow nhạy cảm | AI_15 Compliance |

### Sprint 3 - LEG-S3

| ID tạm | Feature | User story | Acceptance Criteria | Agent owner |
|---|---|---|---|---|
| LEG-S3-001 | Commune Confirmation | As commune officer, I want xác nhận thông tin thuộc thẩm quyền cấp xã | Có trạng thái vào/ra, lý do, file evidence, audit log | AI_08 Frontend Admin + AI_04 Backend |
| LEG-S3-002 | Supplement Request | As reception officer, I want yêu cầu bổ sung phân biệt với từ chối | Bắt buộc có danh mục thiếu và deadline/ghi chú | AI_04 Backend API |
| LEG-S3-003 | Document Version History | As officer, I want xem lịch sử phiên bản tài liệu | Có timeline upload/replaced/locked/signed | AI_07/AI_08 Frontend |

### Sprint 4/5/7 - LEG-S4, LEG-S5, LEG-S7

| ID tạm | Sprint | Feature | User story | Acceptance Criteria | Agent owner |
|---|---|---|---|---|---|
| LEG-S4-001 | Sprint 4 | Approval Precondition | As system, I want chỉ ghi on-chain nếu hồ sơ đã ký cấp/cập nhật CSDL | Contract call bị block nếu status chưa đủ | AI_04 + AI_02 |
| LEG-S5-001 | Sprint 5 | Tax/Financial Obligation | As tax officer, I want xác định nghĩa vụ tài chính off-chain | Có obligation, notice, receipt, status | AI_04 + AI_08 |
| LEG-S5-002 | Sprint 5 | Map Legal Source | As officer, I want biết nguồn dữ liệu bản đồ là demo hay chính thức | UI hiển thị `source_type` và warning demo | AI_08 |
| LEG-S7-001 | Sprint 7 | On-chain Evidence Only | As auditor, I want blockchain chỉ có hash/CID/tx | Test kiểm tra không có PII/polygon/full document on-chain | AI_03 + AI_15 |

Quy tắc dong sprint:
- Khong dong Sprint 2+ neu thieu mapping legalBasis cho workflow dat dai.
- Cac ID `LEG-*` la ID tam, duoc doi sang US ID chinh thuc khi PM duyet merge backlog.

## 3. Tổng hợp theo mức ưu tiên

| Mức ưu tiên | Số lượng |
|---|---:|
| Rất Cao | 162 |
| Cao | 316 |
| Trung Bình | 68 |

## 4. Tổng hợp theo epic

| Epic | Số user stories |
|---|---:|
| Epic 1: Định danh & Phân quyền | 48 |
| Epic 2: Số hóa & IPFS | 48 |
| Epic 3: Đăng ký đất đai lần đầu | 48 |
| Epic 4: Duyệt hồ sơ | 60 |
| Epic 5: Ghi nhận blockchain | 48 |
| Epic 6: Tra cứu & Lịch sử | 42 |
| Epic 7: Chuyển nhượng quyền sử dụng đất | 60 |
| Epic 8: AI hỗ trợ MVP | 42 |
| Epic 9: Dashboard & Báo cáo | 36 |
| Epic 10: Audit, Security & Compliance | 42 |
| Epic 11: QA & Test | 36 |
| Epic 12: DevOps, Tài liệu & Bàn giao | 36 |

## 5. Tổng hợp theo agent phụ trách

| Agent phụ trách theo Excel | Số user stories |
|---|---:|
| AI_08 (Frontend Admin) | 90 |
| AI_07 (Frontend Citizen) | 84 |
| AI_04 (Backend API) | 78 |
| AI_15 (Compliance) | 54 |
| AI_14 (Tech Writer) | 48 |
| AI_05 (Backend Auth) | 42 |
| AI_02 (Blockchain Core Dev) | 36 |
| AI_06 (Database & IPFS) | 24 |
| AI_13 (DevOps) | 24 |
| AI_11 (QA Unit) | 24 |
| AI_12 (QA E2E) | 18 |
| AI_03 (Smart Contract Auditor) | 12 |
| AI_10 (OCR & Document Assistant) | 12 |

## 6. Quy ước đọc backlog

Mỗi dòng backlog giữ đúng cấu trúc từ Excel:

- **Mã ID**: mã user story/task.
- **Epic**: nhóm nghiệp vụ hoặc kỹ thuật lớn.
- **Feature**: chức năng cụ thể.
- **As a [who]**: vai trò thực hiện hoặc hệ thống liên quan.
- **I want [what]**: hành động/mong muốn cần triển khai.
- **so that [why]**: giá trị đạt được.
- **Mức ưu tiên**: Rất Cao, Cao, Trung Bình, Thấp.
- **Acceptance Criteria**: tiêu chí nghiệm thu.
- **Agent phụ trách**: agent chịu trách nhiệm chính theo file Excel.
- **Sprint đề xuất**: sprint triển khai.

## 7. Sprint backlog chi tiết

## Sprint 1

**Mục tiêu:** Nền tảng hệ thống: xác thực, phân quyền, repository, môi trường demo và kiểm thử nền.

**Số lượng backlog:** 90 user stories/tasks. Mức ưu tiên: Rất Cao 22, Cao 68, Trung Bình 0, Thấp 0.

### Tổng hợp sprint

| Nhóm | Số lượng |
|---|---:|
| Epic 1: Định danh & Phân quyền | 48 |
| Epic 10: Audit, Security & Compliance | 18 |
| Epic 11: QA & Test | 12 |
| Epic 12: DevOps, Tài liệu & Bàn giao | 12 |

**Agent tham gia chính:** AI_05 (Backend Auth) (42), AI_15 (Compliance) (12), AI_13 (DevOps) (12), AI_04 (Backend API) (6), AI_03 (Smart Contract Auditor) (6), AI_11 (QA Unit) (6), AI_12 (QA E2E) (6)

### Sprint 1 closure snapshot (2026-04-28)

| Nhóm US Sprint 1 | Trạng thái closure hiện tại | Verify local | Phụ thuộc GitHub remote | Evidence |
|---|---|---|---|---|
| Auth (Epic 1 / AI_05) | Partial | Có thể verify bằng test backend auth và các endpoint `/auth/*` | Cần required checks pass trên PR target branch | [backend/test/auth-rbac.test.ts](../backend/test/auth-rbac.test.ts), [backend/src/modules/auth/auth.routes.ts](../backend/src/modules/auth/auth.routes.ts), [.github/workflows/ci.yml](../.github/workflows/ci.yml) |
| QA/Test gate (Epic 11 / AI_11, AI_12) | Partial | Có command local cho backend/frontend/contracts | Cần branch protection + required checks xác nhận merge gate | [README.md - Sprint 1 verification commands](../README.md#sprint-1-verification-commands), [.github/workflows/ci.yml](../.github/workflows/ci.yml) |
| Audit/Security/Compliance (Epic 10 / AI_15) | Partial | Có route + RBAC audit API để verify local | Secret scanning, branch protection và required checks chỉ xác nhận trên GitHub repo settings/security | [backend/src/modules/audit/audit.routes.ts](../backend/src/modules/audit/audit.routes.ts), [backend/test/auth-rbac.test.ts](../backend/test/auth-rbac.test.ts), [docs/08-definition-of-done.md](./08-definition-of-done.md) |

### Epic 1: Định danh & Phân quyền

#### Feature: Đăng nhập tài khoản công dân

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-001 | Người dân | đăng nhập vào hệ thống bằng tài khoản hợp lệ | tôi có thể truy cập cổng dịch vụ của mình | Rất Cao | AI_05 (Backend Auth) | 1. Chức năng "Đăng nhập tài khoản công dân" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-002 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Đăng nhập tài khoản công dân" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_05 (Backend Auth) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-003 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Đăng nhập tài khoản công dân" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_05 (Backend Auth) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-004 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Đăng nhập tài khoản công dân" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_05 (Backend Auth) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-005 | Hệ thống | ghi nhật ký thao tác cho chức năng "Đăng nhập tài khoản công dân" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_05 (Backend Auth) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-006 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Đăng nhập tài khoản công dân" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_05 (Backend Auth) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Đăng nhập tài khoản cán bộ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-007 | Công chức UBND cấp xã/phường phụ trách đất đai | đăng nhập vào giao diện xử lý hồ sơ | tôi có thể tiếp nhận và xử lý hồ sơ đúng vai trò | Rất Cao | AI_05 (Backend Auth) | 1. Chức năng "Đăng nhập tài khoản cán bộ" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-008 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Đăng nhập tài khoản cán bộ" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_05 (Backend Auth) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-009 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Đăng nhập tài khoản cán bộ" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_05 (Backend Auth) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-010 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Đăng nhập tài khoản cán bộ" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_05 (Backend Auth) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-011 | Hệ thống | ghi nhật ký thao tác cho chức năng "Đăng nhập tài khoản cán bộ" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_05 (Backend Auth) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-012 | Công chức UBND cấp xã/phường phụ trách đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Đăng nhập tài khoản cán bộ" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_05 (Backend Auth) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Mô phỏng xác thực VNeID

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-013 | Người dân | xác thực danh tính ở mức mô phỏng trước khi nộp hồ sơ | hệ thống tăng độ tin cậy của hồ sơ đầu vào | Cao | AI_05 (Backend Auth) | 1. Chức năng "Mô phỏng xác thực VNeID" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-014 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Mô phỏng xác thực VNeID" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_05 (Backend Auth) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-015 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Mô phỏng xác thực VNeID" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_05 (Backend Auth) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-016 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Mô phỏng xác thực VNeID" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_05 (Backend Auth) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-017 | Hệ thống | ghi nhật ký thao tác cho chức năng "Mô phỏng xác thực VNeID" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_05 (Backend Auth) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-018 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Mô phỏng xác thực VNeID" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_05 (Backend Auth) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Khởi tạo phiên làm việc

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-019 | Hệ thống | tạo phiên đăng nhập an toàn sau khi xác thực thành công | người dùng không phải đăng nhập lại nhiều lần trong một phiên hợp lệ | Rất Cao | AI_05 (Backend Auth) | 1. Chức năng "Khởi tạo phiên làm việc" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-020 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Khởi tạo phiên làm việc" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_05 (Backend Auth) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-021 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Khởi tạo phiên làm việc" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_05 (Backend Auth) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-022 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Khởi tạo phiên làm việc" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_05 (Backend Auth) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-023 | Hệ thống | ghi nhật ký thao tác cho chức năng "Khởi tạo phiên làm việc" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_05 (Backend Auth) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-024 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Khởi tạo phiên làm việc" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_05 (Backend Auth) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Phân quyền theo vai trò

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-025 | Hệ thống | gán quyền truy cập cho từng vai trò người dùng | mỗi vai trò chỉ sử dụng được chức năng phù hợp | Rất Cao | AI_04 (Backend API) | 1. Chức năng "Phân quyền theo vai trò" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-026 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Phân quyền theo vai trò" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_04 (Backend API) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-027 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Phân quyền theo vai trò" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_04 (Backend API) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-028 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Phân quyền theo vai trò" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_04 (Backend API) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-029 | Hệ thống | ghi nhật ký thao tác cho chức năng "Phân quyền theo vai trò" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_04 (Backend API) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-030 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Phân quyền theo vai trò" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_04 (Backend API) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Khóa tài khoản sau nhiều lần sai mật khẩu

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-031 | Hệ thống | tạm khóa tài khoản sau số lần đăng nhập sai vượt ngưỡng | giảm nguy cơ truy cập trái phép | Cao | AI_05 (Backend Auth) | 1. Chức năng "Khóa tài khoản sau nhiều lần sai mật khẩu" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-032 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Khóa tài khoản sau nhiều lần sai mật khẩu" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_05 (Backend Auth) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-033 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Khóa tài khoản sau nhiều lần sai mật khẩu" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_05 (Backend Auth) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-034 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Khóa tài khoản sau nhiều lần sai mật khẩu" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_05 (Backend Auth) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-035 | Hệ thống | ghi nhật ký thao tác cho chức năng "Khóa tài khoản sau nhiều lần sai mật khẩu" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_05 (Backend Auth) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-036 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Khóa tài khoản sau nhiều lần sai mật khẩu" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_05 (Backend Auth) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Đặt lại mật khẩu

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-037 | Người dân | đặt lại mật khẩu thông qua quy trình xác minh | tôi có thể lấy lại quyền truy cập khi quên mật khẩu | Cao | AI_05 (Backend Auth) | 1. Chức năng "Đặt lại mật khẩu" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-038 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Đặt lại mật khẩu" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_05 (Backend Auth) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-039 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Đặt lại mật khẩu" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_05 (Backend Auth) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-040 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Đặt lại mật khẩu" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_05 (Backend Auth) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-041 | Hệ thống | ghi nhật ký thao tác cho chức năng "Đặt lại mật khẩu" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_05 (Backend Auth) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-042 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Đặt lại mật khẩu" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_05 (Backend Auth) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Nhật ký truy cập

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-043 | Cán bộ Sở Nông nghiệp và Môi trường | xem nhật ký đăng nhập và thao tác truy cập | tôi có thể giám sát việc sử dụng hệ thống | Cao | AI_15 (Compliance) | 1. Chức năng "Nhật ký truy cập" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-044 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Nhật ký truy cập" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_15 (Compliance) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-045 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Nhật ký truy cập" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_15 (Compliance) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-046 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Nhật ký truy cập" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_15 (Compliance) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-047 | Hệ thống | ghi nhật ký thao tác cho chức năng "Nhật ký truy cập" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_15 (Compliance) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-048 | Cán bộ Sở Nông nghiệp và Môi trường | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Nhật ký truy cập" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_15 (Compliance) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

### Epic 10: Audit, Security & Compliance

#### Feature: Nhật ký thao tác người dùng

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-433 | Cán bộ Sở Nông nghiệp và Môi trường | xem nhật ký thao tác chính của người dùng và cán bộ | tôi có thể truy vết khi có sai lệch nghiệp vụ | Cao | AI_15 (Compliance) | 1. Chức năng "Nhật ký thao tác người dùng" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-434 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Nhật ký thao tác người dùng" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_15 (Compliance) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-435 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Nhật ký thao tác người dùng" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_15 (Compliance) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-436 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Nhật ký thao tác người dùng" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_15 (Compliance) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-437 | Hệ thống | ghi nhật ký thao tác cho chức năng "Nhật ký thao tác người dùng" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_15 (Compliance) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-438 | Cán bộ Sở Nông nghiệp và Môi trường | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Nhật ký thao tác người dùng" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_15 (Compliance) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Quản lý thay đổi phân quyền

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-451 | Cán bộ Sở Nông nghiệp và Môi trường | xem và kiểm soát các thay đổi liên quan đến vai trò truy cập | tôi hạn chế được sai sót về quyền hạn | Cao | AI_05 (Backend Auth) | 1. Chức năng "Quản lý thay đổi phân quyền" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-452 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Quản lý thay đổi phân quyền" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_05 (Backend Auth) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-453 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Quản lý thay đổi phân quyền" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_05 (Backend Auth) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-454 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Quản lý thay đổi phân quyền" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_05 (Backend Auth) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-455 | Hệ thống | ghi nhật ký thao tác cho chức năng "Quản lý thay đổi phân quyền" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_05 (Backend Auth) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-456 | Cán bộ Sở Nông nghiệp và Môi trường | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Quản lý thay đổi phân quyền" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_05 (Backend Auth) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Kiểm tra cấu hình bảo mật cơ bản

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-457 | Technical Lead | kiểm tra các cấu hình bảo mật trước khi triển khai demo | nhóm giảm rủi ro kỹ thuật khi trình bày | Cao | AI_03 (Smart Contract Auditor) | 1. Deliverable của "Kiểm tra cấu hình bảo mật cơ bản" được tạo đầy đủ. 2. Có thể chạy hoặc kiểm tra được trên môi trường dự án. |
| US-458 | Hệ thống | chuẩn hóa cấu hình, tham số và phụ thuộc của "Kiểm tra cấu hình bảo mật cơ bản" | việc tích hợp với các thành phần khác không bị sai lệch | Cao | AI_03 (Smart Contract Auditor) | 1. Các phụ thuộc được khai báo rõ ràng. 2. Không phát sinh lỗi cấu hình nghiêm trọng khi tích hợp. |
| US-459 | Technical Lead | tự động hóa một phần thao tác của "Kiểm tra cấu hình bảo mật cơ bản" | nhóm giảm công việc thủ công lặp lại trong quá trình phát triển | Cao | AI_03 (Smart Contract Auditor) | 1. Có script hoặc pipeline hỗ trợ. 2. Có thể chạy lặp lại nhiều lần với kết quả ổn định. |
| US-460 | Hệ thống | lưu lại kết quả và log của "Kiểm tra cấu hình bảo mật cơ bản" | nhóm QA và PM có thể theo dõi tình trạng thực thi | Cao | AI_03 (Smart Contract Auditor) | 1. Có log hoặc báo cáo đầu ra. 2. Log đủ để xác định bước nào thành công hoặc thất bại. |
| US-461 | Nhóm QA | kiểm tra đầu ra của "Kiểm tra cấu hình bảo mật cơ bản" theo tiêu chí chấp nhận đã định | nhóm phát hiện sớm lỗi kỹ thuật trước khi demo | Cao | AI_03 (Smart Contract Auditor) | 1. Có checklist hoặc test case. 2. Kết quả pass/fail được ghi nhận rõ ràng. |
| US-462 | Technical Lead | xử lý lỗi hoặc tình huống ngoại lệ của "Kiểm tra cấu hình bảo mật cơ bản" | hệ thống hoặc quy trình kỹ thuật không bị gián đoạn toàn phần | Cao | AI_03 (Smart Contract Auditor) | 1. Có cơ chế cảnh báo khi lỗi xảy ra. 2. Có phương án retry hoặc fallback ở mức phù hợp. |

### Epic 11: QA & Test

#### Feature: Unit test backend API

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-487 | Nhóm QA | có unit test cho các API nghiệp vụ quan trọng | nhóm phát hiện lỗi backend sớm hơn | Cao | AI_11 (QA Unit) | 1. Deliverable của "Unit test backend API" được tạo đầy đủ. 2. Có thể chạy hoặc kiểm tra được trên môi trường dự án. |
| US-488 | Hệ thống | chuẩn hóa cấu hình, tham số và phụ thuộc của "Unit test backend API" | việc tích hợp với các thành phần khác không bị sai lệch | Cao | AI_11 (QA Unit) | 1. Các phụ thuộc được khai báo rõ ràng. 2. Không phát sinh lỗi cấu hình nghiêm trọng khi tích hợp. |
| US-489 | Nhóm QA | tự động hóa một phần thao tác của "Unit test backend API" | nhóm giảm công việc thủ công lặp lại trong quá trình phát triển | Cao | AI_11 (QA Unit) | 1. Có script hoặc pipeline hỗ trợ. 2. Có thể chạy lặp lại nhiều lần với kết quả ổn định. |
| US-490 | Hệ thống | lưu lại kết quả và log của "Unit test backend API" | nhóm QA và PM có thể theo dõi tình trạng thực thi | Cao | AI_11 (QA Unit) | 1. Có log hoặc báo cáo đầu ra. 2. Log đủ để xác định bước nào thành công hoặc thất bại. |
| US-491 | Nhóm QA | kiểm tra đầu ra của "Unit test backend API" theo tiêu chí chấp nhận đã định | nhóm phát hiện sớm lỗi kỹ thuật trước khi demo | Cao | AI_11 (QA Unit) | 1. Có checklist hoặc test case. 2. Kết quả pass/fail được ghi nhận rõ ràng. |
| US-492 | Nhóm QA | xử lý lỗi hoặc tình huống ngoại lệ của "Unit test backend API" | hệ thống hoặc quy trình kỹ thuật không bị gián đoạn toàn phần | Cao | AI_11 (QA Unit) | 1. Có cơ chế cảnh báo khi lỗi xảy ra. 2. Có phương án retry hoặc fallback ở mức phù hợp. |

#### Feature: Chuẩn bị dữ liệu kiểm thử mẫu

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-505 | Nhóm QA | có bộ dữ liệu hồ sơ và giao dịch mẫu cho kiểm thử và demo | nhóm chạy thử và trình bày ổn định hơn | Cao | AI_12 (QA E2E) | 1. Deliverable của "Chuẩn bị dữ liệu kiểm thử mẫu" được tạo đầy đủ. 2. Có thể chạy hoặc kiểm tra được trên môi trường dự án. |
| US-506 | Hệ thống | chuẩn hóa cấu hình, tham số và phụ thuộc của "Chuẩn bị dữ liệu kiểm thử mẫu" | việc tích hợp với các thành phần khác không bị sai lệch | Cao | AI_12 (QA E2E) | 1. Các phụ thuộc được khai báo rõ ràng. 2. Không phát sinh lỗi cấu hình nghiêm trọng khi tích hợp. |
| US-507 | Nhóm QA | tự động hóa một phần thao tác của "Chuẩn bị dữ liệu kiểm thử mẫu" | nhóm giảm công việc thủ công lặp lại trong quá trình phát triển | Cao | AI_12 (QA E2E) | 1. Có script hoặc pipeline hỗ trợ. 2. Có thể chạy lặp lại nhiều lần với kết quả ổn định. |
| US-508 | Hệ thống | lưu lại kết quả và log của "Chuẩn bị dữ liệu kiểm thử mẫu" | nhóm QA và PM có thể theo dõi tình trạng thực thi | Cao | AI_12 (QA E2E) | 1. Có log hoặc báo cáo đầu ra. 2. Log đủ để xác định bước nào thành công hoặc thất bại. |
| US-509 | Nhóm QA | kiểm tra đầu ra của "Chuẩn bị dữ liệu kiểm thử mẫu" theo tiêu chí chấp nhận đã định | nhóm phát hiện sớm lỗi kỹ thuật trước khi demo | Cao | AI_12 (QA E2E) | 1. Có checklist hoặc test case. 2. Kết quả pass/fail được ghi nhận rõ ràng. |
| US-510 | Nhóm QA | xử lý lỗi hoặc tình huống ngoại lệ của "Chuẩn bị dữ liệu kiểm thử mẫu" | hệ thống hoặc quy trình kỹ thuật không bị gián đoạn toàn phần | Cao | AI_12 (QA E2E) | 1. Có cơ chế cảnh báo khi lỗi xảy ra. 2. Có phương án retry hoặc fallback ở mức phù hợp. |

### Epic 12: DevOps, Tài liệu & Bàn giao

#### Feature: Quản lý repository và branch

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-511 | Technical Lead | chuẩn hóa repository, branch và quy tắc merge | nhóm kiểm soát thay đổi mã nguồn tốt hơn | Rất Cao | AI_13 (DevOps) | 1. Deliverable của "Quản lý repository và branch" được tạo đầy đủ. 2. Có thể chạy hoặc kiểm tra được trên môi trường dự án. |
| US-512 | Hệ thống | chuẩn hóa cấu hình, tham số và phụ thuộc của "Quản lý repository và branch" | việc tích hợp với các thành phần khác không bị sai lệch | Rất Cao | AI_13 (DevOps) | 1. Các phụ thuộc được khai báo rõ ràng. 2. Không phát sinh lỗi cấu hình nghiêm trọng khi tích hợp. |
| US-513 | Technical Lead | tự động hóa một phần thao tác của "Quản lý repository và branch" | nhóm giảm công việc thủ công lặp lại trong quá trình phát triển | Cao | AI_13 (DevOps) | 1. Có script hoặc pipeline hỗ trợ. 2. Có thể chạy lặp lại nhiều lần với kết quả ổn định. |
| US-514 | Hệ thống | lưu lại kết quả và log của "Quản lý repository và branch" | nhóm QA và PM có thể theo dõi tình trạng thực thi | Cao | AI_13 (DevOps) | 1. Có log hoặc báo cáo đầu ra. 2. Log đủ để xác định bước nào thành công hoặc thất bại. |
| US-515 | Nhóm QA | kiểm tra đầu ra của "Quản lý repository và branch" theo tiêu chí chấp nhận đã định | nhóm phát hiện sớm lỗi kỹ thuật trước khi demo | Rất Cao | AI_13 (DevOps) | 1. Có checklist hoặc test case. 2. Kết quả pass/fail được ghi nhận rõ ràng. |
| US-516 | Technical Lead | xử lý lỗi hoặc tình huống ngoại lệ của "Quản lý repository và branch" | hệ thống hoặc quy trình kỹ thuật không bị gián đoạn toàn phần | Cao | AI_13 (DevOps) | 1. Có cơ chế cảnh báo khi lỗi xảy ra. 2. Có phương án retry hoặc fallback ở mức phù hợp. |

#### Feature: Cấu hình môi trường demo

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-517 | AI DevOps Engineer | thiết lập môi trường chạy thử cho backend, frontend và contract | prototype có thể chạy ổn định khi bảo vệ | Rất Cao | AI_13 (DevOps) | 1. Deliverable của "Cấu hình môi trường demo" được tạo đầy đủ. 2. Có thể chạy hoặc kiểm tra được trên môi trường dự án. |
| US-518 | Hệ thống | chuẩn hóa cấu hình, tham số và phụ thuộc của "Cấu hình môi trường demo" | việc tích hợp với các thành phần khác không bị sai lệch | Rất Cao | AI_13 (DevOps) | 1. Các phụ thuộc được khai báo rõ ràng. 2. Không phát sinh lỗi cấu hình nghiêm trọng khi tích hợp. |
| US-519 | AI DevOps Engineer | tự động hóa một phần thao tác của "Cấu hình môi trường demo" | nhóm giảm công việc thủ công lặp lại trong quá trình phát triển | Cao | AI_13 (DevOps) | 1. Có script hoặc pipeline hỗ trợ. 2. Có thể chạy lặp lại nhiều lần với kết quả ổn định. |
| US-520 | Hệ thống | lưu lại kết quả và log của "Cấu hình môi trường demo" | nhóm QA và PM có thể theo dõi tình trạng thực thi | Cao | AI_13 (DevOps) | 1. Có log hoặc báo cáo đầu ra. 2. Log đủ để xác định bước nào thành công hoặc thất bại. |
| US-521 | Nhóm QA | kiểm tra đầu ra của "Cấu hình môi trường demo" theo tiêu chí chấp nhận đã định | nhóm phát hiện sớm lỗi kỹ thuật trước khi demo | Rất Cao | AI_13 (DevOps) | 1. Có checklist hoặc test case. 2. Kết quả pass/fail được ghi nhận rõ ràng. |
| US-522 | AI DevOps Engineer | xử lý lỗi hoặc tình huống ngoại lệ của "Cấu hình môi trường demo" | hệ thống hoặc quy trình kỹ thuật không bị gián đoạn toàn phần | Cao | AI_13 (DevOps) | 1. Có cơ chế cảnh báo khi lỗi xảy ra. 2. Có phương án retry hoặc fallback ở mức phù hợp. |

---

### Sprint 1 + Sprint 0 (gop) closure status - 2026-04-28

> Quy ước: `Done` = đã có implementation + test/evidence; `Partial` = đã có một phần, còn phụ thuộc hạ tầng/chính sách hoặc hardening.

| US/Task group | Trạng thái | Evidence chính |
|---|---|---|
| US-001..006 (Đăng nhập công dân) | Done | `backend/src/modules/auth/auth.routes.ts`, `backend/test/auth-rbac.test.ts` |
| US-007..012 (Đăng nhập cán bộ) | Done | `backend/src/modules/auth/auth.routes.ts`, `backend/test/auth-rbac.test.ts` |
| US-013..018 (VNeID mock) | Done | `backend/src/modules/auth/auth.routes.ts` (`/auth/vneid/mock`, env-gate) |
| US-019..024 (Phiên đăng nhập) | Done | `POST /auth/refresh`, `POST /auth/logout`, test lifecycle |
| US-025..030 (RBAC theo vai trò) | Done | `auth.middleware.ts`, ownership checks ở registrations/transfers/files |
| US-031..036 (Auto lock login sai) | Done | `failedLoginAttempts`, `lockedUntil`, login lock policy + tests |
| US-037..042 (Đặt lại/đổi mật khẩu) | Done | `POST /auth/password/reset-*`, `POST /auth/change-password` + tests |
| US-043..048 (Nhật ký truy cập) | Done | `GET /audit/access-logs` + RBAC guard |
| US-433..438 (Nhật ký thao tác người dùng) | Done | `GET /audit/user-actions` |
| US-451..456 (Nhật ký thay đổi phân quyền) | Done | `GET /audit/rbac-changes`, audit actions `RBAC_*` |
| US-457..462 (Kiểm tra cấu hình bảo mật cơ bản) | Partial | Đã có CI lane/nightly, còn branch protection và secret scan cấu hình trên GitHub |
| US-487..492 (Unit test backend API) | Done | `backend/test/auth-rbac.test.ts`, `backend/test/sprint2.test.ts` |
| US-505..510 (Dữ liệu kiểm thử mẫu) | Done | `backend/prisma/seed.ts` |
| US-511..516 (Repository/branch/merge rules) | Partial | Có `CODEOWNERS`, CI lane; còn required checks + protection rule ở remote repo |
| US-517..522 (Môi trường demo) | Partial | Có runbook `README`, `docker-compose.yml`; cần xác nhận vận hành CI/CD thật |

#### Sprint 0 legacy merge checklist

| Sprint 0 legacy item | Trạng thái | Evidence |
|---|---|---|
| Monorepo foundation (US-001 cũ) | Done | `backend/`, `frontend/`, `contracts/`, `docs/`, `ai/` |
| Git workflow + PR template (US-002 cũ) | Done | `CONTRIBUTING.md`, `.github/pull_request_template.md` |
| Backend environment + health (US-003 cũ) | Done | `backend/src/app.ts` (`/api/v1/health`) |
| Frontend environment (US-004 cũ) | Done | `frontend` React+Vite+TS app chạy được |
| Hardhat project (US-005 cũ) | Done | `contracts/package.json`, `contracts/test/UrbanLandRegistry.ts` |
| Prisma + DB (US-006 cũ) | Done | `backend/prisma/schema.prisma`, migrations |
| `.env.example` baseline (US-007 cũ) | Done | `backend/.env.example`, `frontend/.env.example`, `contracts/.env.example` |
| README setup (US-008 cũ) | Done | `README.md` |
| Seed data demo (US-009 cũ) | Done | `backend/prisma/seed.ts` |
| ESLint/Prettier (US-010 cũ) | Done | root `package.json` lint/format scripts |

---

## Sprint 2

**Mục tiêu:** Số hóa hồ sơ và IPFS: upload tài liệu, CID/hash, khai báo thông tin thửa đất và chủ sử dụng.

**Số lượng backlog:** 72 user stories/tasks. Mức ưu tiên: Rất Cao 28, Cao 44, Trung Bình 0, Thấp 0.

### Tổng hợp sprint

| Nhóm | Số lượng |
|---|---:|
| Epic 2: Số hóa & IPFS | 48 |
| Epic 3: Đăng ký đất đai lần đầu | 24 |

**Agent tham gia chính:** AI_07 (Frontend Citizen) (30), AI_06 (Database & IPFS) (18), AI_04 (Backend API) (18), AI_15 (Compliance) (6)

### Sprint 2 closure snapshot (2026-04-28, cập nhật remote gate 19:20 ICT)

| Nhóm US Sprint 2 (Must+Should) | Trạng thái closure hiện tại | Verify local | Phụ thuộc GitHub remote | Evidence |
|---|---|---|---|---|
| Users/Organizations/Lands APIs (`US-019..027`, `US-031`, `US-111`) | Done | Backend test Sprint 2 pass cục bộ | Cần required checks pass trên PR chain | [backend/src/modules/users/user.routes.ts](../backend/src/modules/users/user.routes.ts), [backend/src/modules/organizations/organization.routes.ts](../backend/src/modules/organizations/organization.routes.ts), [backend/src/modules/lands/land.routes.ts](../backend/src/modules/lands/land.routes.ts), [backend/test/sprint2.test.ts](../backend/test/sprint2.test.ts) |
| Chuẩn hóa địa giới 2 cấp + Việt hóa UI dashboard/land/registration/search | Done | Test frontend helper + smoke UI local pass | Cần required checks pass trên PR chain | [frontend/src/App.tsx](../frontend/src/App.tsx), [frontend/src/styles.css](../frontend/src/styles.css), [frontend/src/pages/AdminDashboardPage.tsx](../frontend/src/pages/AdminDashboardPage.tsx), [frontend/src/pages/LandManagementPage.tsx](../frontend/src/pages/LandManagementPage.tsx), [frontend/src/pages/CitizenRegistrationPage.tsx](../frontend/src/pages/CitizenRegistrationPage.tsx), [frontend/src/lib/vnAddress.ts](../frontend/src/lib/vnAddress.ts), [frontend/test/vn-address.test.ts](../frontend/test/vn-address.test.ts), [frontend/test/dashboard-labels.test.ts](../frontend/test/dashboard-labels.test.ts) |
| Dashboard theo role (`US-098`) + route guard frontend | Done | Có test role mapping/frontend và backend dashboard | Cần xác nhận pass checks trên PR merge chain | [backend/src/modules/dashboard/dashboard.routes.ts](../backend/src/modules/dashboard/dashboard.routes.ts), [frontend/test/auth-routes.test.ts](../frontend/test/auth-routes.test.ts), [frontend/test/app.test.ts](../frontend/test/app.test.ts) |
| UX CRUD + toast (`US-105`) | Done | Có test helper CRUD + toast behavior + conflict handling | Không có blocker local; vẫn phụ thuộc gate remote để chốt release | [frontend/test/sprint2-crud-flows.test.ts](../frontend/test/sprint2-crud-flows.test.ts), [frontend/test/toast-behavior.test.ts](../frontend/test/toast-behavior.test.ts), [frontend/test/api-error-envelope.test.ts](../frontend/test/api-error-envelope.test.ts), [frontend/src/ui/ToastContext.tsx](../frontend/src/ui/ToastContext.tsx) |
| Full Gate đóng sprint (CI + branch protection + secret scanning) | Done | Có command local lint/build/test + report verify local | PR closeout Sprint 2 đã merge vào `develop`, CI checks pass trên PR #1 | [README.md - Sprint 2 verification commands](../README.md#sprint-2-verification-commands), [.github/workflows/ci.yml](../.github/workflows/ci.yml), [docs/08-definition-of-done.md](./08-definition-of-done.md), [docs/10-sprint-closure-matrix.md](./10-sprint-closure-matrix.md), [docs/11-sprint-closure-verification.md](./11-sprint-closure-verification.md), [PR #1](https://github.com/eye-00/QLDA-UrbanchainVN/pull/1) |

### Sprint 2 legal-aligned addendum snapshot (2026-05-10)

| Hạng mục legal Sprint 2 | Trạng thái | Evidence code/test | Ghi chú gate |
|---|---|---|---|
| `LEG-S2-001` Procedure registry + authority matrix | Done (local) | [backend/src/modules/legal/legal.routes.ts](../backend/src/modules/legal/legal.routes.ts), [backend/prisma/schema.prisma](../backend/prisma/schema.prisma), [backend/test/sprint2-legal.test.ts](../backend/test/sprint2-legal.test.ts) | Chờ required checks remote trên PR chain |
| `LEG-S2-002` Document versioning + submit snapshot | Done (local) | [backend/src/modules/files/file.routes.ts](../backend/src/modules/files/file.routes.ts), [backend/src/modules/registrations/registration.routes.ts](../backend/src/modules/registrations/registration.routes.ts), [backend/test/sprint2-legal.test.ts](../backend/test/sprint2-legal.test.ts) | Chờ required checks remote trên PR chain |
| `LEG-S2-003` Transition guard + `legalBasisCode` | Done (local) | [backend/src/modules/registrations/registration.routes.ts](../backend/src/modules/registrations/registration.routes.ts), [frontend/src/pages/RegistrationReviewPage.tsx](../frontend/src/pages/RegistrationReviewPage.tsx), [backend/test/sprint3-registration.test.ts](../backend/test/sprint3-registration.test.ts) | Chờ required checks remote trên PR chain |
| `LEG-S2-004` Payment obligations skeleton | Done (local) | [backend/src/modules/registrations/registration.routes.ts](../backend/src/modules/registrations/registration.routes.ts), [frontend/src/pages/registrationReviewHelpers.ts](../frontend/src/pages/registrationReviewHelpers.ts), [backend/test/sprint2-legal.test.ts](../backend/test/sprint2-legal.test.ts) | Chờ required checks remote trên PR chain |
| `LEG-S2-005` Blockchain precondition guard | Done (local) | [backend/src/modules/registrations/registration.routes.ts](../backend/src/modules/registrations/registration.routes.ts), [backend/test/sprint2-legal.test.ts](../backend/test/sprint2-legal.test.ts) | Chờ required checks remote trên PR chain |

### Epic 2: Số hóa & IPFS

#### Feature: Tải hồ sơ pháp lý lên hệ thống

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-049 | Người dân | tải giấy tờ pháp lý của thửa đất lên hệ thống | tôi có thể nộp hồ sơ trực tuyến thay vì nộp giấy | Rất Cao | AI_07 (Frontend Citizen) | 1. Chức năng "Tải hồ sơ pháp lý lên hệ thống" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-050 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Tải hồ sơ pháp lý lên hệ thống" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_07 (Frontend Citizen) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-051 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Tải hồ sơ pháp lý lên hệ thống" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_07 (Frontend Citizen) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-052 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Tải hồ sơ pháp lý lên hệ thống" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_07 (Frontend Citizen) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-053 | Hệ thống | ghi nhật ký thao tác cho chức năng "Tải hồ sơ pháp lý lên hệ thống" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_07 (Frontend Citizen) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-054 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Tải hồ sơ pháp lý lên hệ thống" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_07 (Frontend Citizen) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Phân loại tài liệu hồ sơ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-055 | Hệ thống | phân loại tài liệu theo nhóm giấy tờ bắt buộc và bổ sung | cán bộ dễ kiểm tra tính đầy đủ của bộ hồ sơ | Rất Cao | AI_06 (Database & IPFS) | 1. Chức năng "Phân loại tài liệu hồ sơ" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-056 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Phân loại tài liệu hồ sơ" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_06 (Database & IPFS) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-057 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Phân loại tài liệu hồ sơ" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_06 (Database & IPFS) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-058 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Phân loại tài liệu hồ sơ" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_06 (Database & IPFS) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-059 | Hệ thống | ghi nhật ký thao tác cho chức năng "Phân loại tài liệu hồ sơ" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_06 (Database & IPFS) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-060 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Phân loại tài liệu hồ sơ" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_06 (Database & IPFS) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Kiểm tra định dạng tệp

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-061 | Hệ thống | kiểm tra định dạng và dung lượng tệp trước khi tải lên | giảm lỗi lưu trữ và lỗi xem tài liệu | Cao | AI_04 (Backend API) | 1. Chức năng "Kiểm tra định dạng tệp" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-062 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Kiểm tra định dạng tệp" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_04 (Backend API) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-063 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Kiểm tra định dạng tệp" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_04 (Backend API) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-064 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Kiểm tra định dạng tệp" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_04 (Backend API) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-065 | Hệ thống | ghi nhật ký thao tác cho chức năng "Kiểm tra định dạng tệp" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_04 (Backend API) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-066 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Kiểm tra định dạng tệp" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_04 (Backend API) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Xem trước tài liệu đã tải

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-067 | Người dân | xem trước tài liệu trước khi gửi hồ sơ | tôi chắc chắn rằng mình đã tải đúng tệp cần thiết | Cao | AI_07 (Frontend Citizen) | 1. Chức năng "Xem trước tài liệu đã tải" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-068 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Xem trước tài liệu đã tải" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_07 (Frontend Citizen) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-069 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Xem trước tài liệu đã tải" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_07 (Frontend Citizen) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-070 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Xem trước tài liệu đã tải" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_07 (Frontend Citizen) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-071 | Hệ thống | ghi nhật ký thao tác cho chức năng "Xem trước tài liệu đã tải" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_07 (Frontend Citizen) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-072 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Xem trước tài liệu đã tải" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_07 (Frontend Citizen) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Lưu tài liệu lên IPFS

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-073 | Hệ thống | lưu tài liệu hồ sơ trên IPFS và sinh CID | dữ liệu được lưu off-chain nhưng vẫn kiểm chứng được | Rất Cao | AI_06 (Database & IPFS) | 1. Chức năng "Lưu tài liệu lên IPFS" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-074 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Lưu tài liệu lên IPFS" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_06 (Database & IPFS) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-075 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Lưu tài liệu lên IPFS" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_06 (Database & IPFS) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-076 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Lưu tài liệu lên IPFS" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_06 (Database & IPFS) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-077 | Hệ thống | ghi nhật ký thao tác cho chức năng "Lưu tài liệu lên IPFS" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_06 (Database & IPFS) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-078 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Lưu tài liệu lên IPFS" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_06 (Database & IPFS) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Gắn CID với hồ sơ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-079 | Hệ thống | liên kết CID của từng tài liệu với hồ sơ tương ứng | cán bộ có thể truy xuất đúng tài liệu khi thẩm định | Rất Cao | AI_06 (Database & IPFS) | 1. Chức năng "Gắn CID với hồ sơ" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-080 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Gắn CID với hồ sơ" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_06 (Database & IPFS) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-081 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Gắn CID với hồ sơ" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_06 (Database & IPFS) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-082 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Gắn CID với hồ sơ" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_06 (Database & IPFS) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-083 | Hệ thống | ghi nhật ký thao tác cho chức năng "Gắn CID với hồ sơ" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_06 (Database & IPFS) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-084 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Gắn CID với hồ sơ" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_06 (Database & IPFS) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Thay thế tài liệu sai

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-085 | Người dân | thay thế tài liệu đã tải trước khi hồ sơ được duyệt | tôi có thể sửa lỗi hồ sơ mà không phải tạo lại từ đầu | Cao | AI_07 (Frontend Citizen) | 1. Chức năng "Thay thế tài liệu sai" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-086 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Thay thế tài liệu sai" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_07 (Frontend Citizen) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-087 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Thay thế tài liệu sai" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_07 (Frontend Citizen) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-088 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Thay thế tài liệu sai" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_07 (Frontend Citizen) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-089 | Hệ thống | ghi nhật ký thao tác cho chức năng "Thay thế tài liệu sai" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_07 (Frontend Citizen) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-090 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Thay thế tài liệu sai" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_07 (Frontend Citizen) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Kiểm tra tính toàn vẹn tệp

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-091 | Hệ thống | đối chiếu CID và metadata của tài liệu sau khi lưu | hệ thống bảo đảm tài liệu không bị thay đổi ngoài ý muốn | Cao | AI_15 (Compliance) | 1. Chức năng "Kiểm tra tính toàn vẹn tệp" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-092 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Kiểm tra tính toàn vẹn tệp" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_15 (Compliance) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-093 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Kiểm tra tính toàn vẹn tệp" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_15 (Compliance) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-094 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Kiểm tra tính toàn vẹn tệp" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_15 (Compliance) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-095 | Hệ thống | ghi nhật ký thao tác cho chức năng "Kiểm tra tính toàn vẹn tệp" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_15 (Compliance) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-096 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Kiểm tra tính toàn vẹn tệp" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_15 (Compliance) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

### Epic 3: Đăng ký đất đai lần đầu

#### Feature: Khai báo thông tin thửa đất

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-103 | Người dân | nhập thông tin thửa đất và hiện trạng sử dụng | cơ quan quản lý có đủ dữ liệu để xem xét | Rất Cao | AI_07 (Frontend Citizen) | 1. Chức năng "Khai báo thông tin thửa đất" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-104 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Khai báo thông tin thửa đất" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_07 (Frontend Citizen) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-105 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Khai báo thông tin thửa đất" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_07 (Frontend Citizen) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-106 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Khai báo thông tin thửa đất" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_07 (Frontend Citizen) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-107 | Hệ thống | ghi nhật ký thao tác cho chức năng "Khai báo thông tin thửa đất" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_07 (Frontend Citizen) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-108 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Khai báo thông tin thửa đất" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_07 (Frontend Citizen) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Khai báo thông tin chủ sử dụng

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-109 | Người dân | nhập thông tin chủ sử dụng hoặc đồng sở hữu | hồ sơ phản ánh đúng chủ thể liên quan | Rất Cao | AI_07 (Frontend Citizen) | 1. Chức năng "Khai báo thông tin chủ sử dụng" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-110 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Khai báo thông tin chủ sử dụng" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_07 (Frontend Citizen) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-111 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Khai báo thông tin chủ sử dụng" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_07 (Frontend Citizen) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-112 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Khai báo thông tin chủ sử dụng" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_07 (Frontend Citizen) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-113 | Hệ thống | ghi nhật ký thao tác cho chức năng "Khai báo thông tin chủ sử dụng" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_07 (Frontend Citizen) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-114 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Khai báo thông tin chủ sử dụng" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_07 (Frontend Citizen) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Lưu nháp hồ sơ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-115 | Người dân | lưu nháp hồ sơ đang điền | tôi có thể hoàn tất hồ sơ theo nhiều lần | Cao | AI_04 (Backend API) | 1. Chức năng "Lưu nháp hồ sơ" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-116 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Lưu nháp hồ sơ" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_04 (Backend API) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-117 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Lưu nháp hồ sơ" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_04 (Backend API) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-118 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Lưu nháp hồ sơ" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_04 (Backend API) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-119 | Hệ thống | ghi nhật ký thao tác cho chức năng "Lưu nháp hồ sơ" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_04 (Backend API) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-120 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Lưu nháp hồ sơ" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_04 (Backend API) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Kiểm tra dữ liệu bắt buộc

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-121 | Hệ thống | kiểm tra các trường bắt buộc trước khi cho phép gửi hồ sơ | giảm số hồ sơ bị trả lại do thiếu dữ liệu cơ bản | Rất Cao | AI_04 (Backend API) | 1. Chức năng "Kiểm tra dữ liệu bắt buộc" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-122 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Kiểm tra dữ liệu bắt buộc" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_04 (Backend API) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-123 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Kiểm tra dữ liệu bắt buộc" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_04 (Backend API) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-124 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Kiểm tra dữ liệu bắt buộc" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_04 (Backend API) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-125 | Hệ thống | ghi nhật ký thao tác cho chức năng "Kiểm tra dữ liệu bắt buộc" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_04 (Backend API) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-126 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Kiểm tra dữ liệu bắt buộc" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_04 (Backend API) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

---

## Sprint 3

**Mục tiêu:** Hoàn thiện tạo/gửi hồ sơ và luồng duyệt sơ bộ: danh sách hồ sơ, xử lý, trạng thái, yêu cầu bổ sung.

**Số lượng backlog:** 72 user stories/tasks. Mức ưu tiên: Rất Cao 28, Cao 32, Trung Bình 12, Thấp 0.

### Tổng hợp sprint

| Nhóm | Số lượng |
|---|---:|
| Epic 3: Đăng ký đất đai lần đầu | 24 |
| Epic 4: Duyệt hồ sơ | 48 |

**Agent tham gia chính:** AI_08 (Frontend Admin) (30), AI_04 (Backend API) (24), AI_07 (Frontend Citizen) (12), AI_06 (Database & IPFS) (6)

### Sprint 3 progress snapshot (2026-05-10, 16:15 ICT)

| Nhóm US Sprint 3 (phase hiện tại) | Trạng thái | Verify local | Ghi chú |
|---|---|---|---|
| US-127..132 (Gửi hồ sơ đăng ký) | Done | `POST /registrations`, `POST /registrations/:id/submit`, citizen UI, backend/frontend test pass | Đã merge chain Sprint 3 legal hardening |
| US-145..156 (Danh sách + lọc hồ sơ chờ xử lý) | Done | Officer UI filter/status + legal validation actions đã pass checks | PR #17 đã merge vào `develop` |
| US-157..160 (Xem chi tiết hồ sơ đăng ký) | Done | Stepper/panel chi tiết/action groups + timeline tài liệu (`/document-history`) | PR #16/#17/#18 đã merge |
| US-187..192 (Yêu cầu bổ sung hồ sơ) | Done | Bắt buộc `missingItems` + `deadlineAt`, frontend checklist/deadline tương ứng | Backend + frontend checks pass |
| US-193..198 (Cập nhật trạng thái hồ sơ) | Done | `commune-confirm` bắt buộc `notes` + `evidenceFileId` + audit event | PR #16 đã merge |

### Sprint 1-2-3 US audit snapshot (2026-05-10, sau merge chain legal hardening)

| Sprint | Done | Partial | Missing | Tổng US | % Có đáp ứng (Done+Partial) |
|---|---:|---:|---:|---:|---:|
| Sprint 1 | 90 | 0 | 0 | 90 | 100% |
| Sprint 2 | 72 | 0 | 0 | 72 | 100% |
| Sprint 3 | 72 | 0 | 0 | 72 | 100% |

- Báo cáo chi tiết từng US: [docs/12-us-audit-sprint1-3.md](./12-us-audit-sprint1-3.md).
- Kế hoạch bù thiếu/đóng gap: [docs/13-us-gap-remediation-plan.md](./13-us-gap-remediation-plan.md).
- Lưu ý: Wave legal hardening Sprint 3 đã đóng sau chuỗi PR #16 -> #17 -> #18 merge vào `develop` và checks pass.

### Epic 3: Đăng ký đất đai lần đầu

#### Feature: Tạo hồ sơ đăng ký mới

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-097 | Người dân | khởi tạo một hồ sơ đăng ký đất đai lần đầu | tôi có thể bắt đầu quy trình đăng ký trực tuyến | Rất Cao | AI_07 (Frontend Citizen) | 1. Chức năng "Tạo hồ sơ đăng ký mới" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-098 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Tạo hồ sơ đăng ký mới" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_07 (Frontend Citizen) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-099 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Tạo hồ sơ đăng ký mới" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_07 (Frontend Citizen) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-100 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Tạo hồ sơ đăng ký mới" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_07 (Frontend Citizen) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-101 | Hệ thống | ghi nhật ký thao tác cho chức năng "Tạo hồ sơ đăng ký mới" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_07 (Frontend Citizen) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-102 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Tạo hồ sơ đăng ký mới" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_07 (Frontend Citizen) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Gửi hồ sơ đăng ký

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-127 | Người dân | gửi hồ sơ sau khi hoàn tất khai báo và tài liệu | cán bộ có thể tiếp nhận xử lý chính thức | Rất Cao | AI_04 (Backend API) | 1. Chức năng "Gửi hồ sơ đăng ký" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-128 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Gửi hồ sơ đăng ký" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_04 (Backend API) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-129 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Gửi hồ sơ đăng ký" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_04 (Backend API) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-130 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Gửi hồ sơ đăng ký" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_04 (Backend API) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-131 | Hệ thống | ghi nhật ký thao tác cho chức năng "Gửi hồ sơ đăng ký" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_04 (Backend API) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-132 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Gửi hồ sơ đăng ký" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_04 (Backend API) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Sinh mã hồ sơ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-133 | Hệ thống | gán mã hồ sơ duy nhất cho mỗi lượt đăng ký | mọi bên có thể theo dõi hồ sơ thống nhất | Rất Cao | AI_06 (Database & IPFS) | 1. Chức năng "Sinh mã hồ sơ" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-134 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Sinh mã hồ sơ" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_06 (Database & IPFS) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-135 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Sinh mã hồ sơ" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_06 (Database & IPFS) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-136 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Sinh mã hồ sơ" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_06 (Database & IPFS) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-137 | Hệ thống | ghi nhật ký thao tác cho chức năng "Sinh mã hồ sơ" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_06 (Database & IPFS) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-138 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Sinh mã hồ sơ" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_06 (Database & IPFS) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Xem lịch sử chỉnh sửa hồ sơ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-139 | Người dân | xem các lần cập nhật hồ sơ trước khi nộp | tôi có thể kiểm tra lại nội dung đã thay đổi | Trung Bình | AI_07 (Frontend Citizen) | 1. Chức năng "Xem lịch sử chỉnh sửa hồ sơ" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-140 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Xem lịch sử chỉnh sửa hồ sơ" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Trung Bình | AI_07 (Frontend Citizen) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-141 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Xem lịch sử chỉnh sửa hồ sơ" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Trung Bình | AI_07 (Frontend Citizen) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-142 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Xem lịch sử chỉnh sửa hồ sơ" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Trung Bình | AI_07 (Frontend Citizen) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-143 | Hệ thống | ghi nhật ký thao tác cho chức năng "Xem lịch sử chỉnh sửa hồ sơ" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Trung Bình | AI_07 (Frontend Citizen) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-144 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Xem lịch sử chỉnh sửa hồ sơ" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Trung Bình | AI_07 (Frontend Citizen) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

### Epic 4: Duyệt hồ sơ

#### Feature: Danh sách hồ sơ chờ xử lý

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-145 | Công chức UBND cấp xã/phường phụ trách đất đai | xem danh sách hồ sơ chờ tiếp nhận và xử lý | tôi có thể lập thứ tự xử lý hồ sơ hiệu quả | Rất Cao | AI_08 (Frontend Admin) | 1. Chức năng "Danh sách hồ sơ chờ xử lý" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-146 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Danh sách hồ sơ chờ xử lý" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_08 (Frontend Admin) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-147 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Danh sách hồ sơ chờ xử lý" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_08 (Frontend Admin) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-148 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Danh sách hồ sơ chờ xử lý" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_08 (Frontend Admin) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-149 | Hệ thống | ghi nhật ký thao tác cho chức năng "Danh sách hồ sơ chờ xử lý" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_08 (Frontend Admin) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-150 | Công chức UBND cấp xã/phường phụ trách đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Danh sách hồ sơ chờ xử lý" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_08 (Frontend Admin) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Xem chi tiết hồ sơ đăng ký

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-157 | Công chức UBND cấp xã/phường phụ trách đất đai | mở chi tiết một hồ sơ để xem dữ liệu và tài liệu đính kèm | tôi có cơ sở để thẩm định hồ sơ | Rất Cao | AI_08 (Frontend Admin) | 1. Chức năng "Xem chi tiết hồ sơ đăng ký" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-158 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Xem chi tiết hồ sơ đăng ký" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_08 (Frontend Admin) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-159 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Xem chi tiết hồ sơ đăng ký" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_08 (Frontend Admin) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-160 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Xem chi tiết hồ sơ đăng ký" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_08 (Frontend Admin) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-161 | Hệ thống | ghi nhật ký thao tác cho chức năng "Xem chi tiết hồ sơ đăng ký" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_08 (Frontend Admin) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-162 | Công chức UBND cấp xã/phường phụ trách đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Xem chi tiết hồ sơ đăng ký" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_08 (Frontend Admin) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Phân công cán bộ xử lý

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-163 | Cán bộ Sở Nông nghiệp và Môi trường | phân công hồ sơ cho đúng cán bộ hoặc đơn vị phụ trách | quy trình xử lý không bị chồng chéo | Cao | AI_08 (Frontend Admin) | 1. Chức năng "Phân công cán bộ xử lý" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-164 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Phân công cán bộ xử lý" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_08 (Frontend Admin) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-165 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Phân công cán bộ xử lý" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_08 (Frontend Admin) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-166 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Phân công cán bộ xử lý" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_08 (Frontend Admin) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-167 | Hệ thống | ghi nhật ký thao tác cho chức năng "Phân công cán bộ xử lý" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_08 (Frontend Admin) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-168 | Cán bộ Sở Nông nghiệp và Môi trường | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Phân công cán bộ xử lý" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_08 (Frontend Admin) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Ghi chú nội bộ khi thẩm định

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-169 | Công chức UBND cấp xã/phường phụ trách đất đai | ghi chú các nhận xét nội bộ trong quá trình xem hồ sơ | tôi có thể phối hợp với cán bộ khác dễ hơn | Trung Bình | AI_04 (Backend API) | 1. Chức năng "Ghi chú nội bộ khi thẩm định" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-170 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Ghi chú nội bộ khi thẩm định" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Trung Bình | AI_04 (Backend API) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-171 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Ghi chú nội bộ khi thẩm định" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Trung Bình | AI_04 (Backend API) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-172 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Ghi chú nội bộ khi thẩm định" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Trung Bình | AI_04 (Backend API) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-173 | Hệ thống | ghi nhật ký thao tác cho chức năng "Ghi chú nội bộ khi thẩm định" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Trung Bình | AI_04 (Backend API) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-174 | Công chức UBND cấp xã/phường phụ trách đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Ghi chú nội bộ khi thẩm định" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Trung Bình | AI_04 (Backend API) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Từ chối hồ sơ có lý do

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-181 | Công chức UBND cấp xã/phường phụ trách đất đai | từ chối hồ sơ và nhập rõ lý do từ chối | người dân biết cần sửa hoặc bổ sung nội dung nào | Rất Cao | AI_08 (Frontend Admin) | 1. Chức năng "Từ chối hồ sơ có lý do" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-182 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Từ chối hồ sơ có lý do" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_08 (Frontend Admin) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-183 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Từ chối hồ sơ có lý do" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_08 (Frontend Admin) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-184 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Từ chối hồ sơ có lý do" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_08 (Frontend Admin) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-185 | Hệ thống | ghi nhật ký thao tác cho chức năng "Từ chối hồ sơ có lý do" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_08 (Frontend Admin) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-186 | Công chức UBND cấp xã/phường phụ trách đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Từ chối hồ sơ có lý do" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_08 (Frontend Admin) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Yêu cầu bổ sung hồ sơ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-187 | Công chức UBND cấp xã/phường phụ trách đất đai | gửi yêu cầu bổ sung giấy tờ hoặc dữ liệu chưa đầy đủ | người dân có thể hoàn thiện hồ sơ thay vì nộp lại từ đầu | Cao | AI_04 (Backend API) | 1. Chức năng "Yêu cầu bổ sung hồ sơ" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-188 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Yêu cầu bổ sung hồ sơ" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_04 (Backend API) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-189 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Yêu cầu bổ sung hồ sơ" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_04 (Backend API) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-190 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Yêu cầu bổ sung hồ sơ" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_04 (Backend API) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-191 | Hệ thống | ghi nhật ký thao tác cho chức năng "Yêu cầu bổ sung hồ sơ" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_04 (Backend API) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-192 | Công chức UBND cấp xã/phường phụ trách đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Yêu cầu bổ sung hồ sơ" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_04 (Backend API) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Cập nhật trạng thái hồ sơ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-193 | Hệ thống | cập nhật trạng thái hồ sơ theo từng bước xử lý | mọi bên theo dõi được tiến độ thực tế | Rất Cao | AI_04 (Backend API) | 1. Chức năng "Cập nhật trạng thái hồ sơ" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-194 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Cập nhật trạng thái hồ sơ" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_04 (Backend API) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-195 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Cập nhật trạng thái hồ sơ" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_04 (Backend API) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-196 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Cập nhật trạng thái hồ sơ" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_04 (Backend API) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-197 | Hệ thống | ghi nhật ký thao tác cho chức năng "Cập nhật trạng thái hồ sơ" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_04 (Backend API) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-198 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Cập nhật trạng thái hồ sơ" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_04 (Backend API) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Thông báo kết quả xử lý

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-199 | Hệ thống | gửi thông báo khi hồ sơ được duyệt, từ chối hoặc yêu cầu bổ sung | người dùng nhận được phản hồi kịp thời | Cao | AI_08 (Frontend Admin) | 1. Chức năng "Thông báo kết quả xử lý" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-200 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Thông báo kết quả xử lý" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_08 (Frontend Admin) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-201 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Thông báo kết quả xử lý" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_08 (Frontend Admin) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-202 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Thông báo kết quả xử lý" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_08 (Frontend Admin) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-203 | Hệ thống | ghi nhật ký thao tác cho chức năng "Thông báo kết quả xử lý" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_08 (Frontend Admin) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-204 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Thông báo kết quả xử lý" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_08 (Frontend Admin) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

---

## Sprint 4

**Mục tiêu:** Phê duyệt và ghi nhận blockchain đăng ký đất: mint bản ghi quyền sử dụng đất, event, tx hash, test đăng ký.

**Số lượng backlog:** 78 user stories/tasks. Mức ưu tiên: Rất Cao 34, Cao 44, Trung Bình 0, Thấp 0.

### Tổng hợp sprint

| Nhóm | Số lượng |
|---|---:|
| Epic 4: Duyệt hồ sơ | 12 |
| Epic 5: Ghi nhận blockchain | 48 |
| Epic 10: Audit, Security & Compliance | 6 |
| Epic 11: QA & Test | 12 |

**Agent tham gia chính:** AI_02 (Blockchain Core Dev) (30), AI_04 (Backend API) (12), AI_08 (Frontend Admin) (6), AI_03 (Smart Contract Auditor) (6), AI_07 (Frontend Citizen) (6), AI_15 (Compliance) (6), AI_11 (QA Unit) (6), AI_12 (QA E2E) (6)

### Epic 4: Duyệt hồ sơ

#### Feature: Bộ lọc hồ sơ theo trạng thái

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-151 | Công chức UBND cấp xã/phường phụ trách đất đai | lọc hồ sơ theo trạng thái và thời gian nộp | tôi có thể ưu tiên đúng nhóm hồ sơ cần xử lý | Cao | AI_08 (Frontend Admin) | 1. Chức năng "Bộ lọc hồ sơ theo trạng thái" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-152 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Bộ lọc hồ sơ theo trạng thái" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_08 (Frontend Admin) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-153 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Bộ lọc hồ sơ theo trạng thái" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_08 (Frontend Admin) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-154 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Bộ lọc hồ sơ theo trạng thái" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_08 (Frontend Admin) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-155 | Hệ thống | ghi nhật ký thao tác cho chức năng "Bộ lọc hồ sơ theo trạng thái" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_08 (Frontend Admin) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-156 | Công chức UBND cấp xã/phường phụ trách đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Bộ lọc hồ sơ theo trạng thái" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_08 (Frontend Admin) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Phê duyệt hồ sơ hợp lệ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-175 | Công chức UBND cấp xã/phường phụ trách đất đai | duyệt hồ sơ đáp ứng đủ điều kiện | hồ sơ được chuyển sang bước ghi nhận blockchain | Rất Cao | AI_04 (Backend API) | 1. Chức năng "Phê duyệt hồ sơ hợp lệ" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-176 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Phê duyệt hồ sơ hợp lệ" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_04 (Backend API) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-177 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Phê duyệt hồ sơ hợp lệ" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_04 (Backend API) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-178 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Phê duyệt hồ sơ hợp lệ" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_04 (Backend API) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-179 | Hệ thống | ghi nhật ký thao tác cho chức năng "Phê duyệt hồ sơ hợp lệ" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_04 (Backend API) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-180 | Công chức UBND cấp xã/phường phụ trách đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Phê duyệt hồ sơ hợp lệ" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_04 (Backend API) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

### Epic 5: Ghi nhận blockchain

#### Feature: Ánh xạ ví cho người dùng

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-205 | Hệ thống | ánh xạ hoặc tạo địa chỉ ví duy nhất cho người dùng hợp lệ | các giao dịch blockchain được gắn với đúng chủ thể | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Chức năng "Ánh xạ ví cho người dùng" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-206 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Ánh xạ ví cho người dùng" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-207 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Ánh xạ ví cho người dùng" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-208 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Ánh xạ ví cho người dùng" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-209 | Hệ thống | ghi nhật ký thao tác cho chức năng "Ánh xạ ví cho người dùng" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_02 (Blockchain Core Dev) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-210 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Ánh xạ ví cho người dùng" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_02 (Blockchain Core Dev) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Ghi nhận quyền sử dụng đất mới

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-211 | Cán bộ Văn phòng Đăng ký đất đai/Chi nhánh Văn phòng Đăng ký đất đai | kích hoạt smart contract để ghi nhận quyền sử dụng đất sau khi hồ sơ được duyệt | quyền sử dụng đất được lưu vết minh bạch trên testnet | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Chức năng "Ghi nhận quyền sử dụng đất mới" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-212 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Ghi nhận quyền sử dụng đất mới" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-213 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Ghi nhận quyền sử dụng đất mới" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-214 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Ghi nhận quyền sử dụng đất mới" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-215 | Hệ thống | ghi nhật ký thao tác cho chức năng "Ghi nhận quyền sử dụng đất mới" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_02 (Blockchain Core Dev) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-216 | Cán bộ Văn phòng Đăng ký đất đai/Chi nhánh Văn phòng Đăng ký đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Ghi nhận quyền sử dụng đất mới" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_02 (Blockchain Core Dev) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Mint token/bản ghi đại diện

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-217 | Hệ thống | mint token hoặc bản ghi on-chain đại diện cho quyền sử dụng đất | hệ thống có đối tượng blockchain để truy vết sở hữu | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Chức năng "Mint token/bản ghi đại diện" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-218 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Mint token/bản ghi đại diện" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-219 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Mint token/bản ghi đại diện" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-220 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Mint token/bản ghi đại diện" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-221 | Hệ thống | ghi nhật ký thao tác cho chức năng "Mint token/bản ghi đại diện" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_02 (Blockchain Core Dev) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-222 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Mint token/bản ghi đại diện" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_02 (Blockchain Core Dev) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Lưu metadata thửa đất

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-223 | Hệ thống | lưu metadata cơ bản và CID tài liệu liên quan cùng bản ghi blockchain | dữ liệu on-chain và off-chain được liên kết chặt chẽ | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Chức năng "Lưu metadata thửa đất" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-224 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Lưu metadata thửa đất" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-225 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Lưu metadata thửa đất" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-226 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Lưu metadata thửa đất" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-227 | Hệ thống | ghi nhật ký thao tác cho chức năng "Lưu metadata thửa đất" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_02 (Blockchain Core Dev) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-228 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Lưu metadata thửa đất" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_02 (Blockchain Core Dev) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Phát event khi mint thành công

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-229 | Hệ thống | phát event blockchain sau khi ghi nhận thành công | hệ thống và dashboard có thể đồng bộ lịch sử giao dịch | Cao | AI_02 (Blockchain Core Dev) | 1. Chức năng "Phát event khi mint thành công" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-230 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Phát event khi mint thành công" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_02 (Blockchain Core Dev) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-231 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Phát event khi mint thành công" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_02 (Blockchain Core Dev) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-232 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Phát event khi mint thành công" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_02 (Blockchain Core Dev) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-233 | Hệ thống | ghi nhật ký thao tác cho chức năng "Phát event khi mint thành công" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_02 (Blockchain Core Dev) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-234 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Phát event khi mint thành công" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_02 (Blockchain Core Dev) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Ngăn trùng lặp bản ghi sở hữu

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-235 | Hệ thống | kiểm tra và chặn việc mint trùng cho cùng một thửa đất không hợp lệ | dữ liệu sở hữu không bị sai lệch | Rất Cao | AI_03 (Smart Contract Auditor) | 1. Chức năng "Ngăn trùng lặp bản ghi sở hữu" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-236 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Ngăn trùng lặp bản ghi sở hữu" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_03 (Smart Contract Auditor) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-237 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Ngăn trùng lặp bản ghi sở hữu" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_03 (Smart Contract Auditor) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-238 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Ngăn trùng lặp bản ghi sở hữu" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_03 (Smart Contract Auditor) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-239 | Hệ thống | ghi nhật ký thao tác cho chức năng "Ngăn trùng lặp bản ghi sở hữu" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_03 (Smart Contract Auditor) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-240 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Ngăn trùng lặp bản ghi sở hữu" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_03 (Smart Contract Auditor) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Đồng bộ trạng thái on-chain và off-chain

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-241 | Hệ thống | đồng bộ kết quả giao dịch blockchain về CSDL nghiệp vụ | người dùng nhìn thấy trạng thái xử lý thống nhất | Rất Cao | AI_04 (Backend API) | 1. Chức năng "Đồng bộ trạng thái on-chain và off-chain" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-242 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Đồng bộ trạng thái on-chain và off-chain" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_04 (Backend API) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-243 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Đồng bộ trạng thái on-chain và off-chain" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_04 (Backend API) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-244 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Đồng bộ trạng thái on-chain và off-chain" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_04 (Backend API) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-245 | Hệ thống | ghi nhật ký thao tác cho chức năng "Đồng bộ trạng thái on-chain và off-chain" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_04 (Backend API) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-246 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Đồng bộ trạng thái on-chain và off-chain" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_04 (Backend API) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Hiển thị mã giao dịch blockchain

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-247 | Người dân | xem mã giao dịch blockchain gắn với hồ sơ của tôi | tôi có bằng chứng tra cứu minh bạch | Cao | AI_07 (Frontend Citizen) | 1. Chức năng "Hiển thị mã giao dịch blockchain" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-248 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Hiển thị mã giao dịch blockchain" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_07 (Frontend Citizen) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-249 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Hiển thị mã giao dịch blockchain" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_07 (Frontend Citizen) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-250 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Hiển thị mã giao dịch blockchain" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_07 (Frontend Citizen) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-251 | Hệ thống | ghi nhật ký thao tác cho chức năng "Hiển thị mã giao dịch blockchain" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_07 (Frontend Citizen) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-252 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Hiển thị mã giao dịch blockchain" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_07 (Frontend Citizen) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

### Epic 10: Audit, Security & Compliance

#### Feature: Nhật ký giao dịch blockchain

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-439 | Cán bộ Sở Nông nghiệp và Môi trường | xem nhật ký các giao dịch blockchain liên quan đến hồ sơ | tôi có thể đối chiếu on-chain và off-chain | Cao | AI_15 (Compliance) | 1. Chức năng "Nhật ký giao dịch blockchain" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-440 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Nhật ký giao dịch blockchain" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_15 (Compliance) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-441 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Nhật ký giao dịch blockchain" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_15 (Compliance) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-442 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Nhật ký giao dịch blockchain" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_15 (Compliance) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-443 | Hệ thống | ghi nhật ký thao tác cho chức năng "Nhật ký giao dịch blockchain" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_15 (Compliance) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-444 | Cán bộ Sở Nông nghiệp và Môi trường | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Nhật ký giao dịch blockchain" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_15 (Compliance) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

### Epic 11: QA & Test

#### Feature: Unit test smart contract đăng ký

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-475 | Nhóm QA | có bộ unit test cho luồng đăng ký đất đai | nhóm xác minh logic contract trước khi tích hợp | Rất Cao | AI_11 (QA Unit) | 1. Deliverable của "Unit test smart contract đăng ký" được tạo đầy đủ. 2. Có thể chạy hoặc kiểm tra được trên môi trường dự án. |
| US-476 | Hệ thống | chuẩn hóa cấu hình, tham số và phụ thuộc của "Unit test smart contract đăng ký" | việc tích hợp với các thành phần khác không bị sai lệch | Rất Cao | AI_11 (QA Unit) | 1. Các phụ thuộc được khai báo rõ ràng. 2. Không phát sinh lỗi cấu hình nghiêm trọng khi tích hợp. |
| US-477 | Nhóm QA | tự động hóa một phần thao tác của "Unit test smart contract đăng ký" | nhóm giảm công việc thủ công lặp lại trong quá trình phát triển | Cao | AI_11 (QA Unit) | 1. Có script hoặc pipeline hỗ trợ. 2. Có thể chạy lặp lại nhiều lần với kết quả ổn định. |
| US-478 | Hệ thống | lưu lại kết quả và log của "Unit test smart contract đăng ký" | nhóm QA và PM có thể theo dõi tình trạng thực thi | Cao | AI_11 (QA Unit) | 1. Có log hoặc báo cáo đầu ra. 2. Log đủ để xác định bước nào thành công hoặc thất bại. |
| US-479 | Nhóm QA | kiểm tra đầu ra của "Unit test smart contract đăng ký" theo tiêu chí chấp nhận đã định | nhóm phát hiện sớm lỗi kỹ thuật trước khi demo | Rất Cao | AI_11 (QA Unit) | 1. Có checklist hoặc test case. 2. Kết quả pass/fail được ghi nhận rõ ràng. |
| US-480 | Nhóm QA | xử lý lỗi hoặc tình huống ngoại lệ của "Unit test smart contract đăng ký" | hệ thống hoặc quy trình kỹ thuật không bị gián đoạn toàn phần | Cao | AI_11 (QA Unit) | 1. Có cơ chế cảnh báo khi lỗi xảy ra. 2. Có phương án retry hoặc fallback ở mức phù hợp. |

#### Feature: Kiểm thử tích hợp end-to-end đăng ký

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-493 | Nhóm QA | kiểm thử toàn bộ luồng nộp hồ sơ đến ghi nhận blockchain | nhóm chứng minh được hệ thống chạy end-to-end | Rất Cao | AI_12 (QA E2E) | 1. Deliverable của "Kiểm thử tích hợp end-to-end đăng ký" được tạo đầy đủ. 2. Có thể chạy hoặc kiểm tra được trên môi trường dự án. |
| US-494 | Hệ thống | chuẩn hóa cấu hình, tham số và phụ thuộc của "Kiểm thử tích hợp end-to-end đăng ký" | việc tích hợp với các thành phần khác không bị sai lệch | Rất Cao | AI_12 (QA E2E) | 1. Các phụ thuộc được khai báo rõ ràng. 2. Không phát sinh lỗi cấu hình nghiêm trọng khi tích hợp. |
| US-495 | Nhóm QA | tự động hóa một phần thao tác của "Kiểm thử tích hợp end-to-end đăng ký" | nhóm giảm công việc thủ công lặp lại trong quá trình phát triển | Cao | AI_12 (QA E2E) | 1. Có script hoặc pipeline hỗ trợ. 2. Có thể chạy lặp lại nhiều lần với kết quả ổn định. |
| US-496 | Hệ thống | lưu lại kết quả và log của "Kiểm thử tích hợp end-to-end đăng ký" | nhóm QA và PM có thể theo dõi tình trạng thực thi | Cao | AI_12 (QA E2E) | 1. Có log hoặc báo cáo đầu ra. 2. Log đủ để xác định bước nào thành công hoặc thất bại. |
| US-497 | Nhóm QA | kiểm tra đầu ra của "Kiểm thử tích hợp end-to-end đăng ký" theo tiêu chí chấp nhận đã định | nhóm phát hiện sớm lỗi kỹ thuật trước khi demo | Rất Cao | AI_12 (QA E2E) | 1. Có checklist hoặc test case. 2. Kết quả pass/fail được ghi nhận rõ ràng. |
| US-498 | Nhóm QA | xử lý lỗi hoặc tình huống ngoại lệ của "Kiểm thử tích hợp end-to-end đăng ký" | hệ thống hoặc quy trình kỹ thuật không bị gián đoạn toàn phần | Cao | AI_12 (QA E2E) | 1. Có cơ chế cảnh báo khi lỗi xảy ra. 2. Có phương án retry hoặc fallback ở mức phù hợp. |

---

## Sprint 5

**Mục tiêu:** Tra cứu và lịch sử: tra cứu thửa đất, hồ sơ, lịch sử giao dịch; dashboard tra cứu cốt lõi.

**Số lượng backlog:** 60 user stories/tasks. Mức ưu tiên: Rất Cao 8, Cao 34, Trung Bình 18, Thấp 0.

### Tổng hợp sprint

| Nhóm | Số lượng |
|---|---:|
| Epic 6: Tra cứu & Lịch sử | 42 |
| Epic 9: Dashboard & Báo cáo | 18 |

**Agent tham gia chính:** AI_08 (Frontend Admin) (36), AI_07 (Frontend Citizen) (18), AI_14 (Tech Writer) (6)

### Epic 6: Tra cứu & Lịch sử

#### Feature: Tra cứu bằng mã hồ sơ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-253 | Người dân | tra cứu hồ sơ bằng mã hồ sơ | tôi kiểm tra được trạng thái xử lý hiện tại | Rất Cao | AI_07 (Frontend Citizen) | 1. Chức năng "Tra cứu bằng mã hồ sơ" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-254 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Tra cứu bằng mã hồ sơ" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_07 (Frontend Citizen) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-255 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Tra cứu bằng mã hồ sơ" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_07 (Frontend Citizen) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-256 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Tra cứu bằng mã hồ sơ" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_07 (Frontend Citizen) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-257 | Hệ thống | ghi nhật ký thao tác cho chức năng "Tra cứu bằng mã hồ sơ" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_07 (Frontend Citizen) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-258 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Tra cứu bằng mã hồ sơ" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_07 (Frontend Citizen) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Tra cứu bằng mã thửa đất

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-259 | Người dân | tra cứu thông tin cơ bản của thửa đất bằng mã định danh | tôi có thể xem thông tin thửa đất cần quan tâm | Rất Cao | AI_07 (Frontend Citizen) | 1. Chức năng "Tra cứu bằng mã thửa đất" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-260 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Tra cứu bằng mã thửa đất" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_07 (Frontend Citizen) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-261 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Tra cứu bằng mã thửa đất" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_07 (Frontend Citizen) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-262 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Tra cứu bằng mã thửa đất" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_07 (Frontend Citizen) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-263 | Hệ thống | ghi nhật ký thao tác cho chức năng "Tra cứu bằng mã thửa đất" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_07 (Frontend Citizen) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-264 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Tra cứu bằng mã thửa đất" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_07 (Frontend Citizen) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Tra cứu lịch sử giao dịch

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-265 | Người dân | xem lịch sử đăng ký và chuyển nhượng của thửa đất | tôi có thể kiểm tra tính minh bạch của dữ liệu | Cao | AI_08 (Frontend Admin) | 1. Chức năng "Tra cứu lịch sử giao dịch" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-266 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Tra cứu lịch sử giao dịch" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_08 (Frontend Admin) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-267 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Tra cứu lịch sử giao dịch" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_08 (Frontend Admin) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-268 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Tra cứu lịch sử giao dịch" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_08 (Frontend Admin) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-269 | Hệ thống | ghi nhật ký thao tác cho chức năng "Tra cứu lịch sử giao dịch" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_08 (Frontend Admin) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-270 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Tra cứu lịch sử giao dịch" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_08 (Frontend Admin) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Tra cứu theo chủ sử dụng

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-271 | Cán bộ Văn phòng Đăng ký đất đai/Chi nhánh Văn phòng Đăng ký đất đai | tra cứu các hồ sơ và thửa đất theo thông tin chủ sử dụng | tôi tìm kiếm nghiệp vụ nhanh hơn | Cao | AI_08 (Frontend Admin) | 1. Chức năng "Tra cứu theo chủ sử dụng" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-272 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Tra cứu theo chủ sử dụng" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_08 (Frontend Admin) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-273 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Tra cứu theo chủ sử dụng" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_08 (Frontend Admin) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-274 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Tra cứu theo chủ sử dụng" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_08 (Frontend Admin) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-275 | Hệ thống | ghi nhật ký thao tác cho chức năng "Tra cứu theo chủ sử dụng" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_08 (Frontend Admin) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-276 | Cán bộ Văn phòng Đăng ký đất đai/Chi nhánh Văn phòng Đăng ký đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Tra cứu theo chủ sử dụng" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_08 (Frontend Admin) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Dòng thời gian hồ sơ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-277 | Người dân | xem timeline các bước xử lý của hồ sơ | tôi hiểu hồ sơ đã đi qua những bước nào | Cao | AI_07 (Frontend Citizen) | 1. Chức năng "Dòng thời gian hồ sơ" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-278 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Dòng thời gian hồ sơ" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_07 (Frontend Citizen) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-279 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Dòng thời gian hồ sơ" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_07 (Frontend Citizen) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-280 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Dòng thời gian hồ sơ" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_07 (Frontend Citizen) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-281 | Hệ thống | ghi nhật ký thao tác cho chức năng "Dòng thời gian hồ sơ" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_07 (Frontend Citizen) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-282 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Dòng thời gian hồ sơ" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_07 (Frontend Citizen) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Lọc và sắp xếp kết quả tra cứu

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-283 | Cán bộ Sở Nông nghiệp và Môi trường | lọc và sắp xếp kết quả theo trạng thái hoặc thời gian | tôi phân tích dữ liệu thuận tiện hơn | Trung Bình | AI_08 (Frontend Admin) | 1. Chức năng "Lọc và sắp xếp kết quả tra cứu" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-284 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Lọc và sắp xếp kết quả tra cứu" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Trung Bình | AI_08 (Frontend Admin) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-285 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Lọc và sắp xếp kết quả tra cứu" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Trung Bình | AI_08 (Frontend Admin) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-286 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Lọc và sắp xếp kết quả tra cứu" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Trung Bình | AI_08 (Frontend Admin) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-287 | Hệ thống | ghi nhật ký thao tác cho chức năng "Lọc và sắp xếp kết quả tra cứu" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Trung Bình | AI_08 (Frontend Admin) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-288 | Cán bộ Sở Nông nghiệp và Môi trường | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Lọc và sắp xếp kết quả tra cứu" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Trung Bình | AI_08 (Frontend Admin) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Xuất thông tin tra cứu cơ bản

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-289 | Cán bộ Sở Nông nghiệp và Môi trường | xuất dữ liệu tra cứu ở dạng tóm tắt | tôi có thể sử dụng cho báo cáo quản lý | Trung Bình | AI_14 (Tech Writer) | 1. Chức năng "Xuất thông tin tra cứu cơ bản" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-290 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Xuất thông tin tra cứu cơ bản" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Trung Bình | AI_14 (Tech Writer) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-291 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Xuất thông tin tra cứu cơ bản" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Trung Bình | AI_14 (Tech Writer) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-292 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Xuất thông tin tra cứu cơ bản" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Trung Bình | AI_14 (Tech Writer) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-293 | Hệ thống | ghi nhật ký thao tác cho chức năng "Xuất thông tin tra cứu cơ bản" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Trung Bình | AI_14 (Tech Writer) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-294 | Cán bộ Sở Nông nghiệp và Môi trường | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Xuất thông tin tra cứu cơ bản" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Trung Bình | AI_14 (Tech Writer) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

### Epic 9: Dashboard & Báo cáo

#### Feature: Dashboard tổng quan hồ sơ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-397 | Cán bộ Sở Nông nghiệp và Môi trường | xem số lượng hồ sơ theo từng trạng thái xử lý | tôi có góc nhìn tổng quan về hệ thống | Cao | AI_08 (Frontend Admin) | 1. Chức năng "Dashboard tổng quan hồ sơ" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-398 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Dashboard tổng quan hồ sơ" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_08 (Frontend Admin) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-399 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Dashboard tổng quan hồ sơ" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_08 (Frontend Admin) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-400 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Dashboard tổng quan hồ sơ" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_08 (Frontend Admin) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-401 | Hệ thống | ghi nhật ký thao tác cho chức năng "Dashboard tổng quan hồ sơ" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_08 (Frontend Admin) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-402 | Cán bộ Sở Nông nghiệp và Môi trường | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Dashboard tổng quan hồ sơ" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_08 (Frontend Admin) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Dashboard hồ sơ quá hạn

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-403 | Cán bộ Sở Nông nghiệp và Môi trường | xem các hồ sơ xử lý chậm hoặc quá hạn | tôi có thể can thiệp và điều phối nguồn lực | Trung Bình | AI_08 (Frontend Admin) | 1. Chức năng "Dashboard hồ sơ quá hạn" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-404 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Dashboard hồ sơ quá hạn" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Trung Bình | AI_08 (Frontend Admin) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-405 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Dashboard hồ sơ quá hạn" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Trung Bình | AI_08 (Frontend Admin) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-406 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Dashboard hồ sơ quá hạn" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Trung Bình | AI_08 (Frontend Admin) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-407 | Hệ thống | ghi nhật ký thao tác cho chức năng "Dashboard hồ sơ quá hạn" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Trung Bình | AI_08 (Frontend Admin) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-408 | Cán bộ Sở Nông nghiệp và Môi trường | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Dashboard hồ sơ quá hạn" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Trung Bình | AI_08 (Frontend Admin) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Thống kê giao dịch blockchain

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-409 | Cán bộ Sở Nông nghiệp và Môi trường | xem số lượng giao dịch đăng ký và chuyển nhượng đã ghi nhận | tôi đánh giá được hiệu quả của prototype blockchain | Cao | AI_08 (Frontend Admin) | 1. Chức năng "Thống kê giao dịch blockchain" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-410 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Thống kê giao dịch blockchain" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_08 (Frontend Admin) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-411 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Thống kê giao dịch blockchain" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_08 (Frontend Admin) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-412 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Thống kê giao dịch blockchain" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_08 (Frontend Admin) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-413 | Hệ thống | ghi nhật ký thao tác cho chức năng "Thống kê giao dịch blockchain" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_08 (Frontend Admin) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-414 | Cán bộ Sở Nông nghiệp và Môi trường | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Thống kê giao dịch blockchain" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_08 (Frontend Admin) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

---

## Sprint 6

**Mục tiêu:** Chuyển nhượng quyền sử dụng đất: tạo giao dịch, xác nhận, sang tên, test chuyển nhượng và báo cáo đầu ra.

**Số lượng backlog:** 78 user stories/tasks. Mức ưu tiên: Rất Cao 34, Cao 38, Trung Bình 6, Thấp 0.

### Tổng hợp sprint

| Nhóm | Số lượng |
|---|---:|
| Epic 7: Chuyển nhượng quyền sử dụng đất | 60 |
| Epic 9: Dashboard & Báo cáo | 6 |
| Epic 11: QA & Test | 12 |

**Agent tham gia chính:** AI_07 (Frontend Citizen) (18), AI_04 (Backend API) (18), AI_08 (Frontend Admin) (12), AI_02 (Blockchain Core Dev) (6), AI_13 (DevOps) (6), AI_14 (Tech Writer) (6), AI_11 (QA Unit) (6), AI_12 (QA E2E) (6)

### Epic 7: Chuyển nhượng quyền sử dụng đất

#### Feature: Khởi tạo yêu cầu chuyển nhượng

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-295 | Người dân | tạo một yêu cầu chuyển nhượng quyền sử dụng đất | tôi có thể bắt đầu quy trình sang tên trên hệ thống | Rất Cao | AI_07 (Frontend Citizen) | 1. Chức năng "Khởi tạo yêu cầu chuyển nhượng" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-296 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Khởi tạo yêu cầu chuyển nhượng" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_07 (Frontend Citizen) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-297 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Khởi tạo yêu cầu chuyển nhượng" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_07 (Frontend Citizen) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-298 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Khởi tạo yêu cầu chuyển nhượng" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_07 (Frontend Citizen) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-299 | Hệ thống | ghi nhật ký thao tác cho chức năng "Khởi tạo yêu cầu chuyển nhượng" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_07 (Frontend Citizen) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-300 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Khởi tạo yêu cầu chuyển nhượng" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_07 (Frontend Citizen) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Khai báo thông tin bên nhận

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-301 | Người dân | nhập thông tin bên nhận chuyển nhượng | hệ thống có đủ dữ liệu để xử lý giao dịch | Rất Cao | AI_07 (Frontend Citizen) | 1. Chức năng "Khai báo thông tin bên nhận" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-302 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Khai báo thông tin bên nhận" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_07 (Frontend Citizen) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-303 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Khai báo thông tin bên nhận" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_07 (Frontend Citizen) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-304 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Khai báo thông tin bên nhận" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_07 (Frontend Citizen) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-305 | Hệ thống | ghi nhật ký thao tác cho chức năng "Khai báo thông tin bên nhận" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_07 (Frontend Citizen) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-306 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Khai báo thông tin bên nhận" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_07 (Frontend Citizen) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Kiểm tra chủ sở hữu hiện tại

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-307 | Hệ thống | xác minh người gửi yêu cầu là chủ sở hữu hợp lệ trên hệ thống | ngăn chặn yêu cầu chuyển nhượng không hợp lệ | Rất Cao | AI_04 (Backend API) | 1. Chức năng "Kiểm tra chủ sở hữu hiện tại" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-308 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Kiểm tra chủ sở hữu hiện tại" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_04 (Backend API) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-309 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Kiểm tra chủ sở hữu hiện tại" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_04 (Backend API) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-310 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Kiểm tra chủ sở hữu hiện tại" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_04 (Backend API) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-311 | Hệ thống | ghi nhật ký thao tác cho chức năng "Kiểm tra chủ sở hữu hiện tại" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_04 (Backend API) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-312 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Kiểm tra chủ sở hữu hiện tại" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_04 (Backend API) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Tải hồ sơ chuyển nhượng

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-313 | Người dân | tải các tài liệu liên quan đến chuyển nhượng lên hệ thống | cán bộ có thể xem xét hồ sơ giao dịch | Rất Cao | AI_07 (Frontend Citizen) | 1. Chức năng "Tải hồ sơ chuyển nhượng" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-314 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Tải hồ sơ chuyển nhượng" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_07 (Frontend Citizen) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-315 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Tải hồ sơ chuyển nhượng" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_07 (Frontend Citizen) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-316 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Tải hồ sơ chuyển nhượng" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_07 (Frontend Citizen) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-317 | Hệ thống | ghi nhật ký thao tác cho chức năng "Tải hồ sơ chuyển nhượng" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_07 (Frontend Citizen) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-318 | Người dân | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Tải hồ sơ chuyển nhượng" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_07 (Frontend Citizen) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Xác nhận thông tin bên nhận

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-319 | Doanh nghiệp | xác nhận thông tin giao dịch với vai trò bên nhận chuyển nhượng | giao dịch chỉ tiếp tục khi các bên cùng đồng thuận | Cao | AI_04 (Backend API) | 1. Chức năng "Xác nhận thông tin bên nhận" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-320 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Xác nhận thông tin bên nhận" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_04 (Backend API) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-321 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Xác nhận thông tin bên nhận" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_04 (Backend API) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-322 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Xác nhận thông tin bên nhận" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_04 (Backend API) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-323 | Hệ thống | ghi nhật ký thao tác cho chức năng "Xác nhận thông tin bên nhận" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_04 (Backend API) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-324 | Doanh nghiệp | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Xác nhận thông tin bên nhận" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_04 (Backend API) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Duyệt hồ sơ chuyển nhượng

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-325 | Cán bộ Văn phòng Đăng ký đất đai/Chi nhánh Văn phòng Đăng ký đất đai | duyệt hồ sơ chuyển nhượng hợp lệ | giao dịch được phép ghi nhận trên blockchain | Rất Cao | AI_08 (Frontend Admin) | 1. Chức năng "Duyệt hồ sơ chuyển nhượng" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-326 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Duyệt hồ sơ chuyển nhượng" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_08 (Frontend Admin) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-327 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Duyệt hồ sơ chuyển nhượng" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_08 (Frontend Admin) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-328 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Duyệt hồ sơ chuyển nhượng" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_08 (Frontend Admin) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-329 | Hệ thống | ghi nhật ký thao tác cho chức năng "Duyệt hồ sơ chuyển nhượng" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_08 (Frontend Admin) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-330 | Cán bộ Văn phòng Đăng ký đất đai/Chi nhánh Văn phòng Đăng ký đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Duyệt hồ sơ chuyển nhượng" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_08 (Frontend Admin) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Ghi nhận chuyển nhượng trên blockchain

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-331 | Hệ thống | cập nhật chủ sở hữu mới trên blockchain sau khi giao dịch hợp lệ | lịch sử sở hữu được minh bạch và khó chỉnh sửa | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Chức năng "Ghi nhận chuyển nhượng trên blockchain" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-332 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Ghi nhận chuyển nhượng trên blockchain" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-333 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Ghi nhận chuyển nhượng trên blockchain" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-334 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Ghi nhận chuyển nhượng trên blockchain" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_02 (Blockchain Core Dev) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-335 | Hệ thống | ghi nhật ký thao tác cho chức năng "Ghi nhận chuyển nhượng trên blockchain" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_02 (Blockchain Core Dev) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-336 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Ghi nhận chuyển nhượng trên blockchain" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_02 (Blockchain Core Dev) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Cập nhật lịch sử sở hữu

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-337 | Hệ thống | lưu lịch sử thay đổi chủ thể sở hữu trong CSDL nghiệp vụ | người dùng có thể tra cứu lại giao dịch sau này | Rất Cao | AI_04 (Backend API) | 1. Chức năng "Cập nhật lịch sử sở hữu" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-338 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Cập nhật lịch sử sở hữu" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_04 (Backend API) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-339 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Cập nhật lịch sử sở hữu" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_04 (Backend API) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-340 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Cập nhật lịch sử sở hữu" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_04 (Backend API) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-341 | Hệ thống | ghi nhật ký thao tác cho chức năng "Cập nhật lịch sử sở hữu" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_04 (Backend API) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-342 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Cập nhật lịch sử sở hữu" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_04 (Backend API) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Thông báo kết quả chuyển nhượng

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-343 | Hệ thống | gửi thông báo khi giao dịch chuyển nhượng thành công hoặc thất bại | các bên theo dõi được kết quả xử lý | Cao | AI_08 (Frontend Admin) | 1. Chức năng "Thông báo kết quả chuyển nhượng" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-344 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Thông báo kết quả chuyển nhượng" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_08 (Frontend Admin) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-345 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Thông báo kết quả chuyển nhượng" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_08 (Frontend Admin) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-346 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Thông báo kết quả chuyển nhượng" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_08 (Frontend Admin) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-347 | Hệ thống | ghi nhật ký thao tác cho chức năng "Thông báo kết quả chuyển nhượng" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_08 (Frontend Admin) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-348 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Thông báo kết quả chuyển nhượng" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_08 (Frontend Admin) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Xử lý giao dịch blockchain thất bại

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-349 | Cán bộ Văn phòng Đăng ký đất đai/Chi nhánh Văn phòng Đăng ký đất đai | xem và xử lý các yêu cầu chuyển nhượng bị lỗi ở bước blockchain | tôi có thể hoàn tất hoặc khôi phục giao dịch đúng quy trình | Trung Bình | AI_13 (DevOps) | 1. Chức năng "Xử lý giao dịch blockchain thất bại" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-350 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Xử lý giao dịch blockchain thất bại" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Trung Bình | AI_13 (DevOps) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-351 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Xử lý giao dịch blockchain thất bại" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Trung Bình | AI_13 (DevOps) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-352 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Xử lý giao dịch blockchain thất bại" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Trung Bình | AI_13 (DevOps) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-353 | Hệ thống | ghi nhật ký thao tác cho chức năng "Xử lý giao dịch blockchain thất bại" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Trung Bình | AI_13 (DevOps) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-354 | Cán bộ Văn phòng Đăng ký đất đai/Chi nhánh Văn phòng Đăng ký đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Xử lý giao dịch blockchain thất bại" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Trung Bình | AI_13 (DevOps) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

### Epic 9: Dashboard & Báo cáo

#### Feature: Xuất báo cáo tóm tắt

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-421 | Cán bộ Sở Nông nghiệp và Môi trường | xuất báo cáo quản trị ở định dạng tóm tắt | tôi có thể dùng cho việc theo dõi và trình bày | Cao | AI_14 (Tech Writer) | 1. Chức năng "Xuất báo cáo tóm tắt" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-422 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Xuất báo cáo tóm tắt" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_14 (Tech Writer) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-423 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Xuất báo cáo tóm tắt" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_14 (Tech Writer) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-424 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Xuất báo cáo tóm tắt" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_14 (Tech Writer) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-425 | Hệ thống | ghi nhật ký thao tác cho chức năng "Xuất báo cáo tóm tắt" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_14 (Tech Writer) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-426 | Cán bộ Sở Nông nghiệp và Môi trường | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Xuất báo cáo tóm tắt" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_14 (Tech Writer) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

### Epic 11: QA & Test

#### Feature: Unit test smart contract chuyển nhượng

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-481 | Nhóm QA | có bộ unit test cho luồng chuyển nhượng | nhóm giảm lỗi nghiệp vụ blockchain | Rất Cao | AI_11 (QA Unit) | 1. Deliverable của "Unit test smart contract chuyển nhượng" được tạo đầy đủ. 2. Có thể chạy hoặc kiểm tra được trên môi trường dự án. |
| US-482 | Hệ thống | chuẩn hóa cấu hình, tham số và phụ thuộc của "Unit test smart contract chuyển nhượng" | việc tích hợp với các thành phần khác không bị sai lệch | Rất Cao | AI_11 (QA Unit) | 1. Các phụ thuộc được khai báo rõ ràng. 2. Không phát sinh lỗi cấu hình nghiêm trọng khi tích hợp. |
| US-483 | Nhóm QA | tự động hóa một phần thao tác của "Unit test smart contract chuyển nhượng" | nhóm giảm công việc thủ công lặp lại trong quá trình phát triển | Cao | AI_11 (QA Unit) | 1. Có script hoặc pipeline hỗ trợ. 2. Có thể chạy lặp lại nhiều lần với kết quả ổn định. |
| US-484 | Hệ thống | lưu lại kết quả và log của "Unit test smart contract chuyển nhượng" | nhóm QA và PM có thể theo dõi tình trạng thực thi | Cao | AI_11 (QA Unit) | 1. Có log hoặc báo cáo đầu ra. 2. Log đủ để xác định bước nào thành công hoặc thất bại. |
| US-485 | Nhóm QA | kiểm tra đầu ra của "Unit test smart contract chuyển nhượng" theo tiêu chí chấp nhận đã định | nhóm phát hiện sớm lỗi kỹ thuật trước khi demo | Rất Cao | AI_11 (QA Unit) | 1. Có checklist hoặc test case. 2. Kết quả pass/fail được ghi nhận rõ ràng. |
| US-486 | Nhóm QA | xử lý lỗi hoặc tình huống ngoại lệ của "Unit test smart contract chuyển nhượng" | hệ thống hoặc quy trình kỹ thuật không bị gián đoạn toàn phần | Cao | AI_11 (QA Unit) | 1. Có cơ chế cảnh báo khi lỗi xảy ra. 2. Có phương án retry hoặc fallback ở mức phù hợp. |

#### Feature: Kiểm thử end-to-end chuyển nhượng

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-499 | Nhóm QA | kiểm thử toàn bộ luồng chuyển nhượng quyền sử dụng đất | nhóm bảo đảm prototype thể hiện đủ giá trị blockchain | Rất Cao | AI_12 (QA E2E) | 1. Deliverable của "Kiểm thử end-to-end chuyển nhượng" được tạo đầy đủ. 2. Có thể chạy hoặc kiểm tra được trên môi trường dự án. |
| US-500 | Hệ thống | chuẩn hóa cấu hình, tham số và phụ thuộc của "Kiểm thử end-to-end chuyển nhượng" | việc tích hợp với các thành phần khác không bị sai lệch | Rất Cao | AI_12 (QA E2E) | 1. Các phụ thuộc được khai báo rõ ràng. 2. Không phát sinh lỗi cấu hình nghiêm trọng khi tích hợp. |
| US-501 | Nhóm QA | tự động hóa một phần thao tác của "Kiểm thử end-to-end chuyển nhượng" | nhóm giảm công việc thủ công lặp lại trong quá trình phát triển | Cao | AI_12 (QA E2E) | 1. Có script hoặc pipeline hỗ trợ. 2. Có thể chạy lặp lại nhiều lần với kết quả ổn định. |
| US-502 | Hệ thống | lưu lại kết quả và log của "Kiểm thử end-to-end chuyển nhượng" | nhóm QA và PM có thể theo dõi tình trạng thực thi | Cao | AI_12 (QA E2E) | 1. Có log hoặc báo cáo đầu ra. 2. Log đủ để xác định bước nào thành công hoặc thất bại. |
| US-503 | Nhóm QA | kiểm tra đầu ra của "Kiểm thử end-to-end chuyển nhượng" theo tiêu chí chấp nhận đã định | nhóm phát hiện sớm lỗi kỹ thuật trước khi demo | Rất Cao | AI_12 (QA E2E) | 1. Có checklist hoặc test case. 2. Kết quả pass/fail được ghi nhận rõ ràng. |
| US-504 | Nhóm QA | xử lý lỗi hoặc tình huống ngoại lệ của "Kiểm thử end-to-end chuyển nhượng" | hệ thống hoặc quy trình kỹ thuật không bị gián đoạn toàn phần | Cao | AI_12 (QA E2E) | 1. Có cơ chế cảnh báo khi lỗi xảy ra. 2. Có phương án retry hoặc fallback ở mức phù hợp. |

---

## Sprint 7

**Mục tiêu:** AI hỗ trợ MVP và giám sát: OCR, kiểm tra hồ sơ, cảnh báo AI, KPI, tài liệu API và compliance dữ liệu.

**Số lượng backlog:** 78 user stories/tasks. Mức ưu tiên: Rất Cao 6, Cao 41, Trung Bình 31, Thấp 0.

### Tổng hợp sprint

| Nhóm | Số lượng |
|---|---:|
| Epic 8: AI hỗ trợ MVP | 42 |
| Epic 9: Dashboard & Báo cáo | 12 |
| Epic 10: Audit, Security & Compliance | 18 |
| Epic 12: DevOps, Tài liệu & Bàn giao | 6 |

**Agent tham gia chính:** AI_15 (Compliance) (30), AI_14 (Tech Writer) (24), AI_10 (OCR & Document Assistant) (12), AI_08 (Frontend Admin) (6), AI_11 (QA Unit) (6)

### Epic 8: AI hỗ trợ MVP

#### Feature: OCR tài liệu hồ sơ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-355 | Cán bộ Văn phòng Đăng ký đất đai/Chi nhánh Văn phòng Đăng ký đất đai | dùng AI để trích xuất dữ liệu cơ bản từ hồ sơ scan | tôi giảm thời gian nhập tay thông tin | Cao | AI_10 (OCR & Document Assistant) | 1. Chức năng "OCR tài liệu hồ sơ" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-356 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "OCR tài liệu hồ sơ" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_10 (OCR & Document Assistant) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-357 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "OCR tài liệu hồ sơ" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_10 (OCR & Document Assistant) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-358 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "OCR tài liệu hồ sơ" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_10 (OCR & Document Assistant) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-359 | Hệ thống | ghi nhật ký thao tác cho chức năng "OCR tài liệu hồ sơ" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_10 (OCR & Document Assistant) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-360 | Cán bộ Văn phòng Đăng ký đất đai/Chi nhánh Văn phòng Đăng ký đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "OCR tài liệu hồ sơ" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_10 (OCR & Document Assistant) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Ánh xạ trường dữ liệu OCR

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-361 | Hệ thống | ánh xạ kết quả OCR vào các trường dữ liệu nghiệp vụ tương ứng | cán bộ đối chiếu dữ liệu nhanh hơn | Cao | AI_10 (OCR & Document Assistant) | 1. Chức năng "Ánh xạ trường dữ liệu OCR" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-362 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Ánh xạ trường dữ liệu OCR" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_10 (OCR & Document Assistant) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-363 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Ánh xạ trường dữ liệu OCR" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_10 (OCR & Document Assistant) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-364 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Ánh xạ trường dữ liệu OCR" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_10 (OCR & Document Assistant) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-365 | Hệ thống | ghi nhật ký thao tác cho chức năng "Ánh xạ trường dữ liệu OCR" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_10 (OCR & Document Assistant) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-366 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Ánh xạ trường dữ liệu OCR" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_10 (OCR & Document Assistant) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Kiểm tra tính đầy đủ hồ sơ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-367 | Công chức UBND cấp xã/phường phụ trách đất đai | nhận cảnh báo khi hồ sơ thiếu giấy tờ bắt buộc | tôi xử lý hồ sơ nhất quán hơn | Cao | AI_15 (Compliance) | 1. Chức năng "Kiểm tra tính đầy đủ hồ sơ" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-368 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Kiểm tra tính đầy đủ hồ sơ" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Cao | AI_15 (Compliance) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-369 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Kiểm tra tính đầy đủ hồ sơ" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Cao | AI_15 (Compliance) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-370 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Kiểm tra tính đầy đủ hồ sơ" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Cao | AI_15 (Compliance) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-371 | Hệ thống | ghi nhật ký thao tác cho chức năng "Kiểm tra tính đầy đủ hồ sơ" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_15 (Compliance) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-372 | Công chức UBND cấp xã/phường phụ trách đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Kiểm tra tính đầy đủ hồ sơ" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_15 (Compliance) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Phát hiện sai lệch dữ liệu

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-373 | Công chức UBND cấp xã/phường phụ trách đất đai | nhận gợi ý khi dữ liệu OCR và dữ liệu kê khai không khớp | tôi phát hiện lỗi hồ sơ sớm trước khi duyệt | Trung Bình | AI_15 (Compliance) | 1. Chức năng "Phát hiện sai lệch dữ liệu" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-374 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Phát hiện sai lệch dữ liệu" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Trung Bình | AI_15 (Compliance) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-375 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Phát hiện sai lệch dữ liệu" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Trung Bình | AI_15 (Compliance) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-376 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Phát hiện sai lệch dữ liệu" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Trung Bình | AI_15 (Compliance) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-377 | Hệ thống | ghi nhật ký thao tác cho chức năng "Phát hiện sai lệch dữ liệu" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Trung Bình | AI_15 (Compliance) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-378 | Công chức UBND cấp xã/phường phụ trách đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Phát hiện sai lệch dữ liệu" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Trung Bình | AI_15 (Compliance) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Tóm tắt hồ sơ cho cán bộ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-379 | Cán bộ Văn phòng Đăng ký đất đai/Chi nhánh Văn phòng Đăng ký đất đai | xem bản tóm tắt ngắn về hồ sơ đang thẩm định | tôi nắm được nội dung chính nhanh hơn | Trung Bình | AI_14 (Tech Writer) | 1. Chức năng "Tóm tắt hồ sơ cho cán bộ" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-380 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Tóm tắt hồ sơ cho cán bộ" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Trung Bình | AI_14 (Tech Writer) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-381 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Tóm tắt hồ sơ cho cán bộ" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Trung Bình | AI_14 (Tech Writer) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-382 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Tóm tắt hồ sơ cho cán bộ" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Trung Bình | AI_14 (Tech Writer) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-383 | Hệ thống | ghi nhật ký thao tác cho chức năng "Tóm tắt hồ sơ cho cán bộ" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Trung Bình | AI_14 (Tech Writer) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-384 | Cán bộ Văn phòng Đăng ký đất đai/Chi nhánh Văn phòng Đăng ký đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Tóm tắt hồ sơ cho cán bộ" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Trung Bình | AI_14 (Tech Writer) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Gợi ý lý do từ chối hồ sơ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-385 | Công chức UBND cấp xã/phường phụ trách đất đai | nhận gợi ý lý do từ chối dựa trên lỗi đã phát hiện | tôi phản hồi cho người dân nhanh và nhất quán hơn | Trung Bình | AI_15 (Compliance) | 1. Chức năng "Gợi ý lý do từ chối hồ sơ" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-386 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Gợi ý lý do từ chối hồ sơ" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Trung Bình | AI_15 (Compliance) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-387 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Gợi ý lý do từ chối hồ sơ" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Trung Bình | AI_15 (Compliance) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-388 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Gợi ý lý do từ chối hồ sơ" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Trung Bình | AI_15 (Compliance) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-389 | Hệ thống | ghi nhật ký thao tác cho chức năng "Gợi ý lý do từ chối hồ sơ" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Trung Bình | AI_15 (Compliance) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-390 | Công chức UBND cấp xã/phường phụ trách đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Gợi ý lý do từ chối hồ sơ" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Trung Bình | AI_15 (Compliance) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Sinh báo cáo tóm tắt quản trị

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-391 | Cán bộ Sở Nông nghiệp và Môi trường | nhận báo cáo tóm tắt về hồ sơ và giao dịch trong kỳ | tôi có thể theo dõi vận hành của prototype dễ hơn | Trung Bình | AI_14 (Tech Writer) | 1. Chức năng "Sinh báo cáo tóm tắt quản trị" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-392 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Sinh báo cáo tóm tắt quản trị" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Trung Bình | AI_14 (Tech Writer) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-393 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Sinh báo cáo tóm tắt quản trị" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Trung Bình | AI_14 (Tech Writer) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-394 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Sinh báo cáo tóm tắt quản trị" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Trung Bình | AI_14 (Tech Writer) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-395 | Hệ thống | ghi nhật ký thao tác cho chức năng "Sinh báo cáo tóm tắt quản trị" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Trung Bình | AI_14 (Tech Writer) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-396 | Cán bộ Sở Nông nghiệp và Môi trường | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Sinh báo cáo tóm tắt quản trị" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Trung Bình | AI_14 (Tech Writer) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

### Epic 9: Dashboard & Báo cáo

#### Feature: Danh sách cảnh báo AI

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-415 | Công chức UBND cấp xã/phường phụ trách đất đai | xem tập hợp cảnh báo do AI phát hiện trên hồ sơ | tôi ưu tiên xử lý các trường hợp có rủi ro cao | Trung Bình | AI_08 (Frontend Admin) | 1. Chức năng "Danh sách cảnh báo AI" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-416 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Danh sách cảnh báo AI" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Trung Bình | AI_08 (Frontend Admin) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-417 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Danh sách cảnh báo AI" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Trung Bình | AI_08 (Frontend Admin) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-418 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Danh sách cảnh báo AI" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Trung Bình | AI_08 (Frontend Admin) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-419 | Hệ thống | ghi nhật ký thao tác cho chức năng "Danh sách cảnh báo AI" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Trung Bình | AI_08 (Frontend Admin) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-420 | Công chức UBND cấp xã/phường phụ trách đất đai | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Danh sách cảnh báo AI" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Trung Bình | AI_08 (Frontend Admin) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Theo dõi KPI MVP

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-427 | Nhóm PM | xem các chỉ số chính của prototype như số hồ sơ, số giao dịch, tỷ lệ hoàn tất | nhóm đánh giá tiến độ và chất lượng demo tốt hơn | Cao | AI_14 (Tech Writer) | 1. Nội dung của "Theo dõi KPI MVP" được tạo đúng mẫu hoặc đúng mục tiêu sử dụng. 2. Người dùng nội bộ có thể sử dụng ngay đầu ra đó. |
| US-428 | Hệ thống | chuẩn hóa cấu trúc và định dạng cho "Theo dõi KPI MVP" | đầu ra nhất quán giữa các phần của dự án | Cao | AI_14 (Tech Writer) | 1. Dùng chung template hoặc chuẩn định dạng. 2. Không bị thiếu các mục thông tin bắt buộc. |
| US-429 | Nhóm PM | xem xét và phê duyệt đầu ra của "Theo dõi KPI MVP" | nhóm bảo đảm nội dung phù hợp với phạm vi MVP | Cao | AI_14 (Tech Writer) | 1. Có bước review của PM Team. 2. Chỉ sử dụng phiên bản đã được duyệt. |
| US-430 | Hệ thống | lưu trữ và gắn phiên bản cho đầu ra của "Theo dõi KPI MVP" | nhóm có thể truy xuất tài liệu và lịch sử cập nhật khi cần | Cao | AI_14 (Tech Writer) | 1. Có version hoặc ngày cập nhật. 2. Tài liệu được lưu ở nơi truy cập chung của nhóm. |
| US-431 | Nhóm PM | cập nhật đầu ra của "Theo dõi KPI MVP" khi backlog hoặc phạm vi thay đổi | tài liệu và sản phẩm bàn giao luôn phản ánh trạng thái mới nhất | Cao | AI_14 (Tech Writer) | 1. Có quy trình cập nhật khi thay đổi. 2. Không làm mất phiên bản đã phê duyệt trước đó. |
| US-432 | Nhóm PM | sử dụng đầu ra của "Theo dõi KPI MVP" trong kiểm thử, báo cáo hoặc bàn giao | nhóm hoàn thiện hồ sơ học phần và buổi bảo vệ thuận lợi hơn | Cao | AI_14 (Tech Writer) | 1. Đầu ra được liên kết tới phần báo cáo/bàn giao tương ứng. 2. Có thể sử dụng lại trong demo và nghiệm thu. |

### Epic 10: Audit, Security & Compliance

#### Feature: Ẩn thông tin nhạy cảm trên giao diện

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-445 | Hệ thống | che bớt thông tin nhạy cảm khi hiển thị cho người dùng không đủ quyền | hệ thống giảm rủi ro lộ dữ liệu cá nhân | Rất Cao | AI_15 (Compliance) | 1. Chức năng "Ẩn thông tin nhạy cảm trên giao diện" hiển thị hoặc tiếp nhận thao tác đúng vai trò. 2. Người dùng hoàn tất bước chính của chức năng. |
| US-446 | Hệ thống | kiểm tra dữ liệu đầu vào của chức năng "Ẩn thông tin nhạy cảm trên giao diện" trước khi xử lý | hệ thống giảm lỗi nghiệp vụ ngay từ bước đầu | Rất Cao | AI_15 (Compliance) | 1. Có kiểm tra ràng buộc dữ liệu bắt buộc. 2. Trả về thông báo lỗi rõ ràng khi dữ liệu không hợp lệ. |
| US-447 | Hệ thống | lưu hoặc xử lý dữ liệu phát sinh từ chức năng "Ẩn thông tin nhạy cảm trên giao diện" theo đúng quy trình | trạng thái hồ sơ và dữ liệu liên quan luôn nhất quán | Rất Cao | AI_15 (Compliance) | 1. Dữ liệu được ghi nhận vào CSDL hoặc blockchain đúng bước. 2. Không làm mất dữ liệu khi thao tác thành công. |
| US-448 | Hệ thống | cập nhật trạng thái liên quan sau khi hoàn tất chức năng "Ẩn thông tin nhạy cảm trên giao diện" | các bên liên quan theo dõi tiến độ xử lý dễ dàng | Rất Cao | AI_15 (Compliance) | 1. Trạng thái thay đổi đúng quy tắc nghiệp vụ. 2. Giao diện phản ánh trạng thái mới ngay sau khi xử lý. |
| US-449 | Hệ thống | ghi nhật ký thao tác cho chức năng "Ẩn thông tin nhạy cảm trên giao diện" | cán bộ và nhóm PM có thể truy vết lịch sử xử lý khi cần | Cao | AI_15 (Compliance) | 1. Nhật ký chứa thời gian, vai trò và hành động chính. 2. Có thể tra cứu lại log khi cần. |
| US-450 | Hệ thống | nhận phản hồi hoặc thông báo phù hợp khi dùng chức năng "Ẩn thông tin nhạy cảm trên giao diện" | tôi biết kết quả thao tác của mình và bước tiếp theo cần làm | Cao | AI_15 (Compliance) | 1. Có thông báo thành công/thất bại rõ ràng. 2. Gợi ý bước tiếp theo khi thao tác không thành công. |

#### Feature: Checklist tuân thủ dữ liệu

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-463 | Nhóm PM | có checklist dữ liệu nào được lưu on-chain và dữ liệu nào phải lưu off-chain | nhóm bảo đảm báo cáo và prototype phù hợp pháp lý | Rất Cao | AI_15 (Compliance) | 1. Nội dung của "Checklist tuân thủ dữ liệu" được tạo đúng mẫu hoặc đúng mục tiêu sử dụng. 2. Người dùng nội bộ có thể sử dụng ngay đầu ra đó. |
| US-464 | Hệ thống | chuẩn hóa cấu trúc và định dạng cho "Checklist tuân thủ dữ liệu" | đầu ra nhất quán giữa các phần của dự án | Cao | AI_15 (Compliance) | 1. Dùng chung template hoặc chuẩn định dạng. 2. Không bị thiếu các mục thông tin bắt buộc. |
| US-465 | Nhóm PM | xem xét và phê duyệt đầu ra của "Checklist tuân thủ dữ liệu" | nhóm bảo đảm nội dung phù hợp với phạm vi MVP | Rất Cao | AI_15 (Compliance) | 1. Có bước review của PM Team. 2. Chỉ sử dụng phiên bản đã được duyệt. |
| US-466 | Hệ thống | lưu trữ và gắn phiên bản cho đầu ra của "Checklist tuân thủ dữ liệu" | nhóm có thể truy xuất tài liệu và lịch sử cập nhật khi cần | Cao | AI_15 (Compliance) | 1. Có version hoặc ngày cập nhật. 2. Tài liệu được lưu ở nơi truy cập chung của nhóm. |
| US-467 | Nhóm PM | cập nhật đầu ra của "Checklist tuân thủ dữ liệu" khi backlog hoặc phạm vi thay đổi | tài liệu và sản phẩm bàn giao luôn phản ánh trạng thái mới nhất | Trung Bình | AI_15 (Compliance) | 1. Có quy trình cập nhật khi thay đổi. 2. Không làm mất phiên bản đã phê duyệt trước đó. |
| US-468 | Nhóm PM | sử dụng đầu ra của "Checklist tuân thủ dữ liệu" trong kiểm thử, báo cáo hoặc bàn giao | nhóm hoàn thiện hồ sơ học phần và buổi bảo vệ thuận lợi hơn | Cao | AI_15 (Compliance) | 1. Đầu ra được liên kết tới phần báo cáo/bàn giao tương ứng. 2. Có thể sử dụng lại trong demo và nghiệm thu. |

#### Feature: Kiểm tra tính toàn vẹn dữ liệu nghiệp vụ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-469 | Nhóm QA | đối chiếu dữ liệu hồ sơ, CID và trạng thái blockchain sau các luồng chính | nhóm phát hiện sớm sai lệch dữ liệu | Cao | AI_11 (QA Unit) | 1. Deliverable của "Kiểm tra tính toàn vẹn dữ liệu nghiệp vụ" được tạo đầy đủ. 2. Có thể chạy hoặc kiểm tra được trên môi trường dự án. |
| US-470 | Hệ thống | chuẩn hóa cấu hình, tham số và phụ thuộc của "Kiểm tra tính toàn vẹn dữ liệu nghiệp vụ" | việc tích hợp với các thành phần khác không bị sai lệch | Cao | AI_11 (QA Unit) | 1. Các phụ thuộc được khai báo rõ ràng. 2. Không phát sinh lỗi cấu hình nghiêm trọng khi tích hợp. |
| US-471 | Nhóm QA | tự động hóa một phần thao tác của "Kiểm tra tính toàn vẹn dữ liệu nghiệp vụ" | nhóm giảm công việc thủ công lặp lại trong quá trình phát triển | Cao | AI_11 (QA Unit) | 1. Có script hoặc pipeline hỗ trợ. 2. Có thể chạy lặp lại nhiều lần với kết quả ổn định. |
| US-472 | Hệ thống | lưu lại kết quả và log của "Kiểm tra tính toàn vẹn dữ liệu nghiệp vụ" | nhóm QA và PM có thể theo dõi tình trạng thực thi | Cao | AI_11 (QA Unit) | 1. Có log hoặc báo cáo đầu ra. 2. Log đủ để xác định bước nào thành công hoặc thất bại. |
| US-473 | Nhóm QA | kiểm tra đầu ra của "Kiểm tra tính toàn vẹn dữ liệu nghiệp vụ" theo tiêu chí chấp nhận đã định | nhóm phát hiện sớm lỗi kỹ thuật trước khi demo | Cao | AI_11 (QA Unit) | 1. Có checklist hoặc test case. 2. Kết quả pass/fail được ghi nhận rõ ràng. |
| US-474 | Nhóm QA | xử lý lỗi hoặc tình huống ngoại lệ của "Kiểm tra tính toàn vẹn dữ liệu nghiệp vụ" | hệ thống hoặc quy trình kỹ thuật không bị gián đoạn toàn phần | Cao | AI_11 (QA Unit) | 1. Có cơ chế cảnh báo khi lỗi xảy ra. 2. Có phương án retry hoặc fallback ở mức phù hợp. |

### Epic 12: DevOps, Tài liệu & Bàn giao

#### Feature: Tài liệu API

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-529 | Nhóm PM | có tài liệu API rõ ràng cho các endpoint chính | nhóm dễ kiểm thử, trình bày và bàn giao hơn | Cao | AI_14 (Tech Writer) | 1. Nội dung của "Tài liệu API" được tạo đúng mẫu hoặc đúng mục tiêu sử dụng. 2. Người dùng nội bộ có thể sử dụng ngay đầu ra đó. |
| US-530 | Hệ thống | chuẩn hóa cấu trúc và định dạng cho "Tài liệu API" | đầu ra nhất quán giữa các phần của dự án | Cao | AI_14 (Tech Writer) | 1. Dùng chung template hoặc chuẩn định dạng. 2. Không bị thiếu các mục thông tin bắt buộc. |
| US-531 | Nhóm PM | xem xét và phê duyệt đầu ra của "Tài liệu API" | nhóm bảo đảm nội dung phù hợp với phạm vi MVP | Cao | AI_14 (Tech Writer) | 1. Có bước review của PM Team. 2. Chỉ sử dụng phiên bản đã được duyệt. |
| US-532 | Hệ thống | lưu trữ và gắn phiên bản cho đầu ra của "Tài liệu API" | nhóm có thể truy xuất tài liệu và lịch sử cập nhật khi cần | Cao | AI_14 (Tech Writer) | 1. Có version hoặc ngày cập nhật. 2. Tài liệu được lưu ở nơi truy cập chung của nhóm. |
| US-533 | Nhóm PM | cập nhật đầu ra của "Tài liệu API" khi backlog hoặc phạm vi thay đổi | tài liệu và sản phẩm bàn giao luôn phản ánh trạng thái mới nhất | Cao | AI_14 (Tech Writer) | 1. Có quy trình cập nhật khi thay đổi. 2. Không làm mất phiên bản đã phê duyệt trước đó. |
| US-534 | Nhóm PM | sử dụng đầu ra của "Tài liệu API" trong kiểm thử, báo cáo hoặc bàn giao | nhóm hoàn thiện hồ sơ học phần và buổi bảo vệ thuận lợi hơn | Cao | AI_14 (Tech Writer) | 1. Đầu ra được liên kết tới phần báo cáo/bàn giao tương ứng. 2. Có thể sử dụng lại trong demo và nghiệm thu. |

---

## Sprint 8

**Mục tiêu:** Đóng gói, hướng dẫn sử dụng và bàn giao cuối kỳ.

**Số lượng backlog:** 18 user stories/tasks. Mức ưu tiên: Rất Cao 2, Cao 15, Trung Bình 1, Thấp 0.

### Tổng hợp sprint

| Nhóm | Số lượng |
|---|---:|
| Epic 12: DevOps, Tài liệu & Bàn giao | 18 |

**Agent tham gia chính:** AI_14 (Tech Writer) (12), AI_13 (DevOps) (6)

### Epic 12: DevOps, Tài liệu & Bàn giao

#### Feature: Đóng gói ứng dụng bằng Docker

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-523 | AI DevOps Engineer | đóng gói các thành phần hệ thống bằng Docker | việc triển khai demo và bàn giao được thuận tiện hơn | Cao | AI_13 (DevOps) | 1. Deliverable của "Đóng gói ứng dụng bằng Docker" được tạo đầy đủ. 2. Có thể chạy hoặc kiểm tra được trên môi trường dự án. |
| US-524 | Hệ thống | chuẩn hóa cấu hình, tham số và phụ thuộc của "Đóng gói ứng dụng bằng Docker" | việc tích hợp với các thành phần khác không bị sai lệch | Cao | AI_13 (DevOps) | 1. Các phụ thuộc được khai báo rõ ràng. 2. Không phát sinh lỗi cấu hình nghiêm trọng khi tích hợp. |
| US-525 | AI DevOps Engineer | tự động hóa một phần thao tác của "Đóng gói ứng dụng bằng Docker" | nhóm giảm công việc thủ công lặp lại trong quá trình phát triển | Cao | AI_13 (DevOps) | 1. Có script hoặc pipeline hỗ trợ. 2. Có thể chạy lặp lại nhiều lần với kết quả ổn định. |
| US-526 | Hệ thống | lưu lại kết quả và log của "Đóng gói ứng dụng bằng Docker" | nhóm QA và PM có thể theo dõi tình trạng thực thi | Cao | AI_13 (DevOps) | 1. Có log hoặc báo cáo đầu ra. 2. Log đủ để xác định bước nào thành công hoặc thất bại. |
| US-527 | Nhóm QA | kiểm tra đầu ra của "Đóng gói ứng dụng bằng Docker" theo tiêu chí chấp nhận đã định | nhóm phát hiện sớm lỗi kỹ thuật trước khi demo | Cao | AI_13 (DevOps) | 1. Có checklist hoặc test case. 2. Kết quả pass/fail được ghi nhận rõ ràng. |
| US-528 | AI DevOps Engineer | xử lý lỗi hoặc tình huống ngoại lệ của "Đóng gói ứng dụng bằng Docker" | hệ thống hoặc quy trình kỹ thuật không bị gián đoạn toàn phần | Cao | AI_13 (DevOps) | 1. Có cơ chế cảnh báo khi lỗi xảy ra. 2. Có phương án retry hoặc fallback ở mức phù hợp. |

#### Feature: Hướng dẫn sử dụng prototype

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-535 | Nhóm PM | có hướng dẫn ngắn cho người dùng và cán bộ thao tác trên demo | quá trình bảo vệ và bàn giao thuận lợi hơn | Cao | AI_14 (Tech Writer) | 1. Nội dung của "Hướng dẫn sử dụng prototype" được tạo đúng mẫu hoặc đúng mục tiêu sử dụng. 2. Người dùng nội bộ có thể sử dụng ngay đầu ra đó. |
| US-536 | Hệ thống | chuẩn hóa cấu trúc và định dạng cho "Hướng dẫn sử dụng prototype" | đầu ra nhất quán giữa các phần của dự án | Cao | AI_14 (Tech Writer) | 1. Dùng chung template hoặc chuẩn định dạng. 2. Không bị thiếu các mục thông tin bắt buộc. |
| US-537 | Nhóm PM | xem xét và phê duyệt đầu ra của "Hướng dẫn sử dụng prototype" | nhóm bảo đảm nội dung phù hợp với phạm vi MVP | Cao | AI_14 (Tech Writer) | 1. Có bước review của PM Team. 2. Chỉ sử dụng phiên bản đã được duyệt. |
| US-538 | Hệ thống | lưu trữ và gắn phiên bản cho đầu ra của "Hướng dẫn sử dụng prototype" | nhóm có thể truy xuất tài liệu và lịch sử cập nhật khi cần | Cao | AI_14 (Tech Writer) | 1. Có version hoặc ngày cập nhật. 2. Tài liệu được lưu ở nơi truy cập chung của nhóm. |
| US-539 | Nhóm PM | cập nhật đầu ra của "Hướng dẫn sử dụng prototype" khi backlog hoặc phạm vi thay đổi | tài liệu và sản phẩm bàn giao luôn phản ánh trạng thái mới nhất | Cao | AI_14 (Tech Writer) | 1. Có quy trình cập nhật khi thay đổi. 2. Không làm mất phiên bản đã phê duyệt trước đó. |
| US-540 | Nhóm PM | sử dụng đầu ra của "Hướng dẫn sử dụng prototype" trong kiểm thử, báo cáo hoặc bàn giao | nhóm hoàn thiện hồ sơ học phần và buổi bảo vệ thuận lợi hơn | Cao | AI_14 (Tech Writer) | 1. Đầu ra được liên kết tới phần báo cáo/bàn giao tương ứng. 2. Có thể sử dụng lại trong demo và nghiệm thu. |

#### Feature: Bàn giao sản phẩm cuối kỳ

| ID | As a [who] | I want [what] | so that [why] | Ưu tiên | Agent | Acceptance Criteria |
|---|---|---|---|---|---|---|
| US-541 | Nhóm PM | đóng gói mã nguồn, tài liệu và dữ liệu mẫu thành một bộ hoàn chỉnh | nhóm đáp ứng yêu cầu nộp sản phẩm của học phần | Rất Cao | AI_14 (Tech Writer) | 1. Nội dung của "Bàn giao sản phẩm cuối kỳ" được tạo đúng mẫu hoặc đúng mục tiêu sử dụng. 2. Người dùng nội bộ có thể sử dụng ngay đầu ra đó. |
| US-542 | Hệ thống | chuẩn hóa cấu trúc và định dạng cho "Bàn giao sản phẩm cuối kỳ" | đầu ra nhất quán giữa các phần của dự án | Cao | AI_14 (Tech Writer) | 1. Dùng chung template hoặc chuẩn định dạng. 2. Không bị thiếu các mục thông tin bắt buộc. |
| US-543 | Nhóm PM | xem xét và phê duyệt đầu ra của "Bàn giao sản phẩm cuối kỳ" | nhóm bảo đảm nội dung phù hợp với phạm vi MVP | Rất Cao | AI_14 (Tech Writer) | 1. Có bước review của PM Team. 2. Chỉ sử dụng phiên bản đã được duyệt. |
| US-544 | Hệ thống | lưu trữ và gắn phiên bản cho đầu ra của "Bàn giao sản phẩm cuối kỳ" | nhóm có thể truy xuất tài liệu và lịch sử cập nhật khi cần | Cao | AI_14 (Tech Writer) | 1. Có version hoặc ngày cập nhật. 2. Tài liệu được lưu ở nơi truy cập chung của nhóm. |
| US-545 | Nhóm PM | cập nhật đầu ra của "Bàn giao sản phẩm cuối kỳ" khi backlog hoặc phạm vi thay đổi | tài liệu và sản phẩm bàn giao luôn phản ánh trạng thái mới nhất | Trung Bình | AI_14 (Tech Writer) | 1. Có quy trình cập nhật khi thay đổi. 2. Không làm mất phiên bản đã phê duyệt trước đó. |
| US-546 | Nhóm PM | sử dụng đầu ra của "Bàn giao sản phẩm cuối kỳ" trong kiểm thử, báo cáo hoặc bàn giao | nhóm hoàn thiện hồ sơ học phần và buổi bảo vệ thuận lợi hơn | Cao | AI_14 (Tech Writer) | 1. Đầu ra được liên kết tới phần báo cáo/bàn giao tương ứng. 2. Có thể sử dụng lại trong demo và nghiệm thu. |

---

## 8. Definition of Ready

Một backlog item được xem là sẵn sàng đưa vào triển khai khi:

- Có mã ID rõ ràng và không trùng.
- Có epic, feature, vai trò, mục tiêu và giá trị nghiệp vụ.
- Có mức ưu tiên và sprint đề xuất.
- Có agent phụ trách chính.
- Có acceptance criteria đủ để QA kiểm tra.
- Không mâu thuẫn với quy trình nghiệp vụ, kiến trúc hệ thống, bảo mật dữ liệu và phạm vi MVP.

## 9. Definition of Done

Một backlog item được xem là hoàn thành khi:

- Chức năng hoặc deliverable đã được tạo theo đúng acceptance criteria.
- Có kiểm tra dữ liệu đầu vào, trạng thái, thông báo lỗi/thành công nếu là chức năng hệ thống.
- Có log/audit trail đối với hành động quan trọng.
- Có cập nhật database/API/frontend/smart contract tương ứng nếu liên quan.
- Có test hoặc checklist nghiệm thu.
- Có cập nhật tài liệu khi thay đổi ảnh hưởng tới báo cáo, demo hoặc hướng dẫn sử dụng.

## 10. Gợi ý cách dùng với Codex/AI Agent

Khi triển khai từng sprint, dùng mẫu prompt sau:

```md
Bạn là AI Orchestrator của dự án UrbanChain-VN.

Hãy đọc file /docs/04-backlog-mvp.md và triển khai [Sprint X].

Yêu cầu:
1. Lọc đúng các user stories thuộc [Sprint X].
2. Gom task theo Agent phụ trách.
3. Đề xuất thứ tự triển khai theo dependency.
4. Chỉ rõ file cần tạo/sửa.
5. Với mỗi user story, trả về acceptance checklist.
6. Sau khi triển khai, tạo báo cáo hoàn thành sprint.
```

## 11. Prompt kiểm tra đồng bộ backlog

```md
Bạn là AI_03_Product_Backlog_Manager.
Hãy kiểm tra file /docs/04-backlog-mvp.md.
Đối chiếu các mục sau:
- Tổng số user stories phải là 546.
- Có 8 sprint từ Sprint 1 đến Sprint 8.
- Không trùng ID từ US-001 đến US-546.
- Mỗi user story có Epic, Feature, As a, I want, so that, Priority, Acceptance Criteria, Agent, Sprint.
- Sprint overview phải khớp số lượng và ưu tiên.
Trả về lỗi nếu có, không tự ý sửa nếu chưa được yêu cầu.
```
