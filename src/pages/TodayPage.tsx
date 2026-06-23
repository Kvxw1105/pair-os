import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch, useActiveAction, useAwayAction, useTodayActions, useActionDispatch, useApi } from '../stores/AppStore';
import { formatDuration, formatDateFull, getStateLabel, getStateColor } from '../utils/time';
import { motion, AnimatePresence } from 'framer-motion';
import { DreamParticles } from '../components/DreamParticles';
import { GlowingOrb, FloatingElement } from '../components/DreamEffects';
import {
  Pause, RotateCcw, ChevronRight, Zap, Sparkles, User,
  Target, TrendingUp, Wind, Compass, Loader2, Flame, Clock
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function TodayPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const actionDispatch = useActionDispatch();
  const state = useAppState();
  const activeAction = useActiveAction();
  const awayAction = useAwayAction();
  const todayActions = useTodayActions();
  const api = useApi();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiRefining, setAiRefining] = useState(false);
  const [refinedSteps, setRefinedSteps] = useState<string[] | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logTitle, setLogTitle] = useState('');
  const [logDuration, setLogDuration] = useState('');
  const [logResult, setLogResult] = useState<'completed' | 'partial' | 'abandoned'>('completed');
  const [logNote, setLogNote] = useState('');
  const [logLoading, setLogLoading] = useState(false);

  const profile = state.profile;

  useEffect(() => {
    if (state.isOnboarding && !profile?.onboardingCompleted) {
      navigate('/onboarding');
    }
  }, [state.isOnboarding, profile, navigate]);

  useEffect(() => {
    if (!activeAction) return;
    const timer = setInterval(() => {
      if (activeAction.startedAt) {
        setElapsed(activeAction.totalDurationMs + (Date.now() - activeAction.startedAt));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeAction]);

  const handleStart = async (title: string) => {
    if (!title.trim()) return;
    await actionDispatch.startAction(title.trim(), profile?.preferences.defaultVisibility || 'solo');
    setInputValue('');
    setShowSuggestions(false);
    setRefinedSteps(null);
  };

  const handleRefine = async () => {
    if (!inputValue.trim() || !api.isAuthenticated()) return;
    setAiRefining(true);
    try {
      const result = await api.refineAction(inputValue.trim());
      setRefinedSteps(result.steps || []);
    } catch (err) {
      console.error('Refine failed:', err);
    } finally {
      setAiRefining(false);
    }
  };

  const handleLogAction = async () => {
    if (!logTitle.trim() || !logDuration.trim()) return;
    const minutes = parseInt(logDuration, 10);
    if (isNaN(minutes) || minutes <= 0) return;
    setLogLoading(true);
    try {
      await actionDispatch.logAction(
        logTitle.trim(),
        minutes,
        logResult,
        logResult === 'completed' ? 100 : logResult === 'partial' ? 50 : null,
        logNote.trim(),
        profile?.preferences.defaultVisibility || 'solo'
      );
      setShowLogModal(false);
      setLogTitle('');
      setLogDuration('');
      setLogResult('completed');
      setLogNote('');
    } catch (err) {
      console.error('Log action failed:', err);
    } finally {
      setLogLoading(false);
    }
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    setRefinedSteps(null);
    if (val.length > 1) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const todayCompleted = todayActions.filter((a) => a.state === 'completed' || a.state === 'partial');
  const totalDurationToday = todayActions.reduce((sum, a) => sum + a.totalDurationMs, 0);
  const partner = state.partner;

  return (
    <div className="relative min-h-[100dvh] dream-bg overflow-hidden">
      {/* Background particles */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <DreamParticles />
      </div>

      {/* Glowing orbs */}
      <GlowingOrb color="rgba(123, 109, 181, 0.08)" size={300} className="top-[-50px] right-[-80px]" blur={80} />
      <GlowingOrb color="rgba(184, 149, 106, 0.06)" size={250} className="bottom-[200px] left-[-60px]" blur={70} />
      <GlowingOrb color="rgba(74, 139, 122, 0.05)" size={200} className="top-[40%] right-[10%]" blur={60} />

      <motion.div
        className="relative px-5 pt-10 pb-8 max-w-lg mx-auto"
        style={{ zIndex: 1 }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
          <div>
            <motion.h1
              className="text-2xl font-bold text-pair-text tracking-tight"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
            >
              今天
            </motion.h1>
            <motion.p
              className="text-xs text-pair-textMuted mt-1.5 tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {formatDateFull(Date.now())}
            </motion.p>
          </div>
          {profile?.mainLine && (
            <motion.span
              className="text-[11px] px-3 py-1.5 bg-gradient-to-r from-pair-primaryLight/70 to-pair-accentLight/50 text-pair-primary rounded-full font-semibold border border-pair-primary/10 shadow-inner-glow backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            >
              {profile.mainLine}
            </motion.span>
          )}
        </motion.div>

        {/* Quick Start — 梦幻输入框 */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="relative group">
            {/* Animated glow ring */}
            <motion.div
              className="absolute inset-0 rounded-3xl blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"
              style={{
                background: isFocused
                  ? 'linear-gradient(135deg, rgba(184,149,106,0.15), rgba(27,61,46,0.1), rgba(123,109,181,0.12))'
                  : 'transparent',
              }}
              animate={isFocused ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-pair-primary/5 via-pair-accent/3 to-pair-stuck/5 opacity-0 group-focus-within:opacity-100 transition-all duration-500 blur-xl scale-[1.03]" />

            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart(inputValue)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="说一句话，开始行动..."
              className="relative w-full px-5 py-5 pr-16 bg-pair-surface/90 backdrop-blur-md rounded-3xl border border-pair-border/40 focus:border-pair-accent/40 focus:outline-none focus:ring-2 focus:ring-pair-accent/10 text-sm shadow-card transition-all duration-500 placeholder:text-pair-textMuted/50 hover:shadow-card-hover"
            />

            <motion.button
              onClick={() => handleStart(inputValue)}
              disabled={!inputValue.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3.5 rounded-2xl bg-gradient-to-br from-pair-primary to-pair-primaryMuted text-white shadow-glow-primary transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
              whileHover={inputValue.trim() ? { scale: 1.05, boxShadow: '0 0 30px rgba(27,61,46,0.2)' } : {}}
              whileTap={inputValue.trim() ? { scale: 0.92 } : {}}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <Zap size={18} strokeWidth={2.5} />
            </motion.button>
          </div>

          {/* Log Action Button */}
          <motion.button
            onClick={() => setShowLogModal(true)}
            className="mt-2 text-xs text-pair-textMuted/60 hover:text-pair-accent transition-colors flex items-center gap-1"
            whileHover={{ x: 2 }}
          >
            忘了开始？补记一项 →
          </motion.button>

          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mt-3 space-y-2 overflow-hidden"
              >
                <motion.button
                  onClick={() => handleStart(inputValue)}
                  className="w-full text-left px-4 py-3.5 bg-pair-surface/80 backdrop-blur rounded-2xl text-sm text-pair-textSecondary hover:bg-gradient-to-r hover:from-pair-primaryLight/50 hover:to-pair-accentLight/30 hover:text-pair-primary transition-all duration-300 flex items-center gap-2.5 border border-pair-border/30 hover:border-pair-primary/20 hover:shadow-soft group"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="p-1.5 rounded-lg bg-pair-primary/10"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Zap size={14} className="text-pair-primary/70" />
                  </motion.div>
                  <span className="truncate">「{inputValue}」— 直接开始</span>
                  <ChevronRight size={14} className="ml-auto text-pair-textMuted/40 group-hover:text-pair-primary/60 transition-colors" />
                </motion.button>

                {api.isAuthenticated() && !refinedSteps && (
                  <motion.button
                    onClick={handleRefine}
                    disabled={aiRefining}
                    className="w-full text-left px-4 py-3.5 bg-pair-surface/80 backdrop-blur rounded-2xl text-sm text-pair-textSecondary hover:bg-gradient-to-r hover:from-pair-accentLight/50 hover:to-pair-warnLight/30 hover:text-pair-accent transition-all duration-300 flex items-center gap-2.5 border border-pair-border/30 hover:border-pair-accent/20 hover:shadow-soft group disabled:opacity-50"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    <motion.div
                      className="p-1.5 rounded-lg bg-pair-accent/10"
                      animate={aiRefining ? { rotate: 360 } : {}}
                      transition={{ duration: 1, repeat: aiRefining ? Infinity : 0, ease: 'linear' }}
                    >
                      {aiRefining ? (
                        <Loader2 size={14} className="text-pair-accent/70" />
                      ) : (
                        <Sparkles size={14} className="text-pair-accent/70" />
                      )}
                    </motion.div>
                    <span className="truncate">{aiRefining ? 'AI 正在细化...' : 'AI 帮我细化这个行动'}</span>
                    <ChevronRight size={14} className="ml-auto text-pair-textMuted/40 group-hover:text-pair-accent/60 transition-colors" />
                  </motion.button>
                )}

                {refinedSteps && refinedSteps.map((step, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handleStart(step)}
                    className="w-full text-left px-4 py-3.5 bg-gradient-to-r from-pair-primaryLight/40 to-pair-accentLight/20 backdrop-blur rounded-2xl text-sm text-pair-primary hover:from-pair-primaryLight/60 hover:to-pair-accentLight/40 transition-all duration-300 flex items-center gap-2.5 border border-pair-primary/15 hover:border-pair-primary/30 hover:shadow-soft group"
                    whileHover={{ x: 4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <motion.span
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-pair-primary/15 to-pair-accent/10 flex items-center justify-center text-[10px] font-bold text-pair-primary flex-shrink-0 border border-pair-primary/10"
                      whileHover={{ scale: 1.15, rotate: 5 }}
                    >
                      {i + 1}
                    </motion.span>
                    <span className="truncate">{step}</span>
                    <motion.div
                      className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                      whileHover={{ x: 3 }}
                    >
                      <Zap size={12} className="text-pair-primary/50" />
                    </motion.div>
                  </motion.button>
                ))}

                {refinedSteps && (
                  <motion.button
                    onClick={() => setRefinedSteps(null)}
                    className="w-full text-center px-4 py-2 text-xs text-pair-textMuted/60 hover:text-pair-textMuted transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    收起细化建议
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Resume Card — 暂离中 */}
        <AnimatePresence>
          {awayAction && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95, filter: 'blur(4px)' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
              className="mb-6"
            >
              <div className="relative bg-gradient-to-br from-pair-warnLight/80 to-pair-accentLight/40 border border-pair-accent/15 rounded-3xl p-5 shadow-card hover:shadow-card-hover transition-shadow duration-500 overflow-hidden backdrop-blur-sm group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pair-accent/8 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-pair-warn/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2.5 mb-3">
                    <motion.div
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-pair-accent/20 to-pair-warn/15 flex items-center justify-center border border-pair-accent/10"
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Pause size={14} className="text-pair-accent" />
                    </motion.div>
                    <span className="text-xs font-semibold text-pair-accent tracking-wide">暂离中</span>
                    <span className="text-[11px] text-pair-textMuted/70 ml-auto">
                      {awayAction.awayReason === 'external_task' && '外部事务'}
                      {awayAction.awayReason === 'interrupted_by_someone' && '被人打断'}
                      {awayAction.awayReason === 'env_issue' && '环境问题'}
                      {awayAction.awayReason === 'distraction' && '主动分心'}
                      {awayAction.awayReason === 'physical' && '身体/精力'}
                      {awayAction.awayReason === 'none' && '暂离'}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-bold text-pair-text mb-1.5">{awayAction.title}</h3>
                  <p className="text-xs text-pair-textMuted/80 mb-5">
                    已进行 {formatDuration(awayAction.totalDurationMs)} · 暂离于 {formatDuration(Date.now() - (awayAction.lastAwayAt || 0))} 前
                  </p>
                  <motion.button
                    onClick={() => navigate(`/action/${awayAction.id}`)}
                    className="w-full py-3.5 bg-gradient-to-r from-pair-accent to-pair-accentMuted text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-glow-accent hover:shadow-glow-accent transition-all duration-300"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <RotateCcw size={16} strokeWidth={2.5} />
                    继续刚才的行动
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Action Card — 心流聚焦 */}
        <AnimatePresence>
          {activeAction && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, scale: 0.95, filter: 'blur(4px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6"
            >
              <div className="relative bg-gradient-to-br from-pair-primary via-pair-primaryMuted to-pair-primary rounded-3xl p-6 shadow-glow-primary overflow-hidden group">
                {/* Animated rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] rounded-full border border-white/3 animate-pulse-slower" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] rounded-full border border-white/2 animate-pulse-slow" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-white/[0.06] to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pair-accent/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                {/* Shimmer overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2.5 mb-4">
                    <motion.div
                      className="w-3 h-3 rounded-full bg-gradient-to-br from-pair-success to-emerald-400"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-[11px] font-medium text-white/60 tracking-widest uppercase">进行中</span>
                    <motion.div
                      className="ml-auto flex items-center gap-1 text-[10px] text-white/40"
                      animate={{ opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Flame size={10} />
                      <span>心流</span>
                    </motion.div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1 tracking-tight text-shadow-soft">{activeAction.title}</h3>
                  <div className="text-4xl font-mono font-light tracking-wider text-white/95 mb-6 tabular-nums">
                    {formatDuration(elapsed)}
                  </div>

                  <motion.button
                    onClick={() => navigate(`/action/${activeAction.id}`)}
                    className="w-full py-3.5 bg-white/10 backdrop-blur-md rounded-2xl text-sm font-medium text-white/90 hover:bg-white/20 transition-all duration-300 border border-white/10 hover:border-white/20 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Clock size={15} />
                    进入专注模式
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Partner Status */}
        <AnimatePresence>
          {partner && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6"
            >
              <motion.div variants={itemVariants} className="flex items-center gap-2 mb-3">
                <Compass size={13} className="text-pair-textMuted/60" />
                <span className="text-[11px] font-semibold text-pair-textMuted/80 tracking-wider uppercase">伙伴状态</span>
              </motion.div>

              <motion.div
                className="relative bg-pair-surface/90 backdrop-blur-sm rounded-3xl p-4 border border-pair-border/40 shadow-card hover:shadow-card-hover transition-all duration-500 overflow-hidden group cursor-pointer"
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate('/partner')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pair-primary/3 via-transparent to-pair-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-center gap-3.5">
                  <motion.div
                    className="w-11 h-11 rounded-full bg-gradient-to-br from-pair-primaryLight/70 to-pair-accentLight/40 flex items-center justify-center border border-pair-primary/15"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <User size={19} className="text-pair-primary" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-pair-text">{partner.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getPartnerStatusColor(partner.status)}`}>
                        {getPartnerStatusLabel(partner.status)}
                      </span>
                    </div>
                    <p className="text-xs text-pair-textMuted/80 truncate mt-1">
                      {partner.currentActionTitle || '暂无进行中的行动'}
                    </p>
                  </div>
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ChevronRight size={16} className="text-pair-textMuted/40" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Today's Summary */}
        <AnimatePresence>
          {todayActions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6"
            >
              <motion.div variants={itemVariants} className="flex items-center gap-2 mb-3">
                <TrendingUp size={13} className="text-pair-textMuted/60" />
                <span className="text-[11px] font-semibold text-pair-textMuted/80 tracking-wider uppercase">今日轨迹</span>
              </motion.div>

              <motion.div
                className="relative bg-pair-surface/90 backdrop-blur-sm rounded-3xl p-5 border border-pair-border/40 shadow-card hover:shadow-card-hover transition-all duration-500 overflow-hidden group"
                whileHover={{ y: -2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pair-success/3 via-transparent to-pair-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 flex items-center justify-between mb-6">
                  {[
                    { value: todayCompleted.length, label: '已完成', color: 'text-pair-success', glow: 'shadow-glow-success' },
                    { value: todayActions.length, label: '总行动', color: 'text-pair-text', glow: 'shadow-glow-primary' },
                    { value: formatDurationShort(totalDurationToday), label: '总时长', color: 'text-pair-primary', glow: 'shadow-glow-primary' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      className="text-center flex-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
                    >
                      <motion.div
                        className={`text-xl font-bold ${stat.color} ${i === 2 ? 'text-shadow-glow' : ''}`}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        {stat.value}
                      </motion.div>
                      <div className="text-[10px] text-pair-textMuted/70 mt-1">{stat.label}</div>
                    </motion.div>
                  ))}
                  <div className="w-px h-12 bg-gradient-to-b from-transparent via-pair-border/60 to-transparent" />
                </div>

                <div className="space-y-2">
                  {todayActions.slice(0, 4).map((action, i) => (
                    <motion.div
                      key={action.id}
                      className="flex items-center gap-3 py-2 px-1 rounded-xl hover:bg-pair-surfaceAlt/50 transition-colors duration-300 group/item"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.06 }}
                      whileHover={{ x: 4 }}
                    >
                      <motion.div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          action.state === 'active' ? 'bg-gradient-to-br from-pair-success to-emerald-400 shadow-glow-success' :
                          action.state === 'away' ? 'bg-gradient-to-br from-pair-accent to-amber-300 shadow-glow-warn' :
                          action.state === 'blocked' ? 'bg-gradient-to-br from-pair-stuck to-violet-400 shadow-glow-stuck' :
                          action.state === 'completed' ? 'bg-gradient-to-br from-pair-success to-emerald-400 shadow-glow-success' :
                          action.state === 'partial' ? 'bg-gradient-to-br from-pair-accent to-amber-300 shadow-glow-warn' :
                          'bg-pair-textMuted'
                        }`}
                        whileHover={{ scale: 1.5 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      />
                      <span className="text-sm text-pair-text flex-1 truncate group-hover/item:text-pair-primary transition-colors">{action.title}</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${getStateColor(action.state)}`}>
                        {getStateLabel(action.state)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State — Dreamy */}
        <AnimatePresence>
          {!activeAction && !awayAction && todayActions.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center py-20"
            >
              <FloatingElement duration={5}>
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pair-surfaceAlt/90 to-pair-surface/80 flex items-center justify-center mx-auto mb-6 shadow-card border border-pair-border/30 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-pair-primary/3 via-transparent to-pair-accent/3" />
                  <Wind size={36} className="text-pair-textMuted/30 relative z-10" />
                </div>
              </FloatingElement>
              <motion.p
                className="text-sm text-pair-textSecondary/80 font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                今天还没有行动
              </motion.p>
              <motion.p
                className="text-xs text-pair-textMuted/60 mt-2 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                在上面输入一句话，开始你的第一次行动。<br/>不需要完整计划，先做起来。
              </motion.p>

              {/* Quick Start Examples — Onboarding */}
              <motion.div
                className="mt-6 flex flex-col items-center gap-2.5"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <p className="text-[11px] text-pair-textMuted/50 mb-1">或者选一个试试：</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <motion.button
                    onClick={() => handleStart('先写5分钟')}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.4 }}
                    className="px-4 py-2.5 rounded-2xl text-sm font-medium bg-gradient-to-r from-pair-primary/10 to-pair-accent/5 border border-pair-primary/20 text-pair-primary hover:from-pair-primary/20 hover:to-pair-accent/10 backdrop-blur-sm transition-all duration-300 shadow-card hover:shadow-card-hover flex items-center gap-2"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>✍️</span> 先写5分钟
                  </motion.button>
                  <motion.button
                    onClick={() => handleStart('整理桌面')}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.78, duration: 0.4 }}
                    className="px-4 py-2.5 rounded-2xl text-sm font-medium bg-gradient-to-r from-pair-accent/10 to-pair-warn/5 border border-pair-accent/20 text-pair-accent hover:from-pair-accent/20 hover:to-pair-warn/10 backdrop-blur-sm transition-all duration-300 shadow-card hover:shadow-card-hover flex items-center gap-2"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>🧹</span> 整理桌面
                  </motion.button>
                  <motion.button
                    onClick={() => handleStart('阅读15分钟')}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.86, duration: 0.4 }}
                    className="px-4 py-2.5 rounded-2xl text-sm font-medium bg-gradient-to-r from-pair-stuck/10 to-pair-primary/5 border border-pair-stuck/20 text-pair-stuck hover:from-pair-stuck/20 hover:to-pair-primary/10 backdrop-blur-sm transition-all duration-300 shadow-card hover:shadow-card-hover flex items-center gap-2"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>📖</span> 阅读15分钟
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Together CTA */}
        <AnimatePresence>
          {partner && !activeAction && !awayAction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.button
                onClick={() => dispatch({ type: 'INVITE_PARTNER' })}
                className="w-full py-4 bg-gradient-to-r from-pair-surface/90 to-pair-primaryLight/30 border border-pair-primary/15 rounded-3xl text-sm font-semibold text-pair-primary flex items-center justify-center gap-2.5 hover:from-pair-primaryLight/50 hover:to-pair-accentLight/20 hover:border-pair-primary/25 transition-all duration-500 shadow-card hover:shadow-card-hover backdrop-blur-sm relative overflow-hidden group"
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pair-primary/3 via-transparent to-pair-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative z-10"
                >
                  <Target size={16} strokeWidth={2.5} />
                </motion.div>
                <span className="relative z-10">邀请小K一起开始 10 分钟</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Log Action Modal */}
        <AnimatePresence>
          {showLogModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-md"
              onClick={() => setShowLogModal(false)}
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
                <h3 className="text-lg font-bold text-pair-text mb-1">补记行动</h3>
                <p className="text-sm text-pair-textMuted/70 mb-5">做完之后才想起来？没关系，补上去。</p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-pair-textMuted/70 mb-1.5 block">做了什么</label>
                    <input
                      type="text"
                      value={logTitle}
                      onChange={(e) => setLogTitle(e.target.value)}
                      placeholder="例如：阅读30分钟"
                      className="w-full px-4 py-3 bg-pair-surfaceAlt/60 rounded-2xl border border-pair-border/40 text-sm text-pair-text focus:border-pair-primary/30 focus:outline-none focus:ring-2 focus:ring-pair-primary/8 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-pair-textMuted/70 mb-1.5 block">用时（分钟）</label>
                    <input
                      type="number"
                      value={logDuration}
                      onChange={(e) => setLogDuration(e.target.value)}
                      placeholder="30"
                      min={1}
                      max={1440}
                      className="w-full px-4 py-3 bg-pair-surfaceAlt/60 rounded-2xl border border-pair-border/40 text-sm text-pair-text focus:border-pair-primary/30 focus:outline-none focus:ring-2 focus:ring-pair-primary/8 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-pair-textMuted/70 mb-1.5 block">结果</label>
                    <div className="flex gap-2">
                      {[
                        { key: 'completed' as const, label: '完成', color: 'from-pair-success to-emerald-500' },
                        { key: 'partial' as const, label: '部分', color: 'from-pair-warn to-amber-500' },
                        { key: 'abandoned' as const, label: '放弃', color: 'from-pair-text to-slate-500' },
                      ].map((opt) => (
                        <motion.button
                          key={opt.key}
                          onClick={() => setLogResult(opt.key)}
                          className={`flex-1 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                            logResult === opt.key
                              ? `bg-gradient-to-r ${opt.color} text-white shadow-card`
                              : 'bg-pair-surfaceAlt/60 border border-pair-border/40 text-pair-textSecondary hover:bg-pair-surfaceAlt'
                          }`}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {opt.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-pair-textMuted/70 mb-1.5 block">备注（可选）</label>
                    <textarea
                      value={logNote}
                      onChange={(e) => setLogNote(e.target.value)}
                      placeholder="记录一下当时的情况..."
                      rows={2}
                      className="w-full px-4 py-3 bg-pair-surfaceAlt/60 rounded-2xl border border-pair-border/40 text-sm text-pair-text focus:border-pair-primary/30 focus:outline-none focus:ring-2 focus:ring-pair-primary/8 resize-none transition-all"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <motion.button
                      onClick={() => setShowLogModal(false)}
                      className="flex-1 py-3.5 bg-pair-surfaceAlt/60 rounded-2xl text-sm font-medium text-pair-textSecondary border border-pair-border/40 hover:bg-pair-surfaceAlt transition-all"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      取消
                    </motion.button>
                    <motion.button
                      onClick={handleLogAction}
                      disabled={logLoading || !logTitle.trim() || !logDuration.trim()}
                      className="flex-1 py-3.5 bg-gradient-to-r from-pair-primary to-pair-primaryMuted text-white rounded-2xl text-sm font-medium shadow-glow-primary hover:shadow-glow-primary transition-all disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {logLoading ? '保存中...' : '确认补记'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}

function getPartnerStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    idle: '空闲',
    active: '进行中',
    away: '暂离',
    blocked: '卡住',
  };
  return labels[status] || status;
}

function getPartnerStatusColor(status: string): string {
  const colors: Record<string, string> = {
    idle: 'bg-gradient-to-r from-pair-surfaceAlt to-pair-surface text-pair-textMuted/70',
    active: 'bg-gradient-to-r from-pair-successLight to-emerald-50/50 text-pair-success',
    away: 'bg-gradient-to-r from-pair-warnLight to-amber-50/50 text-pair-warn',
    blocked: 'bg-gradient-to-r from-pair-stuckLight to-violet-50/50 text-pair-stuck',
  };
  return colors[status] || 'bg-pair-surfaceAlt text-pair-textMuted';
}

function formatDurationShort(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h${minutes}m`;
  return `${minutes}m`;
}
