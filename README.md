# UrbanChain-VN Repository

Monorepo MVP cho dự án **Quản lý dự án phát triển giải pháp blockchain ứng dụng trong quản lý đô thị**.

Hoàn thành **Sprint 5** — core legal procedure registry, payment obligations, map service layer, E2E Sepolia demo.

## Stack

- Smart contracts: Solidity 0.8.24 + Hardhat + OpenZeppelin (ERC-721, AccessControl, Pausable)
- Backend: Node.js + Express + TypeScript + Prisma + Zod + ethers.js
- Frontend: React 18 + Vite + TypeScript + React Router 6
- Database: MySQL 8.0
- File storage: IPFS (Kubo / Pinata)
- Blockchain: EVM (Sepolia / Hardhat local)

## Monorepo structure

```text
contracts/   Solidity contracts, tests, deploy scripts
backend/     REST API (14 modules), business workflow, Prisma schema
frontend/    Citizen portal + officer dashboard (13 pages, 20 components)
docs/        Working rules, backlog, workflows, API/contract/spec docs (24 files)
docs/docs-legal-aligned/  Legal-aligned doc versions + .docx decree files
codex/       Codex subagent skills (27) + agent configs (6)
ai/prompts/  Prompt files for 15 specialized AI agents (19 files)
prompts/     Legacy 15-agent prompt bundle
scripts/     PowerShell dev bootstrap + npm wrapper
.claude/     Claude Code project rules
```

## Quick start

1. Install dependencies with `npm ci` at repo root.
2. Copy `.env.example` to `.env` in each app (`backend/`, `frontend/`, `contracts/`), or use the provided local dev `.env` files.
3. Start MySQL and IPFS (Kubo) with Docker Compose:
   ```bash
   npm run infra:up
   ```
4. Generate Prisma client and sync the local database schema:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```
   `npm run db:seed` resets test data (users/org/lands/registrations/files/audit) before loading sample data.
5. Run apps:
   - `npm run dev:contracts` (Hardhat node)
   - `npm run dev:backend`
   - `npm run dev:frontend`

If Docker Desktop is not running, start it before `npm run infra:up`.

## Windows PowerShell stable commands

Nếu PowerShell hiện tại resolve `npm` sai (ví dụ trỏ vào roaming profile và báo `npm-cli.js` không tồn tại), dùng wrapper của repo:

```powershell
.\scripts\npmw.ps1 run lint
.\scripts\npmw.ps1 run db:seed
.\scripts\npmw.ps1 --workspace backend run test
```

Wrapper này luôn gọi `npm.cmd` thay vì `npm.ps1`, giúp tránh lỗi PATH/prefix trong PowerShell.

## Dev bootstrap helpers

Repo có script chuẩn hóa startup để giảm lỗi chạy sai workdir hoặc thiếu env:

```powershell
.\scripts\dev.ps1 check-env
.\scripts\dev.ps1 quickstart
.\scripts\dev.ps1 dev:backend
.\scripts\dev.ps1 dev:frontend
```

Ghi chú:

- `check-env`: xác nhận tồn tại `backend/.env`, `frontend/.env`, `contracts/.env`
- `quickstart`: `infra:up` → `db:generate` → `db:migrate` → `db:seed`
- Nếu muốn bỏ qua seed trong quickstart:
  ```powershell
  .\scripts\dev.ps1 quickstart -SkipSeed
  ```

## Sprint 5 runtime modes (IPFS + Blockchain + Legal)

Backend hỗ trợ các chế độ cho luồng ghi nhận blockchain và tra cứu pháp lý:

- `mock` (mặc định): không cần node blockchain/IPFS thật, vẫn sinh `cid/hash/txHash` để demo luồng.
- `local`/`pinata` + `rpc`: dùng hạ tầng thật để upload IPFS và ghi nhận on-chain.

Biến môi trường chính (backend):

- `IPFS_UPLOAD_MODE`: `mock` | `local` | `pinata`
- `IPFS_API_URL`: endpoint IPFS API (ví dụ `http://localhost:5001`)
- `PINATA_JWT`: token Pinata khi dùng `pinata`
- `BLOCKCHAIN_MODE`: `mock` | `rpc`
- `RPC_URL`: RPC endpoint (localhost/sepolia)
- `CONTRACT_ADDRESS`: địa chỉ `UrbanLandRegistry`
- `BACKEND_WALLET_PRIVATE_KEY`: private key ví backend để gọi contract
- `BLOCKCHAIN_DEFAULT_TOKEN_OWNER`: ví owner token mặc định (optional)
- `LEGAL_DEFAULT_PROCEDURE_CODE`: mã thủ tục hành chính mặc định (VD: `1.013978`)
- `LEGAL_DEFAULT_BASIS_CODE`: căn cứ pháp lý mặc định (VD: `151/2025-ND-CP|3380/QD-BNNMT`)

