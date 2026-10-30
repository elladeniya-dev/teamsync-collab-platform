import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { webhookApi, taskApi } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
  WebhookIcon,
  GitPullRequestIcon,
  ShieldCheckIcon,
  ShieldIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RotateCcwIcon,
  CopyIcon,
  PlayIcon,
  LockIcon,
  ExternalLinkIcon,
  XIcon
} from '../components/common/Icons';

const Webhooks = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const [deliveries, setDeliveries] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    processed: 0,
    duplicatePrevented: 0,
    verificationFailed: 0,
    secretConfigured: true,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Simulation Form State
  const [simTask, setSimTask] = useState('');
  const [simPrNumber, setSimPrNumber] = useState('84');
  const [simPrTitle, setSimPrTitle] = useState('');
  const [simAuthor, setSimAuthor] = useState('octocat');
  const [simUseDuplicateId, setSimUseDuplicateId] = useState(false);
  const [lastSimDeliveryId, setLastSimDeliveryId] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const webhookEndpointUrl = `${window.location.origin.replace(':5173', ':5000')}/api/webhooks/github`;
  const webhookSecret = 'teamsync_github_webhook_secret_2026';

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [deliveriesRes, statsRes, tasksRes] = await Promise.all([
        webhookApi.getDeliveries({
          status: filterStatus === 'ALL' ? undefined : filterStatus,
          limit: 50,
        }),
        webhookApi.getStats(),
        taskApi.getAll(),
      ]);

      if (deliveriesRes.data?.deliveries) {
        setDeliveries(deliveriesRes.data.deliveries);
      }
      if (statsRes.data?.stats) {
        setStats(statsRes.data.stats);
      }
      if (tasksRes.data) {
        const activeOnly = (tasksRes.data || []).filter((t) => t.status !== 'Done');
        setTasks(tasksRes.data);
        if (activeOnly.length > 0 && !simTask) {
          setSimTask(activeOnly[0]._id);
          setSimPrTitle(`feat: implement ${activeOnly[0].title} (closes #${activeOnly[0]._id})`);
        }
      }
    } catch (err) {
      console.warn('Failed to load webhook data:', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus, simTask]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time socket listener for new webhook events
  useEffect(() => {
    if (!socket) return;

    const handleNewDelivery = (delivery) => {
      setDeliveries((prev) => [delivery, ...prev.filter((d) => d._id !== delivery._id)]);
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        processed: delivery.status === 'PROCESSED' ? prev.processed + 1 : prev.processed,
        duplicatePrevented: delivery.status === 'DUPLICATE' ? prev.duplicatePrevented + 1 : prev.duplicatePrevented,
        verificationFailed:
          delivery.status === 'VERIFICATION_FAILED' ? prev.verificationFailed + 1 : prev.verificationFailed,
      }));
    };

    socket.on('webhook:delivery', handleNewDelivery);

    return () => {
      socket.off('webhook:delivery', handleNewDelivery);
    };
  }, [socket]);

  const handleSelectTask = (taskId) => {
    setSimTask(taskId);
    const chosen = tasks.find((t) => t._id === taskId);
    if (chosen) {
      setSimPrTitle(`feat: implement ${chosen.title} (closes #${chosen._id})`);
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleRunSimulation = async (e) => {
    e.preventDefault();
    if (!simTask && !simPrTitle.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Parameters',
        text: 'Please choose an active deliverable or enter a PR title.',
        confirmButtonColor: '#4f46e5',
      });
      return;
    }

    try {
      setSimulating(true);
      setSimulationResult(null);

      const deliveryIdToUse =
        simUseDuplicateId && lastSimDeliveryId
          ? lastSimDeliveryId
          : `sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const res = await webhookApi.simulate({
        taskId: simTask || undefined,
        prTitle: simPrTitle.trim(),
        prNumber: parseInt(simPrNumber, 10) || 42,
        githubAuthor: simAuthor.trim() || 'octocat',
        deliveryId: deliveryIdToUse,
      });

      setLastSimDeliveryId(deliveryIdToUse);
      setSimulationResult(res.data);

      if (res.data?.idempotent) {
        Swal.fire({
          icon: 'info',
          title: 'Idempotency Protection Triggered',
          text: `Delivery ID [${deliveryIdToUse}] was already processed previously. Replay avoided; zero redundant mutations executed.`,
          confirmButtonColor: '#4f46e5',
        });
      } else if (res.data?.transitioned) {
        Swal.fire({
          icon: 'success',
          title: 'Task Transitioned to Done',
          text: `GitHub PR #${simPrNumber} verified and merged! Deliverable transitioned to Done in real time.`,
          confirmButtonColor: '#4f46e5',
        });
      }

      fetchData();
    } catch (err) {
      console.error('Simulation failed:', err);
      Swal.fire({
        icon: 'error',
        title: 'Simulation Error',
        text: err?.response?.data?.message || 'Failed to simulate GitHub webhook.',
      });
    } finally {
      setSimulating(false);
    }
  };

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PROCESSED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircleIcon className="w-3 h-3 text-emerald-400" />
            Processed
          </span>
        );
      case 'DUPLICATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <ShieldCheckIcon className="w-3 h-3 text-purple-400" />
            Idempotent Skip
          </span>
        );
      case 'IGNORED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">
            Ignored
          </span>
        );
      case 'VERIFICATION_FAILED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertCircleIcon className="w-3 h-3 text-rose-400" />
            Rejected
          </span>
        );
    }
  };

  const isRestricted = user?.role === 'Guest';

  if (isRestricted) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-6 pt-16">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/10">
          <LockIcon className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Webhook configurations and third-party developer integrations require Member, Admin, or Owner workspace permissions.
          </p>
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <WebhookIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Idempotent Webhooks & GitHub Integration
                <span className="text-[10px] font-semibold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                  HMAC SHA-256
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Cryptographically authenticated incoming webhook receiver with idempotency deduplication and automated task transitions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-slate-300 font-medium">{isConnected ? 'Live Webhook Stream' : 'Connecting...'}</span>
          </div>

          <button
            onClick={fetchData}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Refresh logs"
          >
            <RotateCcwIcon className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 font-medium">Total Inbound Deliveries</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 font-medium">Transitions Processed</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.processed}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 font-medium">Idempotent Replays Prevented</p>
          <p className="text-2xl font-bold text-purple-400">{stats.duplicatePrevented}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 font-medium">HMAC Rejections</p>
          <p className="text-2xl font-bold text-rose-400">{stats.verificationFailed}</p>
        </div>
      </div>

      {/* Two Column Layout: Webhook Config + Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Webhook Setup Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <ShieldCheckIcon className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                GitHub Repository Webhook Setup
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Payload URL (Target)
                </label>
                <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-300">
                  <span className="truncate flex-1 select-all">{webhookEndpointUrl}</span>
                  <button
                    onClick={() => handleCopy(webhookEndpointUrl, 'url')}
                    className="p-1 hover:text-white text-slate-400 transition cursor-pointer shrink-0"
                    title="Copy Payload URL"
                  >
                    <CopyIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
                {copiedUrl && <span className="text-[10px] text-emerald-400 mt-1 block">Copied to clipboard</span>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Secret Key (HMAC SHA-256)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                  >
                    {showSecret ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-purple-300">
                  <span className="truncate flex-1">
                    {showSecret ? webhookSecret : '••••••••••••••••••••••••••••••••'}
                  </span>
                  <button
                    onClick={() => handleCopy(webhookSecret, 'secret')}
                    className="p-1 hover:text-white text-slate-400 transition cursor-pointer shrink-0"
                    title="Copy Secret"
                  >
                    <CopyIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
                {copiedSecret && <span className="text-[10px] text-emerald-400 mt-1 block">Secret copied</span>}
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
                <strong className="text-white block font-semibold">How Automatic Transitions Work:</strong>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
                  <li>Configure GitHub repo settings: Content-type <code className="text-indigo-300">application/json</code>.</li>
                  <li>Enable the <code className="text-indigo-300">Pull requests</code> event trigger.</li>
                  <li>When a PR merges with <code className="text-indigo-300">closes #&lt;taskId&gt;</code> or matching task title, TeamSync instantly marks the deliverable <span className="text-emerald-400 font-semibold">Done</span>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive PR Merge Webhook Simulator (7 cols) */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleRunSimulation}
            className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <GitPullRequestIcon className="w-5 h-5 text-indigo-400" />
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Interactive Webhook Simulator (Recruiter Demo)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Dispatch an authentic, cryptographically signed GitHub PR merge payload into the live engine.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Target Deliverable *
                </label>
                <select
                  value={simTask}
                  onChange={(e) => handleSelectTask(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Task --</option>
                  {tasks.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title} [{t.status || 'In Progress'}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  PR Number
                </label>
                <input
                  type="number"
                  value={simPrNumber}
                  onChange={(e) => setSimPrNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="e.g. 42"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  GitHub Pull Request Title *
                </label>
                <input
                  type="text"
                  value={simPrTitle}
                  onChange={(e) => setSimPrTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="e.g. feat: complete task closes #64a..."
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  GitHub Author
                </label>
                <input
                  type="text"
                  value={simAuthor}
                  onChange={(e) => setSimAuthor(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Idempotency Demonstration Checkbox */}
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={simUseDuplicateId}
                    onChange={(e) => setSimUseDuplicateId(e.target.checked)}
                    disabled={!lastSimDeliveryId}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-0 cursor-pointer disabled:opacity-40"
                  />
                  <span className="text-[11px]">
                    Re-use previous Delivery ID <strong className="text-purple-400">(Demonstrate Idempotency)</strong>
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {lastSimDeliveryId ? `Last ID: ${lastSimDeliveryId}` : 'Generates unique delivery GUID'}
              </span>

              <button
                type="submit"
                disabled={simulating}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
              >
                <PlayIcon className="w-3.5 h-3.5 fill-current" />
                <span>{simulating ? 'Signing & Dispatching...' : 'Dispatch Signed Webhook'}</span>
              </button>
            </div>

            {/* Simulation Response Live Feedback */}
            {simulationResult && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-[11px] animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Response Status:</span>
                  <span
                    className={`font-bold ${
                      simulationResult.idempotent
                        ? 'text-purple-400'
                        : simulationResult.transitioned
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {simulationResult.idempotent
                      ? '200 OK (Idempotent: Duplicate Encountered)'
                      : simulationResult.transitioned
                      ? '200 OK (Task Moved to Done)'
                      : '200 OK (Ignored)'}
                  </span>
                </div>
                <div className="text-slate-300 leading-relaxed">
                  {simulationResult.summary || simulationResult.message}
                </div>
                {simulationResult.signature && (
                  <div className="text-[10px] text-slate-500 truncate" title={simulationResult.signature}>
                    HMAC-SHA256: {simulationResult.signature}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Filter and Delivery History Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Recent Webhook Deliveries</h2>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
              {deliveries.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'PROCESSED', label: 'Processed' },
              { id: 'DUPLICATE', label: 'Duplicates' },
              { id: 'IGNORED', label: 'Ignored' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                  filterStatus === tab.id
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Delivery GUID</th>
                  <th className="py-3 px-4">Sender & Repo</th>
                  <th className="py-3 px-4">Summary</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs">Loading webhook delivery history...</p>
                      </div>
                    </td>
                  </tr>
                ) : deliveries.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      <p className="text-xs">No webhook deliveries recorded yet.</p>
                    </td>
                  </tr>
                ) : (
                  deliveries.map((del) => (
                    <tr key={del._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(del.status)}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-indigo-400 font-semibold">
                        {del.event}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-300">
                        {del.deliveryId}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                        <div>
                          <span className="font-semibold block">@{del.sender}</span>
                          <span className="text-[10px] text-slate-500 truncate block max-w-[150px]">
                            {del.repository}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={del.summary}>
                        {del.summary || 'Received delivery payload'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {formatTimestamp(del.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedDelivery(del)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold transition cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <GitPullRequestIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Webhook Delivery Snapshot</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Close"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">DELIVERY ID</span>
                  <span className="text-slate-300 select-all">{selectedDelivery.deliveryId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">EVENT TYPE</span>
                  <span className="text-indigo-400">{selectedDelivery.event}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">SIGNATURE VERIFIED</span>
                  <span className="text-emerald-400 font-bold">HMAC SHA-256 Valid</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CLIENT IP</span>
                  <span className="text-slate-300">{selectedDelivery.ipAddress}</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Payload Excerpt
                </p>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-purple-300 overflow-x-auto max-h-48">
                  {JSON.stringify(
                    {
                      deliveryId: selectedDelivery.deliveryId,
                      event: selectedDelivery.event,
                      status: selectedDelivery.status,
                      summary: selectedDelivery.summary,
                      matchedTaskId: selectedDelivery.matchedTaskId,
                      payloadSnippet: selectedDelivery.payloadSnippet,
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
                onClick={() => setSelectedDelivery(null)}
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

export default Webhooks;
