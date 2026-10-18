import { create } from 'zustand';
import type { ThemeMode } from '@/lib/types';

interface AppState {
  // Sidebar
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarMobileOpen: (open: boolean) => void;

  // Theme
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  // Calendar panel
  calendarPanelOpen: boolean;
  setCalendarPanelOpen: (open: boolean) => void;

  // Reminders panel
  remindersPanelOpen: boolean;
  setRemindersPanelOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Sidebar
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  toggleSidebarCollapse: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),

  // Theme
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),

  // Calendar panel
  calendarPanelOpen: false,
  setCalendarPanelOpen: (open) => set({ calendarPanelOpen: open }),

  // Reminders panel
  remindersPanelOpen: false,
  setRemindersPanelOpen: (open) => set({ remindersPanelOpen: open }),
}));
