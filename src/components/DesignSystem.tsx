import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

/* ============================================================
   Design System — 统一设计组件库
   ============================================================ */

// ========== Card 组件 ==========
interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'glass' | 'primary' | 'success' | 'warn' | 'danger';
  hover?: boolean;
  press?: boolean;
  onClick?: () => void;
  role?: string;
  'aria-label'?: string;
}

const cardVariants = {
  default: 'bg-pair-surface border border-pair-border/50',
  elevated: 'bg-pair-surface border border-pair-border/50 shadow-card',
  glass: 'bg-pair-surfaceGlass/80 backdrop-blur-md border border-pair-border/30',
  primary: 'bg-gradient-to-br from-pair-primary/5 to-pair-accent/3 border border-pair-primary/10',
  success: 'bg-gradient-to-br from-pair-success/5 to-pair-success/2 border border-pair-success/10',
  warn: 'bg-gradient-to-br from-pair-warn/5 to-pair-warn/2 border border-pair-warn/10',
  danger: 'bg-gradient-to-br from-pair-danger/5 to-pair-danger/2 border border-pair-danger/10',
};

export function Card({
  children,
  className = '',
  variant = 'elevated',
  hover = true,
  press = false,
  onClick,
  role,
  'aria-label': ariaLabel,
}: CardProps) {
  const baseClasses = `relative rounded-2xl overflow-hidden ${cardVariants[variant]}`;
  const hoverClasses = hover ? 'hover-lift' : '';
  const pressClasses = press ? 'press-effect' : '';
  const cursorClasses = onClick ? 'cursor-pointer' : '';

  return (
    <motion.div
      className={`${baseClasses} ${hoverClasses} ${pressClasses} ${cursorClasses} ${className}`}
      onClick={onClick}
      role={role}
      aria-label={ariaLabel}
      initial={false}
      whileHover={hover ? { y: -2 } : undefined}
      whileTap={press ? { scale: 0.97 } : undefined}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {variant === 'elevated' && (
        <div className="absolute inset-0 rounded-inherit bg-gradient-to-b from-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
      {children}
    </motion.div>
  );
}

// ========== Button 组件 ==========
interface ButtonProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const buttonVariants = {
  primary: 'bg-gradient-to-r from-pair-primary to-pair-primaryMuted text-white shadow-glow-primary hover:shadow-glow-primary',
  secondary: 'bg-pair-surfaceAlt text-pair-textSecondary border border-pair-border/40 hover:bg-pair-surface hover:border-pair-border/60',
  ghost: 'bg-transparent text-pair-textMuted hover:text-pair-text hover:bg-pair-surfaceAlt/50',
  danger: 'bg-gradient-to-r from-pair-danger to-pair-danger/80 text-white shadow-glow-danger hover:shadow-glow-danger',
  success: 'bg-gradient-to-r from-pair-success to-pair-success/80 text-white shadow-glow-success hover:shadow-glow-success',
};

const buttonSizes = {
  sm: 'px-3 py-2 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3.5 text-sm gap-2',
};

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      className={`
        inline-flex items-center justify-center
        rounded-2xl font-medium
        transition-all duration-300
        disabled:opacity-40 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pair-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-pair-bg
        ${buttonVariants[variant]}
        ${buttonSizes[size]}
        ${className}
      `}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {!loading && icon}
      {children}
    </motion.button>
  );
}

// ========== PageHeader 组件 ==========
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  backTo?: string;
  onBack?: () => void;
}

