import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useNotifications() {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ["notifications", orgId],
    queryFn: () => notificationsApi.list(orgId!),
    enabled: !!orgId,
  });
}

export function useUnreadNotificationCount() {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ["notifications", "unread-count", orgId],
    queryFn: () => notificationsApi.unreadCount(orgId!),
    enabled: !!orgId,
    refetchInterval: 60_000,
  });
}