RPC fail-hard smoke (Sprint 4 gate):

- `.\scripts\npmw.ps1 --workspace backend run test:rpc`
- Test này bắt buộc dùng RPC thật; thiếu env hoặc RPC lỗi sẽ fail cứng.

## Quality commands

- `npm run lint` (chạy eslint backend + frontend)
- `npm run lint:backend`
- `npm run lint:frontend`
- `npm run format:check`
- `npm run build`
- `npm test`

CI (`.github/workflows/ci.yml`) chạy song song backend-ci, frontend-ci, contracts-ci, docs-check.
Nightly regression (`.github/workflows/nightly-regression.yml`) chạy daily 18:00 UTC.

### Sprint 5 verification commands

- `npm run db:generate && npm run db:migrate && npm run db:seed`
- `npm --workspace backend run build`
- `npm --workspace backend run test -- sprint5-legal-core.test.ts`
- `npm --workspace frontend run test`

### Sprint 4 verification commands

- `npm --workspace backend run test -- sprint4-blockchain.client.test.ts`
- `npm --workspace backend run test -- sprint4-service-wallet-governance.test.ts`
- `npm --workspace backend run test:rpc` (yêu cầu RPC thật)

### Sprint 3 verification commands (Registration core + Review UI)

- `npm --workspace backend run test -- sprint3-registration.test.ts`
- `npm --workspace backend run test -- auth-rbac.test.ts`

### Sprint 2 verification commands

- `npm --workspace backend run test`
- `npm --workspace frontend run test`

### Sprint 1 verification commands

- `npm --workspace backend run test -- sprint1-wallet.test.ts`
- `npm --workspace frontend run test`
- `npm --workspace contracts run test`

## Tài khoản test sau khi seed

- Mật khẩu chung cho toàn bộ tài khoản seed: `StrongPassword@123`
- Công dân:
  - `citizen.nguyenvana@urbanchain.vn`
  - `citizen.tranthib@urbanchain.vn`
- Doanh nghiệp:
  - `business.minhphat@urbanchain.vn`
- Cán bộ tiếp nhận:
  - `reception.haichau@urbanchain.vn`
- Cán bộ cấp xã:
  - `commune.hoakhanh@urbanchain.vn`
- Cán bộ VPĐKĐĐ:
  - `registry.danang@urbanchain.vn`
- Cơ quan phê duyệt:
  - `approval.danang@urbanchain.vn`
- Quản trị:
  - `admin.system@urbanchain.vn`
- Tài khoản khóa để test login guard:
  - `citizen.locked@urbanchain.vn` (status `LOCKED`)

## API endpoints (14 route modules)

- `GET /api/v1/health`
- `/api/v1/auth` — login, refresh, logout, password reset, change-password
- `/api/v1/users` — user CRUD, RBAC
- `/api/v1/organizations` — org/unit CRUD
- `/api/v1/wallets` — wallet connect, challenge/verify, default wallet
- `/api/v1/registrations` — registration CRUD, submission, review workflow
- `/api/v1/transfers` — transfer registration flow
- `/api/v1/lands` — land parcel CRUD, search
- `/api/v1/files` — file upload/download, integrity check
- `/api/v1/dashboard` — dashboard metrics
- `/api/v1/audit` — audit log
- `/api/v1/legal` — legal procedure registry (Sprint 5)
- `/api/v1/payment-obligations` — payment obligations (Sprint 5)
- `/api/v1/service-wallets` — service wallet governance (Sprint 4)
- `/api/v1/map` — map service layer (Sprint 5)

## Git workflow

- Main integration rules and commit convention are in [CONTRIBUTING.md](./CONTRIBUTING.md).
- PRs should follow [.github/pull_request_template.md](./.github/pull_request_template.md).

## Core rules

- Không lưu dữ liệu cá nhân nhạy cảm on-chain.
- Blockchain chỉ lưu `hash`, `cid`, `transactionHash`, `ownerRef`, `parcelRef`.
- Mọi thay đổi phải bám `docs/04-backlog-mvp.md`, `docs/05-workflow-land-law.md`, `docs/06-smart-contract-spec.md`, `docs/07-api-contract.md`.
- AI chỉ hỗ trợ nghiệp vụ; quyết định hành chính nằm ở xử lý off-chain.
