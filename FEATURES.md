# 🚀 TeamSync — Feature Roadmap & Specifications

A feature-by-feature roadmap for transforming **TeamSync** into a full-fledged, modern team collaboration and productivity platform.

---

## 📌 Status Legend
- ⬜ **Planned**
- ⏳ **In Progress**
- ✅ **Completed**

---

## 🏗️ Phase 1: Core Task Workflow Enhancements

### Feature 1.1: Extended Task Metadata (Status & Priority)
- **Status:** ⬜ Planned
- **Goal:** Allow tasks to be categorized by execution status and urgency.
- **Backend Tasks:**
  - [ ] Update `backend/models/Task.js` schema:
    - `status`: `['Todo', 'In Progress', 'Under Review', 'Completed']` (default: `'Todo'`)
    - `priority`: `['Low', 'Medium', 'High', 'Urgent']` (default: `'Medium'`)
    - `tags`: `[String]`
  - [ ] Update `taskController.js` to handle status/priority filtering and updates.
- **Frontend Tasks:**
  - [ ] Add Status & Priority dropdowns in `Tasks.jsx` create/edit modal.
  - [ ] Display visual badges for Priority (`Urgent` = Red, `High` = Orange, `Medium` = Yellow, `Low` = Gray).
  - [ ] Update Dashboard sorting and counters to use the new fields.

---

### Feature 1.2: Dynamic Team Assignee Linking
- **Status:** ⬜ Planned
- **Goal:** Replace raw text assignee input with dynamic selection from registered team members.
- **Backend Tasks:**
  - [ ] Update `Task.js` schema to reference `TeamMember` via ObjectId:
    ```js
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' }
    ```
  - [ ] Populate `assignee` details in task queries (`Task.find().populate('assignee')`).
- **Frontend Tasks:**
  - [ ] Replace text input in task modal with an Assignee `<select>` populated from `/api/team`.
  - [ ] Display assignee name, email, and avatar badge on task cards.

---

### Feature 1.3: Interactive Kanban Board
- **Status:** ⬜ Planned
- **Goal:** Visual drag-and-drop workflow columns (`To Do`, `In Progress`, `Under Review`, `Done`).
- **Frontend Tasks:**
  - [ ] Install drag-and-drop library (e.g. `@hello-pangea/dnd`).
  - [ ] Create `KanbanBoard.jsx` component with columns for each status.
  - [ ] Add view switcher on Tasks page: **List View** ⇄ **Kanban Board**.
  - [ ] Implement optimistic drag-and-drop update with instant API sync (`PUT /api/tasks/:id`).

---

### Feature 1.4: Subtasks & Progress Checklist
- **Status:** ⬜ Planned
- **Goal:** Break down larger tasks into verifiable checklist items.
- **Backend Tasks:**
  - [ ] Add `subtasks` array to `Task.js`:
    ```js
    subtasks: [{ title: String, completed: { type: Boolean, default: false } }]
    ```
- **Frontend Tasks:**
  - [ ] Add checklist UI inside task edit modal.
  - [ ] Display mini progress bar (`X of Y completed`) on task cards.
  - [ ] Allow checking off subtasks directly from the task card.

---

### Feature 1.5: Search, Filtering & Sorting
- **Status:** ⬜ Planned
- **Goal:** Instantly locate and organize tasks.
- **Frontend Tasks:**
  - [ ] Search input matching title and description.
  - [ ] Filter by: Assignee, Priority, Status, Task Type.
  - [ ] Sort by: Deadline, Priority, Date Created.

---

## ⚡ Phase 2: Real-Time Collaboration & Communication

### Feature 2.1: Real-Time Live Sync (Socket.io)
- **Status:** ⬜ Planned
- **Goal:** Multi-user live updates without page refreshing.
- **Backend Tasks:**
  - [ ] Integrate `socket.io` in Express server.
  - [ ] Emit events on `task:created`, `task:updated`, `task:deleted`, `task:moved`.
- **Frontend Tasks:**
  - [ ] Setup `socket.io-client` connection.
  - [ ] Listen to events and update state automatically when teammates make changes.

---

### Feature 2.2: Task Comments & Activity History
- **Status:** ⬜ Planned
- **Goal:** Keep team discussions and audit logs attached to specific tasks.
- **Backend Tasks:**
  - [ ] Create `Comment` model or embed comments in `Task.js`:
    ```js
    comments: [{ user: String, text: String, createdAt: { type: Date, default: Date.now } }]
    ```
  - [ ] Add endpoint `POST /api/tasks/:id/comments`.
- **Frontend Tasks:**
  - [ ] Task Details drawer/modal with comment feed and input.
  - [ ] Auto-generate activity log (`"Alex moved task to Done"`).

---

### Feature 2.3: Team Chat Room
- **Status:** ⬜ Planned
- **Goal:** Built-in team messaging channel.
- **Backend Tasks:**
  - [ ] Create `Message` model (`sender`, `content`, `room`, `timestamp`).
  - [ ] Socket.io handlers for instant messaging.
- **Frontend Tasks:**
  - [ ] Create `/chat` page with team channels and message history.

---

