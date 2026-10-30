import React, { useState, useEffect, useCallback } from 'react';
import { auditApi } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheckIcon, 
  ShieldIcon, 
  SearchIcon, 
  AlertCircleIcon, 
  CheckCircleIcon,
  RotateCcwIcon,
  LockIcon,
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
    if (status === 'DENIED') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (action.includes('DELETE') || action.includes('REMOVE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('CREATE') || action.includes('REGISTER')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('UPDATE') || action.includes('CHANGE')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
            Owner
          </span>
        );
      case 'admin':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            Admin
          </span>
        );
      case 'guest':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            Guest
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            Member
          </span>
        );
    }
  };

  const normalizedUserRole = (user?.role || '').toLowerCase();
  const isRestricted = normalizedUserRole !== 'owner' && normalizedUserRole !== 'admin';

  if (isRestricted) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-6 pt-16">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
          <LockIcon className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Access Restricted</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            The workspace immutable audit log is strictly restricted to Workspace Owners and Administrators. Your current role is <strong className="text-indigo-600 font-semibold">{user?.role || 'Member'}</strong>.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 shadow-sm">
          <ShieldIcon className="w-4 h-4 text-slate-500" />
          <span>Contact an administrator to elevate your workspace permissions.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 w-full animate-fadeIn">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Workspace Audit Trail</span>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
              Immutable
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically logged, tamper-evident record of all team mutations, role updates, and security events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Sync Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-sm text-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-slate-700 font-medium">{isConnected ? 'Live WebSocket Stream' : 'Connecting...'}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchLogsAndStats}
            disabled={refreshing}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200/80 shadow-sm transition cursor-pointer disabled:opacity-50"
            title="Refresh logs"
          >
            <RotateCcwIcon className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Immutability Security Guarantee Banner */}
      <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-start sm:items-center gap-3 text-xs text-indigo-950">
        <ShieldIcon className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex-1 leading-relaxed">
          <strong className="font-semibold text-slate-900">Database Immutability Active:</strong> Audit log entries are permanent. Update and delete queries on this collection are rejected at the database engine level to guarantee evidentiary integrity for compliance.
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Audit Events</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{stats.totalLogs}</span>
            <span className="text-xs text-slate-500">permanent entries</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recorded (Past 24h)</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <span className="text-indigo-600 font-bold text-xs">24h</span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-indigo-600">{stats.last24hLogs}</span>
            <span className="text-xs text-slate-500">recent actions</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Denied Access Blocks</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircleIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-600">{stats.deniedAttempts}</span>
            <span className="text-xs text-slate-500">security breaches prevented</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Actors</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircleIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600">{stats.activeActors}</span>
            <span className="text-xs text-slate-500">unique operators</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by actor, action, IP, or resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
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
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action & Resource</th>
                <th className="py-3 px-4">Client IP</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isDenied
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isDenied ? (
                            <AlertCircleIcon className="w-3 h-3 text-rose-600" />
                          ) : (
                            <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                          )}
                          {log.status}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {formatTimestamp(log.createdAt)}
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                            {log.actor?.name ? log.actor.name[0].toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">
                                {log.actor?.name || 'System User'}
                              </span>
                              {getRoleBadge(log.actor?.role)}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">
                              {log.actor?.email || 'internal'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action & Resource */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getActionBadgeColor(
                              log.action,
                              log.status
                            )}`}
                          >
                            {log.action}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {log.resourceType}
                          </span>
                        </div>
                      </td>

                      {/* Client IP */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {log.ipAddress || '127.0.0.1'}
                      </td>

                      {/* Inspect Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-semibold transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldIcon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Audit Entry Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                title="Close"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans uppercase font-semibold">ENTRY ID</span>
                  <span className="text-slate-800 select-all font-semibold">{selectedLog._id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans uppercase font-semibold">RECORDED AT</span>
                  <span className="text-slate-800">{formatTimestamp(selectedLog.createdAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans uppercase font-semibold">CLIENT IP</span>
                  <span className="text-slate-800">{selectedLog.ipAddress}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans uppercase font-semibold">USER AGENT</span>
                  <span className="text-slate-800 truncate block" title={selectedLog.userAgent}>
                    {selectedLog.userAgent || 'Unknown'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Payload Snapshot (Immutable)
                </p>
                <pre className="p-3.5 bg-slate-900 rounded-2xl text-[11px] font-mono text-indigo-300 overflow-x-auto max-h-48 shadow-inner">
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
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
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
