import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { renewalsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useRenewalSummary() {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ["renewals", "summary", orgId],
    queryFn: () => renewalsApi.summary(orgId!),
    enabled: !!orgId,
  });
}

export function useUpcomingRenewals(days = 30) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ["renewals", "upcoming", orgId, days],
    queryFn: () => renewalsApi.upcoming(orgId!, days),
    enabled: !!orgId,
  });
}

export function useOverdueRenewals() {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ["renewals", "overdue", orgId],
    queryFn: () => renewalsApi.overdue(orgId!),
    enabled: !!orgId,
  });
}

export function useRenewalCalendar(year: number, month: number) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ["renewals", "calendar", orgId, year, month],
    queryFn: () => renewalsApi.calendar(orgId!, year, month),
    enabled: !!orgId,
  });
}

export function useRenewAsset() {
  const { orgId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, newRenewalDate }: { assetId: string; newRenewalDate?: string }) =>
      renewalsApi.renew(orgId!, assetId, newRenewalDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets", orgId] });
      qc.invalidateQueries({ queryKey: ["renewals", orgId] });
    },
  });
}
