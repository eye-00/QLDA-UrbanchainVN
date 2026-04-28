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
