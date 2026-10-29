import React from 'react';
import { useLocation } from 'react-router-dom';
import { PlusIcon } from '../common/Icons';
import NotificationMenu from '../notifications/NotificationMenu';

const PAGE_TITLES = {
  '/': { title: 'Dashboard', subtitle: 'Real-time overview of tasks, team workload, and upcoming deadlines' },
  '/tasks': { title: 'Task Manager', subtitle: 'Organize, assign, and track team tasks and deliverables' },
  '/calendar': { title: 'Calendar & Deadlines', subtitle: 'Interactive monthly schedule and timeline view' },
  '/team': { title: 'Team Directory', subtitle: 'Manage team members, roles, and collaboration permissions' },
};

const Header = ({ onOpenNewTask }) => {
  const location = useLocation();
  const current = PAGE_TITLES[location.pathname] || { title: 'TeamSync', subtitle: 'Collaboration Platform' };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{current.title}</h1>
        <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Connection status indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Cloud</span>
        </div>

        {/* Real-time Notification Bell & Flyout Popover */}
        <NotificationMenu />

        {/* Global Quick Action button */}
        {onOpenNewTask && (
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg shadow-sm shadow-indigo-200 hover:shadow transition"
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
