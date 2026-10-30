import React from 'react';
import { useLocation } from 'react-router-dom';
import { PlusIcon, MenuIcon, PlugIcon } from '../common/Icons';
import NotificationMenu from '../notifications/NotificationMenu';
import { useSocket } from '../../context/SocketContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useDemoMode } from '../../context/DemoModeContext';

const PAGE_TITLES = {
  '/': { title: 'Dashboard', subtitle: 'Real-time overview of tasks, team workload, and upcoming deadlines' },
  '/tasks': { title: 'Task Deliverables', subtitle: 'Organize, assign, and track team tasks and deliverables' },
  '/calendar': { title: 'Calendar & Deadlines', subtitle: 'Interactive monthly schedule and timeline view' },
  '/team': { title: 'Team Directory', subtitle: 'Manage team members, roles, and collaboration permissions' },
  '/audit-logs': { title: 'Audit Trail', subtitle: 'Cryptographically logged, immutable workspace activity records' },
  '/webhooks': { title: 'Webhooks & Integrations', subtitle: 'Cryptographically authenticated inbound webhooks and CI/CD triggers' },
};

const Header = ({ onToggleSidebar, onOpenNewTask }) => {
  const location = useLocation();
  const current = PAGE_TITLES[location.pathname] || { title: 'TeamSync', subtitle: 'Collaboration Platform' };
  const { isConnected, activeCollaborators } = useSocket();
  const { activeWorkspace } = useWorkspace();
  const { isTestHarnessPlugged, toggleTestHarness } = useDemoMode();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile / Tablet Sidebar Drawer Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer shrink-0"
          title="Toggle Navigation Menu"
          aria-label="Toggle navigation menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* Clean Workspace Breadcrumb (Replaces repetitive double headings) */}
        <nav className="flex items-center gap-2 text-sm min-w-0" aria-label="Breadcrumb">
          <div className="flex items-center gap-1.5 font-medium text-slate-500 shrink-0">
            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
            <span className="truncate max-w-[110px] sm:max-w-xs text-slate-700 font-semibold">
              {activeWorkspace?.name || 'Main Workspace'}
            </span>
          </div>
          <span className="text-slate-300 select-none">/</span>
          <span className="font-semibold text-slate-900 truncate">
            {current.title}
          </span>
          {activeWorkspace?.currentSprint && (
            <span className="hidden sm:inline-flex text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md ml-1 shrink-0">
              {activeWorkspace.currentSprint}
            </span>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Active Collaborator Presence Stack */}
        {activeCollaborators.length > 0 && (
          <div className="hidden md:flex items-center gap-2 pr-2 border-r border-slate-200">
            <span className="text-[11px] text-slate-400 font-medium">Online:</span>
            <div className="flex -space-x-2 overflow-hidden items-center">
              {activeCollaborators.slice(0, 4).map((collab) => (
                <div
                  key={collab.userId}
                  className="relative group cursor-pointer"
                  title={`${collab.name} (${collab.role || 'Member'}) — Active now`}
                >
                  {collab.avatar ? (
                    <img
                      src={collab.avatar}
                      alt={collab.name}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-white"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white shadow-sm">
                      {collab.name ? collab.name.slice(0, 2).toUpperCase() : 'U'}
                    </div>
                  )}
                  {/* Glowing live dot */}
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white"></span>
                </div>
              ))}
              {activeCollaborators.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center ring-2 ring-white">
                  +{activeCollaborators.length - 4}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dynamic WebSocket Connection Status Indicator */}
        <div
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
          title={
            isConnected
              ? 'Connected to TeamSync real-time WebSocket event gateway'
              : 'Reconnecting to real-time gateway...'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          ></span>
          <span className="hidden sm:inline">{isConnected ? 'Live Sync' : 'Connecting...'}</span>
        </div>

        {/* Deploy-Ready vs Test Harness Plug/Unplug Switch */}
        <button
          type="button"
          onClick={toggleTestHarness}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
            isTestHarnessPlugged
              ? 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100 shadow-sm'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
          title={
            isTestHarnessPlugged
              ? 'Test Harness Active (Simulators & Sandbox Connected). Click to unplug and switch to pure production.'
              : 'Production Mode Active. Click to plug in test harnesses & simulator.'
          }
        >
          <PlugIcon
            className={`w-3.5 h-3.5 ${
              isTestHarnessPlugged ? 'text-purple-600 animate-pulse' : 'text-slate-400'
            }`}
          />
          <span className="hidden md:inline">
            {isTestHarnessPlugged ? 'Test Harness [Plugged]' : 'Production'}
          </span>
        </button>

        {/* Real-time Notification Bell & Flyout Popover */}
        <NotificationMenu />

        {/* Global Quick Action button (if passed) */}
        {onOpenNewTask && (
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg shadow-sm shadow-indigo-200 hover:shadow transition cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
