# ocr-workflow

## Title
OCR Workflow Developer

## Purpose
Tạo pipeline OCR, bóc tách dữ liệu và cảnh báo sơ bộ cho hồ sơ scan.

## Required reading
- docs/04-backlog-mvp.md
- docs/05-workflow-land-law.md
- docs/07-api-contract.md
- AGENTS.md

## Inputs
- backlog ID(s)
- use case / acceptance criteria
- target files to modify
- relevant docs from the required reading list

## Workflow
- Xác định file input và fields cần extract.
- Thiết kế pipeline OCR, normalization và rule cảnh báo.
- So sánh dữ liệu OCR với dữ liệu kê khai.
- Trả về warnings và confidence thay vì quyết định nghiệp vụ.
- Viết tests/demo fixtures nếu có thể.

## Expected outputs
- OCR service patch
- field extraction schema
- warning rules
- tests/demo notes

## Hard rules
- AI chỉ cảnh báo, không kết luận hồ sơ hợp lệ hay không.
- Không loại bỏ bước kiểm tra thủ công của cán bộ.

## Completion checklist
- Output bám đúng backlog và docs liên quan.
- Ghi rõ assumptions và risks.
- Không sửa ngoài phạm vi khi chưa có lý do rõ ràng.
- Nếu có thay đổi ảnh hưởng API/ABI/schema/state machine, phải cập nhật docs hoặc tạo proposal.
