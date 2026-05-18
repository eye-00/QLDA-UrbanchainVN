# PR-S5-01 Skeleton — Legal-Aligned Core (Sprint 5)

## 1) Branch + baseline
- Base: `develop` (head synced from `origin/develop`)
- Worktree: `D:\Code2_\HK6\QLDA\UrbanChainVN\.worktrees\s5-legal`
- Branch: `codex/s5-pr1-legal-core`
- Current baseline commit: `6b01c6c`

## 2) Scope khóa cho PR-S5-01
Theo backlog canonical:
- `LEG-S5-001`: Payment obligation off-chain model
- `LEG-S5-002`: Map legal source (`source_type`)

Không làm trong PR này:
- Không đổi ABI contract
- Không mở API ngoài phạm vi cần thiết cho `LEG-S5-*`
- Không refactor UI layout lớn ngoài phần bắt buộc để hiển thị legal fields

## 3) Gap matrix khởi tạo (điền trong quá trình triển khai)
| Legal item | Requirement (docs) | Backend evidence | Frontend evidence | Test evidence | Status | Gap |
|---|---|---|---|---|---|---|
| LEG-S5-001 | Có obligation + notice/receipt + status theo role tax | TODO | TODO | TODO | TODO | TODO |
| LEG-S5-002 | Hiển thị `source_type` + warning khi `DEMO` | TODO | TODO | TODO | TODO | TODO |

## 4) Delivery plan kỹ thuật

### A. Backend / DB
1. Rà schema + migration cho payment/legal source:
   - `PaymentObligation` fields cần đủ cho legal flow (type/status/proof refs/audit fields).
   - `sourceType` (`DEMO|IMPORTED|OFFICIAL_REFERENCE`) trên entity bản đồ/thửa theo runtime hiện tại.
2. Rà endpoint hiện có và chốt contract:
   - `/api/v1/registrations/:id/payment-obligations`
   - `/api/v1/registrations/:id/payment-obligations/:obligationId/status`
   - Các endpoint map/search liên quan trả `sourceType`.
3. Bổ sung guard:
   - Role tax/officer/admin theo legal docs.
   - Validation envelope nhất quán (`400/403/409`).

### B. Frontend
1. Hiển thị đầy đủ payment obligation theo role:
   - Loại nghĩa vụ
   - Trạng thái
   - Chứng cứ xử lý (nếu có)
2. Hiển thị `source_type` trên màn liên quan:
   - Badge/label tiếng Việt
   - Warning rõ ràng khi `DEMO`
3. Chuẩn hóa mapper hiển thị:
   - payment type/status
   - source_type labels + warning microcopy

### C. Tests bắt buộc
1. Backend:
   - cập nhật/confirm payment status đúng role
   - negative path role/status/validation
   - response envelope consistency
2. Frontend:
   - mapper `source_type` + payment labels
   - render warning khi `DEMO`
   - role gating cho thao tác payment

### D. Docs sync trong PR-S5-01
1. Cập nhật:
   - `docs/04-backlog-mvp-wallet-map.md`
   - `docs/07-api-contract.md`
   - `docs/14-functional-readiness-checklist.md`
2. Nếu có đổi logic gate:
   - cập nhật `docs/08-definition-of-done.md`

## 5) Local gate checklist
- [ ] `.\scripts\dev.ps1 db:generate`
- [ ] `.\scripts\dev.ps1 db:migrate`
- [ ] `.\scripts\dev.ps1 db:seed`
- [ ] `.\scripts\npmw.ps1 run lint`
- [ ] `.\scripts\npmw.ps1 run build`
- [ ] `.\scripts\npmw.ps1 run test`

## 6) Remote gate checklist (PR)
- [ ] `backend-ci` pass
- [ ] `frontend-ci` pass
- [ ] `contracts-ci` / `skipped by scope` hợp lệ
- [ ] `docs-check` pass
- [ ] branch protection/secret scanning không báo blocker

## 7) Exit criteria PR-S5-01
- `LEG-S5-001` có evidence code + test + docs
- `LEG-S5-002` có evidence code + test + docs
- Không còn mismatch FE/BE payload cho flow payment/source_type
- Không phát sinh regression P0/P1 ở Sprint 1-4
