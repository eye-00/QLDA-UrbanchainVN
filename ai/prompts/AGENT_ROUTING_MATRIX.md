# AGENT_ROUTING_MATRIX.md

# Ma trận điều phối 15 agent

| Loại công việc | Agent chính | Agent review/phối hợp |
|---|---|---|
| Kiến trúc tổng thể | AI_01_System_Architect | AI_07, AI_08, AI_04, AI_14 |
| Quy trình nghiệp vụ | AI_02_Business_Process_Analyst | AI_03, AI_10, AI_15 |
| Product backlog/sprint | AI_03_Product_Backlog_Manager | AI_02, AI_01, AI_12 |
| Smart contract | AI_04_Smart_Contract_Developer | AI_05, AI_13, AI_07 |
| Audit smart contract | AI_05_Smart_Contract_Auditor | AI_04, AI_13 |
| IPFS/document storage | AI_06_IPFS_Document_Storage_Engineer | AI_07, AI_08, AI_13 |
| Backend API | AI_07_Backend_API_Developer | AI_08, AI_11, AI_13, AI_12 |
| Database | AI_08_Database_Engineer | AI_07, AI_01, AI_12 |
| Frontend | AI_09_Frontend_Developer | AI_10, AI_07, AI_12 |
| UI/UX | AI_10_UI_UX_Designer | AI_02, AI_09 |
| Auth/RBAC/eKYC | AI_11_Auth_RBAC_eKYC_Engineer | AI_07, AI_13, AI_09 |
| QA/Test | AI_12_QA_Test_Automation_Engineer | Tất cả agent liên quan |
| Security/Privacy | AI_13_Security_Privacy_Engineer | AI_05, AI_07, AI_11, AI_06 |
| DevOps/Repo | AI_14_DevOps_Repo_Automation_Engineer | AI_01, AI_07, AI_09, AI_04 |
| Documentation | AI_15_Documentation_Report_Agent | Tất cả agent |

# Luồng review bắt buộc

1. Smart contract:
AI_04 -> AI_05 -> AI_13 -> AI_07

2. Backend API:
AI_07 -> AI_08 -> AI_11 -> AI_13 -> AI_12

3. Frontend flow:
AI_10 -> AI_09 -> AI_12

4. Nghiệp vụ/backlog:
AI_02 -> AI_03 -> AI_01 -> AI_15

5. Demo cuối:
AI_14 -> AI_12 -> AI_15 -> Orchestrator
