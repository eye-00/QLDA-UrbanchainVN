# UrbanChain-VN Repository

Monorepo MVP cho dá»± Ã¡n **Quáº£n lÃ½ dá»± Ã¡n phÃ¡t triá»ƒn giáº£i phÃ¡p blockchain á»©ng dá»¥ng trong quáº£n lÃ½ Ä‘Ã´ thá»‹**.

HoÃ n thÃ nh **Sprint 5** â€” core legal procedure registry, payment obligations, map service layer, E2E Sepolia demo.

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

## Target auth model

TÃ i liá»‡u hiá»‡n hÃ nh chuáº©n hÃ³a auth theo:

- `accountType`: loáº¡i tÃ i khoáº£n vÃ  portal truy cáº­p
- `role`: vai trÃ² nghiá»‡p vá»¥
- `permission`: thao tÃ¡c cá»¥ thá»ƒ
- `scope`: pháº¡m vi cÆ¡ quan/phÃ²ng ban/thá»§ tá»¥c/Ä‘á»‹a bÃ n/ownership

Portal split theo `accountType`:

- `CITIZEN` -> `Portal ngÆ°á»i dÃ¢n` -> `/citizen/dashboard`
- `STAFF` -> `Portal cÃ¡n bá»™` -> `/staff/dashboard`
- `AGENCY_ADMIN` -> `Portal quáº£n trá»‹ cÆ¡ quan` -> `/admin/dashboard`
- `SYSTEM_ADMIN` -> `Portal quáº£n trá»‹ há»‡ thá»‘ng` -> `/system/dashboard`

Identifier Ä‘Äƒng nháº­p theo target model:

- `CITIZEN`: `citizenId + password`
- `STAFF`: `officialUsername` hoáº·c `staffCode + password`
- `AGENCY_ADMIN`: `username + password`
- `SYSTEM_ADMIN`: `username + password`

LÆ°u Ã½:

- `email` chá»‰ dÃ¹ng cho liÃªn há»‡/khÃ´i phá»¥c tÃ i khoáº£n, khÃ´ng cÃ²n lÃ  login identifier chÃ­nh trong target model.
- Runtime code hiá»‡n táº¡i váº«n cÃ²n login chuáº©n theo `email/password`; xem `docs/07-api-contract.md` vÃ  `docs/08-system-design.md` Ä‘á»ƒ biáº¿t mismatch note.

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

Náº¿u PowerShell hiá»‡n táº¡i resolve `npm` sai (vÃ­ dá»¥ trá» vÃ o roaming profile vÃ  bÃ¡o `npm-cli.js` khÃ´ng tá»“n táº¡i), dÃ¹ng wrapper cá»§a repo:

```powershell
.\scripts\npmw.ps1 run lint
.\scripts\npmw.ps1 run db:seed
.\scripts\npmw.ps1 --workspace backend run test
```

Wrapper nÃ y luÃ´n gá»i `npm.cmd` thay vÃ¬ `npm.ps1`, giÃºp trÃ¡nh lá»—i PATH/prefix trong PowerShell.

## Dev bootstrap helpers

Repo cÃ³ script chuáº©n hÃ³a startup Ä‘á»ƒ giáº£m lá»—i cháº¡y sai workdir hoáº·c thiáº¿u env:

```powershell
.\scripts\dev.ps1 check-env
.\scripts\dev.ps1 quickstart
.\scripts\dev.ps1 dev:backend
.\scripts\dev.ps1 dev:frontend
```

Ghi chÃº:

- `check-env`: xÃ¡c nháº­n tá»“n táº¡i `backend/.env`, `frontend/.env`, `contracts/.env`
- `quickstart`: `infra:up` â†’ `db:generate` â†’ `db:migrate` â†’ `db:seed`
- Náº¿u muá»‘n bá» qua seed trong quickstart:
  ```powershell
  .\scripts\dev.ps1 quickstart -SkipSeed
  ```

## Sprint 5 runtime modes (IPFS + Blockchain + Legal)

Backend há»— trá»£ cÃ¡c cháº¿ Ä‘á»™ cho luá»“ng ghi nháº­n blockchain vÃ  tra cá»©u phÃ¡p lÃ½:

- `mock` (máº·c Ä‘á»‹nh): khÃ´ng cáº§n node blockchain/IPFS tháº­t, váº«n sinh `cid/hash/txHash` Ä‘á»ƒ demo luá»“ng.
- `local`/`pinata` + `rpc`: dÃ¹ng háº¡ táº§ng tháº­t Ä‘á»ƒ upload IPFS vÃ  ghi nháº­n on-chain.

Biáº¿n mÃ´i trÆ°á»ng chÃ­nh (backend):

