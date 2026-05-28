# Task: Deploy Testnet & Demo End-to-End — UrbanChain-VN

Cập nhật: 2026-05-28

## Bước 0 — Giải phóng working tree & Sync develop
- [x] Stash toàn bộ thay đổi local trên `codex/s4-pr2-frontend-signing`
- [x] Checkout `develop`
- [x] Xử lý 6 file untracked xung đột (registrationSubmissionHelpers, domainLabels, scripts...)
- [x] `git pull origin develop` — fast-forward 9 commits (Sprint 4 closeout + Sprint 5 legal core)
- [x] Verify HEAD = `3c39f55` ✅

## Bước 1 — Smoke Test toàn bộ suite
- [x] `db:generate` — Prisma Client v5.22.0 generated ✅
- [x] `db:migrate` — 15/15 migrations applied (bao gồm Sprint 5: PaymentObligation + ParcelGeometry) ✅
- [x] `db:seed` — seed thành công ✅
- [x] `lint` — 0 errors, 7 warnings (react-hooks/exhaustive-deps, không block) ✅
- [x] `build` — contracts ✅ · backend (tsc) ✅ · frontend (vite, 50 modules) ✅
- [x] `test` — contracts **7/7** ✅ · backend **42/43** (1 skip: rpc-smoke, đúng spec) ✅ · frontend **47/47** ✅

## Bước 2 — Smoke Test nhanh frontend + backend thủ công
- [ ] Khởi động backend local `npm run dev`
- [ ] Khởi động frontend local `npm run dev`
- [ ] Đăng nhập được với tài khoản seeded

## Bước 3 — Tạo Backend Service Wallet (ví riêng)
- [x] Đã có ví service riêng tại `backend/.env` (0xfb39...) — tách biệt hoàn toàn khỏi deployer wallet ✅
- [x] Ví mới (0x2eAA...) được generate sẵn làm dự phòng nếu cần ✅

## Bước 4 — Deploy UrbanLandRegistry lên Sepolia
- [x] Contract `0xe8484D306d27fD4d2028FFaC85268d3de28cEcA2` đã deploy sẵn trên Sepolia ✅
- [x] Bytecode hash khớp 100% với source code hiện tại trong repo (`0x557ea9...`) ✅
- [x] RPC Google Cloud Sepolia kết nối được (chainId: 11155111) ✅
- [x] `CONTRACT_ADDRESS` đã điền trong `backend/.env` ✅
- [ ] (Tùy chọn) Tìm và lưu link Etherscan của deploy TX làm bằng chứng bảo vệ

## Bước 5 — Cấp REGISTRAR_ROLE cho Service Wallet
- [x] `REGISTRAR_ROLE`: ✅ (0xfb39... đã có)
- [x] `ADMIN_ROLE`: ✅
- [x] `DEFAULT_ADMIN_ROLE`: ✅
- [x] ETH balance: 0.0499 ETH Sepolia (dư giả gas) ✅

## Bước 6 — Xác nhận Backend kết nối Sepolia
- [x] Kill tiến trình cũ chiếm port 4000 ✅
- [x] Backend khởi động thành công: `http://localhost:4000` ✅
- [x] `/api/v1/health` ⇒ `{success: true}` ✅
- [x] `/api/v1/auth/login` ⇒ JWT token hợp lệ ✅
- [x] `/api/v1/service-wallets` ⇒ 2 ví service trên Sepolia chainId 11155111 ✅
- [x] `/api/v1/dashboard/summary` ⇒ 16 users, 14 registrations ✅
- [x] `/api/v1/map/parcels` (Sprint 5) ⇒ 3 parcels ✅
- [x] `BLOCKCHAIN_MODE=rpc` đã xác nhận kết nối thật vào Sepolia ✅
- [x] Phát hiện: 1 hồ sơ `DA_CAP_NHAT_HO_SO_DIA_CHINH` (id: `cmpp0i1sy00endocu6ieub8qt`) sẵn sàng để ghi blockchain trong Bước 7 ✅

## Bước 7 — Chạy E2E Demo Flow & Thu thập bằng chứng
- [x] Phát hiện `BLOCKCHAIN_SYNC_MODE` bị thiếu trong `.env` (có `BLOCKCHAIN_MODE` nhưng client đọc `BLOCKCHAIN_SYNC_MODE`) → đã sửa ✅
- [x] Tạo `ServiceWalletAuthorization` cho `BACKEND_WALLET_PRIVATE_KEY` (`0xfb39...`) ✅
- [x] Reset hồ sơ về `DA_CAP_NHAT_HO_SO_DIA_CHINH` để chạy sync thật ✅
- [x] Khởi động lại backend với `BLOCKCHAIN_SYNC_MODE=rpc` ✅
- [x] Gọi `POST /registrations/:id/blockchain-sync` với chữ ký đúng format ✅
- [x] **GHI LÊN SEPOLIA THÀNH CÔNG** ✅
  - `tokenId`: **15**
  - `txHash`: `0xf6e66f5478b5db5920fe22cd565e27d3b26e13a0f23b9b4f1b483b4ec4ce5042`
  - Status: `DA_GHI_BLOCKCHAIN` | TxLifecycle: `CONFIRMED`

## Bằng chứng chính
- [x] **Etherscan TX**: https://sepolia.etherscan.io/tx/0xf6e66f5478b5db5920fe22cd565e27d3b26e13a0f23b9b4f1b483b4ec4ce5042
- [x] **Token ID 15** — NFT ERC-721 trên contract `0xe8484D306d27fD4d2028FFaC85268d3de28cEcA2`
- [ ] Screenshot Etherscan TX (lưu thủ công)
- [ ] Screenshot UI show tokenId + txHash
- [ ] Screenshot Sprint 5: map source_type badge
- [ ] Screenshot Sprint 5: PaymentObligation flow
