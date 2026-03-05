"use client";

import React, { useState } from "react";
import { Zap, LogOut, Bell, Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const currentPage = navigationItems.find((item) =>
    pathname.startsWith(item.href)
  );

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-secondary text-foreground lg:hidden hover:bg-secondary/80 transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "w-60 border-r border-border flex flex-col bg-background transition-transform duration-300 ease-in-out z-40",
            "fixed lg:static h-full",
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* Logo */}
          <div className="h-14 px-5 flex items-center gap-2.5 border-b border-border">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base tracking-tight text-foreground">
              LeadPulse
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-0.5">
            {navigationItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3 py-2 rounded-md transition-colors text-sm",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-md">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  Admin
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Internal
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto flex flex-col w-full lg:w-auto">
          {/* Header */}
          <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-1.5 ml-10 lg:ml-0 text-sm">
              <span className="text-muted-foreground">LeadPulse</span>
              <ChevronRight size={14} className="text-muted-foreground/50" />
              <span className="text-foreground font-medium">
                {currentPage?.label ?? "Overview"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8"
                  >
                    <Bell size={16} />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
              <div className="w-7 h-7 rounded-full bg-secondary border border-border" />
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
