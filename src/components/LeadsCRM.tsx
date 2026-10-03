import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Flame,
  Zap,
  Lock,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Briefcase,
  Phone,
  Mail,
  ChevronRight
} from 'lucide-react';
import { LeadProfile, LeadStage, LeadTier } from '../types';

interface LeadsCRMProps {
  leads: LeadProfile[];
  onSelectLead: (leadId: string) => void;
  onUpdateLeadStage: (leadId: string, newStage: LeadStage) => void;
}

export const LeadsCRM: React.FC<LeadsCRMProps> = ({
  leads,
  onSelectLead,
  onUpdateLeadStage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'All' | LeadTier>('All');
  const [selectedLeadModal, setSelectedLeadModal] = useState<LeadProfile | null>(null);

  const stages: { id: LeadStage; label: string; color: string }[] = [
    { id: 'New', label: 'New Inquiries', color: 'border-blue-500/40' },
    { id: 'Contacted', label: 'In Qualification', color: 'border-purple-500/40' },
    { id: 'Qualified', label: 'Sales Qualified (SQL)', color: 'border-amber-500/40' },
    { id: 'Proposal', label: 'Proposal Sent', color: 'border-indigo-500/40' },
    { id: 'Won', label: 'Closed Won', color: 'border-emerald-500/40' },
  ];

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      lead.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTier = tierFilter === 'All' || lead.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const hotCount = leads.filter((l) => l.tier === 'Hot').length;
  const avgScore = Math.round(leads.reduce((acc, l) => acc + l.score, 0) / (leads.length || 1));
  const qualifiedCount = leads.filter((l) => ['Qualified', 'Proposal', 'Won'].includes(l.stage)).length;

  return (
    <div className="space-y-5">
      {/* Top Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Inbound Leads</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">{leads.length}</div>
          <span className="text-[10px] text-blue-400 font-medium">From Facebook Messenger</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Hot Buyer Pipeline</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-400">{hotCount} Prospects</div>
          <span className="text-[10px] text-rose-400/80 font-medium">Score &gt; 70</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Average AI Score</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300">{avgScore}/100</div>
          <span className="text-[10px] text-slate-400">NLP Confidence</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Qualification Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            {Math.round((qualifiedCount / (leads.length || 1)) * 100)}%
          </div>
          <span className="text-[10px] text-emerald-400/80 font-medium">BANT Verified</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search leads by name, company, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Tier filter pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto">
          {(['All', 'Hot', 'Warm', 'Cold'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                tierFilter === tier
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tier === 'Hot' ? '🔥 Hot' : tier === 'Warm' ? '⚡ Warm' : tier === 'Cold' ? '❄️ Cold' : 'All Leads'}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Pipeline Stages (Kanban Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-start overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageLeads = filteredLeads.filter((l) => l.stage === stage.id);

          return (
            <div
              key={stage.id}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3 min-w-[240px] flex flex-col gap-2.5 shadow-lg"
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200">{stage.label}</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full">
                  {stageLeads.length}
                </span>
              </div>

              {/* Lead Cards List */}
              <div className="space-y-2.5 min-h-[140px]">
                {stageLeads.length === 0 ? (
                  <div className="text-center py-6 text-slate-600 text-xs italic">
                    No leads in this stage
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLeadModal(lead)}
                      className="bg-slate-950 hover:bg-slate-800/80 border border-slate-800/90 hover:border-slate-700 p-3 rounded-2xl cursor-pointer transition-all duration-200 shadow-md group space-y-2"
                    >
                      {/* Lead Avatar & Name */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={lead.avatar}
                            alt={lead.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition truncate">
                              {lead.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate">
                              {lead.company || 'Direct Messenger'}
                            </p>
                          </div>
                        </div>

                        {/* Tier & Score */}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            lead.tier === 'Hot'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : lead.tier === 'Warm'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {lead.score}
                        </span>
                      </div>

                      {/* Budget & Timeline Snippet */}
                      <div className="text-[11px] text-slate-300 space-y-0.5">
                        <div className="flex items-center gap-1 text-slate-400">
                          <DollarSign className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{lead.budget}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 italic">
                          "{lead.painPoint}"
                        </p>
                      </div>

                      {/* Tags & E2EE indicator */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px]">
                        <div className="flex items-center gap-1 flex-wrap">
                          {lead.tags.slice(0, 2).map((t, idx) => (
                            <span key={idx} className="bg-slate-900 px-1.5 py-0.2 rounded text-slate-400">
                              {t}
                            </span>
                          ))}
                        </div>

                        {lead.e2eeEnabled && (
                          <span title="E2EE Encrypted" className="text-emerald-400">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Lead Modal */}
      {selectedLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedLeadModal.avatar}
                  alt={selectedLeadModal.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500"
                />
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {selectedLeadModal.name}
                    {selectedLeadModal.e2eeEnabled && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" /> E2EE Verified
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedLeadModal.company || 'Facebook Messenger Prospect'}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLeadModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* BANT Entity details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Lead Score & Tier</span>
                <p className="text-base font-bold text-amber-400 mt-0.5">
                  {selectedLeadModal.score}/100 • {selectedLeadModal.tier}
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Monthly Budget</span>
                <p className="text-base font-bold text-emerald-400 mt-0.5">{selectedLeadModal.budget}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Buying Timeline</span>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">{selectedLeadModal.timeline}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Matched Campaign</span>
                <p className="text-xs font-semibold text-blue-400 mt-0.5">{selectedLeadModal.recommendedOffer}</p>
              </div>

              <div className="col-span-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Core Pain Point / Challenge</span>
                <p className="text-xs text-slate-300 mt-0.5">{selectedLeadModal.painPoint}</p>
              </div>
            </div>

            {/* Stage Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Move Deal Stage:</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {stages.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onUpdateLeadStage(selectedLeadModal.id, s.id);
                      setSelectedLeadModal({ ...selectedLeadModal, stage: s.id });
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition ${
                      selectedLeadModal.stage === s.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {s.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  onSelectLead(selectedLeadModal.id);
                  setSelectedLeadModal(null);
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open in Live Messenger</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
