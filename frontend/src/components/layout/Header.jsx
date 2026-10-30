import React from 'react';
import { useLocation } from 'react-router-dom';
import { PlusIcon } from '../common/Icons';
import NotificationMenu from '../notifications/NotificationMenu';
import { useSocket } from '../../context/SocketContext';

const PAGE_TITLES = {
  '/': { title: 'Dashboard', subtitle: 'Real-time overview of tasks, team workload, and upcoming deadlines' },
  '/tasks': { title: 'Task Manager', subtitle: 'Organize, assign, and track team tasks and deliverables' },
  '/calendar': { title: 'Calendar & Deadlines', subtitle: 'Interactive monthly schedule and timeline view' },
  '/team': { title: 'Team Directory', subtitle: 'Manage team members, roles, and collaboration permissions' },
};

const Header = ({ onOpenNewTask }) => {
  const location = useLocation();
  const current = PAGE_TITLES[location.pathname] || { title: 'TeamSync', subtitle: 'Collaboration Platform' };
  const { isConnected, activeCollaborators } = useSocket();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{current.title}</h1>
        <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Active Collaborator Presence Stack */}
        {activeCollaborators.length > 0 && (
          <div className="hidden lg:flex items-center gap-2 pr-2 border-r border-slate-200">
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
          className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
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
          <span>{isConnected ? 'Live Sync' : 'Connecting...'}</span>
        </div>

        {/* Real-time Notification Bell & Flyout Popover */}
        <NotificationMenu />

        {/* Global Quick Action button */}
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
