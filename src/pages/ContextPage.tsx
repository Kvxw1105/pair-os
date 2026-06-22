import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch } from '../stores/AppStore';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Brain, Edit3, Check, X, AlertCircle, TrendingUp, Clock, Zap, Target, BookOpen,
  Flame, Activity, BarChart3, Award
} from 'lucide-react';
import {
  computeStreak, computeWeeklyStats, computeStateDistribution,
  computeBestDay, formatDurationShort, computeMaxStreak
} from '../utils/stats';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export function ContextPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const state = useAppState();
  const profile = state.profile;
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const myActions = state.actions.filter((a) => a.userId === state.profile?.id);
  const totalActions = myActions.length;
  const completedActions = myActions.filter((a) => a.state === 'completed').length;
  const partialActions = myActions.filter((a) => a.state === 'partial').length;
  const awayActions = myActions.filter((a) => a.state === 'away' || a.awayReason !== null);
  const resumedActions = myActions.filter((a) => a.state === 'active' || a.state === 'completed');
  const totalDuration = myActions.reduce((sum, a) => sum + a.totalDurationMs, 0);
  const avgDuration = totalActions > 0 ? totalDuration / totalActions : 0;

  // Stats
  const streak = computeStreak(myActions);
  const maxStreak = computeMaxStreak(myActions);
  const weekly = computeWeeklyStats(myActions);
  const distribution = computeStateDistribution(myActions);
  const bestDay = computeBestDay(myActions);

  const maxWeeklyDuration = Math.max(...weekly.map((w) => w.totalDurationMs), 1);

  const contextItems = [
    {
      id: 'mainLine',
      icon: Target,
      label: '当前主线',
      value: profile?.mainLine || '未设置',
      source: '用户确认',
      editable: true,
    },
    {
      id: 'deadline',
      icon: AlertCircle,
      label: '明确期限',
      value: profile?.deadline || '无',
      source: '用户确认',
      editable: true,
    },
    {
      id: 'subLines',
      icon: Zap,
      label: '需维持支线',
      value: profile?.subLines?.join('、') || '无',
      source: '用户确认',
      editable: true,
    },
    {
      id: 'avgDuration',
      icon: Clock,
      label: '平均行动时长',
      value: avgDuration > 0 ? `${Math.round(avgDuration / 60000)} 分钟` : '数据不足',
      source: '系统统计',
      editable: false,
    },
    {
      id: 'completionRate',
      icon: TrendingUp,
      label: '完成率',
      value: totalActions > 0 ? `${Math.round(((completedActions + partialActions * 0.5) / totalActions) * 100)}%` : '数据不足',
      source: '系统统计',
      editable: false,
    },
    {
      id: 'awayRate',
      icon: BookOpen,
      label: '恢复率',
      value: awayActions.length > 0 ? `${Math.round((resumedActions.length / awayActions.length) * 100)}%` : '数据不足',
      source: '系统推断',
      editable: false,
    },
  ];

  const handleEdit = (id: string, currentValue: string) => {
    setEditing(id);
    setEditValue(currentValue);
  };

  const handleSave = () => {
    if (!editing || !profile) return;
    if (editing === 'mainLine') {
      dispatch({ type: 'UPDATE_PROFILE', updates: { mainLine: editValue } });
    } else if (editing === 'deadline') {
      dispatch({ type: 'UPDATE_PROFILE', updates: { deadline: editValue } });
    } else if (editing === 'subLines') {
      dispatch({ type: 'UPDATE_PROFILE', updates: { subLines: editValue.split('、').filter(Boolean) } });
    }
    setEditing(null);
  };

  const hasData = totalActions > 0;

  return (
    <div className="min-h-[100dvh] bg-pair-bg overflow-hidden">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-xl hover:bg-pair-surfaceAlt/60 transition-colors">
          <ArrowLeft size={20} className="text-pair-textSecondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-pair-text">我的数据</h1>
        </div>
      </div>

      <motion.div
        className="px-5 pb-8 space-y-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Mini overview cards */}
        {hasData && (
          <motion.div className="grid grid-cols-3 gap-3" variants={itemVariants}>
            {[
              { value: totalActions, label: '总行动', icon: Activity, color: 'text-pair-primary' },
              { value: `${Math.round(((completedActions + partialActions * 0.5) / totalActions) * 100)}%`, label: '完成率', icon: TrendingUp, color: 'text-pair-success' },
              { value: formatDurationShort(totalDuration), label: '总时长', icon: Clock, color: 'text-pair-accent' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-pair-surface/80 backdrop-blur rounded-2xl p-3 border border-pair-border/40 shadow-card text-center"
              >
                <stat.icon size={14} className={`${stat.color} mx-auto mb-1 opacity-70`} />
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-pair-textMuted/70">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Streak Badge */}
        {hasData && (
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-pair-primary/5 to-pair-accent/5 rounded-3xl p-5 border border-pair-primary/10 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pair-primary/8 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex items-center gap-4">
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pair-primary/15 to-pair-accent/10 flex items-center justify-center border border-pair-primary/10"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Flame size={24} className="text-pair-primary" />
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-pair-text">{streak}</span>
                    <span className="text-sm text-pair-textSecondary">天连续行动</span>
                  </div>
                  <p className="text-[11px] text-pair-textMuted mt-0.5">
                    {maxStreak > 0 && `最高记录 ${maxStreak} 天`}
                    {bestDay && ` · 最佳单日 ${formatDurationShort(bestDay.durationMs)}`}
                  </p>
                </div>
                {streak >= 3 && (
                  <div className="text-xs px-2.5 py-1 rounded-full bg-pair-primary/10 text-pair-primary font-semibold">
                    🔥 燃烧中
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 7-Day Trend */}
        {hasData && (
          <motion.div variants={itemVariants}>
            <div className="bg-pair-surface rounded-3xl p-5 border border-pair-border/50 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={14} className="text-pair-textMuted" />
                <span className="text-xs font-semibold text-pair-textMuted tracking-wide">近7天趋势</span>
                <span className="text-[10px] text-pair-textMuted/60 ml-auto">时长</span>
              </div>
              <div className="flex items-end gap-2 h-28">
                {weekly.map((day, i) => {
                  const heightPct = maxWeeklyDuration > 0 ? (day.totalDurationMs / maxWeeklyDuration) * 100 : 0;
                  const minHeight = day.hasAction ? 4 : 0;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="flex-1 w-full flex items-end justify-center">
                        <motion.div
                          className={`w-full max-w-[28px] rounded-t-lg ${
                            day.hasAction
                              ? day.totalDurationMs > 0
                                ? 'bg-gradient-to-t from-pair-primary/40 to-pair-primary/15'
                                : 'bg-pair-surfaceAlt/50'
                              : 'bg-transparent'
                          }`}
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(heightPct, minHeight)}%` }}
                          transition={{ delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
                          title={day.hasAction ? `${day.label}: ${formatDurationShort(day.totalDurationMs)}` : `${day.label}: 无行动`}
                        />
                      </div>
                      <span className={`text-[9px] ${day.hasAction ? 'text-pair-textMuted' : 'text-pair-textMuted/40'}`}>
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* State Distribution */}
        {hasData && distribution.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="bg-pair-surface rounded-3xl p-5 border border-pair-border/50 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Award size={14} className="text-pair-textMuted" />
                <span className="text-xs font-semibold text-pair-textMuted tracking-wide">状态分布</span>
              </div>
              <div className="space-y-2.5">
                {distribution.map((item) => (
                  <div key={item.state} className="flex items-center gap-3">
                    <span className="text-[11px] text-pair-textSecondary w-14 flex-shrink-0">{item.label}</span>
                    <div className="flex-1 h-2 bg-pair-surfaceAlt rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${item.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percent}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
                      />
                    </div>
                    <span className="text-[10px] text-pair-textMuted w-10 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Understanding Section */}
        <motion.div variants={itemVariants}>
          <div className="bg-pair-primaryLight/40 rounded-2xl p-5 mb-2 border border-pair-primary/10 card-shine">
            <div className="flex items-center gap-2.5 mb-2">
              <Brain size={18} className="text-pair-primary" />
              <span className="text-sm font-bold text-pair-primary">AI 目前对你的理解</span>
            </div>
            <p className="text-xs text-pair-primary/80 leading-relaxed">
              所有信息可见、可纠正、可删除。系统根据你的真实行动数据逐渐推断，你可以随时修正。
            </p>
          </div>
        </motion.div>

        <div className="space-y-3">
          {contextItems.map((item) => {
            const Icon = item.icon;
            const isEditing = editing === item.id;
            return (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className="bg-pair-surface rounded-3xl p-5 border border-pair-border/50 shadow-card card-shine"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className="text-pair-textMuted" />
                  <span className="text-xs font-semibold text-pair-textMuted tracking-wide">{item.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ml-auto ${
                    item.source === '用户确认' ? 'bg-pair-successLight text-pair-success' :
                    item.source === '系统统计' ? 'bg-pair-primaryLight text-pair-primary' :
                    'bg-pair-warnLight text-pair-warn'
                  }`}>
                    {item.source}
                  </span>
                </div>

                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-pair-surfaceAlt/60 rounded-xl text-sm border border-pair-border focus:border-pair-primary/30 focus:outline-none focus:ring-2 focus:ring-pair-primary/8"
                    />
                    <button onClick={handleSave} className="p-2.5 bg-pair-success text-white rounded-xl">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditing(null)} className="p-2.5 bg-pair-surfaceAlt text-pair-textMuted rounded-xl">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-pair-text">{item.value}</p>
                    {item.editable && (
                      <button
                        onClick={() => handleEdit(item.id, item.value === '未设置' || item.value === '无' ? '' : item.value)}
                        className="p-1.5 rounded-lg hover:bg-pair-surfaceAlt transition-colors"
                      >
                        <Edit3 size={14} className="text-pair-textMuted" />
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {!hasData && (
          <motion.div variants={itemVariants} className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-pair-surfaceAlt/80 flex items-center justify-center mx-auto mb-4 shadow-card border border-pair-border/40">
              <BarChart3 size={28} className="text-pair-textMuted/40" />
            </div>
            <p className="text-sm text-pair-textSecondary font-medium">还没有足够数据</p>
            <p className="text-xs text-pair-textMuted/60 mt-2">开始行动后，这里会显示统计和趋势</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