- `IPFS_UPLOAD_MODE`: `mock` | `local` | `pinata`
- `IPFS_API_URL`: endpoint IPFS API (vÃ­ dá»¥ `http://localhost:5001`)
- `PINATA_JWT`: token Pinata khi dÃ¹ng `pinata`
- `BLOCKCHAIN_MODE`: `mock` | `rpc`
- `RPC_URL`: RPC endpoint (localhost/sepolia)
- `CONTRACT_ADDRESS`: Ä‘á»‹a chá»‰ `UrbanLandRegistry`
- `BACKEND_WALLET_PRIVATE_KEY`: private key vÃ­ backend Ä‘á»ƒ gá»i contract
- `BLOCKCHAIN_DEFAULT_TOKEN_OWNER`: vÃ­ owner token máº·c Ä‘á»‹nh (optional)
- `LEGAL_DEFAULT_PROCEDURE_CODE`: mÃ£ thá»§ tá»¥c hÃ nh chÃ­nh máº·c Ä‘á»‹nh (VD: `1.013978`)
- `LEGAL_DEFAULT_BASIS_CODE`: cÄƒn cá»© phÃ¡p lÃ½ máº·c Ä‘á»‹nh (VD: `151/2025-ND-CP|3380/QD-BNNMT`)

RPC fail-hard smoke (Sprint 4 gate):

- `.\scripts\npmw.ps1 --workspace backend run test:rpc`
- Test nÃ y báº¯t buá»™c dÃ¹ng RPC tháº­t; thiáº¿u env hoáº·c RPC lá»—i sáº½ fail cá»©ng.

## Quality commands

- `npm run lint` (cháº¡y eslint backend + frontend)
- `npm run lint:backend`
- `npm run lint:frontend`
- `npm run format:check`
- `npm run build`
- `npm test`

CI (`.github/workflows/ci.yml`) cháº¡y song song backend-ci, frontend-ci, contracts-ci, docs-check.
Nightly regression (`.github/workflows/nightly-regression.yml`) cháº¡y daily 18:00 UTC.

### Sprint 5 verification commands

- `npm run db:generate && npm run db:migrate && npm run db:seed`
- `npm --workspace backend run build`
- `npm --workspace backend run test -- sprint5-legal-core.test.ts`
- `npm --workspace frontend run test`

### Sprint 4 verification commands

- `npm --workspace backend run test -- sprint4-blockchain.client.test.ts`
- `npm --workspace backend run test -- sprint4-service-wallet-governance.test.ts`
- `npm --workspace backend run test:rpc` (yÃªu cáº§u RPC tháº­t)

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

## TÃ i khoáº£n test sau khi seed

- Máº­t kháº©u chung cho toÃ n bá»™ tÃ i khoáº£n seed: `StrongPassword@123`
- CÃ´ng dÃ¢n:
  - `citizen.nguyenvana@urbanchain.vn`
  - `citizen.tranthib@urbanchain.vn`
  - `business.minhphat@urbanchain.vn`
  - `reception.haichau@urbanchain.vn`
  - `commune.hoakhanh@urbanchain.vn`
  - `registry.danang@urbanchain.vn`
  - `approval.danang@urbanchain.vn`
  - `admin.system@urbanchain.vn`
- TÃ i khoáº£n khÃ³a Ä‘á»ƒ test login guard:
  - `citizen.locked@urbanchain.vn` (status `LOCKED`)

## API endpoints (14 route modules)

- `GET /api/v1/health`
- `/api/v1/auth` â€” login, refresh, logout, password reset, change-password
- `/api/v1/users` â€” user CRUD, RBAC
- `/api/v1/organizations` â€” org/unit CRUD
- `/api/v1/wallets` â€” wallet connect, challenge/verify, default wallet
- `/api/v1/registrations` â€” registration CRUD, submission, review workflow
- `/api/v1/transfers` â€” transfer registration flow
- `/api/v1/lands` â€” land parcel CRUD, search
- `/api/v1/files` â€” file upload/download, integrity check
- `/api/v1/dashboard` â€” dashboard metrics
- `/api/v1/audit` â€” audit log
- `/api/v1/legal` â€” legal procedure registry (Sprint 5)
- `/api/v1/payment-obligations` â€” payment obligations (Sprint 5)
- `/api/v1/service-wallets` â€” service wallet governance (Sprint 4)
- `/api/v1/map` â€” map service layer (Sprint 5)

## Git workflow

- Main integration rules and commit convention are in [CONTRIBUTING.md](./CONTRIBUTING.md).
- PRs should follow [.github/pull_request_template.md](./.github/pull_request_template.md).

## Core rules

- KhÃ´ng lÆ°u dá»¯ liá»‡u cÃ¡ nhÃ¢n nháº¡y cáº£m on-chain.
- Blockchain chá»‰ lÆ°u `hash`, `cid`, `transactionHash`, `ownerRef`, `parcelRef`.
- Má»i thay Ä‘á»•i pháº£i bÃ¡m `docs/04-backlog-mvp.md`, `docs/05-workflow-land-law.md`, `docs/06-smart-contract-spec.md`, `docs/07-api-contract.md`.
- AI chá»‰ há»— trá»£ nghiá»‡p vá»¥; quyáº¿t Ä‘á»‹nh hÃ nh chÃ­nh náº±m á»Ÿ xá»­ lÃ½ off-chain.
