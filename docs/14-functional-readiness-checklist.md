# 14. Functional Readiness Checklist

## Mục tiêu

Checklist này dùng để đánh giá mức độ hoàn thiện theo **chức năng yêu cầu** và xác nhận trạng thái **Đạt / Một phần / Chưa đạt** trước khi chốt sprint.

Legal evidence reference:

- [docs-legal-aligned/16-legal-requirement-traceability.md](./docs-legal-aligned/16-legal-requirement-traceability.md)
- [00-legal-basis-register.md](./00-legal-basis-register.md)

Quy ước:

- `✅ Đạt`: chức năng chạy đúng luồng, đúng API/RBAC, không còn blocker.
- `⚠️ Một phần`: đã có chức năng nhưng còn gap ảnh hưởng nghiệm thu.
- `❌ Chưa đạt`: chưa có hoặc chưa đáp ứng tiêu chí chính.

## Checklist chức năng + trạng thái hiện tại

| Chức năng yêu cầu                         | Tiêu chí kiểm tra                                                                                      | Trạng thái hiện tại                                 | Evidence chính                                                                                                                                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Đăng nhập/đăng xuất                       | Login theo role, logout, thông báo lỗi đúng                                                            | ✅ Đạt                                              | `frontend/src/pages/LoginPage.tsx`, `backend/src/modules/auth/auth.routes.ts`                                                                                                                                                                |
| VNeID mock (demo)                         | Có luồng mock login, chỉ dùng môi trường demo                                                          | ✅ Đạt                                              | `frontend/src/pages/LoginPage.tsx`, `backend/src/modules/auth/auth.routes.ts`                                                                                                                                                                |
| RBAC route frontend                       | Citizen/Admin/Officer vào đúng màn được phép                                                           | ✅ Đạt                                              | `frontend/src/App.tsx`, `frontend/src/auth/roles.ts`                                                                                                                                                                                         |
| Quản lý ví blockchain (Sprint 1)          | Connect -> challenge -> verify (EIP-191) -> set default                                                | ✅ Đạt                                              | `frontend/src/pages/WalletManagementPage.tsx`, `backend/src/modules/wallets/wallet.routes.ts`                                                                                                                                                |
| Upload và đính kèm tài liệu hồ sơ đăng ký | Upload file lên IPFS, nhận `fileId`, attach vào create registration, xem/download/integrity theo hồ sơ | ✅ Đạt (cần verify E2E thêm khi môi trường ổn định) | `frontend/src/pages/CitizenRegistrationPage.tsx`, `frontend/src/lib/files.ts`, `frontend/src/pages/RegistrationReviewDetailPage.tsx`, `backend/src/modules/files/file.routes.ts`, `backend/src/modules/registrations/registration.routes.ts` |
| Nộp hồ sơ đăng ký lần đầu                 | Tạo hồ sơ, gửi hồ sơ, xem trạng thái/ghi chú                                                           | ✅ Đạt                                              | `frontend/src/pages/CitizenRegistrationPage.tsx`, `backend/src/modules/registrations/registration.routes.ts`                                                                                                                                 |
| Địa giới 2 cấp                            | Form chỉ còn Tỉnh/Thành + Xã/Phường/Đặc khu                                                            | ✅ Đạt                                              | `frontend/src/pages/CitizenRegistrationPage.tsx`, `frontend/src/pages/LandManagementPage.tsx`                                                                                                                                                |
| Fallback địa giới                         | API địa giới lỗi thì chuyển nhập tay                                                                   | ✅ Đạt                                              | `frontend/src/lib/vnAddress.ts`, `frontend/src/pages/CitizenRegistrationPage.tsx`                                                                                                                                                            |
| Dashboard theo vai trò                    | Dữ liệu theo role, nhãn tiếng Việt dễ hiểu                                                             | ✅ Đạt                                              | `frontend/src/pages/AdminDashboardPage.tsx`, `backend/src/modules/dashboard/dashboard.routes.ts`                                                                                                                                             |
| Quản lý người dùng                        | Tạo/lọc/khóa-mở khóa/cập nhật                                                                          | ✅ Đạt                                              | `frontend/src/pages/UserManagementPage.tsx`, `frontend/src/pages/UserEditPage.tsx`, `backend/src/modules/users/user.routes.ts`                                                                                                               |
| Quản lý đơn vị                            | Tạo/cập nhật/vô hiệu hóa/gán user                                                                      | ✅ Đạt                                              | `frontend/src/pages/OrganizationManagementPage.tsx`, `frontend/src/pages/OrganizationEditPage.tsx`, `backend/src/modules/organizations/organization.routes.ts`                                                                               |
| Quản lý thửa đất                          | Tạo/lọc/list/cập nhật (màn riêng)                                                                      | ✅ Đạt                                              | `frontend/src/pages/LandManagementPage.tsx`, `frontend/src/pages/LandEditPage.tsx`, `backend/src/modules/lands/land.routes.ts`                                                                                                               |
| Tra cứu thửa đất                          | Tìm theo keyword, hiển thị thông tin thửa                                                              | ⚠️ Một phần                                         | `frontend/src/pages/SearchLandPage.tsx`, `backend/src/modules/lands/land.routes.ts`                                                                                                                                                          |
| Officer xử lý hồ sơ (detail actions)      | Action theo role + status hồ sơ hợp lệ, payload legal khớp backend                                     | ✅ Đạt                                              | `frontend/src/pages/RegistrationReviewDetailPage.tsx`, `frontend/src/pages/registrationReviewHelpers.ts`, `backend/src/modules/registrations/registration.routes.ts`                                                                         |
| Hiển thị kết quả blockchain ở hồ sơ       | Hiển thị txHash/tokenId/CID/hash sau sync                                                              | ✅ Đạt                                              | `backend/src/modules/registrations/registration.routes.ts`, `frontend/src/pages/RegistrationReviewDetailPage.tsx`, `frontend/src/pages/RegistrationBlockchainSignPage.tsx`                                                                   |
| Chuẩn hóa tiếng Việt UI                   | Text có dấu, nhất quán thuật ngữ                                                                       | ✅ Đạt phần lớn                                     | `frontend/src/App.tsx`, `frontend/src/styles.css`, `frontend/src/pages/*`                                                                                                                                                                    |
| Error envelope FE-BE                      | FE đọc đúng lỗi từ envelope backend                                                                    | ✅ Đạt                                              | `frontend/src/lib/api.ts`, `backend/src/lib/errors.ts`                                                                                                                                                                                       |

