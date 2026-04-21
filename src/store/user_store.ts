import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const LEGACY_ACTIVE_USER_KEY = "activeUser";
const USER_STORE_KEY = "user-store";

export type ActiveUser = Record<string, unknown>;

type UserState = {
  activeUser: ActiveUser | null;
  setActiveUser: (user: ActiveUser | null) => void;
  handleSetActiveUser: (user: ActiveUser | null) => void;
  clearActiveUser: () => void;
};

function getLegacyActiveUser(): ActiveUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = window.localStorage.getItem(LEGACY_ACTIVE_USER_KEY);
  if (!storedUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedUser) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as ActiveUser;
    }
  } catch {
    window.localStorage.removeItem(LEGACY_ACTIVE_USER_KEY);
  }

  return null;
}

function clearAuthTokenCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = "token=; Max-Age=0; path=/";
}

function syncLegacyStorage(user: ActiveUser | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (user) {
    window.localStorage.setItem(LEGACY_ACTIVE_USER_KEY, JSON.stringify(user));
    return;
  }

  window.localStorage.removeItem(LEGACY_ACTIVE_USER_KEY);
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      activeUser: getLegacyActiveUser(),
      setActiveUser: (user) => {
        syncLegacyStorage(user);
        if (!user) {
          clearAuthTokenCookie();
        }

        set({ activeUser: user });
      },
      handleSetActiveUser: (user) => {
        syncLegacyStorage(user);
        if (!user) {
          clearAuthTokenCookie();
        }

        set({ activeUser: user });
      },
      clearActiveUser: () => {
        syncLegacyStorage(null);
        clearAuthTokenCookie();
        set({ activeUser: null });
      },
    }),
    {
      name: USER_STORE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeUser: state.activeUser }),
    },
  ),
);

export const selectActiveUser = (state: UserState) => state.activeUser;
export const selectIsAuthenticated = (state: UserState) =>
  Boolean(state.activeUser);

export function shouldSkipAuthRedirect(pathname: string): boolean {
  if (pathname === "/register") return true;
  if (pathname === "/reset-password") return true;
  if (pathname.startsWith("/set-new-password/")) return true;
  return false;
}

export function useRequireActiveUser() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeUser = useUserStore(selectActiveUser);

  useEffect(() => {
    if (activeUser) {
      return;
    }

    if (shouldSkipAuthRedirect(location.pathname)) {
      return;
    }

    navigate("/login", { replace: true });
  }, [activeUser, location.pathname, navigate]);

  return activeUser;
}
