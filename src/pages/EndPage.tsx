import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState, useActionDispatch } from '../stores/AppStore';
import { formatDuration } from '../utils/time';
import { motion, AnimatePresence } from 'framer-motion';
import { DreamParticles } from '../components/DreamParticles';
import { GlowingOrb } from '../components/DreamEffects';
import { ArrowLeft, CheckCircle2, Circle, AlertCircle, XCircle, ChevronRight, PenLine, Save } from 'lucide-react';
import type { ResultType } from '../types';

const results: { key: ResultType; label: string; color: string; icon: typeof CheckCircle2; desc: string; accent: string; gradient: string; shadow: string; iconColor: string }[] = [
  { key: 'completed', label: '完成', color: 'bg-pair-success text-white', icon: CheckCircle2, desc: '达到了本次预期结果', accent: 'bg-pair-successLight text-pair-success', gradient: 'from-pair-success to-emerald-500', shadow: 'shadow-glow-success', iconColor: 'text-pair-success' },
  { key: 'partial', label: '部分完成', color: 'bg-pair-warn text-white', icon: Circle, desc: '有真实推进，但未达到完整标准', accent: 'bg-pair-warnLight text-pair-warn', gradient: 'from-pair-warn to-amber-500', shadow: 'shadow-glow-warn', iconColor: 'text-pair-warn' },
  { key: 'failed', label: '未完成', color: 'bg-pair-text text-white', icon: AlertCircle, desc: '本次没有形成计划中的结果', accent: 'bg-pair-surfaceAlt text-pair-textMuted', gradient: 'from-pair-text to-slate-500', shadow: 'shadow-card', iconColor: 'text-pair-textMuted' },
  { key: 'cancelled', label: '取消', color: 'bg-pair-surfaceAlt text-pair-textMuted border border-pair-border', icon: XCircle, desc: '行动不再需要或创建错误', accent: 'bg-pair-surfaceAlt text-pair-textMuted', gradient: 'from-pair-surfaceAlt to-pair-border', shadow: 'shadow-card', iconColor: 'text-pair-textMuted' },
];

