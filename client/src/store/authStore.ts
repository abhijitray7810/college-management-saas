import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "@/services/auth.service";
import type { User, Role } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; role: Role }) => Promise<User>;
  logout: () => void;
  clearError: () => void;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
  isStudent: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          const { user, token } = response.data;
          set({ user, token, isLoading: false });
          return user;
        } catch (error: any) {
          const message = error.response?.data?.error?.message || "Login failed";
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);
          const { user, token } = response.data;
          set({ user, token, isLoading: false });
          return user;
        } catch (error: any) {
          const message = error.response?.data?.error?.message || "Registration failed";
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      logout: () => {
        authService.logout().catch(() => {}); // Silent fail
        set({ user: null, token: null, error: null });
      },

      clearError: () => set({ error: null }),

      // Role check functions
      isSuperAdmin: () => get().user?.role === "SUPER_ADMIN",
      isAdmin: () => get().user?.role === "ADMIN" || get().user?.role === "SUPER_ADMIN",
      isTeacher: () => get().user?.role === "TEACHER",
      isStudent: () => get().user?.role === "STUDENT",
    }),
    {
      name: "cms-auth",
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
