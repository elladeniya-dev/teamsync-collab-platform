import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { 
  BellIcon, 
  CheckCircleIcon, 
  CheckIcon, 
  TrashIcon, 
  ClockIcon, 
  TasksIcon, 
  UserIcon, 
  SparklesIcon, 
  XIcon 
} from '../common/Icons';
import { formatTimeAgo } from '../../utils/dateUtils';

const NotificationMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const getTypeIcon = (type, priority) => {
    switch (type) {
      case 'deadline':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-500">
            <ClockIcon className="w-4 h-4" />
          </div>
        );
      case 'team':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-500">
            <UserIcon className="w-4 h-4" />
          </div>
        );
      case 'system':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-500">
            <SparklesIcon className="w-4 h-4" />
          </div>
        );
      case 'task':
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-500">
            <TasksIcon className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
        title="Notifications"
        aria-label="View notifications"
      >
        <BellIcon className="w-5 h-5" />

        {/* Dynamic Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Notification Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition flex items-center gap-1 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                aria-label="Close notifications menu"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filter === 'unread'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <BellIcon className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-semibold text-slate-700">All caught up!</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {filter === 'unread'
                    ? 'No unread notifications to review.'
                    : 'No recent notifications in your workspace.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 flex items-start gap-3 transition cursor-pointer relative group ${
                    item.read
                      ? 'bg-white hover:bg-slate-50/70'
                      : 'bg-indigo-50/30 hover:bg-indigo-50/50'
                  }`}
                >
                  {/* Left Type Icon */}
                  {getTypeIcon(item.type, item.priority)}

                  {/* Middle Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4
                        className={`text-xs truncate ${
                          item.read
                            ? 'font-medium text-slate-700'
                            : 'font-bold text-slate-900'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {item.priority === 'urgent' && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>

                  {/* Right Status / Hover Actions */}
                  <div className="absolute right-3 top-3.5 flex items-center gap-1">
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 block group-hover:hidden"></span>
                    )}

                    <div className="hidden group-hover:flex items-center gap-1">
                      {!item.read && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(item._id);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition"
                          title="Mark as read"
                        >
                          <CheckIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(item._id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition"
                        title="Dismiss"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Live sync active</span>
              </span>

              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] text-slate-500 hover:text-rose-600 font-medium transition cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationMenu;
