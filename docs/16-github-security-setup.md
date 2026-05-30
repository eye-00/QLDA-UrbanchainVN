# 16. GitHub Security & Deployment Gates

Tài liệu này hướng dẫn cách cấu hình các **Remote Gates** (Cổng chặn tự động trên GitHub) nhằm đảm bảo hệ thống đạt chuẩn an toàn trước khi hợp nhất (merge) code và triển khai lên môi trường Production. 
*Đây là yêu cầu bắt buộc thuộc Phase 1 (Hoàn thiện Sprint 1-4) nhằm loại bỏ rủi ro lộ mã bảo mật và đảm bảo chất lượng code.*

## 1. Branch Protection Rules (Bảo vệ nhánh chính)

Mục tiêu: Đảm bảo không ai được quyền push code trực tiếp lên nhánh `main` mà không qua Pull Request và pass các CI Checks.

**Thao tác:**
1. Truy cập vào GitHub Repository của dự án `UrbanChainVN` > **Settings**.
2. Chọn menu **Branches** ở cột bên trái > Nhấn **Add branch protection rule**.
3. Điền `main` vào ô **Branch name pattern**.
4. Chọn các tùy chọn sau:
   - [x] **Require a pull request before merging**
     - [x] *Require approvals (số lượng: 1 hoặc 2)*.
   - [x] **Require status checks to pass before merging**
     - Bật tính năng *Require branches to be up to date before merging*.
     - Bổ sung các Status Checks bắt buộc: 
       - `test-backend` (hoặc tên action chạy vitest cho backend).
       - `test-frontend` (action chạy lint/test cho React).
       - `test-contracts` (action chạy hardhat/slither cho Solidity).
   - [x] **Do not allow bypassing the above settings** (Chặn cả Admin thao tác lách luật).
5. Nhấn **Create** để lưu lại.

---

## 2. GitHub Secret Scanning (Quét lỗ hổng cấu hình)

Mục tiêu: Ngăn chặn việc developer vô tình push các chuỗi kết nối (`DATABASE_URL`), JWT Secrets (`PINATA_JWT`), hay Private Keys của Smart Contract lên mã nguồn mở.

**Thao tác:**
1. Truy cập **Settings** > **Code security and analysis** (trong mục Security).
2. Tìm đến mục **Secret scanning** và nhấn **Enable**.
3. Bật thêm tính năng **Push protection** (Hệ thống sẽ từ chối các lệnh `git push` nếu phát hiện có secret nằm trong các file commit).

---

## 3. Quản lý Môi trường Production (Environment Secrets)

Để cấu hình CI/CD an toàn, không được để hardcode secret trong các file `.yml` của GitHub Actions. Hãy cấu hình như sau:

**Thao tác:**
1. Vào **Settings** > **Environments** > Tạo environment mới tên là `production`.
2. Trong phần `production`, thêm các biến bảo mật (Environment secrets):
   - `DATABASE_URL`: Chuỗi kết nối DB MySQL Production.
   - `PINATA_JWT`: Token kết nối IPFS thực.
   - `JWT_SECRET`: Khóa ký token Auth.
   - `BLOCKCHAIN_RPC_URL`: Endpoint mạng lưới (vd: Sepolia RPC).
   - `DEPLOYER_PRIVATE_KEY`: Private key dùng để deploy/tương tác với contract trên mạng lưới (chỉ giới hạn quyền cho GitHub Action).

## 4. Kiểm tra trước khi Release
Mỗi khi có Pull Request, GitHub Actions sẽ tự động chạy:
- Unit Test (`backend`, `frontend`).
- Build thử nghiệm.
- (Tùy chọn) Chạy `slither` để dò lỗi smart contract trong thư mục `contracts/`.

Nếu tất cả checks báo màu xanh (✅), cán bộ review mới có thể click nút "Merge pull request".
