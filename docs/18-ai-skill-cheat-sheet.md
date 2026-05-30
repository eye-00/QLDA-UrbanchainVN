# AI Skill Cheat Sheet - UrbanChain-VN

## Mục đích

Cheat sheet này giúp chọn nhanh skill phù hợp khi làm việc trong repo UrbanChain-VN.

Nguyên tắc dùng:
- Chỉ nêu `1-3` skill gần nhất với bài toán.
- Nếu task chạm workflow đất đai, vẫn phải bám `docs/05-workflow-land-law.md`.
- Nếu task đổi API/contract/state, phải kiểm tra đồng bộ với `docs/06-smart-contract-spec.md`, `docs/07-api-contract.md`, `docs/08-definition-of-done.md`.
- Nếu task có thay đổi hành vi, ưu tiên thêm `tdd-workflow` hoặc skill test tương ứng.

## Cách gọi skill

Bạn có thể gọi thẳng trong prompt:

```text
Dùng skill backend-api-dev + api-design.
Thêm endpoint cho payment obligation của registration.
Không đổi API shape hiện có nếu chưa cập nhật docs/07-api-contract.md.
Phải có test.
```

Hoặc:

```text
Dùng skill citizen-ui-dev + frontend-patterns + ui-ux-review.
Refactor màn nộp hồ sơ đăng ký lần đầu cho công dân.
Giữ nguyên workflow và status hiện có.
```

## Nhóm skill nội bộ UrbanChain-VN

### Lập kế hoạch và nghiệp vụ

| Khi nào dùng | Skill nên gọi |
|---|---|
| Phân tích task lớn, chia module, xác định dependency | `system-architect`, `plan-mvp-feature` |
| Đối chiếu workflow đất đai, state, actor pháp lý | `research-land-workflow`, `compliance-review` |
| Kiểm tra thay đổi có đụng legal/business flow không | `compliance-review`, `system-architect` |

### Backend và dữ liệu

| Khi nào dùng | Skill nên gọi |
|---|---|
| Thêm/sửa API Express + TypeScript | `backend-api-dev` |
| Auth, RBAC, role boundary | `auth-role-dev` |
| Prisma, MySQL, IPFS metadata, document snapshot/version | `db-ipfs-dev` |
| Upload hồ sơ, CID/hash, off-chain storage | `db-ipfs-dev`, `backend-api-dev` |

### Smart contract và blockchain

| Khi nào dùng | Skill nên gọi |
|---|---|
| Viết/sửa contract Solidity | `smart-contract-dev`, `write-smart-contract` |
| Audit logic contract, role, duplicate mint/transfer | `smart-contract-audit`, `audit-smart-contract` |
| Kiểm tra ranh giới on-chain/off-chain | `smart-contract-audit`, `compliance-review` |

### Frontend

| Khi nào dùng | Skill nên gọi |
|---|---|
| Màn hình công dân | `citizen-ui-dev` |
| Màn hình cán bộ, dashboard, review flow | `admin-ui-dev`, `admin-dashboard` |
| UX flow, readability, consistency | `ui-ux-review` |
| Form React dùng lại pattern nhanh | `build-react-form` |

### OCR, test, vận hành, tài liệu

| Khi nào dùng | Skill nên gọi |
|---|---|
| OCR, document warning, đối chiếu hồ sơ | `ocr-workflow`, `ocr-document-check` |
| Viết unit test | `unit-test-writer`, `write-unit-tests` |
| Viết E2E test | `e2e-test-writer`, `write-e2e-tests` |
| CI/CD, script chạy demo, deploy | `devops-deploy` |
| Tài liệu kỹ thuật, hướng dẫn, closeout note | `tech-writer` |

## Nhóm skill ECC vừa cài

Đây là skill bổ trợ theo pattern chung, dùng tốt nhất khi ghép với skill nội bộ của dự án.

### Skill nên dùng thường xuyên

| Mục tiêu | Skill ECC |
|---|---|
| Tìm giải pháp/package/pattern trước khi code | `search-first` |
| Chuẩn hóa thiết kế API, status code, envelope | `api-design` |
| Pattern service/repository/middleware/backend | `backend-patterns` |
| Pattern React/form/state/performance | `frontend-patterns` |
| Rà soát auth, upload, input validation, secrets | `security-review` |
| Ép luồng test-first | `tdd-workflow` |
| Kiểm tra lại implementation sau khi sửa | `verification-loop` |
| Tra cứu docs và pattern kỹ thuật | `documentation-lookup`, `deep-research` |

### Skill ECC ít dùng hơn trong repo này

