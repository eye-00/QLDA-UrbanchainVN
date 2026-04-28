# Sprint Closure Matrix (Sprint 1 + Sprint 2)

Cap nhat: 2026-04-28  
Nhanh thuc thi: `codex/sprint-closeout-s1s2`

## 1) Tong hop trang thai

| Sprint | Nhom yeu cau | Trang thai | Evidence local | Phu thuoc remote |
|---|---|---|---|---|
| Sprint 1 | Auth/RBAC/session lifecycle/audit APIs | Partial | `backend/test/auth-rbac.test.ts`, `backend/src/modules/auth/auth.routes.ts`, `backend/src/modules/audit/audit.routes.ts` | Required checks + branch protection + secret scan |
| Sprint 1 | Full Gate lint/build/test/docs | Partial | `npm run lint`, `npm run build`, `npm test` pass local | Can xac nhan pass tren GitHub PR chain |
| Sprint 2 | Users/Organizations/Lands APIs | Done (local) | `backend/test/sprint2.test.ts`, `backend/src/modules/users/user.routes.ts`, `backend/src/modules/organizations/organization.routes.ts`, `backend/src/modules/lands/land.routes.ts` | Required checks tren PR chain |
| Sprint 2 | Dashboard role-based + route guard | Done (local) | `backend/src/modules/dashboard/dashboard.routes.ts`, `frontend/test/app.test.ts`, `frontend/test/auth-routes.test.ts` | Required checks tren PR chain |
| Sprint 2 | UX CRUD + toast + error envelope | Done (local) | `frontend/test/sprint2-crud-flows.test.ts`, `frontend/test/toast-behavior.test.ts`, `frontend/test/api-error-envelope.test.ts` | Required checks tren PR chain |
| Sprint 2 | Dia gioi 2 cap + Viet hoa UI | Done (local) | `frontend/src/pages/LandManagementPage.tsx`, `frontend/src/pages/CitizenRegistrationPage.tsx`, `frontend/src/lib/vnAddress.ts`, `frontend/test/vn-address.test.ts` | Required checks tren PR chain |
| Sprint 2 | Full Gate lint/build/test/docs | Partial | Local gate pass, xem `docs/11-sprint-closure-verification.md` | Branch protection + required checks + secret scan |

## 2) Gap list uu tien

| Priority | Gap | Tac dong | Cach dong gap |
|---|---|---|---|
| P0 | Chua co evidence remote checks pass (`backend-ci`, `frontend-ci`, `contracts-ci`, `docs-check`) | Khong the chot `Done` sprint theo DoD | Push branch closeout, tao PR chain, thu thap URL/check run pass |
| P0 | Chua co evidence branch protection + secret scanning pass | Chua dat Full Gate | Thu thap screenshot/link settings + run security tab state |
| P1 | Lint warning React Hooks (`exhaustive-deps`) con ton tai | Khong fail CI hien tai, nhung la no ky thuat | Xu ly warning neu reviewer yeu cau hoac khi nang gate lint |
| P1 | GitHub connector/CLI khong truy cap duoc trong moi truong hien tai | Chan buoc xac nhan remote tu local | Thuc hien gate remote tren may co ket noi GitHub hoac CI runner |

## 3) Ket luan dong sprint hien tai

- **Sprint 1**: `Partial` (local evidence co, chua co remote gate evidence).
- **Sprint 2**: `Partial` o muc closure tong (nhom tinh nang local da dat; con thieu remote gate evidence de nang len `Done`).
