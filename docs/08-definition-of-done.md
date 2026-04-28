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
  - UX CRUD + toast success/error,
  - dia gioi 2 cap (`Tinh/Thanh pho` + `Xa/Phuong/Dac khu`) tren backend + frontend.
- Lint/build/test pass o root:
  - `npm run lint`
  - `npm run build`
  - `npm test`
- Docs dong bo:
  - `docs/04-backlog-mvp.md`
  - `docs/07-api-contract.md`
  - `README.md`
- Backlog closure Sprint 2 co bang `Done/Partial/Missing` + evidence.

## Sprint 2 Closure Note (2026-04-28, cập nhật remote gate 19:20 ICT)

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
  - [frontend/test/dashboard-labels.test.ts](../frontend/test/dashboard-labels.test.ts)
  - [frontend/test/vn-address.test.ts](../frontend/test/vn-address.test.ts)
  - [frontend/src/App.tsx](../frontend/src/App.tsx)
  - [frontend/src/styles.css](../frontend/src/styles.css)
  - [frontend/src/lib/vnAddress.ts](../frontend/src/lib/vnAddress.ts)
- Bao cao verify closeout:
  - [docs/10-sprint-closure-matrix.md](./10-sprint-closure-matrix.md)
  - [docs/11-sprint-closure-verification.md](./11-sprint-closure-verification.md)

### Verify GitHub remote (da xac nhan)
- PR closeout Sprint 2: [#1](https://github.com/eye-00/QLDA-UrbanchainVN/pull/1) da merge vao `develop`.
- Required checks tren PR #1 da pass: `changes`, `backend-ci`, `frontend-ci`, `contracts-ci`, `docs-check`.
- Merge commit tren `develop`: `f211a90`.

### Trang thai closure ghi nhan
- Nhom US Sprint 2 Must+Should: `Done`.

## Sprint 3 Phase 1 Gate (Registration core)
- Data + API core da duoc mo:
  - `POST /registrations`
  - `POST /registrations/:id/submit`
  - `PATCH /registrations/:id/status`
  - `POST /registrations/:id/commune-confirm`
  - `POST /registrations/:id/tax-transfer`
  - `POST /registrations/:id/approve`
  - `POST /registrations/:id/blockchain-sync`
- Prisma migration va seed da cap nhat cho Registration data model (province/commune, owner info, note history).
- Local verify toi thieu:
  - `npm run db:generate`
  - `npm run db:migrate`
  - `npm run db:seed`
  - `npm --workspace backend run build`
  - `npm --workspace backend run test -- sprint3-registration.test.ts`
  - `npm --workspace backend run test -- auth-rbac.test.ts`
- Trang thai phase: `In Progress` (chua bao gom UI review queue/day du closure Sprint 3 + remote gate).

## Sprint 3 Phase 2 Gate (Registration review UI)
- Frontend officer review scope da co:
  - [frontend/src/pages/RegistrationReviewPage.tsx](../frontend/src/pages/RegistrationReviewPage.tsx)
  - [frontend/src/pages/CitizenRegistrationPage.tsx](../frontend/src/pages/CitizenRegistrationPage.tsx)
  - [frontend/src/ui/registrationStatus.ts](../frontend/src/ui/registrationStatus.ts)
  - [frontend/src/pages/registrationReviewHelpers.ts](../frontend/src/pages/registrationReviewHelpers.ts)
- Frontend verify:
  - `npm --workspace frontend run test`
  - `npm --workspace frontend run build`
- Trang thai phase: `In Progress` (can them E2E role flows + backend integration pass tren DB test + remote gate).

### RBAC x Action matrix (UI review phase)
| Role | Tiep nhan | Bo sung | Tu choi | Xac nhan xa | Chuyen thue | Phe duyet | Blockchain sync |
|---|---|---|---|---|---|---|---|
| RECEPTION_OFFICER | Yes | Yes | No | No | No | No | No |
| COMMUNE_OFFICER | No | Yes | No | Yes | No | No | No |
| LAND_REGISTRY_OFFICER | No | Yes | Yes | No | Yes | No | Yes |
| APPROVAL_AUTHORITY | No | No | Yes | No | No | Yes | Yes |
| ADMIN | Yes | Yes | Yes | Yes | Yes | Yes | Yes |

## Sprint 1-2-3 US Audit Note (2026-04-28)
- Bao cao chi tiet tung US: [docs/12-us-audit-sprint1-3.md](./12-us-audit-sprint1-3.md).
- Ke hoach bu thieu va dong gap: [docs/13-us-gap-remediation-plan.md](./13-us-gap-remediation-plan.md).
- Remote gate evidence: [docs/14-remote-gate-evidence.md](./14-remote-gate-evidence.md).
- Remote gate infra status (2026-04-28): `develop` branch protection da bat, required checks da cau hinh, secret scanning + push protection da bat.
- Quy tac dong sprint giu nguyen:
  - Khong nang `Done` neu thieu evidence remote gate.
  - US `Missing` phai co implementation/test/docs bo sung truoc khi chot sprint.
