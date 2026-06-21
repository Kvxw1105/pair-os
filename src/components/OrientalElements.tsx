import { motion } from 'framer-motion';

/**
 * 国风装饰组件 — 不修改字体文案，只提供视觉元素
 * 包含：太极、祥云、印章、山水淡影
 */

/** 小太极装饰 — 用于卡片角落或状态指示 */
export function TaijiDot({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    >
      <defs>
        <linearGradient id="taijiDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1C1C1C" />
          <stop offset="50%" stopColor="#1C1C1C" />
          <stop offset="50%" stopColor="#E8E4DE" />
          <stop offset="100%" stopColor="#E8E4DE" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#taijiDark)" opacity="0.12" />
      <circle cx="20" cy="14" r="4" fill="#E8E4DE" opacity="0.3" />
      <circle cx="20" cy="26" r="4" fill="#1C1C1C" opacity="0.3" />
    </motion.svg>
  );
}

/** 祥云装饰 — 用于卡片顶部或背景角落 */
export function CloudDecoration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 36"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d="M5 30c-3 0-5-2.5-5-5.5s2.5-5.5 5.5-5.5c.7 0 1.3.1 1.9.4C10.2 15.2 14.3 13 18.8 13c3.5 0 6.6 1.9 8.3 4.8.6-.2 1.2-.3 1.8-.3 5.5 0 10 4.5 10 10s-4.5 10-10 10H5z"
        fill="currentColor"
        opacity="0.08"
      />
      <path
        d="M45 32c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5c.5 0 1 .1 1.4.3 1.3-2.6 4.2-4.3 7.5-4.3 3 0 5.6 1.6 7.1 3.9.5-.1 1-.2 1.5-.2 4.7 0 8.5 3.8 8.5 8.5s-3.8 8.5-8.5 8.5H45z"
        fill="currentColor"
        opacity="0.06"
      />
    </svg>
  );
}

/** 印章标记 — 方形/圆形红印 */
export function SealMark({ text, size = 'sm', variant = 'square' }: {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'square' | 'circle';
}) {
  const sizeMap = { sm: 28, md: 36, lg: 44 };
  const s = sizeMap[size];
  const fontSize = size === 'sm' ? 8 : size === 'md' ? 10 : 12;

  if (variant === 'circle') {
    return (
      <div
        className="inline-flex items-center justify-center rounded-full"
        style={{
          width: s,
          height: s,
          background: 'linear-gradient(135deg, #C85050, #A84040)',
          color: 'white',
          fontSize,
          fontWeight: 700,
          transform: 'rotate(-5deg)',
          boxShadow: '0 1px 4px rgba(200, 80, 80, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.25)',
        }}
      >
        {text}
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center justify-center relative"
      style={{
        width: s,
        height: s,
        borderRadius: 4,
        background: 'linear-gradient(135deg, #C85050, #A84040)',
        color: 'white',
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.5px',
        transform: 'rotate(-3deg)',
        boxShadow: '0 1px 3px rgba(200, 80, 80, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      <span className="relative z-10">{text}</span>
      <div
        className="absolute"
        style={{
          inset: 2,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: 2,
        }}
      />
    </div>
  );
}

/** 山水淡影 — 底部装饰 */
export function MountainSilhouette({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 60"
      preserveAspectRatio="none"
      className={`w-full h-12 opacity-30 ${className}`}
    >
      <path
        d="M0 60 L0 40 Q30 20 60 35 Q90 10 120 30 Q150 5 180 25 Q210 15 240 30 Q270 10 300 25 Q330 5 360 20 Q390 15 400 25 L400 60Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** 竹简边框装饰 — 用于引用或特殊区块 */
export function BambooBorder({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative pl-4 ${className}`}>
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{
          background: 'linear-gradient(to bottom, rgba(184,149,106,0.4) 0%, rgba(184,149,106,0.1) 15%, rgba(184,149,106,0.4) 30%, rgba(184,149,106,0.1) 45%, rgba(184,149,106,0.4) 60%, rgba(184,149,106,0.1) 75%, rgba(184,149,106,0.4) 100%)',
        }}
      />
      {children}
    </div>
  );
}

/** 古风分割线 */
export function OrientalDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-px my-4 ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(184,149,106,0.3) 20%, rgba(184,149,106,0.6) 50%, rgba(184,149,106,0.3) 80%, transparent)',
        }}
      />
      <div
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
        style={{ background: 'rgba(184,149,106,0.4)' }}
      />
      <div
        className="absolute top-1/2 right-1/4 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
        style={{ background: 'rgba(184,149,106,0.4)' }}
      />
    </div>
  );
}

/** 水墨纹理卡片包裹器 */
export function InkWashCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cfilter id='ink'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' result='noise'/%3E%3CfeDiffuseLighting in='noise' lighting-color='%23ffffff' surfaceScale='2' result='diffuse'%3E%3CfeDistantLight azimuth='45' elevation='60'/%3E%3C/feDiffuseLighting%3E%3CfeBlend in='SourceGraphic' in2='diffuse' mode='multiply'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23ink)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          mixBlendMode: 'overlay',
        }}
      />
      {children}
    </div>
  );
}

/** 卷轴阴影效果 */
export function ScrollShadow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute top-0 left-0 right-0 h-2 pointer-events-none rounded-t-inherit"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.04), transparent)' }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-2 pointer-events-none rounded-b-inherit"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.04), transparent)' }}
      />
      {children}
    </div>
  );
}

/** 装饰角落太极 + 祥云组合 */
export function CornerOriental({ position = 'top-right' }: { position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' }) {
  const posClass = {
    'top-right': '-top-2 -right-2',
    'top-left': '-top-2 -left-2',
    'bottom-right': '-bottom-2 -right-2',
    'bottom-left': '-bottom-2 -left-2',
  };

  return (
    <div className={`absolute ${posClass[position]} opacity-30 pointer-events-none`}>
      <TaijiDot size={16} />
    </div>
  );
}
