import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { authApi, orgsApi, tokenStorage } from "@/lib/api";
import type { AuthUser, OrgMembership } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  membership: OrgMembership | null;
  orgId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchOrg: (membership: OrgMembership) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [membership, setMembership] = useState<OrgMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const orgId = membership?.organization.id ?? tokenStorage.getOrgId();

  const bootstrap = useCallback(async () => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);

      const storedOrgId = tokenStorage.getOrgId();
      const orgs = await orgsApi.list();
      if (orgs.length > 0) {
        const found = storedOrgId
          ? orgs.find((m) => m.organization.id === storedOrgId) ?? orgs[0]
          : orgs[0];
        setMembership(found);
        tokenStorage.setOrgId(found.organization.id);
      }
    } catch {
      tokenStorage.clear();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async (email: string, password: string) => {
    const { accessToken, refreshToken } = await authApi.login({ email, password });
    tokenStorage.setTokens(accessToken, refreshToken);
    await bootstrap();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    tokenStorage.clear();
    setUser(null);
    setMembership(null);
  };

  const switchOrg = (m: OrgMembership) => {
    setMembership(m);
    tokenStorage.setOrgId(m.organization.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        membership,
        orgId,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        switchOrg,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
