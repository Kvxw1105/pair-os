import { useReducer, useEffect, createContext, useContext, useCallback, useRef, useState } from 'react';
import { api } from '../services/api';
import type {
  AppState, AppAction, ActionItem, ActionEvent, UserProfile, Partner,
} from '../types';

const STORAGE_KEY = 'pair_os_state_v1';

const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => Date.now();

export const createDefaultProfile = (): UserProfile => ({
  id: generateId(),
  name: '我',
  avatar: null,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  createdAt: now(),
  onboardingCompleted: false,
  mainLine: null,
  deadline: null,
  subLines: [],
  preferences: {
    likesTimer: true,
    defaultVisibility: 'solo',
    reminderEnabled: true,
    doNotDisturbStart: null,
    doNotDisturbEnd: null,
    maxDailyReminders: 5,
  },
});

const defaultPartner: Partner = {
  id: 'partner_1',
  name: '小K',
  avatar: null,
  status: 'active',
  currentActionTitle: '阅读《深度学习》第3章',
  lastActiveAt: now() - 5 * 60 * 1000,
};

const mockActions: ActionItem[] = [];
const mockEvents: ActionEvent[] = [];

function getInitialState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AppState;
      if (parsed.profile && parsed.actions) {
        if (!parsed.theme) parsed.theme = 'system';
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return {
    profile: createDefaultProfile(),
    actions: mockActions,
    events: mockEvents,
    partner: defaultPartner,
    partnerPending: false,
    reminders: [],
    isOnboarding: true,
    theme: 'system',
    checkIn: null,
    partnerMessages: [],
  };
}

