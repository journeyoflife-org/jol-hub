import { create } from 'zustand';
import type { Parish, User, ParishFilters, UserFilters } from '@/types';

// =============================================================================
// UI Store
// =============================================================================

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  theme: 'system',
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
}));

// =============================================================================
// Parishes Store
// =============================================================================

interface ParishesState {
  parishes: Parish[];
  selectedParish: Parish | null;
  filters: ParishFilters;
  page: number;
  total: number;
  isLoading: boolean;
  setParishes: (parishes: Parish[]) => void;
  setSelectedParish: (parish: Parish | null) => void;
  setFilters: (filters: ParishFilters) => void;
  setPage: (page: number) => void;
  setLoading: (loading: boolean) => void;
  setTotal: (total: number) => void;
}

export const useParishesStore = create<ParishesState>((set) => ({
  parishes: [],
  selectedParish: null,
  filters: {},
  page: 1,
  total: 0,
  isLoading: false,
  setParishes: (parishes) => set({ parishes }),
  setSelectedParish: (parish) => set({ selectedParish: parish }),
  setFilters: (filters) => set({ filters, page: 1 }),
  setPage: (page) => set({ page }),
  setLoading: (isLoading) => set({ isLoading }),
  setTotal: (total) => set({ total }),
}));

// =============================================================================
// Users Store
// =============================================================================

interface UsersState {
  users: User[];
  selectedUser: User | null;
  filters: UserFilters;
  page: number;
  total: number;
  isLoading: boolean;
  setUsers: (users: User[]) => void;
  setSelectedUser: (user: User | null) => void;
  setFilters: (filters: UserFilters) => void;
  setPage: (page: number) => void;
  setLoading: (loading: boolean) => void;
  setTotal: (total: number) => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  selectedUser: null,
  filters: {},
  page: 1,
  total: 0,
  isLoading: false,
  setUsers: (users) => set({ users }),
  setSelectedUser: (user) => set({ selectedUser: user }),
  setFilters: (filters) => set({ filters, page: 1 }),
  setPage: (page) => set({ page }),
  setLoading: (isLoading) => set({ isLoading }),
  setTotal: (total) => set({ total }),
}));

// =============================================================================
// Notifications Store
// =============================================================================

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationsState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));
    
    // Auto-remove after duration
    const duration = notification.duration || 5000;
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, duration);
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
  clearAll: () => set({ notifications: [] }),
}));
