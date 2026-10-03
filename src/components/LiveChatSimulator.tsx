import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Lock,
  Unlock,
  Sparkles,
  ShieldCheck,
  Brain,
  Zap,
  Target,
  Clock,
  DollarSign,
  ArrowRight,
  ShoppingBag,
  Bed,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';
import { LeadProfile, ChatMessage, AgentConfig, Campaign } from '../types';

interface LiveChatSimulatorProps {
  activeLead: LeadProfile;
  messages: ChatMessage[];
  campaigns: Campaign[];
  agentConfig: AgentConfig;
  onSendMessage: (text: string, isFromUser: boolean, isEncrypted: boolean) => Promise<void>;
  onUpdateLead: (updated: Partial<LeadProfile>) => void;
  onToggleAutoPilot: () => void;
}

export const LiveChatSimulator: React.FC<LiveChatSimulatorProps> = ({
  activeLead,
  messages,
  campaigns,
  agentConfig,
  onSendMessage,
  onUpdateLead,
  onToggleAutoPilot,
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [e2eeActive, setE2eeActive] = useState(activeLead.e2eeEnabled);
  const [perspective, setPerspective] = useState<'messenger' | 'ai_inspector'>('messenger');
  const [selectedEncryptedMsg, setSelectedEncryptedMsg] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isTyping) return;

    setInputText('');
    setIsTyping(true);

    try {
      await onSendMessage(textToSend, true, e2eeActive);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const bedScenarios = [
    {
      label: '🛏️ King Bed (Roman Urdu)',
      text: "Hi bhai mujhe king size ka black bed chahiye. Rate aur details bata dein, COD hai?",
    },
    {
      label: '📦 Fast COD Order (Jhelum)',
      text: "theek hai bhai Adan 03001234567 Main Bazaar Jhelum order confirm kardo COD pe.",
    },
    {
      label: '🩺 Orthopedic Back Pain',
      text: "Hi! I have bad lower back pain every morning. What orthopedic mattress do you recommend for Queen size?",
    },
    {
      label: '💵 COD San Francisco',
      text: "Can I pay Cash on Delivery (COD)? My address is 742 Evergreen Terrace, San Francisco, CA. Phone is 415-892-0192.",
    },
    {
      label: '🚚 Delivery Lahore & Discounts',
      text: "Delivery Lahore mein kitne din mein hogi? Aur koi discount code chal raha hai?",
    },
    {
      label: '👤 Human Handoff Request',
      text: "human se baat karni hai showroom representative se connect karain",
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)] max-h-[860px]">
      {/* LEFT: Android Phone Shell - Facebook Messenger Experience */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Messenger Header with Brand info & E2EE indicator */}
        <div className="bg-slate-950/90 backdrop-blur-md px-4 py-3 border-b border-slate-800/80 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={activeLead.avatar}
                alt={activeLead.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/40"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-100">{activeLead.name}</h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded-full font-medium">
                  {activeLead.company || 'Facebook Customer'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active on Messenger
                </span>
                <span>•</span>
                <span className="text-slate-400">{activeLead.platform}</span>
              </div>
            </div>
          </div>

          {/* Right Header Controls: Mode Toggles */}
          <div className="flex items-center gap-2">
            {/* E2EE Toggle Button */}
            <button
              onClick={() => {
                const next = !e2eeActive;
                setE2eeActive(next);
                onUpdateLead({ e2eeEnabled: next });
              }}
              title={e2eeActive ? 'End-to-End Encryption ON' : 'End-to-End Encryption OFF'}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                e2eeActive
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {e2eeActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{e2eeActive ? 'E2EE' : 'Plain'}</span>
            </button>

            {/* View Switcher */}
            <div className="bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/80 flex items-center">
              <button
                onClick={() => setPerspective('messenger')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  perspective === 'messenger'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setPerspective('ai_inspector')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  perspective === 'ai_inspector'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Brain className="w-3 h-3" />
                <span className="hidden sm:inline">AI Analysis</span>
              </button>
            </div>
          </div>
        </div>

        {/* E2EE Security Badge Banner */}
        {e2eeActive && (
          <div className="bg-emerald-950/40 border-b border-emerald-900/40 px-4 py-1.5 flex items-center justify-between text-[11px] text-emerald-300">
            <div className="flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">
                End-to-End Encrypted (AES-256-GCM) • Safety No: {activeLead.safetyNumber.substring(0, 11)}...
              </span>
            </div>
            <button
              onClick={() => setPerspective('ai_inspector')}
              className="text-[10px] text-emerald-400 hover:underline flex-shrink-0 font-medium ml-2"
            >
              Verify Keys
            </button>
          </div>
        )}

        {/* MAIN CHAT CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-slate-950/60 via-slate-900/40 to-slate-950/60">
          <div className="text-center my-2">
            <div className="inline-flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-full text-xs text-slate-300 shadow-sm">
              <Bed className="w-3.5 h-3.5 text-blue-400" />
              <span>Facebook Commerce Agent for <strong>{agentConfig.brandName}</strong></span>
            </div>
          </div>

          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-md relative ${
                    isUser
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-none'
                      : 'bg-slate-800 border border-slate-700/70 text-slate-100 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed text-sm">{msg.text}</p>

                  <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] text-slate-300/80">
                    <span>{msg.timestamp}</span>
                    {msg.isEncrypted && (
                      <button
                        onClick={() => setSelectedEncryptedMsg(msg)}
                        title="Click to inspect raw ciphertext"
                        className="flex items-center gap-0.5 text-emerald-300 hover:text-emerald-200 transition-colors"
                      >
                        <Lock className="w-2.5 h-2.5" />
                        <span className="text-[9px]">E2EE</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Product Recommendation Card (if AI suggested a bed) */}
                {msg.productCards && msg.productCards.length > 0 && (
                  <div className="mt-2.5 max-w-[85%] sm:max-w-[75%] space-y-2">
                    {msg.productCards.map((card) => (
                      <div
                        key={card.id}
                        className="bg-slate-950 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg flex flex-col sm:flex-row items-center gap-3 p-2.5"
                      >
                        <img
                          src={card.imageUrl}
                          alt={card.title}
                          className="w-full sm:w-24 h-24 object-cover rounded-xl flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-white truncate">{card.title}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {card.description}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-bold text-emerald-400">
                              ${card.price} <span className="text-[10px] text-slate-400 font-normal">({card.size})</span>
                            </span>
                            <button
                              onClick={() => handleSend(undefined, `I want to order the ${card.title} in ${card.size} with Cash on Delivery`)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition shadow-sm"
                            >
                              <span>Order COD</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Order Confirmation Receipt (if order registered) */}
                {msg.orderSummary && (
                  <div className="mt-2.5 max-w-[85%] sm:max-w-[75%] bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-500/50 p-3.5 rounded-2xl shadow-xl text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-emerald-900/60 pb-1.5">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <PackageCheck className="w-4 h-4 text-emerald-400" />
                        Order Registered: {msg.orderSummary.orderNumber}
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {msg.orderSummary.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-slate-300 text-[11px]">
                      <p><strong>Item:</strong> {msg.orderSummary.productTitle} ({msg.orderSummary.variantSize})</p>
                      <p><strong>Total Due:</strong> <strong className="text-emerald-400 font-mono text-xs">${msg.orderSummary.totalAmount}</strong> (Cash on Delivery)</p>
                    </div>
                  </div>
                )}

                {/* NLP Mini-Badge for agent messages */}
                {!isUser && msg.nlpMetrics && (
                  <div className="flex items-center gap-2 mt-1 px-1 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1 bg-purple-950/60 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded-full text-[10px]">
                      <Brain className="w-2.5 h-2.5" />
                      {msg.nlpMetrics.intent} ({msg.nlpMetrics.score}/100)
                    </span>
                  </div>
                )}

                {/* Quick Reply Pills */}
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                    {msg.quickReplies.map((qr, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(undefined, qr)}
                        className="px-3 py-1 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 border border-blue-700/50 rounded-full text-xs font-medium transition active:scale-95 flex items-center gap-1 shadow-sm"
                      >
                        <span>{qr}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-blue-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs px-2 py-1">
              <div className="w-6 h-6 rounded-full bg-blue-600/30 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              </div>
              <span className="italic">BED Master AI is checking catalog and sizing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Scenario Picker bar */}
        <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Quick Scenarios:
          </span>
          {bedScenarios.map((sc, i) => (
            <button
              key={i}
              onClick={() => handleSend(undefined, sc.text)}
              className="text-xs bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-xl whitespace-nowrap transition active:scale-95 shadow-sm"
            >
              {sc.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              e2eeActive
                ? 'Type bed inquiry or address (E2EE Encrypted)...'
                : 'Ask about sizes, orthopedic mattresses, frames, or COD...'
            }
            className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-2xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-2xl transition shadow-md active:scale-95 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* RIGHT: AI Lead Qualification & Cryptographic Inspector */}
      <div className="w-full lg:w-96 flex flex-col gap-4 overflow-y-auto pr-1">
        {/* AI Lead Qualification Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-sm text-slate-100">Live Commerce Qualification</h3>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                activeLead.tier === 'Hot'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : activeLead.tier === 'Warm'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
              }`}
            >
              {activeLead.tier} Buyer ({activeLead.score}/100)
            </span>
          </div>

          {/* Score Meter */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Purchase Intent Score</span>
              <span className="font-bold text-slate-200">{activeLead.score}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  activeLead.score >= 70
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : activeLead.score >= 40
                    ? 'bg-gradient-to-r from-blue-500 to-amber-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${activeLead.score}%` }}
              />
            </div>
          </div>

          {/* BANT & Size Breakdown */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1 mb-0.5">
                <Bed className="w-3 h-3 text-blue-400" />
                Size Needed
              </span>
              <p className="font-semibold text-slate-100 truncate">{activeLead.selectedSize || 'Queen (Standard)'}</p>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1 mb-0.5">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                Budget
              </span>
              <p className="font-semibold text-slate-100 truncate">{activeLead.budget || '$400 - $600'}</p>
            </div>

            <div className="col-span-2 bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1 mb-0.5">
                <Target className="w-3 h-3 text-purple-400" />
                Sleeping Need / Pain Point
              </span>
              <p className="text-slate-300 leading-snug">{activeLead.painPoint || 'Spinal support & cooling'}</p>
            </div>
          </div>

          {/* Recommended Bed */}
          <div className="bg-gradient-to-br from-blue-950/50 to-indigo-950/50 border border-blue-500/30 p-3 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 mb-1">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Recommended Product Match</span>
            </div>
            <p className="text-xs text-slate-200 font-medium">
              {activeLead.recommendedOffer || 'Orthopedic Cloud Rest Queen ($449)'}
            </p>
          </div>

          {/* Auto-Pilot Toggle */}
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-200 block">AI Auto-Pilot</span>
              <span className="text-[10px] text-slate-400">Auto-respond & take COD orders</span>
            </div>
            <button
              onClick={onToggleAutoPilot}
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                agentConfig.autoPilotEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>

        {/* Cryptographic Inspector Modal / Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-slate-200">E2EE Cryptographic Status</h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              AES-256-GCM
            </span>
          </div>

          <div className="space-y-2 text-slate-300">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Safety Number / Fingerprint
              </span>
              <p className="font-mono text-xs text-emerald-300 bg-slate-950 p-2 rounded-xl border border-slate-800 mt-1 select-all">
                {activeLead.safetyNumber}
              </p>
            </div>

            {selectedEncryptedMsg && selectedEncryptedMsg.encryptedPayload ? (
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-white">Wire Ciphertext Preview</span>
                  <button
                    onClick={() => setSelectedEncryptedMsg(null)}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1 font-mono text-[10px] text-slate-400">
                  <p>
                    <strong className="text-slate-300">IV:</strong> {selectedEncryptedMsg.encryptedPayload.iv}
                  </p>
                  <p className="truncate">
                    <strong className="text-slate-300">Ciphertext:</strong>{' '}
                    {selectedEncryptedMsg.encryptedPayload.ciphertext}
                  </p>
                  <p>
                    <strong className="text-slate-300">Tag:</strong> {selectedEncryptedMsg.encryptedPayload.tag}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                Tap the <Lock className="w-2.5 h-2.5 inline text-emerald-400" /> icon on any chat bubble to inspect its raw encrypted AES-256 wire payload.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
