import { useEffect, useState } from 'react';
import { Activity, Server, Users, AlertTriangle, Database, ShieldAlert, MonitorSmartphone } from 'lucide-react';
import { apiClient } from '../services/api';
import { Session } from '../store/sessionStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminPanel() {
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsData, statsData, logsData] = await Promise.all([
        apiClient.getActiveSessions(),
        apiClient.getSystemStats(),
        apiClient.getSystemLogs(50),
      ]);

      setActiveSessions(sessionsData);
      setStats(statsData);
      setLogs(logsData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const cpuData = stats?.cpuHistory || [];
  const memoryData = stats?.memoryHistory || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2 text-white">Admin Dashboard</h1>
      <p className="text-slate-400 mb-8">Operational monitoring for cloud device sessions, performance, and security posture.</p>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active Sessions</p>
              <p className="text-3xl font-bold mt-1 text-white">{stats?.activeSessions || 0}</p>
            </div>
            <Users className="w-10 h-10 text-primary-300" />
          </div>
        </div>

        <div className="card p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Running Devices</p>
              <p className="text-3xl font-bold mt-1 text-white">{activeSessions.filter((s) => s.status === 'running').length}</p>
            </div>
            <MonitorSmartphone className="w-10 h-10 text-cyan-300" />
          </div>
        </div>

        <div className="card p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">CPU Usage</p>
              <p className="text-3xl font-bold mt-1 text-white">{stats?.cpuUsage || 0}%</p>
            </div>
            <Activity className="w-10 h-10 text-emerald-300" />
          </div>
        </div>

        <div className="card p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Server Load</p>
              <p className="text-3xl font-bold mt-1 text-white">{stats?.memoryUsage || 0}%</p>
            </div>
            <Database className="w-10 h-10 text-blue-300" />
          </div>
        </div>

        <div className="card p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Session Logs</p>
              <p className="text-3xl font-bold mt-1 text-white">{logs.length}</p>
            </div>
            <Server className="w-10 h-10 text-purple-300" />
          </div>
        </div>

        <div className="card p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Security Alerts</p>
              <p className="text-3xl font-bold mt-1 text-white">{stats?.alerts?.length || 0}</p>
            </div>
            <ShieldAlert className="w-10 h-10 text-red-300" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6 border border-white/10">
          <h2 className="text-lg font-semibold mb-4 text-white">CPU Usage (Last Hour)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={cpuData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6 border border-white/10">
          <h2 className="text-lg font-semibold mb-4 text-white">Memory Usage (Last Hour)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={memoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="card p-6 mb-8 border border-white/10">
        <h2 className="text-lg font-semibold mb-4 text-white">Active Sessions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-slate-300">
                <th className="text-left py-3 px-4">Session ID</th>
                <th className="text-left py-3 px-4">Device Type</th>
                <th className="text-left py-3 px-4">Version</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Started</th>
                <th className="text-left py-3 px-4">Expires</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.map((session) => (
                <tr key={session.id} className="border-b border-white/5 text-slate-300">
                  <td className="py-3 px-4 font-mono text-sm">{session.id.substring(0, 8)}</td>
                  <td className="py-3 px-4 capitalize">{session.deviceConfig.type}</td>
                  <td className="py-3 px-4">{session.deviceConfig.version}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        session.status === 'running'
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-yellow-500/20 text-yellow-500'
                      }`}
                    >
                      {session.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {new Date(session.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {new Date(session.expiresAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {activeSessions.length === 0 && (
            <p className="text-center py-8 text-slate-400">No active sessions</p>
          )}
        </div>
      </div>

      {/* System Logs */}
      <div className="card p-6 border border-white/10">
        <h2 className="text-lg font-semibold mb-4 text-white">System Logs</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 text-sm p-2 hover:bg-slate-800/60 rounded"
            >
              <span className="text-slate-500 font-mono">{log.timestamp}</span>
              <span
                className={`font-medium ${
                  log.level === 'error'
                    ? 'text-red-500'
                    : log.level === 'warn'
                    ? 'text-yellow-500'
                    : 'text-slate-400'
                }`}
              >
                [{log.level}]
              </span>
              <span className="flex-1 text-slate-300">{log.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts Section */}
      {stats?.alerts && stats.alerts.length > 0 && (
        <div className="card p-6 mt-8 border border-red-400/40 bg-red-950/20">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-semibold text-white">Active Alerts</h2>
          </div>
          <div className="space-y-2">
            {stats.alerts.map((alert: any, index: number) => (
              <div key={index} className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                <p className="text-sm text-red-700 dark:text-red-300">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
