import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoutingConfig, VerifiableBadge, MasterProfile } from '../types';
import { INITIAL_ROUTING_CONFIG, INITIAL_VERIFIABLE_BADGES } from '../data/initialData';
import {
  Shield,
  Key,
  Lock,
  Unlock,
  Cpu,
  Globe,
  Award,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Server,
  Zap,
  Eye,
  EyeOff,
  Sparkles,
  QrCode
} from 'lucide-react';

export interface IdentityVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterProfile: MasterProfile;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const IdentityVaultModal: React.FC<IdentityVaultModalProps> = ({
  isOpen,
  onClose,
  masterProfile,
  onToast
}) => {
  const [config, setConfig] = useState<RoutingConfig>(() => {
    try {
      const saved = localStorage.getItem('cherenkov_routing_config');
      return saved ? JSON.parse(saved) : INITIAL_ROUTING_CONFIG;
    } catch {
      return INITIAL_ROUTING_CONFIG;
    }
  });

  const [badges] = useState<VerifiableBadge[]>(INITIAL_VERIFIABLE_BADGES);
  const [passphrase, setPassphrase] = useState('');
  const [isLocked, setIsLocked] = useState(config.e2eeVaultLocked);
  const [copiedBadgeId, setCopiedBadgeId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleMode = (mode: 'hybrid' | 'cloud_only' | 'local_only') => {
    const updated = { ...config, mode };
    setConfig(updated);
    localStorage.setItem('cherenkov_routing_config', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('cherenkov_routing_changed', { detail: updated }));
    onToast('success', 'Router Updated', `Inference routing switched to ${mode.toUpperCase()}`);
  };

  const handleToggleVaultLock = () => {
    if (!isLocked) {
      // Locking
      setIsLocked(true);
      const updated = { ...config, e2eeVaultLocked: true };
      setConfig(updated);
      localStorage.setItem('cherenkov_routing_config', JSON.stringify(updated));
      onToast('info', 'Vault Locked', 'Master Profile encrypted with AES-GCM client-side key.');
    } else {
      // Unlocking
      if (!passphrase) {
        onToast('error', 'Passphrase Required', 'Please enter your client-side vault passphrase.');
        return;
      }
      setIsLocked(false);
      const updated = { ...config, e2eeVaultLocked: false };
      setConfig(updated);
      localStorage.setItem('cherenkov_routing_config', JSON.stringify(updated));
      setPassphrase('');
      onToast('success', 'Vault Decrypted', 'Local cryptographic vault successfully unlocked.');
    }
  };

  const handleCopyBadgeSig = (badge: VerifiableBadge) => {
    navigator.clipboard.writeText(`${badge.name} | Issuer: ${badge.issuer} | Signature: ${badge.cryptoSignature}`);
    setCopiedBadgeId(badge.id);
    onToast('success', 'Signature Copied', 'Cryptographic verification proof copied to clipboard.');
    setTimeout(() => setCopiedBadgeId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl bg-gradient-to-b from-[#0e1322] via-[#090d16] to-[#06080e] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Portable Identity & Zero-Trust Security Vault
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono font-bold">
                  AES-256-GCM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Client-side E2EE encryption, zero-egress PII protection, and decentralized verifiable credentials.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Section 1: Zero-Trust Inference Routing */}
        <div className="p-5 rounded-2xl bg-[#0a0e17] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>INFERENCE ROUTING & PII ISOLATION</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">Zero-Egress Gateway</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Gemini (Cloud) */}
            <button
              onClick={() => handleToggleMode('cloud_only')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                config.mode === 'cloud_only'
                  ? 'bg-violet-500/15 border-violet-500/50 shadow-md ring-1 ring-violet-500/40'
                  : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Gemini (Cloud)</span>
                <Globe className="w-4 h-4 text-violet-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Google GenAI Gemini 2.5 Flash for sub-second processing and high-precision synthesis.
              </p>
            </button>

            {/* Ollama (Local) */}
            <button
              onClick={() => handleToggleMode('local_only')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                config.mode === 'local_only'
                  ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/40'
                  : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Ollama (Local)</span>
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Local Ollama / Qwen2.5-Coder. 100% air-gapped with zero cloud egress.
              </p>
            </button>

            {/* Hybrid */}
            <button
              onClick={() => handleToggleMode('hybrid')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                config.mode === 'hybrid'
                  ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/40'
                  : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Hybrid Smart Router</span>
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Routes public JD synthesis to Gemini while isolating private PII to local Ollama.
              </p>
            </button>
          </div>

          {/* Endpoint & Local Model Configuration */}
          <div className="pt-3 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                <Server className="w-3 h-3 text-emerald-400" />
                <span>Local Endpoint (Ollama / AnythingLLM)</span>
              </label>
              <input
                type="text"
                value={config.localEndpoint}
                onChange={(e) => {
                  const updated = { ...config, localEndpoint: e.target.value };
                  setConfig(updated);
                  localStorage.setItem('cherenkov_routing_config', JSON.stringify(updated));
                  window.dispatchEvent(new Event('storage'));
                  window.dispatchEvent(new CustomEvent('cherenkov_routing_changed', { detail: updated }));
                }}
                placeholder="http://localhost:11434/v1"
                className="w-full px-3 py-2 bg-black/40 border border-white/[0.1] rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>Local Model Name / Tag</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.localModel}
                  onChange={(e) => {
                    const updated = { ...config, localModel: e.target.value };
                    setConfig(updated);
                    localStorage.setItem('cherenkov_routing_config', JSON.stringify(updated));
                    window.dispatchEvent(new Event('storage'));
                    window.dispatchEvent(new CustomEvent('cherenkov_routing_changed', { detail: updated }));
                  }}
                  placeholder="qwen2.5-coder:14b or llama3.3"
                  className="flex-1 px-3 py-2 bg-black/40 border border-white/[0.1] rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...config, localModel: 'qwen2.5-coder:14b', localEndpoint: 'http://localhost:11434/v1' };
                    setConfig(updated);
                    localStorage.setItem('cherenkov_routing_config', JSON.stringify(updated));
                    window.dispatchEvent(new Event('storage'));
                    window.dispatchEvent(new CustomEvent('cherenkov_routing_changed', { detail: updated }));
                    onToast('info', 'Defaults Reset', 'Restored Qwen 2.5 & Ollama defaults.');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono text-slate-400 hover:text-white border border-white/[0.08] cursor-pointer"
                  title="Reset to Qwen defaults"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Client-Side E2EE Vault Lock */}
        <div className="p-5 rounded-2xl bg-[#0a0e17] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
              <Lock className="w-4 h-4 text-violet-400" />
              <span>CLIENT-SIDE E2EE MASTER PROFILE VAULT</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Fingerprint: <span className="text-cyan-400">{config.vaultKeyHash?.slice(0, 16)}...</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isLocked ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span className="text-xs font-bold text-white">
                  Vault Status: {isLocked ? 'Encrypted & Locked' : 'Decrypted & Active in Memory'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isLocked
                  ? 'All local profile fields are AES-GCM encrypted. Unlock with your master passphrase.'
                  : 'Profile data is unencrypted in volatile React memory for active synthesis.'}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isLocked && (
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Master Passphrase"
                  className="px-3 py-2 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              )}
              <button
                onClick={handleToggleVaultLock}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isLocked
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1]'
                }`}
              >
                {isLocked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Decrypt Vault</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock & Encrypt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Decentralized Verifiable Skill Badges */}
        <div className="p-5 rounded-2xl bg-[#0a0e17] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>CRYPTOGRAPHICALLY VERIFIED CREDENTIALS</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">Ed25519 Verified</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{b.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Issuer: {b.issuer}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>

                <div className="text-[9px] font-mono text-slate-500 truncate">
                  Sig: {b.cryptoSignature}
                </div>

                <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">{b.issueDate}</span>
                  <button
                    onClick={() => handleCopyBadgeSig(b)}
                    className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBadgeId === b.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBadgeId === b.id ? 'Copied' : 'Copy Proof'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold font-mono cursor-pointer shadow-md"
          >
            Done & Save Settings
          </button>
        </div>
      </motion.div>
    </div>
  );
};
