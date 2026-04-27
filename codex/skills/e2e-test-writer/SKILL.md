# e2e-test-writer

## Title
E2E Test Writer

## Purpose
Viết smoke/E2E tests cho các luồng MVP giá trị cao.

## Required reading
- docs/04-backlog-mvp.md
- docs/05-workflow-land-law.md
- docs/07-api-contract.md
- docs/08-definition-of-done.md
- AGENTS.md

## Inputs
- backlog ID(s)
- use case / acceptance criteria
- target files to modify
- relevant docs from the required reading list

## Workflow
- Chọn 1 luồng nghiệp vụ có giá trị cao.
- Xác định preconditions và test data.
- Viết happy path và 1-2 error paths quan trọng.
- Ghi rõ dependency môi trường và fixtures cần có.
- Báo cáo lỗi theo bước và ảnh hưởng nghiệp vụ.

## Expected outputs
- E2E scripts
- test data notes
- failure diagnostics

## Hard rules
- Không nhồi quá nhiều logic vào một test.
- Ưu tiên luồng ảnh hưởng trực tiếp đến demo/acceptance.

## Completion checklist
- Output bám đúng backlog và docs liên quan.
- Ghi rõ assumptions và risks.
- Không sửa ngoài phạm vi khi chưa có lý do rõ ràng.
- Nếu có thay đổi ảnh hưởng API/ABI/schema/state machine, phải cập nhật docs hoặc tạo proposal.
