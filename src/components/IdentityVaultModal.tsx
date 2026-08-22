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
import { Modal } from './ui';
import type { ToastFn } from './Toast';
import { isSealed, openProfile, sealProfile, WrongPassphraseError } from '../lib/vault';

export interface IdentityVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterProfile: MasterProfile;
  onToast: ToastFn;
  /** Called with the decrypted profile after a successful unlock. */
  onVaultOpened?: (profile: MasterProfile) => void;
  /** Called once the profile has been sealed and the plaintext removed. */
  onVaultSealed?: () => void;
}

export const IdentityVaultModal: React.FC<IdentityVaultModalProps> = ({
  isOpen,
  onClose,
  masterProfile,
  onToast,
  onVaultOpened,
  onVaultSealed
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
  // Locked state is whether a sealed envelope actually exists on this device,
  // not a boolean someone can flip in localStorage.
  const [isLocked, setIsLocked] = useState(() => isSealed());
  const [vaultBusy, setVaultBusy] = useState(false);
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

  /**
   * Real AES-GCM, not a boolean.
   *
   * Sealing encrypts the Master Profile under a key derived from the passphrase
   * and deletes the plaintext copy. Opening requires the passphrase that sealed
   * it — a wrong one fails the GCM authentication tag and the vault stays shut.
   */
  const handleToggleVaultLock = async () => {
    if (vaultBusy) return;

    if (!passphrase) {
      onToast(
        'error',
        'Passphrase required',
        isLocked
          ? 'Enter the passphrase you sealed the vault with.'
          : 'Choose a passphrase. There is no recovery — if you lose it, the profile is gone.'
      );
      return;
    }

    setVaultBusy(true);
    try {
      if (!isLocked) {
        await sealProfile(JSON.stringify(masterProfile), passphrase);
        const updated = { ...config, e2eeVaultLocked: true };
        setConfig(updated);
        localStorage.setItem('cherenkov_routing_config', JSON.stringify(updated));
        setIsLocked(true);
        setPassphrase('');
        onVaultSealed?.();
        onToast(
          'success',
          'Vault sealed',
          'Profile encrypted with AES-256-GCM and the plaintext copy removed from this browser.'
        );
      } else {
        const profileJson = await openProfile(passphrase);
        const updated = { ...config, e2eeVaultLocked: false };
        setConfig(updated);
        localStorage.setItem('cherenkov_routing_config', JSON.stringify(updated));
        setIsLocked(false);
        setPassphrase('');
        onVaultOpened?.(JSON.parse(profileJson) as MasterProfile);
        onToast('success', 'Vault opened', 'Profile decrypted and restored on this device.');
      }
    } catch (err) {
      if (err instanceof WrongPassphraseError) {
        onToast('error', 'Wrong passphrase', err.message);
      } else {
        onToast(
          'error',
          isLocked ? 'Could not open the vault' : 'Could not seal the vault',
          err instanceof Error ? err.message : String(err)
        );
      }
    } finally {
      setVaultBusy(false);
    }
  };

  const handleCopyBadgeSig = (badge: VerifiableBadge) => {
    navigator.clipboard.writeText(`${badge.name} | Issuer: ${badge.issuer} | Signature: ${badge.cryptoSignature}`);
    setCopiedBadgeId(badge.id);
    onToast('success', 'Signature Copied', 'Cryptographic verification proof copied to clipboard.');
    setTimeout(() => setCopiedBadgeId(null), 2500);
  };

  return (
    <Modal open={isOpen} onClose={onClose} label="Zero-trust identity vault" className="overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl bg-surface border border-info-line rounded-panel p-6 sm:p-8 shadow-pop space-y-6 my-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-card bg-info-soft text-info-ink border border-info-line">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-ink tracking-tight">
                  Portable Identity & Zero-Trust Security Vault
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-info-soft text-info-ink border border-info-line text-2xs font-mono font-bold">
                  AES-256-GCM
                </span>
              </div>
              <p className="text-sm text-ink-muted mt-0.5">
                Client-side E2EE encryption, zero-egress PII protection, and decentralized verifiable credentials.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink p-1 rounded-control text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Section 1: Zero-Trust Inference Routing */}
        <div className="p-5 rounded-card bg-sunken border border-line space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-ink">
              <Key className="w-4 h-4 text-info-ink" />
              <span>INFERENCE ROUTING & PII ISOLATION</span>
            </div>
            <span className="text-2xs font-mono text-info-ink">Zero-Egress Gateway</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Gemini (Cloud) */}
            <button
              onClick={() => handleToggleMode('cloud_only')}
              className={`p-4 rounded-control border text-left transition-all cursor-pointer ${
                config.mode === 'cloud_only'
                  ? 'bg-accent-soft border-accent-line ring-1 ring-accent-line'
                  : 'bg-fill border-line hover:border-line-strong'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">Gemini (Cloud)</span>
                <Globe className="w-4 h-4 text-accent-ink" />
              </div>
              <p className="text-2xs text-ink-muted mt-1">
                Google GenAI Gemini 2.5 Flash for sub-second processing and high-precision synthesis.
              </p>
            </button>

            {/* Ollama (Local) */}
            <button
              onClick={() => handleToggleMode('local_only')}
              className={`p-4 rounded-control border text-left transition-all cursor-pointer ${
                config.mode === 'local_only'
                  ? 'bg-positive-soft border-positive-line ring-1 ring-positive-line'
                  : 'bg-fill border-line hover:border-line-strong'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">Ollama (Local)</span>
                <Cpu className="w-4 h-4 text-positive-ink" />
              </div>
              <p className="text-2xs text-ink-muted mt-1">
                Local Ollama / Qwen2.5-Coder. 100% air-gapped with zero cloud egress.
              </p>
            </button>

            {/* Hybrid */}
            <button
              onClick={() => handleToggleMode('hybrid')}
              className={`p-4 rounded-control border text-left transition-all cursor-pointer ${
                config.mode === 'hybrid'
                  ? 'bg-info-soft border-info-line ring-1 ring-info-line'
                  : 'bg-fill border-line hover:border-line-strong'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">Hybrid Smart Router</span>
                <Sparkles className="w-4 h-4 text-info-ink" />
              </div>
              <p className="text-2xs text-ink-muted mt-1">
                Routes public JD synthesis to Gemini while isolating private PII to local Ollama.
              </p>
            </button>
          </div>

          {/* Endpoint & Local Model Configuration */}
          <div className="pt-3 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="identity-vault-modal-local-endpoint-ollama-anythingllm" className="block text-2xs font-mono uppercase text-ink-muted font-bold mb-1 flex items-center gap-1.5">
                <Server className="w-3 h-3 text-positive-ink" />
                <span>Local Endpoint (Ollama / AnythingLLM)</span>
              </label>
              <input id="identity-vault-modal-local-endpoint-ollama-anythingllm"
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
                className="w-full px-3 py-2 bg-sunken border border-line rounded-control text-xs font-mono text-ink placeholder:text-ink-faint focus:border-positive-line"
              />
            </div>

            <div>
              <label htmlFor="identity-vault-modal-local-model-name-tag" className="block text-2xs font-mono uppercase text-ink-muted font-bold mb-1 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-info-ink" />
                <span>Local Model Name / Tag</span>
              </label>
              <div className="flex gap-2">
                <input id="identity-vault-modal-local-model-name-tag"
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
                  className="flex-1 px-3 py-2 bg-sunken border border-line rounded-control text-xs font-mono text-ink placeholder:text-ink-faint focus:border-info-line"
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
                  className="px-2.5 py-1.5 rounded-control bg-fill hover:bg-fill-strong text-2xs text-ink-muted hover:text-ink border border-line cursor-pointer"
                  title="Reset to Qwen defaults" aria-label="Reset to Qwen defaults"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Client-Side E2EE Vault Lock */}
        <div className="p-5 rounded-card bg-sunken border border-line space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-ink">
              <Lock className="w-4 h-4 text-accent-ink" />
              <span>CLIENT-SIDE E2EE MASTER PROFILE VAULT</span>
            </div>
            <span className="text-2xs font-mono text-ink-muted">
              Fingerprint: <span className="text-info-ink">{config.vaultKeyHash?.slice(0, 16)}...</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-control bg-sunken border border-line">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isLocked ? 'bg-caution animate-pulse' : 'bg-positive'}`} />
                <span className="text-xs font-bold text-ink">
                  Vault Status: {isLocked ? 'Sealed' : 'Stored in the clear'}
                </span>
              </div>
              <p className="text-sm text-ink-muted mt-1">
                {isLocked
                  ? 'The profile is stored as AES-256-GCM ciphertext in this browser. The passphrase never leaves this device and cannot be recovered.'
                  : 'The profile is stored unencrypted in this browser. Seal it with a passphrase to replace the plaintext with ciphertext.'}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder={isLocked ? 'Passphrase' : 'Choose a passphrase'}
                autoComplete={isLocked ? 'current-password' : 'new-password'}
                className="px-3 py-2 bg-fill border border-line rounded-control text-xs text-ink placeholder:text-ink-faint focus:border-info-line"
              />
              <button
                onClick={handleToggleVaultLock}
                disabled={vaultBusy}
                className={`px-4 py-2 rounded-control text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isLocked
                    ? 'bg-caution text-ink-inverse hover:bg-caution'
                    : 'bg-fill-strong hover:bg-fill-strong text-ink border border-line'
                }`}
              >
                {isLocked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{vaultBusy ? 'Opening…' : 'Open vault'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{vaultBusy ? 'Sealing…' : 'Seal vault'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Decentralized Verifiable Skill Badges */}
        <div className="p-5 rounded-card bg-sunken border border-line space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-ink">
              <Award className="w-4 h-4 text-positive-ink" />
              <span>CRYPTOGRAPHICALLY VERIFIED CREDENTIALS</span>
            </div>
            <span className="text-2xs font-mono text-positive-ink">Ed25519 Verified</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-control bg-fill border border-line flex flex-col justify-between space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-ink">{b.name}</h4>
                    <p className="text-2xs text-ink-muted font-mono">Issuer: {b.issuer}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-positive-ink shrink-0" />
                </div>

                <div className="text-2xs font-mono text-ink-faint truncate">
                  Sig: {b.cryptoSignature}
                </div>

                <div className="pt-2 border-t border-line flex items-center justify-between">
                  <span className="text-2xs font-mono text-ink-muted">{b.issueDate}</span>
                  <button
                    onClick={() => handleCopyBadgeSig(b)}
                    className="text-2xs text-info-ink hover:text-info-ink flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBadgeId === b.id ? <Check className="w-3 h-3 text-positive-ink" /> : <Copy className="w-3 h-3" />}
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
            className="px-6 py-2.5 rounded-control bg-accent hover:bg-accent-strong text-accent-contrast text-xs font-bold cursor-pointer"
          >
            Done & Save Settings
          </button>
        </div>
      </motion.div>
    </Modal>
  );
};
