# Application Data Schema

This document defines the schema for data stored in Google Drive as JSON files within the `.system/json` directory. This is used to maintain consistency across different development environments.

## Storage Overview

- **Location**: Google Drive `Shared Folder` > `.system` > `json`
- **Format**: JSON (`.json`)
- **Naming Convention**: `{TableName}_{ISO_Timestamp}.json` (e.g., `회원관리_2026-02-07T09-03-41-012Z.json`)
- **Data Model**: Each file contains an array of objects representing rows in the table. The application typically reads all logs for a table and merges them (picking the latest version by ID) to get the current state.

---

## Tables

### 1. 회원관리 (Member Management)
Manages user accounts and permissions.

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Unique identifier (primary key) | `1` |
| `person_id` | String | User login ID | `"admin"` |
| `name` | String | User's full name | `"최고관리자"` |
| `password` | String | User password (currently plain text) | `"admin123!"` |
| `position` | String | Job title or role | `"관리자"` |

### 2. 프로젝트관리 (Project Management)
Manages project details for technical diagnosis business.

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | String | Unique UUID | `"proj-uuid-123"` |
| `title` | String | Project Title | `"2026 하반기 기술진단 사업"` |
| `startDate` | String | Project Start Date | `"2026-03-01"` |
| `endDate` | String | Project End Date | `"2026-12-31"` |
| `content` | String | Main Content (HTML) | `"<p>본 프로젝트는...</p>"` |
| `author` | String | Creator Name | `"홍길동 과장"` |
| `authorId` | String | Creator ID | `"hgd123"` |
| `createdAt` | String | ISO Timestamp | `"2026-02-07T12:00:00Z"` |

### 3. 공정관리 (Process Management)
Manages sub-processes within a project.

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | String | Unique UUID | `"proc-uuid-789"` |
| `projectId` | String | ID of the parent project | `"proj-uuid-123"` |
| `title` | String | Process Title | `"기초 기초 측량"` |
| `startDate` | String | Process Start Date | `"2026-03-05"` |
| `endDate` | String | Process End Date | `"2026-03-20"` |
| `isCompleted` | Boolean | Whether the process is finished | `false` |
| `author` | String | Creator Name | `"홍길동 과장"` |
| `authorId` | String | Creator ID | `"hgd123"` |
| `createdAt` | String | ISO Timestamp | `"2026-02-07T12:30:00Z"` |

### 4. 할일관리 (Task Management)
Manages daily tasks with visibility controls.

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | String | Unique UUID | `"task-uuid-123"` |
| `date` | String | Task date (YYYY-MM-DD) | `"2026-02-07"` |
| `content` | String | Task content | `"회의 자료 준비"` |
| `isPublic` | Boolean | Visibility (true=all, false=author only) | `true` |
| `author` | String | Creator Name | `"홍길동 과장"` |
| `authorId` | String | Creator ID | `"hgd123"` |
| `createdAt` | String | ISO Timestamp | `"2026-02-07T13:30:00Z"` |

### 5. 전체게시판 (Overall Board)
Manages general posts and **replies (답글)**.

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | String | Unique UUID | `"550e8400-e29b..."` |
| `name` | String | Author name | `"홍길동"` |
| `monthdate` | String | Creation time (`YYYYMMDDHHmmss`) | `"20260207181500"` |
| `memo` | String | Main content | `"게시글 내용입니다..."` |
| `resoucefiles` | Array | List of attachment objects | `[{id: "...", name: "..."}]` |
| `parent_id` | String/Null | ID of the original post if this is a **reply** (visible in list view) | `"parent-uuid-123"` |

### 6. 게시판댓글 (Board Comments)
Separate table for **comments (댓글)**, visible only in the content view. This keeps the list view loading efficient.

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | String | Unique UUID | `"comment-uuid-456"` |
| `post_id` | String | ID of the post/reply this comment belongs to | `"550e8400-e29b..."` |
| `author` | String | Commenter name | `"김철수"` |
| `content` | String | Comment text | `"좋은 글이네요!"` |
| `created_at` | String | Creation time (`YYYYMMDDHHmmss`) | `"20260207182000"` |

---

## Implementation Details

- **Consistency**: All IDs should be unique. For tables with high frequency updates, `crypto.randomUUID()` is recommended for the `id`.
- **Timestamps**: All dates should be stored in ISO 8601 format (`YYYY-MM-DDTHH:mm:SS.sssZ`).
- **Attachments**: Related files are stored in `.system/resources` (or `resouces` for compatibility).