function appReducer(state: AppState, action: AppAction): AppState {
  const next = (partial: Partial<AppState>): AppState => ({ ...state, ...partial });

  switch (action.type) {
    case 'INIT': return action.state;

    case 'SET_PROFILE': return next({ profile: action.profile });

    case 'UPDATE_PROFILE': {
      if (!state.profile) return state;
      return next({ profile: { ...state.profile, ...action.updates } });
    }

    case 'COMPLETE_ONBOARDING': {
      if (!state.profile) return state;
      const profile: UserProfile = {
        ...state.profile,
        onboardingCompleted: true,
        mainLine: action.mainLine,
        deadline: action.deadline,
        subLines: action.subLines,
      };
      return next({ profile, isOnboarding: false });
    }

    case 'LOGIN_SUCCESS': {
      const { token, user } = action;
      api.setToken(token);
      const profile: UserProfile = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: now(),
        onboardingCompleted: true,
        mainLine: null,
        deadline: null,
        subLines: [],
        preferences: {
          likesTimer: true,
          defaultVisibility: 'solo',
          reminderEnabled: true,
          doNotDisturbStart: null,
          doNotDisturbEnd: null,
          maxDailyReminders: 5,
        },
      };
      return next({ profile, isOnboarding: false });
    }

    case 'LOGOUT': {
      api.logout();
      return getInitialState();
    }

    case 'SYNC_ACTIONS': {
      return next({ actions: action.actions });
    }

    case 'SYNC_PARTNER': {
      return next({ partner: action.partner });
    }

    case 'START_ACTION': {
      const activeExists = state.actions.some(
        (a) => a.userId === state.profile?.id && a.state === 'active'
      );
      const newAction: ActionItem = {
        id: generateId(), title: action.title, state: 'active',
        startedAt: now(), endedAt: null, totalDurationMs: 0, awayDurationMs: 0,
        lastAwayAt: null, awayReason: null, blockedReason: null,
        result: null, resultNote: '', completionPercent: null,
        visibility: action.visibility,
        needsVerification: action.visibility === 'needs_verification',
        evidenceUrl: null, evidenceText: null,
        mainLine: state.profile?.mainLine || null, category: null, tags: [],
        createdAt: now(), updatedAt: now(), userId: state.profile?.id || 'me',
      };
      const events: ActionEvent[] = [
        ...state.events,
        { id: generateId(), actionId: newAction.id, type: 'created', timestamp: now() },
        { id: generateId(), actionId: newAction.id, type: 'started', timestamp: now() },
      ];
      if (activeExists) {
        const prevActive = state.actions.find(
          (a) => a.userId === state.profile?.id && a.state === 'active'
        );
        const updatedActions = state.actions.map((a) => {
          if (a.id === prevActive?.id) {
            const duration = now() - (a.startedAt || a.createdAt);
            return { ...a, state: 'completed' as const, endedAt: now(), totalDurationMs: a.totalDurationMs + duration, result: 'completed' as const, completionPercent: 100 as const, updatedAt: now() };
          }
          return a;
        });
        const endedEvent: ActionEvent = { id: generateId(), actionId: prevActive?.id || '', type: 'ended' as const, timestamp: now(), data: { result: 'completed' } };
        return next({ actions: [...updatedActions, newAction], events: [...events, endedEvent] });
      }
      return next({ actions: [...state.actions, newAction], events });
    }

    case 'AWAY_ACTION': {
      const updated = state.actions.map((a) => {
        if (a.id === action.actionId) {
          const elapsed = now() - (a.startedAt || a.createdAt);
          return { ...a, state: 'away' as const, totalDurationMs: a.totalDurationMs + elapsed, lastAwayAt: now(), awayReason: action.reason, updatedAt: now() };
        }
        return a;
      });
      const events: ActionEvent[] = [
        ...state.events,
        { id: generateId(), actionId: action.actionId, type: 'away' as const, timestamp: now(), data: { reason: action.reason } },
      ];
      return next({ actions: updated, events });
    }

    case 'RESUME_ACTION': {
      const updated = state.actions.map((a) => {
        if (a.id === action.actionId) {
          const awayTime = a.lastAwayAt ? now() - a.lastAwayAt : 0;
          return { ...a, state: 'active' as const, awayDurationMs: a.awayDurationMs + awayTime, startedAt: now(), lastAwayAt: null, updatedAt: now() };
        }
        return a;
      });
      const events: ActionEvent[] = [
        ...state.events,
        { id: generateId(), actionId: action.actionId, type: 'resumed' as const, timestamp: now() },
      ];
      return next({ actions: updated, events });
    }

    case 'BLOCK_ACTION': {
      const updated = state.actions.map((a) => {
        if (a.id === action.actionId) {
          const elapsed = now() - (a.startedAt || a.createdAt);
          return { ...a, state: 'blocked' as const, totalDurationMs: a.totalDurationMs + elapsed, blockedReason: action.reason, updatedAt: now() };
        }
        return a;
      });
      const events = [
        ...state.events,
        { id: generateId(), actionId: action.actionId, type: 'blocked' as const, timestamp: now(), data: { reason: action.reason } },
      ];
      return next({ actions: updated, events });
    }

    case 'UNBLOCK_ACTION': {
      const updated = state.actions.map((a) => {
        if (a.id === action.actionId) {
          return { ...a, state: 'active' as const, startedAt: now(), blockedReason: null, updatedAt: now() };
        }
        return a;
      });
      const events: ActionEvent[] = [
        ...state.events,
        { id: generateId(), actionId: action.actionId, type: 'unblocked' as const, timestamp: now() },
      ];
      return next({ actions: updated, events });
    }

    case 'END_ACTION': {
      const updated = state.actions.map((a) => {
        if (a.id === action.actionId) {
          const elapsed = a.state === 'active' ? now() - (a.startedAt || a.createdAt) : 0;
          return { ...a, state: action.result as ActionItem['state'], endedAt: now(), totalDurationMs: a.totalDurationMs + elapsed, result: action.result, resultNote: action.note, completionPercent: action.completionPercent as ActionItem['completionPercent'], updatedAt: now() };
        }
        return a;
      });
      const events = [
        ...state.events,
        { id: generateId(), actionId: action.actionId, type: 'ended' as const, timestamp: now(), data: { result: action.result } },
      ];
      return next({ actions: updated, events });
    }

    case 'SET_PARTNER': return next({ partner: action.partner, partnerPending: false });
    case 'INVITE_PARTNER': return next({ partnerPending: true });
    case 'REMOVE_PARTNER': return next({ partner: null, partnerPending: false });
    case 'ADD_REMINDER': return next({ reminders: [...state.reminders, action.reminder] });
    case 'CONFIRM_REMINDER': return next({ reminders: state.reminders.map((r) => r.id === action.reminderId ? { ...r, confirmed: true } : r) });
    case 'DISMISS_REMINDER': return next({ reminders: state.reminders.filter((r) => r.id !== action.reminderId) });
    case 'UPDATE_ACTION_TITLE': return next({ actions: state.actions.map((a) => a.id === action.actionId ? { ...a, title: action.title, updatedAt: now() } : a) });
    case 'UPDATE_ACTION_VISIBILITY': return next({ actions: state.actions.map((a) => a.id === action.actionId ? { ...a, visibility: action.visibility, updatedAt: now() } : a) });
    case 'DELETE_ACTION': return next({ actions: state.actions.filter((a) => a.id !== action.actionId) });
    case 'SET_THEME': return next({ theme: action.theme });
    case 'SET_CHECK_IN': return next({ checkIn: action.checkIn });
    case 'DO_CHECK_IN': return next({ checkIn: action.checkIn });
    case 'SET_PARTNER_MESSAGES': return next({ partnerMessages: action.messages });
    case 'ADD_PARTNER_MESSAGE': return next({ partnerMessages: [action.message, ...state.partnerMessages] });
    case 'MARK_MESSAGE_READ': return next({ partnerMessages: state.partnerMessages.map((m) => m.id === action.messageId ? { ...m, read: true } : m) });

    default: return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  api: typeof api;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, getInitialState());
  const syncRef = useRef(false);
  const [autoLoginChecked, setAutoLoginChecked] = useState(false);

  // Auto-login: if token exists, fetch user info
  useEffect(() => {
    if (autoLoginChecked) return;
    if (!api.isAuthenticated()) {
      setAutoLoginChecked(true);
      return;
    }
    api.getMe()
      .then((data) => {
        dispatch({ type: 'LOGIN_SUCCESS', token: api.isAuthenticated() ? localStorage.getItem('pair_os_token') || '' : '', user: data.user });
      })
      .catch(() => {
        api.logout();
      })
      .finally(() => setAutoLoginChecked(true));
  }, [autoLoginChecked]);

  // Persist to LocalStorage (always, even with API)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Sync with API when authenticated
  useEffect(() => {
    if (!api.isAuthenticated()) return;
    if (syncRef.current) return;
    syncRef.current = true;

    api.getActions().then((actions) => {
      dispatch({ type: 'SYNC_ACTIONS', actions: actions.map((a: any) => ({
        ...a,
        tags: a.tags ? JSON.parse(a.tags) : [],
        startedAt: a.startedAt ? new Date(a.startedAt).getTime() : null,
        endedAt: a.endedAt ? new Date(a.endedAt).getTime() : null,
        lastAwayAt: a.lastAwayAt ? new Date(a.lastAwayAt).getTime() : null,
        createdAt: new Date(a.createdAt).getTime(),
        updatedAt: new Date(a.updatedAt).getTime(),
      })) });
    }).catch(() => { /* fallback to local */ });

    api.getPartnerStatus().then((data) => {
      if (data.partner) {
        dispatch({ type: 'SET_PARTNER', partner: data.partner });
      }
    }).catch(() => { /* fallback to local */ });

    // Sync check-in status
    api.getCheckInStatus().then((data) => {
      dispatch({
        type: 'SET_CHECK_IN',
        checkIn: {
          checkedInToday: data.checkedInToday,
          streak: data.streak,
          todayDate: data.todayDate,
        },
      });
    }).catch(() => { /* fallback to local */ });
  }, []);

  // Apply theme to document
  useEffect(() => {
    const html = document.documentElement;
    if (state.theme === 'system') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', state.theme);
    }
  }, [state.theme]);

  // Poll partner messages every 30 seconds
  useEffect(() => {
    if (!api.isAuthenticated()) return;

    const pollMessages = async () => {
      try {
        const data = await api.getPartnerMessages();
        if (data.messages && data.messages.length > 0) {
          const messages = data.messages.map((m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt).getTime(),
          }));
          dispatch({ type: 'SET_PARTNER_MESSAGES', messages: [...messages, ...state.partnerMessages.filter((pm) => !messages.find((m: any) => m.id === pm.id))] });
        }
      } catch { /* ignore */ }
    };

    pollMessages();
    const interval = setInterval(pollMessages, 30000);
    return () => clearInterval(interval);
  }, [api.isAuthenticated(), state.partnerMessages.length]);

  return (
    <AppContext.Provider value={{ state, dispatch, api }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx.state;
}

export function useAppDispatch() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppDispatch must be used within AppProvider');
  return ctx.dispatch;
}

