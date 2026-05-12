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

| Chức năng yêu cầu | Tiêu chí kiểm tra | Trạng thái hiện tại | Evidence chính |
|---|---|---|---|
| Đăng nhập/đăng xuất | Login theo role, logout, thông báo lỗi đúng | ✅ Đạt | `frontend/src/pages/LoginPage.tsx`, `backend/src/modules/auth/auth.routes.ts` |
| VNeID mock (demo) | Có luồng mock login, chỉ dùng môi trường demo | ✅ Đạt | `frontend/src/pages/LoginPage.tsx`, `backend/src/modules/auth/auth.routes.ts` |
| RBAC route frontend | Citizen/Admin/Officer vào đúng màn được phép | ✅ Đạt | `frontend/src/App.tsx`, `frontend/src/auth/roles.ts` |
| Quản lý ví blockchain (Sprint 1) | Connect -> challenge -> verify (EIP-191) -> set default | ✅ Đạt | `frontend/src/pages/WalletManagementPage.tsx`, `backend/src/modules/wallets/wallet.routes.ts` |
| Upload và đính kèm tài liệu hồ sơ đăng ký | Upload file lên IPFS, nhận `fileId`, attach vào create registration, xem/download/integrity theo hồ sơ | ✅ Đạt (cần verify E2E thêm khi môi trường ổn định) | `frontend/src/pages/CitizenRegistrationPage.tsx`, `frontend/src/lib/files.ts`, `frontend/src/pages/RegistrationReviewDetailPage.tsx`, `backend/src/modules/files/file.routes.ts`, `backend/src/modules/registrations/registration.routes.ts` |
| Nộp hồ sơ đăng ký lần đầu | Tạo hồ sơ, gửi hồ sơ, xem trạng thái/ghi chú | ✅ Đạt | `frontend/src/pages/CitizenRegistrationPage.tsx`, `backend/src/modules/registrations/registration.routes.ts` |
| Địa giới 2 cấp | Form chỉ còn Tỉnh/Thành + Xã/Phường/Đặc khu | ✅ Đạt | `frontend/src/pages/CitizenRegistrationPage.tsx`, `frontend/src/pages/LandManagementPage.tsx` |
| Fallback địa giới | API địa giới lỗi thì chuyển nhập tay | ✅ Đạt | `frontend/src/lib/vnAddress.ts`, `frontend/src/pages/CitizenRegistrationPage.tsx` |
| Dashboard theo vai trò | Dữ liệu theo role, nhãn tiếng Việt dễ hiểu | ✅ Đạt | `frontend/src/pages/AdminDashboardPage.tsx`, `backend/src/modules/dashboard/dashboard.routes.ts` |
| Quản lý người dùng | Tạo/lọc/khóa-mở khóa/cập nhật | ✅ Đạt | `frontend/src/pages/UserManagementPage.tsx`, `frontend/src/pages/UserEditPage.tsx`, `backend/src/modules/users/user.routes.ts` |
| Quản lý đơn vị | Tạo/cập nhật/vô hiệu hóa/gán user | ✅ Đạt | `frontend/src/pages/OrganizationManagementPage.tsx`, `frontend/src/pages/OrganizationEditPage.tsx`, `backend/src/modules/organizations/organization.routes.ts` |
| Quản lý thửa đất | Tạo/lọc/list/cập nhật (màn riêng) | ✅ Đạt | `frontend/src/pages/LandManagementPage.tsx`, `frontend/src/pages/LandEditPage.tsx`, `backend/src/modules/lands/land.routes.ts` |
| Tra cứu thửa đất | Tìm theo keyword, hiển thị thông tin thửa | ⚠️ Một phần | `frontend/src/pages/SearchLandPage.tsx`, `backend/src/modules/lands/land.routes.ts` |
| Officer xử lý hồ sơ (detail actions) | Action theo role + status hồ sơ hợp lệ | ⚠️ Một phần | `frontend/src/pages/RegistrationReviewDetailPage.tsx`, `frontend/src/pages/registrationReviewHelpers.ts` |
| Hiển thị kết quả blockchain ở hồ sơ | Hiển thị txHash/tokenId/CID/hash sau sync | ❌ Chưa đạt | `backend/src/modules/registrations/registration.routes.ts`, `frontend/src/pages/RegistrationReviewDetailPage.tsx` |
| Chuẩn hóa tiếng Việt UI | Text có dấu, nhất quán thuật ngữ | ✅ Đạt phần lớn | `frontend/src/App.tsx`, `frontend/src/styles.css`, `frontend/src/pages/*` |
| Error envelope FE-BE | FE đọc đúng lỗi từ envelope backend | ✅ Đạt | `frontend/src/lib/api.ts`, `backend/src/lib/errors.ts` |

Rule chấm readiness:
- Nếu một chức năng có trạng thái kỹ thuật `✅ Đạt` nhưng chưa có legal evidence trong ma trận traceability thì không nâng quá `⚠️ Một phần`.

## Checklist legal gate theo backlog mới

Nguồn chuẩn: `docs/docs-legal-aligned/04-backlog-mvp.current-wallet-map-doc-version-signature.md` + `docs/docs-legal-aligned/04-backlog-mvp.legal-aligned-addendum.md`.

| Legal item | Tiêu chí kiểm tra | Trạng thái hiện tại |
|---|---|---|
| `LEG-S2-001` Procedure registry + authority matrix | Có `procedureCode/legalBasis/authorityActors/requiresTaxStep` và áp vào transition | ❌ Chưa đạt |
| `LEG-S2-002` Document versioning | Upload/thay thế tạo version mới, không ghi đè | ⚠️ Một phần |
| `LEG-S2-003` Intake fee/payment model | Tách rõ `INTAKE_FEE` và `LAND_FINANCIAL_OBLIGATION` | ❌ Chưa đạt |
| `LEG-S2-004` Submit snapshot | Submit khóa snapshot version tài liệu | ❌ Chưa đạt |
| `LEG-S2-005` Transition legal guard | Transition nhạy cảm bắt buộc legal basis/reason + actor/status hợp lệ | ⚠️ Một phần |
| `LEG-S3-001..003` Commune/Supplement/Version history | Đủ luồng legal-aligned ở UI + BE + audit | ⚠️ Một phần |
| `LEG-S4-001` Blockchain precondition | Chỉ ghi blockchain sau `DA_CAP_NHAT_HO_SO_DIA_CHINH` | ❌ Chưa đạt |

## Kết luận readiness theo legal baseline

- Sprint 1: ✅ `Done`
- Sprint 2: ⚠️ `Partial` (block bởi `LEG-S2-001..005`)
- Sprint 3: ⚠️ `Partial` (phụ thuộc LEG-S2 + `LEG-S3-*`)
- Sprint 4: ⚠️ `Partial` (block bởi `LEG-S4-001`)
