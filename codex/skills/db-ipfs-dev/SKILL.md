# db-ipfs-dev

## Title
Database & IPFS Developer

## Purpose
Thiết kế hoặc cập nhật schema DB, persistence, metadata files và IPFS integration cho UrbanChain-VN.

## Required reading
- docs/04-backlog-mvp.md
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
- Đọc entity/state cần hỗ trợ.
- Thiết kế schema, relations, indices và lifecycle lưu trữ metadata.
- Tạo hoặc cập nhật file upload pipeline và mapping hồ sơ ↔ CID/hash.
- Bảo đảm search/dashboard có dữ liệu cần thiết.
- Viết seed/demo data hoặc migration notes nếu cần.

## Expected outputs
- schema patch
- IPFS service patch
- metadata mapping notes
- migration/seed notes

## Hard rules
- Không lưu file scan on-chain.
- Không làm schema lệch với API contract và workflow states.
- Nếu thêm field nhạy cảm phải ghi rõ protection strategy.

## Completion checklist
- Output bám đúng backlog và docs liên quan.
- Ghi rõ assumptions và risks.
- Không sửa ngoài phạm vi khi chưa có lý do rõ ràng.
- Nếu có thay đổi ảnh hưởng API/ABI/schema/state machine, phải cập nhật docs hoặc tạo proposal.
