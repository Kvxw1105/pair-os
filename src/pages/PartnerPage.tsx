import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch, useApi } from '../stores/AppStore';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Shield, Target, User, ChevronRight, Copy, Check } from 'lucide-react';

export function PartnerPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const state = useAppState();
  const api = useApi();
  const partner = state.partner;
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const sharedActions = state.actions.filter(
    (a) => a.userId === state.profile?.id && (a.visibility === 'visible' || a.visibility === 'needs_verification')
  );

  const completedCount = sharedActions.filter((a) => a.state === 'completed' || a.state === 'partial').length;
  const totalDuration = sharedActions.reduce((sum, a) => sum + a.totalDurationMs, 0);

  const handleCopyLink = async () => {
    try {
      const res = await api.getInviteLink();
      const inviteCode = res.inviteCode;
      const inviteLink = `${window.location.origin}/#/auth?invite=${inviteCode}`;
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to get invite link:', err);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-pair-bg">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-xl hover:bg-pair-surfaceAlt/60 transition-colors">
          <ArrowLeft size={20} className="text-pair-textSecondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-pair-text">我们</h1>
        </div>
      </div>

      <div className="px-5 pb-8">
        {partner ? (
          <>
            {/* Partner Card */}
            <div className="bg-pair-surface rounded-3xl p-6 border border-pair-border/50 shadow-card card-shine mb-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-pair-primaryLight/60 flex items-center justify-center border border-pair-primary/10">
                  <User size={24} className="text-pair-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-pair-text">{partner.name}</h3>
                  <p className="text-xs text-pair-textMuted">
                    {partner.status === 'active' ? '正在推进' : partner.status === 'away' ? '暂离中' : '空闲'}
                  </p>
                </div>
              </div>
              {partner.currentActionTitle && (
                <div className="bg-pair-primaryLight/40 rounded-2xl p-4 border border-pair-primary/10">
                  <p className="text-[11px] text-pair-primary font-semibold mb-1 tracking-wide uppercase">当前行动</p>
                  <p className="text-sm font-bold text-pair-text">{partner.currentActionTitle}</p>
                </div>
              )}
            </div>

            {/* Shared Stats */}
            <div className="bg-pair-surface rounded-3xl p-6 border border-pair-border/50 shadow-card card-shine mb-6">
              <h3 className="text-sm font-bold text-pair-text mb-5 tracking-tight">共享数据</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-pair-primary">{sharedActions.length}</div>
                  <div className="text-[10px] text-pair-textMuted mt-1">共享行动</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pair-success">{completedCount}</div>
                  <div className="text-[10px] text-pair-textMuted mt-1">已完成</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pair-text">{formatDurationShort(totalDuration)}</div>
                  <div className="text-[10px] text-pair-textMuted mt-1">总时长</div>
                </div>
              </div>
            </div>

            {/* Lifeline Entry */}
            <motion.button
              onClick={() => navigate('/lifeline')}
              className="w-full bg-pair-surface rounded-3xl p-5 border border-pair-border/50 shadow-card card-shine mb-6 flex items-center gap-4 group relative overflow-hidden"
              whileHover={{ x: 4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pair-primary/5 via-transparent to-pair-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-br from-pair-primary/15 to-pair-accent/10 flex items-center justify-center border border-pair-primary/10">
                <Heart size={20} className="text-pair-primary" />
              </div>
              <div className="relative z-10 flex-1 text-left">
                <div className="text-sm font-semibold text-pair-text group-hover:text-pair-primary transition-colors">生命线</div>
                <div className="text-xs text-pair-textMuted/70">查看你们的共同行动轨迹</div>
              </div>
              <motion.div
                className="relative z-10"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronRight size={18} className="text-pair-textMuted/40 group-hover:text-pair-primary/60 transition-colors" />
              </motion.div>
            </motion.button>

            {/* Verification */}
            <div className="bg-pair-surface rounded-3xl p-6 border border-pair-border/50 shadow-card card-shine mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-pair-primary" />
                <h3 className="text-sm font-bold text-pair-text">待验收</h3>
              </div>
              <p className="text-xs text-pair-textSecondary">没有需要验收的承诺</p>
            </div>

            {/* Together Start */}
            <button
              onClick={() => dispatch({ type: 'INVITE_PARTNER' })}
              className="w-full py-4 bg-pair-primary text-white rounded-3xl font-semibold text-sm flex items-center justify-center gap-2 shadow-glow-primary hover:shadow-glow-primary active:scale-[0.98] transition-all duration-300"
            >
              <Target size={18} strokeWidth={2.5} />
              邀请一起开始 10 分钟
            </button>
          </>
        ) : (
          <>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-pair-surfaceAlt/80 flex items-center justify-center mx-auto mb-4 shadow-card border border-pair-border/40">
                <User size={28} className="text-pair-textMuted/40" />
              </div>
              <h3 className="text-lg font-bold text-pair-text mb-2">还没有伙伴</h3>
              <p className="text-sm text-pair-textSecondary mb-6">邀请一个重要的人，一起推进目标</p>
              <button
                onClick={() => setShowInvite(true)}
                className="px-6 py-3 bg-pair-primary text-white rounded-2xl font-semibold text-sm shadow-glow-primary hover:shadow-glow-primary transition-all duration-300"
              >
                发送邀请
              </button>
            </div>

            {showInvite && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-pair-surface rounded-2xl p-5 border border-pair-border/50 shadow-card card-shine"
              >
                <p className="text-sm text-pair-textSecondary mb-3">复制邀请链接发送给对方：</p>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-3 bg-pair-surfaceAlt/60 rounded-xl text-xs text-pair-textMuted truncate border border-pair-border/40">
                    https://pairos.app/invite/{state.profile?.id || 'demo'}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-3 bg-pair-primary text-white rounded-xl flex items-center gap-1.5 shadow-glow-primary hover:shadow-glow-primary transition-all"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    <span className="text-xs">{copied ? '已复制' : '复制'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
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
