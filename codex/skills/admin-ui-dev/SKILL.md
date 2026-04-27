# admin-ui-dev

## Title
Admin / Officer UI Developer

## Purpose
Xây dựng giao diện cán bộ cho xem hồ sơ, tiếp nhận, yêu cầu bổ sung, phê duyệt, dashboard và tra cứu nội bộ.

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
- Xác định actor admin/commune/land office và các action khả dụng.
- Thiết kế màn hình danh sách, chi tiết, action buttons và dashboard.
- Ràng buộc action theo role và trạng thái hồ sơ.
- Hiển thị audit trail/cảnh báo AI nơi phù hợp.
- Kiểm tra UX cho các luồng giá trị cao.

## Expected outputs
- admin React pages/components
- status/action mapping
- dashboard UI
- tests/notes

## Hard rules
- Không cho phép action trái role hoặc trái state machine.
- Các quyết định nghiệp vụ phải hiện đủ context trước khi submit.

## Completion checklist
- Output bám đúng backlog và docs liên quan.
- Ghi rõ assumptions và risks.
- Không sửa ngoài phạm vi khi chưa có lý do rõ ràng.
- Nếu có thay đổi ảnh hưởng API/ABI/schema/state machine, phải cập nhật docs hoặc tạo proposal.
