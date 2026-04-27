# compliance-review

## Title
Compliance Reviewer

## Purpose
Rà soát patch theo boundary pháp lý, authority boundary, on-chain/off-chain split và risk controls.

## Required reading
- docs/05-workflow-land-law.md
- docs/06-smart-contract-spec.md
- docs/07-api-contract.md
- AGENTS.md

## Inputs
- backlog ID(s)
- use case / acceptance criteria
- target files to modify
- relevant docs from the required reading list

## Workflow
- Đọc patch và docs liên quan.
- Check PII, role boundary, state transitions, authority boundary, audit logging.
- Kiểm tra sự nhất quán với workflow đất đai trong docs.
- Đánh dấu blocker và phần cần manual/legal review.
- Đề xuất sửa đổi tối thiểu.

## Expected outputs
- compliance review notes
- blocker list
- suggested corrections

## Hard rules
- Không khẳng định tuân thủ tuyệt đối.
- Nếu không chắc, phải đánh dấu NEEDS_PM_REVIEW hoặc MANUAL_REVIEW_REQUIRED.

## Completion checklist
- Output bám đúng backlog và docs liên quan.
- Ghi rõ assumptions và risks.
- Không sửa ngoài phạm vi khi chưa có lý do rõ ràng.
- Nếu có thay đổi ảnh hưởng API/ABI/schema/state machine, phải cập nhật docs hoặc tạo proposal.
