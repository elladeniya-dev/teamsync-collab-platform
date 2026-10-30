# TeamSync — Comprehensive Feature Roadmap, Architecture & System Specifications

A complete, production-grade feature catalog, architectural specification, and implementation audit for **TeamSync** — an enterprise-grade Agile collaboration and high-velocity sprint delivery platform.

---

## Status Legend
- [x] **Completed** — Production-ready, verified with end-to-end integration tests and active in cloud deployment.
- [/] **In Progress** — Under active implementation or schema evolution.
- [ ] **Planned** — Backlog item scoped for future architecture phases.

---

## System Architecture Overview

```mermaid
flowchart TD
    Client["React 19 Frontend (Vite + Tailwind CSS)"] -->|WebSocket Bi-directional Sync| SocketServer["Socket.io Gateway (Node.js)"]
    Client -->|Bearer JWT / Google OAuth 2.0| Gateway["Express API Gateway"]
    Gateway -->|RBAC Guard (Owner/Admin/Member/Guest)| AuthGuard["Authorization Middleware"]
    AuthGuard -->|Immutable Audit Logger| AuditEngine["Audit Log Engine (Mongoose Hooks)"]
    AuthGuard -->|Controllers & Services| BusinessLogic["Domain Services (Tasks, Team, Workspace, Sprints)"]
    BusinessLogic --> MongoCluster[("MongoDB Atlas Cloud (Replica Sets)")]
    GitHub["GitHub Actions / PR Events"] -->|HMAC-SHA256 Webhook| WebhookReceiver["Webhook Ingestion Engine"]
    WebhookReceiver -->|Idempotency Verification| IdempotencyEngine["WebhookDelivery GUID Deduplicator"]
    IdempotencyEngine -->|Auto-transition Deliverables to Done| BusinessLogic
    BusinessLogic -->|Live Event Broadcasts| SocketServer
    SocketServer -->|Real-Time UI Reconciliations| Client
```

---

## High-Impact Enterprise Upgrades (Recruiter & Portfolio Showcase)

TeamSync incorporates distributed system design patterns, enterprise access control, and cryptographic automation:

### 1. Real-Time Bidirectional Synchronization (`Socket.io` WebSockets)
- **Status:** [x] Completed
- **Architecture:** Persistent WebSocket gateway attached to the Node.js HTTP server ([backend/socket/socketManager.js](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/backend/socket/socketManager.js)) with client listeners in [SocketContext.jsx](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/frontend/src/context/SocketContext.jsx).
- **Mutations Broadcasted in Real-Time:**
  - `task:created`, `task:updated`, `task:deleted` (Deliverable state transitions)
  - `team:created`, `team:updated`, `team:deleted` (Member status and role assignments)
  - `notification:new` (Global notifications and deadline alerts)
  - `audit:created` (Live compliance stream on the audit dashboard)
  - `webhook:delivery` (External tool event log dispatch)
  - `workspace:updated` (Sprint advancements and workspace settings)
- **Live Presence Indicators:** Header displays active online collaborator avatars and real-time `Live Sync` connection indicator with instant auto-reconnect.
- **Zero-Refresh UI:** Multiple users see board moves, status toggles, and role promotions instantly without browser refreshes.

---

### 2. Enterprise Role-Based Access Control (RBAC) & Dynamic Admin Assignment
- **Status:** [x] Completed
- **Dual-Dimension Role Hierarchy:**
  - **Job Title / Function:** `Project Lead`, `Frontend Developer`, `Backend Developer`, `Fullstack Engineer`, `UI/UX Designer`, `DevOps Engineer`, `QA Specialist`, `Product Manager`.
  - **RBAC Security Level:** `Owner` (40) > `Admin` (30) > `Member` (20) > `Guest` (10).
