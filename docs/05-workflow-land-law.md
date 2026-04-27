# 05-workflow-land-law.md

# UrbanChain-VN – Workflow Land Law Notes (MVP)

## 1. Mục đích tài liệu

Tài liệu này là **nguồn sự thật nghiệp vụ** cho toàn bộ dự án UrbanChain-VN. Mọi AI agent, tài liệu đặc tả, API, smart contract, UI và test case phải bám theo tài liệu này.

Mục tiêu của UrbanChain-VN là **mô phỏng số hóa quy trình đất đai** trong phạm vi MVP, không thay thế hệ thống pháp lý chính thức. Vì vậy:

- quyết định nghiệp vụ thuộc về cơ quan nhà nước có thẩm quyền;
- AI chỉ hỗ trợ OCR, đối chiếu dữ liệu, gợi ý cảnh báo;
- blockchain/IPFS chỉ hỗ trợ lưu vết, truy xuất và kiểm chứng dữ liệu số;
- hồ sơ địa chính và cơ sở dữ liệu đất đai chính thức vẫn là nguồn dữ liệu pháp lý trung tâm.

---

## 2. Các nguyên tắc nghiệp vụ bắt buộc

### 2.1. Nguyên tắc chung
- Hệ thống phải phản ánh đúng các mắt xích hành chính: **cơ quan tiếp nhận hồ sơ**, **UBND cấp xã**, **VPĐKĐĐ/Chi nhánh VPĐKĐĐ**, **cơ quan thuế**, **cơ quan có thẩm quyền ký cấp/phê duyệt**.
- Không cho phép AI tự quyết định hồ sơ hợp lệ hay không hợp lệ.
- Không cho phép blockchain trở thành nguồn dữ liệu pháp lý duy nhất.
- Không lưu dữ liệu cá nhân nhạy cảm trực tiếp on-chain.
- Tất cả thay đổi trạng thái hồ sơ phải có **audit trail**.
- Mọi workflow nghiệp vụ phải phân biệt rõ:
  1. **kiểm tra thành phần hồ sơ**;
  2. **thẩm định điều kiện pháp lý/nghiệp vụ**;
  3. **liên thông và cập nhật kết quả**.

### 2.2. Nguyên tắc dữ liệu
- **Off-chain**: lưu dữ liệu nghiệp vụ, dữ liệu cá nhân, trạng thái hồ sơ, dữ liệu OCR, báo cáo.
- **IPFS**: lưu file scan, tài liệu PDF, ảnh, minh chứng đính kèm.
- **Blockchain**: lưu transaction hash, CID/hash tham chiếu, lịch sử sự kiện, bản ghi số sau khi hồ sơ đã xử lý hợp lệ.

### 2.3. Nguyên tắc UI/UX
- UI của người dân chỉ thể hiện các bước người dân được phép thao tác.
- UI cán bộ phải phân tách theo vai trò:
  - cơ quan tiếp nhận hồ sơ;
  - UBND cấp xã;
  - VPĐKĐĐ/Chi nhánh VPĐKĐĐ;
  - quản trị/tổng hợp báo cáo.

---

## 3. Các chủ thể nghiệp vụ

## 3.1. Bên ngoài hệ thống
- Người dân
- Doanh nghiệp
- Người chuyển nhượng
- Người nhận chuyển nhượng

## 3.2. Cơ quan nhà nước / đơn vị xử lý
- Cơ quan tiếp nhận hồ sơ và trả kết quả
- UBND cấp xã
- VPĐKĐĐ / Chi nhánh VPĐKĐĐ
- Cơ quan thuế
- Cơ quan có thẩm quyền ký cấp / phê duyệt kết quả

## 3.3. Thành phần kỹ thuật hỗ trợ
- Hệ thống UrbanChain-VN
- AI hỗ trợ
- IPFS
- Blockchain testnet

---

## 4. Workflow 1 – Đăng ký đất đai, cấp Giấy chứng nhận lần đầu

## 4.1. Mục tiêu nghiệp vụ
Cho phép người sử dụng đất nộp hồ sơ đăng ký lần đầu, cơ quan có thẩm quyền tiếp nhận – xác nhận – thẩm định – xác định nghĩa vụ tài chính – ký cấp – cập nhật hồ sơ địa chính, đồng thời tạo bản ghi số hỗ trợ trên blockchain/IPFS.

