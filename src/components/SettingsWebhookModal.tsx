import React, { useState, useEffect } from 'react';
import {
  Settings,
  Check,
  Copy,
  Sparkles,
  Facebook,
  Shield,
  Send,
  Play,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Activity,
  CheckCircle2,
  FileCode,
  Zap
} from 'lucide-react';
import { AgentConfig, FacebookConfig, WebhookLogEntry } from '../types';
import { AIAgentSettings } from './AIAgentSettings';
import { AISettings, AIResponseOutput } from '../lib/ai/types';

interface SettingsWebhookModalProps {
  config: AgentConfig;
  fbConfig: FacebookConfig;
  webhookLogs: WebhookLogEntry[];
  onSaveConfig: (updated: Partial<AgentConfig>) => void;
  onSaveFbConfig: (updated: Partial<FacebookConfig>) => void;
  onVerifyToken: (token: string) => Promise<{ success: boolean; page?: any; error?: string }>;
  onSendTestMessage: (recipientPsid: string, text: string) => Promise<{ success: boolean; result?: any; error?: string }>;
  onRefreshLogs: () => void;
}

export const SettingsWebhookModal: React.FC<SettingsWebhookModalProps> = ({
  config,
  fbConfig,
  webhookLogs,
  onSaveConfig,
  onSaveFbConfig,
  onVerifyToken,
  onSendTestMessage,
  onRefreshLogs,
}) => {
  // Agent Persona State
  const [brandName, setBrandName] = useState(config.brandName);
  const [industry, setIndustry] = useState(config.industry);
  const [tone, setTone] = useState(config.tone);
  const [offering, setOffering] = useState(config.offeringSummary);

  // Facebook Connection State
  const [pageAccessToken, setPageAccessToken] = useState(fbConfig.pageAccessToken || '');
  const [verifyToken, setVerifyToken] = useState(fbConfig.verifyToken || 'omni_secure_verify_2026');
  const [appSecret, setAppSecret] = useState(fbConfig.appSecret || '');
  const [appId, setAppId] = useState(fbConfig.appId || '');

  // Live Test State
  const [testPsid, setTestPsid] = useState('');
  const [testText, setTestText] = useState('Hi! This is an automated test message from your OmniMessenger AI Agent.');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; text?: string } | null>(null);

  // Token Verification State
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Sub-tabs State
  const [subTab, setSubTab] = useState<'meta' | 'ai_agent' | 'logs'>('meta');
  const [aiSettings, setAiSettings] = useState<AISettings>({
    enabled: true,
    model: 'gemini-3.8-flash',
    agentName: 'Hamza',
    personality: 'friendly_pakistani_consultant',
    customInstructions: config.offeringSummary || '',
    languageBehavior: 'auto',
    maxOrderQuantity: 3,
    handoffKeywords: ['human', 'agent', 'call me', 'representative', 'real person', 'insan'],
  });

  const handleTestMessage = async (message: string): Promise<AIResponseOutput> => {
    const res = await fetch('/api/ai/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    return await res.json();
  };

  // Copy Feedback
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const callbackUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/facebook/webhook`
    : 'https://your-domain.run.app/api/facebook/webhook';

  const handleVerifyGraphToken = async () => {
    if (!pageAccessToken.trim()) {
      setVerifyStatus({ success: false, message: 'Please enter a Facebook Page Access Token first' });
      return;
    }
    setVerifying(true);
    setVerifyStatus(null);
    try {
      const res = await onVerifyToken(pageAccessToken);
      if (res.success && res.page) {
        setVerifyStatus({
          success: true,
          message: `Connected to Facebook Page: "${res.page.name}" (ID: ${res.page.id}, Category: ${res.page.category || 'Business'})`,
        });
      } else {
        setVerifyStatus({
          success: false,
          message: res.error || 'Failed to verify token with Meta Graph API',
        });
      }
    } catch (e: any) {
      setVerifyStatus({ success: false, message: e.message || 'Verification error' });
    } finally {
      setVerifying(false);
    }
  };

  const handleSendLiveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPsid.trim()) {
      setTestResult({ success: false, text: 'Please provide a valid Facebook Recipient PSID' });
      return;
    }
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await onSendTestMessage(testPsid, testText);
      if (res.success) {
        setTestResult({
          success: true,
          text: `Message delivered via Meta Graph API! Message ID: ${res.result?.message_id || 'mid.delivered'}`,
        });
      } else {
        setTestResult({ success: false, text: res.error || 'Meta Graph API rejected message dispatch' });
      }
    } catch (err: any) {
      setTestResult({ success: false, text: err.message });
    } finally {
      setSendingTest(false);
    }
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      brandName,
      industry,
      tone,
      offeringSummary: offering,
    });
    onSaveFbConfig({
      pageAccessToken,
      verifyToken,
      appSecret,
      appId,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Real Meta Connection Status Banner */}
      <div className={`p-5 rounded-3xl border shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        fbConfig.webhookConnected && fbConfig.pageAccessToken
          ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border-emerald-500/40'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <Facebook className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                {fbConfig.pageName || 'Facebook Marketing AI Agent'}
              </h2>
              {fbConfig.webhookConnected && fbConfig.pageAccessToken ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Live Meta Graph Connected
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-semibold">
                  Setup Required
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {fbConfig.pageId ? `Page ID: ${fbConfig.pageId}` : 'Connect your Meta Page Access Token to activate real Messenger automations.'}
            </p>
          </div>
        </div>

        {fbConfig.lastVerifiedAt && (
          <div className="text-[10px] text-slate-400 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800 self-end sm:self-auto">
            Last Verified: {new Date(fbConfig.lastVerifiedAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Subtab Navigation Pills */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-lg">
        <button
          type="button"
          onClick={() => setSubTab('meta')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'meta'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Facebook className="w-4 h-4" />
          <span>Meta & Webhook</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('ai_agent')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'ai_agent'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Agent Studio</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('logs')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'logs'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Webhook Logs ({webhookLogs.length})</span>
        </button>
      </div>

      {subTab === 'ai_agent' && (
        <AIAgentSettings
          settings={aiSettings}
          onSaveSettings={(s) => {
            setAiSettings(s);
            onSaveConfig({ brandName: s.agentName, offeringSummary: s.customInstructions });
          }}
          onTestMessage={handleTestMessage}
        />
      )}

      {subTab === 'meta' && (
        <>
          {/* Meta Developer Webhook Integration Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm text-white">Real Facebook Webhook Credentials</h3>
          </div>
          <a
            href="https://developers.facebook.com/apps/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
          >
            <span>Meta Developer Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Callback URL */}
        <div className="space-y-1.5 text-xs">
          <label className="font-semibold text-slate-300 block flex items-center justify-between">
            <span>Webhook Callback URL (Paste into Meta Webhook Settings)</span>
            <span className="text-[10px] text-slate-400">Must be HTTPS</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={callbackUrl}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 select-all focus:outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(callbackUrl);
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
              }}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Verify Token */}
        <div className="space-y-1.5 text-xs">
          <label className="font-semibold text-slate-300 block">
            Webhook Verify Token (Matches hub.verify_token)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(verifyToken);
                setCopiedToken(true);
                setTimeout(() => setCopiedToken(false), 2000);
              }}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
            >
              {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToken ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Page Access Token */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-300 block">
              Facebook Page Access Token (From Meta Developer Console &gt; Messenger)
            </label>
            <span className="text-[10px] text-emerald-400">Enables automated AI Messenger replies</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder="EAABw..."
              value={pageAccessToken}
              onChange={(e) => setPageAccessToken(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleVerifyGraphToken}
              disabled={verifying || !pageAccessToken.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
              <span>{verifying ? 'Testing...' : 'Verify with Meta'}</span>
            </button>
          </div>

          {verifyStatus && (
            <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 mt-2 ${
              verifyStatus.success ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}>
              {verifyStatus.success ? <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
              <span>{verifyStatus.message}</span>
            </div>
          )}
        </div>

        {/* App Secret for HMAC Validation */}
        <div className="space-y-1.5 text-xs">
          <label className="font-semibold text-slate-300 block">
            Meta App Secret (Optional - for X-Hub-Signature-256 HMAC validation)
          </label>
          <input
            type="password"
            placeholder="Meta App Secret from App Settings > Basic"
            value={appSecret}
            onChange={(e) => setAppSecret(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={handleSaveAll}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition"
        >
          Save Webhook & Page Credentials
        </button>
      </div>

      {/* Real Meta Graph API Live Message Sender */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 text-xs">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Send className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-white">Live Facebook Graph API Dispatcher (Direct Send)</h3>
        </div>

        <p className="text-slate-300 text-xs">
          Send a real outbound message to any Facebook User via Meta's Graph API (<code className="text-blue-400">/me/messages</code>).
        </p>

        <form onSubmit={handleSendLiveTest} className="space-y-3">
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Recipient Facebook PSID (Page-Scoped User ID)
            </label>
            <input
              type="text"
              placeholder="e.g. 89210293849102"
              value={testPsid}
              onChange={(e) => setTestPsid(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">Message Text to Send</label>
            <textarea
              rows={2}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={sendingTest || !testPsid.trim() || !fbConfig.pageAccessToken}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendingTest ? 'Transmitting to Meta...' : 'Send Live Graph Message'}</span>
          </button>

          {testResult && (
            <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 mt-2 ${
              testResult.success ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}>
              {testResult.success ? <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
              <span className="font-mono">{testResult.text}</span>
            </div>
          )}
        </form>
      </div>

          {/* AI Marketing Persona & Tone Settings */}
          <form onSubmit={handleSaveAll} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-sm text-white">AI Agent Tone & Qualification Criteria</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Brand Name</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Industry / Niche</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Conversational Tone</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'friendly_consultative', label: 'Consultative & Warm' },
                  { id: 'direct_closing', label: 'Direct High-Ticket Closer' },
                  { id: 'executive', label: 'Executive Enterprise B2B' },
                  { id: 'creative', label: 'Creative & Bold' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                      tone === t.id
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Core Offerings & Deliverables</label>
              <textarea
                rows={2}
                value={offering}
                onChange={(e) => setOffering(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition"
            >
              Save All Settings
            </button>
          </form>
        </>
      )}

      {/* Live Webhook Activity Stream Log */}
      {subTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Live Webhook Ingestion Activity Log</h3>
            </div>
            <button
              onClick={onRefreshLogs}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {webhookLogs.length === 0 ? (
            <p className="text-slate-500 text-xs italic py-4 text-center">
              No webhook events received yet. Messages sent from Facebook will appear here in real time.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {webhookLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      PSID: {log.senderId}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-slate-300 italic">"{log.message}"</p>

                  {log.botReply && (
                    <div className="bg-blue-950/40 p-2 rounded-xl border border-blue-900/40 text-blue-200 text-[11px]">
                      <strong>AI Auto-Reply:</strong> {log.botReply}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Status: <strong className="text-emerald-400 uppercase">{log.status}</strong></span>
                    {log.nlpAnalysis && (
                      <span className="text-purple-300">
                        Score: {log.nlpAnalysis.score}/100 • Tier: {log.nlpAnalysis.tier}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