- **Interactive Governance in Team Directory (`/team`):**
  - **Role Assignment Dropdown:** Owners and Admins can promote/demote collaborators (`Admin`, `Member`, `Guest`) or transfer Workspace `Owner` authority directly from member cards.
  - **Action Confirmation Dialogs:** SweetAlert2 modals display exact permissions and security implications prior to execution.
  - **Ownership Protection Guards:** Strict route and database logic preventing non-owners from modifying owner accounts or escalating privileges.
  - **Bi-Directional Database Sync:** Modifying `TeamMember.accessRole` automatically updates `User.role` in MongoDB Atlas and reconciles local session storage (`teamsync_user`).
  - **Real-Time `ROLE_CHANGE` Audit Logs:** Captures actor, target user, target email, previous role, and new role with IP and user-agent metadata.
  - **Workspace Security & Permissions Matrix Modal:** Interactive modal comparing privileges across 4 functional domains (Deliverables, Sprints/Workspaces, Team Directory, DevOps & Webhooks).

---

### 3. Immutable Security Audit Logging
- **Status:** [x] Completed
- **Evidentiary Integrity:** Append-only Mongoose schema ([backend/models/AuditLog.js](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/backend/models/AuditLog.js)) with database-level hooks rejecting `updateOne`, `updateMany`, `deleteOne`, and `deleteMany` mutations.
- **Automated Security Breach Logging:** Route-level RBAC middleware ([backend/middlewares/rbacMiddleware.js](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/backend/middlewares/rbacMiddleware.js)) intercepts unauthorized attempts and records `SECURITY_UNAUTHORIZED_ACCESS` with status `DENIED`.
- **Live Compliance Console (`/audit-logs`):** Glassmorphic table with WebSocket live stream, inspect modal for raw payloads, KPI counters, and role-based access restrictions.

---

### 4. Cryptographic Webhooks & Idempotent Automation Engine (GitHub & Slack)
- **Status:** [x] Completed
- **HMAC-SHA256 Signature Verification:** Evaluates inbound payloads against `X-Hub-Signature-256` using constant-time buffer comparison (`crypto.timingSafeEqual`) to prevent timing attacks.
- **Idempotency Engine (`WebhookDelivery.js`):** Deduplicates webhook deliveries by `X-GitHub-Delivery` GUID. Replayed deliveries return `200 OK (Idempotent)` without re-executing state transitions or duplicate side effects.
- **Automated GitHub PR Merge-to-Done:** Inbound `pull_request.closed` (merged) events match deliverables by task ID or title and automatically transition them to `Done`, linking PR numbers and recording an immutable audit log.
- **Outbound Slack Dispatcher:** Posts formatted automation alerts to Slack channels upon deliverable completion.
- **Developer Webhook Simulator (`/webhooks`):** Interactive console with test payload generator, payload inspector, live deliveries stream, and replay prevention verification toggle.

---

### 5. Sprint Lifecycle & Accidental Deletion Protection Engine
- **Status:** [x] Completed
- **Backend Cycle Management:** Endpoint `DELETE /api/workspaces/:id/sprints/:sprintName` with active sprint locks, task unlinking/scoping, and real-time Socket.io broadcast.
- **Frontend Safe Mode vs. Manage Mode Toggle:**
  - **Safe Mode (Default):** Streamlined sprint navigation dropdown with zero accidental deletion triggers.
  - **Manage Mode:** Explicit user toggle revealing red trash/remove buttons for inactive sprints while keeping the active sprint locked with a protective shield.
  - **Destructive Action Guards:** SweetAlert2 confirmation dialog warns before removing any sprint cycle.

---

### 6. Multi-View Calendar & Scheduling Engine
- **Status:** [x] Completed
- **Tri-View Architecture:**
  - **Month Grid:** Classic monthly view mapping deliverables dynamically from MongoDB onto deadline dates.
  - **Week Column Matrix:** Day-by-day column schedule with multi-line layout decoupling time badges and assignee avatars to eliminate horizontal overflow.
  - **Schedule / Agenda Timeline:** Sequential chronological milestone list with delivery urgency tags.
- **Sticky Control Ribbon:** Compact sticky header with inline period navigation, month/week jumps, and micro-KPI counters (Deliverables and Completion %).
- **Selected Date Sidebar:** Contextual panel displaying deliverables for the selected day, milestone countdown, and "+ Quick Add Deliverable" action.

