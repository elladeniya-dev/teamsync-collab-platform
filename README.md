# ⚡ TeamSync — Team Collaboration & Productivity Platform

A modern, high-performance team collaboration platform engineered with **React 19**, **Tailwind CSS**, **Node.js / Express**, and **MongoDB Atlas**.

---

## 🏗️ Architecture Overview

The codebase is organized following **Clean Layered Architecture** on the backend and **Feature/Modular Architecture** on the frontend, ensuring high maintainability, testability, and separation of concerns.

```
teamsync-collab-platform/
├── backend/                         # Node.js & Express REST API
│   ├── config/                      # Environment & Database configurations
│   │   └── db.js                    # Resilient Mongoose connection lifecycle
│   ├── controllers/                 # HTTP Request & Response handlers
│   │   ├── taskController.js        # Task endpoints logic
│   │   └── teamMemberController.js  # Team member endpoints logic
│   ├── middlewares/                 # Express middleware pipeline
│   │   ├── errorHandler.js          # Centralized global error handling
│   │   └── notFound.js              # 404 Route Not Found handler
│   ├── models/                      # Mongoose Domain Schemas
│   │   ├── Task.js                  # Deliverables & milestone schema
│   │   └── TeamMember.js            # Collaborators schema
│   ├── routes/                      # API Route Definitions
│   │   ├── index.js                 # Central router aggregation (/api)
│   │   ├── taskRoutes.js            # /api/tasks routes
│   │   └── teamRoutes.js            # /api/team routes
│   ├── services/                    # Domain Business Logic & DB queries
│   │   ├── taskService.js           # Task CRUD & query operations
│   │   └── teamService.js           # Member CRUD & query operations
│   ├── utils/                       # Shared server utilities
│   │   ├── ApiError.js              # Operational error subclass
│   │   └── asyncHandler.js          # Promise error wrapper
│   ├── app.js                       # Express app configuration & middleware
│   ├── server.js                    # Bootstrapper, DB connect & graceful shutdown
│   ├── .env.example                 # Backend environment template
│   └── package.json
│
├── frontend/                        # React 19 + Vite Single Page Application
│   ├── src/
│   │   ├── api/                     # Centralized API layer
│   │   │   └── client.js            # Axios client with env base URL
│   │   ├── components/              # Modular UI Component Library
│   │   │   ├── common/              # Reusable design primitives
│   │   │   │   ├── Icons.jsx        # Zero-dependency SVG vector icon system
│   │   │   │   └── Modal.jsx        # Accessible backdrop-blurred modal
│   │   │   ├── layout/              # Application shell & navigation
│   │   │   │   ├── Header.jsx       # Sticky top navigation bar
│   │   │   │   ├── Layout.jsx       # Viewport-locked master shell
│   │   │   │   └── Sidebar.jsx      # Pinned SaaS navigation sidebar
│   │   │   └── index.js             # Barrel exports
│   │   ├── hooks/                   # Custom React Hooks
│   │   │   ├── useTasks.js          # Task state management & mutations
│   │   │   └── useTeam.js           # Collaborators state management
│   │   ├── pages/                   # Application Views
│   │   │   ├── Calendar.jsx         # Proportional interactive monthly grid
│   │   │   ├── Dashboard.jsx        # Real-time KPIs & upcoming deliverables
│   │   │   ├── Tasks.jsx            # Filterable task manager with modal
│   │   │   └── Team.jsx             # Collaborator directory with workload metrics
│   │   ├── utils/                   # Shared client utilities
│   │   │   ├── dateUtils.js         # Relative countdowns & date formatting
│   │   │   └── taskHelpers.js       # Priority & type badge style maps
│   │   ├── App.jsx                  # Route definitions wrapped in Layout
│   │   ├── main.jsx                 # React root entry point
│   │   └── styles.css               # Tailwind CSS & keyframe animations
│   ├── .env.example                 # Frontend environment template
│   └── vite.config.js
│
├── FEATURES.md                      # Feature-by-feature roadmap & checklist
└── README.md                        # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.x, v20.x, or v24.x)
- **MongoDB** (Local instance or MongoDB Atlas cluster)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB Atlas URI
npm run dev
```
The API server starts at `http://localhost:5000` with health check at `http://localhost:5000/health`.

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm run dev
```
The React SPA will launch at `http://localhost:5173`.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `GET` | `/api/tasks` | Get all tasks (chronologically sorted) |
| `GET` | `/api/tasks/:id` | Get single task by ID |
| `POST` | `/api/tasks` | Create a new task deliverable |
| `PUT` | `/api/tasks/:id` | Update an existing task |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `GET` | `/api/team` | Get all team members |
| `POST` | `/api/team` | Register a new team member |
| `DELETE` | `/api/team/:id` | Remove a team member |

---

## 🗺️ Product Roadmap
See [FEATURES.md](FEATURES.md) for planned features including:
- 📌 Interactive Kanban Drag-and-Drop Board
- ⚡ Live Real-Time Collaboration (Socket.io)
- 🔐 JWT User Authentication & Organization Workspaces
- 🤖 AI-Powered Sprint Planner & Daily Standup Generator
