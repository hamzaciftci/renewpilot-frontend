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
  memberships: OrgMembership[];
  membership: OrgMembership | null;
  orgId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (body: { email: string; password: string; fullName: string; timezone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchOrg: (membership: OrgMembership) => void;
  createOrg: (body: { name: string; timezone?: string; currency?: string }) => Promise<void>;
  refreshMemberships: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [membership, setMembership] = useState<OrgMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const orgId = membership?.organization.id ?? null;

  const loadMemberships = useCallback(async () => {
    const storedOrgId = tokenStorage.getOrgId();
    const orgs = await orgsApi.list();
    setMemberships(orgs);
    if (orgs.length > 0) {
      const found = storedOrgId
        ? orgs.find((m) => m.organization.id === storedOrgId) ?? orgs[0]
        : orgs[0];
      setMembership(found);
      tokenStorage.setOrgId(found.organization.id);
    } else {
      setMembership(null);
    }
  }, []);

  const bootstrap = useCallback(async () => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
      await loadMemberships();
    } catch {
      tokenStorage.clear();
      setUser(null);
      setMemberships([]);
      setMembership(null);
    } finally {
      setIsLoading(false);
    }
  }, [loadMemberships]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async (email: string, password: string) => {
    const { accessToken, refreshToken } = await authApi.login({ email, password });
    tokenStorage.setTokens(accessToken, refreshToken);
    setIsLoading(true);
    await bootstrap();
  };

  const register = async (body: { email: string; password: string; fullName: string; timezone?: string }) => {
    const { accessToken, refreshToken } = await authApi.register(body);
    tokenStorage.setTokens(accessToken, refreshToken);
    setIsLoading(true);
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
    setMemberships([]);
    setMembership(null);
  };

  const switchOrg = (m: OrgMembership) => {
    setMembership(m);
    tokenStorage.setOrgId(m.organization.id);
  };

  const createOrg = async (body: { name: string; timezone?: string; currency?: string }) => {
    await orgsApi.create(body);
    await loadMemberships();
  };

  const refreshMemberships = async () => {
    await loadMemberships();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        memberships,
        membership,
        orgId,
        isLoading,
        isAuthenticated: !!user,
        needsOnboarding: !!user && memberships.length === 0,
        login,
        register,
        logout,
        switchOrg,
        createOrg,
        refreshMemberships,
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
