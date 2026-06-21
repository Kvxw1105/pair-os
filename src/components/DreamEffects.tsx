import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlowingOrbProps {
  color?: string;
  size?: number;
  className?: string;
  blur?: number;
  opacity?: number;
  animate?: boolean;
}

export function GlowingOrb({
  color = 'rgba(184, 149, 106, 0.15)',
  size = 200,
  className = '',
  blur = 60,
  opacity = 1,
  animate = true,
}: GlowingOrbProps) {
  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        opacity,
      }}
    >
      {animate && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  );
}

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  index?: number;
  onClick?: () => void;
}

export function AnimatedCard({ children, className = '', delay = 0, index = 0, onClick }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: delay + index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={onClick ? { y: -2, scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
}

export function FloatingElement({ children, className = '', duration = 4, delay = 0 }: FloatingElementProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -6, 0, -3, 0],
        rotate: [0, 0.5, 0, -0.5, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

interface RippleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function RippleButton({ children, onClick, className = '', disabled = false }: RippleButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden ${className}`}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {children}
      <motion.span
        className="absolute inset-0 rounded-inherit pointer-events-none"
        initial={{ scale: 0, opacity: 0.3 }}
        whileTap={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
        }}
      />
    </motion.button>
  );
}

export function GradientBorder({ children, className = '', active = false }: { children: ReactNode; className?: string; active?: boolean }) {
  return (
    <div className={`relative ${className}`}>
      <div
        className={`absolute inset-0 rounded-inherit transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'}`}
        style={{
          background: 'linear-gradient(135deg, rgba(184,149,106,0.4), rgba(27,61,46,0.3), rgba(123,109,181,0.25))',
          padding: '1.5px',
          borderRadius: 'inherit',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      {children}
    </div>
  );
}

export function ShimmerText({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`relative inline-block ${className}`}
      style={{
        background: 'linear-gradient(90deg, #1C1C1C 0%, #B8956A 25%, #1C1C1C 50%, #B8956A 75%, #1C1C1C 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'shimmer 4s ease-in-out infinite',
      }}
    >
      {children}
    </span>
  );
}

export function ParticleField({ count = 20 }: { count?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `hsla(${[180, 200, 40, 45, 260, 270][Math.floor(Math.random() * 6)]}, 50%, 75%, ${Math.random() * 0.4 + 0.1})`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 10 - 5, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: Math.random() * 4 + 4,
            delay: Math.random() * 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
