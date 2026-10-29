import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  DashboardIcon, 
  TasksIcon, 
  CalendarIcon, 
  TeamIcon, 
  LayersIcon 
} from './Icons';

const Sidebar = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: DashboardIcon },
    { to: '/tasks', label: 'Tasks', icon: TasksIcon },
    { to: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { to: '/team', label: 'My Team', icon: TeamIcon },
  ];

  return (
    <aside className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0">
      <div className="overflow-y-auto">
        {/* Brand Logo */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <LayersIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              TeamSync
              <span className="text-[10px] font-semibold uppercase bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">PRO</span>
            </span>
            <p className="text-xs text-slate-400">Collab Platform</p>
          </div>
        </div>

        {/* Workspace Pill */}
        <div className="px-4 py-3 mx-4 my-3 bg-slate-800/60 rounded-lg border border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span className="text-xs font-medium text-slate-200">Main Workspace</span>
          </div>
          <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">Sprint 1</span>
        </div>

        {/* Navigation Section */}
        <div className="px-4 py-2">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/60 transition cursor-pointer">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow">
              GE
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">Gividu E.</p>
            <p className="text-xs text-slate-400 truncate">Lead Workspace</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
