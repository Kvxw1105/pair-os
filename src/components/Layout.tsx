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
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
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
        `flex flex-col items-center gap-0.5 py-2 px-4 rounded-2xl transition-all duration-200 ${
          isActive
            ? 'text-pair-primary bg-pair-primaryLight'
            : 'text-pair-textMuted hover:text-pair-textSecondary'
        }`
      }
    >
      <Icon size={20} strokeWidth={2} />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}
