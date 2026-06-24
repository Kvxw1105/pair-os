import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState, useApi } from '../stores/AppStore';
import { formatDuration } from '../utils/time';
import { motion } from 'framer-motion';
import { DreamParticles } from '../components/DreamParticles';
import { GlowingOrb } from '../components/DreamEffects';
import {
  OrientalDivider, SealMark, BambooBorder, InkWashCard,
} from '../components/OrientalElements';
import {
  ArrowLeft, Calendar, CheckCircle2, Save, Loader2, ChevronLeft, ChevronRight,
  TrendingUp, Activity, MessageCircle, Sparkles,
} from 'lucide-react';
import type { DailyReport } from '../types';

export function DailyReportPage() {
  const navigate = useNavigate();
  const state = useAppState();
  const api = useApi();
  const profile = state.profile;
  const partner = state.partners[0] || state.guidePartner || null;
  const hasRealPartner = state.partners.length > 0;

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [mySummary, setMySummary] = useState('');
  const [mutualMessage, setMutualMessage] = useState('');

  // Build single-person report from local actions when no backend report exists
  const todayActions = state.actions.filter((a) => {
    const actionDate = new Date(a.createdAt).toISOString().slice(0, 10);
    return actionDate === selectedDate && a.userId === profile?.id;
  });
  const hasLocalActions = todayActions.length > 0;

  const fetchReport = useCallback(async (date: string) => {
    setLoading(true);
    try {
      if (api.isAuthenticated()) {
        const res = await api.getReport(date);
        if (res.report) {
          setReport(res.report);
          setMySummary(res.report.user1Summary || '');
          setMutualMessage(res.report.mutualMessage || '');
        }
      }
    } catch (err) {
      console.error('Fetch report failed:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate, fetchReport]);

  const handleSave = async () => {
    if (!report || !api.isAuthenticated()) return;
    setSaving(true);
    try {
      const isUser1 = report.user1Id === profile?.id;
      const updates: Record<string, string> = {};
      if (isUser1) updates.user1Summary = mySummary;
      else updates.user2Summary = mySummary;
      updates.mutualMessage = mutualMessage;

      await api.updateReport(report.id, updates);
      // Refetch
      fetchReport(selectedDate);
    } catch (err) {
      console.error('Save report failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const goPrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const goNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const today = new Date().toISOString().slice(0, 10);
    if (d.toISOString().slice(0, 10) <= today) {
      setSelectedDate(d.toISOString().slice(0, 10));
    }
  };

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  const isUser1 = report ? report.user1Id === profile?.id : true;
  const myActions = report ? (isUser1 ? report.user1Actions : report.user2Actions) : todayActions.map((a) => ({
    id: a.id,
    title: a.title,
    state: a.state,
    duration: a.totalDurationMs,
  }));
  const partnerActions = report && hasRealPartner ? (isUser1 ? report.user2Actions : report.user1Actions) : [];
  const myDuration = report ? (isUser1 ? report.user1Duration : report.user2Duration) : todayActions.reduce((s, a) => s + a.totalDurationMs, 0);
  const partnerDuration = report && hasRealPartner ? (isUser1 ? report.user2Duration : report.user1Duration) : 0;
  const myCompleted = myActions.filter((a) => a.state === 'completed' || a.state === 'partial').length;
  const partnerCompleted = partnerActions.filter((a) => a.state === 'completed' || a.state === 'partial').length;
  const myTotal = myActions.length;
  const partnerTotal = partnerActions.length;

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === today) return '今天';
    if (dateStr === yesterday.toISOString().slice(0, 10)) return '昨天';
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <div className="relative min-h-[100dvh] dream-bg overflow-hidden">
      {/* Background particles */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <DreamParticles />
      </div>
      <GlowingOrb color="rgba(184, 149, 106, 0.05)" size={300} className="top-[-50px] right-[-80px]" blur={80} />
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
            <h1 className="text-xl font-bold text-pair-text tracking-tight flex items-center gap-2">
              共进日报
              <SealMark text="双" size="sm" variant="circle" />
            </h1>
          </div>
        </motion.div>

        {/* Date selector */}
        <motion.div
          className="px-5 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="flex items-center justify-center gap-3">
            <motion.button
              onClick={goPrevDay}
              className="p-2 rounded-xl bg-pair-surface/80 border border-pair-border/40 hover:bg-pair-surface transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={18} className="text-pair-textSecondary" />
            </motion.button>
            <div className="flex items-center gap-2 px-4 py-2 bg-pair-surface/80 backdrop-blur rounded-2xl border border-pair-border/40">
              <Calendar size={14} className="text-pair-accent/70" />
              <span className="text-sm font-semibold text-pair-text">
                {formatDateLabel(selectedDate)}
              </span>
              <span className="text-xs text-pair-textMuted">{selectedDate}</span>
            </div>
            <motion.button
              onClick={goNextDay}
              className="p-2 rounded-xl bg-pair-surface/80 border border-pair-border/40 hover:bg-pair-surface transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight size={18} className="text-pair-textSecondary" />
            </motion.button>
          </div>
        </motion.div>

        <div className="px-5 pb-8">
          {loading && !report && !hasLocalActions ? (
            <div className="text-center py-16">
              <Loader2 size={28} className="animate-spin text-pair-accent/50 mx-auto mb-3" />
              <p className="text-sm text-pair-textMuted">正在生成日报...</p>
            </div>
          ) : myTotal > 0 ? (
            <div className="space-y-6">
              {/* Column layout: 1 col for solo, 2 cols for duo */}
              <div className={`grid grid-cols-1 ${hasRealPartner ? 'md:grid-cols-2' : ''} gap-4`}>
                {/* My Column */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
                >
                  <InkWashCard className="bg-pair-surface/80 backdrop-blur rounded-3xl border border-pair-border/40 shadow-card hover:shadow-card-hover transition-all duration-500 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pair-primaryLight/70 to-pair-accentLight/40 flex items-center justify-center border border-pair-primary/15">
                        <span className="text-sm font-bold text-pair-primary">{profile?.name?.charAt(0) || '我'}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-pair-text">{profile?.name || '我'}</h3>
                        <p className="text-[10px] text-pair-textMuted/70">{myTotal} 个行动 · {formatDuration(myDuration)}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1 text-[10px] text-pair-success">
                        <CheckCircle2 size={10} />
                        <span>{myCompleted}/{myTotal}</span>
                      </div>
                    </div>

                    <OrientalDivider className="my-3" />

                    {/* My actions */}
                    <div className="space-y-2 mb-4">
                      {myActions.length === 0 ? (
                        <p className="text-xs text-pair-textMuted/60 text-center py-4">今天还没有行动</p>
                      ) : (
                        myActions.map((action, i) => {
                          return (
                            <motion.div
                              key={action.id}
                              className="flex items-center gap-2.5 py-2 px-1 rounded-xl hover:bg-pair-surfaceAlt/50 transition-colors"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                            >
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                action.state === 'completed' ? 'bg-gradient-to-br from-pair-success to-emerald-400 shadow-glow-success' :
                                action.state === 'partial' ? 'bg-gradient-to-br from-pair-accent to-amber-300' :
                                action.state === 'failed' ? 'bg-pair-textMuted' :
                                'bg-gradient-to-br from-pair-accent to-amber-300'
                              }`} />
                              <span className="text-sm text-pair-text flex-1 truncate">{action.title}</span>
                              <span className="text-[10px] text-pair-textMuted/70">{formatDuration(action.duration)}</span>
                            </motion.div>
                          );
                        })
                      )}
                    </div>

                    {/* My summary input */}
                    <div className="mb-1">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles size={12} className="text-pair-accent/60" />
                        <span className="text-[11px] font-semibold text-pair-textMuted/80">我的小结</span>
                      </div>
                      <textarea
                        value={mySummary}
                        onChange={(e) => setMySummary(e.target.value)}
                        placeholder={isToday ? '记录今天的心得...' : '查看历史记录'}
                        rows={3}
                        className="w-full px-3 py-2.5 bg-pair-surfaceAlt/50 rounded-2xl border border-pair-border/40 text-sm text-pair-text focus:border-pair-accent/30 focus:outline-none focus:ring-2 focus:ring-pair-accent/8 resize-none transition-all hover:bg-pair-surfaceAlt/70"
                      />
                    </div>
                  </InkWashCard>
                </motion.div>

                {/* Partner Column — only if has real partner */}
                {hasRealPartner && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
                  >
                    <InkWashCard className="bg-pair-surface/80 backdrop-blur rounded-3xl border border-pair-border/40 shadow-card hover:shadow-card-hover transition-all duration-500 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pair-accentLight/50 to-pair-warnLight/40 flex items-center justify-center border border-pair-accent/15">
                          <span className="text-sm font-bold text-pair-accent">{partner?.name?.charAt(0) || 'TA'}</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-pair-text">{partner?.name || '伙伴'}</h3>
                          <p className="text-[10px] text-pair-textMuted/70">{partnerTotal} 个行动 · {formatDuration(partnerDuration)}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1 text-[10px] text-pair-success">
                          <CheckCircle2 size={10} />
                          <span>{partnerCompleted}/{partnerTotal}</span>
                        </div>
                      </div>

                      <OrientalDivider className="my-3" />

                      {/* Partner actions */}
                      <div className="space-y-2 mb-4">
                        {partnerActions.length === 0 ? (
                          <p className="text-xs text-pair-textMuted/60 text-center py-4">伙伴今天还没有行动</p>
                        ) : (
                          partnerActions.map((action, i) => {
                            return (
                              <motion.div
                                key={action.id}
                                className="flex items-center gap-2.5 py-2 px-1 rounded-xl hover:bg-pair-surfaceAlt/50 transition-colors"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  action.state === 'completed' ? 'bg-gradient-to-br from-pair-success to-emerald-400 shadow-glow-success' :
                                  action.state === 'partial' ? 'bg-gradient-to-br from-pair-accent to-amber-300' :
                                  action.state === 'failed' ? 'bg-pair-textMuted' :
                                  'bg-gradient-to-br from-pair-accent to-amber-300'
                                }`} />
                                <span className="text-sm text-pair-text flex-1 truncate">{action.title}</span>
                                <span className="text-[10px] text-pair-textMuted/70">{formatDuration(action.duration)}</span>
                              </motion.div>
                            );
                          })
                        )}
                      </div>

                      {/* Partner summary (read-only) */}
                      <div className="mb-1">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles size={12} className="text-pair-accent/60" />
                          <span className="text-[11px] font-semibold text-pair-textMuted/80">{partner?.name || '伙伴'}的小结</span>
                        </div>
                        {report?.user2Summary ? (
                          <BambooBorder>
                            <p className="text-sm text-pair-textSecondary leading-relaxed pl-2">{report.user2Summary}</p>
                          </BambooBorder>
                        ) : (
                          <p className="text-xs text-pair-textMuted/50 text-center py-4">伙伴还没有写小结</p>
                        )}
                      </div>
                    </InkWashCard>
                  </motion.div>
                )}
              </div>

              {/* Combined Stats */}
              <motion.div
                className="grid grid-cols-3 gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <div className="bg-pair-surface/80 backdrop-blur rounded-2xl p-3 border border-pair-border/40 shadow-card text-center">
                  <Activity size={14} className="text-pair-primary/70 mx-auto mb-1" />
                  <div className="text-lg font-bold text-pair-primary">{myTotal + partnerTotal}</div>
                  <div className="text-[10px] text-pair-textMuted/70">总行动</div>
                </div>
                <div className="bg-pair-surface/80 backdrop-blur rounded-2xl p-3 border border-pair-border/40 shadow-card text-center">
                  <CheckCircle2 size={14} className="text-pair-success/70 mx-auto mb-1" />
                  <div className="text-lg font-bold text-pair-success">{myCompleted + partnerCompleted}</div>
                  <div className="text-[10px] text-pair-textMuted/70">已完成</div>
                </div>
                <div className="bg-pair-surface/80 backdrop-blur rounded-2xl p-3 border border-pair-border/40 shadow-card text-center">
                  <TrendingUp size={14} className="text-pair-accent/70 mx-auto mb-1" />
                  <div className="text-lg font-bold text-pair-accent">{formatDurationShort(myDuration + partnerDuration)}</div>
                  <div className="text-[10px] text-pair-textMuted/70">总时长</div>
                </div>
              </motion.div>

              {/* Mutual Message — only if has real partner */}
              {hasRealPartner && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <InkWashCard className="bg-pair-surface/80 backdrop-blur rounded-3xl border border-pair-border/40 shadow-card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageCircle size={14} className="text-pair-accent/70" />
                      <h3 className="text-sm font-semibold text-pair-text">互相留言</h3>
                      <SealMark text="印" size="sm" variant="square" />
                    </div>
                    <textarea
                      value={mutualMessage}
                      onChange={(e) => setMutualMessage(e.target.value)}
                      placeholder="给彼此留一句话，鼓励、感谢或分享..."
                      rows={2}
                      className="w-full px-3 py-2.5 bg-pair-surfaceAlt/50 rounded-2xl border border-pair-border/40 text-sm text-pair-text focus:border-pair-accent/30 focus:outline-none focus:ring-2 focus:ring-pair-accent/8 resize-none transition-all hover:bg-pair-surfaceAlt/70 mb-3"
                    />
                    <div className="flex justify-end">
                      <motion.button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2.5 bg-gradient-to-r from-pair-primary to-pair-primaryMuted text-white rounded-2xl text-sm font-medium flex items-center gap-1.5 shadow-glow-primary hover:shadow-glow-primary transition-all disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? '保存中...' : '保存'}
                      </motion.button>
                    </div>
                  </InkWashCard>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm text-pair-textSecondary">今天还没有行动记录</p>
              <p className="text-xs text-pair-textMuted/60 mt-2">完成一些行动后再来看日报吧</p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 px-5 py-2.5 bg-pair-primary text-white rounded-2xl text-sm font-medium"
              >
                去开始行动
              </button>
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
