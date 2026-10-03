import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Lock,
  Flame,
  Zap,
  Clock,
  Plus,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { LeadProfile, ChatMessage } from '../types';

interface InboxListProps {
  leads: LeadProfile[];
  messages: Record<string, ChatMessage[]>;
  activeLeadId: string;
  onSelectLead: (leadId: string) => void;
  onSimulateInbound: () => void;
}

export const InboxList: React.FC<InboxListProps> = ({
  leads,
  messages,
  activeLeadId,
  onSelectLead,
  onSimulateInbound,
}) => {
  const [search, setSearch] = useState('');

  const filtered = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.company && l.company.toLowerCase().includes(search.toLowerCase())) ||
      l.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Inbox Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Facebook Marketing Inbound Chats
              <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.2 rounded-full font-semibold">
                {leads.length} Active
              </span>
            </h2>
            <p className="text-xs text-slate-400">Real-time leads connected via Meta Messenger Webhooks & AI Agent</p>
          </div>
        </div>

        <button
          onClick={onSimulateInbound}
          className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Simulate Incoming Lead</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter conversations by name, company, intent..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-md"
        />
      </div>

      {/* Conversation Cards List */}
      <div className="divide-y divide-slate-800/80 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {filtered.map((lead) => {
          const leadMsgs = messages[lead.id] || [];
          const lastMsg = leadMsgs[leadMsgs.length - 1];
          const isSelected = lead.id === activeLeadId;

          return (
            <div
              key={lead.id}
              onClick={() => onSelectLead(lead.id)}
              className={`p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors duration-150 ${
                isSelected
                  ? 'bg-blue-950/40 border-l-4 border-blue-500'
                  : 'hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative flex-shrink-0">
                  <img
                    src={lead.avatar}
                    alt={lead.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-700"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">{lead.name}</h4>
                    {lead.company && (
                      <span className="text-[11px] text-slate-400 truncate">• {lead.company}</span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 truncate max-w-md">
                    {lastMsg ? lastMsg.text : 'New Facebook Messenger inbound inquiry'}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-slate-300">
                      <Clock className="w-2.5 h-2.5" />
                      {lead.lastActive}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">Budget: {lead.budget}</span>
                    {lead.e2eeEnabled && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-emerald-400">
                          <Lock className="w-2.5 h-2.5" />
                          E2EE
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Lead Score & Temperature Badge */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      lead.tier === 'Hot'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : lead.tier === 'Warm'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {lead.tier === 'Hot' ? <Flame className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                    <span>{lead.score} / 100</span>
                  </span>
                </div>

                <span className="text-[10px] text-slate-400 font-medium bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                  {lead.stage}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
