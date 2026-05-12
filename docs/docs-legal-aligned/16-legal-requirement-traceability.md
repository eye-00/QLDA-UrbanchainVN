# 16. Legal Requirement Traceability Matrix

> Mục tiêu: map điều khoản pháp lý từ 4 văn bản nguồn sang chức năng hệ thống UrbanChain-VN để kiểm soát triển khai, test và closure theo legal gate.

## 1. Nguồn chuẩn

- `101_2024_ND-CP_613131.docx`
- `151_2025_ND-CP_660608.docx`
- `2304_QD-BNNMT_662509.docx`
- `3380_QD-BNNMT_670454.docx`

Quy tắc ưu tiên:
- Khi cùng thủ tục xuất hiện ở cả QĐ 2304 và QĐ 3380, ưu tiên QĐ 3380 cho phần sửa đổi/bổ sung.
- NĐ 151 làm chuẩn cho actor/thẩm quyền 2 cấp và rule phí/lệ phí.
- NĐ 101 làm chuẩn cho bản đồ địa chính, VN-2000, hồ sơ địa chính/CSDL đất đai.

## 2. Ma trận traceability

| Nguồn luật | Điều-khoản (tham chiếu) | Yêu cầu pháp lý | Chức năng hệ thống | Tài liệu áp dụng | Trạng thái | NEEDS_PM_DECISION |
|---|---|---|---|---|---|---|
| 151/2025/NĐ-CP | Điều 2 | Phân định thẩm quyền chính quyền địa phương 2 cấp | Routing actor theo role trong workflow | `05`, `08`, `09`, `07` | Partial | No |
| 151/2025/NĐ-CP | Điều 3 | Khi nộp hồ sơ có phí/lệ phí thì thu tại cơ quan tiếp nhận | Intake fee + payment obligation model | `05`, `07`, `09` | Partial | No |
| 151/2025/NĐ-CP | Điều 5-9 | Chuyển thẩm quyền từ cấp huyện sang cấp xã/cấp tỉnh theo quy định | Authority matrix theo thủ tục | `05`, `08`, `09`, `07` | Partial | No |
| 101/2024/NĐ-CP | Điều 3 | Bản đồ địa chính theo hệ quy chiếu/tọa độ VN-2000 | Quy định map source + tọa độ tham chiếu | `05`, `08`, `07` | Partial | No |
| 101/2024/NĐ-CP | Điều 4 | Nội dung bản đồ địa chính phục vụ đăng ký, hồ sơ địa chính, CSDL đất đai | Quy trình cập nhật hồ sơ địa chính trước blockchain | `05`, `09`, `08` | Partial | No |
| 101/2024/NĐ-CP | Điều 6 | Chỉnh lý bản đồ địa chính theo căn cứ pháp lý | Ràng buộc nghiệp vụ map parcel & review | `05`, `07`, `09` | Missing | Yes |
| 2304/QĐ-BNNMT | Danh mục TTHC nền | Nguồn danh mục nền cho thủ tục đất đai | Procedure catalog baseline | `00`, `07`, `04` | Partial | No |
| 3380/QĐ-BNNMT | Danh mục TTHC mới/sửa đổi | Ưu tiên nội dung thủ tục mới/sửa đổi so với 2304 | Procedure override + legal basis mapping | `00`, `07`, `05` | Partial | No |
| 3380 + 151 | Theo thủ tục áp dụng | Actor xử lý có thể gồm UBND xã, cơ quan chuyên môn cấp xã, VPĐKĐĐ/Chi nhánh, cơ quan thuế | Workflow đăng ký lần đầu, biến động/chuyển nhượng | `05`, `09`, `08` | Partial | No |
| 101 + 151 | Theo quy trình đăng ký/cấp | Chỉ ghi blockchain sau khi cập nhật hồ sơ địa chính/CSDL đất đai hợp lệ | Blockchain precondition guard | `05`, `06`, `07`, `08`, `09` | Partial | No |
| 151 + 3380 | Theo TTHC cụ thể | Transition nhạy cảm phải có căn cứ pháp lý, actor và bằng chứng | Transition endpoint với `procedureCode`, `legalBasisCode`, `reason`, `evidence` | `07`, `05`, `09` | Partial | No |
| 101 + 151 | Quy định chung dữ liệu | Không dùng blockchain thay thế dữ liệu pháp lý gốc; không đưa PII lên chain | Data governance + privacy | `06`, `08`, `05` | Done | No |

Ghi chú cột `Tài liệu áp dụng`:
- `00` = `00-legal-basis-register.md`
- `04` = backlog canonical + legal addendum
- `05` = `05-workflow-land-law.legal-aligned.md`
- `06` = `06-smart-contract-spec.legal-aligned.md`
- `07` = `07-api-contract.legal-aligned.md`
- `08` = `08-system-design.legal-aligned.md`
- `09` = `09-business-processes.legal-aligned.md`

## 3. Mapping theo nhóm chức năng MVP

| Nhóm chức năng | Nguồn pháp lý chính | Trạng thái |
|---|---|---|
| Đăng ký lần đầu | 151 + 3380 + 101 | Partial |
| Duyệt hồ sơ | 151 + 3380 | Partial |
| Nghĩa vụ tài chính | 151 | Partial |
| Cập nhật hồ sơ địa chính/CSDL đất đai | 101 + 151 | Partial |
| Ghi blockchain | 101 + 151 | Partial |
| Bản đồ thửa đất | 101 | Partial |
| Tra cứu/Audit | 151 + 101 | Partial |

## 4. Quy tắc sử dụng trong chấm tiến độ

- Item `Done` chỉ hợp lệ khi có evidence pháp lý tương ứng trong ma trận này.
- Nếu có mơ hồ về thủ tục/actor giữa 2304 và 3380, gắn `NEEDS_PM_DECISION = Yes`.
- Nếu chưa đóng LEG blockers liên quan (`LEG-S2-*`, `LEG-S3-*`, `LEG-S4-001`) thì giữ trạng thái sprint ở `Partial`.