export function useApi() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApi must be used within AppProvider');
  return ctx.api;
}

export function useActionDispatch() {
  const dispatch = useAppDispatch();
  const api = useApi();
  const state = useAppState();

  return {
    async startAction(title: string, visibility: 'solo' | 'visible' | 'needs_verification') {
      if (api.isAuthenticated()) {
        try {
          const action = await api.createAction(title, visibility);
          dispatch({ type: 'SYNC_ACTIONS', actions: [...state.actions, {
            ...action,
            tags: action.tags ? JSON.parse(action.tags) : [],
            startedAt: action.startedAt ? new Date(action.startedAt).getTime() : null,
            endedAt: action.endedAt ? new Date(action.endedAt).getTime() : null,
            lastAwayAt: action.lastAwayAt ? new Date(action.lastAwayAt).getTime() : null,
            createdAt: new Date(action.createdAt).getTime(),
            updatedAt: new Date(action.updatedAt).getTime(),
          }] });
          return;
        } catch { /* fallback to local */ }
      }
      dispatch({ type: 'START_ACTION', title, visibility });
    },

    async awayAction(actionId: string, reason: string) {
      if (api.isAuthenticated()) {
        try {
          const action = await api.updateActionState(actionId, 'away', reason);
          dispatch({ type: 'AWAY_ACTION', actionId, reason: action.awayReason || reason });
          return;
        } catch { /* fallback to local */ }
      }
      dispatch({ type: 'AWAY_ACTION', actionId, reason: reason as any });
    },

    async resumeAction(actionId: string) {
      if (api.isAuthenticated()) {
        try {
          await api.updateActionState(actionId, 'active');
          dispatch({ type: 'RESUME_ACTION', actionId });
          return;
        } catch { /* fallback to local */ }
      }
      dispatch({ type: 'RESUME_ACTION', actionId });
    },

    async blockAction(actionId: string, reason: string) {
      if (api.isAuthenticated()) {
        try {
          await api.updateActionState(actionId, 'blocked', reason);
          dispatch({ type: 'BLOCK_ACTION', actionId, reason: reason as any });
          return;
        } catch { /* fallback to local */ }
      }
      dispatch({ type: 'BLOCK_ACTION', actionId, reason: reason as any });
    },

    async unblockAction(actionId: string) {
      if (api.isAuthenticated()) {
        try {
          await api.updateActionState(actionId, 'active');
          dispatch({ type: 'UNBLOCK_ACTION', actionId });
          return;
        } catch { /* fallback to local */ }
      }
      dispatch({ type: 'UNBLOCK_ACTION', actionId });
    },

    async logAction(title: string, durationMinutes: number, result: 'completed' | 'partial' | 'abandoned', completionPercent?: number | null, note?: string, visibility: 'solo' | 'visible' | 'needs_verification' = 'solo') {
      if (api.isAuthenticated()) {
        try {
          const action = await api.logAction(title, durationMinutes, result, completionPercent, note, visibility);
          dispatch({ type: 'SYNC_ACTIONS', actions: [...state.actions, {
            ...action,
            tags: action.tags ? JSON.parse(action.tags) : [],
            startedAt: action.startedAt ? new Date(action.startedAt).getTime() : null,
            endedAt: action.endedAt ? new Date(action.endedAt).getTime() : null,
            lastAwayAt: action.lastAwayAt ? new Date(action.lastAwayAt).getTime() : null,
            createdAt: new Date(action.createdAt).getTime(),
            updatedAt: new Date(action.updatedAt).getTime(),
          }] });
          return;
        } catch { /* fallback to local */ }
      }
      // Local fallback
      const frontendResult = result === 'abandoned' ? 'failed' : result;
      const newAction: ActionItem = {
        id: generateId(), title, state: frontendResult as ActionItem['state'],
        startedAt: now(), endedAt: now(),
        totalDurationMs: durationMinutes * 60 * 1000, awayDurationMs: 0,
        lastAwayAt: null, awayReason: null, blockedReason: null,
        result: frontendResult, resultNote: note || '',
        completionPercent: completionPercent || (result === 'completed' ? 100 : result === 'partial' ? 50 : null),
        visibility, needsVerification: visibility === 'needs_verification',
        evidenceUrl: null, evidenceText: null,
        mainLine: state.profile?.mainLine || null, category: null, tags: [],
        createdAt: now(), updatedAt: now(), userId: state.profile?.id || 'me',
      };
      const events: ActionEvent[] = [
        ...state.events,
        { id: generateId(), actionId: newAction.id, type: 'created', timestamp: now() },
        { id: generateId(), actionId: newAction.id, type: 'ended', timestamp: now(), data: { result: frontendResult, logged: true } },
      ];
      dispatch({ type: 'SYNC_ACTIONS', actions: [...state.actions, newAction] });
      dispatch({ type: 'INIT', state: { ...state, events } });
    },

    async endAction(actionId: string, result: 'completed' | 'partial' | 'abandoned', completionPercent?: number | null, note?: string) {
      const frontendResult = result === 'abandoned' ? 'failed' : result;
      
      // Auto-classify action if AI is configured
      let category: string | undefined;
      try {
        const action = state.actions.find((a) => a.id === actionId);
        if (action && !action.category) {
          const classifyResult = await api.classifyAction(action.title);
          category = classifyResult.category;
        }
      } catch { /* ignore classification errors */ }
      
      if (api.isAuthenticated()) {
        try {
          await api.endAction(actionId, result, completionPercent, note, category);
          dispatch({ type: 'END_ACTION', actionId, result: frontendResult as any, completionPercent: completionPercent ?? null, note: note ?? '' });
          return;
        } catch { /* fallback to local */ }
      }
      dispatch({ type: 'END_ACTION', actionId, result: frontendResult as any, completionPercent: completionPercent ?? null, note: note ?? '' });
    },

    async deleteAction(actionId: string) {
      if (api.isAuthenticated()) {
        try {
          await api.deleteAction(actionId);
          dispatch({ type: 'DELETE_ACTION', actionId });
          return;
        } catch { /* fallback to local */ }
      }
      dispatch({ type: 'DELETE_ACTION', actionId });
    },
  };
}

