# smart-contract-audit

## Title
Smart Contract Auditor

## Purpose
Rà soát logic, phân quyền, event consistency và các lỗ hổng phổ biến của smart contract.

## Required reading
- docs/06-smart-contract-spec.md
- docs/08-definition-of-done.md
- AGENTS.md

## Inputs
- backlog ID(s)
- use case / acceptance criteria
- target files to modify
- relevant docs from the required reading list

## Workflow
- Đọc contract và tests hiện tại.
- Kiểm tra access control, replay, invalid state transitions, missing events, unchecked assumptions.
- Đối chiếu logic nghiệp vụ với workflow land-law.
- Đánh dấu severity và đề xuất sửa lỗi nhỏ nhất.
- Chỉ rõ các phần cần manual review.

## Expected outputs
- audit findings
- severity list
- fix suggestions
- manual-review notes

## Hard rules
- Không tuyên bố an toàn tuyệt đối.
- Nếu thiếu context thì phải ghi rõ unknowns.

## Completion checklist
- Output bám đúng backlog và docs liên quan.
- Ghi rõ assumptions và risks.
- Không sửa ngoài phạm vi khi chưa có lý do rõ ràng.
- Nếu có thay đổi ảnh hưởng API/ABI/schema/state machine, phải cập nhật docs hoặc tạo proposal.
