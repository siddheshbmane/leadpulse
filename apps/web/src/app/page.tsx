"use client";

import { useState } from "react";
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

const leads = [
  { id: 1, name: "Sarah Chen", company: "Nexus AI", signal: "Hiring Founder", status: "Hot", time: "2m ago" },
  { id: 2, name: "Mark Wilson", company: "CloudScale", signal: "Recent Expansion", status: "Warm", time: "15m ago" },
  { id: 3, name: "Elena Rodriguez", company: "BioFlow", signal: "Series B Funded", status: "Hot", time: "1h ago" },
  { id: 4, name: "David Kim", company: "DataPulse", signal: "New CTO Appointed", status: "Cool", time: "3h ago" },
];

const liveFeed = [
  { id: 1, text: "Founder at Nexus AI just posted about scaling their engineering team.", type: "LinkedIn" },
  { id: 2, text: "CloudScale announced a new regional office in Austin.", type: "News" },
  { id: 3, text: "BioFlow secured $40M in Series B funding led by Sequoia.", type: "Crunchbase" },
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");

  const handleNavClick = (label: string) => {
    setActiveNav(label);
    setSidebarOpen(false); // Close sidebar on mobile after clicking
    console.log(`Navigating to: ${label}`);
  };

  const handleExportLeads = () => {
    console.log("Exporting leads...");
    alert("Export functionality coming soon!");
  };

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
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeNav === "Dashboard"}
            onClick={() => handleNavClick("Dashboard")}
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Leads"
            active={activeNav === "Leads"}
            onClick={() => handleNavClick("Leads")}
          />
          <NavItem 
            icon={<Search size={20} />} 
            label="Search Filters"
            active={activeNav === "Search Filters"}
            onClick={() => handleNavClick("Search Filters")}
          />
          <NavItem 
            icon={<Activity size={20} />} 
            label="Intelligence"
            active={activeNav === "Intelligence"}
            onClick={() => handleNavClick("Intelligence")}
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Settings"
            active={activeNav === "Settings"}
            onClick={() => handleNavClick("Settings")}
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
      <main className="flex-1 overflow-y-auto flex flex-col w-full lg:w-auto">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 lg:px-8 bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 ml-12 lg:ml-0">
            <span className="text-xs lg:text-sm font-medium text-zinc-500 uppercase tracking-widest">Main Dashboard</span>
            <span className="text-zinc-700">/</span>
            <span className="text-xs lg:text-sm font-medium text-white uppercase tracking-widest">Overview</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-zinc-900 text-zinc-400 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#00ff9d] rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700"></div>
          </div>
        </header>

        <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
          {/* Welcome Section */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Command Center</h1>
              <p className="text-zinc-500 mt-1 text-sm lg:text-base">Real-time intent signals and lead tracking.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleExportLeads}
                className="px-4 py-2 rounded-lg bg-[#00ff9d] text-black font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Export Leads
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Leads Table */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-4 lg:p-6 border-b border-zinc-800 flex justify-between items-center">
                  <h3 className="text-base lg:text-lg font-semibold text-white">Active Leads</h3>
                  <span className="text-xs font-mono text-[#00ff9d] bg-[#00ff9d]/10 px-2 py-1 rounded">24 NEW TODAY</span>
                </div>
                
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-black/20 text-xs uppercase tracking-widest text-zinc-500 font-bold">
                        <th className="px-6 py-4">Lead</th>
                        <th className="px-6 py-4">Intent Signal</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Detected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-white font-medium group-hover:text-[#00ff9d] transition-colors">{lead.name}</span>
                              <span className="text-sm text-zinc-500">{lead.company}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-zinc-300">{lead.signal}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter",
                              lead.status === 'Hot' ? "bg-red-500/10 text-red-500" : 
                              lead.status === 'Warm' ? "bg-orange-500/10 text-orange-500" : 
                              "bg-blue-500/10 text-blue-500"
                            )}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500">
                            {lead.time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-zinc-800/50">
                  {leads.map((lead) => (
                    <div key={lead.id} className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-white font-medium">{lead.name}</div>
                          <div className="text-sm text-zinc-500">{lead.company}</div>
                        </div>
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter",
                          lead.status === 'Hot' ? "bg-red-500/10 text-red-500" : 
                          lead.status === 'Warm' ? "bg-orange-500/10 text-orange-500" : 
                          "bg-blue-500/10 text-blue-500"
                        )}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-300 mb-1">{lead.signal}</div>
                      <div className="text-xs text-zinc-500">{lead.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Feed */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col">
                <div className="p-4 lg:p-6 border-b border-zinc-800">
                  <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
                    <Activity size={18} className="text-[#00ff9d]" />
                    Live Feed
                  </h3>
                </div>
                <div className="p-4 lg:p-6 space-y-6 flex-1">
                  {liveFeed.map((item) => (
                    <div key={item.id} className="relative pl-6 border-l-2 border-zinc-800 pb-2">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 bg-zinc-900 border-2 border-zinc-700 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-pulse"></div>
                      </div>
                      <span className="text-[10px] font-bold text-[#00ff9d] uppercase tracking-widest">{item.type}</span>
                      <p className="text-sm text-zinc-300 mt-1 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-zinc-800 text-center">
                  <button 
                    onClick={() => console.log("View all activity")}
                    className="text-xs text-zinc-500 hover:text-white transition-colors"
                  >
                    View all activity
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ 
  icon, 
  label, 
  active = false,
  onClick
}: { 
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button 
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
    </button>
  );
}
