import { useState, useEffect } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { Home, Clock, Users, Settings, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '../stores/AppStore';

export function Layout() {
  const location = useLocation();
  const { isOnboarding, profile } = useAppState();
  const [hideNav, setHideNav] = useState(false);

  useEffect(() => {
    const noNavPaths = ['/onboarding', '/action/', '/away/', '/blocked/', '/end/'];
    setHideNav(
      noNavPaths.some((p) => location.pathname.startsWith(p)) ||
      (isOnboarding && location.pathname === '/')
    );
  }, [location.pathname, isOnboarding]);

  if ((isOnboarding && !profile?.onboardingCompleted) && (location.pathname === '/' || location.pathname === '/onboarding')) {
    return (
      <div className="min-h-[100dvh] bg-pair-bg">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-pair-bg flex flex-col">
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-link">
        跳到主内容
      </a>

      <main id="main-content" className="flex-1 overflow-y-auto no-scrollbar pb-20" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98, filter: 'blur(4px)' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
          role="navigation"
          aria-label="主导航"
        >
          <div className="max-w-lg mx-auto glass border-t border-pair-border/40 px-2 py-1.5">
            <div className="flex justify-around items-center">
              <NavItem to="/" icon={Home} label="今天" />
              <NavItem to="/timeline" icon={Clock} label="轨迹" />
              <NavItem to="/report" icon={FileText} label="日报" />
              <NavItem to="/partner" icon={Users} label="我们" />
              <NavItem to="/settings" icon={Settings} label="设置" />
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}

function NavItem({ to, icon: Icon, label }: { to: string; icon: typeof Home; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 py-2 px-4 rounded-2xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pair-primary/20 ${
          isActive
            ? 'text-pair-primary bg-pair-primaryLight'
            : 'text-pair-textMuted hover:text-pair-textSecondary'
        }`
      }
      aria-current={undefined}
    >
      {({ isActive }) => (
        <motion.div
          className="flex flex-col items-center gap-0.5"
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <motion.div
            animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
          </motion.div>
          <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{label}</span>
          {isActive && (
            <motion.div
              className="w-1 h-1 rounded-full bg-pair-primary mt-0.5"
              layoutId="nav-indicator"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </motion.div>
      )}
    </NavLink>
  );
}
