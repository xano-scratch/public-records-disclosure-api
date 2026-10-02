import {
  Bot,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Moon,
  ScrollText,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Role } from "@/lib/api";
import { roleLabel } from "@/lib/format";
import { useSession } from "@/lib/session";
import { getMode, toggleMode, watchMode } from "@/lib/theme";

type NavItem = { to: string; label: string; icon: typeof FileText; end?: boolean; roles?: Role[] };

export const NAV: NavItem[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/requests", label: "Requests", icon: FileText },
  { to: "/agent", label: "Agent console", icon: Bot },
  { to: "/audit", label: "Audit trail", icon: ScrollText, roles: ["clerk", "admin"] },
  { to: "/policy", label: "Policy", icon: ShieldCheck },
];

function ThemeToggle() {
  const [mode, setMode] = useState(getMode());
  useEffect(() => watchMode(setMode), []);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" onClick={toggleMode} aria-label="Toggle theme">
          {mode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Toggle light / dark</TooltipContent>
    </Tooltip>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

export function AppShell() {
  const { user, role, booting, signOut } = useSession();
  const location = useLocation();

  if (booting) {
    return (
      <div className="flex h-svh items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Landmark className="size-5 animate-pulse text-primary" />
          Loading…
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  const items = NAV.filter((n) => !n.roles || (role != null && n.roles.includes(role)));

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Landmark className="size-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold">Records Disclosure</div>
              <div className="truncate text-xs text-muted-foreground">Governed access</div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                        <Link to={item.to}>
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
            <Avatar className="size-7">
              <AvatarFallback className="text-xs">{initials(user.name ?? "User")}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 leading-tight">
              <div className="truncate font-medium">{user.name}</div>
              <div className="truncate text-xs text-muted-foreground">{role ? roleLabel(role) : ""}</div>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex h-svh min-w-0 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1" />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="size-6">
                  <AvatarFallback className="text-[0.625rem]">{initials(user.name ?? "User")}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm sm:inline">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col">
                <span>{user.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                <span className="mt-1 text-xs font-normal text-primary">{role ? roleLabel(role) : ""}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
