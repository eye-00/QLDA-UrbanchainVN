# Remote Gate Evidence (Sprint 1-2-3)

Cập nhật: 2026-05-10
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

### PR #3 (Sprint 3 phase 1)
- PR: [#3](https://github.com/eye-00/QLDA-UrbanchainVN/pull/3)
- Kết quả checks hiện tại:
  - `backend-ci`: pass
  - `frontend-ci`: skipped
  - `contracts-ci`: skipped
  - `docs-check`: skipped
  - `changes`: pass

### PR #4 (Sprint 2/3 closeout merge)
- PR: [#4](https://github.com/eye-00/QLDA-UrbanchainVN/pull/4)
- Merge commit: `e894775`
- Kết quả checks:
  - `backend-ci`: pass
  - `frontend-ci`: pass
  - `contracts-ci`: skipped (path filter)
  - `docs-check`: pass
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

- `Required checks`: **có evidence pass** trên PR chain Sprint 2 + Sprint 3 closeout.
- `Branch protection` trên `develop`: **đã bật và enforce required checks**.
- `Secret scanning + push protection`: **đã bật**.

=> Remote gate không còn blocker hạ tầng, và đã có evidence pass cho nhánh closeout mới nhất.

## 5) Hành động tiếp theo

1. Duy trì branch protection + required checks như hiện tại cho Sprint 4+.
2. Giữ cập nhật docs audit (`docs/12`, `docs/13`) sau mỗi PR thay đổi trạng thái US.

## 6) Sprint 3 legal hardening chain evidence (2026-05-10)

### PR #16 (Backend legal hardening)
- PR: [#16](https://github.com/eye-00/QLDA-UrbanchainVN/pull/16)
- Merge commit: `aa2b26a`
- Kết quả checks:
  - `backend-ci`: pass
  - `frontend-ci`: skipped
  - `contracts-ci`: skipped
  - `docs-check`: skipped
  - `changes`: pass

### PR #17 (Frontend legal UX)
- PR: [#17](https://github.com/eye-00/QLDA-UrbanchainVN/pull/17)
- Merge commit: `92c5d94`
- Kết quả checks:
  - `frontend-ci`: pass
  - `backend-ci`: skipped
  - `contracts-ci`: skipped
  - `docs-check`: skipped
  - `changes`: pass

### PR #18 (QA/docs closeout)
- PR: [#18](https://github.com/eye-00/QLDA-UrbanchainVN/pull/18)
- Merge commit: `288c65b`
- Kết quả checks:
  - `backend-ci`: pass
  - `frontend-ci`: pass
  - `contracts-ci`: skipped
  - `docs-check`: pass
  - `changes`: pass
