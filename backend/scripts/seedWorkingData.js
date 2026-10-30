import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import TeamMember from '../models/TeamMember.js';
import Task from '../models/Task.js';
import Workspace from '../models/Workspace.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { broadcastEvent } from '../socket/socketManager.js';

async function seed() {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Database connected. Populating realistic working project samples...');

  // 1. Ensure Workspaces
  console.log('\n--- Seeding Workspaces ---');
  let mainWorkspace = await Workspace.findOne({ name: 'Main Workspace' });
  if (!mainWorkspace) {
    mainWorkspace = await Workspace.create({
      name: 'Main Workspace',
      description: 'Core product engineering & sprint delivery pipeline',
      currentSprint: 'Sprint 1',
      sprints: ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Backlog'],
      isDefault: true,
    });
    console.log('Created Main Workspace');
  } else {
    mainWorkspace.sprints = ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Backlog'];
    mainWorkspace.currentSprint = 'Sprint 1';
    await mainWorkspace.save();
    console.log('Verified Main Workspace');
  }

  let mobileWorkspace = await Workspace.findOne({ name: 'Mobile App Launch' });
  if (!mobileWorkspace) {
    mobileWorkspace = await Workspace.create({
      name: 'Mobile App Launch',
      description: 'React Native iOS & Android companion applications',
      currentSprint: 'Sprint 1',
      sprints: ['Sprint 1', 'Beta Testing', 'App Store Submission', 'Backlog'],
      isDefault: false,
    });
    console.log('Created Mobile App Launch Workspace');
  }

  // 2. Ensure Team Members
  console.log('\n--- Seeding Team Members ---');
  const sampleMembers = [
    {
      name: 'Gividu Elladeniya',
      email: 'gividuelladeniya@gmail.com',
      role: 'Project Lead',
      accessRole: 'Owner',
      status: 'Active',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocLEGoDx7vYQVRqwYB7IjkLLgS05eDTHGstcthQIPidmHwmIRYhK=s96-c',
    },
    {
      name: 'it22202840',
      email: 'it22202840@my.sliit.lk',
      role: 'Frontend Developer',
      accessRole: 'Admin',
      status: 'In a Meeting',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocKQdHUzB7lTyCqnWx5tEGqD7xHmxOgLrSsQFDa8ETNANBRSnFU=s96-c',
    },
    {
      name: 'Amara Silva',
      email: 'amara.silva@teamsync.dev',
      role: 'UI/UX Designer',
      accessRole: 'Member',
      status: 'Active',
      avatar: '',
    },
    {
      name: 'Marcus Vance',
      email: 'marcus.v@teamsync.dev',
      role: 'Backend Developer',
      accessRole: 'Admin',
      status: 'Active',
      avatar: '',
    },
    {
      name: 'Kavinda Perera',
      email: 'kavinda.p@teamsync.dev',
      role: 'DevOps Engineer',
      accessRole: 'Member',
      status: 'Away',
      avatar: '',
    },
    {
      name: 'Elena Rostova',
      email: 'elena.r@teamsync.dev',
      role: 'QA Specialist',
      accessRole: 'Guest',
      status: 'Active',
      avatar: '',
    },
    {
      name: 'Devon Chen',
      email: 'devon.c@teamsync.dev',
      role: 'Product Manager',
      accessRole: 'Admin',
      status: 'Active',
      avatar: '',
    },
  ];

  for (const m of sampleMembers) {
    const existing = await TeamMember.findOne({ email: m.email.toLowerCase() });
    if (!existing) {
      await TeamMember.create(m);
      console.log(`Created member: ${m.name} (${m.role} - ${m.accessRole})`);
    } else {
      existing.role = m.role;
      existing.accessRole = m.accessRole;
      existing.status = m.status;
      if (m.avatar && !existing.avatar) existing.avatar = m.avatar;
      await existing.save();
      console.log(`Updated member: ${m.name} (${m.role} - ${m.accessRole})`);
    }
  }

  // 3. Clear old test tasks and seed clean, realistic project tasks
  console.log('\n--- Seeding Project Tasks (Deliverables) ---');
  await Task.deleteMany({});
  console.log('Cleared previous sample tasks.');

  // Current date anchor: Oct 30, 2026
  const now = new Date('2026-10-30T10:00:00Z');

  const projectTasks = [
    // --- DONE DELIVERABLES ---
    {
      title: 'Automated GitHub PR Webhook & Idempotency Pipeline',
      description: 'Implement HMAC-SHA256 constant-time verification with WebhookDelivery GUID deduplication to auto-transition deliverables on pull request merge.',
      assignee: 'Gividu Elladeniya',
      status: 'Done',
      priority: 'High',
      type: 'Deadline',
      deadline: new Date('2026-10-28T17:00:00Z'),
      completedAt: new Date('2026-10-28T16:45:00Z'),
      githubPrUrl: 'https://github.com/elladeniya-dev/teamsync-collab-platform/pull/142',
      githubPrNumber: 142,
      subtasks: [
        { title: 'Create cryptographic HMAC SHA-256 validation middleware', completed: true, completedAt: new Date('2026-10-28T12:00:00Z') },
        { title: 'Build WebhookDelivery Mongoose model with unique deliveryId index', completed: true, completedAt: new Date('2026-10-28T14:30:00Z') },
        { title: 'Verify PR merged auto-close automation with developer simulator', completed: true, completedAt: new Date('2026-10-28T16:40:00Z') },
      ],
      comments: [
        {
          author: { name: 'Gividu Elladeniya', email: 'gividuelladeniya@gmail.com', role: 'Owner' },
          text: 'Verified timingSafeEqual against replay attacks. Integration tests 100% green.',
          createdAt: new Date('2026-10-28T16:50:00Z'),
        },
      ],
      activity: [
        {
          actor: { name: 'GitHub Action', email: 'bot@github.com' },
          action: 'AUTOMATED_TRANSITION',
          details: 'Merged via Pull Request #142 to origin/main',
          timestamp: new Date('2026-10-28T16:45:00Z'),
        },
      ],
    },
    {
      title: 'Enterprise RBAC Role Assignment & Permissions Matrix',
      description: 'Establish dual-dimension authorization (Job Title vs Security Level) with interactive promotion dropdowns and compliance matrix.',
      assignee: 'Gividu Elladeniya',
      status: 'Done',
      priority: 'Urgent',
      type: 'Review',
      deadline: new Date('2026-10-29T16:00:00Z'),
      completedAt: new Date('2026-10-29T15:30:00Z'),
      subtasks: [
        { title: 'Define Owner > Admin > Member > Guest hierarchy', completed: true, completedAt: new Date('2026-10-29T11:00:00Z') },
        { title: 'Implement immutable ROLE_CHANGE audit log hooks', completed: true, completedAt: new Date('2026-10-29T13:40:00Z') },
        { title: 'Build interactive Permissions Matrix modal in Team Directory', completed: true, completedAt: new Date('2026-10-29T15:25:00Z') },
      ],
      comments: [
        {
          author: { name: 'Marcus Vance', email: 'marcus.v@teamsync.dev', role: 'Admin' },
          text: 'Tested role demotion guards. Non-owners are cleanly blocked from modifying owner accounts.',
          createdAt: new Date('2026-10-29T15:40:00Z'),
        },
      ],
      activity: [
        {
          actor: { name: 'Gividu Elladeniya', email: 'gividuelladeniya@gmail.com' },
          action: 'STATUS_UPDATE',
          details: 'Transitioned deliverable to Done after security sign-off',
          timestamp: new Date('2026-10-29T15:30:00Z'),
        },
      ],
    },
    {
      title: 'Sprint Cycle Accidental Deletion Protection & Safe Mode',
      description: 'Add Safe Mode browsing with active sprint locks and intentional Manage Mode with SweetAlert confirmation dialogs.',
      assignee: 'it22202840',
      status: 'Done',
      priority: 'Medium',
      type: 'Review',
      deadline: new Date('2026-10-30T11:00:00Z'),
      completedAt: new Date('2026-10-30T10:45:00Z'),
      subtasks: [
        { title: 'Create DELETE /api/workspaces/:id/sprints/:sprintName endpoint', completed: true, completedAt: new Date('2026-10-30T09:30:00Z') },
        { title: 'Add Safe Mode guard and red trash toggle in Sidebar', completed: true, completedAt: new Date('2026-10-30T10:40:00Z') },
      ],
      comments: [
        {
          author: { name: 'it22202840', email: 'it22202840@my.sliit.lk', role: 'Admin' },
          text: 'Active sprint is now locked with a protective shield icon. Accidental deletion is fully prevented.',
          createdAt: new Date('2026-10-30T10:50:00Z'),
        },
      ],
      activity: [
        {
          actor: { name: 'it22202840', email: 'it22202840@my.sliit.lk' },
          action: 'STATUS_UPDATE',
          details: 'Marked deliverable as Done',
          timestamp: new Date('2026-10-30T10:45:00Z'),
        },
      ],
    },

    // --- IN REVIEW DELIVERABLES ---
    {
      title: 'Calendar Tri-View Overhaul & Mobile Layout Refactor',
      description: 'Consolidate Month, Week, and Schedule views with sticky period control ribbons, micro-KPIs, and responsive assignee avatar styling.',
      assignee: 'it22202840',
      status: 'In Review',
      priority: 'High',
      type: 'Review',
      deadline: new Date('2026-10-30T17:00:00Z'), // Due Today 5 PM
      subtasks: [
        { title: 'Decouple time badge and assignee name to prevent PM wrap', completed: true, completedAt: new Date('2026-10-30T12:00:00Z') },
        { title: 'Add interactive Selected Date sidebar with milestone countdown', completed: true, completedAt: new Date('2026-10-30T13:30:00Z') },
        { title: 'Verify month jumping and keyboard tab navigation', completed: false },
      ],
      comments: [
        {
          author: { name: 'Amara Silva', email: 'amara.silva@teamsync.dev', role: 'Member' },
          text: 'The week view column layout looks sharp. Initial initials avatar renders with high contrast.',
          createdAt: new Date('2026-10-30T14:10:00Z'),
        },
      ],
      activity: [
        {
          actor: { name: 'it22202840', email: 'it22202840@my.sliit.lk' },
          action: 'STATUS_UPDATE',
          details: 'Moved from In Progress to In Review for design sign-off',
          timestamp: new Date('2026-10-30T13:45:00Z'),
        },
      ],
    },
    {
      title: 'Figma UI Kit Synchronization & Design Token Audit',
      description: 'Audit primary indigo brand tokens, glassmorphic card elevation, and ensure 100% SVG vector compliance without emojis.',
      assignee: 'Amara Silva',
      status: 'In Review',
      priority: 'Medium',
      type: 'Review',
      deadline: new Date('2026-10-31T15:00:00Z'), // Due Tomorrow
      subtasks: [
        { title: 'Export vector SVGs to Icons.jsx library', completed: true, completedAt: new Date('2026-10-29T16:00:00Z') },
        { title: 'Run zero-emoji compliance scanner across all JSX templates', completed: true, completedAt: new Date('2026-10-30T11:00:00Z') },
        { title: 'Audit dark sidebar contrast against WCAG AA accessibility specs', completed: false },
      ],
      comments: [
        {
          author: { name: 'Amara Silva', email: 'amara.silva@teamsync.dev', role: 'Member' },
          text: 'Confirmed 0 emojis in the codebase. All UI glyphs are crisp SVG paths.',
          createdAt: new Date('2026-10-30T11:15:00Z'),
        },
      ],
      activity: [
        {
          actor: { name: 'Amara Silva', email: 'amara.silva@teamsync.dev' },
          action: 'SUBTASK_TOGGLE',
          details: 'Completed subtask: Run zero-emoji compliance scanner',
          timestamp: new Date('2026-10-30T11:00:00Z'),
        },
      ],
    },

    // --- IN PROGRESS DELIVERABLES ---
    {
      title: 'Redis Cache-Aside Layer for Dashboard KPI Aggregates',
      description: 'Implement ioredis connection pool to cache high-frequency dashboard aggregates and member directories with socket-driven TTL invalidation.',
      assignee: 'Marcus Vance',
      status: 'In Progress',
      priority: 'High',
      type: 'Deadline',
      deadline: new Date('2026-11-01T18:00:00Z'), // Due Sunday
      subtasks: [
        { title: 'Configure ioredis client with offline fallback resilience', completed: true, completedAt: new Date('2026-10-30T09:00:00Z') },
        { title: 'Implement cache-aside pattern for GET /api/dashboard/stats', completed: false },
        { title: 'Invalidate cache on task:created and team:updated socket broadcasts', completed: false },
      ],
      comments: [
        {
          author: { name: 'Marcus Vance', email: 'marcus.v@teamsync.dev', role: 'Admin' },
          text: 'Benchmarking read latencies. Expecting p95 response time to drop below 8ms.',
          createdAt: new Date('2026-10-30T12:30:00Z'),
        },
      ],
      activity: [
        {
          actor: { name: 'Marcus Vance', email: 'marcus.v@teamsync.dev' },
          action: 'SUBTASK_TOGGLE',
          details: 'Completed subtask: Configure ioredis client',
          timestamp: new Date('2026-10-30T09:00:00Z'),
        },
      ],
    },
    {
      title: 'Sprint 1 Velocity Review & Backlog Grooming Sync',
      description: 'Bi-weekly engineering standup to review deliverable velocity, unblock PR approvals, and scope Sprint 2 candidate milestones.',
      assignee: 'Devon Chen',
      status: 'In Progress',
      priority: 'Medium',
      type: 'Meeting',
      deadline: new Date('2026-10-30T16:00:00Z'), // Today 4 PM
      subtasks: [
        { title: 'Prepare burn-down chart and completed PR list', completed: true, completedAt: new Date('2026-10-30T10:00:00Z') },
        { title: 'Prioritize upcoming mobile launch deliverables', completed: false },
      ],
      comments: [
        {
          author: { name: 'Devon Chen', email: 'devon.c@teamsync.dev', role: 'Admin' },
          text: 'Meeting room link pinned in general channel. Will focus on Redis and CI/CD pipelines.',
          createdAt: new Date('2026-10-30T13:00:00Z'),
        },
      ],
      activity: [
        {
          actor: { name: 'Devon Chen', email: 'devon.c@teamsync.dev' },
          action: 'COMMENT_POSTED',
          details: 'Added meeting agenda note',
          timestamp: new Date('2026-10-30T13:00:00Z'),
        },
      ],
    },
    {
      title: 'MongoDB Atlas Cross-Region Replica Read Verification',
      description: 'Audit replica set latency between primary AWS us-east-1 and secondary nodes to guarantee high availability during peak traffic.',
      assignee: 'Gividu Elladeniya',
      status: 'In Progress',
      priority: 'Urgent',
      type: 'Deadline',
      deadline: new Date('2026-10-31T20:00:00Z'),
      subtasks: [
        { title: 'Check connection string pooling parameters', completed: true, completedAt: new Date('2026-10-30T08:00:00Z') },
        { title: 'Simulate primary node failover with zero socket disconnects', completed: false },
      ],
      comments: [
        {
          author: { name: 'Gividu Elladeniya', email: 'gividuelladeniya@gmail.com', role: 'Owner' },
          text: 'Cluster topology is healthy. All three replica shard nodes responding under 45ms.',
          createdAt: new Date('2026-10-30T11:45:00Z'),
        },
      ],
      activity: [
        {
          actor: { name: 'Gividu Elladeniya', email: 'gividuelladeniya@gmail.com' },
          action: 'CREATE',
          details: 'Deliverable initiated in Sprint 1',
          timestamp: new Date('2026-10-30T08:00:00Z'),
        },
      ],
    },

    // --- TODO DELIVERABLES ---
    {
      title: 'Kubernetes Helm Deployment & Production CI/CD Pipeline',
      description: 'Build multi-stage distroless Alpine Docker containers and automated GitHub Actions workflow to run lint and system suites on pull request.',
      assignee: 'Kavinda Perera',
      status: 'Todo',
      priority: 'High',
      type: 'Deadline',
      deadline: new Date('2026-11-03T17:00:00Z'),
      subtasks: [
        { title: 'Write optimized multi-stage Dockerfile for Node.js backend', completed: false },
        { title: 'Configure Nginx reverse proxy Dockerfile for Vite frontend', completed: false },
        { title: 'Add test_system_suite.mjs step to GitHub Actions CI workflow', completed: false },
      ],
      comments: [],
      activity: [
        {
          actor: { name: 'Kavinda Perera', email: 'kavinda.p@teamsync.dev' },
          action: 'CREATE',
          details: 'Queued for Sprint 1 execution',
          timestamp: new Date('2026-10-29T14:00:00Z'),
        },
      ],
    },
    {
      title: 'End-to-End Cypress Integration Suite for RBAC Guards',
      description: 'Automate browser testing verifying that Guest users are strictly locked from task deletion, sprint removal, and collaborator invitation.',
      assignee: 'Elena Rostova',
      status: 'Todo',
      priority: 'Medium',
      type: 'Review',
      deadline: new Date('2026-11-02T14:00:00Z'),
      subtasks: [
        { title: 'Script Guest role login fixture', completed: false },
        { title: 'Assert 403 Forbidden intercept on DELETE /api/tasks/:id', completed: false },
        { title: 'Verify visual disabled state on destructive UI triggers', completed: false },
      ],
      comments: [],
      activity: [
        {
          actor: { name: 'Elena Rostova', email: 'elena.r@teamsync.dev' },
          action: 'CREATE',
          details: 'Added to QA review queue',
          timestamp: new Date('2026-10-30T09:15:00Z'),
        },
      ],
    },
    {
      title: 'BullMQ Distributed Job Worker for 24h Deadline Alerts',
      description: 'Replace standard in-memory setInterval polling with a resilient Redis BullMQ worker scheduling milestone warning notifications.',
      assignee: 'Marcus Vance',
      status: 'Todo',
      priority: 'Low',
      type: 'Deadline',
      deadline: new Date('2026-11-04T18:00:00Z'),
      subtasks: [
        { title: 'Install bullmq and connect Redis queue instance', completed: false },
        { title: 'Schedule repeating 1-hour cron evaluation worker', completed: false },
      ],
      comments: [],
      activity: [],
    },
    {
      title: 'Client Security Architecture Audit & SOC2 Preparation',
      description: 'Comprehensive review of cryptographic HMAC verification, audit trail immutability, and JWT token rotation policies.',
      assignee: 'Devon Chen',
      status: 'Todo',
      priority: 'Urgent',
      type: 'Meeting',
      deadline: new Date('2026-11-05T11:00:00Z'),
      subtasks: [
        { title: 'Export immutable AuditLog evidence table', completed: false },
        { title: 'Inspect timingSafeEqual HMAC validation test coverage', completed: false },
      ],
      comments: [],
      activity: [],
    },
  ];

  for (const t of projectTasks) {
    const created = await Task.create(t);
    console.log(`Created deliverable: "${created.title}" [${created.status} | ${created.priority} | ${created.type}] assigned to ${created.assignee}`);
  }

  // 4. Seed Recent Realistic Notifications
  console.log('\n--- Seeding Notifications ---');
  await Notification.deleteMany({});
  const sampleNotifications = [
    {
      title: 'GitHub PR #142 Merged',
      message: 'Automated webhook verified and deliverable "Automated GitHub PR Webhook & Idempotency Pipeline" transitioned to Done.',
      type: 'task',
      priority: 'high',
      read: false,
      link: '/tasks',
      createdAt: new Date('2026-10-30T10:15:00Z'),
    },
    {
      title: 'Sprint 1 Milestone Due Today',
      message: 'Calendar Tri-View Overhaul & Mobile Layout Refactor is scheduled for review by 5:00 PM today.',
      type: 'deadline',
      priority: 'urgent',
      read: false,
      link: '/calendar',
      createdAt: new Date('2026-10-30T09:00:00Z'),
    },
    {
      title: 'New Collaborator Joined',
      message: 'Elena Rostova joined the workspace as QA Specialist (Guest tier).',
      type: 'team',
      priority: 'low',
      read: true,
      link: '/team',
      createdAt: new Date('2026-10-30T08:30:00Z'),
    },
    {
      title: 'Access Permissions Assigned',
      message: 'it22202840 was promoted to Workspace Administrator by Gividu Elladeniya.',
      type: 'team',
      priority: 'medium',
      read: true,
      link: '/team',
      createdAt: new Date('2026-10-29T16:00:00Z'),
    },
    {
      title: 'Sprint Cycle Updated',
      message: 'Main Workspace active cycle advanced to Sprint 1.',
      type: 'system',
      priority: 'low',
      read: true,
      link: '/tasks',
      createdAt: new Date('2026-10-29T10:00:00Z'),
    },
  ];

  for (const n of sampleNotifications) {
    await Notification.create(n);
  }
  console.log(`Created ${sampleNotifications.length} system notifications.`);

  // 5. Ensure Key Audit Logs Exist
  console.log('\n--- Checking Audit Trail ---');
  const auditCount = await AuditLog.countDocuments();
  console.log(`Existing immutable audit log entries: ${auditCount}`);

  console.log('\n======================================================');
  console.log('  Database Seeding Completed Successfully!           ');
  console.log('======================================================');
  console.log(`- Workspaces: ${await Workspace.countDocuments()}`);
  console.log(`- Team Members: ${await TeamMember.countDocuments()}`);
  console.log(`- Project Deliverables (Tasks): ${await Task.countDocuments()}`);
  console.log(`- Notifications: ${await Notification.countDocuments()}`);
  console.log(`- Audit Logs: ${await AuditLog.countDocuments()}`);
  console.log('======================================================\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
