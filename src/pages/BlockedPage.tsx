import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useActionDispatch, useApi, useAppState } from '../stores/AppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { DreamParticles } from '../components/DreamParticles';
import { GlowingOrb } from '../components/DreamEffects';
import { ArrowLeft, Sparkles, RotateCcw, ArrowRight, PenLine, Loader2, Zap, Lightbulb, AlertCircle } from 'lucide-react';

const blockedReasons = [
  {
    key: 'unknown_next' as const,
    label: '不知道下一步',
    fallbackResponse: '先运行项目，复制第一条报错。',
    action: '开始 10 分钟',
  },
  {
    key: 'too_big' as const,
    label: '任务太大',
    fallbackResponse: '只做当前能推进的最小步骤。',
    action: '缩小行动',
  },
  {
    key: 'error' as const,
    label: '遇到报错或困难',
    fallbackResponse: '粘贴报错信息，给出诊断动作。',
    action: '粘贴报错',
  },
  {
    key: 'resistance' as const,
    label: '不想做 / 抗拒',
    fallbackResponse: '只做 5 分钟，或者如实记录。',
    action: '只做 5 分钟',
  },
  {
    key: 'low_energy' as const,
    label: '精力不足',
    fallbackResponse: '降低强度版本或休息后提醒。',
    action: '低强度版本',
  },
  {
    key: 'need_help' as const,
    label: '需要他人协助',
    fallbackResponse: '标记需要帮助，由你确认是否通知伙伴。',
    action: '标记帮助',
  },
];

