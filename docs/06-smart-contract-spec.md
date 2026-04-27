# 06-smart-contract-spec.md

# UrbanChain-VN – Smart Contract Specification (MVP)

## 1. Mục đích tài liệu

Tài liệu này là **đặc tả smart contract chính thức** cho MVP UrbanChain-VN. Mọi AI agent, code Solidity, backend integration, test, audit và tài liệu kỹ thuật phải bám theo tài liệu này.

Smart contract trong UrbanChain-VN **không thay thế quyết định hành chính**. Contract chỉ ghi nhận bản ghi số, lịch sử sự kiện và tham chiếu tài liệu số **sau khi** quy trình nghiệp vụ off-chain đã được cơ quan có thẩm quyền xử lý hợp lệ.

Tài liệu này phải được đọc cùng với:
- `04-backlog-mvp.md`
- `05-workflow-land-law.md`
- `07-api-contract.md`
- `08-definition-of-done.md`

---

## 2. Phạm vi MVP của smart contract

## 2.1. Smart contract phải làm gì
- ghi nhận **đăng ký đất đai lần đầu** dưới dạng bản ghi số/NFT đại diện quyền sử dụng đất;
- ghi nhận **lịch sử chuyển nhượng** sau khi hồ sơ biến động đã được đăng ký hợp lệ off-chain;
- lưu **tham chiếu** đến hồ sơ số trên IPFS thông qua `cid` hoặc `documentHash`;
- phát sinh **event** đầy đủ để backend, dashboard và audit trail có thể theo dõi;
- quản lý quyền ghi nhận on-chain theo vai trò của các ví được hệ thống cho phép.

## 2.2. Smart contract không được làm gì
- không lưu dữ liệu cá nhân nhạy cảm on-chain;
- không lưu toàn văn PDF, ảnh scan, CMND/CCCD, địa chỉ chi tiết hoặc dữ liệu nhạy cảm khác on-chain;
- không tự quyết định hồ sơ hợp lệ hay không hợp lệ;
- không tự nhận vai trò của cơ quan tiếp nhận, UBND cấp xã, VPĐKĐĐ, cơ quan thuế hoặc cơ quan ký cấp;
- không chuyển quyền sở hữu chỉ vì người dùng gửi giao dịch trực tiếp mà không có xác nhận off-chain hợp lệ.

---

## 3. Nguyên tắc thiết kế contract

### 3.1. Nguyên tắc pháp lý – nghiệp vụ
- Quyết định nghiệp vụ nằm ở hệ thống off-chain và cơ quan nhà nước có thẩm quyền.
- Contract chỉ ghi nhận **kết quả cuối** hoặc **mốc nghiệp vụ đã được chuẩn hóa**.
- Một hồ sơ chỉ được mint khi đã hoàn tất bước thẩm định, nghĩa vụ tài chính (nếu có), ký cấp/phê duyệt và cập nhật hồ sơ địa chính/CSDL đất đai.
- Một giao dịch chuyển nhượng chỉ được ghi nhận khi hồ sơ biến động đã hoàn tất off-chain.

### 3.2. Nguyên tắc kỹ thuật
- Ưu tiên dùng **ERC-721** cho bản ghi quyền sử dụng đất.
- Metadata on-chain phải tối giản.
- Tất cả thay đổi quan trọng phải phát `event`.
- Dùng **role-based access control** bằng OpenZeppelin `AccessControl`.
- Contract phải hỗ trợ backend idempotency thông qua `registrationCode` / `transferCode` / `externalRef`.

### 3.3. Nguyên tắc bảo mật
- Không cho phép public mint/transfer tự do.
- Chỉ ví thuộc vai trò hệ thống được cấp quyền mới được mint hoặc ghi nhận chuyển nhượng.
- Có cơ chế `pause` để dừng contract khi xảy ra sự cố.
- Tách rõ quyền `ADMIN`, `REGISTRAR`, `TRANSFER_AGENT`, `AUDITOR`.

---

## 4. Kiến trúc contract đề xuất

## 4.1. Bộ contract tối thiểu cho MVP

### Contract A – `UrbanLandRegistry`
Contract chính quản lý token đất đai và lịch sử sở hữu.

### Contract B – `UrbanRegistryAccess` (có thể gộp vào A trong MVP)
Quản lý role và danh sách địa chỉ ví được phép thao tác.

### Contract C – `UrbanRegistryEvents` (tùy chọn)
Nếu cần tách event hoặc mở rộng logging ở giai đoạn sau.

