import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch, useApi } from '../stores/AppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { DreamParticles } from '../components/DreamParticles';
import { GlowingOrb } from '../components/DreamEffects';
import { ArrowLeft, User, Bell, Moon, Trash2, Brain, ChevronRight, LogOut, Sparkles, Check, AlertCircle, Loader2, Shield, Cloud, Save, Settings } from 'lucide-react';
import { AI_PROVIDERS, getProviderById, detectProvider } from '../utils/ai-providers';

export function SettingsPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const state = useAppState();
  const api = useApi();
  const profile = state.profile;

  // AI Config
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiBaseUrl, setAiBaseUrl] = useState('https://api.siliconflow.cn/v1');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('deepseek-ai/DeepSeek-V3');
  const [aiLocalMode, setAiLocalMode] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [aiTestStatus, setAiTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [aiTestMsg, setAiTestMsg] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('siliconflow');
  const [showProviderPicker, setShowProviderPicker] = useState(false);

  const currentProvider = getProviderById(selectedProvider);

  useEffect(() => {
    const localMode = api.isLocalAiMode();
    setAiLocalMode(localMode);
    if (localMode) {
      const localCfg = api.getLocalAiConfig();
      if (localCfg) {
        setAiEnabled(localCfg.enabled);
        setAiBaseUrl(localCfg.baseUrl);
        setAiModel(localCfg.model);
        setAiApiKey(localCfg.apiKey);
      }
      return;
    }
    if (api.isAuthenticated()) {
      api.getAiConfig().then((cfg) => {
        setAiEnabled(cfg.enabled);
        if (cfg.baseUrl) {
          setAiBaseUrl(cfg.baseUrl);
          const detected = detectProvider(cfg.baseUrl);
          if (detected) setSelectedProvider(detected.id);
        }
        if (cfg.model) setAiModel(cfg.model);
      }).catch(() => {});
    }
  }, []);

  const handleSelectProvider = (providerId: string) => {
    const provider = getProviderById(providerId);
    if (!provider) return;
    setSelectedProvider(providerId);
    if (provider.id !== 'custom') {
      setAiBaseUrl(provider.baseUrl);
      setAiModel(provider.defaultModel);
    }
    setShowProviderPicker(false);
  };

  const handleSaveAi = async () => {
    setAiLoading(true);
    try {
      if (aiLocalMode) {
        api.setLocalAiConfig({
          enabled: aiEnabled,
          baseUrl: aiBaseUrl,
          apiKey: aiApiKey,
          model: aiModel,
        });
      } else {
        api.clearLocalAiConfig();
        await api.updateAiConfig({
          enabled: aiEnabled,
          baseUrl: aiBaseUrl,
          apiKey: aiApiKey,
          model: aiModel,
        });
      }
      setAiSaved(true);
      setTimeout(() => setAiSaved(false), 2000);
    } catch (err) {
      console.error('Save AI config error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleTestAi = async () => {
    setAiTestStatus('loading');
    try {
      const result = await api.testAiConnection({
        baseUrl: aiBaseUrl,
        apiKey: aiApiKey,
        model: aiModel,
      });
      setAiTestStatus('success');
      setAiTestMsg(result.message || '连接成功');
    } catch (err) {
      setAiTestStatus('error');
      setAiTestMsg((err as Error).message);
    }
  };

  const handleReset = () => {
    if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleRemovePartner = () => {
    if (confirm('确定解除与伙伴的关系吗？')) {
      dispatch({ type: 'REMOVE_PARTNER' });
    }
  };

  return (
    <div className="relative min-h-[100dvh] dream-bg overflow-hidden">
      {/* Background particles */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <DreamParticles />
      </div>

      <GlowingOrb color="rgba(123, 109, 181, 0.05)" size={300} className="top-[-50px] right-[-80px]" blur={80} />
      <GlowingOrb color="rgba(184, 149, 106, 0.04)" size={250} className="bottom-[200px] left-[-60px]" blur={70} />

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
            <h1 className="text-xl font-bold text-pair-text tracking-tight">设置</h1>
          </div>
        </motion.div>

        <div className="px-5 pb-8 space-y-6">
          {/* Profile */}
          <motion.div
            className="bg-pair-surface/90 backdrop-blur rounded-3xl p-5 border border-pair-border/50 shadow-card hover:shadow-card-hover transition-all duration-500 relative overflow-hidden group"
            initial={{ opacity: 0, y: 15, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pair-primary/3 via-transparent to-pair-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex items-center gap-4">
              <motion.div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-pair-primaryLight/70 to-pair-accentLight/40 flex items-center justify-center border border-pair-primary/15"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <User size={22} className="text-pair-primary" />
              </motion.div>
              <div>
                <h3 className="text-base font-bold text-pair-text">{profile?.name || '我'}</h3>
                <p className="text-xs text-pair-textMuted/70">{profile?.timezone}</p>
              </div>
            </div>
          </motion.div>

          {/* Navigation Links */}
          <div className="space-y-3">
            {[
              { path: '/context', icon: Brain, title: 'AI 理解我', desc: '查看和修改行动上下文', gradient: 'from-pair-primaryLight/50 to-pair-accentLight/30', iconColor: 'text-pair-primary' },
              { path: '/partner', icon: User, title: '伙伴关系', desc: '管理双人共享与协议', gradient: 'from-pair-accentLight/50 to-pair-warnLight/30', iconColor: 'text-pair-accent' },
            ].map((item, i) => (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full bg-pair-surface/90 backdrop-blur rounded-3xl p-4 border border-pair-border/50 shadow-card hover:shadow-card-hover transition-all duration-500 flex items-center gap-3 group relative overflow-hidden"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                whileHover={{ x: 4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className={`relative z-10 w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center border border-pair-border/30`}>
                  <item.icon size={17} className={item.iconColor} />
                </div>
                <div className="relative z-10 flex-1 text-left">
                  <div className="text-sm font-semibold text-pair-text group-hover:text-pair-primary transition-colors">{item.title}</div>
                  <div className="text-xs text-pair-textMuted/70">{item.desc}</div>
                </div>
                <motion.div
                  className="relative z-10"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ChevronRight size={16} className="text-pair-textMuted/40 group-hover:text-pair-primary/60 transition-colors" />
                </motion.div>
              </motion.button>
            ))}
          </div>

          {/* AI Config */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <h3 className="text-[11px] font-bold text-pair-textMuted/80 uppercase tracking-widest mb-3 px-1">AI 助手</h3>
            <div className="bg-pair-surface/90 backdrop-blur rounded-3xl border border-pair-border/50 shadow-card overflow-hidden p-5 space-y-4 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pair-primary/3 via-transparent to-pair-accent/3 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pair-primaryLight/50 to-pair-accentLight/30 flex items-center justify-center border border-pair-primary/10">
                    <Sparkles size={16} className="text-pair-primary" />
                  </div>
                  <span className="text-sm font-semibold text-pair-text">启用 AI 建议</span>
                </div>
                <motion.button
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${aiEnabled ? 'bg-gradient-to-r from-pair-primary to-pair-primaryMuted' : 'bg-pair-border'}`}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{ x: aiEnabled ? 22 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>

              <AnimatePresence>
                {aiEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                    className="relative z-10 space-y-3 pt-2 border-t border-pair-border/30 overflow-hidden"
                  >
                    {/* Provider Selector */}
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                    >
                      <label className="text-xs text-pair-textMuted/70 mb-1.5 block flex items-center gap-1.5">
                        <Settings size={12} className="text-pair-primary/50" />
                        选择 AI 提供商
                      </label>
                      <button
                        onClick={() => setShowProviderPicker(!showProviderPicker)}
                        className="w-full px-3.5 py-3 bg-pair-surfaceAlt/60 rounded-2xl border border-pair-border/40 text-sm text-left flex items-center justify-between hover:bg-pair-surfaceAlt/80 transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          {currentProvider?.region === 'cn' ? (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-pair-primary/10 text-pair-primary font-medium">国内</span>
                          ) : currentProvider?.region === 'global' && currentProvider.id !== 'custom' ? (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-pair-accent/10 text-pair-accent font-medium">国外</span>
                          ) : null}
                          <span className="text-pair-text font-medium">{currentProvider?.name || '自定义'}</span>
                          {currentProvider?.freeTier && (
                            <span className="text-[10px] text-pair-textMuted/60">{currentProvider.freeTier}</span>
                          )}
                        </div>
                        <motion.div animate={{ rotate: showProviderPicker ? 180 : 0 }} transition={{ duration: 0.3 }}>
                          <ChevronRight size={16} className="text-pair-textMuted/40" style={{ transform: 'rotate(90deg)' }} />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {showProviderPicker && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                            className="overflow-hidden mt-2"
                          >
                            <div className="grid grid-cols-2 gap-2">
                              {AI_PROVIDERS.map((provider) => (
                                <motion.button
                                  key={provider.id}
                                  onClick={() => handleSelectProvider(provider.id)}
                                  className={`p-3 rounded-2xl border text-left transition-all duration-200 ${
                                    selectedProvider === provider.id
                                      ? 'bg-pair-primary/5 border-pair-primary/30 shadow-sm'
                                      : 'bg-pair-surfaceAlt/40 border-pair-border/30 hover:bg-pair-surfaceAlt/70'
                                  }`}
                                  whileTap={{ scale: 0.97 }}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    {provider.region === 'cn' ? (
                                      <span className="text-[10px] px-1 py-0.5 rounded bg-pair-primary/10 text-pair-primary">国内</span>
                                    ) : provider.id !== 'custom' ? (
                                      <span className="text-[10px] px-1 py-0.5 rounded bg-pair-accent/10 text-pair-accent">国外</span>
                                    ) : (
                                      <span className="text-[10px] px-1 py-0.5 rounded bg-pair-textMuted/10 text-pair-textMuted">自定义</span>
                                    )}
                                    <span className="text-xs font-semibold text-pair-text">{provider.name}</span>
                                  </div>
                                  <p className="text-[10px] text-pair-textMuted/70 leading-relaxed">{provider.description}</p>
                                  {provider.freeTier && (
                                    <p className="text-[10px] text-pair-success mt-0.5">{provider.freeTier}</p>
                                  )}
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Model selector for preset providers */}
                    {currentProvider && currentProvider.id !== 'custom' && currentProvider.models.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                      >
                        <label className="text-xs text-pair-textMuted/70 mb-1.5 block">选择模型</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {currentProvider.models.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setAiModel(m.id)}
                              className={`px-3 py-2 rounded-xl text-[11px] font-medium transition-all border ${
                                aiModel === m.id
                                  ? 'bg-pair-primary/10 border-pair-primary/30 text-pair-primary'
                                  : 'bg-pair-surfaceAlt/40 border-pair-border/30 text-pair-textSecondary hover:bg-pair-surfaceAlt/70'
                              }`}
                            >
                              <div>{m.name}</div>
                              <div className="text-[9px] text-pair-textMuted/60">{m.description}</div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Local mode switch */}
                    <motion.div
                      className="flex items-center justify-between py-2"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div>
                        <div className="text-sm font-medium text-pair-text flex items-center gap-2">
                          <Shield size={14} className="text-pair-accent/70" />
                          不在服务器保存 Key
                        </div>
                        <div className="text-[10px] text-pair-textMuted/60">API Key 只存于你的浏览器，每次请求通过 Header 传递</div>
                      </div>
                      <motion.button
                        onClick={() => setAiLocalMode(!aiLocalMode)}
                        className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${aiLocalMode ? 'bg-gradient-to-r from-pair-accent to-pair-accentMuted' : 'bg-pair-border'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div
                          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                          animate={{ x: aiLocalMode ? 22 : 4 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </motion.button>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <label className="text-xs text-pair-textMuted/70 mb-1.5 block flex items-center gap-1.5">
                        <Cloud size={12} className="text-pair-primary/50" />
                        Base URL
                        {selectedProvider === 'custom' && <span className="text-[10px] text-pair-warn">必填</span>}
                      </label>
                      <input
                        type="text"
                        value={aiBaseUrl}
                        onChange={(e) => {
                          setAiBaseUrl(e.target.value);
                          const detected = detectProvider(e.target.value);
                          if (detected && detected.id !== selectedProvider) {
                            setSelectedProvider(detected.id);
                          } else if (!detected && selectedProvider !== 'custom') {
                            setSelectedProvider('custom');
                          }
                        }}
                        placeholder="https://api.example.com/v1"
                        className="w-full px-3.5 py-3 bg-pair-surfaceAlt/60 rounded-2xl border border-pair-border/40 text-sm text-pair-text focus:border-pair-primary/30 focus:outline-none focus:ring-2 focus:ring-pair-primary/8 transition-all duration-300 hover:bg-pair-surfaceAlt/80"
                      />
                      <p className="text-[10px] text-pair-textMuted/60 mt-1">支持 OpenAI 兼容接口。修改 URL 会自动识别提供商。</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="text-xs text-pair-textMuted/70 mb-1.5 block">API Key</label>
                      <input
                        type="password"
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-3.5 py-3 bg-pair-surfaceAlt/60 rounded-2xl border border-pair-border/40 text-sm text-pair-text focus:border-pair-primary/30 focus:outline-none focus:ring-2 focus:ring-pair-primary/8 transition-all duration-300 hover:bg-pair-surfaceAlt/80"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <label className="text-xs text-pair-textMuted/70 mb-1.5 block">Model</label>
                      <input
                        type="text"
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        placeholder="deepseek-ai/DeepSeek-V3"
                        className="w-full px-3.5 py-3 bg-pair-surfaceAlt/60 rounded-2xl border border-pair-border/40 text-sm text-pair-text focus:border-pair-primary/30 focus:outline-none focus:ring-2 focus:ring-pair-primary/8 transition-all duration-300 hover:bg-pair-surfaceAlt/80"
                      />
                    </motion.div>

                    <motion.div
                      className="flex gap-2 pt-1"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.button
                        onClick={handleTestAi}
                        disabled={aiTestStatus === 'loading'}
                        className="flex-1 py-2.5 bg-pair-surfaceAlt/60 border border-pair-border/40 rounded-2xl text-sm font-medium text-pair-textSecondary hover:bg-gradient-to-r hover:from-pair-primaryLight/40 hover:to-pair-accentLight/30 hover:text-pair-primary hover:border-pair-primary/20 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-1.5"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {aiTestStatus === 'loading' ? <Loader2 size={14} className="animate-spin" /> :
                         aiTestStatus === 'success' ? <Check size={14} className="text-pair-success" /> :
                         aiTestStatus === 'error' ? <AlertCircle size={14} className="text-pair-danger" /> :
                         null}
                        {aiTestStatus === 'loading' ? '测试中...' : aiTestStatus === 'success' ? '连接成功' : aiTestStatus === 'error' ? '连接失败' : '测试连接'}
                      </motion.button>
                      <motion.button
                        onClick={handleSaveAi}
                        disabled={aiLoading}
                        className="flex-1 py-2.5 bg-gradient-to-r from-pair-primary to-pair-primaryMuted text-white rounded-2xl text-sm font-medium hover:shadow-glow-primary transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {aiLoading ? <Loader2 size={14} className="animate-spin" /> :
                         aiSaved ? <Check size={14} /> : <Save size={14} />}
                        {aiLoading ? '保存中...' : aiSaved ? '已保存' : '保存'}
                      </motion.button>
                    </motion.div>

                    <AnimatePresence>
                      {aiTestStatus === 'error' && aiTestMsg && (
                        <motion.p
                          className="text-xs text-pair-danger"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          {aiTestMsg}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="relative z-10 text-[10px] text-pair-textMuted/60 leading-relaxed">
                {aiLocalMode
                  ? '本地模式：API Key 只存储在你的浏览器中，通过请求 Header 传递，服务器不会保存。'
                  : '云端模式：API Key 存储在你的服务器数据库中，仅用于你的 AI 请求。'}
                AI 只在用户明确需要帮助时给出一个具体下一步。不会主动打扰。
              </p>
            </div>
          </motion.div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <h3 className="text-[11px] font-bold text-pair-textMuted/80 uppercase tracking-widest mb-3 px-1">偏好</h3>
            <div className="bg-pair-surface/90 backdrop-blur rounded-3xl border border-pair-border/50 shadow-card overflow-hidden">
              <div className="px-4 py-3.5 flex items-center justify-between border-b border-pair-border/40 hover:bg-pair-surfaceAlt/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pair-accentLight/40 to-pair-warnLight/30 flex items-center justify-center">
                    <Bell size={16} className="text-pair-accent" />
                  </div>
                  <span className="text-sm text-pair-text">提醒通知</span>
                </div>
                <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${profile?.preferences.reminderEnabled ? 'bg-gradient-to-r from-pair-success to-emerald-400' : 'bg-pair-border'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${profile?.preferences.reminderEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </div>
              <div className="px-4 py-3.5 flex items-center justify-between hover:bg-pair-surfaceAlt/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pair-stuckLight/30 to-violet-50/30 flex items-center justify-center">
                    <Moon size={16} className="text-pair-stuck/70" />
                  </div>
                  <span className="text-sm text-pair-text">勿扰时段</span>
                </div>
                <span className="text-xs text-pair-textMuted/70">未设置</span>
              </div>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <h3 className="text-[11px] font-bold text-pair-textMuted/80 uppercase tracking-widest mb-3 px-1">危险区域</h3>
            <div className="bg-pair-surface/90 backdrop-blur rounded-3xl border border-pair-border/50 shadow-card overflow-hidden">
              {state.partner && (
                <motion.button
                  onClick={handleRemovePartner}
                  className="w-full px-4 py-3.5 flex items-center gap-3 text-left border-b border-pair-border/40 hover:bg-pair-danger/5 transition-colors group"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pair-danger/10 to-red-50/30 flex items-center justify-center">
                    <LogOut size={16} className="text-pair-danger" />
                  </div>
                  <span className="text-sm text-pair-danger">解除伙伴关系</span>
                </motion.button>
              )}
              <motion.button
                onClick={handleReset}
                className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-pair-danger/5 transition-colors group"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pair-danger/10 to-red-50/30 flex items-center justify-center">
                  <Trash2 size={16} className="text-pair-danger" />
                </div>
                <span className="text-sm text-pair-danger">重置所有数据</span>
              </motion.button>
            </div>
          </motion.div>

          {/* About */}
          <motion.div
            className="text-center pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-xs text-pair-textMuted/60">共进 PairOS v0.2</p>
            <p className="text-[10px] text-pair-textMuted/40 mt-1">行动优先，不是待办清单</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