export function BlockedPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const actionDispatch = useActionDispatch();
  const api = useApi();
  const state = useAppState();
  const [selectedReason, setSelectedReason] = useState<typeof blockedReasons[0] | null>(null);
  const [showAiHelp, setShowAiHelp] = useState(false);
  const [blockedNote, setBlockedNote] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);

  const action = state.actions.find((a) => a.id === id);

  const handleBlock = async (reason: typeof blockedReasons[0]) => {
    setSelectedReason(reason);
    setShowAiHelp(true);
    setAiLoading(true);
    setAiError(false);
    setAiResponse('');

    await actionDispatch.blockAction(id!, reason.key);

    if (api.isAuthenticated()) {
      try {
        const result = await api.suggestBlocked(
          reason.label,
          action?.title || '当前行动',
          blockedNote
        );
        setAiResponse(result.suggestion);
      } catch (err) {
        console.error('AI suggest failed:', err);
        setAiError(true);
        setAiResponse(reason.fallbackResponse);
      } finally {
        setAiLoading(false);
      }
    } else {
      setAiResponse(reason.fallbackResponse);
      setAiLoading(false);
    }
  };

  const handleContinue = async () => {
    await actionDispatch.unblockAction(id!);
    navigate(`/action/${id}`);
  };

  const handleEnd = () => {
    navigate(`/end/${id}`);
  };

  return (
    <div className="relative min-h-[100dvh] dream-bg flex flex-col overflow-hidden">
      {/* Background particles */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <DreamParticles />
      </div>

      <GlowingOrb color="rgba(123, 109, 181, 0.07)" size={300} className="top-[-50px] right-[-80px]" blur={80} />
      <GlowingOrb color="rgba(123, 109, 181, 0.05)" size={250} className="bottom-[200px] left-[-60px]" blur={70} />

      <div className="relative flex-1 flex flex-col" style={{ zIndex: 1 }}>
        {/* Header */}
        <motion.div
          className="px-5 pt-8 pb-4 flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <motion.button
            onClick={() => navigate(`/action/${id}`)}
            className="p-2.5 -ml-2 rounded-2xl hover:bg-pair-surfaceAlt/70 transition-all duration-300 border border-transparent hover:border-pair-border/30"
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.93 }}
          >
            <ArrowLeft size={20} className="text-pair-textSecondary" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-pair-text tracking-tight">卡住了</h1>
          </div>
        </motion.div>

        <div className="flex-1 flex flex-col px-5 py-4">
          <AnimatePresence mode="wait">
            {!showAiHelp ? (
              <motion.div
                key="reasons"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                className="flex-1"
              >
                <motion.p
                  className="text-sm font-semibold text-pair-textSecondary mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  是什么让你卡住了？选一个最接近的：
                </motion.p>
                <div className="space-y-2.5">
                  {blockedReasons.map((reason, i) => (
                    <motion.button
                      key={reason.key}
                      onClick={() => handleBlock(reason)}
                      initial={{ opacity: 0, x: -15, y: 5 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                      className="w-full text-left px-5 py-4 bg-pair-surface/80 backdrop-blur rounded-3xl border border-pair-border/50 text-sm font-semibold text-pair-text hover:bg-gradient-to-r hover:from-pair-stuckLight/50 hover:to-violet-50/30 hover:border-pair-stuck/20 hover:text-pair-stuck transition-all duration-300 flex items-center justify-between group shadow-card hover:shadow-card-hover"
                      whileHover={{ x: 6, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-pair-stuck/10 flex items-center justify-center border border-pair-stuck/10 group-hover:bg-pair-stuck/20 transition-colors">
                          <AlertCircle size={14} className="text-pair-stuck/70" />
                        </div>
                        {reason.label}
                      </div>
                      <motion.div
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <ArrowRight size={16} className="text-pair-textMuted/40 group-hover:text-pair-stuck/60 transition-colors" />
                      </motion.div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="ai-help"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                className="flex-1 flex flex-col"
              >
                <motion.div
                  className="bg-gradient-to-br from-pair-stuckLight/80 to-violet-50/40 border border-pair-stuck/15 rounded-3xl p-6 mb-6 shadow-card hover:shadow-card-hover transition-all duration-500 relative overflow-hidden group backdrop-blur-sm"
                  initial={{ opacity: 0, y: 15, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pair-stuck/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-violet-200/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-4">
                      <motion.div
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-pair-stuck/20 to-violet-400/15 flex items-center justify-center border border-pair-stuck/10"
                        animate={aiLoading ? { rotate: 360 } : { rotate: [0, 5, -5, 0] }}
                        transition={aiLoading ? { duration: 2, repeat: Infinity, ease: 'linear' } : { duration: 4, repeat: Infinity }}
                      >
                        {aiLoading ? (
                          <Loader2 size={15} className="text-pair-stuck" />
                        ) : (
                          <Sparkles size={15} className="text-pair-stuck" />
                        )}
                      </motion.div>
                      <span className="text-sm font-semibold text-pair-stuck">
                        {aiLoading ? 'AI 思考中...' : aiError ? 'AI 建议（离线）' : 'AI 建议'}
                      </span>
                      {!aiLoading && !aiError && (
                        <motion.div
                          className="ml-auto flex items-center gap-1 text-[10px] text-pair-stuck/50"
                          animate={{ opacity: [0.4, 0.7, 0.4] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <Lightbulb size={10} />
                          <span>智能</span>
                        </motion.div>
                      )}
                    </div>
                    <motion.div
                      className="bg-pair-surface/90 backdrop-blur rounded-2xl p-4 mb-4 border border-pair-border/40 shadow-soft"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {aiLoading ? (
                        <div className="flex items-center gap-2 text-sm text-pair-textMuted">
                          <Loader2 size={14} className="animate-spin text-pair-stuck/50" />
                          <span>正在分析你的行动上下文...</span>
                        </div>
                      ) : (
                        <p className="text-sm text-pair-text leading-relaxed">{aiResponse}</p>
                      )}
                    </motion.div>
                    <p className="text-xs text-pair-textMuted/60">AI 只给一个下一步，不扩大计划。</p>
                  </div>
                </motion.div>

                {/* 卡住备注 */}
                <motion.div
                  className="mb-5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <PenLine size={13} className="text-pair-textMuted/60" />
                    <span className="text-xs text-pair-textMuted/70">卡住详情（可选）</span>
                  </div>
                  <textarea
                    value={blockedNote}
                    onChange={(e) => setBlockedNote(e.target.value)}
                    placeholder="描述你遇到的具体困难..."
                    rows={2}
                    className="w-full px-4 py-3 bg-pair-surface/80 backdrop-blur rounded-2xl border border-pair-border/50 text-sm text-pair-text focus:border-pair-stuck/30 focus:outline-none focus:ring-2 focus:ring-pair-stuck/8 resize-none transition-all duration-300 hover:bg-pair-surface/90"
                  />
                </motion.div>

                <div className="space-y-3 mt-auto mb-6">
                  <motion.button
                    onClick={handleContinue}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                    className="w-full py-4 bg-gradient-to-r from-pair-stuck to-violet-600 text-white rounded-3xl font-semibold text-sm flex items-center justify-center gap-2 shadow-glow-stuck hover:shadow-glow-stuck transition-all duration-300"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Zap size={18} strokeWidth={2.5} />
                    {selectedReason?.action}
                  </motion.button>

                  <motion.button
                    onClick={() => setShowAiHelp(false)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                    className="w-full py-3.5 bg-gradient-to-r from-pair-surface/90 to-pair-surface/70 border border-pair-border/50 text-pair-textSecondary rounded-3xl font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-card-hover transition-all duration-300"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <RotateCcw size={16} strokeWidth={2} />
                    换一个建议
                  </motion.button>

                  <motion.button
                    onClick={handleEnd}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                    className="w-full py-3.5 bg-gradient-to-r from-pair-surface/90 to-pair-surface/70 border border-pair-border/50 text-pair-textMuted rounded-3xl font-semibold text-sm hover:shadow-card-hover transition-all duration-300"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    结束并如实记录
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
