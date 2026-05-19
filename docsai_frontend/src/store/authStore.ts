import { create } from "zustand";
import { logout as logoutFromBackend } from "@/lib/api";
interface User {
  username: string;
  email: string;
}

interface AuthStore {
  user: User | null;
  setAuth: (user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,

  setAuth: (user: User) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },

  logout: async () => {
    try {
      await logoutFromBackend();
      localStorage.removeItem("user");
      set({ user: null });
    } catch (error) {

    }
  },

  hydrate: () => {
    const raw = localStorage.getItem("user");
    const user = raw ? (JSON.parse(raw) as User) : null;
    set({ user });
  },
}));
