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
│   │   ├── authController.js        # Authentication & Google OAuth
│   │   ├── notificationController.js# Notifications & alerts
│   │   ├── taskController.js        # Task endpoints logic
│   │   └── teamMemberController.js  # Team member endpoints logic
│   ├── middlewares/                 # Express middleware pipeline
│   │   ├── authMiddleware.js        # JWT verification (protect)
│   │   ├── errorHandler.js          # Centralized global error handling
│   │   └── notFound.js              # 404 Route Not Found handler
│   ├── models/                      # Mongoose Domain Schemas
│   │   ├── Notification.js          # Notifications schema & indices
│   │   ├── Task.js                  # Deliverables & milestone schema
│   │   ├── TeamMember.js            # Collaborators schema
│   │   └── User.js                  # User accounts & auth credentials
│   ├── routes/                      # API Route Definitions
│   │   ├── index.js                 # Central router aggregation (/api)
│   │   ├── authRoutes.js            # /api/auth routes
│   │   ├── notificationRoutes.js    # /api/notifications routes
│   │   ├── taskRoutes.js            # /api/tasks routes
│   │   └── teamRoutes.js            # /api/team routes
│   ├── services/                    # Domain Business Logic & DB queries
│   │   ├── authService.js           # Google verification & JWT sessions
│   │   ├── notificationService.js   # Notification queries & auto-triggers
│   │   ├── taskService.js           # Task CRUD & query operations
│   │   └── teamService.js           # Member CRUD & query operations
│   ├── utils/                       # Shared server utilities
│   │   ├── ApiError.js              # Operational error subclass
│   │   ├── asyncHandler.js          # Promise error wrapper
│   │   └── generateToken.js         # JWT signing helper
│   ├── app.js                       # Express app configuration & middleware
│   ├── server.js                    # Bootstrapper, DB connect & graceful shutdown
│   ├── .env.example                 # Backend environment template
│   └── package.json
│
├── frontend/                        # React 19 + Vite Single Page Application
│   ├── src/
│   │   ├── api/                     # Centralized API layer
│   │   │   └── client.js            # Axios client with auth interceptor
│   │   ├── components/              # Modular UI Component Library
│   │   │   ├── common/              # Reusable design primitives
│   │   │   │   ├── Icons.jsx        # Zero-dependency SVG vector icon system
│   │   │   │   ├── Modal.jsx        # Accessible, responsive scrollable modal
│   │   │   │   └── ProtectedRoute.jsx# Auth routing guard
│   │   │   ├── layout/              # Application shell & navigation
│   │   │   │   ├── Header.jsx       # Sticky top navigation bar with notification bell
│   │   │   │   ├── Layout.jsx       # Viewport-locked master shell
│   │   │   │   └── Sidebar.jsx      # Pinned SaaS navigation sidebar with user profile
│   │   │   ├── notifications/       # Notification center components
│   │   │   │   └── NotificationMenu.jsx # Real-time notification flyout popover
│   │   │   └── index.js             # Barrel exports
│   │   ├── context/                 # Global Application State
│   │   │   ├── AuthContext.jsx      # User authentication & session state
│   │   │   └── NotificationContext.jsx # Live notifications state & polling
│   │   ├── pages/                   # Application Views
│   │   │   ├── Calendar.jsx         # Interactive monthly grid with task pills
│   │   │   ├── Dashboard.jsx        # Real-time KPIs & upcoming deliverables
│   │   │   ├── Login.jsx            # 3D flipping auth screen with Google OAuth
│   │   │   ├── Tasks.jsx            # Filterable task manager with datetime picker
│   │   │   └── Team.jsx             # Collaborator directory with workload metrics
│   │   ├── utils/                   # Shared client utilities
│   │   │   ├── dateUtils.js         # Relative countdowns & date formatting
│   │   │   └── taskHelpers.js       # Priority & type badge style maps
│   │   ├── App.jsx                  # Route definitions wrapped in Providers
│   │   ├── main.jsx                 # React root entry point
│   │   └── styles.css               # Tailwind CSS & 3D keyframe animations
│   ├── .env.example                 # Frontend environment template
│   └── vite.config.js
│
├── FEATURES.md                      # Feature-by-feature roadmap & system audit
└── README.md                        # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.x, v20.x, or v24.x)
- **MongoDB Atlas** (or local MongoDB instance)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Configure your MONGO_URI, JWT_SECRET, and GOOGLE_CLIENT_ID in .env
npm install
npm run dev
```
The API server starts at `http://localhost:5000` with health check at `http://localhost:5000/health`.

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Configure VITE_API_URL and VITE_GOOGLE_CLIENT_ID in .env
npm install
npm run dev
```
The React SPA will launch at `http://localhost:5173`.

---

## 📡 REST API Reference

### Health & Core
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/google` | Authenticate or register with Google OAuth ID token (auto-links matching Gmail) |
| `POST` | `/api/auth/register` | Register a new local user with email & password |
| `POST` | `/api/auth/login` | Login with existing email & password |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile |

### Task Deliverables (`/api/tasks`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks` | Get all tasks (chronologically sorted) |
| `GET` | `/api/tasks/:id` | Get single task by ID |
| `POST` | `/api/tasks` | Create a new task deliverable (triggers automated notification) |
| `PUT` | `/api/tasks/:id` | Update an existing task (triggers automated notification) |
| `DELETE` | `/api/tasks/:id` | Delete a task (triggers automated notification) |

### Team Directory (`/api/team`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/team` | Get all team members |
| `POST` | `/api/team` | Register a new team member (triggers automated notification) |
| `DELETE` | `/api/team/:id` | Remove a team member (triggers automated notification) |

### Notification Center (`/api/notifications`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Get workspace notifications & unread counts |
| `POST` | `/api/notifications` | Create a manual notification or alert |
| `PATCH` | `/api/notifications/read-all` | Mark all notifications as read |
| `PATCH` | `/api/notifications/:id/read` | Mark single notification as read |
| `DELETE` | `/api/notifications/:id` | Dismiss a single notification |
| `DELETE` | `/api/notifications` | Clear all notifications |

---

## 🗺️ Product Roadmap & Audit
See [FEATURES.md](FEATURES.md) for the live vs. hardcoded feature audit and planned features including:
- 📌 Interactive Drag-and-Drop Kanban Board (`To Do`, `In Progress`, `Under Review`, `Done`)
- 📋 Subtasks & Verifiable Deliverable Checklists
- ⚡ Instant Bidirectional WebSockets (Socket.io)
- 🏢 Multi-Project & Multi-Sprint Switcher
- 🤖 AI-Powered Sprint Planner & Standup Generator
