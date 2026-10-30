import React, { useState, useEffect, useCallback } from 'react';
import { auditApi } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheckIcon, 
  ShieldIcon, 
  SearchIcon, 
  FilterIcon, 
  AlertCircleIcon, 
  CheckCircleIcon,
  ClockIcon,
  RotateCcwIcon,
  LockIcon,
  UserIcon,
  XIcon
} from '../components/common/Icons';

const AuditLogs = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalLogs: 0,
    last24hLogs: 0,
    deniedAttempts: 0,
    activeActors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogsAndStats = useCallback(async () => {
    try {
      setRefreshing(true);
      const [logsRes, statsRes] = await Promise.all([
        auditApi.getAll({
          search: search.trim() || undefined,
          resourceType: filterType === 'ALL' || filterType === 'DENIED' ? undefined : filterType,
          status: filterType === 'DENIED' ? 'DENIED' : undefined,
          limit: 100,
        }),
        auditApi.getStats(),
      ]);

      if (logsRes.data?.logs) {
        setLogs(logsRes.data.logs);
      }
      if (statsRes.data?.stats) {
        setStats(statsRes.data.stats);
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filterType]);

  useEffect(() => {
    fetchLogsAndStats();
  }, [fetchLogsAndStats]);

  // Real-Time Socket.io listener for new audit logs
  useEffect(() => {
    if (!socket) return;

    const handleNewAudit = (newLog) => {
      setLogs((prev) => [newLog, ...prev.filter((l) => l._id !== newLog._id)]);
      setStats((prev) => ({
        ...prev,
        totalLogs: prev.totalLogs + 1,
        last24hLogs: prev.last24hLogs + 1,
        deniedAttempts: newLog.status === 'DENIED' ? prev.deniedAttempts + 1 : prev.deniedAttempts,
      }));
    };

    socket.on('audit:created', handleNewAudit);

    return () => {
      socket.off('audit:created', handleNewAudit);
    };
  }, [socket]);

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const getActionBadgeColor = (action, status) => {
    if (status === 'DENIED') return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    if (action.includes('DELETE') || action.includes('REMOVE')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
    if (action.includes('CREATE') || action.includes('REGISTER')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (action.includes('UPDATE') || action.includes('CHANGE')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
  };

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Owner
          </span>
        );
      case 'admin':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Admin
          </span>
        );
      case 'guest':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
            Guest
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Member
          </span>
        );
    }
  };

  const isRestricted = user?.role === 'Guest' || user?.role === 'Member';

  if (isRestricted) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-6 pt-16">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/10">
          <LockIcon className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            The workspace immutable audit log is strictly restricted to Workspace Owners and Administrators. Your current role is <strong className="text-indigo-400 font-semibold">{user?.role || 'Member'}</strong>.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
          <ShieldIcon className="w-4 h-4 text-slate-400" />
          <span>Contact an administrator to elevate your workspace permissions.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <ShieldCheckIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Workspace Audit Trail
                <span className="text-[10px] font-semibold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                  Immutable
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Cryptographically logged, tamper-evident record of all team mutations and access events.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Sync Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-slate-300 font-medium">{isConnected ? 'Live WebSocket Stream' : 'Connecting...'}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchLogsAndStats}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Refresh logs"
          >
            <RotateCcwIcon className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Immutability Security Guarantee Banner */}
      <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start sm:items-center gap-3 text-xs text-indigo-200">
        <ShieldIcon className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex-1 leading-relaxed">
          <strong className="font-semibold text-white">Database Immutability Active:</strong> Audit log entries are permanent. Update and delete queries on this collection are rejected at the database engine level to guarantee evidentiary integrity for compliance.
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 font-medium">Total Audit Events</p>
          <p className="text-2xl font-bold text-white">{stats.totalLogs}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 font-medium">Recorded (Past 24h)</p>
          <p className="text-2xl font-bold text-indigo-400">{stats.last24hLogs}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 font-medium">Denied Access Blocks</p>
          <p className="text-2xl font-bold text-rose-400">{stats.deniedAttempts}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 font-medium">Active Actors</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.activeActors}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by actor, action, IP, or resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'DENIED', label: 'Security Blocks' },
            { id: 'Task', label: 'Tasks' },
            { id: 'TeamMember', label: 'Members' },
            { id: 'Workspace', label: 'Workspaces' },
            { id: 'Auth', label: 'Auth' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                filterType === tab.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action & Resource</th>
                <th className="py-3 px-4">Client IP</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs">Loading audit trail records...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <p className="text-xs">No audit events match your search or filter.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isDenied = log.status === 'DENIED';
                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            isDenied
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {isDenied ? (
                            <AlertCircleIcon className="w-3 h-3 text-rose-400" />
                          ) : (
                            <CheckCircleIcon className="w-3 h-3 text-emerald-400" />
                          )}
                          {log.status}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {formatTimestamp(log.createdAt)}
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-[10px] shrink-0">
                            {log.actor?.name ? log.actor.name[0].toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-200">
                                {log.actor?.name || 'System User'}
                              </span>
                              {getRoleBadge(log.actor?.role)}
                            </div>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">
                              {log.actor?.email || 'internal'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action & Resource */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getActionBadgeColor(
                              log.action,
                              log.status
                            )}`}
                          >
                            {log.action}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {log.resourceType}
                          </span>
                        </div>
                      </td>

                      {/* Client IP & Info */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {log.ipAddress || '127.0.0.1'}
                      </td>

                      {/* Inspect Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold transition cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Audit Entry Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Close"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">ENTRY ID</span>
                  <span className="text-slate-300 select-all">{selectedLog._id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">RECORDED AT</span>
                  <span className="text-slate-300">{formatTimestamp(selectedLog.createdAt)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CLIENT IP</span>
                  <span className="text-slate-300">{selectedLog.ipAddress}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">USER AGENT</span>
                  <span className="text-slate-300 truncate block" title={selectedLog.userAgent}>
                    {selectedLog.userAgent || 'Unknown'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Payload Snapshot (Immutable)
                </p>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto max-h-48">
                  {JSON.stringify(
                    {
                      actor: selectedLog.actor,
                      action: selectedLog.action,
                      resourceType: selectedLog.resourceType,
                      resourceId: selectedLog.resourceId,
                      details: selectedLog.details,
                      status: selectedLog.status,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