export function PageHeader({ title, subtitle, action, onBack }: PageHeaderProps) {
  return (
    <motion.div
      className="px-5 pt-6 pb-4"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-3">
        {onBack && (
          <motion.button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-pair-surfaceAlt/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pair-primary/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            aria-label="返回"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pair-textSecondary">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </motion.button>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-pair-text tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-pair-textMuted/70 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
    </motion.div>
  );
}

// ========== EmptyState 组件 ==========
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      className="text-center py-16 px-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="w-16 h-16 rounded-2xl bg-pair-surfaceAlt/80 border border-pair-border/40 flex items-center justify-center mx-auto mb-5"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {icon || (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-pair-textMuted/40">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
          </svg>
        )}
      </motion.div>
      <h3 className="text-sm font-semibold text-pair-textSecondary">{title}</h3>
      {description && <p className="text-xs text-pair-textMuted/60 mt-2 leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

// ========== LoadingState 组件 ==========
export function LoadingState({ message = '加载中...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20" role="status" aria-live="polite">
      <motion.div
        className="w-8 h-8 rounded-full border-2 border-pair-border/30 border-t-pair-primary"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <p className="text-xs text-pair-textMuted mt-4">{message}</p>
    </div>
  );
}

// ========== Skeleton 组件 ==========
interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-pair-surfaceAlt rounded-xl ${className}`}
          style={{
            backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0.04) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </>
  );
}

// ========== SectionTitle 组件 ==========
interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionTitle({ title, subtitle, action }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <div>
        <h3 className="text-[11px] font-bold text-pair-textMuted/80 uppercase tracking-widest">{title}</h3>
        {subtitle && <p className="text-[10px] text-pair-textMuted/50 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ========== Divider 组件 ==========
export function Divider({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-px ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pair-border/60 to-transparent" />
    </div>
  );
}

// ========== StatusBadge 组件 ==========
interface StatusBadgeProps {
  children: ReactNode;
  variant?: 'active' | 'away' | 'blocked' | 'completed' | 'partial' | 'failed' | 'cancelled' | 'neutral';
}

const statusBadgeVariants = {
  active: 'bg-pair-primary/10 text-pair-primary border-pair-primary/15',
  away: 'bg-pair-warn/10 text-pair-warn border-pair-warn/15',
  blocked: 'bg-pair-stuck/10 text-pair-stuck border-pair-stuck/15',
  completed: 'bg-pair-success/10 text-pair-success border-pair-success/15',
  partial: 'bg-pair-accent/10 text-pair-accent border-pair-accent/15',
  failed: 'bg-pair-danger/10 text-pair-danger border-pair-danger/15',
  cancelled: 'bg-pair-textMuted/10 text-pair-textMuted border-pair-textMuted/15',
  neutral: 'bg-pair-surfaceAlt text-pair-textMuted border-pair-border/30',
};

export function StatusBadge({ children, variant = 'neutral' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusBadgeVariants[variant]}`}>
      {children}
    </span>
  );
}

// ========== Input 组件 ==========
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({ label, error, helper, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-pair-textSecondary">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3.5 rounded-2xl
          bg-pair-surfaceAlt/60 border border-pair-border/40
          text-sm text-pair-text
          placeholder:text-pair-textMuted/40
          focus:border-pair-primary/30 focus:outline-none focus:ring-2 focus:ring-pair-primary/8
          hover:bg-pair-surfaceAlt/80
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-pair-danger/40 focus:border-pair-danger/50 focus:ring-pair-danger/8' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-pair-danger" role="alert">{error}</p>
      )}
      {helper && !error && (
        <p className="text-[10px] text-pair-textMuted/60">{helper}</p>
      )}
    </div>
  );
}

// ========== TextArea 组件 ==========
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function TextArea({ label, error, helper, className = '', ...props }: TextAreaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-pair-textSecondary">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-3.5 rounded-2xl
          bg-pair-surfaceAlt/60 border border-pair-border/40
          text-sm text-pair-text
          placeholder:text-pair-textMuted/40
          focus:border-pair-primary/30 focus:outline-none focus:ring-2 focus:ring-pair-primary/8
          hover:bg-pair-surfaceAlt/80
          transition-all duration-300
          resize-none
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-pair-danger/40 focus:border-pair-danger/50 focus:ring-pair-danger/8' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-pair-danger" role="alert">{error}</p>
      )}
      {helper && !error && (
        <p className="text-[10px] text-pair-textMuted/60">{helper}</p>
      )}
    </div>
  );
}

// ========== Toast / Snackbar 组件 ==========
interface ToastProps {
  message: string;
  variant?: 'success' | 'error' | 'info';
  visible: boolean;
  onClose?: () => void;
}

export function Toast({ message, variant = 'info', visible, onClose }: ToastProps) {
  const variantClasses = {
    success: 'bg-pair-success text-white',
    error: 'bg-pair-danger text-white',
    info: 'bg-pair-surface text-pair-text border border-pair-border/50',
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm px-4 py-3 rounded-2xl shadow-floating-lg ${variantClasses[variant]}`}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          role="alert"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{message}</p>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                type="button"
                aria-label="关闭"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ========== AnimatedList 组件 ==========
interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function AnimatedList({ children, className = '', staggerDelay = 0.06 }: AnimatedListProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: staggerDelay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedListItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12, scale: 0.98 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// ========== ScreenReaderOnly 组件 ==========
export function ScreenReaderOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// ========== FocusTrap 辅助组件（简单版） ==========
export function useFocusTrap(_ref: React.RefObject<HTMLElement | null>, _active: boolean) {
  // 实际项目中使用更完整的 focus trap 实现
  // 这里提供 hooks 接口供后续扩展
}

// ========== 导出动画预设 ==========
export const fadeInUp = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export const staggerContainer = (delay: number = 0.06) => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: delay } },
});
