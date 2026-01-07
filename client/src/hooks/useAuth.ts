import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";

interface Tenant {
  id: string;
  code: string;
  name: string;
  primaryColor: string;
  backgroundColor: string;
}

interface User {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  modulePermissions: string[];
  tenant?: Tenant;
  availableTenants?: Tenant[];
}

interface LoginResponse {
  id?: string;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string;
  modulePermissions?: string[];
  tenant?: Tenant;
  availableTenants?: Tenant[];
  requiresTenantSelection?: boolean;
  userId?: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string; tenantCode?: string }): Promise<LoginResponse> => {
      const response = await apiRequest("POST", "/api/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      if (!data.requiresTenantSelection) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
    },
  });

  const selectTenantMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const response = await apiRequest("POST", "/api/auth/select-tenant", { tenantId });
      return response.json();
    },
    onSuccess: async (data) => {
      // Update the user query cache with the new data directly
      queryClient.setQueryData(["/api/auth/user"], data);
      // Then invalidate all other queries to refetch with new tenant context
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] !== "/api/auth/user" 
      });
    },
  });

  const switchTenantMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const response = await apiRequest("POST", "/api/auth/switch-tenant", { tenantId });
      return response.json();
    },
    onSuccess: async (data) => {
      // Update the user query cache with the new data directly
      queryClient.setQueryData(["/api/auth/user"], data);
      // Then invalidate all other queries to refetch with new tenant context
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] !== "/api/auth/user" 
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.clear();
    },
  });

  return {
    user,
    tenant: user?.tenant,
    availableTenants: user?.availableTenants || [],
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    hasMultipleTenants: (user?.availableTenants?.length || 0) > 1,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    selectTenant: selectTenantMutation.mutate,
    selectTenantAsync: selectTenantMutation.mutateAsync,
    isSelectingTenant: selectTenantMutation.isPending,
    switchTenant: switchTenantMutation.mutate,
    switchTenantAsync: switchTenantMutation.mutateAsync,
    isSwitchingTenant: switchTenantMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}

export type { Tenant, User, LoginResponse };