### Technical gate update (2026-05-17)

- PR technical closeout [#24](https://github.com/eye-00/QLDA-UrbanchainVN/pull/24) da merge.
- Required checks pass: `backend-ci`, `frontend-ci`, `contracts-ci`, `docs-check`, `changes`.
- Local smoke pass:
  - `npm run db:generate`
  - `npm run db:migrate`
  - `npm run db:seed`
  - `npm run lint`
  - `npm run build`
  - `npm test` (contracts `7/7`, backend `40/40`, frontend `47/47`).

Rule chấm readiness:

- Nếu một chức năng có trạng thái kỹ thuật `✅ Đạt` nhưng chưa có legal evidence trong ma trận traceability thì không nâng quá `⚠️ Một phần`.

## Checklist legal gate theo backlog mới

Nguồn chuẩn: `docs/docs-legal-aligned/04-backlog-mvp.current-wallet-map-doc-version-signature.md` + `docs/docs-legal-aligned/04-backlog-mvp.legal-aligned-addendum.md`.

| Legal item                                           | Tiêu chí kiểm tra                                                                  | Trạng thái hiện tại      |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------ |
| `LEG-S2-001` Procedure registry + authority matrix   | Có `procedureCode/legalBasis/authorityActors/requiresTaxStep` và áp vào transition | ✅ Đạt (local technical) |
| `LEG-S2-002` Document versioning                     | Upload/thay thế tạo version mới, không ghi đè                                      | ✅ Đạt (local technical) |
| `LEG-S2-003` Intake fee/payment model                | Tách rõ `INTAKE_FEE` và `LAND_FINANCIAL_OBLIGATION`                                | ✅ Đạt (local technical) |
| `LEG-S2-004` Submit snapshot                         | Submit khóa snapshot version tài liệu                                              | ✅ Đạt (local technical) |
| `LEG-S2-005` Transition legal guard                  | Transition nhạy cảm bắt buộc legal basis/reason + actor/status hợp lệ              | ✅ Đạt (local technical) |
| `LEG-S3-001..003` Commune/Supplement/Version history | Đủ luồng legal-aligned ở UI + BE + audit                                           | ✅ Đạt                   |
| `LEG-S4-001` Blockchain precondition                 | Chỉ ghi blockchain sau `DA_CAP_NHAT_HO_SO_DIA_CHINH`                               | ✅ Done (local + test + docs) |
| `LEG-S5-001` Payment obligation off-chain            | Có top-level flow `create -> notice -> receipt -> verify -> record evidence`        | ⚠️ Một phần (BE done, FE wiring pending) |
| `LEG-S5-002` Map legal source/state                  | Có đủ 7 endpoint `/api/v1/map/*`, sourceType và geometry state flow legal-aligned   | ⚠️ Một phần (BE done, FE wiring pending) |

## Ma trận closeout Sprint 2 (legal-aligned)

| Legal item                                         | Backend evidence                                                                                        | Frontend evidence                                                                                        | Test evidence                                                                                 | Status  | Gap                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------- | ------------------- |
| `LEG-S2-001` Procedure registry + authority matrix | `backend/src/modules/legal/legal.routes.ts`, `backend/src/modules/registrations/registration.routes.ts` | `frontend/src/pages/CitizenRegistrationPage.tsx`, `frontend/src/pages/RegistrationReviewDetailPage.tsx`  | `backend/test/sprint2-legal.test.ts`                                                          | ✅ Done | Không còn gap P0/P1 |
| `LEG-S2-002` Document versioning                   | `backend/src/modules/files/file.routes.ts`, `backend/src/modules/registrations/registration.routes.ts`  | `frontend/src/pages/RegistrationReviewDetailPage.tsx`                                                    | `backend/test/sprint2-legal.test.ts`                                                          | ✅ Done | Không còn gap P0/P1 |
| `LEG-S2-003` Intake fee/payment model              | `backend/src/modules/registrations/registration.routes.ts`                                              | `frontend/src/pages/RegistrationReviewDetailPage.tsx`, `frontend/src/ui/domainLabels.ts`                 | `backend/test/sprint2-legal.test.ts`, `frontend/test/domain-labels.test.ts`                   | ✅ Done | Không còn gap P0/P1 |
| `LEG-S2-004` Submit snapshot                       | `backend/src/modules/registrations/registration.routes.ts`                                              | `frontend/src/pages/CitizenRegistrationPage.tsx`                                                         | `backend/test/sprint2-legal.test.ts`, `frontend/test/registration-submission-helpers.test.ts` | ✅ Done | Không còn gap P0/P1 |
| `LEG-S2-005` Transition legal guard                | `backend/src/modules/registrations/registration.routes.ts`                                              | `frontend/src/pages/RegistrationReviewDetailPage.tsx`, `frontend/src/pages/registrationReviewHelpers.ts` | `backend/test/sprint2-legal.test.ts`, `frontend/test/registration-review-helpers.test.ts`     | ✅ Done | Không còn gap P0/P1 |

## Kết luận readiness theo legal baseline

- Sprint 1: ✅ `Done`
- Sprint 2: ✅ `Done` (LEG-S2-001..005 đã có evidence code/test/docs; technical gate và remote checks đã có bằng chứng)
- Sprint 3: ✅ `Done`
- Sprint 4: ✅ `Done` (`LEG-S4-001` + `US-565..576` da co evidence code/test/docs; RPC fail-hard lane da duoc verify)
- Sprint 5: ⚠️ `Partial` (PR-S5-01 da dong backend core cho `LEG-S5-001/002`, con thieu FE integration + closeout gate)
