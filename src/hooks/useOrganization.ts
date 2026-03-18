import { useQuery } from "@tanstack/react-query";
import { orgsApi, projectsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: () => orgsApi.list(),
  });
}

export function useProjects() {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => projectsApi.list(orgId!),
    enabled: !!orgId,
  });
}

export function useTeamMembers() {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ["team", orgId],
    queryFn: () => orgsApi.members(orgId!),
    enabled: !!orgId,
  });
}
