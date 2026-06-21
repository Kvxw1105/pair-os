import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useActionTimer, useActionDispatch } from '../stores/AppStore';
import { formatDuration } from '../utils/time';
import { motion, AnimatePresence } from 'framer-motion';
import { DreamParticles } from '../components/DreamParticles';
import { GlowingOrb } from '../components/DreamEffects';
import { Pause, AlertTriangle, CheckCircle2, ArrowLeft, RotateCcw, Play, PenLine, Flame } from 'lucide-react';

export function ActionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const actionDispatch = useActionDispatch();
  const { action, getElapsed } = useActionTimer(id || null);
  const [elapsed, setElapsed] = useState(0);
  const [showConfirmAway, setShowConfirmAway] = useState(false);
  const [awayNote, setAwayNote] = useState('');

  useEffect(() => {
    if (!action) return;
    const timer = setInterval(() => {
      setElapsed(getElapsed());
    }, 1000);
    return () => clearInterval(timer);
  }, [action, getElapsed]);

  useEffect(() => {
    setElapsed(getElapsed());
  }, [action]);

  if (!action) {
    return (
      <div className="min-h-[100dvh] dream-bg flex items-center justify-center">
        <p className="text-pair-textSecondary">行动未找到</p>
      </div>
    );
  }

  if (!['active', 'away', 'blocked'].includes(action.state)) {
    navigate('/');
    return null;
  }

  const isAway = action.state === 'away';
  const isBlocked = action.state === 'blocked';
  const isActive = action.state === 'active';

  return (
    <div className="relative min-h-[100dvh] dream-bg flex flex-col overflow-hidden">
      {/* Background particles */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <DreamParticles />
      </div>

      {/* Glowing orbs */}
      {isActive && (
        <>
          <GlowingOrb color="rgba(123, 109, 181, 0.06)" size={400} className="top-[-100px] right-[-150px]" blur={100} />
          <GlowingOrb color="rgba(184, 149, 106, 0.04)" size={300} className="bottom-[100px] left-[-100px]" blur={80} />
        </>
      )}
      {isAway && (
        <GlowingOrb color="rgba(184, 149, 106, 0.06)" size={350} className="top-[-50px] right-[-100px]" blur={90} />
      )}
      {isBlocked && (
        <GlowingOrb color="rgba(123, 109, 181, 0.07)" size={350} className="top-[-50px] left-[-100px]" blur={90} />
      )}

      <div className="relative flex-1 flex flex-col" style={{ zIndex: 1 }}>
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
            <h1 className="text-lg font-bold text-pair-text tracking-tight">
              {isAway ? '暂离中' : isBlocked ? '卡住了' : '专注中'}
            </h1>
          </div>
          {isActive && (
            <motion.div
              className="flex items-center gap-1.5 text-[10px] text-white/50 bg-white/10 px-3 py-1.5 rounded-full border border-white/10"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Flame size={10} />
              <span>心流</span>
            </motion.div>
          )}
        </motion.div>

        <div className="flex-1 flex flex-col px-5 py-4">
          {/* Timer Card — 心流聚焦 */}
          <motion.div
            className={`flex-1 flex flex-col items-center justify-center rounded-3xl p-8 mb-6 relative overflow-hidden group transition-all duration-500 ${
              isAway ? 'bg-gradient-to-br from-pair-warnLight/80 to-pair-accentLight/40 border border-pair-accent/15 shadow-card' :
              isBlocked ? 'bg-gradient-to-br from-pair-stuckLight/80 to-violet-50/50 border border-pair-stuck/15 shadow-card' :
              'bg-gradient-to-br from-pair-primary via-pair-primaryMuted to-pair-primary shadow-glow-primary'
            }`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
            whileHover={{ scale: 1.005 }}
          >
            {isActive && (
              <>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] rounded-full border border-white/3 animate-pulse-slower" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] rounded-full border border-white/2 animate-pulse-slow" />
                <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl from-white/[0.06] to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-pair-accent/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </>
            )}

            {isAway && (
              <>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pair-accent/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-pair-warn/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
              </>
            )}

            {isBlocked && (
              <>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pair-stuck/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-pair-stuck/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
              </>
            )}

            <div className="relative z-10 text-center">
              <motion.div
                className={`text-[11px] font-medium tracking-widest uppercase mb-5 ${isAway || isBlocked ? 'text-pair-textMuted/80' : 'text-white/60'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {action.title}
              </motion.div>
              <motion.div
                className={`text-5xl font-mono font-light tracking-wider mb-3 tabular-nums ${
                  isAway || isBlocked ? 'text-pair-text' : 'text-white'
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
              >
                {formatDuration(elapsed)}
              </motion.div>
              <motion.div
                className={`text-xs ${isAway || isBlocked ? 'text-pair-textMuted/70' : 'text-white/50'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {isAway ? `已暂离 ${formatDuration(Date.now() - (action.lastAwayAt || 0))}` :
                 isBlocked ? '遇到执行阻力' : '保持心流'}
              </motion.div>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="space-y-3 mb-6">
            <AnimatePresence mode="wait">
              {isAway && (
                <motion.button
                  key="resume"
                  onClick={async () => {
                    await actionDispatch.resumeAction(action.id);
                    navigate('/');
                  }}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                  className="w-full py-4 bg-gradient-to-r from-pair-accent to-pair-accentMuted text-white rounded-3xl font-semibold text-sm flex items-center justify-center gap-2 shadow-glow-accent hover:shadow-glow-accent transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <RotateCcw size={18} strokeWidth={2.5} />
                  继续刚才的行动
                </motion.button>
              )}

              {isBlocked && (
                <motion.button
                  key="unblock"
                  onClick={async () => {
                    await actionDispatch.unblockAction(action.id);
                    navigate('/');
                  }}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                  className="w-full py-4 bg-gradient-to-r from-pair-stuck to-violet-600 text-white rounded-3xl font-semibold text-sm flex items-center justify-center gap-2 shadow-glow-stuck hover:shadow-glow-stuck transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Play size={18} strokeWidth={2.5} />
                  继续尝试
                </motion.button>
              )}

              {!isAway && (
                <motion.button
                  key="away"
                  onClick={() => setShowConfirmAway(true)}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                  className="w-full py-4 bg-gradient-to-r from-pair-surface/90 to-pair-accentLight/20 border border-pair-accent/20 text-pair-accent rounded-3xl font-semibold text-sm flex items-center justify-center gap-2 shadow-card hover:shadow-card-hover hover:bg-gradient-to-r hover:from-pair-accentLight/30 hover:to-pair-warnLight/20 transition-all duration-500 active:scale-[0.97]"
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Pause size={18} strokeWidth={2} />
                  暂离
                </motion.button>
              )}

              {!isBlocked && (
                <motion.button
                  key="blocked"
                  onClick={() => navigate(`/blocked/${action.id}`)}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                  className="w-full py-4 bg-gradient-to-r from-pair-surface/90 to-pair-stuckLight/20 border border-pair-stuck/20 text-pair-stuck rounded-3xl font-semibold text-sm flex items-center justify-center gap-2 shadow-card hover:shadow-card-hover hover:bg-gradient-to-r hover:from-pair-stuckLight/30 hover:to-violet-50/20 transition-all duration-500 active:scale-[0.97]"
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <AlertTriangle size={18} strokeWidth={2} />
                  卡住了
                </motion.button>
              )}

              <motion.button
                key="end"
                onClick={() => navigate(`/end/${action.id}`)}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                className={`w-full py-4 rounded-3xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-500 active:scale-[0.97] ${
                  isAway || isBlocked
                    ? 'bg-gradient-to-r from-pair-surface/90 to-pair-surface/70 border border-pair-border/60 text-pair-textSecondary hover:shadow-card-hover'
                    : 'bg-gradient-to-r from-pair-surface/90 to-pair-successLight/20 border border-pair-success/20 text-pair-success hover:shadow-card-hover hover:bg-gradient-to-r hover:from-pair-successLight/30 hover:to-emerald-50/20'
                }`}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <CheckCircle2 size={18} strokeWidth={2} />
                {isAway || isBlocked ? '结束并记录' : '结束'}
              </motion.button>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Confirm Away Modal — 暂离原因 */}
      <AnimatePresence>
        {showConfirmAway && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-md"
            onClick={() => setShowConfirmAway(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-gradient-to-t from-pair-surface to-pair-surface/95 rounded-t-[28px] p-6 shadow-floating-lg border-t border-pair-border/30 backdrop-blur-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gradient-to-r from-pair-border/60 to-pair-border/30 rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold text-pair-text mb-1">暂离</h3>
              <p className="text-sm text-pair-textMuted/80 mb-5">当前进度已保存，选择暂离原因：</p>
              <div className="space-y-2 mb-5">
                {[
                  { key: 'external_task', label: '必须处理的外部事务', desc: '工作、家人、会议等', icon: '💼' },
                  { key: 'interrupted_by_someone', label: '别人临时来找', desc: '朋友、同事发起交流', icon: '👋' },
                  { key: 'env_issue', label: '环境/设备问题', desc: '断网、故障、噪音等', icon: '🔧' },
                  { key: 'distraction', label: '主动分心', desc: '短视频、游戏等', icon: '🌀' },
                  { key: 'physical', label: '身体与精力', desc: '困倦、不适、需要休息', icon: '😴' },
                  { key: 'none', label: '不记录原因', desc: '仅记录中断时间', icon: '◯' },
                ].map((reason, i) => (
                  <motion.button
                    key={reason.key}
                    onClick={async () => {
                      await actionDispatch.awayAction(action.id, reason.key);
                      if (awayNote.trim()) {
                        // 这里可以通过 dispatch 更新 awayNote
                      }
                      setShowConfirmAway(false);
                      navigate(`/away/${action.id}`);
                    }}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                    className="w-full text-left px-4 py-3.5 rounded-2xl bg-pair-surfaceAlt/60 hover:bg-gradient-to-r hover:from-pair-warnLight/40 hover:to-pair-accentLight/30 transition-all duration-300 group border border-pair-border/30 hover:border-pair-accent/20 hover:shadow-soft"
                    whileHover={{ x: 6, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{reason.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-pair-text group-hover:text-pair-accent transition-colors">{reason.label}</div>
                        <div className="text-xs text-pair-textMuted/70 mt-0.5">{reason.desc}</div>
                      </div>
                      <ArrowLeft size={14} className="text-pair-textMuted/30 group-hover:text-pair-accent/50 transition-colors rotate-180" />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* 暂离备注 */}
              <motion.div
                className="mb-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <PenLine size={13} className="text-pair-textMuted/60" />
                  <span className="text-xs text-pair-textMuted/70">补充说明（可选）</span>
                </div>
                <textarea
                  value={awayNote}
                  onChange={(e) => setAwayNote(e.target.value)}
                  placeholder="记录暂离的具体情况..."
                  rows={2}
                  className="w-full px-4 py-3 bg-pair-surfaceAlt/60 rounded-2xl border border-pair-border/40 text-sm text-pair-text focus:border-pair-accent/30 focus:outline-none focus:ring-2 focus:ring-pair-accent/8 resize-none transition-all duration-300 hover:bg-pair-surfaceAlt/80"
                />
              </motion.div>

              <motion.button
                onClick={() => setShowConfirmAway(false)}
                className="w-full py-3.5 bg-pair-surfaceAlt/60 rounded-2xl text-sm font-medium text-pair-textSecondary border border-pair-border/30 hover:bg-pair-surfaceAlt hover:border-pair-border/50 transition-all duration-300"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
              >
                取消
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
