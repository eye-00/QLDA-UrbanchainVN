# Codex Task Pack — Legal Alignment after Sprint 1 Wallet

## Task 1 — Sync docs

```md
Bạn là AI Orchestrator của UrbanChain-VN.

Bối cảnh:
- Sprint 1 bản wallet đã hoàn thành.
- Người dùng đã cung cấp các file pháp luật: QĐ 3380/2025, QĐ 2304/2025, NĐ 151/2025, NĐ 101/2024.
- Mục tiêu là chỉnh tài liệu dự án bám sát pháp luật, không thay đổi code nếu chưa cần.

Yêu cầu:
1. Đọc các file `.legal-aligned.md` trong gói này.
2. So sánh với docs hiện tại trong repo.
3. Tạo PR docs-only cập nhật:
   - docs/00-legal-basis-register.md
   - docs/05-workflow-land-law.md
   - docs/09-business-processes.md
   - docs/07-api-contract.md
   - docs/06-smart-contract-spec.md
   - docs/08-system-design.md
   - docs/08-definition-of-done.md
4. Không sửa Sprint 1 wallet implementation.
5. Mọi thay đổi phải có heading rõ, không phá link hiện có.
6. Chạy docs-check.
```

## Task 2 — Sprint 2 legal implementation plan

```md
Bạn là AI_03_Product_Backlog_Manager + AI_02_Business_Process_Analyst.

Hãy tạo kế hoạch Sprint 2 sau khi legal alignment:
- Legal Procedure Registry
- Document Versioning
- IPFS upload theo version
- Application document snapshot khi submit
- Intake fee flag/payment obligation skeleton
- Audit legalBasis cho transition

Output:
1. User stories cần thêm/chỉnh.
2. File backend/frontend/db/docs cần sửa.
3. Test bắt buộc.
4. Definition of Done theo legal gate.
```

## Task 3 — Code guard for on-chain recording

```md
Bạn là AI_04_Backend_API_Developer + AI_02_Blockchain_Core_Dev + AI_03_Smart_Contract_Auditor.

Hãy kiểm tra và đề xuất guard để đảm bảo:
- Không ghi blockchain khi hồ sơ chưa `DA_CAP_NHAT_HO_SO_DIA_CHINH` hoặc trạng thái tương đương.
- Không lưu PII/polygon/full document on-chain.
- Service wallet có role đúng.
- Có test negative cases.
```
