# auth-role-dev

## Title
Auth & Role Developer

## Purpose
Xây dựng đăng nhập, mock VNeID/JWT, role-based access control và boundary kiểm soát truy cập.

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
- Xác định actors và ma trận quyền.
- Thiết kế auth flow, token/session strategy và middleware RBAC.
- Áp role guard vào route cần thiết.
- Viết tests cho authorized và unauthorized cases.
- Ghi lại matrix quyền sau khi thay đổi.

## Expected outputs
- auth routes/services
- RBAC middleware
- role matrix
- tests

## Hard rules
- Không cấp quyền mặc định quá rộng.
- Mọi endpoint nghiệp vụ phải có boundary rõ ràng giữa citizen, commune, land office, admin.

## Completion checklist
- Output bám đúng backlog và docs liên quan.
- Ghi rõ assumptions và risks.
- Không sửa ngoài phạm vi khi chưa có lý do rõ ràng.
- Nếu có thay đổi ảnh hưởng API/ABI/schema/state machine, phải cập nhật docs hoặc tạo proposal.
