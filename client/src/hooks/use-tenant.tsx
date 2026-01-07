import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useAuth, type Tenant } from "./useAuth";

interface TenantContextType {
  tenant: Tenant | undefined;
  primaryColor: string;
  backgroundColor: string;
  tenantCode: string;
  tenantName: string;
  logoUrl: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: undefined,
  primaryColor: "#ffd700",
  backgroundColor: "#0a1628",
  tenantCode: "vtal",
  tenantName: "V.tal",
  logoUrl: null,
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const { tenant } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    
    if (tenant) {
      root.style.setProperty("--tenant-primary", tenant.primaryColor);
      root.style.setProperty("--tenant-background", tenant.backgroundColor);
      
      if (tenant.code === "nio") {
        root.style.setProperty("--primary", "120 100% 43%");
        root.style.setProperty("--sidebar-primary", "120 100% 43%");
        root.style.setProperty("--chart-1", "120 100% 43%");
      } else {
        root.style.setProperty("--primary", "51 100% 50%");
        root.style.setProperty("--sidebar-primary", "51 100% 50%");
        root.style.setProperty("--chart-1", "51 100% 50%");
      }
    } else {
      root.style.removeProperty("--tenant-primary");
      root.style.removeProperty("--tenant-background");
      root.style.setProperty("--primary", "51 100% 50%");
      root.style.setProperty("--sidebar-primary", "51 100% 50%");
      root.style.setProperty("--chart-1", "51 100% 50%");
    }
  }, [tenant]);

  const value: TenantContextType = {
    tenant,
    primaryColor: tenant?.primaryColor || "#ffd700",
    backgroundColor: tenant?.backgroundColor || "#0a1628",
    tenantCode: tenant?.code || "vtal",
    tenantName: tenant?.name || "V.tal",
    logoUrl: tenant?.logoUrl || null,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
