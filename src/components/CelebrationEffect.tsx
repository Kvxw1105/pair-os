import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trophy, Star, Zap } from 'lucide-react';
import type { ResultType } from '../types';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  shape: 'circle' | 'square' | 'star';
}

interface Confetti {
  id: number;
  x: number;
  color: string;
  width: number;
  height: number;
  delay: number;
  duration: number;
  rotation: number;
}

function generateParticles(count: number): Particle[] {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#FF9F43', '#FF6B9D', '#C8E6C9', '#B3E5FC',
    '#FFD54F', '#FF8A65', '#A5D6A7', '#90CAF9', '#F48FB1'
  ];
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 300 + Math.random() * 400;
    return {
      id: i,
      x: 50,
      y: 50,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 10,
      delay: Math.random() * 0.15,
      duration: 1.2 + Math.random() * 0.8,
      shape: ['circle', 'square', 'star'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'star',
    };
  });
}

function generateConfetti(count: number): Confetti[] {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#FF9F43', '#FF6B9D', '#FF8A65', '#90CAF9'
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    width: 4 + Math.random() * 6,
    height: 8 + Math.random() * 16,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1.5,
    rotation: Math.random() * 360,
  }));
}

function ParticleShape({ shape, color, size }: { shape: 'circle' | 'square' | 'star'; color: string; size: number }) {
  if (shape === 'star') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: shape === 'circle' ? '50%' : '2px',
        backgroundColor: color,
      }}
    />
  );
}

export function CelebrationEffect({
  show,
  result,
  onComplete,
}: {
  show: boolean;
  result: ResultType | null;
  onComplete: () => void;
}) {
  const [particles] = useState(() => generateParticles(60));
  const [confetti] = useState(() => generateConfetti(40));
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (show) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 200);
      const completeTimer = setTimeout(onComplete, 2500);
      return () => {
        clearTimeout(timer);
        clearTimeout(completeTimer);
      };
    }
  }, [show, onComplete]);

  const resultConfig = {
    completed: {
      icon: Trophy,
      title: '行动完成！',
      subtitle: '又一块拼图归位',
      color: 'from-emerald-400 to-teal-500',
      bgColor: 'bg-emerald-500/20',
      textColor: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-500',
      ringColor: 'ring-emerald-400/50',
    },
    partial: {
      icon: Star,
      title: '不错，有推进！',
      subtitle: '完成部分也是胜利',
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-amber-500/20',
      textColor: 'text-amber-600',
      iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
      ringColor: 'ring-amber-400/50',
    },
    failed: {
      icon: Zap,
      title: '记录了，下次继续',
      subtitle: '诚实记录比完美更重要',
      color: 'from-slate-400 to-slate-600',
      bgColor: 'bg-slate-500/20',
      textColor: 'text-slate-600',
      iconBg: 'bg-gradient-to-br from-slate-400 to-slate-600',
      ringColor: 'ring-slate-400/50',
    },
    cancelled: {
      icon: CheckCircle2,
      title: '已记录',
      subtitle: '灵活调整也是智慧',
      color: 'from-slate-300 to-slate-500',
      bgColor: 'bg-slate-500/20',
      textColor: 'text-slate-500',
      iconBg: 'bg-gradient-to-br from-slate-300 to-slate-500',
      ringColor: 'ring-slate-400/50',
    },
  };

  const config = result ? resultConfig[result] : resultConfig.completed;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          style={{ pointerEvents: 'none' }}
        >
          {/* Dark backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          {/* Flash effect */}
          <AnimatePresence>
            {flash && (
              <motion.div
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-white"
              />
            )}
          </AnimatePresence>

          {/* Particles */}
          <div className="absolute inset-0">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                }}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 0.8, 0.3],
                  x: p.vx,
                  y: p.vy,
                }}
                transition={{
                  delay: p.delay,
                  duration: p.duration,
                  ease: 'easeOut',
                }}
              >
                <ParticleShape shape={p.shape} color={p.color} size={p.size} />
              </motion.div>
            ))}
          </div>

          {/* Confetti */}
          <div className="absolute inset-0">
            {confetti.map((c) => (
              <motion.div
                key={`c-${c.id}`}
                className="absolute"
                style={{
                  left: `${c.x}%`,
                  top: '-20px',
                  width: c.width,
                  height: c.height,
                  backgroundColor: c.color,
                  borderRadius: '2px',
                }}
                initial={{ opacity: 0, y: 0, rotate: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: ['0vh', '30vh', '60vh', '110vh'],
                  rotate: [0, c.rotation, c.rotation * 2, c.rotation * 3],
                  scale: [0, 1, 1, 0.5],
                }}
                transition={{
                  delay: 0.2 + c.delay,
                  duration: c.duration,
                  ease: 'easeIn',
                }}
              />
            ))}
          </div>

          {/* Center content */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
          >
            {/* Icon with rings */}
            <motion.div
              className="relative mb-6"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
            >
              {/* Ripple rings */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={`absolute inset-0 rounded-full ${config.ringColor} ring-2`}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2.5 + i * 0.5, opacity: 0 }}
                  transition={{
                    delay: 0.3 + i * 0.15,
                    duration: 1.2,
                    ease: 'easeOut',
                  }}
                />
              ))}

              {/* Main icon */}
              <motion.div
                className={`w-24 h-24 rounded-full ${config.iconBg} flex items-center justify-center shadow-lg relative`}
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  delay: 0.5,
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Icon size={44} className="text-white" strokeWidth={2.5} />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h2
              className={`text-2xl font-bold mb-2 bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
            >
              {config.title}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="text-sm text-pair-textMuted/70"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55, type: 'spring', stiffness: 300 }}
            >
              {config.subtitle}
            </motion.p>

            {/* Floating mini particles around text */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`float-${i}`}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#FFD54F', '#FF6B9D', '#4ECDC4', '#96CEB4'][i % 4],
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                  }}
                  animate={{
                    y: [0, -15, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    delay: 0.6 + i * 0.1,
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 0.5 + Math.random(),
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
