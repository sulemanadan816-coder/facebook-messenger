import React, { useState } from 'react';
import { Tag, Plus, CheckCircle, Percent, ArrowUpRight, Zap, Target, BarChart2 } from 'lucide-react';
import { Campaign } from '../types';

interface CampaignsManagerProps {
  campaigns: Campaign[];
  onToggleCampaign: (id: string) => void;
  onAddCampaign: (newCampaign: Omit<Campaign, 'id' | 'conversionCount'>) => void;
}

export const CampaignsManager: React.FC<CampaignsManagerProps> = ({
  campaigns,
  onToggleCampaign,
  onAddCampaign,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(20);
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCampaign({
      name,
      discountCode: discountCode.toUpperCase() || 'VIPDEAL',
      discountPercent: Number(discountPercent),
      description,
      targetAudience: targetAudience || 'General Facebook Inbound',
      ctaUrl: ctaUrl || 'https://omnigrowth.ai',
      active: true,
    });

    setName('');
    setDiscountCode('');
    setDescription('');
    setShowAddModal(false);
  };

  const totalConversions = campaigns.reduce((acc, c) => acc + c.conversionCount, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-blue-400">
            <Tag className="w-5 h-5" />
            <h2 className="text-base font-bold text-white">Facebook Marketing Campaigns & Promos</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Active offers are automatically matched by the AI NLP agent to qualify prospects and close deals.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map((camp) => (
          <div
            key={camp.id}
            className={`bg-slate-900 border rounded-3xl p-5 shadow-xl transition-all duration-200 space-y-4 ${
              camp.active ? 'border-blue-500/40 shadow-blue-950/20' : 'border-slate-800 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-100">{camp.name}</h3>
                  {camp.active ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      Paused
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{camp.description}</p>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => onToggleCampaign(camp.id)}
                className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center flex-shrink-0 ${
                  camp.active ? 'bg-blue-600 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* Campaign details */}
            <div className="grid grid-cols-3 gap-2 text-xs bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Promo Code</span>
                <span className="font-mono font-bold text-blue-400 text-xs">{camp.discountCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Discount</span>
                <span className="font-bold text-emerald-400 text-xs">{camp.discountPercent}% Off</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Conversions</span>
                <span className="font-bold text-amber-400 text-xs">{camp.conversionCount} Booked</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span className="truncate max-w-[220px]">Audience: {camp.targetAudience}</span>
              <a
                href={camp.ctaUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-0.5 text-xs font-semibold"
              >
                <span>CTA Link</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Add Campaign Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Create New Marketing Campaign</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Founder Growth Sprint"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Discount Code</label>
                  <input
                    type="text"
                    placeholder="SCALE30"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono uppercase text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Discount %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Offer Summary for AI Agent</label>
                <textarea
                  rows={2}
                  placeholder="Details of what is included, guarantees, bonus audits..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Direct Booking / CTA Link</label>
                <input
                  type="url"
                  placeholder="https://cal.com/your-brand/audit"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  Save & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
