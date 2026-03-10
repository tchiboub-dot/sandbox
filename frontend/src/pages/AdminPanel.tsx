import { useEffect, useState, useCallback } from 'react';
import {
  Activity, Users, Database, MonitorSmartphone,
  Clock3, Signal, Wifi, Zap, Bell, RefreshCw, Settings,
  RotateCcw, Trash2, Eye, CheckCircle, AlertCircle, XCircle
} from 'lucide-react';
import { apiClient } from '../services/api';
import { Session } from '../store/sessionStore';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import '../styles/EnhancedAdminDashboard.css';

// =======================
// Type Definitions
// =======================

interface SystemStats {
  activeSessions: number;
  runningDevices: number;
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage: number;
  networkTraffic: number;
  activeStreams: number;
  vmProvisionTime: number;
  latencyMs: number;
  cpuHistory: Array<{ time: string; value: number }>;
  memoryHistory: Array<{ time: string; value: number }>;
  alerts: Array<any>;
  systemStatus: 'operational' | 'degraded' | 'outage';
}

interface SecurityEvent {
  id: string;
  timestamp: string;
  event: string;
  severity: 'info' | 'warning' | 'critical';
  source: string;
}

interface AdminAction {
  id: string;
  timestamp: string;
  admin: string;
  action: string;
  target: string;
  result: 'success' | 'failure';
}

interface SystemLog {
  timestamp: string;
  event: string;
  severity: 'info' | 'warning' | 'error';
  source: string;
  details?: string;
}

// =======================
// Enhanced Admin Panel
// =======================

