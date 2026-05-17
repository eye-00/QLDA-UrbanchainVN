# Definition of Done

## Legal Source Reference

- Legal source register: [00-legal-basis-register.md](./00-legal-basis-register.md)
- Requirement traceability: [16-legal-requirement-traceability.md](./16-legal-requirement-traceability.md)

Rule chấm tiến độ:

- Không nâng `Done` cho US/LEG item nếu thiếu legal evidence tương ứng trong ma trận traceability.

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
- Sprint 1 Epic 13 (wallet):
  - wallet connect + challenge + verify (EIP-191) hoat dong,
  - nonce one-time co TTL va tu choi replay,
  - khong luu private key/seed phrase/chu ky tho trong log.
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

## Sprint 1 Closure Note (2026-05-10)

### Co the verify local

- Auth/Test/Audit evidence co san trong repo:
  - [backend/test/auth-rbac.test.ts](../backend/test/auth-rbac.test.ts)
  - [backend/src/modules/auth/auth.routes.ts](../backend/src/modules/auth/auth.routes.ts)
  - [backend/src/modules/audit/audit.routes.ts](../backend/src/modules/audit/audit.routes.ts)
  - [backend/test/sprint1-wallet.test.ts](../backend/test/sprint1-wallet.test.ts)
  - [frontend/test/wallet-helpers.test.ts](../frontend/test/wallet-helpers.test.ts)
  - [frontend/src/pages/WalletManagementPage.tsx](../frontend/src/pages/WalletManagementPage.tsx)
  - [README.md#sprint-1-verification-commands](../README.md#sprint-1-verification-commands)
  - [.github/workflows/ci.yml](../.github/workflows/ci.yml)

### Verify GitHub remote (da xac nhan)

- PR wallet backend/data: [#6](https://github.com/eye-00/QLDA-UrbanchainVN/pull/6) da merge vao `develop` (merge commit `89c85ed`), checks pass theo policy.
- PR wallet frontend/docs: [#7](https://github.com/eye-00/QLDA-UrbanchainVN/pull/7) da merge vao `develop` (merge commit `e8605bf`), checks pass theo policy.
- Branch protection `develop` bat required checks `backend-ci`, `frontend-ci`, `contracts-ci`, `docs-check`.
- Secret scanning + push protection dang bat, open alerts = `0`.

### Trang thai closure ghi nhan

- Nhom US Sprint 1 (bao gom wallet `US-547..558`): `Done`.

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
  - [backend/test/sprint2-legal.test.ts](../backend/test/sprint2-legal.test.ts)
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
  - [scripts/npmw.ps1](../scripts/npmw.ps1)
  - [scripts/dev.ps1](../scripts/dev.ps1)

### Verify GitHub remote (da xac nhan)

- PR closeout Sprint 2: [#1](https://github.com/eye-00/QLDA-UrbanchainVN/pull/1) da merge vao `develop`.
- Required checks tren PR #1 da pass: `changes`, `backend-ci`, `frontend-ci`, `contracts-ci`, `docs-check`.
- Merge commit tren `develop`: `f211a90`.

### Trang thai closure ghi nhan

- Nhom US Sprint 2 Must+Should: `Done`.
- LEG-S2 legal closeout da du evidence:
  - [backend/test/sprint2-legal.test.ts](../backend/test/sprint2-legal.test.ts)
  - [frontend/test/registration-review-helpers.test.ts](../frontend/test/registration-review-helpers.test.ts)
  - [frontend/test/registration-submission-helpers.test.ts](../frontend/test/registration-submission-helpers.test.ts)
  - [docs/16-legal-requirement-traceability.md](./16-legal-requirement-traceability.md)
- Full local gate duoc verify lai ngay `2026-05-17`:
  - `npm run db:generate`
  - `npm run db:migrate`
  - `npm run db:seed`
  - `npm run lint`
  - `npm run build`
  - `npm test` (contracts `7/7`, backend `40/40`, frontend `47/47`)

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
- Trang thai phase: `Done` (implementation + test + remote gate + legal closeout da du evidence).

## Sprint 3 Phase 2 Gate (Registration review UI)

- Frontend officer review scope da co:
  - [frontend/src/pages/RegistrationReviewPage.tsx](../frontend/src/pages/RegistrationReviewPage.tsx)
  - [frontend/src/pages/CitizenRegistrationPage.tsx](../frontend/src/pages/CitizenRegistrationPage.tsx)
  - [frontend/src/ui/registrationStatus.ts](../frontend/src/ui/registrationStatus.ts)
  - [frontend/src/pages/registrationReviewHelpers.ts](../frontend/src/pages/registrationReviewHelpers.ts)
- Frontend verify:
  - `npm --workspace frontend run test`
  - `npm --workspace frontend run build`
- Trang thai phase: `Done` (frontend test/build pass va helper legal payload da dong bo voi backend).

## Sprint 3 Closure Note (2026-05-17)

### Co the verify local

- Backend review-flow legal evidence:
  - [backend/test/sprint3-registration.test.ts](../backend/test/sprint3-registration.test.ts)
  - [backend/src/modules/registrations/registration.routes.ts](../backend/src/modules/registrations/registration.routes.ts)
- Frontend review-flow legal evidence:
  - [frontend/test/registration-review-helpers.test.ts](../frontend/test/registration-review-helpers.test.ts)
  - [frontend/test/registration-status.test.ts](../frontend/test/registration-status.test.ts)
  - [frontend/src/pages/RegistrationReviewDetailPage.tsx](../frontend/src/pages/RegistrationReviewDetailPage.tsx)
  - [frontend/src/pages/registrationReviewHelpers.ts](../frontend/src/pages/registrationReviewHelpers.ts)
- Verify bo sung ngay `2026-05-17`:
  - `npm --workspace backend run test -- test/sprint3-registration.test.ts` (`8/8` pass)
  - `npm --workspace frontend run test` (`47/47` pass)
  - `npm --workspace frontend run build`

### Verify GitHub remote (da xac nhan)

- Chuoi PR Sprint 3 legal hardening:
  - [#16](https://github.com/eye-00/QLDA-UrbanchainVN/pull/16)
  - [#17](https://github.com/eye-00/QLDA-UrbanchainVN/pull/17)
  - [#18](https://github.com/eye-00/QLDA-UrbanchainVN/pull/18)
- PR closeout tong hop Sprint 2/3:
  - [#4](https://github.com/eye-00/QLDA-UrbanchainVN/pull/4) da merge vao `develop` (merge commit `e894775`)
- Required checks da pass theo policy repo.

### Trang thai closure ghi nhan

- `LEG-S3-001` Commune confirmation legal-aligned: `Done`
- `LEG-S3-002` Supplement request co danh muc thieu + deadline: `Done`
- `LEG-S3-003` Document version history timeline: `Done`
- Nhom US Sprint 3: `Done`

### RBAC x Action matrix (UI review phase)

| Role                  | Tiep nhan | Bo sung | Tu choi | Xac nhan xa | Chuyen thue | Phe duyet | Blockchain sync |
| --------------------- | --------- | ------- | ------- | ----------- | ----------- | --------- | --------------- |
| RECEPTION_OFFICER     | Yes       | Yes     | No      | No          | No          | No        | No              |
| COMMUNE_OFFICER       | No        | Yes     | No      | Yes         | No          | No        | No              |
| LAND_REGISTRY_OFFICER | No        | Yes     | Yes     | No          | Yes         | No        | Yes             |
| APPROVAL_AUTHORITY    | No        | No      | Yes     | No          | No          | Yes       | Yes             |
| ADMIN                 | Yes       | Yes     | Yes     | Yes         | Yes         | Yes       | Yes             |

## Sprint 1-2-3 US Audit Note (2026-04-29)

- Bao cao chi tiet tung US: [docs/12-us-audit-sprint1-3.md](./12-us-audit-sprint1-3.md).
- Ke hoach bu thieu va dong gap: [docs/13-us-gap-remediation-plan.md](./13-us-gap-remediation-plan.md).
- Remote gate evidence: [docs/14-remote-gate-evidence.md](./14-remote-gate-evidence.md).
- Remote gate infra status (2026-04-28): `develop` branch protection da bat, required checks da cau hinh, secret scanning + push protection da bat.
- PR closeout Sprint 2/3: [#4](https://github.com/eye-00/QLDA-UrbanchainVN/pull/4) da merge vao `develop` (merge commit `e894775`), checks pass theo policy.
- Quy tac dong sprint giu nguyen:
  - Khong nang `Done` neu thieu evidence remote gate.
  - Khong nang `Done` neu thieu legal evidence map theo `docs/16-legal-requirement-traceability.md`.
  - US `Missing` phai co implementation/test/docs bo sung truoc khi chot sprint.

## Trang thai sprint hien hanh (Legal Baseline)

| Sprint   | Trang thai hien hanh | Ghi chu                                                                   |
| -------- | -------------------- | ------------------------------------------------------------------------- |
| Sprint 1 | Done                 | Da dat full gate + wallet `US-547..558`.                                  |
| Sprint 2 | Done                 | LEG-S2-001..005 da dong bang evidence code/test/docs va remote gate.      |
| Sprint 3 | Done                 | `LEG-S3-001..003` da co evidence code/test/docs va remote gate.           |
| Sprint 4 | Partial              | Con legal blocker `LEG-S4-001` va governance closeout nhom `US-565..576`. |

---

# PHỤ LỤC — Legal Definition of Done cho Sprint 2+

Một US từ Sprint 2 trở đi chỉ được `Done` khi đạt thêm các điều kiện pháp lý/nghiệp vụ sau:

## 1. Legal source mapping

- [ ] Có `legalBasis` hoặc `procedureCode` nếu liên quan thủ tục đất đai.
- [ ] Đã kiểm tra QĐ 3380 trước QĐ 2304 khi thủ tục có sửa đổi/bổ sung.
- [ ] Actor xử lý khớp NĐ 151/2025 về phân định thẩm quyền 02 cấp.
- [ ] Nếu không chắc nguồn pháp lý, gắn `NEEDS_PM_DECISION`.

## 2. Workflow/state gate

- [ ] Không bỏ qua cơ quan tiếp nhận.
- [ ] Không bỏ qua UBND cấp xã nếu workflow yêu cầu.
- [ ] Không bỏ qua VPĐKĐĐ/Chi nhánh ở bước thẩm định/cập nhật hồ sơ địa chính.
- [ ] Không bỏ qua cơ quan thuế nếu có nghĩa vụ tài chính.
- [ ] Không ghi blockchain trước khi off-chain đạt trạng thái hợp lệ.

## 3. Data privacy/on-chain gate

- [ ] Không lưu PII/file scan/polygon đầy đủ on-chain.
- [ ] Chỉ ghi hash/CID/tx/event/reference.
- [ ] Signature payload không chứa dữ liệu cá nhân nhạy cảm.
- [ ] QR/payment payload không lộ CCCD, địa chỉ chi tiết, hồ sơ nhạy cảm.

## 4. Document version/signature gate

- [ ] Upload/thay thế tài liệu tạo version mới.
- [ ] Submit hồ sơ khóa snapshot tài liệu.
- [ ] Yêu cầu bổ sung không xóa bản cũ.
- [ ] Ký số/ví chỉ ký hash/metadata an toàn.
- [ ] Xác minh chữ ký/hash có test positive/negative.

## 5. Map parcel gate

- [ ] Có `geometry_source_type`.
- [ ] Dữ liệu demo phải có nhãn demo.
- [ ] Nếu ghi blockchain chỉ ghi boundary/dataset hash.
- [ ] Có test role-based access cho bản đồ.

## 6. Payment gate

- [ ] Tách `INTAKE_FEE` và `LAND_FINANCIAL_OBLIGATION`.
- [ ] MoMo Test/QR được ghi rõ là mô phỏng.
- [ ] Không gọi crypto/token là phương tiện nộp thuế/phí thật.
- [ ] Có audit log khi xác nhận/ghi biên lai.