## 4.2. Dữ liệu đầu vào chính
- đơn đăng ký đất đai, tài sản gắn liền với đất;
- giấy tờ về quyền sử dụng đất/quyền sở hữu tài sản gắn liền với đất;
- giấy tờ nhân thân;
- bản đồ/trích đo/trích lục khi cần;
- giấy tờ miễn, giảm nghĩa vụ tài chính nếu có;
- tài liệu scan, minh chứng đính kèm.

## 4.3. Luồng nghiệp vụ chuẩn
1. Người dân đăng nhập và nộp hồ sơ điện tử.
2. Hệ thống tạo mã hồ sơ, lưu dữ liệu off-chain.
3. File đính kèm được lưu lên IPFS, sinh CID/hash.
4. AI OCR đọc file, bóc tách dữ liệu và sinh cảnh báo hỗ trợ.
5. Cơ quan tiếp nhận hồ sơ kiểm tra thành phần hồ sơ.
6. Nếu hồ sơ thiếu → lập phiếu yêu cầu bổ sung.
7. Nếu hồ sơ đủ → cấp giấy tiếp nhận/hẹn trả.
8. Hồ sơ chuyển tới UBND cấp xã để xác nhận nội dung thuộc thẩm quyền.
9. Hồ sơ chuyển tới VPĐKĐĐ/Chi nhánh VPĐKĐĐ để thẩm định chuyên môn.
10. Nếu phát sinh nghĩa vụ tài chính → lập phiếu chuyển thông tin sang cơ quan thuế.
11. Cơ quan thuế xác định và trả nghĩa vụ tài chính.
12. VPĐKĐĐ/Chi nhánh hoàn thiện hồ sơ trình cấp.
13. Cơ quan có thẩm quyền ký cấp/phê duyệt.
14. VPĐKĐĐ/Chi nhánh cập nhật hồ sơ địa chính và cơ sở dữ liệu đất đai.
15. Hệ thống cập nhật trạng thái hồ sơ và thông báo kết quả.
16. Blockchain ghi transaction/hash/CID tham chiếu cho bản ghi số hỗ trợ.

## 4.4. Các decision bắt buộc
- Hồ sơ đầy đủ?
- Cần bổ sung?
- Có phát sinh nghĩa vụ tài chính?
- Hồ sơ đủ điều kiện cấp?
- Đã ký cấp?

## 4.5. Trạng thái hồ sơ đề xuất
- `MOI_TAO`
- `CHO_TIEP_NHAN`
- `CAN_BO_SUNG`
- `DA_TIEP_NHAN`
- `CHO_XAC_NHAN_CAP_XA`
- `DA_XAC_NHAN_CAP_XA`
- `DANG_THAM_DINH_VPDKDD`
- `CHO_THUE`
- `CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH`
- `CHO_KY_CAP`
- `DA_KY_CAP`
- `DA_CAP`
- `DA_TRA_KET_QUA`

## 4.6. Những gì không được làm
- Không mint NFT ngay khi người dân nộp hồ sơ.
- Không cho AI tự động phê duyệt hồ sơ.
- Không cập nhật “đã cấp” nếu chưa có bước ký cấp và cập nhật hồ sơ địa chính.

---

## 5. Workflow 2 – Duyệt hồ sơ / yêu cầu bổ sung / từ chối

## 5.1. Mục tiêu nghiệp vụ
Quản lý luồng xử lý nội bộ giữa cơ quan tiếp nhận, UBND cấp xã và VPĐKĐĐ/Chi nhánh VPĐKĐĐ để đi đến một trong ba kết quả: yêu cầu bổ sung, từ chối, hoặc chuyển bước xử lý tiếp.

## 5.2. Luồng nghiệp vụ chuẩn
1. Cơ quan tiếp nhận mở hồ sơ.
2. Kiểm tra thành phần hồ sơ.
3. Nếu thiếu → yêu cầu bổ sung.
4. Nếu đủ → chuyển hồ sơ đến cấp xử lý tiếp theo.
5. UBND cấp xã xác nhận thông tin thuộc thẩm quyền.
6. Nếu còn thiếu/lệch → yêu cầu bổ sung.
7. VPĐKĐĐ/Chi nhánh thẩm định chuyên môn.
8. Nếu không đủ điều kiện → từ chối, ghi lý do.
9. Nếu đủ điều kiện → chuyển bước nghĩa vụ tài chính hoặc trình cấp.
10. Hệ thống cập nhật trạng thái và gửi thông báo.

