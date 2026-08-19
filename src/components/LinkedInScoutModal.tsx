import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterProfile, LinkedInScoutResult } from '../types';
import {
  Linkedin,
  Search,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  Mail,
  UserCheck,
  Building2,
  FileText,
  Clock,
  ThumbsUp,
  X,
  Zap,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface LinkedInScoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterProfile: MasterProfile;
  defaultCompany?: string;
  defaultRole?: string;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

const PRESET_RECRUITERS = [
  {
    company: 'Monzo Bank',
    url: 'https://linkedin.com/in/sarah-jenkins-monzo-qa-lead',
    name: 'Sarah Jenkins',
    role: 'Lead Engineering Recruiter & QA Talent'
  },
  {
    company: 'Revolut',
    url: 'https://linkedin.com/in/alex-rivas-revolut-sdet-hiring',
    name: 'Alex Rivas',
    role: 'Staff Technical Talent Partner'
  },
  {
    company: 'Deliveroo',
    url: 'https://linkedin.com/in/olivia-chen-deliveroo-talent',
    name: 'Olivia Chen',
    role: 'Head of Quality Engineering Recruitment'
  }
];

export const LinkedInScoutModal: React.FC<LinkedInScoutModalProps> = ({
  isOpen,
  onClose,
  masterProfile,
  defaultCompany = '',
  defaultRole = 'Senior QA Lead',
  onToast
}) => {
  const [profileUrl, setProfileUrl] = useState('');
  const [company, setCompany] = useState(defaultCompany);
  const [targetRole, setTargetRole] = useState(defaultRole);
  const [recruiterName, setRecruiterName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scoutResult, setScoutResult] = useState<LinkedInScoutResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [scoutStep, setScoutStep] = useState<string>('');

  const handleRunScout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setScoutResult(null);

    setScoutStep('Initializing LinkedIn Scout MCP Session...');
    await new Promise((r) => setTimeout(r, 400));
    setScoutStep('Fetching Recruiter Profile & Recent Technical Publications...');
    await new Promise((r) => setTimeout(r, 500));
    setScoutStep('Cross-referencing Master Profile AST & cherenkov-qa Invariants...');

    try {
      const res = await fetch('/api/mcp/linkedin-scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileUrl: profileUrl.trim() || undefined,
          company: company.trim() || 'Tech Enterprise',
          recruiterName: recruiterName.trim() || undefined,
          targetRole: targetRole.trim() || 'Senior QA Automation Lead',
          candidateProfile: masterProfile
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: LinkedInScoutResult = await res.json();
      setScoutResult(data);
      onToast(
        'success',
        'Scout Completed',
        `Extracted technical dossier for ${data.recruiterName} (${data.recruiter_profile_status === 'live' ? 'LIVE profile' : 'simulated intel'}).`
      );
    } catch (err: any) {
      console.error('Scout failed:', err);
      onToast('error', 'Scout Failed', 'Could not extract recruiter profile. Retrying with deterministic engine.');
    } finally {
      setIsLoading(false);
      setScoutStep('');
    }
  };

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onToast('success', 'Copied', `${label} copied to clipboard.`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLaunchEmail = (recipient: string, subject: string, body: string) => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    window.location.href = `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;
    onToast('info', 'Launching Mail', 'Opening default email client with tailored outreach.');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-3xl max-h-[90vh] bg-surface border border-accent2-line rounded-panel shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-sunken">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-card bg-accent2-soft text-accent2-ink border border-accent2-line flex items-center justify-center shadow-md">
                <Linkedin className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-ink">LinkedIn Scout MCP Agent</h3>
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-accent2-soft text-accent2-ink border border-accent2-line rounded-full">
                    2026-07-28 SPEC
                  </span>
                </div>
                <p className="text-xs text-ink-muted">
                  Extracts recruiter technical posts to synthesize hyper-personalized cold outreach pitches.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-ink-muted hover:text-ink rounded-control hover:bg-fill-strong transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Input Form */}
            <form onSubmit={handleRunScout} className="p-5 rounded-card bg-sunken border border-line space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-1 font-mono uppercase">
                  Recruiter / Hiring Manager LinkedIn URL or Name
                </label>
                <div className="relative">
                  <Linkedin className="w-4 h-4 absolute left-3.5 top-3.5 text-accent2-ink" />
                  <input
                    type="text"
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    placeholder="e.g. https://linkedin.com/in/sarah-jenkins-talent or Sarah Jenkins"
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-surface border border-line rounded-control text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent2-line"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-muted mb-1 font-mono uppercase">
                    Target Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Monzo Bank, Wise, Revolut"
                    className="w-full px-3.5 py-2 text-xs bg-surface border border-line rounded-control text-ink focus:outline-none focus:border-accent2-line"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-muted mb-1 font-mono uppercase">
                    Target Role
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior QA Lead / SDET Lead"
                    className="w-full px-3.5 py-2 text-xs bg-surface border border-line rounded-control text-ink focus:outline-none focus:border-accent2-line"
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                  <span>Quick Presets:</span>
                  {PRESET_RECRUITERS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setCompany(preset.company);
                        setProfileUrl(preset.url);
                        setRecruiterName(preset.name);
                      }}
                      className="px-2 py-0.5 text-[10px] font-mono bg-fill hover:bg-accent2-soft text-ink-muted hover:text-accent2-ink rounded-control border border-line cursor-pointer"
                    >
                      {preset.company}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 text-xs font-bold text-ink bg-gradient-to-r from-accent2 to-info hover:from-accent2 hover:to-info disabled:opacity-50 rounded-control transition-all shadow-md flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Executing Scout...' : 'Run LinkedIn Scout MCP'}</span>
                </button>
              </div>

              {/* Step indicator */}
              {isLoading && (
                <div className="p-3 rounded-control bg-accent2-soft border border-accent2-line text-accent2-ink text-xs font-mono flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent2 animate-ping" />
                  <span>{scoutStep}</span>
                </div>
              )}
            </form>

            {/* Extracted Scout Dossier */}
            {scoutResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Recruiter Dossier Card */}
                <div className="p-5 rounded-card bg-sunken border border-accent2-line space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-card bg-accent2-soft border border-accent2-line text-accent2-ink flex items-center justify-center font-bold text-lg font-mono">
                        {scoutResult.recruiterName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                          {scoutResult.recruiterName}
                          <UserCheck className="w-4 h-4 text-accent2-ink" />
                          {scoutResult.recruiter_profile_status && (
                            <span
                              className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full border flex items-center gap-1 ${
                                scoutResult.recruiter_profile_status === 'live'
                                  ? 'bg-positive-soft text-positive-ink border-positive-line'
                                  : 'bg-caution-soft text-caution-ink border-caution-line'
                              }`}
                              title={scoutResult.scoutNotes ?? ''}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${scoutResult.recruiter_profile_status === 'live' ? 'bg-positive' : 'bg-caution'}`}
                              />
                              {scoutResult.recruiter_profile_status === 'live' ? 'LIVE' : 'SIMULATED'}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-ink-muted">{scoutResult.recruiterTitle}</p>
                        <p className="text-[11px] text-ink-faint font-mono mt-0.5">{scoutResult.location}</p>
                      </div>
                    </div>

                    <a
                      href={scoutResult.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-mono text-accent2-ink bg-accent2-soft hover:bg-accent2-soft border border-accent2-line rounded-control flex items-center gap-1 transition-colors"
                    >
                      <span>LinkedIn</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Technical Focus Badges */}
                  <div>
                    <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider block mb-1.5">
                      Extracted Technical Focus & Alignment Nodes
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {scoutResult.technicalFocus.map((tf, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 text-[11px] font-mono font-bold bg-accent2-soft text-accent2-ink border border-accent2-line rounded-control"
                        >
                          {tf}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recent Technical Posts Extracted */}
                  {scoutResult.recentPosts && scoutResult.recentPosts.length > 0 && (
                    <div className="pt-3 border-t border-line space-y-2.5">
                      <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider block">
                        Recent Public Posts & Engineering Signals
                      </span>
                      {scoutResult.recentPosts.map((post) => (
                        <div
                          key={post.id}
                          className="p-3.5 rounded-control bg-fill border border-line space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-ink text-xs">{post.title}</span>
                            <span className="text-[10px] font-mono text-ink-faint">{post.date}</span>
                          </div>
                          <p className="text-xs text-ink-muted leading-relaxed font-sans italic">
                            "{post.snippet}"
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-ink-muted">
                            <span className="px-2 py-0.5 bg-accent2-soft text-accent2-ink rounded">
                              Topic: {post.topic}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3 text-accent2-ink" />
                              {post.likes} reactions
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Personalized Outreach Pitch */}
                <div className="p-5 rounded-card bg-gradient-to-br from-surface via-sunken to-sunken border border-accent-line space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-accent-ink uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-accent-ink" />
                        <span>Synthesized Cold Outreach Pitch</span>
                      </h4>
                      <p className="text-[11px] text-ink-muted">
                        {scoutResult.personalizedOutreach.hookReason}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleCopy(
                            scoutResult.personalizedOutreach.body,
                            'scout-pitch',
                            'Outreach Pitch'
                          )
                        }
                        className="px-3 py-1.5 text-xs bg-fill hover:bg-fill-strong text-ink rounded-control border border-line flex items-center gap-1.5 cursor-pointer font-medium"
                      >
                        {copiedKey === 'scout-pitch' ? (
                          <Check className="w-3.5 h-3.5 text-positive-ink" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-accent-ink" />
                        )}
                        <span>Copy Pitch</span>
                      </button>

                      <button
                        onClick={() =>
                          handleLaunchEmail(
                            'recruiter@company.com',
                            scoutResult.personalizedOutreach.subject,
                            scoutResult.personalizedOutreach.body
                          )
                        }
                        className="px-4 py-1.5 text-xs font-bold text-ink bg-gradient-to-r from-accent to-info hover:from-accent hover:to-info rounded-control shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Launch Mail</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-control bg-sunken border border-line text-xs font-mono text-ink whitespace-pre-wrap leading-relaxed">
                    <div className="text-ink-muted pb-2 mb-2 border-b border-line">
                      Subject: <span className="text-ink font-bold">{scoutResult.personalizedOutreach.subject}</span>
                    </div>
                    {scoutResult.personalizedOutreach.body}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
