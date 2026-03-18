import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { CreateAssetDto } from "@/types";

export function useAssets(params?: Record<string, string>) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ["assets", orgId, params],
    queryFn: () => assetsApi.list(orgId!, params),
    enabled: !!orgId,
  });
}

export function useAsset(assetId: string) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ["assets", orgId, assetId],
    queryFn: () => assetsApi.get(orgId!, assetId),
    enabled: !!orgId && !!assetId,
  });
}

export function useAssetHistory(assetId: string) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ["assets", orgId, assetId, "history"],
    queryFn: () => assetsApi.history(orgId!, assetId),
    enabled: !!orgId && !!assetId,
  });
}

export function useCreateAsset() {
  const { orgId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAssetDto) => assetsApi.create(orgId!, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets", orgId] });
      qc.invalidateQueries({ queryKey: ["renewals", orgId] });
    },
  });
}

export function useUpdateAsset(assetId: string) {
  const { orgId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<CreateAssetDto>) => assetsApi.update(orgId!, assetId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets", orgId] });
    },
  });
}

export function useDeleteAsset() {
  const { orgId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) => assetsApi.remove(orgId!, assetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets", orgId] });
      qc.invalidateQueries({ queryKey: ["renewals", orgId] });
    },
  });
}