> Với MVP, có thể gộp A + B thành một contract duy nhất để giảm độ phức tạp.

## 4.2. Thư viện nên dùng
- OpenZeppelin ERC721
- OpenZeppelin AccessControl
- OpenZeppelin Pausable
- OpenZeppelin ReentrancyGuard (nếu có hàm cần bảo vệ)
- OpenZeppelin Strings / Counters nếu cần

---

## 5. Mô hình dữ liệu on-chain

## 5.1. Định danh chính
- `tokenId`: ID NFT đại diện quyền sử dụng đất
- `landCode`: mã định danh đất đai nội bộ/hệ thống
- `registrationCode`: mã hồ sơ đăng ký lần đầu
- `transferCode`: mã hồ sơ biến động/chuyển nhượng
- `externalRef`: mã tham chiếu nghiệp vụ off-chain

## 5.2. Cấu trúc dữ liệu đề xuất

```solidity
struct LandRecord {
    uint256 tokenId;
    string landCode;
    bytes32 parcelRef;
    bytes32 ownerRef;
    string documentCid;
    bytes32 documentHash;
    string metadataUri;
    uint8 landStatus;
    uint64 issuedAt;
    uint64 lastUpdatedAt;
    bool active;
}
```

## 5.3. Giải thích trường dữ liệu
- `tokenId`: khóa chính on-chain
- `landCode`: mã thửa đất/mã định danh nội bộ để backend đối chiếu
- `parcelRef`: giá trị băm từ cặp dữ liệu như số tờ, số thửa, mã địa phương, thay vì lưu trực tiếp chi tiết đầy đủ
- `ownerRef`: giá trị băm/tham chiếu của chủ sử dụng; **không lưu họ tên/CCCD đầy đủ**
- `documentCid`: CID IPFS của bộ hồ sơ chính đã khóa tại thời điểm ghi nhận
- `documentHash`: hash của hồ sơ/tài liệu chính để kiểm chứng toàn vẹn
- `metadataUri`: URI metadata tóm tắt nếu cần phục vụ NFT explorer/demo
- `landStatus`: trạng thái bản ghi on-chain
- `issuedAt`: thời điểm ghi nhận lần đầu
- `lastUpdatedAt`: thời điểm cập nhật gần nhất
- `active`: phục vụ logic khóa/hủy hiệu lực ở mức kỹ thuật nếu có

## 5.4. Mô hình lịch sử chuyển nhượng

```solidity
struct TransferRecord {
    string transferCode;
    uint256 tokenId;
    bytes32 fromOwnerRef;
    bytes32 toOwnerRef;
    string supportingCid;
    bytes32 supportingHash;
    uint64 approvedAt;
    address executedBy;
}
```

## 5.5. Enum đề xuất

```solidity
enum LandStatus {
    NONE,
    ISSUED,
    ACTIVE,
    TRANSFER_PENDING_REF,
    TRANSFERRED,
    LOCKED,
    CANCELLED_REF
}
```

> `TRANSFER_PENDING_REF` và `CANCELLED_REF` chỉ là tham chiếu trạng thái kỹ thuật hỗ trợ tích hợp. Quyết định thật vẫn ở off-chain.

---

## 6. Phân tách dữ liệu off-chain và on-chain

| Loại dữ liệu | Nơi lưu | Ghi chú |
|---|---|---|
| Họ tên, CCCD, địa chỉ, điện thoại | Off-chain DB | Không lưu on-chain |
| File PDF, ảnh scan, hồ sơ đầy đủ | IPFS | Chỉ lưu CID/hash on-chain |
| Trạng thái nghiệp vụ chi tiết | Off-chain DB | Dùng enum ở API/backend |
| Token đại diện quyền sử dụng đất | Blockchain | ERC-721 |
| Lịch sử sự kiện đã chốt | Blockchain | Event logs |
| Dashboard tổng hợp | Off-chain DB / Indexer | Index từ event + DB |

---

## 7. Role model trên contract

## 7.1. Vai trò tối thiểu

```solidity
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
bytes32 public constant TRANSFER_AGENT_ROLE = keccak256("TRANSFER_AGENT_ROLE");
bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
```

## 7.2. Ý nghĩa role
- `ADMIN_ROLE`: cấu hình contract, cấp role, cập nhật tham số hệ thống
- `REGISTRAR_ROLE`: ghi nhận đăng ký lần đầu sau khi hồ sơ đã hợp lệ
- `TRANSFER_AGENT_ROLE`: ghi nhận chuyển nhượng sau khi hồ sơ biến động đã hoàn tất
- `AUDITOR_ROLE`: truy vấn/đọc dữ liệu mở rộng hoặc thực hiện một số hành động audit-only nếu cần
- `PAUSER_ROLE`: dừng/mở contract trong trường hợp khẩn cấp

