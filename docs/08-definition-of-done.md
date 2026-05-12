# Definition of Done

## Legal Source Reference

- Nguồn pháp lý chuẩn: [00-legal-basis-register.md](./00-legal-basis-register.md)
- Ma trận traceability: [docs-legal-aligned/16-legal-requirement-traceability.md](./docs-legal-aligned/16-legal-requirement-traceability.md)

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

## Sprint 2 Closure Note (2026-04-28, cập nhật remote gate 19:20 ICT) — Historical Snapshot

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

### Trang thai closure ghi nhan (truoc legal rebaseline)
- Nhom US Sprint 2 Must+Should: `Done` theo snapshot cu.

## Sprint 3 Phase 1 Gate (Registration core) — Historical Snapshot
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
- Trang thai phase: `Done` (da co implementation + test + remote gate evidence tren PR #4).

## Sprint 3 Phase 2 Gate (Registration review UI) — Historical Snapshot
- Frontend officer review scope da co:
  - [frontend/src/pages/RegistrationReviewPage.tsx](../frontend/src/pages/RegistrationReviewPage.tsx)
  - [frontend/src/pages/CitizenRegistrationPage.tsx](../frontend/src/pages/CitizenRegistrationPage.tsx)
  - [frontend/src/ui/registrationStatus.ts](../frontend/src/ui/registrationStatus.ts)
  - [frontend/src/pages/registrationReviewHelpers.ts](../frontend/src/pages/registrationReviewHelpers.ts)
- Frontend verify:
  - `npm --workspace frontend run test`
  - `npm --workspace frontend run build`
- Trang thai phase: `Done` (frontend test/build pass, route/RBAC flow pass, remote checks pass tren PR #4).

### RBAC x Action matrix (UI review phase)
| Role | Tiep nhan | Bo sung | Tu choi | Xac nhan xa | Chuyen thue | Phe duyet | Blockchain sync |
|---|---|---|---|---|---|---|---|
| RECEPTION_OFFICER | Yes | Yes | No | No | No | No | No |
| COMMUNE_OFFICER | No | Yes | No | Yes | No | No | No |
| LAND_REGISTRY_OFFICER | No | Yes | Yes | No | Yes | No | Yes |
| APPROVAL_AUTHORITY | No | No | Yes | No | No | Yes | Yes |
| ADMIN | Yes | Yes | Yes | Yes | Yes | Yes | Yes |

## Legal Rebaseline Note (2026-05-10)

Sau khi doi soat theo bo tai lieu `docs/docs-legal-aligned`, trang thai sprint duoc cap nhat theo legal baseline moi:

- Sprint 1: `Done` (giu nguyen, bao gom wallet `US-547..558`).
- Sprint 2: `Partial` (chua dat day du legal gates moi).
- Sprint 3: `Partial` (chua dat day du legal gates moi).
- Sprint 4: `Partial` (chua dat legal gate `LEG-S4-001`).

Legal gaps bat buoc phai dong truoc khi nang lai `Done` cho Sprint 2/3:

1. Chua co legal procedure registry + authority matrix day du.
2. Chua co document versioning + submit snapshot theo workflow phap ly.
3. Chua tach day du payment model (`INTAKE_FEE` va `LAND_FINANCIAL_OBLIGATION`).
4. Chua khoa transition gate bat buoc `legalBasisCode` + actor/status validation.
5. Chua khoa precondition "chi ghi blockchain sau khi off-chain dat trang thai hop le".

Luu y:
- Ket luan rebaseline nay uu tien hon cac closure snapshot cu trong tai lieu.
- Remote gate pass khong du de danh dau `Done` neu legal gates chua dat.
- Cac section "closure snapshot" cu (neu co) chi de truy vet lich su, khong dung de chot trang thai hien tai.

## Sprint 1-2-3 US Audit Note (2026-04-29)
- Bao cao chi tiet tung US: [docs/12-us-audit-sprint1-3.md](./12-us-audit-sprint1-3.md).
- Ke hoach bu thieu va dong gap: [docs/13-us-gap-remediation-plan.md](./13-us-gap-remediation-plan.md).
- Remote gate evidence: [docs/14-remote-gate-evidence.md](./14-remote-gate-evidence.md).
- Remote gate infra status (2026-04-28): `develop` branch protection da bat, required checks da cau hinh, secret scanning + push protection da bat.
- PR closeout Sprint 2/3: [#4](https://github.com/eye-00/QLDA-UrbanchainVN/pull/4) da merge vao `develop` (merge commit `e894775`), checks pass theo policy.
- Quy tac dong sprint giu nguyen:
  - Khong nang `Done` neu thieu evidence remote gate.
  - US `Missing` phai co implementation/test/docs bo sung truoc khi chot sprint.

## Technical Gate Update (2026-05-12)

Cap nhat xac nhan da go blocker ky thuat compile/test tren nhanh `develop`:

- PR technical closeout: [#24](https://github.com/eye-00/QLDA-UrbanchainVN/pull/24) da merge.
- Required checks pass day du tren PR #24:
  - `backend-ci`
  - `frontend-ci`
  - `contracts-ci`
  - `docs-check`
  - `changes`
- Xac nhan local full test gate pass:
  - `npm run db:migrate`
  - `npm run db:seed`
  - `npm test` (contracts `7/7`, backend `36/36`, frontend `37/37`).

Gioi han:
- Muc nay chi xac nhan on dinh ky thuat build/test.
- Trang thai legal closure Sprint 2/3/4 van theo `Legal Rebaseline Note (2026-05-10)` cho den khi dong du legal blockers.

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
