import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useApi } from '../stores/AppStore';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Loader2 } from 'lucide-react';

export function AuthPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const api = useApi();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{ inviterName: string; available: boolean } | null>(null);

  // Check invite validity
  useEffect(() => {
    if (inviteCode) {
      api.getInviteInfo(inviteCode)
        .then((info) => {
          if (info.available) {
            setInviteInfo({ inviterName: info.inviterName, available: true });
            setMode('register');
          } else {
            setInviteInfo({ inviterName: info.inviterName, available: false });
          }
        })
        .catch(() => {
          setInviteInfo({ inviterName: '', available: false });
        });
    }
  }, [inviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (inviteCode) {
        data = await api.acceptInvite(inviteCode, email, password, name);
      } else if (mode === 'login') {
        data = await api.login(email, password);
      } else {
        data = await api.register(email, password, name);
      }
      dispatch({ type: 'LOGIN_SUCCESS', token: data.token, user: data.user });
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  const isInviteMode = !!inviteCode && inviteInfo?.available;
  const pageTitle = isInviteMode ? `接受 ${inviteInfo?.inviterName || '朋友'} 的邀请` : mode === 'login' ? '欢迎回来' : '开始你的行动';
  const subtitle = isInviteMode ? '注册后即可成为伙伴，一起行动' : mode === 'login' ? '登录继续' : '创建账号';

  return (
    <div className="min-h-[100dvh] bg-pair-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-pair-primary flex items-center justify-center shadow-glow-primary mb-4">
            <Zap size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-pair-text tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-pair-textMuted mt-1">{subtitle}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error && (
            <div className="mb-4 px-4 py-3 bg-pair-dangerLight rounded-2xl text-sm text-pair-danger">
              {error}
            </div>
          )}

          {isInviteMode && (
            <div className="mb-4 px-4 py-3 bg-pair-primaryLight rounded-2xl text-sm text-pair-primary">
              🎉 你收到了 <strong>{inviteInfo?.inviterName}</strong> 的邀请！注册后自动成为伙伴。
            </div>
          )}

          {!isInviteMode && inviteInfo && !inviteInfo.available && (
            <div className="mb-4 px-4 py-3 bg-pair-warnLight rounded-2xl text-sm text-pair-warn">
              邀请链接已失效（邀请人已有伙伴）。你可以直接注册。
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {(mode === 'register' || isInviteMode) && (
              <input
                type="text"
                placeholder="你的名字"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-pair-surface rounded-2xl border border-pair-border/50 text-sm focus:border-pair-primary/30 focus:outline-none focus:ring-2 focus:ring-pair-primary/8 transition-all placeholder:text-pair-textMuted/50"
              />
            )}
            <input
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 bg-pair-surface rounded-2xl border border-pair-border/50 text-sm focus:border-pair-primary/30 focus:outline-none focus:ring-2 focus:ring-pair-primary/8 transition-all placeholder:text-pair-textMuted/50"
            />
            <input
              type="password"
              placeholder="密码（至少6位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3.5 bg-pair-surface rounded-2xl border border-pair-border/50 text-sm focus:border-pair-primary/30 focus:outline-none focus:ring-2 focus:ring-pair-primary/8 transition-all placeholder:text-pair-textMuted/50"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-pair-primary text-white rounded-3xl font-semibold text-sm flex items-center justify-center gap-2 shadow-glow-primary hover:shadow-glow-primary active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {loading ? '处理中...' : isInviteMode ? '接受邀请并注册' : mode === 'login' ? '登录' : '注册'}
            </button>
          </form>

          {!isInviteMode && (
            <div className="mt-6 text-center">
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                className="text-sm text-pair-textMuted hover:text-pair-primary transition-colors"
              >
                {mode === 'login' ? '没有账号？注册' : '已有账号？登录'}
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-pair-border/40 text-center">
            <button
              onClick={handleSkip}
              className="text-sm text-pair-textMuted/60 hover:text-pair-textMuted transition-colors"
            >
              先不登录，本地体验 →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}