export default function EnhancedAdminPanel() {
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [
        sessionsData,
        statsData,
        logsData,
        securityData,
        adminActionsData,
        notificationsData
      ] = await Promise.all([
        apiClient.getActiveSessions(),
        apiClient.getSystemStats(),
        apiClient.getSystemLogs(100),
        fetchSecurityEvents(),
        fetchAdminActions(),
        fetchNotifications()
      ]);

      setActiveSessions(sessionsData);
      setStats(statsData);
      setLogs(logsData);
      setSecurityEvents(securityData);
      setAdminActions(adminActionsData);
      setNotifications(notificationsData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Mock data fetchers - replace with real API calls
  const fetchSecurityEvents = async (): Promise<SecurityEvent[]> => {
    return [
      {
        id: '1',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        event: 'Unauthorized launch attempt from IP 192.168.1.100',
        severity: 'warning',
        source: 'API Gateway'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        event: 'High session creation rate detected',
        severity: 'warning',
        source: 'Rate Limiter'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        event: 'Blocked IP address 203.0.113.42',
        severity: 'info',
        source: 'WAF'
      }
    ];
  };

  const fetchAdminActions = async (): Promise<AdminAction[]> => {
    return [
      {
        id: '1',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        admin: 'admin@example.com',
        action: 'Terminated session',
        target: 'sess-12345678',
        result: 'success'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        admin: 'admin@example.com',
        action: 'Restarted device',
        target: 'dev-87654321',
        result: 'success'
      }
    ];
  };

  const fetchNotifications = async (): Promise<any[]> => {
    return [
      {
        id: '1',
        title: 'High CPU usage detected',
        message: 'CPU usage exceeded 85% threshold',
        severity: 'warning',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: false
      },
      {
        id: '2',
        title: 'Node restart completed',
        message: 'Node-3 restart completed successfully',
        severity: 'info',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        read: true
      }
    ];
  };

  // Action handlers
  const handleTerminateSession = async (sessionId: string) => {
    console.log('Terminating session:', sessionId);
    // TODO: Implement API call
  };

  const handleRestartDevice = async (sessionId: string) => {
    console.log('Restarting device:', sessionId);
    // TODO: Implement API call
  };

  const handleViewStream = (sessionId: string) => {
    console.log('Viewing stream for:', sessionId);
    // TODO: Navigate to stream view
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loader">
        <div className="loader-spinner"></div>
      </div>
    );
  }

  const systemStatus = stats?.systemStatus || 'operational';
  const statusColor = systemStatus === 'operational' ? 'green' : systemStatus === 'degraded' ? 'yellow' : 'red';
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-top">
          <div className="header-left">
            <h1 className="dashboard-title">Infrastructure Control Center</h1>
            <p className="dashboard-subtitle">Real-time monitoring and administration</p>
          </div>
          <div className="header-right">
            <div className="header-controls">
              <button
                className="control-btn"
                onClick={() => setAutoRefresh(!autoRefresh)}
                title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
              >
                <RefreshCw size={18} className={autoRefresh ? 'spinning' : ''} />
                <span>{autoRefresh ? 'Live' : 'Paused'}</span>
              </button>
              <div className="notification-bell">
                <button
                  className="bell-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell size={20} />
                  {unreadNotifications > 0 && (
                    <span className="notification-badge">{unreadNotifications}</span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationPanel
                    notifications={notifications}
                    onClose={() => setShowNotifications(false)}
                  />
                )}
              </div>
              <button className="control-btn" title="Settings">
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* System Status Bar */}
        <div className="status-bar">
          <div className={`status-indicator status-${statusColor}`}>
            {statusColor === 'green' && <CheckCircle size={16} />}
            {statusColor === 'yellow' && <AlertCircle size={16} />}
            {statusColor === 'red' && <XCircle size={16} />}
            <span>System Status: {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}</span>
          </div>
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>Live Monitoring</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          Sessions
        </button>
        <button
          className={`tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab stats={stats} activeSessions={activeSessions} />
        )}
        {activeTab === 'sessions' && (
          <SessionsTab
            sessions={activeSessions}
            onTerminate={handleTerminateSession}
            onRestart={handleRestartDevice}
            onViewStream={handleViewStream}
            selectedSession={selectedSession}
            onSelectSession={setSelectedSession}
          />
        )}
        {activeTab === 'security' && (
          <SecurityTab
            securityEvents={securityEvents}
            adminActions={adminActions}
          />
        )}
        {activeTab === 'logs' && (
          <LogsTab logs={logs} />
        )}
      </div>
    </div>
  );
}

// =======================
// Tab Components
// =======================

function OverviewTab({ stats, activeSessions }: { stats: SystemStats | null; activeSessions: Session[] }) {
  if (!stats) return null;

  const deviceTypeDistribution = [
    { name: 'Android', value: activeSessions.filter(s => s.deviceConfig.type === 'android').length },
    { name: 'Windows', value: activeSessions.filter(s => s.deviceConfig.type === 'windows').length },
  ].filter(d => d.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

  return (
    <div className="overview-tab">
      {/* Metrics Grid */}
      <div className="metrics-grid">
        <MetricCard
          icon={<Users size={20} />}
          label="Active Sessions"
          value={stats.activeSessions}
          color="blue"
          live
        />
        <MetricCard
          icon={<MonitorSmartphone size={20} />}
          label="Running Devices"
          value={stats.runningDevices}
          color="cyan"
          live
        />
        <MetricCard
          icon={<Activity size={20} />}
          label="CPU Usage"
          value={`${stats.cpuUsage}%`}
          color="green"
          live
        />
        <MetricCard
          icon={<Database size={20} />}
          label="Memory Usage"
          value={`${stats.memoryUsage}%`}
          color="purple"
          live
        />
        <MetricCard
          icon={<Zap size={20} />}
          label="GPU Usage"
          value={`${stats.gpuUsage}%`}
          color="amber"
          live
        />
        <MetricCard
          icon={<Wifi size={20} />}
          label="Network Traffic"
          value={`${stats.networkTraffic.toFixed(1)} GB/s`}
          color="indigo"
          live
        />
        <MetricCard
          icon={<Signal size={20} />}
          label="Active Streams"
          value={stats.activeStreams}
          color="pink"
          live
        />
        <MetricCard
          icon={<Clock3 size={20} />}
          label="Provision Time"
          value={`${stats.vmProvisionTime.toFixed(1)}s`}
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="section-header">
          <h2>Performance Metrics</h2>
          <div className="time-range-selector">
            {['15m', '1h', '24h'].map(range => (
              <button
                key={range}
                className={`range-btn ${range === '1h' ? 'active' : ''}`}
                onClick={() => console.log('Time range:', range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="charts-grid">
          <ChartCard title="CPU Usage (Last Hour)">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats.cpuHistory}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                <Area type="monotone" dataKey="value" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorCpu)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Memory Usage (Last Hour)">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats.memoryHistory}>
                <defs>
                  <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorMemory)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Resource Distribution */}
      {deviceTypeDistribution.length > 0 && (
        <div className="resource-section">
          <h2>Device Type Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {deviceTypeDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Resource Capacity */}
      <ResourceCapacityPanel stats={stats} />
    </div>
  );
}

function SessionsTab({
  sessions,
  onTerminate,
  onRestart,
  onViewStream,
  selectedSession,
  onSelectSession
}: any) {
  if (sessions.length === 0) {
    return (
      <div className="empty-state">
        <Users size={48} />
        <h3>No Active Sessions</h3>
        <p>All devices are currently idle. Users can launch new sessions anytime.</p>
      </div>
    );
  }

  return (
    <div className="sessions-tab">
      <div className="sessions-table-container">
        <table className="sessions-table">
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Device Type</th>
              <th>Version</th>
              <th>Region</th>
              <th>IP Address</th>
              <th>Status</th>
              <th>Started</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session: Session) => (
              <tr key={session.id} className={`session-row ${selectedSession === session.id ? 'selected' : ''}`}>
                <td className="session-id">
                  <button
                    onClick={() => onSelectSession(selectedSession === session.id ? null : session.id)}
                  >
                    {session.id.substring(0, 8)}
                  </button>
                </td>
                <td className="capitalize">{session.deviceConfig.type}</td>
                <td>{session.deviceConfig.version}</td>
                <td>North America</td>
                <td className="font-mono text-sm">192.168.1.100</td>
                <td>
                  <StatusBadge status={session.status} />
                </td>
                <td className="text-sm">{new Date(session.createdAt).toLocaleTimeString()}</td>
                <td className="text-sm">{new Date(session.expiresAt).toLocaleTimeString()}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn view"
                      onClick={() => onViewStream(session.id)}
                      title="View Stream"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="action-btn restart"
                      onClick={() => onRestart(session.id)}
                      title="Restart Device"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      className="action-btn terminate"
                      onClick={() => onTerminate(session.id)}
                      title="Terminate Session"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SecurityTab({
  securityEvents,
  adminActions
}: {
  securityEvents: SecurityEvent[];
  adminActions: AdminAction[];
}) {
  return (
    <div className="security-tab">
      <div className="security-grid">
        <div className="security-section">
          <h2>Security Events</h2>
          {securityEvents.length === 0 ? (
            <div className="empty-state-small">
              <p>No security events</p>
            </div>
          ) : (
            <div className="events-list">
              {securityEvents.map(event => (
                <div key={event.id} className={`event-item severity-${event.severity}`}>
                  <div className="event-header">
                    <span className="event-time">{new Date(event.timestamp).toLocaleTimeString()}</span>
                    <span className={`event-severity severity-${event.severity}`}>{event.severity}</span>
                  </div>
                  <p className="event-message">{event.event}</p>
                  <p className="event-source">Source: {event.source}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="security-section">
          <h2>Admin Activity</h2>
          {adminActions.length === 0 ? (
            <div className="empty-state-small">
              <p>No admin actions recorded</p>
            </div>
          ) : (
            <div className="events-list">
              {adminActions.map(action => (
                <div key={action.id} className={`event-item result-${action.result}`}>
                  <div className="event-header">
                    <span className="event-time">{new Date(action.timestamp).toLocaleTimeString()}</span>
                    <span className={`result-badge result-${action.result}`}>{action.result}</span>
                  </div>
                  <p className="event-message">{action.action}</p>
                  <p className="event-source">Admin: {action.admin} | Target: {action.target}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LogsTab({ logs }: { logs: SystemLog[] }) {
  const [filter, setFilter] = useState('all');

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(log => log.severity === filter);

  return (
    <div className="logs-tab">
      <div className="logs-header">
        <h2>System Logs</h2>
        <div className="log-filters">
          {['all', 'info', 'warning', 'error'].map(type => (
            <button
              key={type}
              className={`filter-btn ${filter === type ? 'active' : ''}`}
              onClick={() => setFilter(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="logs-list">
        {filteredLogs.length === 0 ? (
          <div className="empty-state-small">
            <p>No logs matching this filter</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={index} className={`log-entry severity-${log.severity}`}>
              <div className="log-line">
                <span className="log-time">{log.timestamp}</span>
                <span className={`log-severity severity-${log.severity}`}>[{log.severity.toUpperCase()}]</span>
                <span className="log-event">{log.event}</span>
                <span className="log-source">{log.source}</span>
              </div>
              {log.details && <div className="log-details">{log.details}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// =======================
// Utility Components
// =======================

function MetricCard({
  icon,
  label,
  value,
  color,
  live
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  live?: boolean;
}) {
  return (
    <div className={`metric-card color-${color}`}>
      <div className="metric-header">
        <div className="metric-label">{label}</div>
        {live && <span className="live-badge">LIVE</span>}
      </div>
      <div className="metric-content">
        <div className="metric-icon">{icon}</div>
        <div className="metric-value">{value}</div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusClass = status === 'running' ? 'running' : status === 'paused' ? 'paused' : 'stopped';
  return <span className={`status-badge status-${statusClass}`}>{status}</span>;
}

function NotificationPanel({
  notifications,
  onClose
}: {
  notifications: any[];
  onClose: () => void;
}) {
  return (
    <div className="notification-panel">
      <div className="panel-header">
        <h3>Notifications</h3>
        <button onClick={onClose}>×</button>
      </div>
      <div className="panel-content">
        {notifications.length === 0 ? (
          <p className="empty-message">No notifications</p>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className={`notification-item severity-${notif.severity}`}>
              <div className="notif-title">{notif.title}</div>
              <div className="notif-message">{notif.message}</div>
              <div className="notif-time">{new Date(notif.timestamp).toLocaleTimeString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ResourceCapacityPanel({
  stats
}: {
  stats: SystemStats;
}) {
  const maxDevices = 50;
  const maxStreams = 20;
  const vmCapacityPercent = 80;

  const capacityData = [
    {
      label: 'Running Devices',
      current: stats.runningDevices,
      max: maxDevices,
      percent: (stats.runningDevices / maxDevices) * 100
    },
    {
      label: 'Active Streams',
      current: stats.activeStreams,
      max: maxStreams,
      percent: (stats.activeStreams / maxStreams) * 100
    },
    {
      label: 'VM Capacity',
      current: vmCapacityPercent,
      max: 100,
      percent: vmCapacityPercent
    }
  ];

  return (
    <div className="capacity-panel">
      <h2>Resource Capacity</h2>
      <div className="capacity-grid">
        {capacityData.map((item, index) => (
          <div key={index} className="capacity-item">
            <div className="capacity-header">
              <span className="capacity-label">{item.label}</span>
              <span className="capacity-count">{item.current} / {item.max}</span>
            </div>
            <div className="capacity-bar">
              <div
                className={`capacity-fill ${item.percent > 80 ? 'warning' : item.percent > 60 ? 'caution' : ''}`}
                style={{ width: `${Math.min(item.percent, 100)}%` }}
              ></div>
            </div>
            <div className="capacity-percent">{item.percent.toFixed(0)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
