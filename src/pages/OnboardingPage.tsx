import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../stores/AppStore';
import { ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function OnboardingPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(0);
  const [mainLine, setMainLine] = useState('');
  const [deadline, setDeadline] = useState('');
  const [subLines, setSubLines] = useState(['', '', '']);

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      const filteredSubLines = subLines.filter((s) => s.trim() !== '');
      dispatch({
        type: 'COMPLETE_ONBOARDING',
        mainLine: mainLine.trim() || '我的目标',
        deadline: deadline.trim() || null,
        subLines: filteredSubLines,
      });
      navigate('/');
    }
  };

  const handleSkip = () => {
    dispatch({
      type: 'COMPLETE_ONBOARDING',
      mainLine: '我的目标',
      deadline: null,
      subLines: [],
    });
    navigate('/');
  };

  const steps = [
    {
      title: '欢迎加入共进',
      subtitle: '和一个重要的人一起，把"我应该做"变成"我已经开始"',
      content: (
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="w-20 h-20 rounded-3xl bg-pair-primary flex items-center justify-center shadow-glow-primary">
            <Zap size={36} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="text-center space-y-2">
            <p className="text-pair-textSecondary text-sm leading-relaxed">
              这里不是待办清单，而是记录你每一次真实行动的执行系统。
            </p>
            <p className="text-pair-textSecondary text-sm leading-relaxed">
              你随时可以直接开始，不需要先建立完整的计划。
            </p>
          </div>
        </div>
      ),
    },
    {
      title: '当前主线',
      subtitle: '你现在最想推进的一件长期事情是什么？',
      content: (
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-semibold text-pair-textSecondary mb-2 block">主线目标</label>
            <input
              type="text"
              placeholder="例如：考研、进入 AI 开发、减脂"
              value={mainLine}
              onChange={(e) => setMainLine(e.target.value)}
              className="w-full px-4 py-3.5 bg-pair-surface rounded-2xl border border-pair-border/50 focus:border-pair-primary/30 focus:outline-none focus:ring-2 focus:ring-pair-primary/8 text-sm transition-all placeholder:text-pair-textMuted/50"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-pair-textSecondary mb-2 block">明确期限（可选）</label>
            <input
              type="text"
              placeholder="例如：12月考研、3个月后作品集"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-3.5 bg-pair-surface rounded-2xl border border-pair-border/50 focus:border-pair-primary/30 focus:outline-none focus:ring-2 focus:ring-pair-primary/8 text-sm transition-all placeholder:text-pair-textMuted/50"
            />
          </div>
        </div>
      ),
    },
    {
      title: '维持支线',
      subtitle: '除了主线，还有哪些事情不能完全停？（最多3项）',
      content: (
        <div className="space-y-3 py-4">
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              type="text"
              placeholder={`支线 ${i + 1}（可选）`}
              value={subLines[i]}
              onChange={(e) => {
                const next = [...subLines];
                next[i] = e.target.value;
                setSubLines(next);
              }}
              className="w-full px-4 py-3.5 bg-pair-surface rounded-2xl border border-pair-border/50 focus:border-pair-primary/30 focus:outline-none focus:ring-2 focus:ring-pair-primary/8 text-sm transition-all placeholder:text-pair-textMuted/50"
            />
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-pair-bg flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= step ? 'w-6 bg-pair-primary' : 'w-1.5 bg-pair-border'
                }`}
              />
            ))}
          </div>
          <button onClick={handleSkip} className="text-xs text-pair-textMuted hover:text-pair-textSecondary transition-colors">
            跳过
          </button>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          <h1 className="text-2xl font-bold text-pair-text mt-4 tracking-tight">{steps[step].title}</h1>
          <p className="text-sm text-pair-textMuted mt-2">{steps[step].subtitle}</p>
          <div className="flex-1">{steps[step].content}</div>
        </motion.div>

        <button
          onClick={handleNext}
          className="w-full py-4 bg-pair-primary text-white rounded-3xl font-semibold text-sm flex items-center justify-center gap-2 shadow-glow-primary hover:shadow-glow-primary active:scale-[0.98] transition-all duration-300"
        >
          {step === 2 ? '开始共进' : '下一步'}
          <ArrowRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
