# Legal Basis Register — UrbanChain-VN

> Mục đích: chốt thứ tự ưu tiên nguồn pháp lý/nguồn nghiệp vụ để các AI agent và Codex không tự ý thiết kế sai quy trình đất đai. Tài liệu này không phải ý kiến tư vấn pháp lý; dùng cho MVP/demo học thuật.

## 1. Nguồn pháp lý đã đọc trong gói tài liệu

| Mã nguồn | File | Vai trò trong dự án | Cách áp dụng vào thiết kế |
|---|---|---|---|
| LAW-3380-2025 | `3380_QD-BNNMT_670454.docx` | Nguồn mới hơn công bố TTHC đất đai; nội dung sửa đổi/bổ sung thay thế nội dung tương ứng trong QĐ 2304 | Ưu tiên khi mapping thủ tục hành chính, cơ quan thực hiện, mã TTHC mới/sửa đổi |
| LAW-2304-2025 | `2304_QD-BNNMT_662509.docx` | Nền danh mục TTHC từ 01/07/2025; bị QĐ 3380 thay thế ở phần tương ứng | Dùng làm nguồn nền khi QĐ 3380 không thay thế/không có nội dung tương ứng |
| LAW-151-2025 | `151_2025_ND-CP_660608.docx` | Phân định thẩm quyền chính quyền địa phương 02 cấp, phân quyền/phân cấp trong đất đai | Thiết kế role, cơ quan xử lý, routing hồ sơ, nghĩa vụ phí/lệ phí |
| LAW-101-2024 | `101_2024_ND-CP_613131.docx` | Đăng ký, cấp GCN, hệ thống thông tin đất đai, đo đạc/bản đồ địa chính | Thiết kế dữ liệu hồ sơ, bản đồ thửa đất, hồ sơ địa chính, CSDL đất đai |

## 2. Thứ tự ưu tiên khi có mâu thuẫn

1. Quy định pháp luật mới hơn và trực tiếp hơn trong file đã cung cấp.
2. `3380_QD-BNNMT_670454.docx` cho danh mục TTHC được sửa đổi/bổ sung.
3. `151_2025_ND-CP_660608.docx` cho phân định thẩm quyền, cơ quan xử lý và phí/lệ phí.
4. `101_2024_ND-CP_613131.docx` cho dữ liệu đăng ký, bản đồ địa chính, hồ sơ địa chính/CSDL đất đai.
5. Tài liệu dự án hiện có: `05-workflow-land-law.md`, `09-business-processes.md`, `07-api-contract.md`, `06-smart-contract-spec.md`.

## 3. Kết luận thiết kế bắt buộc

- UrbanChain-VN chỉ mô phỏng số hóa và lưu vết; không thay thế hệ thống pháp lý chính thức.
- CSDL nghiệp vụ/hồ sơ địa chính là nguồn dữ liệu chính; blockchain chỉ ghi hash/CID/tx/event sau khi nghiệp vụ off-chain hợp lệ.
- AI OCR chỉ hỗ trợ bóc tách, đối chiếu, cảnh báo; không được tự phê duyệt/từ chối hồ sơ.
- Wallet/MetaMask dùng để xác minh ví, ký hash hoặc ký thao tác kỹ thuật; không thay thế chữ ký công vụ/chữ ký số hợp pháp của cơ quan nhà nước trong MVP.
- Thanh toán QR/MoMo Test nếu có chỉ là mô phỏng nghĩa vụ tài chính; bằng chứng thanh toán được lưu off-chain và ghi hash/receipt reference lên blockchain.
- Bản đồ thửa đất trong MVP dùng dữ liệu mô phỏng/GeoJSON mẫu; không được xem là bản đồ địa chính chính thức nếu chưa có nguồn dữ liệu chính thức.

## 4. Trạng thái Sprint hiện tại

- Sprint 1 bản wallet đã hoàn thành theo thông tin người dùng.
- Từ Sprint 2 trở đi cần chỉnh tài liệu/implementation bám quy trình pháp lý: upload hồ sơ, phiên bản tài liệu, xác nhận cấp xã, thẩm định VPĐKĐĐ, nghĩa vụ tài chính, ký cấp/phê duyệt, cập nhật hồ sơ địa chính/CSDL đất đai, sau đó mới ghi blockchain.