export function useActiveAction() {
  const state = useAppState();
  return state.actions.find((a) => a.state === 'active') || null;
}

export function useAwayAction() {
  const state = useAppState();
  return state.actions.find((a) => a.state === 'away') || null;
}

export function useBlockedAction() {
  const state = useAppState();
  return state.actions.find((a) => a.state === 'blocked') || null;
}

export function useTodayActions() {
  const state = useAppState();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startTs = startOfDay.getTime();
  return state.actions.filter((a) => a.createdAt >= startTs && a.userId === state.profile?.id);
}

export function useAllActions() {
  const state = useAppState();
  return state.actions.filter((a) => a.userId === state.profile?.id);
}

export function useActionTimer(actionId: string | null) {
  const state = useAppState();
  const action = state.actions.find((a) => a.id === actionId);

  const getElapsed = useCallback(() => {
    if (!action) return 0;
    if (action.state === 'active' && action.startedAt) {
      return action.totalDurationMs + (Date.now() - action.startedAt);
    }
    return action.totalDurationMs;
  }, [action]);

  return { action, getElapsed };
}

export function useCheckIn() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const api = useApi();

  const doCheckIn = useCallback(async () => {
    if (!api.isAuthenticated()) {
      // Local mode: simulate check-in
      const today = new Date().toISOString().split('T')[0];
      dispatch({
        type: 'DO_CHECK_IN',
        checkIn: {
          checkedInToday: true,
          streak: (state.checkIn?.streak || 0) + 1,
          todayDate: today,
        },
      });
      return { checkedIn: true, streak: (state.checkIn?.streak || 0) + 1 };
    }
    try {
      const result = await api.doCheckIn();
      dispatch({
        type: 'DO_CHECK_IN',
        checkIn: {
          checkedInToday: true,
          streak: result.streak,
          todayDate: result.date,
        },
      });
      return { checkedIn: true, streak: result.streak };
    } catch (err) {
      console.error('Check-in failed:', err);
      return { checkedIn: false, streak: state.checkIn?.streak || 0 };
    }
  }, [api, dispatch, state.checkIn]);

  return {
    checkIn: state.checkIn,
    doCheckIn,
  };
}

