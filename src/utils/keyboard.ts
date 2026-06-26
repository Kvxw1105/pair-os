import { useEffect } from 'react';

interface KeyboardShortcuts {
  onEscape?: () => void;
  onSearch?: () => void;
  onNewAction?: () => void;
  onNavigateHome?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Escape even when typing
        if (e.key !== 'Escape') return;
      }

      // Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        shortcuts.onEscape?.();
        return;
      }

      // Search: / or Cmd+K / Ctrl+K
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        shortcuts.onSearch?.();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        shortcuts.onSearch?.();
        return;
      }

      // New action: n (when not in input)
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        shortcuts.onNewAction?.();
        return;
      }

      // Navigate home: g then h (vim-style) or Cmd+Home
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        shortcuts.onNavigateHome?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts.onEscape, shortcuts.onSearch, shortcuts.onNewAction, shortcuts.onNavigateHome]);
}

// Standalone escape handler for modals/overlays
export function useEscapeKey(onEscape: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape]);
}