Chỉ gọi khi bài toán thật sự khớp:
- `brand-voice`, `article-writing`, `content-engine`, `crosspost`
- `investor-materials`, `investor-outreach`, `market-research`
- `frontend-slides`, `video-editing`
- `bun-runtime`, `nextjs-turbopack`, `x-api`

## Mapping nhanh theo loại task

### 1. Thêm endpoint backend mới

Gọi:
- `backend-api-dev`
- `api-design`
- `tdd-workflow`

Prompt mẫu:

```text
Dùng skill backend-api-dev + api-design + tdd-workflow.
Thêm endpoint cho officer xác nhận cập nhật hồ sơ địa chính.
Phải bám docs/07-api-contract.md và có test backend.
```

### 2. Sửa bug phân quyền hoặc auth

Gọi:
- `auth-role-dev`
- `security-review`
- `unit-test-writer`

Prompt mẫu:

```text
Dùng skill auth-role-dev + security-review + unit-test-writer.
Sửa bug citizen nhìn thấy dữ liệu không thuộc quyền của mình.
Không đổi role/state ngoài phạm vi bugfix.
```

### 3. Thêm flow upload tài liệu hoặc versioning

Gọi:
- `db-ipfs-dev`
- `backend-api-dev`
- `compliance-review`

Prompt mẫu:

```text
Dùng skill db-ipfs-dev + backend-api-dev + compliance-review.
Thêm document version mới khi người dân bổ sung hồ sơ.
Không xóa version cũ, OCR phải truy nguồn được document version.
```

### 4. Viết hoặc chỉnh smart contract

Gọi:
- `smart-contract-dev`
- `smart-contract-audit`
- `write-smart-contract`

Prompt mẫu:

```text
Dùng skill smart-contract-dev + smart-contract-audit + write-smart-contract.
Thêm kiểm tra chặn ghi on-chain khi hồ sơ chưa đủ điều kiện off-chain.
Không lưu PII on-chain, phải có test contract.
```

### 5. Làm UI công dân hoặc cán bộ

Gọi:
- `citizen-ui-dev` hoặc `admin-ui-dev`
- `frontend-patterns`
- `ui-ux-review`

Prompt mẫu:

```text
Dùng skill admin-ui-dev + frontend-patterns + ui-ux-review.
Cải thiện màn review hồ sơ để cán bộ thấy action đúng theo role.
Không đổi workflow state, chỉ sửa UI và behavior liên quan.
```

### 6. Rà soát toàn bộ một patch trước khi merge

Gọi:
- `verification-loop`
- `security-review`
- `compliance-review`

Prompt mẫu:

```text
Dùng skill verification-loop + security-review + compliance-review.
Review patch này theo hướng bug, regression, role boundary, on-chain/off-chain, và thiếu test.
```

## Bộ skill khuyến nghị mặc định cho repo này

Nếu không chắc nên gọi gì, bắt đầu với:
- `search-first` trước khi thêm thư viện hoặc abstraction mới
- `system-architect` khi task lớn hoặc đa module
- `backend-api-dev` cho backend
- `citizen-ui-dev` hoặc `admin-ui-dev` cho frontend
- `smart-contract-dev` cho Solidity
- `security-review` khi đụng auth/upload/wallet
- `tdd-workflow` khi có thay đổi hành vi
- `compliance-review` khi task chạm workflow đất đai, trạng thái, hoặc dữ liệu nhạy cảm

## Khi không nên lạm dụng skill

- Không gọi quá nhiều skill cùng lúc cho task nhỏ.
- Không dùng skill ECC để ghi đè rule nghiệp vụ của UrbanChain-VN.
- Không để `api-design` hoặc `backend-patterns` làm lệch `docs/07-api-contract.md`.
- Không để `frontend-patterns` làm đổi flow nghiệp vụ hoặc role action.
- Không để `smart-contract-dev` đẩy thêm dữ liệu nhạy cảm lên chain.

## Prompt mẫu ngắn dùng hàng ngày

```text
Dùng skill search-first.
Tìm xem repo đã có pattern hoặc package phù hợp cho [bài toán] chưa, rồi mới đề xuất code.
```

```text
Dùng skill backend-api-dev + security-review.
Sửa endpoint này theo đúng RBAC và validation hiện có.
```

```text
Dùng skill admin-ui-dev + ui-ux-review.
Sửa màn dashboard cán bộ, giữ nguyên workflow và API hiện tại.
```

```text
Dùng skill smart-contract-audit.
Review contract change này, tập trung access control, duplicate recording và dữ liệu on-chain.
```
