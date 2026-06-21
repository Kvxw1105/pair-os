import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch } from '../stores/AppStore';
import { ArrowLeft, Brain, Edit3, Check, X, AlertCircle, TrendingUp, Clock, Zap, Target, BookOpen } from 'lucide-react';

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

  return (
    <div className="min-h-[100dvh] bg-pair-bg">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-xl hover:bg-pair-surfaceAlt/60 transition-colors">
          <ArrowLeft size={20} className="text-pair-textSecondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-pair-text">AI 理解我</h1>
        </div>
      </div>

      <div className="px-5 pb-8">
        <div className="bg-pair-primaryLight/40 rounded-2xl p-5 mb-6 border border-pair-primary/10 card-shine">
          <div className="flex items-center gap-2.5 mb-2">
            <Brain size={18} className="text-pair-primary" />
            <span className="text-sm font-bold text-pair-primary">这是 AI 目前对你的理解</span>
          </div>
          <p className="text-xs text-pair-primary/80 leading-relaxed">
            所有信息可见、可纠正、可删除。系统根据你的真实行动数据逐渐推断，你可以随时修正。
          </p>
        </div>

        <div className="space-y-3">
          {contextItems.map((item) => {
            const Icon = item.icon;
            const isEditing = editing === item.id;
            return (
              <div key={item.id} className="bg-pair-surface rounded-3xl p-5 border border-pair-border/50 shadow-card card-shine">
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