## 🗓️ Phase 3: Visual Schedules & Calendar

### Feature 3.1: Interactive Month/Week Calendar Grid
- **Status:** ⬜ Planned
- **Goal:** Replace the basic task list in `Calendar.jsx` with a real interactive calendar.
- **Frontend Tasks:**
  - [ ] Implement monthly and weekly grid view.
  - [ ] Render task pills on their respective deadline days with priority color coding.
  - [ ] Click date to add task directly with deadline preset.
  - [ ] Drag task pill to a different date to reschedule deadline.

---

### Feature 3.2: Deadline Alerts & Countdown
- **Status:** ⬜ Planned
- **Goal:** Prevent overdue tasks with clear visual cues.
- **Frontend Tasks:**
  - [ ] Highlight overdue tasks with an alert badge (`⚠️ Overdue by X days`).
  - [ ] "Due Today" banner on Dashboard.

---

## 🔐 Phase 4: Authentication, Profiles & Workspaces

### Feature 4.1: User Authentication & JWT
- **Status:** ⬜ Planned
- **Goal:** Secure login/registration so users only access their organization's data.
- **Backend Tasks:**
  - [ ] Create `User` model with password hashing (`bcryptjs`).
  - [ ] Auth endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
  - [ ] Protect task and team routes with JWT verification middleware.
- **Frontend Tasks:**
  - [ ] Create `/login` and `/register` pages.
  - [ ] Store auth token in `localStorage` or secure cookie.
  - [ ] Auth route guards and user profile menu in header/sidebar.

---

### Feature 4.2: Workspaces / Multiple Projects
- **Status:** ⬜ Planned
- **Goal:** Separate tasks by client, sprint, or department.
- **Backend Tasks:**
  - [ ] Create `Project` model (`name`, `description`, `members`, `owner`).
  - [ ] Associate tasks with `projectId`.
- **Frontend Tasks:**
  - [ ] Workspace/Project switcher dropdown in top navigation.

---

## 📊 Phase 5: Dashboard Analytics & Insights

### Feature 5.1: Productivity Metrics & Charts
- **Status:** ⬜ Planned
- **Goal:** High-level overview of team velocity and health.
- **Frontend Tasks:**
  - [ ] Completion Rate % donut chart.
  - [ ] Workload balance chart (tasks per team member).
  - [ ] Upcoming vs Overdue task count cards.

---

## 🤖 Phase 6: AI-Powered Productivity (Smart Tools)

### Feature 6.1: AI Task & Sprint Generator
- **Status:** ⬜ Planned
- **Goal:** Generate breakdown of tasks and subtasks from natural language prompts.
- **Backend Tasks:**
  - [ ] Add endpoint `POST /api/ai/generate-tasks` using Gemini API.
- **Frontend Tasks:**
  - [ ] "✨ Auto-Plan with AI" button on Tasks page.
  - [ ] Preview generated tasks before confirming insertion.

---

## 🛠️ Phase 7: Infrastructure & Code Cleanliness

### Feature 7.1: Centralized API Client & Environment Config
- **Status:** ✅ Completed
- **Goal:** Eliminate hardcoded `http://localhost:5000` URLs across frontend files.
- **Frontend Tasks:**
  - [x] Create `frontend/src/api/client.js` with Axios instance and base URL from `import.meta.env.VITE_API_URL`.
  - [x] Refactor all pages (`Tasks.jsx`, `Dashboard.jsx`, `Team.jsx`, `Calendar.jsx`) to use `apiClient` & `taskApi` / `teamApi`.
  - [x] Add `frontend/.env` and `frontend/.env.example`.

### Feature 7.2: Professional UI/UX Overhaul
- **Status:** ✅ Completed
- **Goal:** Elevate look and feel to a modern SaaS application with crisp typography, layout, icons, and interactions.
- **Frontend Tasks:**
  - [x] Modern SaaS Shell with [Sidebar.jsx](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/frontend/src/components/Sidebar.jsx) and sticky [Header.jsx](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/frontend/src/components/Header.jsx).
  - [x] Zero-dependency vector SVG icon system in [Icons.jsx](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/frontend/src/components/Icons.jsx).
  - [x] Redesigned [Dashboard.jsx](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/frontend/src/pages/Dashboard.jsx) with welcome banner, live KPI metric cards, upcoming deliverables feed, and team workload summary.
  - [x] Overhauled [Tasks.jsx](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/frontend/src/pages/Tasks.jsx) with real-time search, type filtering pills, relative deadline badges, dynamic assignee dropdown from database, and left-accented cards.
  - [x] Rebuilt [Calendar.jsx](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/frontend/src/pages/Calendar.jsx) as a full interactive monthly calendar grid with month navigation, today jump, deadline badges on date cells, and task preview modal.
  - [x] Upgraded [Team.jsx](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/frontend/src/pages/Team.jsx) with gradient avatar badges, active status indicators, assigned task counts, and instant filter.
  - [x] Refined [Modal.jsx](file:///c:/Users/GividuE/Documents/GitHub/teamsync-collab-platform/frontend/src/components/Modal.jsx) with backdrop blur and smooth entrance animations.
