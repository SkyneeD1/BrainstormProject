import { Link, useLocation } from "wouter";
import { BarChart3, Database, FileSpreadsheet, ChevronDown, Building2, Scale } from "lucide-react";
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
    title: "Brainstorm",
    icon: BarChart3,
    subItems: [
      {
        title: "Passivo Sob Gestão (Base Dez/24)",
        url: "/",
        icon: Scale,
      },
    ],
  },
];

const adminItems = [
  {
    title: "Dados",
    url: "/admin/dados",
    icon: Database,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-6 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight leading-tight">
            CONTENCIOSO
          </h1>
          <p className="text-xs text-sidebar-foreground/70 font-medium tracking-wide uppercase">
            Ecossistema de Gestão
          </p>
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

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs font-medium uppercase tracking-wider px-3 mb-2">
            Administração
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`${
                      location === item.url
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <Link href={item.url} data-testid={`link-admin-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto">
        <div className="flex items-center gap-2 px-2">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-xs text-sidebar-foreground/60 font-medium">V.tal</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