---

### 7. Dual-Dimension Collaborator & User Synchronization Engine
- **Status:** [x] Completed
- **Automatic Reconciliation:** `syncUsersWithTeamMembers()` in [backend/services/teamService.js](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/backend/services/teamService.js) automatically reconciles registered `User` accounts into `TeamMember` records with exponential backoff network retry resiliency.
- **Zero-Downtime Session Updates:** Local storage and application contexts stay synchronized in real time when roles or profile details change.

---

### 8. Full Architectural Verification Suite
- **Status:** [x] Completed
- **Automated Test Suite (`test_system_suite.mjs`):** 13 comprehensive end-to-end integration tests executed directly against the live backend:
  1. Server Health & Connectivity Check
  2. Tasks API & Data Retrieval
  3. Task Metadata Verification (Status & Priority fields)
  4. Webhook Security: Tampered HMAC signature rejection (401 Unauthorized)
  5. Webhook Security: Missing signature header rejection (401 Unauthorized)
  6. Webhook Security: Authentic Ping payload acceptance (200 OK)
  7. Webhook Automation: PR #142 automatically transitions deliverable to Done
  8. Deliverable State Verification (Status updated to Done)
  9. Deliverable Metadata Verification (Linked to PR #142)
  10. Idempotency Engine: Duplicate delivery GUID detection and replay suppression
  11. RBAC Middleware: Route-gating unauthenticated access to `/api/audit-logs`
  12. RBAC Middleware: Route-gating unauthenticated access to `/api/webhooks/deliveries`
  13. Database Integrity & Model Consistency Check

---

### 9. Zero-Emoji Enterprise UI/UX Standard
- **Status:** [x] Completed
- **Vector SVG Icon System:** Zero emoji characters in JSX templates or user interfaces; replaced 100% by custom scalable vector SVGs in [frontend/src/components/common/Icons.jsx](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/frontend/src/components/common/Icons.jsx).
- **Consistent Design Language:** Tailwind CSS with custom glassmorphism, responsive navigation drawers, and accessible color-coded badges.

---

## Live Cloud-Connected Features vs. Roadmap

### 100% Live & Cloud-Connected Capabilities
- **MongoDB Atlas Cloud Database:** Multi-region replica set connection with indexes on deliverables, workspaces, users, audit logs, and webhooks.
- **Google OAuth 2.0 & Unified Account Linking:** ID-token backend verification using `google-auth-library`, `bcryptjs` password hashing, JWT session headers, and automatic account linking for matching emails.
- **Dynamic Multi-Workspace & Sprint Management:** Switch between workspaces, advance sprint cycles, manage custom sprints with accidental deletion protection.
- **Team Directory with RBAC Governance:** Interactive role promotion/demotion, real-time presence, workload counters, and permissions matrix.
- **Deliverables Management (List & Kanban):** Full CRUD with drag-and-drop board, subtask checklists, discussion comments, priority indicators, and relative deadline countdowns.
- **Multi-View Calendar & Scheduling:** Month, Week, and Schedule views with date sidebar and quick task scheduling.
- **Workspace Notification Center:** Global notification system with unread badge counter, proactive 24-hour deadline alarms, and filterable menu.
- **Compliance Audit Console:** Real-time stream of audit logs with KPI stats, payload modals, and immutable Mongoose persistence.
- **Automated Webhook Pipeline:** Cryptographic HMAC SHA-256 receiver, idempotency replay prevention, and developer test console.

### Roadmap Upgrades (Future Phases)
1. **Redis Caching & Sliding-Window Rate Limiting:** Cache high-frequency dashboard KPI aggregates and implement sliding-window rate limiters.
2. **Automated Deadline Engine (BullMQ + Redis):** Replace polling with distributed background worker queues for email and Slack digests.
3. **AI Sprint & Task Standup Generator:** One-click standup summaries and blocker analysis leveraging the Google Gemini API.
4. **Production DevOps & OpenAPI:** Distroless Docker containers, GitHub Actions CI workflow, and Swagger OpenAPI documentation.

---

## Detailed Implementation Breakdown

### Phase 1: Core Deliverables & Task Workflows

#### Feature 1.1: Extended Task Metadata (Status, Priority & Taxonomy)
- **Status:** [x] Completed
- **Backend Implementation:**
  - [x] Schema fields in [backend/models/Task.js](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/backend/models/Task.js):
    - `status`: `['To Do', 'In Progress', 'Under Review', 'Done']` (default: `'To Do'`)
    - `priority`: `['Low', 'Medium', 'High', 'Urgent']` (default: `'Medium'`)
    - `type`: `['Deadline', 'Meeting', 'Review']` (default: `'Deadline'`)
    - `workspaceId`: Scoped to active workspace
    - `sprintId`: Scoped to active sprint cycle
  - [x] Filtering, searching, and sorting in [backend/controllers/taskController.js](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/backend/controllers/taskController.js).
- **Frontend Implementation:**
  - [x] Status, Priority, and Type selectors in [TaskDetailModal.jsx](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/frontend/src/components/tasks/TaskDetailModal.jsx).
  - [x] Color-coded badges for Priority (`Urgent` = Red, `High` = Orange, `Medium` = Blue, `Low` = Slate).
  - [x] Dynamic dashboard KPI cards reflecting status and urgency.

#### Feature 1.2: Dynamic Team Assignee Linking
- **Status:** [x] Completed
- **Backend & Frontend Implementation:**
  - [x] Dynamic Assignee `<select>` populated from `/api/team`.
  - [x] Dual-format handling supporting both object (`member.name`) and string representations.
  - [x] Resolved assignee dropdown bug to prevent default fallback corruptions.
  - [x] Assignee initials avatar and workload badge displayed on cards.

#### Feature 1.3: Interactive Kanban Board
- **Status:** [x] Completed
- **Frontend Implementation:**
  - [x] Dedicated [KanbanBoard.jsx](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/frontend/src/components/tasks/KanbanBoard.jsx) with workflow columns: `To Do`, `In Progress`, `Under Review`, `Done`.
  - [x] View switcher on Tasks page: **List View** ⇄ **Kanban Board** with `localStorage` view persistence.
  - [x] Optimistic drag-and-drop state updates with instant backend synchronization (`PUT /api/tasks/:id`).

#### Feature 1.4: Subtasks & Progress Checklist
- **Status:** [x] Completed
- **Backend & Frontend Implementation:**
  - [x] Embedded `subtasks` schema in `Task.js`:
    ```js
    subtasks: [{ title: String, completed: { type: Boolean, default: false }, completedAt: Date }]
    ```
  - [x] Endpoints: `POST /api/tasks/:id/subtasks`, `PATCH /api/tasks/:id/subtasks/:subtaskId`, `DELETE /api/tasks/:id/subtasks/:subtaskId`.
  - [x] Checklist UI inside `TaskDetailModal.jsx` with real-time completion progress bar.

#### Feature 1.5: Search, Filtering & Relative Deadlines
- **Status:** [x] Completed
- **Frontend Implementation:**
  - [x] Real-time search matching title, description, and assignee.
  - [x] Taxonomy filter pills (`All`, `Review`, `Meeting`, `Deadline`) and priority dropdown.
  - [x] Dynamic deadline badges (`Due today`, `Overdue by Xd`, `Due tomorrow`, `Due in X days`).

---

### Phase 2: Real-Time Collaboration & Communication

#### Feature 2.1: Real-Time Synchronization (`Socket.io`)
- **Status:** [x] Completed
- **Architecture:** Node.js WebSocket gateway broadcasting state mutations across connected browser tabs.
- **Frontend State Integration:** Auto-reconciles state in `Tasks.jsx`, `Dashboard.jsx`, `Team.jsx`, and `NotificationContext.jsx`.

#### Feature 2.2: Task Discussion Feed & Activity Log
- **Status:** [x] Completed
- **Backend & Frontend Implementation:**
  - [x] Embedded discussion feed in `Task.js` (`author`, `text`, `createdAt`).
  - [x] Endpoint `POST /api/tasks/:id/comments` with WebSocket broadcasting and assignee notifications.
  - [x] Activity trail tracking status changes, subtask toggles, and PR merges.

#### Feature 2.3: Workspace Notification Center
- **Status:** [x] Completed
- **Backend & Frontend Implementation:**
  - [x] Mongoose `Notification` model with priority, type, read status, and navigation links.
  - [x] Automated system notifications triggered on deliverable mutations, member invitations, and sprint switches.
  - [x] Proactive deadline scanner alerting users 24 hours prior to milestone due dates.
  - [x] Interactive flyout popover in Header with unread counter, "Mark all read", and "Clear all".

#### Feature 2.4: Team Messaging & Chat Room
- **Status:** [ ] Planned
- **Scope:** Dedicated `/chat` page with project channels, threaded discussions, and Socket.io messaging.

---

### Phase 3: Visual Schedules & Calendar

#### Feature 3.1: Multi-View Calendar Engine
- **Status:** [x] Completed
- **Views Implemented:**
  - [x] **Month Grid View:** Displays deliverables across standard monthly calendar days.
  - [x] **Week Column View:** Day-by-day column matrix with decoupled time and assignee layout.
  - [x] **Schedule / Agenda View:** Chronological milestone stream with type indicators.
- **Controls & Navigation:**
  - [x] Sticky control header with today jump, previous/next buttons, and micro-KPIs.
  - [x] Interactive Selected Date sidebar with "+ Quick Add Deliverable".
  - [x] Click deliverable pill to open `TaskDetailModal.jsx`.

#### Feature 3.2: Drag-and-Drop Rescheduling
- **Status:** [ ] Planned
- **Scope:** Drag deliverable pills across calendar date cells to update deadline timestamps.

---

### Phase 4: Authentication, Workspaces & Governance

#### Feature 4.1: Authentication & Google Identity Services
- **Status:** [x] Completed
- **Backend & Frontend Implementation:**
  - [x] Google OAuth 2.0 verification using `google-auth-library`.
  - [x] Unified account linking merging manual email accounts with Google sign-in.
  - [x] Password hashing using `bcryptjs` and session tokens using `jsonwebtoken`.
  - [x] Interactive 3D flip card login/register interface.
  - [x] `ProtectedRoute` component guarding private routes.

#### Feature 4.2: Workspaces & Sprint Management
- **Status:** [x] Completed
- **Backend & Frontend Implementation:**
  - [x] `Workspace` model with support for custom sprint arrays.
  - [x] Workspace switcher flyout in Sidebar with active indicator.
  - [x] Sprint cycle deletion endpoint with active sprint protection guards.
  - [x] Sidebar Safe Mode vs. Manage Mode toggle with SweetAlert confirmation.

#### Feature 4.3: Enterprise Role-Based Access Control (RBAC)
- **Status:** [x] Completed
- **Hierarchy:** `Owner` (40) > `Admin` (30) > `Member` (20) > `Guest` (10).
- **Route Protection:** Custom Express middleware enforcing role minimums and logging security violations.
- **Interactive UI Governance:** Role assignment dropdown on `/team`, SweetAlert2 confirmation dialogs, and Permissions Matrix Modal.

---

### Phase 5: Webhooks & External Toolchain

#### Feature 5.1: Cryptographic Inbound GitHub Webhooks
- **Status:** [x] Completed
- **Security & Automation:**
  - [x] HMAC-SHA256 signature verification using timing-safe buffer comparison.
  - [x] Idempotent request deduplication via `WebhookDelivery` model.
  - [x] Auto-transition deliverable to `Done` upon PR merge.
  - [x] Outbound Slack webhook dispatcher for deliverable milestone alerts.
  - [x] Interactive developer simulator console at `/webhooks`.

---

### Phase 6: Performance, Caching & Scalability

#### Feature 6.1: Redis Caching & Rate Limiting
- **Status:** [ ] Planned
- **Architecture:**
  - [ ] Connect `ioredis` client with graceful offline fallback.
  - [ ] Cache dashboard aggregation queries (`GET /api/dashboard/stats`).
  - [ ] Sliding-window rate limiting middleware for sensitive endpoints.

#### Feature 6.2: Automated Distributed Deadline Worker (BullMQ)
- **Status:** [ ] Planned
- **Architecture:** Redis-backed worker queues processing automated reminder jobs with exponential backoff.

#### Feature 6.3: AI Sprint & Standup Digest (Gemini API)
- **Status:** [ ] Planned
- **Architecture:**
  - [ ] Endpoint `POST /api/ai/sprint-summary` aggregating sprint metrics.
  - [ ] Executive standup generation for Slack and Teams.

---

## Complete API Route Catalog

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new email/password account |
| `POST` | `/api/auth/login` | Public | Authenticate with email and password |
| `POST` | `/api/auth/google` | Public | Authenticate via Google OAuth 2.0 ID token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user profile |
| `GET` | `/api/tasks` | Member+ | Retrieve deliverables for active workspace |
| `POST` | `/api/tasks` | Member+ | Create new deliverable |
| `GET` | `/api/tasks/:id` | Member+ | Retrieve deliverable details |
| `PUT` | `/api/tasks/:id` | Member+ | Update deliverable (status, priority, assignee) |
| `DELETE` | `/api/tasks/:id` | Admin+ | Delete deliverable |
| `POST` | `/api/tasks/:id/comments` | Member+ | Add comment to deliverable |
| `POST` | `/api/tasks/:id/subtasks` | Member+ | Add subtask checklist item |
| `PATCH` | `/api/tasks/:id/subtasks/:subtaskId` | Member+ | Toggle subtask completion state |
| `DELETE` | `/api/tasks/:id/subtasks/:subtaskId` | Member+ | Remove subtask checklist item |
| `GET` | `/api/team` | Authenticated | Retrieve all team collaborators |
| `POST` | `/api/team` | Admin+ | Invite / create new team collaborator |
| `GET` | `/api/team/:id` | Authenticated | Retrieve team collaborator profile |
| `PUT` | `/api/team/:id` | Admin+ / Owner | Update member details or assign access role |
| `DELETE` | `/api/team/:id` | Admin+ / Owner | Remove collaborator from workspace |
| `GET` | `/api/workspaces` | Authenticated | Retrieve user workspaces |
| `POST` | `/api/workspaces` | Admin+ | Create new workspace |
| `PUT` | `/api/workspaces/:id` | Admin+ | Update workspace settings / active sprint |
| `DELETE` | `/api/workspaces/:id` | Owner | Delete workspace |
| `DELETE` | `/api/workspaces/:id/sprints/:sprintName` | Admin+ | Delete inactive sprint cycle |
| `GET` | `/api/notifications` | Authenticated | Retrieve user notifications |
| `PATCH` | `/api/notifications/:id/read` | Authenticated | Mark single notification as read |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Mark all notifications as read |
| `DELETE` | `/api/notifications/:id` | Authenticated | Dismiss notification |
| `DELETE` | `/api/notifications` | Authenticated | Clear all notifications |
| `GET` | `/api/audit-logs` | Admin+ | Retrieve immutable audit logs |
| `GET` | `/api/audit-logs/stats` | Admin+ | Retrieve audit action breakdown metrics |
| `POST` | `/api/webhooks/github` | Public (HMAC) | Receive inbound GitHub webhook events |
| `GET` | `/api/webhooks/deliveries` | Admin+ | Retrieve webhook delivery audit log |
| `POST` | `/api/webhooks/simulate` | Admin+ | Dispatch simulated GitHub webhook event |

---

## Database Model Specifications

### 1. `User` ([backend/models/User.js](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/backend/models/User.js))
- `name`: String (required, trimmed)
- `email`: String (required, lowercase, unique, trimmed)
- `password`: String (hashed with bcryptjs, minlength 6)
- `role`: String (enum: `['Owner', 'Admin', 'Member', 'Guest']`, default: `'Member'`)
- `googleId`: String (sparse unique index)
- `avatar`: String
- `createdAt`, `updatedAt`: Timestamps

### 2. `TeamMember` ([backend/models/TeamMember.js](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/backend/models/TeamMember.js))
- `name`: String (required)
- `email`: String (required, lowercase)
- `role`: String (enum: `TEAM_ROLES` — Project Lead, Frontend Developer, Backend Developer, Fullstack Engineer, UI/UX Designer, DevOps Engineer, QA Specialist, Product Manager)
- `accessRole`: String (enum: `ACCESS_ROLES` — Owner, Admin, Member, Guest)
- `status`: String (enum: `TEAM_STATUSES` — Active, In a Meeting, Away, Offline)
- `avatar`: String
- `createdAt`, `updatedAt`: Timestamps

### 3. `Task` ([backend/models/Task.js](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/backend/models/Task.js))
- `title`: String (required, trimmed)
- `description`: String
- `status`: String (enum: `['To Do', 'In Progress', 'Under Review', 'Done']`, default: `'To Do'`)
- `priority`: String (enum: `['Low', 'Medium', 'High', 'Urgent']`, default: `'Medium'`)
- `type`: String (enum: `['Deadline', 'Meeting', 'Review']`, default: `'Deadline'`)
- `assignee`: String (name of team member)
- `dueDate`: Date (validated)
- `workspaceId`: String
- `sprintId`: String
- `tags`: [String]
- `subtasks`: Array of `{ title, completed, completedAt }`
- `comments`: Array of `{ author, text, createdAt }`
- `activities`: Array of `{ action, user, timestamp, details }`
- `githubPr`: Object `{ number, title, url, mergedAt }`
- `createdAt`, `updatedAt`: Timestamps

### 4. `Workspace` ([backend/models/Workspace.js](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/backend/models/Workspace.js))
- `name`: String (required, trimmed)
- `description`: String
- `currentSprint`: String (default: `'Sprint 1'`)
- `sprints`: [String] (default: `['Sprint 1', 'Sprint 2', 'Sprint 3', 'Backlog']`)
- `isDefault`: Boolean (default: false)
- `createdAt`, `updatedAt`: Timestamps

### 5. `AuditLog` ([backend/models/AuditLog.js](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/backend/models/AuditLog.js))
- `actor`: Object `{ id, name, email, role }`
- `action`: String (enum: `CREATE`, `UPDATE`, `DELETE`, `ROLE_CHANGE`, `SECURITY_UNAUTHORIZED_ACCESS`, `WEBHOOK_RECEIVE`, `TASK_AUTO_TRANSITION`, etc.)
- `resourceType`: String (enum: `Task`, `User`, `TeamMember`, `Workspace`, `Webhook`, `Security`)
- `resourceId`: String
- `details`: Object
- `ipAddress`: String
- `userAgent`: String
- `status`: String (enum: `SUCCESS`, `DENIED`, `FAILED`)
- *Immutability Hook:* Rejects all update and delete queries to ensure audit tamper resistance.
- `createdAt`: Timestamp

### 6. `WebhookDelivery` ([backend/models/WebhookDelivery.js](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/backend/models/WebhookDelivery.js))
- `deliveryId`: String (unique index on `X-GitHub-Delivery` GUID)
- `event`: String (e.g. `pull_request`, `ping`)
- `status`: String (enum: `SUCCESS`, `IGNORED`, `FAILED`, `DUPLICATE`)
- `payload`: Object
- `ipAddress`: String
- `createdAt`: Timestamp

### 7. `Notification` ([backend/models/Notification.js](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/backend/models/Notification.js))
- `title`: String (required)
- `message`: String (required)
- `type`: String (enum: `task`, `deadline`, `team`, `workspace`, `system`)
- `priority`: String (enum: `low`, `medium`, `high`, `urgent`)
- `read`: Boolean (default: false)
- `link`: String
- `metadata`: Object
- `createdAt`: Timestamp
