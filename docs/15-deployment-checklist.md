# 15. Deployment & Functional Readiness Checklist

Tài liệu này cung cấp checklist chi tiết về các hạng mục cần hoàn thành để triển khai dự án UrbanChain-VN lên môi trường chính thức (Production/Staging). Các hạng mục được đánh giá dựa trên trạng thái mã nguồn và nghiệm thu hiện tại.

## 1. Môi trường & Hạ tầng (Infrastructure)

| Hạng mục | Trạng thái | Ghi chú |
| --- | :---: | --- |
| **Cơ sở dữ liệu (MySQL)** | ✅ Đạt | Đã có schema Prisma, seed script (`npm run db:generate`, `migrate`, `seed`). |
| **IPFS / Storage** | ⚠️ Một phần | Đang hỗ trợ mock và kết nối Pinata/RPC cục bộ. Cần thiết lập Pinata keys chính thức cho môi trường. |
| **Blockchain Node (RPC)** | ⚠️ Một phần | Có mode mock và Sepolia testnet. Cần cấu hình Private Key an toàn khi lên prod. |
| **Docker Containers** | ✅ Đạt | `docker-compose.yml` có sẵn cho MySQL và IPFS cục bộ. |
| **Web Server / Proxy** | ❌ Chưa đạt | Cần thiết lập Nginx hoặc quy trình deploy Next.js/React cho production. |
| **CI/CD Pipelines** | ⚠️ Một phần | GitHub Actions (`backend-ci`, `frontend-ci`, `contracts-ci`) đã có nhưng branch protection chưa bật hoàn toàn theo yêu cầu Remote Gate. |

## 2. Tính năng Lõi & Nghiệp vụ (Functional)

### Sprint 1: Auth & Wallet
| Hạng mục | Trạng thái | Ghi chú |
| --- | :---: | --- |
| Đăng nhập / Đăng xuất (theo `accountType`) | ✅ Đạt | Cơ chế 4 lớp Portal hoàn tất. |
| RBAC (Role, Permission, Scope) | ✅ Đạt | Đã tích hợp action/route guard. |
| Kết nối ví Blockchain & Chữ ký (Wallet) | ✅ Đạt | Hỗ trợ Challenge/Verify theo EIP-191. |

### Sprint 2: Core Entities & Dashboard
| Hạng mục | Trạng thái | Ghi chú |
| --- | :---: | --- |
| Quản lý Người dùng & Đơn vị (Organization) | ✅ Đạt | CRUD đầy đủ, phân quyền theo Admin Agency. |
| Quản lý Thửa đất & Địa giới hành chính | ✅ Đạt | Áp dụng chuẩn địa giới hành chính 2 cấp (Tỉnh/Xã). |
| Dashboard phân quyền | ✅ Đạt | Tùy biến UI theo Role + Scope của cán bộ. |
| Việt hóa & UI/UX | ✅ Đạt | Giao diện đã chuẩn hóa tiếng Việt, hỗ trợ lỗi từ BE. |

### Sprint 3: Hồ sơ Đăng ký Đất đai (Registration Workflow)
| Hạng mục | Trạng thái | Ghi chú |
| --- | :---: | --- |
| Tạo hồ sơ đăng ký lần đầu & Upload tài liệu | ✅ Đạt | Tích hợp upload IPFS/Mock. |
| Quản lý phiên bản tài liệu (Document versioning) | ✅ Đạt | Khóa snapshot hồ sơ sau khi submit. |
| Luồng kiểm duyệt & Phân quyền (Officer Actions) | ✅ Đạt | Xác nhận xã -> VPĐKĐĐ -> Thuế -> Ký duyệt. |
| Nghĩa vụ tài chính (Intake Fee) | ✅ Đạt | Tách rõ các khoản phí và mock QR code thanh toán. |

### Sprint 4: Tích hợp Blockchain nâng cao
| Hạng mục | Trạng thái | Ghi chú |
| --- | :---: | --- |
| Cập nhật trạng thái sau phê duyệt | ✅ Đạt | Chỉ ghi lên Blockchain sau khi off-chain cấp phát xong. |
| Ghi nhận Smart Contract | ⚠️ Một phần | Chức năng gọi tự động bằng ví Backend đã chạy local, cần review gas fee và audit contract khi lên testnet/mainnet. |

## 3. Bảo mật & Kiểm thử (Security & Testing)

| Hạng mục | Trạng thái | Ghi chú |
| --- | :---: | --- |
| **Bảo vệ nhánh (Branch Protection)** | ❌ Chưa đạt | Chưa có remote evidence (bắt buộc review PR). |
| **Quét mã độc & Bí mật (Secret Scanning)** | ❌ Chưa đạt | Cần bật GitHub Advanced Security hoặc công cụ tương đương. |
| **Unit Tests & Integration Tests** | ✅ Đạt | Backend, Frontend và Contracts đều có test pass trên local. |
| **Bảo mật PII** | ✅ Đạt | Thông tin cá nhân nhạy cảm đã bị cô lập khỏi Blockchain (chỉ lưu Hash/CID). |

## 4. Hành động ưu tiên (Next Steps)

1. **Hoàn thiện Remote Checks (CI/CD):** Đảm bảo mọi bài test (backend-ci, frontend-ci) pass trên môi trường remote (GitHub) thay vì chỉ ở máy cục bộ. Bật chế độ chặn Merge nếu test fail.
2. **Cấu hình môi trường Production:** Viết tài liệu lưu trữ `.env` an toàn (ví dụ: dùng AWS Secrets Manager hoặc GitHub Secrets) cho `PINATA_JWT`, `RPC_URL`, `BACKEND_WALLET_PRIVATE_KEY`.
3. **Triển khai Web Server:** Đóng gói bản build Frontend (`npm run build`) đưa lên host như Vercel/Netlify hoặc phục vụ qua Nginx trên VPS.
4. **Audit Smart Contract:** Thực hiện thêm một vòng quét bảo mật bằng Slither cho các contract trong thư mục `contracts/` trước khi deploy mạng chính.
