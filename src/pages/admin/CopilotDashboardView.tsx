import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Sparkles, AlertTriangle, Target, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { API_BASE } from '../../config/api';

export const CopilotDashboardView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("kottravai_admin_token") || "";
      const res = await axios.get(`${API_BASE}/api/admin/copilot/dashboard`, {
        headers: { "x-admin-secret": token }
      });
      if (res.data.success) {
        setData(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch Copilot data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeAll = async () => {
    if (!window.confirm("Trigger batch AI analysis for active leads? This may take a moment.")) return;
    try {
      setAnalyzing(true);
      const token = sessionStorage.getItem("kottravai_admin_token") || "";
      await axios.post(`${API_BASE}/api/admin/copilot/analyze-all`, {}, {
        headers: { "x-admin-secret": token }
      });
      fetchData();
    } catch (e) {
      console.error('Batch analysis failed', e);
      alert('Batch analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading AI Insights...</div>;
  }

  if (!data) return <div className="p-8 text-center text-red-500">Failed to load Copilot data.</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* AI Summary Header */}
      <div className="glass-card p-8 rounded-3xl bg-gradient-to-br from-[#8E2A8B]/10 to-transparent border border-[#8E2A8B]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles size={120} className="text-[#8E2A8B]" />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
             <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-[#8E2A8B] text-white rounded-xl">
                 <Sparkles size={24} />
               </div>
               <h2 className="text-2xl font-black text-[#2D1B4E]">What should I do today?</h2>
             </div>
             <button 
               onClick={handleAnalyzeAll} 
               disabled={analyzing}
               className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
             >
               <RefreshCw size={16} className={analyzing ? "animate-spin" : ""} />
               {analyzing ? "Analyzing..." : "Analyze All Leads"}
             </button>
          </div>
          <p className="text-xl font-medium text-gray-700 leading-relaxed max-w-4xl">
            {data.dailySummary || "Review your At-Risk leads to prevent churn, and prioritize follow-ups on high-probability deals."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Action Queue */}
        <div className="glass-card p-6 rounded-3xl flex flex-col">
           <div className="flex items-center gap-3 mb-6">
             <Target className="text-emerald-500" size={24} />
             <h3 className="text-lg font-black text-[#2D1B4E]">AI Recommended Actions</h3>
           </div>
           <div className="space-y-3 flex-1">
             {data.actionQueue?.length > 0 ? data.actionQueue.map((item: any, i: number) => (
               <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                 <span className="font-bold text-gray-700">{item.next_action}</span>
                 <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-black text-sm">{item.count} leads</span>
               </div>
             )) : (
               <div className="text-gray-400 text-sm text-center py-4">No actions queued.</div>
             )}
           </div>
        </div>

        {/* Top 10 Leads / Highest Probability */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl">
           <div className="flex items-center gap-3 mb-6">
             <TrendingUp className="text-blue-500" size={24} />
             <h3 className="text-lg font-black text-[#2D1B4E]">Highest Conversion Probability (Top 10)</h3>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                   <th className="pb-3 font-bold">Lead</th>
                   <th className="pb-3 font-bold">Probability</th>
                   <th className="pb-3 font-bold">Next Action</th>
                   <th className="pb-3 font-bold">AI Rationale</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {data.topLeads?.length > 0 ? data.topLeads.map((lead: any, i: number) => (
                   <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                     <td className="py-4">
                       <div className="font-bold text-gray-800">{lead.name}</div>
                       <div className="text-xs text-gray-500">{lead.company}</div>
                     </td>
                     <td className="py-4">
                       <div className="flex items-center gap-2">
                         <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-500 rounded-full" style={{ width: `${lead.conversion_probability}%` }} />
                         </div>
                         <span className="text-sm font-bold text-blue-700">{lead.conversion_probability}%</span>
                       </div>
                     </td>
                     <td className="py-4">
                       <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">{lead.next_action}</span>
                     </td>
                     <td className="py-4 text-xs text-gray-500 max-w-xs truncate" title={lead.copilot_rationale}>
                       {lead.copilot_rationale || "Ready to close."}
                     </td>
                   </tr>
                 )) : (
                   <tr><td colSpan={4} className="py-8 text-center text-gray-400 text-sm">No high probability leads identified.</td></tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

      </div>

      {/* Leads At Risk */}
      <div className="glass-card p-6 rounded-3xl">
         <div className="flex items-center gap-3 mb-6">
           <AlertTriangle className="text-red-500" size={24} />
           <h3 className="text-lg font-black text-[#2D1B4E]">Leads At Risk</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {data.riskLeads?.length > 0 ? data.riskLeads.map((lead: any, i: number) => (
             <div key={i} className="p-5 border border-red-100 bg-red-50/30 rounded-2xl flex flex-col gap-3 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-1 h-full bg-red-400" />
               <div className="flex justify-between items-start">
                 <div>
                   <h4 className="font-bold text-gray-800">{lead.name}</h4>
                   <span className="text-xs text-gray-500">{lead.company}</span>
                 </div>
                 <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-md">
                   <AlertCircle size={12} /> {lead.risk_status}
                 </div>
               </div>
               <p className="text-sm text-gray-600 flex-1 line-clamp-3">
                 {lead.copilot_rationale || "Requires immediate re-engagement."}
               </p>
               <div className="mt-2 pt-3 border-t border-red-100/50 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500">Suggested: {lead.next_action}</span>
                  <button className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors">Review Lead</button>
               </div>
             </div>
           )) : (
             <div className="col-span-full py-8 text-center text-gray-400 text-sm">No leads currently at risk.</div>
           )}
         </div>
      </div>

    </div>
  );
};
