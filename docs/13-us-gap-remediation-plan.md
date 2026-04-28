# US Gap Remediation Plan - Sprint 1, Sprint 2, Sprint 3

Cập nhật: 2026-04-29 00:10:00

## 1) Tổng quan kết quả audit

| Sprint | Done | Partial | Missing | Tổng US |
|---|---:|---:|---:|---:|
| Sprint 1 | 90 | 0 | 0 | 90 |
| Sprint 2 | 72 | 0 | 0 | 72 |
| Sprint 3 | 72 | 0 | 0 | 72 |

- Số US đang cần xác nhận qua remote checks cho patch mới: **0**
- Số US còn Missing: **0**

## 2) Blocker phân loại

### P0 - Remote verification cho commit mới
- Đã hoàn tất verify remote gate cho PR closeout: [PR #4](https://github.com/eye-00/QLDA-UrbanchainVN/pull/4).
- Required checks đã pass: `backend-ci`, `frontend-ci`, `docs-check` (và `contracts-ci` được skip theo path filter).
- Merge commit trên `develop`: `e894775`.
- Evidence: [docs/14-remote-gate-evidence.md](./14-remote-gate-evidence.md).

### P1 - Missing implementation/test evidence
- **Đã đóng toàn bộ nhóm Missing cũ**: Sprint 2 (`US-091..096`), Sprint 3 (`US-193..204`).
- Trạng thái hiện tại: `Done` sau khi đã có implementation + test + docs + remote gate evidence.

### P2 - Quality hardening
- Không còn blocker đóng sprint.
- Hướng cải tiến tiếp theo: tăng E2E role-based mở rộng cho Sprint 3 để giảm residual risk dài hạn.

## 3) Kế hoạch xử lý theo thứ tự

1. Đã mở và merge PR closeout [#4](https://github.com/eye-00/QLDA-UrbanchainVN/pull/4) vào `develop`.
2. Đã pass regression local (`npm run lint`, `npm run build`, `npm test`) trước khi merge.
3. Đã cập nhật `docs/12` để nâng US Sprint 2/3 lên `Done`.

## 4) Action ownership để đóng gap

| Công việc | Agent chính | Agent phối hợp | Output |
|---|---|---|---|
| Verify remote checks cho patch mới | AI_14 | AI_12, AI_13 | Done - checks pass trên PR #4 |
| Regression Sprint 2/3 (integrity + notifications) | AI_12 | AI_07, AI_09 | Done - local test gate pass |
| Đồng bộ closure docs | AI_15 | AI_03, AI_01 | Done - cập nhật docs/12, docs/13, docs/08 |

## 5) Điều kiện chốt Done cuối cùng
- Không còn US `Missing`.
- US chỉ nâng `Done` khi có evidence code/test/docs và remote checks pass cho nhánh chứa thay đổi.
- Snapshot backlog và DoD được cập nhật đồng bộ cùng thời điểm đóng sprint.
