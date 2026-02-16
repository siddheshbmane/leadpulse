"use client";

import { cn } from "@/lib/utils";
import { Activity, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type Lead = {
  id: string;
  personName: string | null;
  companyName: string | null;
  source: string;
  status: string;
  discoveredAt: string;
};

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch("/api/leads");
        const data = await res.json();
        if (Array.isArray(data)) {
          setLeads(data);
        }
      } catch (err) {
        console.error("Error loading leads:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  const handleExportLeads = () => {
    console.log("Exporting leads...");
    alert("Export functionality coming soon!");
  };

  return (
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
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden min-h-[400px] flex flex-col">
            <div className="p-4 lg:p-6 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-base lg:text-lg font-semibold text-white">Active Leads</h3>
              <span className="text-xs font-mono text-[#00ff9d] bg-[#00ff9d]/10 px-2 py-1 rounded">
                {leads.length} TOTAL
              </span>
            </div>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#00ff9d] animate-spin" />
              </div>
            ) : leads.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-2">
                <p>No leads found in database.</p>
                <p className="text-xs font-mono text-zinc-600">Run a scraper to populate this list.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-black/20 text-xs uppercase tracking-widest text-zinc-500 font-bold">
                        <th className="px-6 py-4">Lead</th>
                        <th className="px-6 py-4">Source</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Detected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-white font-medium group-hover:text-[#00ff9d] transition-colors">
                                {lead.personName || "Unknown"}
                              </span>
                              <span className="text-sm text-zinc-500">{lead.companyName || "No Company"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-zinc-300 capitalize">{lead.source.replace('_', ' ')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter",
                              lead.status === 'WON' ? "bg-emerald-500/10 text-emerald-500" : 
                              lead.status === 'NEW' ? "bg-blue-500/10 text-blue-500" : 
                              "bg-zinc-500/10 text-zinc-400"
                            )}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500">
                            {new Date(lead.discoveredAt).toLocaleDateString()}
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
                          <div className="text-white font-medium">{lead.personName || "Unknown"}</div>
                          <div className="text-sm text-zinc-500">{lead.companyName}</div>
                        </div>
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter",
                          lead.status === 'WON' ? "bg-emerald-500/10 text-emerald-500" : 
                          lead.status === 'NEW' ? "bg-blue-500/10 text-blue-500" : 
                          "bg-zinc-500/10 text-zinc-400"
                        )}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-300 mb-1 capitalize">{lead.source}</div>
                      <div className="text-xs text-zinc-500">
                        {new Date(lead.discoveredAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Live Feed (Static for now) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col">
            <div className="p-4 lg:p-6 border-b border-zinc-800">
              <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
                <Activity size={18} className="text-[#00ff9d]" />
                Live Feed
              </h3>
            </div>
            <div className="p-4 lg:p-6 space-y-6 flex-1">
              <div className="relative pl-6 border-l-2 border-zinc-800 pb-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-zinc-900 border-2 border-zinc-700 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-pulse"></div>
                </div>
                <span className="text-[10px] font-bold text-[#00ff9d] uppercase tracking-widest">System</span>
                <p className="text-sm text-zinc-300 mt-1 leading-relaxed">
                  Scrapers are connected and waiting for search filters.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
