import React, { useState } from 'react';
import {
  Brain,
  Sliders,
  Play,
  CheckCircle2,
  Terminal,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Send,
  Zap,
  Tag,
  Package,
  Check,
  UserCheck
} from 'lucide-react';
import { AISettings, AIResponseOutput } from '../lib/ai/types.ts';

interface AIAgentSettingsProps {
  settings: AISettings;
  onSaveSettings: (settings: AISettings) => void;
  onTestMessage: (message: string) => Promise<AIResponseOutput>;
}

export const AIAgentSettings: React.FC<AIAgentSettingsProps> = ({
  settings,
  onSaveSettings,
  onTestMessage,
}) => {
  const [form, setForm] = useState<AISettings>(settings);
  const [testInput, setTestInput] = useState('Hi bhai mujhe king size ka black bed chahiye');
  const [isTesting, setIsTesting] = useState(false);
  const [testOutput, setTestOutput] = useState<AIResponseOutput | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const samplePrompts = [
    'Hi bhai mujhe king size ka black bed chahiye',
    'Do you have anything under 80k?',
    'Ye wala kitne ka hai?',
    'Iska white color hai?',
    '2 king size black beds chahiye',
    'Delivery Lahore mein kitne din mein hogi? COD hai?',
    'human se baat karni hai',
    'theek hai Adan 03001234567 Main Bazaar Jhelum confirm kardo',
  ];

  const handleRunTest = async (prompt?: string) => {
    const textToRun = prompt || testInput;
    if (!textToRun.trim() || isTesting) return;

    setIsTesting(true);
    setTestOutput(null);

    try {
      const res = await onTestMessage(textToRun);
      setTestOutput(res);
    } catch (e: any) {
      console.error('Test error:', e);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-400">
            <Brain className="w-6 h-6" />
            <h2 className="text-lg font-bold text-white">AI Sales Agent Architecture & Simulator</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Configure natural language Roman Urdu / English conversation behavior, anti-hallucination tools, and live dry-run testing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300 font-semibold">AI Agent Status:</span>
          <button
            onClick={() => setForm((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
              form.enabled ? 'bg-purple-600 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>
      </div>

      {/* Admin Test Mode Sandbox (Dry Run) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Interactive AI Agent Test Mode (Dry Run)</h3>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
            DRY RUN • NO REAL ORDERS WRITTEN
          </span>
        </div>

        {/* Quick sample buttons */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Click to test exact scenario:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTestInput(p);
                  handleRunTest(p);
                }}
                className="text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Test input bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Type customer message in Roman Urdu or English..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={() => handleRunTest()}
            disabled={isTesting || !testInput.trim()}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-2xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition active:scale-95"
          >
            {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isTesting ? 'Simulating...' : 'Test AI Agent'}</span>
          </button>
        </div>

        {/* Test Output Console */}
        {testOutput && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 animate-in fade-in">
            {/* Model & Latency Telemetry */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-2">
              <span className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                Model: <strong className="text-slate-200">{testOutput.debug.ai_model}</strong>
              </span>
              <span>
                Latency: <strong className="text-emerald-400 font-mono">{testOutput.debug.ai_latency_ms}ms</strong>
              </span>
            </div>

            {/* AI Agent Generated Response */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-purple-400 font-bold uppercase block tracking-wider">
                Sales Agent Natural Response:
              </span>
              <p className="text-xs text-slate-100 whitespace-pre-line leading-relaxed">
                {testOutput.reply}
              </p>
            </div>

            {/* Executed Tools Breakdown */}
            {testOutput.toolCalls && testOutput.toolCalls.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                  Server-Side Tools Invoked ({testOutput.toolCalls.length}):
                </span>
                <div className="space-y-1">
                  {testOutput.toolCalls.map((tc, i) => (
                    <div
                      key={i}
                      className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl text-[11px] font-mono space-y-1"
                    >
                      <div className="text-blue-400 font-bold">⚡ {tc.name}({JSON.stringify(tc.arguments)})</div>
                      {tc.result && (
                        <div className="text-slate-400 text-[10px] truncate max-w-2xl">
                          ↳ Result: {JSON.stringify(tc.result)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Cards Returned */}
            {testOutput.productCards && testOutput.productCards.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  Live Products Matched from Database:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {testOutput.productCards.map((pc) => (
                    <div key={pc.id} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex gap-2.5 items-center">
                      <img src={pc.imageUrl} alt={pc.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs text-white truncate">{pc.title}</h5>
                        <p className="text-[11px] text-emerald-400 font-bold">Rs. {pc.price.toLocaleString()} ({pc.size})</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Configuration Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 text-xs">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sliders className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-sm text-white">Agent Persona, Language & Guardrails</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-300 block mb-1">Agent Name</label>
            <input
              type="text"
              value={form.agentName}
              onChange={(e) => setForm({ ...form, agentName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">AI Model Engine</label>
            <select
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (High Efficiency & Low Latency)</option>
              <option value="gpt-4o">gpt-4o (Production OpenAI Model)</option>
              <option value="gpt-4o-mini">gpt-4o-mini (Fast OpenAI Model)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-300 block mb-1">Language Behavior</label>
            <select
              value={form.languageBehavior}
              onChange={(e) => setForm({ ...form, languageBehavior: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
            >
              <option value="auto">Auto-Detect (Matches Customer Roman Urdu / English)</option>
              <option value="roman_urdu">Always Roman Urdu (Natural Showroom Style)</option>
              <option value="english">Always Professional English</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">Max Order Quantity Allowed</label>
            <input
              type="number"
              min={1}
              max={10}
              value={form.maxOrderQuantity}
              onChange={(e) => setForm({ ...form, maxOrderQuantity: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-300 block mb-1">
            Custom Showroom Sales Instructions & Promos
          </label>
          <textarea
            rows={3}
            value={form.customInstructions}
            onChange={(e) => setForm({ ...form, customInstructions: e.target.value })}
            placeholder="e.g. Free 2 Memory Foam Cooling Pillows with all King Size solid wood beds this week. Cash on Delivery nationwide."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition"
          >
            Save AI Agent Settings
          </button>

          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
              <Check className="w-4 h-4" /> Settings updated and persisted!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