## 5.3. Quy tắc nghiệp vụ
- “Yêu cầu bổ sung” khác “từ chối”.
- “Từ chối” bắt buộc phải có lý do.
- Mỗi quyết định xử lý phải lưu người xử lý, thời gian xử lý, ghi chú xử lý.

---

## 6. Workflow 3 – Đăng ký biến động do chuyển nhượng quyền sử dụng đất

## 6.1. Mục tiêu nghiệp vụ
Cho phép đăng ký biến động đối với giao dịch chuyển nhượng sau khi hồ sơ được tiếp nhận, kiểm tra điều kiện, xử lý nghĩa vụ tài chính và cập nhật biến động vào hồ sơ địa chính/CSDL đất đai.

## 6.2. Dữ liệu đầu vào chính
- đơn đăng ký biến động;
- Giấy chứng nhận đã cấp;
- hợp đồng/văn bản chuyển nhượng;
- giấy tờ đặc thù theo trường hợp;
- thông tin bên chuyển nhượng và bên nhận;
- tài liệu scan và file đính kèm.

## 6.3. Luồng nghiệp vụ chuẩn
1. Người chuyển nhượng/bên nhận tạo và nộp hồ sơ biến động.
2. Hệ thống tạo mã hồ sơ biến động.
3. File đính kèm lưu lên IPFS.
4. Cơ quan tiếp nhận kiểm tra thành phần hồ sơ.
5. Nếu thiếu → yêu cầu bổ sung.
6. Nếu đủ → chuyển VPĐKĐĐ/Chi nhánh.
7. VPĐKĐĐ/Chi nhánh kiểm tra điều kiện thực hiện quyền.
8. Nếu hồ sơ hợp lệ và phát sinh nghĩa vụ tài chính → lập phiếu chuyển thông tin sang cơ quan thuế.
9. Cơ quan thuế xác định nghĩa vụ tài chính.
10. Sau khi đủ điều kiện, VPĐKĐĐ/Chi nhánh cập nhật biến động vào hồ sơ địa chính/CSDL đất đai.
11. Hệ thống cập nhật trạng thái hoàn tất biến động.
12. Blockchain ghi nhận lịch sử giao dịch số hỗ trợ.

## 6.4. Decision bắt buộc
- Hồ sơ biến động đầy đủ?
- Hợp đồng/giấy tờ giao dịch hợp lệ?
- Có phát sinh nghĩa vụ tài chính?
- Đã hoàn thành nghĩa vụ tài chính?
- Đủ điều kiện đăng ký biến động?

## 6.5. Trạng thái hồ sơ đề xuất
- `MOI_TAO_BIEN_DONG`
- `CHO_TIEP_NHAN`
- `CAN_BO_SUNG`
- `DA_TIEP_NHAN`
- `DANG_KIEM_TRA_DIEU_KIEN`
- `DA_CHUYEN_THUE`
- `CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH`
- `DANG_CAP_NHAT_BIEN_DONG`
- `DA_DANG_KY_BIEN_DONG`
- `DA_TRA_KET_QUA`

## 6.6. Những gì không được làm
- Không chuyển quyền sở hữu on-chain trước khi hoàn tất đăng ký biến động.
- Không cho phép chuyển nhượng khi hồ sơ pháp lý chưa hợp lệ.
- Không đánh dấu hoàn tất nếu chưa cập nhật hồ sơ địa chính/CSDL đất đai.

---

## 7. Workflow 4 – Tra cứu thông tin đất đai / hồ sơ / lịch sử giao dịch

## 7.1. Mục tiêu nghiệp vụ
Cho phép người dân, doanh nghiệp và cán bộ truy vấn thông tin thửa đất, hồ sơ, trạng thái xử lý và lịch sử giao dịch theo phân quyền.

## 7.2. Luồng nghiệp vụ chuẩn
1. Người dùng gửi yêu cầu tra cứu.
2. Hệ thống kiểm tra quyền truy cập.
3. Hệ thống truy vấn dữ liệu off-chain/hồ sơ địa chính/CSDL đất đai.
4. Hệ thống truy vấn CID/hash/transaction tham chiếu từ IPFS/blockchain nếu có.
5. AI có thể tóm tắt lịch sử hồ sơ/giao dịch.
6. Hệ thống hiển thị kết quả.

