# US Gap Remediation Plan - Sprint 1, Sprint 2, Sprint 3

Cập nhật: 2026-05-10 16:15:00

## 1) Tổng quan kết quả audit

| Sprint | Done | Partial | Missing | Tổng US |
|---|---:|---:|---:|---:|
| Sprint 1 | 90 | 0 | 0 | 90 |
| Sprint 2 | 72 | 0 | 0 | 72 |
| Sprint 3 | 72 | 0 | 0 | 72 |

- Số US đang cần xác nhận qua remote checks cho patch mới: **0**
- Số US còn Missing: **0**

## 2) Blocker phân loại

### P0 - Remote verification cho Sprint 3 legal hardening
- Da hoan tat chuoi PR:
  - [PR #16](https://github.com/eye-00/QLDA-UrbanchainVN/pull/16) - merged (`aa2b26a`),
  - [PR #17](https://github.com/eye-00/QLDA-UrbanchainVN/pull/17) - merged (`92c5d94`),
  - [PR #18](https://github.com/eye-00/QLDA-UrbanchainVN/pull/18) - merged (`288c65b`).
- Blocker hien tai: `None`.

### P1 - Legal acceptance alignment
- Da dong bo evidence sau merge chain, cac nhom:
  - `US-157..160`,
  - `US-187..192`,
  - `US-193..198`
  da chuyen `Done`.

### P2 - Quality hardening
- Không còn blocker đóng sprint.
- Hướng cải tiến tiếp theo: tăng E2E role-based mở rộng cho Sprint 3 để giảm residual risk dài hạn.

## 3) Kế hoạch xử lý theo thứ tự

1. Da merge PR #16 vao `develop`.
2. Da rebase/base-update va merge PR #17.
3. Da base-update + merge PR #18, checks pass.

## 4) Action ownership để đóng gap

| Công việc | Agent chính | Agent phối hợp | Output |
|---|---|---|---|
| Verify remote checks cho patch mới | AI_14 | AI_12, AI_13 | Done - chain PR #16/#17/#18 pass |
| Regression Sprint 3 legal hardening | AI_12 | AI_07, AI_09 | Done - checks pass o PR #16/#17/#18 |
| Đồng bộ closure docs | AI_15 | AI_03, AI_01 | Done - docs closeout da cap nhat |

## 5) Điều kiện chốt Done cuối cùng
- Không còn US `Missing`.
- US chỉ nâng `Done` khi có evidence code/test/docs và remote checks pass cho nhánh chứa thay đổi.
- Snapshot backlog và DoD được cập nhật đồng bộ cùng thời điểm đóng sprint.
