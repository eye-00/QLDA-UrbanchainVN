# unit-test-writer

## Title
Unit Test Writer

## Purpose
Viết unit tests cho contract, backend service, utility và validation logic.

## Required reading
- docs/04-backlog-mvp.md
- docs/06-smart-contract-spec.md
- docs/07-api-contract.md
- docs/08-definition-of-done.md
- AGENTS.md

## Inputs
- backlog ID(s)
- use case / acceptance criteria
- target files to modify
- relevant docs from the required reading list

## Workflow
- Xác định expected behavior từ docs và code change.
- Liệt kê success path, failure path và edge cases.
- Viết tests nhỏ, rõ, độc lập.
- Báo cáo phần coverage chưa chạm tới.
- Đề xuất refactor nếu code khó test quá mức.

## Expected outputs
- unit test files
- coverage notes
- missing-case list

## Hard rules
- Không viết test vô nghĩa hoặc chỉ snapshot hình thức.
- Mỗi test phải map với expected behavior cụ thể.

## Completion checklist
- Output bám đúng backlog và docs liên quan.
- Ghi rõ assumptions và risks.
- Không sửa ngoài phạm vi khi chưa có lý do rõ ràng.
- Nếu có thay đổi ảnh hưởng API/ABI/schema/state machine, phải cập nhật docs hoặc tạo proposal.
