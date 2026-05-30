# Báo cáo kết quả đánh giá UX/UI & Backend Alignment - UrbanChain-VN

Tài liệu này dùng để ghi nhận toàn bộ các kết quả rà soát tự động, lỗi giao diện (UI), trải nghiệm (UX), lỗi logic, hoặc các điểm nghẽn (Blockers) phát hiện được trong quá trình kiểm thử hệ thống từ trạng thái dữ liệu trống.

---

## 📋 Danh sách kết quả & Điểm nghẽn phát hiện (Bug & Blocker Tracking)

| ID | Luồng nghiệp vụ | Màn hình/Chức năng | Mô tả chi tiết | Phân loại | Mức độ | Trạng thái | Ghi chú & Cách xử lý |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F-01** | Đăng ký tài khoản | Đăng ký Công dân | Không có liên kết/nút bấm trực quan đến form đăng ký tài khoản mới trên giao diện Trang chủ (được tối ưu hóa bằng các nút quick-login mặc định). Tuy nhiên API `POST /api/v1/auth/register` hoạt động tốt. | UI/UX | Low | **Đã ghi nhận** | Bổ sung nút "Đăng ký tài khoản" trên Header/Trang chủ. |
| **F-02** | Nộp hồ sơ | Dropdown Địa chỉ | Hệ thống dropdown Tỉnh/Thành phố và Xã/Phường hoạt động tốt, tải dữ liệu chính xác và đồng bộ hoàn hảo với backend. | UI/UX | Tốt | **Thành công** | Đã xác minh tính năng hoạt động tốt. |
| **F-03** | Quy trình Duyệt (Workflow) | State Machine (Backend) | Hệ thống kiểm soát tuần tự trạng thái rất nghiêm ngặt. Việc nhảy cóc trạng thái bị chặn hoàn toàn ở tầng Backend (trả về lỗi HTTP 400), đảm bảo tính toàn vẹn của quy trình pháp lý. | API/Backend | Tốt | **Thành công** | Rất tốt để bảo vệ tính pháp lý. |
| **B-01** | Đồng bộ Blockchain | Chọn Ví công vụ | Do DB vừa reset trắng, bảng `WalletAccount` và `ServiceWalletAuthorization` trống trơn. Giao diện báo *"Không có ví công vụ đủ điều kiện"*. | Trạng thái DB | **High** | **Đã xử lý** | Đã chạy script `seed-wallets.ts` liên kết và ủy quyền Ví 2 làm Ví công vụ cho cả Cán bộ VPĐKĐĐ và Cán bộ Phê duyệt thành công. |
| **B-02** | Đồng bộ Blockchain | Trình duyệt không có ví | Giao diện React Frontend yêu cầu có `window.ethereum` (MetaMask) để thực hiện chữ ký số. Ở môi trường bot tự động không có MetaMask nên luồng UI này không thể tự động bấm hết được. | Trình duyệt | **Blocker** | **Sẵn sàng** | Người dùng đã cung cấp 3 ví MetaMask thật. Hiện tại đã sẵn sàng để người dùng tự do click-through kiểm tra trực tiếp trên Chrome/Brave. |

---

## 🚀 Kết quả đánh giá chi tiết từng luồng

### 1. Đăng ký & Xác thực (Citizen Registration)
*   **Trạng thái API:** Hoạt động hoàn hảo. Đã đăng ký thành công tài khoản công dân mẫu `citizen@urbanchain.vn` thông qua gọi API trực tiếp.
*   **Trạng thái UI:** Giao diện trang chủ hiện tại đang được cấu hình sẵn các nút Đăng nhập nhanh (Quick-login) bằng các tài khoản seed mẫu. Nên bổ sung liên kết đến trang Đăng ký (`/register`) trên giao diện để người dân thực tế có thể tự tạo tài khoản.

### 2. Nộp hồ sơ Công dân (Citizen Submission)
*   **Điền form địa chỉ:** Dữ liệu Tỉnh/Thành phố tải rất nhanh và chính xác. Trạng thái xã/phường thay đổi tương ứng theo tỉnh được chọn một cách mượt mà.
*   **Tải tài liệu:** Việc nộp hồ sơ không bắt buộc đính kèm file vẫn thành công (ở trạng thái `Mới tạo`). Nhấn nút **Gửi hồ sơ** thành công chuyển trạng thái sang `Chờ tiếp nhận` (CHO_TIEP_NHAN) và chuyển vào hàng đợi của cán bộ tiếp nhận.

### 3. Chuỗi chuyển đổi trạng thái (Workflow State Machine)
*   Quy trình pháp lý được kiểm soát cực kỳ nghiêm ngặt trên backend.
*   Đã chạy thử nghiệm chuỗi chuyển trạng thái tuần tự và thành công 100% không gặp bất kỳ lỗi logic nào từ:
    $$\text{Mới tạo} \rightarrow \text{Chờ tiếp nhận} \rightarrow \text{Đã tiếp nhận} \rightarrow \text{Đã xác nhận cấp xã} \rightarrow \text{Chờ hoàn thành nghĩa vụ tài chính} \rightarrow \text{Đã hoàn thành nghĩa vụ tài chính} \rightarrow \text{Chờ ký cấp} \rightarrow \text{Đã ký cấp} \rightarrow \text{Đã cập nhật hồ sơ địa chính}$$

### 4. Thông tin liên kết Ví MetaMask của bạn (Đã nạp vào DB)
*   **Ví 1 (Công dân A):** `0xfb395242dC71Aece60749eB2532fdC9f09b81ce2` liên kết với `citizen@urbanchain.vn`
*   **Ví 2 (Cán bộ công vụ):** `0x130F64878F3CEAd6eF8263D743230514a0D6A561` liên kết và ủy quyền làm Ví công vụ cho `registry_test@urbanchain.vn` và `approval_test@urbanchain.vn`
*   **Ví 3 (Công dân B):** `0x9e117a91BD210d5265716006Fe4407547F119b4B` liên kết với `citizen2@urbanchain.vn`

---

## 🛠️ Đề xuất hành động tiếp theo
1.  Đăng nhập bằng các tài khoản kiểm thử đã liên kết ví ở trên (mật khẩu chung: `StrongPassword@123`).
2.  Tiến hành đi hết vòng đời hồ sơ từ nộp đơn (bằng Ví 1), duyệt hồ sơ qua các cán bộ, và ký đồng bộ Blockchain (bằng Ví 2).
3.  Báo lại cho mình bất kỳ lỗi hiển thị hoặc lỗi giao dịch nào trên trình duyệt.

