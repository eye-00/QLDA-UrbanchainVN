# devops-deploy

## Title
DevOps & Deploy

## Purpose
Đóng gói môi trường chạy, docker, CI scripts và hướng dẫn deploy demo.

## Required reading
- docs/01-project-overview.md
- docs/07-api-contract.md
- docs/08-definition-of-done.md
- AGENTS.md

## Inputs
- backlog ID(s)
- use case / acceptance criteria
- target files to modify
- relevant docs from the required reading list

## Workflow
- Đọc cấu trúc repo và dependency runtime.
- Chuẩn hóa local/dev/demo environment.
- Cập nhật Docker, scripts, env example, health checks.
- Đề xuất CI steps tối thiểu: lint, test, build.
- Viết hướng dẫn chạy demo đầu cuối.

## Expected outputs
- docker/scripts patch
- env notes
- CI notes
- deploy guide

## Hard rules
- Không hardcode secrets.
- Không thêm hạ tầng vượt quá phạm vi MVP khi chưa cần.

## Completion checklist
- Output bám đúng backlog và docs liên quan.
- Ghi rõ assumptions và risks.
- Không sửa ngoài phạm vi khi chưa có lý do rõ ràng.
- Nếu có thay đổi ảnh hưởng API/ABI/schema/state machine, phải cập nhật docs hoặc tạo proposal.