export function EndPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const actionDispatch = useActionDispatch();
  const state = useAppState();
  const action = state.actions.find((a) => a.id === id);

  const [selectedResult, setSelectedResult] = useState<ResultType | null>(null);
  const [completion, setCompletion] = useState<number | null>(null);
  const [customPercent, setCustomPercent] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [note, setNote] = useState('');
  const [step, setStep] = useState(1);

  if (!action) {
    return (
      <div className="min-h-[100dvh] dream-bg flex items-center justify-center">
        <p className="text-pair-textSecondary">行动未找到</p>
      </div>
    );
  }

  const totalElapsed = action.totalDurationMs + (
    action.state === 'active' && action.startedAt
      ? Date.now() - action.startedAt
      : 0
  );

  const getFinalPercent = (): number | null => {
    if (selectedResult === 'completed') return 100;
    if (selectedResult === 'cancelled') return null;
    if (useCustom && customPercent) {
      const p = parseInt(customPercent, 10);
      if (!isNaN(p) && p >= 0 && p <= 100) return p;
    }
    return completion;
  };

  const handleSelectResult = (result: ResultType) => {
    setSelectedResult(result);
    if (result === 'partial') {
      setStep(2);
    } else if (result === 'completed') {
      handleFinish(100);
    } else if (result === 'cancelled') {
      handleFinish(null);
    } else {
      setStep(2);
    }
  };

  const handleFinish = async (percent: number | null) => {
    if (!selectedResult) return;
    const result = selectedResult === 'failed' ? 'abandoned' : selectedResult === 'cancelled' ? 'abandoned' : selectedResult;
    await actionDispatch.endAction(action.id, result as 'completed' | 'partial' | 'abandoned', percent, note.trim());
    navigate('/');
  };

  const resultConfig = results.find((r) => r.key === selectedResult);

  return (
    <div className="relative min-h-[100dvh] dream-bg flex flex-col overflow-hidden">
      {/* Background particles */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <DreamParticles />
      </div>

      <GlowingOrb color="rgba(74, 139, 122, 0.06)" size={300} className="top-[-50px] right-[-80px]" blur={80} />
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
            onClick={() => navigate(-1)}
            className="p-2.5 -ml-2 rounded-2xl hover:bg-pair-surfaceAlt/70 transition-all duration-300 border border-transparent hover:border-pair-border/30"
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.93 }}
          >
            <ArrowLeft size={20} className="text-pair-textSecondary" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-pair-text tracking-tight">结束行动</h1>
          </div>
        </motion.div>

        <div className="flex-1 flex flex-col px-5 py-4">
          {/* Action Info Card */}
          <motion.div
            className="bg-pair-surface/90 backdrop-blur rounded-3xl p-5 border border-pair-border/50 shadow-card hover:shadow-card-hover transition-all duration-500 mb-6 relative overflow-hidden group"
            initial={{ opacity: 0, y: 15, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pair-primary/3 via-transparent to-pair-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <h3 className="text-base font-semibold text-pair-text mb-1">{action.title}</h3>
              <p className="text-sm text-pair-textMuted/80">总时长 {formatDuration(totalElapsed)}</p>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                className="flex-1"
              >
                <motion.p
                  className="text-sm font-medium text-pair-textSecondary mb-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  这次行动的结果？
                </motion.p>
                <div className="space-y-3">
                  {results.map((result, i) => {
                    const Icon = result.icon;
                    return (
                      <motion.button
                        key={result.key}
                        onClick={() => handleSelectResult(result.key)}
                        initial={{ opacity: 0, x: -15, y: 5 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                        className="w-full text-left px-5 py-4 bg-pair-surface/80 backdrop-blur rounded-3xl border border-pair-border/50 text-sm hover:shadow-card-hover hover:border-pair-accent/20 transition-all duration-500 flex items-center gap-4 group shadow-card"
                        whileHover={{ x: 8, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 bg-gradient-to-br from-transparent to-transparent group-hover:from-${result.gradient.split(' ')[0].replace('from-', '')}/10`}
                          style={{ background: 'transparent' }}
                        >
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${result.accent}`}>
                            <Icon size={18} />
                          </div>
                        </motion.div>
                        <div className="flex-1">
                          <div className="font-semibold text-pair-text text-[15px]">{result.label}</div>
                          <div className="text-xs text-pair-textMuted/70 mt-0.5">{result.desc}</div>
                        </div>
                        <motion.div
                          animate={{ x: [0, 3, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <ChevronRight size={18} className="text-pair-textMuted/40 group-hover:text-pair-accent/60 transition-colors" />
                        </motion.div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 2 && selectedResult && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                className="flex-1 flex flex-col"
              >
                <motion.div
                  className={`inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full text-xs font-medium self-start shadow-soft ${resultConfig?.accent}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                >
                  {resultConfig && <resultConfig.icon size={13} />}
                  {resultConfig?.label}
                </motion.div>

                {selectedResult === 'partial' && (
                  <motion.div
                    className="mb-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                  >
                    <p className="text-sm font-medium text-pair-textSecondary mb-3">完成了多少？</p>
                    <div className="flex gap-2 mb-3">
                      {[25, 50, 75, 100].map((p) => (
                        <motion.button
                          key={p}
                          onClick={() => { setCompletion(p); setUseCustom(false); }}
                          className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                            completion === p && !useCustom
                              ? 'bg-gradient-to-r from-pair-warn to-pair-accent text-white shadow-glow-warn'
                              : 'bg-pair-surface/80 backdrop-blur border border-pair-border/60 text-pair-textSecondary hover:bg-gradient-to-r hover:from-pair-warnLight/50 hover:to-pair-accentLight/30 hover:text-pair-warn hover:border-pair-warn/30'
                          }`}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {p}%
                        </motion.button>
                      ))}
                    </div>
                    <motion.div
                      className="flex items-center gap-3 px-4 py-3 bg-pair-surface/80 backdrop-blur rounded-2xl border border-pair-border/60 hover:border-pair-warn/30 transition-all duration-300"
                      whileHover={{ scale: 1.01 }}
                    >
                      <motion.div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${useCustom ? 'border-pair-warn bg-pair-warn' : 'border-pair-border hover:border-pair-warn/50'}`}
                        onClick={() => setUseCustom(!useCustom)}
                        whileTap={{ scale: 0.9 }}
                      >
                        {useCustom && <motion.div className="w-2 h-2 rounded-full bg-white" initial={{ scale: 0 }} animate={{ scale: 1 }} />}
                      </motion.div>
                      <span className="text-sm text-pair-textSecondary">自定义</span>
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={customPercent}
                          onChange={(e) => { setCustomPercent(e.target.value); setUseCustom(true); }}
                          placeholder="0-100"
                          className="w-16 px-2 py-1.5 bg-pair-surfaceAlt rounded-lg text-sm text-center border border-pair-border focus:border-pair-warn focus:outline-none transition-colors"
                        />
                        <span className="text-sm text-pair-textMuted">%</span>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {selectedResult === 'failed' && (
                  <motion.div
                    className="mb-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                  >
                    <p className="text-sm font-medium text-pair-textSecondary mb-3">主要原因？</p>
                    <div className="flex flex-wrap gap-2">
                      {['外部事务打断', '精力不足', '任务超出预期', '主动放弃', '其他'].map((reason, i) => (
                        <motion.button
                          key={reason}
                          onClick={() => setNote(reason)}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                          className={`px-4 py-2.5 rounded-2xl text-sm transition-all duration-300 ${
                            note === reason
                              ? 'bg-gradient-to-r from-pair-text to-slate-500 text-white shadow-card'
                              : 'bg-pair-surface/80 backdrop-blur border border-pair-border/60 text-pair-text hover:bg-pair-surfaceAlt'
                          }`}
                          whileHover={{ scale: 1.05, y: -1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {reason}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Note / 备注 */}
                <motion.div
                  className="mb-5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <PenLine size={14} className="text-pair-textMuted/60" />
                    <span className="text-sm font-medium text-pair-textSecondary">备注（可选）</span>
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="记录这次行动的真实情况..."
                    rows={3}
                    className="w-full px-4 py-3 bg-pair-surface/80 backdrop-blur rounded-2xl border border-pair-border/60 text-sm text-pair-text focus:border-pair-accent focus:outline-none focus:ring-2 focus:ring-pair-accent/10 resize-none transition-all duration-300 hover:bg-pair-surface/90"
                  />
                  <p className="text-[11px] text-pair-textMuted/60 mt-1.5">备注会出现在时间线中，帮助AI理解你的行动模式。</p>
                </motion.div>

                <div className="flex-1" />
                <div className="space-y-3 mb-6">
                  <motion.button
                    onClick={() => handleFinish(getFinalPercent())}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                    className="w-full py-4 bg-gradient-to-r from-pair-primary to-pair-primaryMuted text-white rounded-3xl font-medium text-sm flex items-center justify-center gap-2 shadow-glow-primary hover:shadow-glow-primary transition-all duration-300"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Save size={18} />
                    确认记录
                  </motion.button>
                  <motion.button
                    onClick={() => setStep(1)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                    className="w-full py-3.5 bg-gradient-to-r from-pair-surface/90 to-pair-surface/70 border border-pair-border/60 text-pair-textSecondary rounded-3xl text-sm font-medium hover:shadow-card-hover transition-all duration-300"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    返回重新选择
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
