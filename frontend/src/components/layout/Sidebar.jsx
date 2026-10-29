import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  DashboardIcon, 
  TasksIcon, 
  CalendarIcon, 
  TeamIcon, 
  LayersIcon,
  PlusIcon,
  CheckIcon,
  XIcon
} from '../common/Icons';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { 
    workspaces, 
    activeWorkspace, 
    switchWorkspace, 
    changeCurrentSprint, 
    createNewWorkspace 
  } = useWorkspace();

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newSprintName, setNewSprintName] = useState('Sprint 1');
  const menuRef = useRef(null);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: DashboardIcon },
    { to: '/tasks', label: 'Tasks', icon: TasksIcon },
    { to: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { to: '/team', label: 'My Team', icon: TeamIcon },
  ];

  // Close workspace dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsWorkspaceMenuOpen(false);
        setIsCreatingWorkspace(false);
      }
    };
    if (isWorkspaceMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isWorkspaceMenuOpen]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      await createNewWorkspace({
        name: newWorkspaceName.trim(),
        currentSprint: newSprintName.trim() || 'Sprint 1',
      });
      setNewWorkspaceName('');
      setIsCreatingWorkspace(false);
      setIsWorkspaceMenuOpen(false);
    } catch (err) {
      console.error('Error creating workspace:', err);
    }
  };

  const handleSprintSelect = async (sprint) => {
    if (!activeWorkspace) return;
    try {
      await changeCurrentSprint(activeWorkspace._id, sprint);
    } catch (err) {
      console.error('Error updating sprint:', err);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0 relative">
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
            <p className="text-xs text-slate-400 font-medium">Collab Platform</p>
          </div>
        </div>

        {/* Dynamic Workspace & Sprint Switcher Pill */}
        <div className="relative px-4 my-3" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="w-full px-3 py-2.5 bg-slate-800/60 hover:bg-slate-800/90 rounded-xl border border-slate-700/60 flex items-center justify-between text-left transition cursor-pointer group shadow-sm"
            title="Click to switch workspace or sprint"
          >
            <div className="flex items-center gap-2 min-w-0 pr-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400 group-hover:bg-indigo-300 transition shrink-0"></span>
              <span className="text-xs font-semibold text-slate-200 truncate">
                {activeWorkspace?.name || 'Main Workspace'}
              </span>
            </div>
            <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded shrink-0">
              {activeWorkspace?.currentSprint || 'Sprint 1'}
            </span>
          </button>

          {/* Interactive Workspace & Sprint Flyout Popover */}
          {isWorkspaceMenuOpen && (
            <div className="absolute left-4 right-4 top-12 z-50 bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl p-3.5 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Workspace
                </span>
                <button
                  type="button"
                  onClick={() => setIsWorkspaceMenuOpen(false)}
                  className="text-slate-400 hover:text-slate-200 transition"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Workspace List */}
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {workspaces.map((ws) => {
                  const isActive = activeWorkspace?._id === ws._id;
                  return (
                    <button
                      key={ws._id}
                      type="button"
                      onClick={() => {
                        switchWorkspace(ws);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate">{ws.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {ws.currentSprint}
                        </span>
                        {isActive && <CheckIcon className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Sprint Management Section */}
              {activeWorkspace && (
                <div className="pt-2 border-t border-slate-800/90 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Active Sprint:
                    </span>
                    <span className="text-xs font-bold text-indigo-400">
                      {activeWorkspace.currentSprint}
                    </span>
                  </div>

                  {/* Sprints Select */}
                  <select
                    value={activeWorkspace.currentSprint}
                    onChange={(e) => handleSprintSelect(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {(activeWorkspace.sprints || ['Sprint 1', 'Sprint 2', 'Backlog']).map((sp) => (
                      <option key={sp} value={sp}>
                        {sp}
                      </option>
                    ))}
                    <option value={`Sprint ${(activeWorkspace.sprints?.length || 2) + 1}`}>
                      + Advance to Sprint {(activeWorkspace.sprints?.length || 2) + 1}
                    </option>
                  </select>
                </div>
              )}

              {/* Inline Create New Workspace Form */}
              <div className="pt-2 border-t border-slate-800/90">
                {!isCreatingWorkspace ? (
                  <button
                    type="button"
                    onClick={() => setIsCreatingWorkspace(true)}
                    className="w-full py-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-900 rounded-lg transition cursor-pointer"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>Create New Workspace</span>
                  </button>
                ) : (
                  <form onSubmit={handleCreateWorkspace} className="space-y-2">
                    <input
                      type="text"
                      placeholder="Workspace name..."
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      required
                      autoFocus
                    />
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsCreatingWorkspace(false)}
                        className="flex-1 py-1 text-[11px] font-semibold text-slate-400 hover:bg-slate-800 rounded transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-1 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
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

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 shrink-0">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/40"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold text-xs shadow">
                  {getInitials(user?.name)}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
            </div>

            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Workspace User'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'Authenticated'}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition shrink-0 ml-2 cursor-pointer"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
