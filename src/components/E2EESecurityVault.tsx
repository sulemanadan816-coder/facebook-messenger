import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  RefreshCw,
  Copy,
  Check,
  Cpu,
  FileCheck,
  Download,
  Upload,
  QrCode,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { LeadProfile, EncryptedPayload } from '../types';
import { cryptoEngine } from '../lib/crypto';

interface E2EESecurityVaultProps {
  leads: LeadProfile[];
  onRotateLeadKey: (leadId: string) => Promise<void>;
}

export const E2EESecurityVault: React.FC<E2EESecurityVaultProps> = ({
  leads,
  onRotateLeadKey,
}) => {
  const [deviceFingerprint, setDeviceFingerprint] = useState(cryptoEngine.getDeviceFingerprint());
  const [sandboxPlaintext, setSandboxPlaintext] = useState(
    'Confidential B2B Proposal: $18,500/mo spend limit. CEO direct contact: marcus@vanceapparel.co'
  );
  const [encryptedResult, setEncryptedResult] = useState<EncryptedPayload | null>(null);
  const [decryptedResult, setDecryptedResult] = useState<string | null>(null);
  const [copiedSafetyNum, setCopiedSafetyNum] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || 'lead_01');

  // Real JWK Key Export/Import State
  const [exportedJwk, setExportedJwk] = useState<string>('');
  const [importJwkInput, setImportJwkInput] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [activeLeadJwk, setActiveLeadJwk] = useState<string>('');

  const activeLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  useEffect(() => {
    // Automatically export active lead's real JWK for transparency
    if (activeLead) {
      cryptoEngine.exportSessionKeyJWK(activeLead.id).then((jwk) => {
        setActiveLeadJwk(JSON.stringify(jwk, null, 2));
      });
    }
  }, [activeLead, selectedLeadId]);

  const handleTestEncrypt = async () => {
    try {
      const payload = await cryptoEngine.encrypt(selectedLeadId, sandboxPlaintext);
      setEncryptedResult(payload);
      setDecryptedResult(null);
    } catch (e: any) {
      alert('Encryption error: ' + e.message);
    }
  };

  const handleTestDecrypt = async () => {
    if (!encryptedResult) return;
    try {
      const plaintext = await cryptoEngine.decrypt(selectedLeadId, encryptedResult);
      setDecryptedResult(plaintext);
    } catch (e: any) {
      alert('Decryption failed: ' + e.message);
    }
  };

  const handleExportDeviceKey = async () => {
    const jwk = await cryptoEngine.exportDevicePublicKeyJWK();
    if (jwk) {
      setExportedJwk(JSON.stringify(jwk, null, 2));
    }
  };

  const handleImportKey = async () => {
    if (!importJwkInput.trim()) return;
    try {
      const parsed = JSON.parse(importJwkInput);
      await cryptoEngine.importSessionKeyJWK(selectedLeadId, parsed);
      setImportStatus('Successfully imported AES-256 session key into device memory!');
      setTimeout(() => setImportStatus(null), 3000);
    } catch (e: any) {
      setImportStatus('Invalid JWK JSON format: ' + e.message);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSafetyNum(id);
    setTimeout(() => setCopiedSafetyNum(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
            <h2 className="text-lg font-bold text-white">Real-Time End-to-End Encryption Vault</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            All messages, buyer budgets, and phone numbers are encrypted client-side using native{' '}
            <strong>Web Crypto AES-GCM 256-bit</strong> with 12-byte initialization vectors.
          </p>
        </div>

        <div className="bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-emerald-500/20 text-right flex-shrink-0">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Device Identity Fingerprint</span>
          <span className="font-mono text-xs font-bold text-emerald-300 select-all">
            {deviceFingerprint.substring(0, 17)}...
          </span>
        </div>
      </div>

      {/* Interactive Cryptographic Sandbox */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm text-white">Live Web Crypto Sandbox (AES-256-GCM)</h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Target Session:</span>
            <select
              value={selectedLeadId}
              onChange={(e) => {
                setSelectedLeadId(e.target.value);
                setEncryptedResult(null);
                setDecryptedResult(null);
              }}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.safetyNumber.substring(0, 11)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Plaintext Input */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
            1. Plaintext Data on Device (Before Encryption):
          </label>
          <textarea
            value={sandboxPlaintext}
            onChange={(e) => setSandboxPlaintext(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            placeholder="Type confidential lead data..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTestEncrypt}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 active:scale-95 transition"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Encrypt with AES-256-GCM</span>
          </button>

          {encryptedResult && (
            <button
              onClick={handleTestDecrypt}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 active:scale-95 transition"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Decrypt & Verify 128-bit Tag</span>
            </button>
          )}
        </div>

        {/* Encrypted Wire Payload Output */}
        {encryptedResult && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" />
                Raw Encrypted Wire Payload (Stored on server/transit)
              </span>
              <span className="font-mono text-[10px] text-slate-500">128-bit Auth Tag</span>
            </div>

            <div className="font-mono text-[11px] space-y-1 text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
              <p className="break-all">
                <span className="text-amber-400">IV (12-byte random nonce):</span> {encryptedResult.iv}
              </p>
              <p className="break-all">
                <span className="text-blue-400">Ciphertext:</span> {encryptedResult.ciphertext}
              </p>
              <p className="break-all">
                <span className="text-emerald-400">Auth Tag (16-byte HMAC integrity):</span> {encryptedResult.tag}
              </p>
              <p className="text-[10px] text-slate-400 pt-1">
                Algorithm: {encryptedResult.algorithm} • Key Fingerprint: {encryptedResult.keyFingerprint}
              </p>
            </div>
          </div>
        )}

        {/* Decrypted verification */}
        {decryptedResult && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 space-y-1 animate-in fade-in">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-400" />
              Cryptographic Integrity Verified & Decrypted:
            </span>
            <p className="font-mono text-xs text-slate-200 mt-1">{decryptedResult}</p>
          </div>
        )}
      </div>

      {/* Real JWK Export / Import & Session Keys */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Real JSON Web Key (JWK) Management</h3>
          </div>
          <button
            onClick={handleExportDeviceKey}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Device Public JWK</span>
          </button>
        </div>

        {exportedJwk && (
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
            <div className="flex justify-between items-center text-slate-400 mb-1">
              <span>Device ECDH P-256 Public JWK:</span>
              <button
                onClick={() => copyToClipboard(exportedJwk, 'device_jwk')}
                className="text-blue-400 hover:underline"
              >
                Copy
              </button>
            </div>
            <pre className="text-[11px] overflow-x-auto text-emerald-300">{exportedJwk}</pre>
          </div>
        )}

        {/* Active Lead JWK Viewer */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200">
              Active Session Key ({activeLead.name}):
            </span>
            <button
              onClick={() => copyToClipboard(activeLeadJwk, 'session_jwk')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Copy Session JWK
            </button>
          </div>
          <pre className="font-mono text-[10px] text-blue-300 bg-slate-900/60 p-2.5 rounded-xl overflow-x-auto">
            {activeLeadJwk || 'Generating Web Crypto JWK...'}
          </pre>
        </div>

        {/* Import Key Form */}
        <div className="pt-2 space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Import Partner Session Key (JWK JSON):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder='{"kty":"oct","k":"...","alg":"A256GCM"}'
              value={importJwkInput}
              onChange={(e) => setImportJwkInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleImportKey}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-700"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          </div>

          {importStatus && (
            <p className="text-xs text-emerald-400 font-semibold mt-1">{importStatus}</p>
          )}
        </div>
      </div>

      {/* Active Conversation Keys & Ratchet Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">Active Lead Session Keys & 60-Digit Safety Numbers</h3>
          </div>
          <span className="text-xs text-slate-400">Double Ratchet Protocol</span>
        </div>

        <div className="divide-y divide-slate-800">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={lead.avatar}
                  alt={lead.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700"
                />
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {lead.name}
                    <span className="text-[10px] text-slate-400">({lead.company})</span>
                  </h4>
                  <p className="font-mono text-xs text-emerald-400 tracking-wider">
                    {lead.safetyNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => copyToClipboard(lead.safetyNumber, lead.id)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1 border border-slate-700"
                >
                  {copiedSafetyNum === lead.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedSafetyNum === lead.id ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => onRotateLeadKey(lead.id)}
                  title="Rotate Session Key & Refresh Ratchet"
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded-xl text-xs flex items-center gap-1 border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rotate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
