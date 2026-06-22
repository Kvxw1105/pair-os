import type { ActionItem } from '../types';

export interface WeeklyStat {
  date: string;
  label: string;
  completed: number;
  totalDurationMs: number;
  hasAction: boolean;
}

export interface StateDistribution {
  state: string;
  label: string;
  count: number;
  percent: number;
  color: string;
}

export function getActionDayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function computeStreak(actions: ActionItem[]): number {
  // 统计有 completed/partial action 的日期
  const actionDays = new Set<string>();
  actions.forEach((a) => {
    if (a.state === 'completed' || a.state === 'partial') {
      actionDays.add(getActionDayKey(a.endedAt || a.createdAt));
    }
  });

  if (actionDays.size === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = getActionDayKey(today.getTime());

  // 检查今天是否有行动（有则从今天开始算，没有则从昨天开始算）
  let startDate = new Date(today);
  if (!actionDays.has(todayKey)) {
    startDate.setDate(startDate.getDate() - 1);
  }

  let streak = 0;
  while (true) {
    const key = getActionDayKey(startDate.getTime());
    if (actionDays.has(key)) {
      streak++;
      startDate.setDate(startDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function computeWeeklyStats(actions: ActionItem[]): WeeklyStat[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const week: WeeklyStat[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = getActionDayKey(d.getTime());
    const dayActions = actions.filter((a) => getActionDayKey(a.createdAt) === dateKey);
    const completed = dayActions.filter((a) => a.state === 'completed' || a.state === 'partial').length;
    const totalDurationMs = dayActions.reduce((s, a) => s + a.totalDurationMs, 0);
    week.push({
      date: dateKey,
      label: i === 0 ? '今天' : i === 1 ? '昨天' : `${d.getMonth() + 1}/${d.getDate()}`,
      completed,
      totalDurationMs,
      hasAction: dayActions.length > 0,
    });
  }
  return week;
}

export function computeStateDistribution(actions: ActionItem[]): StateDistribution[] {
  const total = actions.length;
  if (total === 0) return [];

  const states = [
    { state: 'completed', label: '已完成', color: 'bg-emerald-400' },
    { state: 'partial', label: '部分完成', color: 'bg-amber-400' },
    { state: 'active', label: '进行中', color: 'bg-blue-400' },
    { state: 'away', label: '暂离', color: 'bg-orange-400' },
    { state: 'blocked', label: '卡住', color: 'bg-purple-400' },
    { state: 'failed', label: '未完成', color: 'bg-slate-400' },
    { state: 'cancelled', label: '已取消', color: 'bg-slate-300' },
  ] as const;

  return states
    .map((s) => ({
      ...s,
      count: actions.filter((a) => a.state === s.state).length,
      percent: 0,
    }))
    .filter((s) => s.count > 0)
    .map((s) => ({ ...s, percent: Math.round((s.count / total) * 100) }));
}

export function computeBestDay(actions: ActionItem[]): { day: string; durationMs: number } | null {
  const dayMap = new Map<string, number>();
  actions.forEach((a) => {
    const key = getActionDayKey(a.createdAt);
    dayMap.set(key, (dayMap.get(key) || 0) + a.totalDurationMs);
  });
  if (dayMap.size === 0) return null;
  let best = { day: '', durationMs: 0 };
  dayMap.forEach((duration, day) => {
    if (duration > best.durationMs) {
      best = { day, durationMs: duration };
    }
  });
  return best;
}

export function computeHourlyPattern(actions: ActionItem[]): number[] {
  // 24小时分布，每个小时有多少行动
  const hours = new Array(24).fill(0);
  actions.forEach((a) => {
    const d = new Date(a.createdAt);
    const h = d.getHours();
    hours[h]++;
  });
  return hours;
}

export function computeMaxStreak(actions: ActionItem[]): number {
  const actionDays = new Set<string>();
  actions.forEach((a) => {
    if (a.state === 'completed' || a.state === 'partial') {
      actionDays.add(getActionDayKey(a.endedAt || a.createdAt));
    }
  });
  if (actionDays.size === 0) return 0;

  const sorted = Array.from(actionDays).sort();
  let maxStreak = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00');
    const curr = new Date(sorted[i] + 'T00:00:00');
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      current++;
      maxStreak = Math.max(maxStreak, current);
    } else {
      current = 1;
    }
  }

  return maxStreak;
}

export function formatDurationShort(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h${minutes}m`;
  return `${minutes}m`;
}
