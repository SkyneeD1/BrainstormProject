import { Link, useLocation } from "wouter";
import { BarChart3, Database, ChevronDown, Building2, Scale, Users, LogOut, Shield, Eye, Loader2, Map, Gavel, User, TrendingUp, Calendar, Lightbulb, FileSpreadsheet, Table2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const menuItems = [
  {
    title: "Passivo Sob Gestão",
    icon: Scale,
    subItems: [
      {
        title: "Dashboard",
        url: "/",
        icon: BarChart3,
      },
      {
        title: "Comparação de Períodos",
        url: "/passivo/comparacao",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Mapas Estratégicos",
    icon: Map,
    subItems: [
      {
        title: "2ª Instância",
        url: "/mapas/segunda-instancia",
        icon: Gavel,
      },
      {
        title: "1ª Instância",
        url: "/mapas/primeira-instancia",
        icon: Gavel,
      },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAdmin, logout, isLoggingOut } = useAuth();

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.username) {
      return user.username[0].toUpperCase();
    }
    return "U";
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.username || "Usuário";
  };

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-6 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight leading-tight">
            CONTENCIOSO
          </h1>
          <p className="text-xs text-sidebar-foreground/70 font-medium tracking-wide uppercase">Gerenciamento V.TAL</p>
        </div>
        <div className="mt-4 h-1 w-12 bg-primary rounded-full" />
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs font-medium uppercase tracking-wider px-3 mb-2">
            Módulos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <Collapsible key={item.title} defaultOpen className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full justify-between text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent">
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="ml-4 mt-1 border-l-2 border-sidebar-accent pl-3">
                        {item.subItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className={`py-2 ${
                                location === subItem.url
                                  ? "bg-primary/10 text-primary border-l-2 border-primary -ml-[14px] pl-[12px]"
                                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                              }`}
                            >
                              <Link href={subItem.url} data-testid={`link-${subItem.url.replace(/\//g, '-')}`}>
                                <subItem.icon className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium leading-tight">{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs font-medium uppercase tracking-wider px-3 mb-2">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={`${
                      location === "/admin/dados" || location.startsWith("/admin/dados")
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <Link href="/admin/dados" data-testid="link-admin-dados">
                      <Database className="h-4 w-4" />
                      <span className="font-medium">Dados</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={`${
                      location === "/admin/mapas"
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <Link href="/admin/mapas" data-testid="link-admin-mapas">
                      <Map className="h-4 w-4" />
                      <span className="font-medium">Dados Mapas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={`${
                      location === "/admin/usuarios"
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <Link href="/admin/usuarios" data-testid="link-admin-usuarios">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">Usuários</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 mt-auto border-t border-sidebar-accent">
        {user && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {getUserName()}
                </p>
                <div className="flex items-center gap-1">
                  {isAdmin ? (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                      <Shield className="w-2.5 h-2.5 mr-0.5" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      <Eye className="w-2.5 h-2.5 mr-0.5" />
                      Viewer
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
              onClick={() => logout()}
              disabled={isLoggingOut}
              data-testid="button-logout"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Sair
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2 px-2 pt-3 border-t border-sidebar-accent mt-3">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-xs text-sidebar-foreground/60 font-medium">V.tal</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
