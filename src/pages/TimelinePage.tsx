import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState, useApi } from '../stores/AppStore';
import { formatDate, formatTime, formatDuration, getStateLabel, getStateColor } from '../utils/time';
import { motion, AnimatePresence } from 'framer-motion';
import { DreamParticles } from '../components/DreamParticles';
import { GlowingOrb } from '../components/DreamEffects';
import { ArrowLeft, ChevronDown, ChevronUp, Clock, Pause, AlertTriangle, CheckCircle2, Circle, XCircle, Sparkles, Loader2, RefreshCw, TrendingUp, Activity } from 'lucide-react';
import type { ActionItem } from '../types';

const stateIcons: Record<string, typeof CheckCircle2> = {
  completed: CheckCircle2,
  partial: Circle,
  failed: XCircle,
  cancelled: XCircle,
  active: Clock,
  away: Pause,
  blocked: AlertTriangle,
};

export function TimelinePage() {
  const navigate = useNavigate();
  const state = useAppState();
  const api = useApi();
  const myActions = state.actions.filter((a) => a.userId === state.profile?.id);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState(false);

  const fetchInsight = async () => {
    if (!api.isAuthenticated()) return;
    setInsightLoading(true);
    setInsightError(false);
    try {
      const result = await api.getInsight();
      setInsight(result.insight);
    } catch (err) {
      console.error('Insight fetch failed:', err);
      setInsightError(true);
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    if (myActions.length >= 3 && api.isAuthenticated()) {
      fetchInsight();
    }
  }, []);

  const grouped = new Map<string, ActionItem[]>();
  myActions
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((action) => {
      const dateKey = new Date(action.createdAt).toDateString();
      if (!grouped.has(dateKey)) grouped.set(dateKey, []);
      grouped.get(dateKey)!.push(action);
    });

  const dates = Array.from(grouped.entries());

  // Stats for mini summary
  const totalActions = myActions.length;
  const completedActions = myActions.filter(a => a.state === 'completed').length;
  const totalDuration = myActions.reduce((sum, a) => sum + a.totalDurationMs, 0);

  return (
    <div className="relative min-h-[100dvh] dream-bg overflow-hidden">
      {/* Background particles */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <DreamParticles />
      </div>

      <GlowingOrb color="rgba(74, 139, 122, 0.05)" size={300} className="top-[-50px] right-[-80px]" blur={80} />
      <GlowingOrb color="rgba(123, 109, 181, 0.04)" size={250} className="bottom-[200px] left-[-60px]" blur={70} />

      <div className="relative" style={{ zIndex: 1 }}>
        {/* Header */}
        <motion.div
          className="px-5 pt-8 pb-4 flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <motion.button
            onClick={() => navigate('/')}
            className="p-2.5 -ml-2 rounded-2xl hover:bg-pair-surfaceAlt/70 transition-all duration-300 border border-transparent hover:border-pair-border/30"
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.93 }}
          >
            <ArrowLeft size={20} className="text-pair-textSecondary" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-pair-text tracking-tight">轨迹</h1>
          </div>
        </motion.div>

        <div className="px-5 pb-8">
          {/* AI Insight Card */}
          {api.isAuthenticated() && myActions.length >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
              className="mb-6"
            >
              <div className="bg-gradient-to-br from-pair-primary/5 to-pair-accent/5 rounded-3xl p-5 border border-pair-primary/10 shadow-card hover:shadow-card-hover transition-all duration-500 relative overflow-hidden group backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-pair-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-pair-accent/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <motion.div
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-pair-primary/15 to-pair-accent/10 flex items-center justify-center border border-pair-primary/10"
                      animate={insightLoading ? { rotate: 360 } : { rotate: [0, 5, -5, 0] }}
                      transition={insightLoading ? { duration: 2, repeat: Infinity, ease: 'linear' } : { duration: 4, repeat: Infinity }}
                    >
                      {insightLoading ? (
                        <Loader2 size={14} className="text-pair-primary" />
                      ) : (
                        <Sparkles size={14} className="text-pair-primary" />
                      )}
                    </motion.div>
                    <span className="text-xs font-semibold text-pair-primary tracking-wide">AI 洞察</span>
                    {!insightLoading && (
                      <motion.button
                        onClick={fetchInsight}
                        className="ml-auto p-1.5 rounded-lg hover:bg-pair-primary/10 transition-colors"
                        title="重新生成"
                        whileHover={{ scale: 1.2, rotate: 180 }}
                        transition={{ duration: 0.5 }}
                      >
                        <RefreshCw size={12} className="text-pair-primary/60" />
                      </motion.button>
                    )}
                  </div>
                  {insightLoading ? (
                    <div className="flex items-center gap-2 text-sm text-pair-textMuted">
                      <Loader2 size={14} className="animate-spin text-pair-primary/50" />
                      <span>正在分析你的行动模式...</span>
                    </div>
                  ) : insightError ? (
                    <div>
                      <p className="text-sm text-pair-textMuted">AI 分析暂时不可用</p>
                      <p className="text-[11px] text-pair-textMuted/60 mt-1">请检查 AI 配置或稍后重试</p>
                    </div>
                  ) : insight ? (
                    <motion.p
                      className="text-sm text-pair-text leading-relaxed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {insight}
                    </motion.p>
                  ) : null}
                  <p className="text-[10px] text-pair-textMuted/50 mt-2.5">基于你最近 7 天的行动数据分析</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats summary */}
          {totalActions > 0 && (
            <motion.div
              className="grid grid-cols-3 gap-3 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              {[
                { value: totalActions, label: '总行动', icon: Activity, color: 'text-pair-primary' },
                { value: completedActions, label: '已完成', icon: CheckCircle2, color: 'text-pair-success' },
                { value: formatDurationShort(totalDuration), label: '总时长', icon: TrendingUp, color: 'text-pair-accent' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="bg-pair-surface/80 backdrop-blur rounded-2xl p-3 border border-pair-border/40 shadow-card hover:shadow-card-hover transition-all duration-300 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                  whileHover={{ y: -2, scale: 1.02 }}
                >
                  <stat.icon size={14} className={`${stat.color} mx-auto mb-1 opacity-70`} />
                  <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-pair-textMuted/70">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {dates.length === 0 ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="w-20 h-20 rounded-3xl bg-pair-surface/80 flex items-center justify-center mx-auto mb-5 shadow-card border border-pair-border/30"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Activity size={32} className="text-pair-textMuted/30" />
              </motion.div>
              <p className="text-sm text-pair-textSecondary/80 font-medium">还没有行动记录</p>
              <p className="text-xs text-pair-textMuted/60 mt-2">开始你的第一次行动，这里会显示时间线</p>
            </motion.div>
          ) : (
            <div className="space-y-5">
              {dates.map(([dateKey, actions], dateIndex) => {
                const isExpanded = expandedDate === dateKey;
                const firstAction = actions[0];
                return (
                  <motion.div
                    key={dateKey}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dateIndex * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                  >
                    <button
                      onClick={() => setExpandedDate(isExpanded ? null : dateKey)}
                      className="flex items-center gap-2 mb-3 w-full group"
                    >
                      <span className="text-[11px] font-bold text-pair-textMuted/80 uppercase tracking-widest">
                        {formatDate(firstAction.createdAt)}
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-pair-border/60 via-pair-border/40 to-transparent" />
                      <span className="text-[11px] text-pair-textMuted/70">{actions.length} 个行动</span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {isExpanded ? <ChevronUp size={14} className="text-pair-textMuted/70" /> : <ChevronDown size={14} className="text-pair-textMuted/70" />}
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                          className="space-y-2.5 overflow-hidden"
                        >
                          {actions.map((action, i) => {
                            const Icon = stateIcons[action.state] || Circle;
                            return (
                              <motion.div
                                key={action.id}
                                className="bg-pair-surface/80 backdrop-blur rounded-3xl p-4 border border-pair-border/40 shadow-card hover:shadow-card-hover transition-all duration-300 group/item"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.3 }}
                                whileHover={{ x: 4 }}
                              >
                                <div className="flex items-start gap-3">
                                  <motion.div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${getStateColor(action.state)}`}
                                    whileHover={{ scale: 1.15, rotate: 5 }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                  >
                                    <Icon size={15} />
                                  </motion.div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-pair-text truncate group-hover/item:text-pair-primary transition-colors">{action.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-xs text-pair-textMuted/70">
                                        {action.state === 'active' && action.startedAt
                                          ? `${formatTime(action.startedAt)} 开始`
                                          : action.endedAt
                                          ? `${formatTime(action.endedAt)} 结束`
                                          : `${formatTime(action.createdAt)} 创建`}
                                      </span>
                                      <span className="text-xs text-pair-textMuted/70">
                                        {formatDuration(action.totalDurationMs)}
                                      </span>
                                    </div>
                                    {action.resultNote && (
                                      <p className="text-xs text-pair-textSecondary/80 mt-2.5 bg-pair-surfaceAlt/50 rounded-xl px-3 py-2.5 border border-pair-border/30">
                                        {action.resultNote}
                                      </p>
                                    )}
                                    {action.result === 'partial' && action.completionPercent && (
                                      <div className="flex items-center gap-2 mt-2">
                                        <div className="flex-1 h-1.5 bg-pair-surfaceAlt rounded-full overflow-hidden">
                                          <motion.div
                                            className="h-full bg-gradient-to-r from-pair-warn to-pair-accent rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${action.completionPercent}%` }}
                                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
                                          />
                                        </div>
                                        <span className="text-[10px] text-pair-textMuted/70">{action.completionPercent}%</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${getStateColor(action.state)}`}>
                                    {getStateLabel(action.state)}
                                  </span>
                                </div>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!isExpanded && (
                      <div className="flex gap-1.5 flex-wrap">
                        {actions.map((action) => (
                          <motion.div
                            key={action.id}
                            className={`w-2.5 h-2.5 rounded-full ${
                              action.state === 'completed' ? 'bg-gradient-to-br from-pair-success to-emerald-400 shadow-glow-success' :
                              action.state === 'partial' ? 'bg-gradient-to-br from-pair-accent to-amber-300 shadow-glow-warn' :
                              action.state === 'failed' || action.state === 'cancelled' ? 'bg-pair-textMuted' :
                              action.state === 'active' ? 'bg-gradient-to-br from-pair-success to-emerald-400 shadow-glow-success' :
                              action.state === 'away' ? 'bg-gradient-to-br from-pair-accent to-amber-300 shadow-glow-warn' :
                              'bg-gradient-to-br from-pair-stuck to-violet-400 shadow-glow-stuck'
                            }`}
                            whileHover={{ scale: 1.5 }}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDurationShort(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h${minutes}m`;
  return `${minutes}m`;
}
