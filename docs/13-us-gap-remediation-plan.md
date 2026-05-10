# US Gap Remediation Plan - Sprint 1, Sprint 2, Sprint 3

Cập nhật: 2026-05-10 15:40:00

## 1) Tổng quan kết quả audit

| Sprint | Done | Partial | Missing | Tổng US |
|---|---:|---:|---:|---:|
| Sprint 1 | 90 | 0 | 0 | 90 |
| Sprint 2 | 72 | 0 | 0 | 72 |
| Sprint 3 | 58 | 14 | 0 | 72 |

- Số US đang cần xác nhận qua remote checks cho patch mới: **14**
- Số US còn Missing: **0**

## 2) Blocker phân loại

### P0 - Remote verification cho Sprint 3 legal hardening
- Chuoi PR dang mo:
  - [PR #16](https://github.com/eye-00/QLDA-UrbanchainVN/pull/16) - backend core (da pass backend-ci, con review bat buoc).
  - [PR #17](https://github.com/eye-00/QLDA-UrbanchainVN/pull/17) - frontend legal UX (base tren PR #16, chua den gate develop).
  - PR #18 - QA/docs closeout (se tao sau cap nhat docs + verify).
- Blocker hien tai: chua co full required checks pass tren PR dich cuoi vao `develop`.

### P1 - Legal acceptance alignment
- Cac nhom US Sprint 3 dang `Partial` vi thay doi acceptance:
  - `US-157..160`,
  - `US-187..192`,
  - `US-193..198`.
- Ly do: can dong bo evidence sau khi merge chain PR #16/#17/#18.

### P2 - Quality hardening
- Không còn blocker đóng sprint.
- Hướng cải tiến tiếp theo: tăng E2E role-based mở rộng cho Sprint 3 để giảm residual risk dài hạn.

## 3) Kế hoạch xử lý theo thứ tự

1. Merge PR #16 vao `develop` sau khi du review bat buoc.
2. Rebase PR #17 len `develop` (hoac doi base sau khi #16 merge), chot checks frontend.
3. Tao PR #18 (QA/docs closeout), chay full gate (`lint/build/test`) va cap nhat matrix US.

## 4) Action ownership để đóng gap

| Công việc | Agent chính | Agent phối hợp | Output |
|---|---|---|---|
| Verify remote checks cho patch mới | AI_14 | AI_12, AI_13 | In progress - theo doi chain PR #16/#17/#18 |
| Regression Sprint 3 legal hardening | AI_12 | AI_07, AI_09 | In progress - se chot o PR #18 |
| Đồng bộ closure docs | AI_15 | AI_03, AI_01 | In progress - cap nhat sau khi co merge chain |

## 5) Điều kiện chốt Done cuối cùng
- Không còn US `Missing`.
- US chỉ nâng `Done` khi có evidence code/test/docs và remote checks pass cho nhánh chứa thay đổi.
- Snapshot backlog và DoD được cập nhật đồng bộ cùng thời điểm đóng sprint.