export function usePartnerMessages() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const api = useApi();

  const sendMessage = useCallback(async (type: 'bomb' | 'heart' | 'sleep', message?: string) => {
    if (!api.isAuthenticated()) {
      // Local mode: simulate
      const newMsg = {
        id: generateId(),
        senderId: state.profile?.id || 'me',
        receiverId: state.partner?.id || 'partner',
        type,
        message: message || null,
        read: false,
        createdAt: Date.now(),
      };
      dispatch({ type: 'ADD_PARTNER_MESSAGE', message: newMsg });
      return { success: true };
    }
    try {
      const result = await api.sendPartnerMessage(type, message);
      dispatch({ type: 'ADD_PARTNER_MESSAGE', message: { ...result.message, createdAt: new Date(result.message.createdAt).getTime() } });
      return { success: true };
    } catch (err) {
      console.error('Send message failed:', err);
      return { success: false };
    }
  }, [api, dispatch, state.profile, state.partner]);

  const markRead = useCallback(async (messageId: string) => {
    if (!api.isAuthenticated()) {
      dispatch({ type: 'MARK_MESSAGE_READ', messageId });
      return;
    }
    try {
      await api.markMessageRead(messageId);
      dispatch({ type: 'MARK_MESSAGE_READ', messageId });
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  }, [api, dispatch]);

  const unreadMessages = state.partnerMessages.filter((m) => !m.read);

  return {
    messages: state.partnerMessages,
    unreadMessages,
    sendMessage,
    markRead,
  };
}

export { generateId };
