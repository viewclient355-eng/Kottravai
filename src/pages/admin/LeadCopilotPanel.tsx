import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, Mail, MessageCircle, Phone, RefreshCw, FileText } from 'lucide-react';
import { API_BASE } from '../../config/api';

export const LeadCopilotPanel: React.FC<{ lead: any, onUpdate: () => void }> = ({ lead, onUpdate }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [drafting, setDrafting] = useState<string | null>(null);
  const [draftResult, setDraftResult] = useState<any>(null);
  const [executing, setExecuting] = useState<string | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [callOutcome, setCallOutcome] = useState('Interested');

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      const token = sessionStorage.getItem("kottravai_admin_token") || "";
      await axios.post(`${API_BASE}/api/admin/copilot/leads/${lead.id}/analyze`, {}, {
        headers: { "x-admin-secret": token }
      });
      onUpdate();
    } catch (e) {
      console.error('Analysis failed', e);
      alert('Failed to analyze lead.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDraft = async (channel: string) => {
    try {
      setDrafting(channel);
      const token = sessionStorage.getItem("kottravai_admin_token") || "";
      const res = await axios.post(`${API_BASE}/api/admin/copilot/leads/${lead.id}/draft`, { channel }, {
        headers: { "x-admin-secret": token }
      });
      setDraftResult({ channel, data: res.data.draft });
    } catch (e) {
      console.error('Draft generation failed', e);
      alert('Failed to generate draft.');
    } finally {
      setDrafting(null);
    }
  };

  const handleSendEmail = async () => {
    if (!draftResult || draftResult.channel !== 'email') return;
    try {
      setExecuting('email');
      const token = sessionStorage.getItem("kottravai_admin_token") || "";
      await axios.post(`${API_BASE}/api/admin/copilot/leads/${lead.id}/send-email`, {
        subject: draftResult.data.subject,
        body: draftResult.data.body
      }, { headers: { "x-admin-secret": token } });
      alert('Email sent successfully!');
      setDraftResult(null);
      onUpdate();
    } catch (e) {
      console.error(e);
      alert('Failed to send email');
    } finally {
      setExecuting(null);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!draftResult || draftResult.channel !== 'whatsapp') return;
    try {
      setExecuting('whatsapp');
      const token = sessionStorage.getItem("kottravai_admin_token") || "";
      await axios.post(`${API_BASE}/api/admin/copilot/leads/${lead.id}/send-whatsapp`, {
        message: draftResult.data.message
      }, { headers: { "x-admin-secret": token } });
      alert('WhatsApp sent successfully!');
      setDraftResult(null);
      onUpdate();
    } catch (e: any) {
      console.error(e);
      if (e.response?.data?.requireFallback) {
        const encodedMsg = encodeURIComponent(draftResult.data.message);
        const phone = e.response.data.phone || lead.phone;
        const confirmFallback = window.confirm('Direct WhatsApp API delivery unavailable (outside 24h window). Open WhatsApp to send manually?');
        if (confirmFallback) {
          window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
        }
      } else {
        alert('Failed to send WhatsApp');
      }
    } finally {
      setExecuting(null);
    }
  };

  const handleInitiateCall = async () => {
    try {
      setExecuting('call');
      const token = sessionStorage.getItem("kottravai_admin_token") || "";
      await axios.post(`${API_BASE}/api/admin/copilot/leads/${lead.id}/log-call`, {
        status: 'initiated'
      }, { headers: { "x-admin-secret": token } });
      window.open(`tel:${lead.phone}`, '_self');
      setShowCallModal(true);
      onUpdate();
    } catch (e) {
      console.error(e);
      alert('Failed to initiate call');
    } finally {
      setExecuting(null);
    }
  };

  const handleCompleteCall = async () => {
    try {
      setExecuting('call-complete');
      const token = sessionStorage.getItem("kottravai_admin_token") || "";
      await axios.post(`${API_BASE}/api/admin/copilot/leads/${lead.id}/log-call`, {
        status: 'completed',
        outcome: callOutcome,
        notes: callNotes
      }, { headers: { "x-admin-secret": token } });
      setShowCallModal(false);
      setCallNotes('');
      onUpdate();
    } catch (e) {
      console.error(e);
      alert('Failed to log call outcome');
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="mt-6 glass-card p-6 rounded-3xl border border-[#8E2A8B]/20 bg-gradient-to-br from-white to-[#8E2A8B]/5">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black text-[#2D1B4E] flex items-center gap-2">
          <Sparkles size={20} className="text-[#8E2A8B]" />
          Sales Copilot
        </h3>
        <button 
          onClick={handleAnalyze} 
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-[#8E2A8B]/20 text-sm font-bold text-[#8E2A8B] hover:bg-[#8E2A8B]/5 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={analyzing ? "animate-spin" : ""} />
          {analyzing ? "Analyzing..." : "Analyze Lead"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Conversion Probability</p>
          <div className="flex items-end gap-3 mb-2">
            <span className="text-3xl font-black text-blue-600">{lead.conversion_probability ?? '--'}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${lead.conversion_probability || 0}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Risk Status</p>
          <p className={`text-lg font-bold ${
            lead.risk_status === 'Healthy' ? 'text-emerald-600' :
            lead.risk_status === 'Needs Immediate Attention' ? 'text-red-600' :
            'text-orange-500'
          }`}>
            {lead.risk_status || "Not Analyzed"}
          </p>
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
            {lead.copilot_rationale || "Click Analyze Lead to generate AI insights."}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200/50 pt-6">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">AI Communication Assistant</p>
        <div className="flex gap-3 mb-4">
          <button 
            onClick={() => handleDraft('email')}
            disabled={!!drafting}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-[#8E2A8B]/40 hover:bg-[#8E2A8B]/5 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 transition-colors disabled:opacity-50"
          >
            {drafting === 'email' ? <RefreshCw size={16} className="animate-spin"/> : <Mail size={16} />}
            Draft Email
          </button>
          <button 
            onClick={() => handleDraft('whatsapp')}
            disabled={!!drafting}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 transition-colors disabled:opacity-50"
          >
            {drafting === 'whatsapp' ? <RefreshCw size={16} className="animate-spin"/> : <MessageCircle size={16} className="text-emerald-500" />}
            Draft WhatsApp
          </button>
          <button 
            onClick={() => handleDraft('call')}
            disabled={!!drafting}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 transition-colors disabled:opacity-50"
          >
            {drafting === 'call' ? <RefreshCw size={16} className="animate-spin"/> : <Phone size={16} className="text-blue-500" />}
            Call Script
          </button>
        </div>

        {draftResult && (
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#8E2A8B] uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} /> Generated {draftResult.channel}
              </span>
              <button onClick={() => setDraftResult(null)} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
            </div>
            
            {draftResult.channel === 'email' && (
              <div className="space-y-4">
                <div className="text-sm border-b border-gray-100 pb-2"><span className="font-bold text-gray-500">Subject:</span> {draftResult.data?.subject}</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{draftResult.data?.body}</div>
                <button 
                  onClick={handleSendEmail} 
                  disabled={executing === 'email'}
                  className="w-full mt-4 py-2 bg-[#8E2A8B] text-white rounded-lg font-bold hover:bg-[#722170] transition-colors disabled:opacity-50"
                >
                  {executing === 'email' ? 'Sending...' : 'Send Email Now'}
                </button>
              </div>
            )}
            
            {draftResult.channel === 'whatsapp' && (
              <div className="space-y-4">
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {draftResult.data?.message}
                </div>
                <button 
                  onClick={handleSendWhatsApp} 
                  disabled={executing === 'whatsapp'}
                  className="w-full mt-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {executing === 'whatsapp' ? 'Sending...' : 'Send WhatsApp Now'}
                </button>
              </div>
            )}
            
            {draftResult.channel === 'call' && (
              <div className="space-y-4">
                <div>
                  <h5 className="text-xs font-bold text-gray-500 mb-1">Opening</h5>
                  <p className="text-sm text-gray-700 italic">"{draftResult.data?.opening}"</p>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-500 mb-1">Key Questions</h5>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {draftResult.data?.questions?.map((q: string, i: number) => <li key={i}>{q}</li>)}
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-500 mb-1">Closing</h5>
                  <p className="text-sm text-gray-700 italic">"{draftResult.data?.closing}"</p>
                </div>
                <button 
                  onClick={handleInitiateCall} 
                  disabled={executing === 'call'}
                  className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Phone size={16} /> {executing === 'call' ? 'Initiating...' : 'Call Lead Now'}
                </button>
              </div>
            )}
          </div>
        )}

        {showCallModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Phone size={18} className="text-blue-500" /> Log Call Outcome
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Outcome</label>
                  <select 
                    value={callOutcome} 
                    onChange={e => setCallOutcome(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                  >
                    <option value="Interested">Interested</option>
                    <option value="Follow-up Required">Follow-up Required</option>
                    <option value="Proposal Requested">Proposal Requested</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Wrong Contact">Wrong Contact</option>
                    <option value="No Answer">No Answer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                  <textarea 
                    value={callNotes}
                    onChange={e => setCallNotes(e.target.value)}
                    rows={4}
                    placeholder="What was discussed?"
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setShowCallModal(false)}
                    className="flex-1 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCompleteCall}
                    disabled={executing === 'call-complete'}
                    className="flex-1 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    {executing === 'call-complete' ? 'Saving...' : 'Save Log'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
