export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatDurationShort(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}小时${minutes > 0 ? `${minutes}分` : ''}`;
  }
  return `${minutes}分钟`;
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === d.toDateString();

  if (isToday) return '今天';
  if (isYesterday) return '昨天';

  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${month}月${day}日`;
}

export function formatDateFull(ts: number): string {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${year}年${month}月${day}日 ${weekDays[d.getDay()]}`;
}

export function getStateLabel(state: string): string {
  const labels: Record<string, string> = {
    active: '进行中',
    away: '暂离',
    blocked: '卡住',
    completed: '已完成',
    partial: '部分完成',
    failed: '未完成',
    cancelled: '已取消',
    archived: '已归档',
  };
  return labels[state] || state;
}

export function getStateColor(state: string): string {
  const colors: Record<string, string> = {
    active: 'bg-pair-success text-white',
    away: 'bg-pair-warn text-white',
    blocked: 'bg-pair-stuck text-white',
    completed: 'bg-pair-successLight text-pair-success',
    partial: 'bg-pair-warnLight text-pair-warn',
    failed: 'bg-pair-dangerLight text-pair-danger',
    cancelled: 'bg-pair-surfaceAlt text-pair-textMuted',
  };
  return colors[state] || 'bg-pair-surfaceAlt text-pair-textMuted';
}