## 7.3. Quy tắc nghiệp vụ
- Dữ liệu nghiệp vụ chính lấy từ CSDL đất đai/hồ sơ địa chính.
- Blockchain chỉ là lớp hỗ trợ truy vết.
- Người dân chỉ được xem dữ liệu thuộc quyền truy cập của mình.
- Cán bộ có thể xem sâu hơn theo vai trò.

---

## 8. Workflow 5 – AI OCR và kiểm tra hồ sơ nội bộ

## 8.1. Mục tiêu nghiệp vụ
Giảm thao tác nhập tay và hỗ trợ cán bộ phát hiện thiếu giấy tờ, sai lệch dữ liệu.

## 8.2. Luồng nghiệp vụ chuẩn
1. Hệ thống nhận file scan.
2. AI OCR bóc tách dữ liệu.
3. AI chuẩn hóa dữ liệu và đối chiếu với dữ liệu người dùng kê khai.
4. AI sinh cảnh báo:
   - thiếu giấy tờ;
   - sai lệch họ tên;
   - sai lệch mã hồ sơ;
   - sai lệch thông tin thửa đất.
5. Hệ thống lưu kết quả OCR và cảnh báo.
6. Cán bộ xem cảnh báo và kiểm tra lại hồ sơ gốc.
7. Cán bộ ra quyết định nghiệp vụ.

## 8.3. Quy tắc nghiệp vụ
- AI chỉ hỗ trợ.
- Không cho AI tự động đổi trạng thái hồ sơ sang “đạt/không đạt”.
- Mọi kết quả OCR phải có khả năng truy nguồn file gốc.

---

## 9. Mapping workflow sang module hệ thống

| Workflow | Module chính | Module phụ trợ |
|---|---|---|
| Đăng ký lần đầu | Auth, Registration, File Upload, Review, Tax, Approval | OCR, IPFS, Blockchain |
| Duyệt / bổ sung / từ chối | Review, Workflow Engine, Notifications | OCR, Audit Trail |
| Đăng ký biến động / chuyển nhượng | Transfer, Review, Tax, Land History | IPFS, Blockchain |
| Tra cứu | Search, Land Information, History | AI Summary |
| AI OCR hỗ trợ | OCR Service, Document Validation | Review UI |

---

## 10. Mapping workflow sang 15 AI agents

| Agent | Vai trò chính trong workflow |
|---|---|
| AI_01 | Kiến trúc tổng thể, luồng nghiệp vụ, UML |
| AI_02 | Smart contract đăng ký lần đầu, chuyển nhượng |
| AI_03 | Audit contract và logic blockchain |
| AI_04 | Backend API cho hồ sơ, workflow, tra cứu |
| AI_05 | Auth, role, mô phỏng định danh |
| AI_06 | Database, IPFS metadata, audit trail |
| AI_07 | Giao diện người dân |
| AI_08 | Giao diện cán bộ / dashboard |
| AI_09 | UX flow và wireframe |
| AI_10 | OCR và document extraction |
| AI_11 | Unit tests |
| AI_12 | E2E tests |
| AI_13 | Deploy, CI/CD, môi trường demo |
| AI_14 | Tài liệu kỹ thuật, hướng dẫn sử dụng |
| AI_15 | Compliance, checklist pháp lý, dữ liệu nhạy cảm |

---

## 11. Checklist trước khi code

Mọi AI agent trước khi code phải trả lời được:

1. Đây là workflow nào?
2. Thuộc bước kiểm tra thành phần hồ sơ, thẩm định hay cập nhật kết quả?
3. Cơ quan nào là chủ thể ra quyết định?
4. Dữ liệu nào được lưu off-chain?
5. Dữ liệu nào chỉ lưu CID/hash/transaction?
6. Có phát sinh nghĩa vụ tài chính không?
7. Có phải cập nhật hồ sơ địa chính/CSDL đất đai không?
8. Trạng thái hồ sơ đầu vào và đầu ra là gì?

---

## 12. Không được vi phạm

- Không cho blockchain thay thế nghiệp vụ pháp lý.
- Không cho AI quyết định hồ sơ hợp lệ.
- Không bỏ qua cơ quan thuế nếu workflow có nghĩa vụ tài chính.
- Không bỏ qua VPĐKĐĐ/Chi nhánh trong bước thẩm định chuyên môn.
- Không đánh dấu hồ sơ hoàn tất nếu chưa có cập nhật kết quả nghiệp vụ chuẩn.

