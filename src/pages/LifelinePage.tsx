import { useMemo, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../stores/AppStore';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowLeft, Heart } from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { color: string; glow: string; label: string }> = {
  work: { color: '#1B3D2E', glow: 'rgba(27,61,46,0.3)', label: '工作' },
  study: { color: '#B8956A', glow: 'rgba(184,149,106,0.3)', label: '学习' },
  life: { color: '#7B6DB5', glow: 'rgba(123,109,181,0.3)', label: '生活' },
  health: { color: '#2B6B4E', glow: 'rgba(43,107,78,0.3)', label: '健康' },
  social: { color: '#C495A0', glow: 'rgba(196,149,160,0.3)', label: '社交' },
  rest: { color: '#4A8B7A', glow: 'rgba(74,139,122,0.3)', label: '休息' },
};

interface LifelineNode {
  id: string;
  title: string;
  userId: string;
  timestamp: number;
  duration: number;
  category: string;
  emotion: string | null;
  side: 'left' | 'right';
  y: number;
}

interface Connection {
  from: LifelineNode;
  to: LifelineNode;
  overlapDuration: number;
}

export function LifelinePage() {
  const navigate = useNavigate();
  const state = useAppState();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const profile = state.profile;
  const partner = state.partners[0] || state.guidePartner || null;
  const myId = profile?.id;
  const partnerId = partner?.id;

  // Get all actions from both users
  const allActions = useMemo(() => {
    return state.actions.filter(
      (a) => a.userId === myId || a.userId === partnerId
    );
  }, [state.actions, myId, partnerId]);

  // Build lifeline nodes
  const nodes = useMemo(() => {
    if (!allActions.length) return [];

    const sorted = [...allActions].sort((a, b) => a.createdAt - b.createdAt);
    const startTime = sorted[0].createdAt;
    const endTime = sorted[sorted.length - 1].createdAt + sorted[sorted.length - 1].totalDurationMs;
    const totalSpan = endTime - startTime || 1;
    const containerHeight = 8000; // virtual scroll height

    return sorted.map((action) => {
      const progress = (action.createdAt - startTime) / totalSpan;
      const y = progress * containerHeight + 200; // padding top

      return {
        id: action.id,
        title: action.title,
        userId: action.userId,
        timestamp: action.createdAt,
        duration: action.totalDurationMs,
        category: action.category || 'life',
        emotion: action.result || null,
        side: action.userId === myId ? 'left' : 'right',
        y,
      } as LifelineNode;
    });
  }, [allActions, myId]);

  // Find overlapping actions (both active within same time window)
  const connections = useMemo(() => {
    const result: Connection[] = [];
    const myActions = nodes.filter((n) => n.side === 'left');
    const partnerActions = nodes.filter((n) => n.side === 'right');

    for (const my of myActions) {
      for (const p of partnerActions) {
        const myStart = my.timestamp;
        const myEnd = my.timestamp + my.duration;
        const pStart = p.timestamp;
        const pEnd = p.timestamp + p.duration;

        const overlapStart = Math.max(myStart, pStart);
        const overlapEnd = Math.min(myEnd, pEnd);

        if (overlapEnd > overlapStart) {
          result.push({
            from: my,
            to: p,
            overlapDuration: overlapEnd - overlapStart,
          });
        }
      }
    }
    return result;
  }, [nodes]);

  // Calculate days together
  const daysTogether = useMemo(() => {
    if (!allActions.length) return 0;
    const firstAction = Math.min(...allActions.map((a) => a.createdAt));
    const now = Date.now();
    return Math.floor((now - firstAction) / (1000 * 60 * 60 * 24));
  }, [allActions]);

  // Calculate sync score (how often actions overlap)
  const syncScore = useMemo(() => {
    if (!allActions.length) return 0;
    const myActions = allActions.filter((a) => a.userId === myId);
    const partnerActions = allActions.filter((a) => a.userId === partnerId);
    if (!myActions.length || !partnerActions.length) return 0;

    let myActiveTime = 0;
    let overlapTime = 0;

    for (const my of myActions) {
      myActiveTime += my.totalDurationMs;
      const myStart = my.createdAt;
      const myEnd = my.createdAt + my.totalDurationMs;

      for (const p of partnerActions) {
        const pStart = p.createdAt;
        const pEnd = p.createdAt + p.totalDurationMs;
        const overlap = Math.max(0, Math.min(myEnd, pEnd) - Math.max(myStart, pStart));
        overlapTime += overlap;
      }
    }

    return myActiveTime > 0 ? Math.round((overlapTime / myActiveTime) * 100) : 0;
  }, [allActions, myId, partnerId]);

  const { scrollYProgress } = useScroll({ container: containerRef });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const smoothScaleY = useSpring(scaleY, { stiffness: 100, damping: 30 });

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);

  if (!allActions.length) {
    return (
      <div className="min-h-[100dvh] bg-pair-bg flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-pair-surfaceAlt flex items-center justify-center mb-4">
          <Heart size={32} className="text-pair-textMuted/30" />
        </div>
        <p className="text-sm text-pair-textSecondary font-medium">还没有共同行动</p>
        <p className="text-xs text-pair-textMuted/60 mt-2">开始行动后，这里会生成你们的生命线</p>
      </div>
    );
  }

  const centerX = dimensions.width / 2;
  const leftX = centerX - 80;
  const rightX = centerX + 80;

  return (
    <div className="min-h-[100dvh] bg-pair-bg flex flex-col overflow-hidden">
      {/* Header */}
      <motion.div
        className="px-5 pt-6 pb-4 flex items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => navigate('/partner')}
          className="p-2 -ml-2 rounded-xl hover:bg-pair-surfaceAlt/60 transition-colors"
        >
          <ArrowLeft size={20} className="text-pair-textSecondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-pair-text">生命线</h1>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        className="px-5 pb-4 flex gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex-1 bg-pair-surface rounded-2xl p-3 border border-pair-border/50 text-center">
          <div className="text-lg font-bold text-pair-primary">{daysTogether}</div>
          <div className="text-[10px] text-pair-textMuted">天</div>
        </div>
        <div className="flex-1 bg-pair-surface rounded-2xl p-3 border border-pair-border/50 text-center">
          <div className="text-lg font-bold text-pair-accent">{syncScore}%</div>
          <div className="text-[10px] text-pair-textMuted">同步率</div>
        </div>
        <div className="flex-1 bg-pair-surface rounded-2xl p-3 border border-pair-border/50 text-center">
          <div className="text-lg font-bold text-pair-success">{allActions.length}</div>
          <div className="text-[10px] text-pair-textMuted">行动</div>
        </div>
      </motion.div>

      {/* Scrollable Lifeline */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="relative mx-auto" style={{ width: Math.min(dimensions.width, 500), height: 8200 }}>
          {/* SVG Overlay for connections */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <defs>
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(184,149,106,0.4)" />
                <stop offset="50%" stopColor="rgba(123,109,181,0.6)" />
                <stop offset="100%" stopColor="rgba(184,149,106,0.4)" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {connections.map((conn, i) => (
              <motion.path
                key={i}
                d={`M ${leftX} ${conn.from.y} Q ${centerX} ${(conn.from.y + conn.to.y) / 2} ${rightX} ${conn.to.y}`}
                stroke="url(#connectionGradient)"
                strokeWidth={Math.min(conn.overlapDuration / 60000 / 10, 4) + 1}
                fill="none"
                filter="url(#glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.6 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
            ))}
          </svg>

          {/* Center Timeline */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-pair-border/60 to-transparent" style={{ transform: 'translateX(-50%)' }}>
            <motion.div
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-pair-primary via-pair-accent to-pair-primary"
              style={{ height: smoothScaleY }}
            />
          </div>

          {/* Avatars at top */}
          <div className="absolute top-8 left-0 right-0 flex justify-between px-8">
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-12 h-12 rounded-full bg-pair-primary/10 border-2 border-pair-primary/30 flex items-center justify-center">
                <span className="text-lg font-bold text-pair-primary">{profile?.name?.[0] || '我'}</span>
              </div>
              <span className="text-[10px] text-pair-textMuted mt-1">{profile?.name || '我'}</span>
            </motion.div>
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-12 h-12 rounded-full bg-pair-accent/10 border-2 border-pair-accent/30 flex items-center justify-center">
                <span className="text-lg font-bold text-pair-accent">{partner?.name?.[0] || 'Ta'}</span>
              </div>
              <span className="text-[10px] text-pair-textMuted mt-1">{partner?.name || 'Ta'}</span>
            </motion.div>
          </div>

          {/* Nodes */}
          {nodes.map((node, i) => {
            const config = CATEGORY_CONFIG[node.category] || CATEGORY_CONFIG.life;
            const isLeft = node.side === 'left';
            const x = isLeft ? leftX - 20 : rightX + 20;
            const nodeSize = Math.min(Math.max(node.duration / 60000 / 5, 4), 16);

            return (
              <motion.div
                key={node.id}
                className="absolute"
                style={{
                  left: x,
                  top: node.y,
                  transform: `translateX(-50%)`,
                }}
                initial={{ opacity: 0, scale: 0, x: isLeft ? -20 : 20 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative group">
                  {/* Node dot */}
                  <motion.div
                    className="rounded-full shadow-card cursor-pointer"
                    style={{
                      width: nodeSize,
                      height: nodeSize,
                      backgroundColor: config.color,
                      boxShadow: `0 0 ${nodeSize * 2}px ${config.glow}`,
                    }}
                    whileHover={{ scale: 2 }}
                  />
                  {/* Tooltip */}
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none"
                    style={{
                      left: isLeft ? '100%' : 'auto',
                      right: isLeft ? 'auto' : '100%',
                      top: '50%',
                      transform: `translateY(-50%) ${isLeft ? 'translateX(8px)' : 'translateX(-8px)'}`,
                    }}
                  >
                    <div className="bg-pair-surface/90 backdrop-blur px-3 py-2 rounded-xl border border-pair-border/50 shadow-card text-xs">
                      <div className="font-semibold text-pair-text">{node.title}</div>
                      <div className="text-pair-textMuted mt-0.5">
                        {Math.round(node.duration / 60000)}分钟 · {config.label}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Center heartbeat pulse */}
          {connections.length > 0 && (
            <motion.div
              className="absolute left-1/2 top-1/2"
              style={{ transform: 'translate(-50%, -50%)' }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-4 h-4 rounded-full bg-pair-accent/30" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
