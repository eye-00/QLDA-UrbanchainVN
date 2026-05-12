# Kế hoạch điều chỉnh Sprint 1-4 theo legal baseline (2026-05-11)

## 1) Snapshot đối soát

| Sprint | Trạng thái theo backlog legal-aligned | Trạng thái code hiện tại | Kết luận |
|---|---|---|---|
| Sprint 1 | Done | Đã có auth/session/audit/wallet MVP | `Done` |
| Sprint 2 | Partial | Thiếu legal core trước đợt này | Đang triển khai `LEG-S2-001..005` |
| Sprint 3 | Partial | Có review flow cơ bản, thiếu legal transition đầy đủ | Phụ thuộc hoàn tất S2 legal core |
| Sprint 4 | Partial | Có blockchain sync cơ bản, thiếu precondition legal hoàn chỉnh + service wallet governance | Cần đóng `LEG-S4-001` + US-565..576 |

## 2) Điều chỉnh bắt buộc theo legal

### Wave A (P0) - Sprint 2 Legal Core
- Legal procedure registry + authority matrix.
- Document versioning + submit snapshot.
- Payment obligation model: `INTAKE_FEE`, `LAND_FINANCIAL_OBLIGATION`.
- Transition guard bắt buộc: `procedureCode`, `legalBasisCode`, `reason`, `evidenceIds`.
- Mở rộng trạng thái pháp lý: `DA_HOAN_THANH_NGHIA_VU_TAI_CHINH`, `DA_CAP_NHAT_HO_SO_DIA_CHINH`, `DA_GHI_BLOCKCHAIN`, `HUY_HO_SO`.

### Wave B (P0/P1) - Sprint 3 Legal UX
- Đồng bộ action gating theo `role x status`.
- Hiển thị timeline/snapshot/version/payment trong màn xử lý hồ sơ.
- Chuẩn hóa thông điệp legal bằng tiếng Việt có dấu.

### Wave C (P0) - Sprint 4 Blockchain Legal Guard + Service Wallet
- Chỉ cho ghi chain khi hồ sơ đã `DA_CAP_NHAT_HO_SO_DIA_CHINH`.
- Hoàn thiện governance cho service wallet theo nhóm US-565..576:
  - kiểm soát role/allowlist,
  - kiểm tra network/chainId,
  - log vòng đời giao dịch (pending/success/fail),
  - cơ chế retry an toàn.

### Wave D - Docs closeout
- Đồng bộ `docs/04`, `docs/08`, `docs/12`, `docs/14` với legal evidence thực tế.
- Không nâng trạng thái `Done` nếu thiếu legal proof dù CI pass.

## 3) Chuỗi PR khuyến nghị

1. `PR-ADJ-01`: S2 legal core (DB + BE + guard + core tests).
2. `PR-ADJ-02`: S3 legal UX (FE + BE flow updates + UI tests).
3. `PR-ADJ-03`: S4 blockchain guard + service wallet governance + tx lifecycle tests.
4. `PR-ADJ-04`: docs closeout + traceability evidence.

## 4) Gate đóng

- Local gate: `db:generate`, `db:migrate`, `db:seed`, `lint`, `build`, `test`.
- Remote gate: `backend-ci`, `frontend-ci`, `contracts-ci`, `docs-check` + branch protection + secret scanning.
- Legal gate:
  - S2: đóng đủ `LEG-S2-001..005`,
  - S3: đóng đủ `LEG-S3-001..003`,
  - S4: đóng `LEG-S4-001` + US-565..576 có evidence code/test/docs.

## 5) Rủi ro hiện tại

- Nếu môi trường local không chạy được `prisma generate`/`tsc` (EPERM), cần xử lý khóa file trước khi xác nhận quality gate.
- Không merge nếu chưa có bằng chứng legal transition + blockchain precondition tại backend service layer.
