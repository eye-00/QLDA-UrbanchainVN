# Remote Gate Evidence (Sprint 1-2-3)

Cập nhật: 2026-04-28
Repo: `eye-00/QLDA-UrbanchainVN` (public)

## 1) Required checks evidence (GitHub Actions)

### PR #1 (Sprint 2 closeout code)
- PR: [#1](https://github.com/eye-00/QLDA-UrbanchainVN/pull/1)
- Kết quả checks:
  - `backend-ci`: pass
  - `frontend-ci`: pass
  - `contracts-ci`: pass
  - `docs-check`: pass
  - `changes`: pass

Chi tiết job URLs:
- [backend-ci](https://github.com/eye-00/QLDA-UrbanchainVN/actions/runs/25052340921/job/73383192805)
- [frontend-ci](https://github.com/eye-00/QLDA-UrbanchainVN/actions/runs/25052340921/job/73383192850)
- [contracts-ci](https://github.com/eye-00/QLDA-UrbanchainVN/actions/runs/25052340921/job/73383192813)
- [docs-check](https://github.com/eye-00/QLDA-UrbanchainVN/actions/runs/25052340921/job/73383192822)

### PR #2 (Sprint 2 docs closeout)
- PR: [#2](https://github.com/eye-00/QLDA-UrbanchainVN/pull/2)
- Kết quả checks:
  - `docs-check`: pass
  - `backend-ci`: skipped
  - `frontend-ci`: skipped
  - `contracts-ci`: skipped
  - `changes`: pass

Ghi chú: PR docs-only nên các lane code được skip theo điều kiện workflow.

### PR #3 (Sprint 3 phase 1 - open)
- PR: [#3](https://github.com/eye-00/QLDA-UrbanchainVN/pull/3)
- Kết quả checks hiện tại:
  - `backend-ci`: pass
  - `frontend-ci`: skipped
  - `contracts-ci`: skipped
  - `docs-check`: skipped
  - `changes`: pass

## 2) Branch protection evidence (đã bật)

Đã cấu hình branch protection cho `develop` bằng API:
- `required_status_checks.strict`: `true`
- `required_status_checks.contexts`: `backend-ci`, `frontend-ci`, `contracts-ci`, `docs-check`
- `required_pull_request_reviews.required_approving_review_count`: `1`
- `required_pull_request_reviews.require_code_owner_reviews`: `true`
- `required_conversation_resolution.enabled`: `true`

Verify API:
- `GET /repos/eye-00/QLDA-UrbanchainVN/branches/develop/protection` trả cấu hình hợp lệ.

## 3) Secret scanning evidence

Đã bật:
- `security_and_analysis.secret_scanning.status = enabled`
- `security_and_analysis.secret_scanning_push_protection.status = enabled`

Verify API:
- `GET /repos/eye-00/QLDA-UrbanchainVN` (field `security_and_analysis`) trả `enabled`.
- `GET /repos/eye-00/QLDA-UrbanchainVN/secret-scanning/alerts` trả số lượng alerts hiện tại: `0`.

## 4) Trạng thái remote gate hiện tại

- `Required checks`: **có evidence pass** trên PR chain Sprint 2.
- `Branch protection` trên `develop`: **đã bật và enforce required checks**.
- `Secret scanning + push protection`: **đã bật**.

=> Remote gate không còn blocker hạ tầng.

## 5) Hành động tiếp theo

Để chốt `Done` theo DoD:
1. Re-run/verify PR checks cho các patch còn mở theo policy mới (branch protection đã bật).
2. Cập nhật lại ma trận trạng thái US trong `docs/12-us-audit-sprint1-3.md` từ `Partial (remote)` sang trạng thái mới theo evidence hiện hành.
3. Đóng gap `Missing` còn lại của Sprint 2 và Sprint 3 theo `docs/13-us-gap-remediation-plan.md`.