## 7.3. Quy tắc cấp quyền
- Không cấp trực tiếp cho người dân trong MVP.
- Chỉ ví backend service wallet hoặc ví đại diện đơn vị nghiệp vụ mới được cấp quyền ghi on-chain.
- Tách ví deploy với ví vận hành.

---

## 8. Danh sách hàm bắt buộc

## 8.1. Hàm khởi tạo

```solidity
constructor(string memory name_, string memory symbol_, address admin_)
```

Yêu cầu:
- thiết lập tên và symbol NFT;
- cấp `DEFAULT_ADMIN_ROLE` và `ADMIN_ROLE` cho `admin_`;
- có thể cấp luôn `PAUSER_ROLE` cho `admin_`.

## 8.2. `registerLand`

```solidity
function registerLand(
    string calldata registrationCode,
    string calldata landCode,
    bytes32 parcelRef,
    bytes32 ownerRef,
    string calldata documentCid,
    bytes32 documentHash,
    string calldata metadataUri,
    uint8 landStatus
) external returns (uint256 tokenId)
```

### Mục đích
Ghi nhận đăng ký đất đai lần đầu sau khi hồ sơ off-chain đã được phê duyệt hợp lệ.

### Điều kiện
- caller phải có `REGISTRAR_ROLE`
- `registrationCode` chưa được dùng
- `landCode` chưa được dùng cho token đang active
- `documentCid` không rỗng
- `documentHash` khác `0x0`

### Hành vi
- mint NFT mới
- tạo `LandRecord`
- ánh xạ `registrationCode -> tokenId`
- ánh xạ `landCode -> tokenId`
- phát event `LandRegistered`

### Không được làm
- không nhận dữ liệu PII trực tiếp
- không thực hiện nếu hồ sơ chưa xử lý hợp lệ off-chain

## 8.3. `recordTransfer`

```solidity
function recordTransfer(
    string calldata transferCode,
    uint256 tokenId,
    bytes32 fromOwnerRef,
    bytes32 toOwnerRef,
    string calldata supportingCid,
    bytes32 supportingHash
) external
```

### Mục đích
Ghi nhận chuyển nhượng sau khi hồ sơ đăng ký biến động đã hoàn tất.

### Điều kiện
- caller có `TRANSFER_AGENT_ROLE`
- `tokenId` tồn tại
- `transferCode` chưa được dùng
- `toOwnerRef` hợp lệ

### Hành vi
- cập nhật `ownerRef` trong `LandRecord`
- cập nhật `lastUpdatedAt`
- lưu `TransferRecord`
- phát event `LandTransferred`

### Lưu ý
Trong MVP, có thể **không dùng transferFrom chuẩn ERC721** cho người dùng cuối, mà chỉ dùng `recordTransfer` như một business action do hệ thống được cấp quyền gọi.

## 8.4. `updateLandMetadataRef`

```solidity
function updateLandMetadataRef(
    uint256 tokenId,
    string calldata newDocumentCid,
    bytes32 newDocumentHash,
    string calldata newMetadataUri,
    uint8 newStatus
) external
```

### Mục đích
Cập nhật tham chiếu metadata/hồ sơ trong các trường hợp được phép theo nghiệp vụ nội bộ.

### Điều kiện
- caller có `REGISTRAR_ROLE` hoặc `ADMIN_ROLE`
- token tồn tại

### Ghi chú
Không dùng hàm này để thay thế các quyết định hành chính; chỉ dùng khi có nghiệp vụ hợp lệ off-chain.

## 8.5. `pause` / `unpause`

```solidity
function pause() external
function unpause() external
```

### Mục đích
Dừng contract khi phát hiện sự cố.

## 8.6. Hàm tra cứu

```solidity
function getTokenIdByLandCode(string calldata landCode) external view returns (uint256)
function getTokenIdByRegistrationCode(string calldata registrationCode) external view returns (uint256)
function getLandRecord(uint256 tokenId) external view returns (LandRecord memory)
function getTransferRecord(string calldata transferCode) external view returns (TransferRecord memory)
```

### Ghi chú
Hàm view không trả PII; chỉ trả dữ liệu tham chiếu.

---

## 9. Danh sách event bắt buộc

## 9.1. `LandRegistered`

