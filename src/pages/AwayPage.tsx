import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useActionTimer, useActionDispatch } from '../stores/AppStore';
import { formatDuration } from '../utils/time';
import { motion, AnimatePresence } from 'framer-motion';
import { DreamParticles } from '../components/DreamParticles';
import { GlowingOrb } from '../components/DreamEffects';
import { RotateCcw, Bell, BellOff, Clock, ArrowLeft, PenLine, Wind } from 'lucide-react';

const returnOptions = [
  { label: '10分钟', ms: 10 * 60 * 1000, icon: '⏱' },
  { label: '30分钟', ms: 30 * 60 * 1000, icon: '☕' },
  { label: '1小时', ms: 60 * 60 * 1000, icon: '🍽' },
  { label: '今天稍后', ms: 4 * 60 * 60 * 1000, icon: '🌅' },
  { label: '不确定', ms: 0, icon: '🔮' },
];

export function AwayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const actionDispatch = useActionDispatch();
  const { action, getElapsed } = useActionTimer(id || null);
  const [elapsed, setElapsed] = useState(0);
  const [selectedReturn, setSelectedReturn] = useState<number | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [awayNote, setAwayNote] = useState('');

  useEffect(() => {
    if (!action) return;
    const timer = setInterval(() => {
      setElapsed(getElapsed());
    }, 1000);
    return () => clearInterval(timer);
  }, [action, getElapsed]);

  if (!action || action.state !== 'away') {
    return (
      <div className="min-h-[100dvh] dream-bg flex items-center justify-center">
        <p className="text-pair-textSecondary">暂无暂离中的行动</p>
      </div>
    );
  }

  const awayTime = Date.now() - (action.lastAwayAt || Date.now());

  const handleReturn = async () => {
    await actionDispatch.resumeAction(action.id);
    if (selectedReturn && selectedReturn > 0 && reminderEnabled) {
      dispatch({
        type: 'ADD_REMINDER',
        reminder: {
          id: `rem_${Date.now()}`,
          actionId: action.id,
          type: 'return',
          triggerAt: Date.now() + selectedReturn,
          message: `该继续「${action.title}」了`,
          confirmed: true,
          createdAt: Date.now(),
        },
      });
    }
    navigate(`/action/${action.id}`);
  };

  const handleEnd = () => {
    navigate(`/end/${action.id}`);
  };

  return (
    <div className="relative min-h-[100dvh] dream-bg flex flex-col overflow-hidden">
      {/* Background particles */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <DreamParticles />
      </div>

      <GlowingOrb color="rgba(184, 149, 106, 0.06)" size={300} className="top-[-50px] right-[-80px]" blur={80} />
      <GlowingOrb color="rgba(184, 149, 106, 0.04)" size={250} className="bottom-[200px] left-[-60px]" blur={70} />

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
            <h1 className="text-lg font-bold text-pair-text tracking-tight">暂离</h1>
          </div>
        </motion.div>

        <div className="flex-1 flex flex-col px-5 py-4">
          {/* Status Card */}
          <motion.div
            className="bg-gradient-to-br from-pair-warnLight/80 to-pair-accentLight/40 border border-pair-accent/15 rounded-3xl p-6 mb-6 shadow-card hover:shadow-card-hover transition-all duration-500 relative overflow-hidden group backdrop-blur-sm"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-pair-accent/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-pair-warn/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-4">
                <motion.div
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-pair-accent/20 to-pair-warn/15 flex items-center justify-center border border-pair-accent/10"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Clock size={16} className="text-pair-accent" />
                </motion.div>
                <span className="text-sm font-semibold text-pair-accent">已保存现场</span>
                <motion.div
                  className="ml-auto flex items-center gap-1 text-[10px] text-pair-accent/50"
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Wind size={10} />
                  <span>暂离中</span>
                </motion.div>
              </div>
              <h3 className="text-lg font-bold text-pair-text mb-1.5">{action.title}</h3>
              <div className="text-sm text-pair-textMuted/80 space-y-1">
                <p>已进行 {formatDuration(elapsed)}</p>
                <p>暂离 {formatDuration(awayTime)}</p>
              </div>
            </div>
          </motion.div>

          {/* Return Options */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <p className="text-sm font-semibold text-pair-textSecondary mb-3">预计什么时候回来？</p>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {returnOptions.map((opt, i) => (
                  <motion.button
                    key={opt.label}
                    onClick={() => setSelectedReturn(selectedReturn === opt.ms ? null : opt.ms)}
                    initial={{ opacity: 0, scale: 0.9, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                    className={`px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                      selectedReturn === opt.ms
                        ? 'bg-gradient-to-r from-pair-accent to-pair-accentMuted text-white shadow-glow-accent scale-105'
                        : 'bg-pair-surface/80 backdrop-blur border border-pair-border/50 text-pair-textSecondary hover:bg-gradient-to-r hover:from-pair-warnLight/50 hover:to-pair-accentLight/30 hover:text-pair-accent hover:border-pair-accent/20 hover:shadow-soft'
                    }`}
                    whileHover={{ scale: selectedReturn === opt.ms ? 1.05 : 1.08, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="mr-1">{opt.icon}</span>
                    {opt.label}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Reminder Toggle */}
          <AnimatePresence>
            {selectedReturn !== null && selectedReturn > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                className="mb-5 overflow-hidden"
              >
                <motion.button
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className="flex items-center gap-3 px-4 py-3.5 bg-pair-surface/80 backdrop-blur rounded-2xl border border-pair-border/50 w-full hover:shadow-soft transition-all duration-300"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    animate={{ rotate: reminderEnabled ? [0, 15, -15, 0] : 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {reminderEnabled ? (
                      <Bell size={18} className="text-pair-accent" />
                    ) : (
                      <BellOff size={18} className="text-pair-textMuted" />
                    )}
                  </motion.div>
                  <span className="text-sm text-pair-text">
                    {reminderEnabled ? '到时提醒我回来' : '不用提醒'}
                  </span>
                  <div className={`ml-auto w-11 h-6 rounded-full relative transition-colors duration-300 ${
                    reminderEnabled ? 'bg-gradient-to-r from-pair-accent to-pair-accentMuted' : 'bg-pair-border'
                  }`}>
                    <motion.div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                      animate={{ x: reminderEnabled ? 22 : 4 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </div>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 暂离备注 */}
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <div className="flex items-center gap-2 mb-2">
              <PenLine size={13} className="text-pair-textMuted/60" />
              <span className="text-xs text-pair-textMuted/70">暂离备注（可选）</span>
            </div>
            <textarea
              value={awayNote}
              onChange={(e) => setAwayNote(e.target.value)}
              placeholder="记录暂离时的想法和情况..."
              rows={2}
              className="w-full px-4 py-3 bg-pair-surface/80 backdrop-blur rounded-2xl border border-pair-border/50 text-sm text-pair-text focus:border-pair-accent/30 focus:outline-none focus:ring-2 focus:ring-pair-accent/8 resize-none transition-all duration-300 hover:bg-pair-surface/90"
            />
          </motion.div>

          <div className="space-y-3 mt-auto mb-6">
            <motion.button
              onClick={handleReturn}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
              className="w-full py-4 bg-gradient-to-r from-pair-accent to-pair-accentMuted text-white rounded-3xl font-semibold text-sm flex items-center justify-center gap-2 shadow-glow-accent hover:shadow-glow-accent transition-all duration-300"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <RotateCcw size={18} strokeWidth={2.5} />
              现在回来，继续行动
            </motion.button>
            <motion.button
              onClick={handleEnd}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
              className="w-full py-4 bg-gradient-to-r from-pair-surface/90 to-pair-surface/70 border border-pair-border/50 text-pair-textSecondary rounded-3xl font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-card-hover transition-all duration-300"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
            >
              结束并记录
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
