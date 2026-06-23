import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch, useApi } from '../stores/AppStore';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, User } from 'lucide-react';

export function ProfilePage() {
  const navigate = useNavigate();
  const state = useAppState();
  const dispatch = useAppDispatch();
  const api = useApi();
  const profile = state.profile;

  const [name, setName] = useState(profile?.name || '');
  const [avatar, setAvatar] = useState(profile?.avatar || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updates: { name?: string; avatar?: string | null; bio?: string | null } = {};
      if (name !== profile.name) updates.name = name;
      if (avatar !== profile.avatar) updates.avatar = avatar || null;
      if (bio !== profile.bio) updates.bio = bio || null;

      if (Object.keys(updates).length > 0) {
        if (api.isAuthenticated()) {
          await api.updateProfile(updates);
        }
        dispatch({ type: 'UPDATE_PROFILE', updates });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error('Save profile failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    name !== (profile?.name || '') ||
    avatar !== (profile?.avatar || '') ||
    bio !== (profile?.bio || '');

  return (
    <div className="min-h-[100dvh] bg-pair-bg">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-xl hover:bg-pair-surfaceAlt/60 transition-colors"
        >
          <ArrowLeft size={20} className="text-pair-textSecondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-pair-text">个人资料</h1>
        </div>
      </div>

      <div className="px-5 pb-8 max-w-lg mx-auto">
        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative mb-3">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-24 h-24 rounded-full object-cover border-4 border-pair-surface shadow-card"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pair-primary/20 to-pair-accent/20 flex items-center justify-center border-4 border-pair-surface shadow-card">
                <User size={40} className="text-pair-primary" />
              </div>
            )}
          </div>
          <div className="w-full">
            <label className="text-xs text-pair-textMuted font-medium mb-1.5 block">头像 URL</label>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="粘贴图片链接，或留空使用默认头像"
              className="w-full px-4 py-3 bg-pair-surface/80 rounded-2xl text-sm text-pair-text border border-pair-border/50 focus:border-pair-primary focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-pair-textMuted/50 mt-1.5">支持粘贴任意图片链接</p>
          </div>
        </motion.div>

        {/* Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          <label className="text-xs text-pair-textMuted font-medium mb-1.5 block">昵称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="你的名字"
            className="w-full px-4 py-3 bg-pair-surface/80 rounded-2xl text-sm text-pair-text border border-pair-border/50 focus:border-pair-primary focus:outline-none transition-colors"
          />
        </motion.div>

        {/* Bio */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-5"
        >
          <label className="text-xs text-pair-textMuted font-medium mb-1.5 block">个性签名</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="一句话介绍自己..."
            rows={2}
            maxLength={200}
            className="w-full px-4 py-3 bg-pair-surface/80 rounded-2xl text-sm text-pair-text border border-pair-border/50 focus:border-pair-primary focus:outline-none resize-none transition-colors"
          />
          <p className="text-[11px] text-pair-textMuted/50 mt-1 text-right">{bio.length}/200</p>
        </motion.div>

        {/* Main Line */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <label className="text-xs text-pair-textMuted font-medium mb-1.5 block">当前主线</label>
          <div className="px-4 py-3 bg-pair-surface/80 rounded-2xl text-sm text-pair-text border border-pair-border/50">
            {profile?.mainLine || '尚未设置主线目标'}
          </div>
          <p className="text-[11px] text-pair-textMuted/50 mt-1.5">主线可在 onboarding 或行动记录中更新</p>
        </motion.div>

        {/* Save */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`w-full py-4 rounded-3xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
              hasChanges
                ? 'bg-gradient-to-r from-pair-primary to-pair-primaryMuted text-white shadow-glow-primary hover:shadow-glow-primary'
                : 'bg-pair-surfaceAlt text-pair-textMuted cursor-not-allowed'
            }`}
            whileHover={hasChanges ? { scale: 1.02 } : {}}
            whileTap={hasChanges ? { scale: 0.97 } : {}}
          >
            {saving ? (
              <motion.div
                className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : saved ? (
              <>
                <Save size={18} />
                已保存
              </>
            ) : (
              <>
                <Save size={18} />
                保存资料
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
