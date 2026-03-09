import { create } from 'zustand';

export interface DeviceConfig {
  type: 'android' | 'windows';
  version: string;
  screenResolution: string;
  orientation?: 'portrait' | 'landscape';
  deviceModel?: string;
  ram: string;
  cpu: string;
  language: string;
  sessionDuration: number;
  networkSpeed?: string;
  performanceMode?: 'balanced' | 'high-performance' | 'battery-saver';
  resetSandboxState?: boolean;
  locationCity?: string;
  latitude?: number;
  longitude?: number;
}

export interface Session {
  id: string;
  deviceConfig: DeviceConfig;
  status: 'pending' | 'starting' | 'running' | 'stopping' | 'stopped';
  createdAt: Date;
  expiresAt: Date;
  vmId?: string;
  streamUrl?: string;
}

interface SessionState {
  sessions: Session[];
  activeSession: Session | null;
  addSession: (session: Session) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  setActiveSession: (session: Session | null) => void;
  removeSession: (sessionId: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  activeSession: null,
  addSession: (session) =>
    set((state) => ({
      sessions: [...state.sessions, session],
    })),
  updateSession: (sessionId, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
      activeSession:
        state.activeSession?.id === sessionId
          ? { ...state.activeSession, ...updates }
          : state.activeSession,
    })),
  setActiveSession: (session) => set({ activeSession: session }),
  removeSession: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      activeSession:
        state.activeSession?.id === sessionId ? null : state.activeSession,
    })),
}));
