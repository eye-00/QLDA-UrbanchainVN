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

## 2.1. Điều-khoản trọng yếu áp dụng cho MVP

| Nguồn | Điều-khoản trọng yếu | Tác động trực tiếp tới hệ thống |
|---|---|---|
| `151/2025/NĐ-CP` | Điều 2 | Bắt buộc thiết kế authority-routing theo mô hình 2 cấp và actor đúng thẩm quyền |
| `151/2025/NĐ-CP` | Điều 3 | Phí/lệ phí nộp cùng hồ sơ tại cơ quan tiếp nhận; payment blockchain chỉ là bằng chứng kỹ thuật |
| `151/2025/NĐ-CP` | Điều 5-9 | Chuyển phân định thẩm quyền từ cấp huyện sang cấp xã/cấp tỉnh trong nhiều thủ tục |
| `101/2024/NĐ-CP` | Điều 3 | Bản đồ địa chính phải bám hệ tọa độ/quy chiếu VN-2000 |
| `101/2024/NĐ-CP` | Điều 4 | Nội dung bản đồ địa chính phục vụ đăng ký, hồ sơ địa chính, CSDL đất đai |
| `101/2024/NĐ-CP` | Điều 6 | Chỉnh lý bản đồ địa chính theo căn cứ pháp lý và dữ liệu thay đổi |
| `2304/QĐ-BNNMT` | Danh mục TTHC nền | Dùng làm baseline thủ tục nếu chưa bị văn bản mới thay thế |
| `3380/QĐ-BNNMT` | Danh mục TTHC mới/sửa đổi | Override phần tương ứng của 2304 khi có sửa đổi/bổ sung |

## 2.2. Quy tắc ưu tiên cụ thể

- `3380 > 2304` cho thủ tục trùng hoặc được sửa đổi/bổ sung.
- `151` ưu tiên cho mapping actor-thẩm quyền-phí/lệ phí.
- `101` ưu tiên cho dữ liệu bản đồ/hồ sơ địa chính/CSDL đất đai.
- Các trường hợp không xác định rõ thủ tục/actor phải gắn `NEEDS_PM_DECISION`.

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

## 5. Phạm vi áp dụng theo sprint (legal baseline)

| Sprint | Trọng tâm pháp lý bắt buộc | Trạng thái hiện tại |
|---|---|---|
| Sprint 2 | Procedure registry, authority matrix, document version/snapshot, intake fee/payment skeleton | Partial |
| Sprint 3 | Bổ sung rule transition có legal basis và version history theo actor | Partial |
| Sprint 4 | Chỉ ghi blockchain sau khi off-chain đạt điều kiện cập nhật hồ sơ địa chính/CSDL đất đai | Partial |

Liên kết ma trận chi tiết: [16-legal-requirement-traceability.md](./16-legal-requirement-traceability.md)
