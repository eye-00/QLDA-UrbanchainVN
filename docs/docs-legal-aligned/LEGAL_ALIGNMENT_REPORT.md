# Legal Alignment Report — UrbanChain-VN

> Bản rà soát để chỉnh tài liệu dự án theo các file pháp luật đã upload. Phạm vi hiện tại: cập nhật tài liệu dự án sau khi Sprint 1 bản wallet đã hoàn thành, chuẩn bị triển khai Sprint 2+.

## 1. Các điểm phát hiện chính

### 1.1. QĐ 3380/2025 là nguồn mới hơn QĐ 2304 ở phần tương ứng

`3380_QD-BNNMT_670454.docx` công bố TTHC mới ban hành/sửa đổi/bổ sung lĩnh vực đất đai và ghi rõ nội dung được sửa đổi/bổ sung thay thế các nội dung tương ứng đã công bố tại QĐ 2304. Vì vậy khi thiết kế workflow/API/backlog, nếu cùng một thủ tục xuất hiện ở cả hai file, ưu tiên nội dung mới hơn trong QĐ 3380.

### 1.2. Mô hình hai cấp làm thay đổi actor và routing hồ sơ

`151_2025_ND-CP_660608.docx` yêu cầu phân định thẩm quyền theo chính quyền địa phương 02 cấp; thiết kế hệ thống phải bỏ thói quen route qua “cấp huyện” nếu thủ tục đã chuyển cấp. Actor nghiệp vụ cần dùng nhất quán: UBND cấp xã/Chủ tịch UBND cấp xã, cơ quan có chức năng quản lý đất đai cấp xã/cấp tỉnh, VPĐKĐĐ/Chi nhánh, cơ quan thuế.

### 1.3. Phí/lệ phí phải là bước tại cơ quan tiếp nhận hoặc nghĩa vụ tài chính off-chain

Nghị định 151 nêu khi thủ tục phải nộp phí/lệ phí thì người dân/tổ chức nộp đồng thời khi nộp hồ sơ cho cơ quan tiếp nhận. Do đó module payment nên chia hai loại: `INTAKE_FEE` khi nộp hồ sơ và `LAND_FINANCIAL_OBLIGATION` do cơ quan thuế xác định sau thẩm định. Không được gọi crypto/token là phương tiện nộp thuế/phí thật.

### 1.4. Bản đồ thửa đất phải tôn trọng hệ tọa độ, nội dung bản đồ địa chính và nguồn dữ liệu

Nghị định 101 quy định bản đồ địa chính phải thống nhất hệ quy chiếu/tọa độ VN-2000, phản ánh ranh giới, loại đất, số thứ tự thửa đất, diện tích và các yếu tố địa giới/quy hoạch liên quan. Do đó chức năng bản đồ trong MVP chỉ nên dùng dữ liệu mô phỏng/GeoJSON, có nhãn nguồn dữ liệu và trạng thái `DEMO_REFERENCE`, `OFFICIAL_REFERENCE`, `APPROVED_OFFCHAIN`, `HASH_RECORDED`.

### 1.5. Blockchain chỉ ghi sau khi nghiệp vụ off-chain hoàn tất

Tài liệu workflow và smart contract hiện tại đã đúng hướng: blockchain không thay thế quyết định hành chính, chỉ ghi nhận hash/CID/lịch sử sau khi hồ sơ xử lý hợp lệ. Cần siết lại DoD để mọi PR Sprint 2+ kiểm tra điều kiện này.

## 2. Các tài liệu đã chỉnh trong gói này

| File mới | Mục đích |
|---|---|
| `00-legal-basis-register.md` | Đăng ký nguồn pháp lý và thứ tự ưu tiên |
| `05-workflow-land-law.legal-aligned.md` | Bổ sung rule pháp lý, workflow hai cấp, nghĩa vụ tài chính, tài liệu, bản đồ |
| `09-business-processes.legal-aligned.md` | Cập nhật quy trình nghiệp vụ chi tiết theo actor pháp lý |
| `07-api-contract.legal-aligned.md` | Bổ sung API contract cho legal procedure, document version, signature, payment obligation, map parcel |
| `06-smart-contract-spec.legal-aligned.md` | Siết điều kiện ghi on-chain, event cho tài liệu/bản đồ/nghĩa vụ tài chính |
| `08-system-design.legal-aligned.md` | Cập nhật kiến trúc legal-aligned |
| `08-definition-of-done.legal-aligned.md` | Bổ sung gate pháp lý cho Sprint 2+ |
| `04-backlog-mvp.legal-aligned-addendum.md` | Addendum backlog sau Sprint 1 wallet |
| `15-codex-legal-alignment-tasks.md` | Prompt/task cho Codex triển khai tài liệu và code |

## 3. Việc cần làm ngay sau Sprint 1 wallet

1. Chốt `00-legal-basis-register.md` làm nguồn tham chiếu bắt buộc.
2. Thay/cập nhật docs trong repo bằng các file `.legal-aligned.md` sau khi review.
3. Chạy docs-check để đảm bảo link và heading không lỗi.
4. Mở Sprint 2 theo hướng: số hóa hồ sơ + phiên bản tài liệu + IPFS + kiểm tra thành phần hồ sơ.
5. Không triển khai MoMo Test/QR và blockchain payment trước khi có module nghĩa vụ tài chính off-chain.

## 4. Quy tắc PM decision

Gắn nhãn `NEEDS_PM_DECISION` nếu gặp một trong các trường hợp:

- thủ tục trong QĐ 3380 và QĐ 2304 có mô tả khác nhau;
- không xác định được actor sau phân quyền 02 cấp;
- dữ liệu bản đồ chưa rõ nguồn chính thức/mô phỏng;
- yêu cầu ký số vượt khỏi mô phỏng MVP;
- yêu cầu thanh toán thật bằng blockchain/crypto/token.
