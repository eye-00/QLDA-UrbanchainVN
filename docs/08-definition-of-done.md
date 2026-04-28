# Definition of Done

Mot backlog item duoc xem la Done khi:
- Da map voi backlog ID
- Code compile/build pass
- Test lien quan pass
- Docs lien quan da cap nhat
- Assumptions duoc ghi ro
- Khong vi pham on-chain rules
- Da qua review cua PM/lead phu trach

## Sprint 1 Full Gate (bat buoc)
- CI lane checks pass: `backend-ci`, `frontend-ci`, `contracts-ci`, `docs-check`.
- Security P0/P1 pass:
  - khong role escalation o public register,
  - user LOCKED khong login duoc,
  - refresh/logout lifecycle hoat dong,
  - ownership scope cho du lieu ca nhan.
- Audit APIs hoat dong dung RBAC (`/audit/access-logs`, `/audit/user-actions`, `/audit/rbac-changes`).
- Lint/build/test pass o root:
  - `npm run lint`
  - `npm run build`
  - `npm test`
- Docs dong bo:
  - `docs/04-backlog-mvp.md`
  - `docs/07-api-contract.md`
  - `README.md`
- Backlog closure co bang trang thai `Done/Partial/Missing` va evidence.

## Sprint 1 Closure Note (2026-04-28)

### Co the verify local
- Auth/Test/Audit evidence co san trong repo:
  - [backend/test/auth-rbac.test.ts](../backend/test/auth-rbac.test.ts)
  - [backend/src/modules/auth/auth.routes.ts](../backend/src/modules/auth/auth.routes.ts)
  - [backend/src/modules/audit/audit.routes.ts](../backend/src/modules/audit/audit.routes.ts)
  - [README.md#sprint-1-verification-commands](../README.md#sprint-1-verification-commands)
  - [.github/workflows/ci.yml](../.github/workflows/ci.yml)

### Phu thuoc GitHub remote (khong verify day du bang local)
- Branch protection rules cua nhanh dich.
- Required checks da duoc bat va pass tren PR (backend-ci, frontend-ci, contracts-ci, docs-check).
- Secret scanning / push protection trang thai pass tren repository.

### Trang thai closure ghi nhan
- Nhom US Auth/Test/Audit: `Partial` (da co endpoint/test/evidence link trong repo, con phu thuoc gate remote de chot Done).

## Sprint 2 Full Gate (bat buoc)
- CI lane checks pass: `backend-ci`, `frontend-ci`, `contracts-ci`, `docs-check`.
- Scope Must+Should Sprint 2 da du:
  - user/org/land APIs tren `/api/v1`,
  - dashboard summary theo role,
  - error envelope nhat quan,
  - UX CRUD + toast success/error.
- Lint/build/test pass o root:
  - `npm run lint`
  - `npm run build`
  - `npm test`
- Docs dong bo:
  - `docs/04-backlog-mvp.md`
  - `docs/07-api-contract.md`
  - `README.md`
- Backlog closure Sprint 2 co bang `Done/Partial/Missing` + evidence.

## Sprint 2 Closure Note (2026-04-28)

### Co the verify local
- Backend sprint 2 implementation va regression:
  - [backend/test/sprint2.test.ts](../backend/test/sprint2.test.ts)
  - [backend/src/modules/users/user.routes.ts](../backend/src/modules/users/user.routes.ts)
  - [backend/src/modules/organizations/organization.routes.ts](../backend/src/modules/organizations/organization.routes.ts)
  - [backend/src/modules/lands/land.routes.ts](../backend/src/modules/lands/land.routes.ts)
  - [backend/src/modules/dashboard/dashboard.routes.ts](../backend/src/modules/dashboard/dashboard.routes.ts)
- Frontend sprint 2 coverage bo sung:
  - [frontend/test/sprint2-crud-flows.test.ts](../frontend/test/sprint2-crud-flows.test.ts)
  - [frontend/test/toast-behavior.test.ts](../frontend/test/toast-behavior.test.ts)
  - [frontend/test/api-error-envelope.test.ts](../frontend/test/api-error-envelope.test.ts)

### Phu thuoc GitHub remote (khong verify day du bang local)
- Branch protection rules cua nhanh `develop`.
- Required checks da duoc bat va pass tren chuoi PR merge Sprint 2 (`backend-ci`, `frontend-ci`, `contracts-ci`, `docs-check`).
- Secret scanning / push protection status pass tren repository.

### Trang thai closure ghi nhan
- Nhom US Sprint 2 Must+Should: `Partial` (local implementation/test/docs da co; con phu thuoc remote gate de chot Done).
