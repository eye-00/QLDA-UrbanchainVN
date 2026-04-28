# US Gap Remediation Plan - Sprint 1, Sprint 2, Sprint 3

Cập nhật: 2026-04-28 23:51:50

## 1) Tổng quan kết quả audit

| Sprint | Done | Partial | Missing | Tổng US |
|---|---:|---:|---:|---:|
| Sprint 1 | 90 | 0 | 0 | 90 |
| Sprint 2 | 0 | 72 | 0 | 72 |
| Sprint 3 | 0 | 72 | 0 | 72 |

- Số US đang cần xác nhận qua remote checks cho patch mới: **144**
- Số US còn Missing: **0**

## 2) Blocker phân loại

### P0 - Remote verification cho commit mới
- Hạ tầng remote gate đã bật (`develop` protection + required checks + secret scanning + push protection).
- Cần chạy/passing checks cho các PR patch mới để nâng trạng thái `Partial` lên `Done`.
- Evidence: [docs/14-remote-gate-evidence.md](./14-remote-gate-evidence.md).

### P1 - Missing implementation/test evidence
- **Đã đóng toàn bộ nhóm Missing cũ**: Sprint 2 (`US-091..096`), Sprint 3 (`US-193..204`).
- Trạng thái hiện tại: chuyển từ `Missing` -> `Partial` do còn chờ verify PR checks/regression mở rộng.

### P2 - Quality hardening
- Mở rộng map acceptance -> testcase 1-1 cho các US Sprint 2/3 còn Partial.
- Bổ sung E2E role-based cho officer/citizen flow để giảm residual risk.

## 3) Kế hoạch xử lý theo thứ tự

1. Mở PR cho patch mới và đảm bảo 4 checks (`backend-ci`, `frontend-ci`, `contracts-ci`, `docs-check`) pass trên `develop` policy.
2. Chạy regression Sprint 2/3, đặc biệt nhóm file integrity và registration notifications.
3. Sau khi có evidence remote pass, cập nhật `docs/12` để nâng các US đủ điều kiện sang `Done`.

## 4) Action ownership để đóng gap

| Công việc | Agent chính | Agent phối hợp | Output |
|---|---|---|---|
| Verify remote checks cho patch mới | AI_14 | AI_12, AI_13 | Links check-runs pass trên PR chain |
| Regression Sprint 2/3 (integrity + notifications) | AI_12 | AI_07, AI_09 | Test report + residual risks |
| Đồng bộ closure docs | AI_15 | AI_03, AI_01 | Update docs/04, docs/08, docs/12, docs/13 |

## 5) Điều kiện chốt Done cuối cùng
- Không còn US `Missing`.
- US chỉ nâng `Done` khi có evidence code/test/docs và remote checks pass cho nhánh chứa thay đổi.
- Snapshot backlog và DoD được cập nhật đồng bộ cùng thời điểm đóng sprint.
