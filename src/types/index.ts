export type ActionState =
  | 'draft'
  | 'ready'
  | 'active'
  | 'away'
  | 'blocked'
  | 'submitted'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'cancelled'
  | 'archived';

export type AwayReason =
  | 'external_task'
  | 'interrupted_by_someone'
  | 'env_issue'
  | 'distraction'
  | 'physical'
  | 'none';

export type BlockedReason =
  | 'unknown_next'
  | 'too_big'
  | 'error'
  | 'resistance'
  | 'low_energy'
  | 'need_help';

export type ResultType = 'completed' | 'partial' | 'failed' | 'cancelled';

export type Visibility = 'solo' | 'visible' | 'needs_verification';

export interface ActionEvent {
  id: string;
  actionId: string;
  type:
    | 'created'
    | 'started'
    | 'away'
    | 'resumed'
    | 'blocked'
    | 'unblocked'
    | 'ended'
    | 'cancelled'
    | 'modified'
    | 'verified';
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface ActionItem {
  id: string;
  title: string;
  state: ActionState;
  startedAt: number | null;
  endedAt: number | null;
  totalDurationMs: number;
  awayDurationMs: number;
  lastAwayAt: number | null;
  awayReason: AwayReason | null;
  blockedReason: BlockedReason | null;
  result: ResultType | null;
  resultNote: string;
  completionPercent: number | null;
  visibility: Visibility;
  needsVerification: boolean;
  evidenceUrl: string | null;
  evidenceText: string | null;
  mainLine: string | null;
  category: 'work' | 'study' | 'life' | 'health' | 'social' | 'rest' | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  userId: string;
  email?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar: string | null;
  bio: string | null;
  timezone: string;
  createdAt: number;
  onboardingCompleted: boolean;
  mainLine: string | null;
  deadline: string | null;
  subLines: string[];
  preferences: {
    likesTimer: boolean;
    defaultVisibility: Visibility;
    reminderEnabled: boolean;
    doNotDisturbStart: string | null;
    doNotDisturbEnd: string | null;
    maxDailyReminders: number;
  };
}

export interface Partner {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  status: 'idle' | 'active' | 'away' | 'blocked';
  currentActionTitle: string | null;
  lastActiveAt: number;
}

export interface PartnerMessage {
  id: string;
  senderId: string;
  receiverId: string;
  type: 'bomb' | 'heart' | 'sleep';
  message: string | null;
  read: boolean;
  createdAt: number;
}

export interface Reminder {
  id: string;
  actionId: string | null;
  type: 'return' | 'action' | 'partner_invite' | 'unarchive' | 'weekly_review';
  triggerAt: number;
  message: string;
  confirmed: boolean;
  createdAt: number;
}

export interface DailyReportActionSnapshot {
  id: string;
  title: string;
  state: string;
  duration: number;
  result: string | null;
  resultNote: string | null;
  completionPercent: number | null;
}

export interface DailyReport {
  id: string;
  date: string;
  partnershipId: string;
  user1Id: string;
  user1Name: string;
  user1Summary: string | null;
  user1Actions: DailyReportActionSnapshot[];
  user1Duration: number;
  user2Id: string;
  user2Name: string;
  user2Summary: string | null;
  user2Actions: DailyReportActionSnapshot[];
  user2Duration: number;
  mutualMessage: string | null;
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInState {
  checkedInToday: boolean;
  streak: number;
  todayDate: string;
}

export interface AppState {
  profile: UserProfile | null;
  actions: ActionItem[];
  events: ActionEvent[];
  partners: Partner[];
  partnerPending: boolean;
  reminders: Reminder[];
  isOnboarding: boolean;
  theme: 'light' | 'dark' | 'system';
  checkIn: CheckInState | null;
  partnerMessages: PartnerMessage[];
  guidePartner: Partner | null; // Demo guide partner (小K), not a real partnership
}

export type AppAction =
  | { type: 'INIT'; state: AppState }
  | { type: 'SET_PROFILE'; profile: UserProfile }
  | { type: 'UPDATE_PROFILE'; updates: Partial<UserProfile> }
  | { type: 'COMPLETE_ONBOARDING'; mainLine: string; deadline: string | null; subLines: string[] }
  | { type: 'LOGIN_SUCCESS'; token: string; user: { id: string; name: string; email: string; avatar?: string | null; bio?: string | null } }
  | { type: 'LOGOUT' }
  | { type: 'SYNC_ACTIONS'; actions: ActionItem[] }
  | { type: 'SYNC_PARTNERS'; partners: Partner[] }
  | { type: 'START_ACTION'; title: string; visibility: Visibility }
  | { type: 'AWAY_ACTION'; actionId: string; reason: AwayReason }
  | { type: 'RESUME_ACTION'; actionId: string }
  | { type: 'BLOCK_ACTION'; actionId: string; reason: BlockedReason }
  | { type: 'UNBLOCK_ACTION'; actionId: string }
  | { type: 'END_ACTION'; actionId: string; result: ResultType; completionPercent: number | null; note: string }
  | { type: 'SET_PARTNERS'; partners: Partner[] }
  | { type: 'INVITE_PARTNER' }
  | { type: 'REMOVE_PARTNER'; partnerId?: string }
  | { type: 'ADD_REMINDER'; reminder: Reminder }
  | { type: 'CONFIRM_REMINDER'; reminderId: string }
  | { type: 'DISMISS_REMINDER'; reminderId: string }
  | { type: 'UPDATE_ACTION_TITLE'; actionId: string; title: string }
  | { type: 'UPDATE_ACTION_VISIBILITY'; actionId: string; visibility: Visibility }
  | { type: 'DELETE_ACTION'; actionId: string }
  | { type: 'SET_THEME'; theme: 'light' | 'dark' | 'system' }
  | { type: 'SET_CHECK_IN'; checkIn: CheckInState }
  | { type: 'DO_CHECK_IN'; checkIn: CheckInState }
  | { type: 'SET_PARTNER_MESSAGES'; messages: PartnerMessage[] }
  | { type: 'ADD_PARTNER_MESSAGE'; message: PartnerMessage }
  | { type: 'MARK_MESSAGE_READ'; messageId: string }
