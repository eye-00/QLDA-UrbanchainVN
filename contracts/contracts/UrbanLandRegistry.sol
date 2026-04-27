// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract UrbanLandRegistry is ERC721, AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant TRANSFER_AGENT_ROLE = keccak256("TRANSFER_AGENT_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    enum LandStatus {
        NONE,
        ISSUED,
        ACTIVE,
        TRANSFERRED,
        LOCKED,
        CANCELLED_REF
    }

    struct LandRecord {
        uint256 tokenId;
        string landCode;
        bytes32 parcelRef;
        bytes32 ownerRef;
        string documentCid;
        bytes32 documentHash;
        string metadataUri;
        LandStatus landStatus;
        uint64 issuedAt;
        uint64 lastUpdatedAt;
        bool active;
    }

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

    uint256 private _nextTokenId = 1;
    mapping(uint256 => LandRecord) private _landRecords;
    mapping(string => uint256) public tokenIdByRegistrationCode;
    mapping(string => bool) public usedTransferCode;
    mapping(uint256 => TransferRecord[]) private _transferHistory;

    event LandRegistered(
        string indexed registrationCode,
        uint256 indexed tokenId,
        string landCode,
        bytes32 ownerRef,
        string documentCid,
        bytes32 documentHash
    );

    event LandTransferred(
        string indexed transferCode,
        uint256 indexed tokenId,
        bytes32 fromOwnerRef,
        bytes32 toOwnerRef,
        string supportingCid,
        bytes32 supportingHash
    );

    event LandStatusUpdated(uint256 indexed tokenId, LandStatus oldStatus, LandStatus newStatus);
    event MetadataUpdated(uint256 indexed tokenId, string documentCid, bytes32 documentHash, string metadataUri);

    constructor(address admin_) ERC721("UrbanChainLand", "UCLAND") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(ADMIN_ROLE, admin_);
        _grantRole(REGISTRAR_ROLE, admin_);
        _grantRole(TRANSFER_AGENT_ROLE, admin_);
        _grantRole(PAUSER_ROLE, admin_);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function registerLand(
        string calldata registrationCode,
        string calldata landCode,
        bytes32 parcelRef,
        bytes32 ownerRef,
        string calldata documentCid,
        bytes32 documentHash,
        string calldata metadataUri,
        LandStatus status,
        address tokenOwner
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused returns (uint256 tokenId) {
        require(bytes(registrationCode).length > 0, "registrationCode required");
        require(bytes(landCode).length > 0, "landCode required");
        require(tokenIdByRegistrationCode[registrationCode] == 0, "registration already used");
        require(tokenOwner != address(0), "tokenOwner required");

        tokenId = _nextTokenId++;
        _safeMint(tokenOwner, tokenId);

        _landRecords[tokenId] = LandRecord({
            tokenId: tokenId,
            landCode: landCode,
            parcelRef: parcelRef,
            ownerRef: ownerRef,
            documentCid: documentCid,
            documentHash: documentHash,
            metadataUri: metadataUri,
            landStatus: status,
            issuedAt: uint64(block.timestamp),
            lastUpdatedAt: uint64(block.timestamp),
            active: true
        });

        tokenIdByRegistrationCode[registrationCode] = tokenId;
        emit LandRegistered(registrationCode, tokenId, landCode, ownerRef, documentCid, documentHash);
    }

    function recordTransfer(
        string calldata transferCode,
        uint256 tokenId,
        bytes32 fromOwnerRef,
        bytes32 toOwnerRef,
        string calldata supportingCid,
        bytes32 supportingHash,
        address newTokenOwner
    ) external onlyRole(TRANSFER_AGENT_ROLE) whenNotPaused {
        require(_ownerOf(tokenId) != address(0), "token does not exist");
        require(!usedTransferCode[transferCode], "transfer code used");
        require(newTokenOwner != address(0), "new owner required");

        address currentOwner = ownerOf(tokenId);
        _transfer(currentOwner, newTokenOwner, tokenId);
        usedTransferCode[transferCode] = true;

        _transferHistory[tokenId].push(TransferRecord({
            transferCode: transferCode,
            tokenId: tokenId,
            fromOwnerRef: fromOwnerRef,
            toOwnerRef: toOwnerRef,
            supportingCid: supportingCid,
            supportingHash: supportingHash,
            approvedAt: uint64(block.timestamp),
            executedBy: msg.sender
        }));

        LandStatus oldStatus = _landRecords[tokenId].landStatus;
        _landRecords[tokenId].ownerRef = toOwnerRef;
        _landRecords[tokenId].documentCid = supportingCid;
        _landRecords[tokenId].documentHash = supportingHash;
        _landRecords[tokenId].landStatus = LandStatus.TRANSFERRED;
        _landRecords[tokenId].lastUpdatedAt = uint64(block.timestamp);

        emit LandTransferred(transferCode, tokenId, fromOwnerRef, toOwnerRef, supportingCid, supportingHash);
        emit LandStatusUpdated(tokenId, oldStatus, LandStatus.TRANSFERRED);
    }

    function updateLandMetadata(
        uint256 tokenId,
        string calldata documentCid,
        bytes32 documentHash,
        string calldata metadataUri
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        require(_ownerOf(tokenId) != address(0), "token does not exist");
        _landRecords[tokenId].documentCid = documentCid;
        _landRecords[tokenId].documentHash = documentHash;
        _landRecords[tokenId].metadataUri = metadataUri;
        _landRecords[tokenId].lastUpdatedAt = uint64(block.timestamp);
        emit MetadataUpdated(tokenId, documentCid, documentHash, metadataUri);
    }

    function updateLandStatus(uint256 tokenId, LandStatus newStatus) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        require(_ownerOf(tokenId) != address(0), "token does not exist");
        LandStatus oldStatus = _landRecords[tokenId].landStatus;
        _landRecords[tokenId].landStatus = newStatus;
        _landRecords[tokenId].lastUpdatedAt = uint64(block.timestamp);
        emit LandStatusUpdated(tokenId, oldStatus, newStatus);
    }

    function getLandRecord(uint256 tokenId) external view returns (LandRecord memory) {
        require(_ownerOf(tokenId) != address(0), "token does not exist");
        return _landRecords[tokenId];
    }

    function getTransferHistory(uint256 tokenId) external view returns (TransferRecord[] memory) {
        require(_ownerOf(tokenId) != address(0), "token does not exist");
        return _transferHistory[tokenId];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
