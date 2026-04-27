# build-ipfs-storage-flow

## Purpose
Xay dung luong tai file, luu IPFS, luu CID/hash vao he thong nghiep vu.

## Inputs
- backlog ID
- relevant docs in /docs
- target files to modify

## Required reading
- docs/02-working-rules.md
- docs/08-definition-of-done.md

## Workflow
1. Tao file upload pipeline\n2. Goi IPFS client\n3. Luu metadata\n4. Validate file type/size

## Output
- Upload handlers\n- IPFS service\n- Metadata model\n- Tests

## Hard rules
- Khong luu file scan on-chain\n- Luon luu CID/hash va mapping ho so