```solidity
event LandRegistered(
    uint256 indexed tokenId,
    string indexed registrationCode,
    string indexed landCode,
    bytes32 ownerRef,
    string documentCid,
    bytes32 documentHash,
    address executedBy,
    uint64 issuedAt
);
```

## 9.2. `LandTransferred`

```solidity
event LandTransferred(
    uint256 indexed tokenId,
    string indexed transferCode,
    bytes32 fromOwnerRef,
    bytes32 toOwnerRef,
    string supportingCid,
    bytes32 supportingHash,
    address executedBy,
    uint64 approvedAt
);
```

## 9.3. `LandMetadataRefUpdated`

```solidity
event LandMetadataRefUpdated(
    uint256 indexed tokenId,
    string documentCid,
    bytes32 documentHash,
    string metadataUri,
    uint8 newStatus,
    address executedBy,
    uint64 updatedAt
);
```

## 9.4. `RoleGrantedToOperationalWallet`

```solidity
event RoleGrantedToOperationalWallet(
    bytes32 indexed role,
    address indexed account,
    address indexed grantedBy,
    uint64 grantedAt
);
```

## 9.5. `ContractPausedStateChanged`

```solidity
event ContractPausedStateChanged(
    bool paused,
    address indexed changedBy,
    uint64 changedAt
);
```

---

## 10. Mapping workflow → contract action

| Workflow off-chain | Bước on-chain tương ứng | Hàm contract |
|---|---|---|
| Đăng ký lần đầu đã ký cấp và cập nhật hồ sơ địa chính | Ghi nhận bản ghi số / mint NFT | `registerLand` |
| Hồ sơ biến động do chuyển nhượng đã hoàn tất | Ghi nhận chủ sở hữu tham chiếu mới | `recordTransfer` |
| Điều chỉnh tham chiếu tài liệu/metadata hợp lệ | Cập nhật ref | `updateLandMetadataRef` |
| Tình huống khẩn cấp | Pause contract | `pause` |

---

## 11. Mapping API → contract

| API backend | Contract call | Ghi chú |
|---|---|---|
| `POST /registrations/:id/finalize-onchain` (nội bộ) | `registerLand(...)` | Chỉ gọi sau bước phê duyệt hoàn tất |
| `POST /transfers/:id/finalize-onchain` (nội bộ) | `recordTransfer(...)` | Chỉ gọi sau khi đăng ký biến động hoàn tất |
| `POST /lands/:id/update-chain-ref` (nội bộ) | `updateLandMetadataRef(...)` | Dùng hạn chế |
| `GET /lands/:id/onchain` | `getLandRecord(...)` | Chỉ đọc |

> Các endpoint finalize-onchain có thể chưa lộ ra ở bản public API, nhưng backend nội bộ nên có service tương ứng.

---

## 12. Ràng buộc nghiệp vụ bắt buộc

### 12.1. Ràng buộc đăng ký lần đầu
- Mỗi `registrationCode` chỉ được mint một lần.
- Mỗi `landCode` đang active chỉ tương ứng một token.
- Không được mint nếu `documentCid` hoặc `documentHash` trống.

### 12.2. Ràng buộc chuyển nhượng
- Không được ghi nhận chuyển nhượng nếu token không tồn tại.
- Không được reuse `transferCode`.
- Không được ghi nhận chuyển nhượng nếu `toOwnerRef == fromOwnerRef` trừ khi có use case đặc biệt được định nghĩa riêng.

### 12.3. Ràng buộc metadata
- Mọi file/hồ sơ phải có bản lưu off-chain hoặc IPFS tương ứng.
- Hash tài liệu phải tính từ file chuẩn hóa.

---

## 13. Yêu cầu tích hợp với backend

## 13.1. Cơ chế gọi contract
- Backend là thành phần duy nhất gọi hàm ghi on-chain trong MVP.
- Người dùng cuối không ký giao dịch trực tiếp on-chain trong MVP.
- Backend dùng **service wallet** được cấp role phù hợp.

## 13.2. Cơ chế đồng bộ
Sau khi contract thực thi thành công, backend phải:
1. lưu `txHash`
2. lưu `blockNumber` nếu cần
3. cập nhật trạng thái hồ sơ off-chain
4. tạo audit trail
5. cập nhật dashboard/indexer

## 13.3. Xử lý lỗi
- Nếu giao dịch on-chain thất bại, hồ sơ off-chain không được nhảy sang trạng thái hoàn tất.
- Phải lưu lỗi kỹ thuật và cho phép retry có kiểm soát.
- Retry phải idempotent theo `registrationCode` hoặc `transferCode`.

