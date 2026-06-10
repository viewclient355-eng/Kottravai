import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, Users, CheckCircle, Target, Zap } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '@/config/api';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  lead_type?: string;
  priority?: string;
  lead_score?: number;
  source?: string;
  status?: string;
  created_at?: string;
  company_name?: string;
  ai_summary?: string;
}

interface LeadKPIs {
  total: number;
  new: number;
  qualified: number;
  converted: number;
  highPriority: number;
}

const LeadsView: React.FC<{ leadsData: Lead[] }> = ({ leadsData }) => {
  const [kpis, setKpis] = useState<LeadKPIs>({
    total: 0,
    new: 0,
    qualified: 0,
    converted: 0,
    highPriority: 0,
  });
  const [isExporting, setIsExporting] = useState(false);

  // Calculate KPIs from leads data
  useEffect(() => {
    console.log('📊 [LeadsView] Received leadsData prop:', leadsData);
    console.log('📊 [LeadsView] leadsData length:', leadsData?.length || 0);
    console.log('📊 [LeadsView] leadsData type:', typeof leadsData);
    console.log('📊 [LeadsView] Is array?:', Array.isArray(leadsData));
    console.log('📊 [LeadsView] First lead:', leadsData?.[0] || 'NONE');
    
    if (leadsData && leadsData.length > 0) {
      const calculated = {
        total: leadsData.length,
        new: leadsData.filter((l) => l.status === 'new').length,
        qualified: leadsData.filter(
          (l) => l.status === 'qualified' || (l.lead_score || 0) >= 70
        ).length,
        converted: leadsData.filter((l) => l.status === 'converted').length,
        highPriority: leadsData.filter((l) => l.priority === 'high').length,
      };
      console.log('📊 [LeadsView] Calculated KPIs:', calculated);
      setKpis(calculated);
    } else {
      console.warn('⚠️ [LeadsView] No data provided to LeadsView');
    }
  }, [leadsData]);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      console.log('📥 [LeadsView] Export CSV initiated');
      
      const storedToken = sessionStorage.getItem('kottravai_admin_token');
      const adminSecret = storedToken || '';
      
      console.log('📥 [LeadsView] Token from sessionStorage:', storedToken ? `"${storedToken.substring(0, 30)}..."` : 'NOT FOUND');
      console.log('📥 [LeadsView] Token being sent:', `"${adminSecret.substring(0, 30)}..."`);
      console.log('📥 [LeadsView] Full token:', `"${adminSecret}"`);
      
      const headers = { 'x-admin-secret': adminSecret };
      console.log('📥 [LeadsView] Request headers:', headers);
      console.log('📥 [LeadsView] API endpoint:', `${API_BASE}/api/leads/export`);
      
      const resp = await axios.get(`${API_BASE}/api/leads/export`, {
        headers,
        responseType: 'blob',
      });
      
      console.log('✅ [LeadsView] Export response received');
      console.log('✅ [LeadsView] Response status:', resp.status);
      console.log('✅ [LeadsView] Response headers:', resp.headers);
      console.log('✅ [LeadsView] Content-Type:', resp.headers['content-type']);
      console.log('✅ [LeadsView] Content-Disposition:', resp.headers['content-disposition']);
      console.log('✅ [LeadsView] Blob size (bytes):', resp.data.size);
      
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'leads.csv');
      document.body.appendChild(link);
      
      console.log('📥 [LeadsView] Triggering download...');
      link.click();
      link.parentNode?.removeChild(link);
      
      console.log('✅ [LeadsView] Export completed successfully');
    } catch (e: any) {
      console.error('❌ Export failed:', e);
      console.error('❌ Error status:', e.response?.status);
      console.error('❌ Error data:', e.response?.data);
      console.error('❌ Error headers:', e.response?.headers);
      console.error('❌ Error message:', e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const getPriorityBadgeColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-rose-100 text-rose-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      case 'low':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-700';
      case 'qualified':
        return 'bg-emerald-100 text-emerald-700';
      case 'converted':
        return 'bg-purple-100 text-purple-700';
      case 'disqualified':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const KPICard = ({
    icon: Icon,
    label,
    value,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
  }) => (
    <div className="glass-card p-6 rounded-2xl border border-white/20 hover:border-white/40 transition-all group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">
            {label}
          </p>
          <h3 className={`text-3xl font-black mt-2 ${color}`}>{value}</h3>
        </div>
        <div
          className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${color} opacity-20 group-hover:opacity-30`}
        >
          {Icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          icon={<Users size={24} />}
          label="Total Leads"
          value={kpis.total}
          color="text-blue-600"
        />
        <KPICard
          icon={<Zap size={24} />}
          label="New Leads"
          value={kpis.new}
          color="text-amber-600"
        />
        <KPICard
          icon={<Target size={24} />}
          label="Qualified"
          value={kpis.qualified}
          color="text-purple-600"
        />
        <KPICard
          icon={<CheckCircle size={24} />}
          label="Converted"
          value={kpis.converted}
          color="text-emerald-600"
        />
        <KPICard
          icon={<TrendingUp size={24} />}
          label="High Priority"
          value={kpis.highPriority}
          color="text-rose-600"
        />
      </div>

      {/* Leads Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#2D1B4E]">Leads Database</h2>
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-2 bg-[#8E2A8B] text-white px-6 py-2 rounded-2xl font-bold hover:bg-[#6d1e6a] transition-all disabled:opacity-50"
          >
            <Download size={18} />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Lead Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Source
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody>
                {leadsData && leadsData.length > 0 ? (
                  leadsData.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-[#2D1B4E]">
                        {lead.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 break-all">
                        {lead.email || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {lead.phone || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          {lead.lead_type || 'general'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityBadgeColor(lead.priority)}`}
                        >
                          {lead.priority || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[#8E2A8B]">
                        {lead.lead_score || 0}/100
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold">
                          {lead.source || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeColor(lead.status)}`}
                        >
                          {lead.status || 'new'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {lead.created_at
                          ? new Date(lead.created_at).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <Users size={40} className="text-gray-300 mb-4" />
                        <p className="text-sm font-medium">No leads found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table Info */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <p>
            Showing{' '}
            <span className="font-bold text-[#2D1B4E]">{leadsData?.length || 0}</span>{' '}
            leads total
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeadsView;
