"use client";

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Search, 
  Settings, 
  Zap, 
  LogOut,
  Bell,
  Activity,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const handleSignOut = () => {
    console.log("Signing out...");
    alert("Sign out functionality coming soon!");
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-zinc-400 font-sans overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-zinc-900 text-white lg:hidden hover:bg-zinc-800 transition-colors"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 border-r border-zinc-800 flex flex-col bg-[#0a0a0a] transition-transform duration-300 ease-in-out z-40",
          "fixed lg:static h-full",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="w-8 h-8 bg-[#00ff9d] rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-black" fill="currentColor" />
          </div>
          <span className="font-bold text-xl tracking-tight">LEADPULSE</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem 
            href="/"
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={pathname === "/"}
            onClick={() => setSidebarOpen(false)}
          />
          <NavItem 
            href="/leads"
            icon={<Users size={20} />} 
            label="Leads"
            active={pathname === "/leads"}
            onClick={() => setSidebarOpen(false)}
          />
          <NavItem 
            href="/search-filters"
            icon={<Search size={20} />} 
            label="Search Filters"
            active={pathname === "/search-filters"}
            onClick={() => setSidebarOpen(false)}
          />
          <NavItem 
            href="/intelligence"
            icon={<Activity size={20} />} 
            label="Intelligence"
            active={pathname === "/intelligence"}
            onClick={() => setSidebarOpen(false)}
          />
          <NavItem 
            href="/settings"
            icon={<Settings size={20} />} 
            label="Settings"
            active={pathname === "/settings"}
            onClick={() => setSidebarOpen(false)}
          />
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-zinc-900 transition-colors text-zinc-500"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto flex flex-col w-full lg:w-auto">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 lg:px-8 bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 ml-12 lg:ml-0">
            <span className="text-xs lg:text-sm font-medium text-zinc-500 uppercase tracking-widest">Main Dashboard</span>
            <span className="text-zinc-700">/</span>
            <span className="text-xs lg:text-sm font-medium text-white uppercase tracking-widest">
              {pathname === "/" ? "Overview" : pathname.substring(1).charAt(0).toUpperCase() + pathname.substring(2)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-zinc-900 text-zinc-400 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#00ff9d] rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700"></div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ 
  href,
  icon, 
  label, 
  active = false,
  onClick
}: { 
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 group",
        active 
          ? "bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/20" 
          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
      )}
    >
      <span className={cn(active ? "text-[#00ff9d]" : "group-hover:text-zinc-300")}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