---

## 14. Yêu cầu test bắt buộc

## 14.1. Unit test contract
Phải có các nhóm test:
- deploy thành công
- role assignment đúng
- `registerLand` thành công
- `registerLand` bị chặn khi caller sai role
- `registerLand` bị chặn khi trùng `registrationCode`
- `recordTransfer` thành công
- `recordTransfer` bị chặn khi caller sai role
- `recordTransfer` bị chặn khi token không tồn tại
- `pause` chặn các hàm ghi
- event emit đúng dữ liệu trọng yếu

## 14.2. Integration test
- backend gọi `registerLand` → tx thành công → DB cập nhật đúng
- backend gọi `recordTransfer` → tx thành công → DB cập nhật lịch sử đúng
- failure path không làm lệch trạng thái off-chain

## 14.3. Security test
- role escalation
- duplicate submission
- paused state bypass
- malformed CID/hash input
- replay-like behavior với `registrationCode` / `transferCode`

---

## 15. Yêu cầu audit bảo mật

AI_03 hoặc quy trình audit phải kiểm tra tối thiểu:
- access control
- duplicate mint / duplicate transfer recording
- event completeness
- unsafe external calls (nếu có)
- pausable behavior
- storage integrity
- upgradeability decision (nếu dùng)
- gas hotspots chính

---

## 16. Quyết định kiến trúc cần chốt sớm

### 16.1. Upgradeable hay non-upgradeable?
**Khuyến nghị MVP:** non-upgradeable để giảm độ phức tạp audit.

### 16.2. ERC721Enumerable có dùng không?
**Khuyến nghị MVP:** không bắt buộc; index bằng event + backend DB để tiết kiệm gas.

### 16.3. Metadata URI có công khai toàn bộ không?
**Khuyến nghị MVP:** metadata chỉ chứa thông tin tối giản, không chứa PII.

### 16.4. Service wallet hay multi-sig?
**Khuyến nghị MVP:** service wallet + tách quyền rõ; phase sau có thể nâng lên multi-sig.

---

## 17. Non-goals của MVP
- Không xây dựng marketplace NFT.
- Không cho phép public transfer như tài sản số phổ thông.
- Không tích hợp thanh toán on-chain.
- Không thay thế cơ sở dữ liệu đất đai chính thức.
- Không triển khai zero-knowledge proof trong MVP.

---

## 18. Định nghĩa hoàn thành (Definition of Done) cho smart contract
Một contract/feature được coi là hoàn thành khi:
- code Solidity đã được review;
- bám đúng tài liệu này;
- có unit test cho happy path và failure path chính;
- event đã đủ để backend index và audit;
- không lưu PII on-chain;
- có script deploy local/testnet;
- có tài liệu mapping API ↔ contract;
- đã qua audit nội bộ mức MVP.

---

## 19. Danh sách file code đề xuất

```text
contracts/
  UrbanLandRegistry.sol
  interfaces/
    IUrbanLandRegistry.sol
  libraries/
    RegistryErrors.sol
  scripts/
    deploy.ts
    grant-roles.ts
  test/
    UrbanLandRegistry.register.spec.ts
    UrbanLandRegistry.transfer.spec.ts
    UrbanLandRegistry.roles.spec.ts
    UrbanLandRegistry.pause.spec.ts
```

---

## 20. Checklist trước khi AI/Codex bắt đầu code
- [ ] Đã chốt ERC-721 hay mô hình record khác
- [ ] Đã chốt enum trạng thái on-chain
- [ ] Đã chốt role model
- [ ] Đã chốt fields on-chain tối thiểu
- [ ] Đã chốt quy tắc không lưu PII
- [ ] Đã chốt event list
- [ ] Đã chốt mapping API ↔ contract
- [ ] Đã chốt integration strategy với backend wallet
- [ ] Đã có unit test template
- [ ] Đã có audit checklist

---

## 21. Gợi ý prompt cho skill `write-smart-contract`

```text
Mục tiêu: triển khai UrbanLandRegistry.sol theo 06-smart-contract-spec.md.
Bắt buộc:
- dùng OpenZeppelin ERC721 + AccessControl + Pausable
- không lưu PII on-chain
- implement registerLand, recordTransfer, getLandRecord, pause/unpause
- emit đầy đủ event theo spec
- tạo test cho happy path và failure path
- nếu thấy mâu thuẫn với API contract hoặc workflow thì dừng và ghi rõ assumption
```
