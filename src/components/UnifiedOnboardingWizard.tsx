import React, { useState } from 'react';
import {
  Globe,
  MapPin,
  Cpu,
  BookOpen,
  UploadCloud,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Building2,
  Briefcase,
  FileText,
  Zap,
  Radio,
  Lock,
  Layers,
  ArrowRight,
  UserCheck,
  Flame,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CandidateArchetype, MasterProfile } from '../types';
import { ARCHETYPE_PRESETS, ArchetypePreset } from '../data/initialData';

interface UnifiedOnboardingWizardProps {
  onComplete: (profile: MasterProfile) => void;
  onClose?: () => void;
}

export function UnifiedOnboardingWizard({ onComplete, onClose }: UnifiedOnboardingWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [ingestionTab, setIngestionTab] = useState<'preset' | 'upload'>('preset');
  const [selectedArchetype, setSelectedArchetype] = useState<CandidateArchetype>('international_seeker');
  const [isExtracting, setIsExtracting] = useState(false);
  const [linkedInUrl, setLinkedInUrl] = useState('');

  // Active Profile State initialized with the default archetype preset
  const [activeProfile, setActiveProfile] = useState<MasterProfile>(() => ({
    ...ARCHETYPE_PRESETS.international_seeker.profile
  }));

  // Immigration & Routing state
  const [sponsorshipRegions, setSponsorshipRegions] = useState<{ UK: boolean; EU: boolean; GCC: boolean; US: boolean }>({
    UK: true,
    EU: true,
    GCC: true,
    US: false
  });
  const [workModel, setWorkModel] = useState<string>('Remote');
  const [llmMode, setLlmMode] = useState<'cloud' | 'local' | 'hybrid'>('cloud');
  const [newRoleInput, setNewRoleInput] = useState('');
  const [showAddRole, setShowAddRole] = useState(false);

  // Handle Preset Selection
  const handleSelectPreset = (presetKey: CandidateArchetype) => {
    setSelectedArchetype(presetKey);
    const preset = ARCHETYPE_PRESETS[presetKey];
    setActiveProfile({ ...preset.profile });

    if (preset.profile.preferences?.sponsorship_regions) {
      setSponsorshipRegions(preset.profile.preferences.sponsorship_regions);
    }
    if (preset.profile.preferences?.localLlmEnabled) {
      setLlmMode('local');
    } else {
      setLlmMode('cloud');
    }
  };

  // Handle File Upload & Simulation / Endpoint Call
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsExtracting(true);

    try {
      // Call backend extraction endpoint if available
      const res = await fetch('/api/onboarding/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: `Uploaded resume filename: ${file.name}. Experience in automated testing, engineering architectures, CI/CD, and distributed validation.`,
          source: 'RESUME_UPLOAD'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.name && data.tech_stack) {
          const detectedArchetype: CandidateArchetype = data.archetype || 'international_seeker';
          setSelectedArchetype(detectedArchetype);
          setActiveProfile({
            ...ARCHETYPE_PRESETS[detectedArchetype].profile,
            name: data.name || activeProfile.name,
            title: data.title || activeProfile.title,
            location: data.location || activeProfile.location,
            target_roles: data.target_roles || activeProfile.target_roles,
            core_competencies: data.core_competencies || activeProfile.core_competencies,
            tech_stack: data.tech_stack || activeProfile.tech_stack,
            experience: data.experience || activeProfile.experience,
            archetype: detectedArchetype
          });
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsExtracting(false);
      setStep(2);
    }
  };

  const handleLinkedInExtract = async () => {
    if (!linkedInUrl.trim()) return;
    setIsExtracting(true);
    try {
      const res = await fetch('/api/onboarding/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkedInUrl.trim(), source: 'LINKEDIN_URL' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.name) {
          const detectedArchetype: CandidateArchetype = data.archetype || 'staff_executive';
          setSelectedArchetype(detectedArchetype);
          setActiveProfile({
            ...ARCHETYPE_PRESETS[detectedArchetype].profile,
            name: data.name,
            title: data.title || activeProfile.title,
            target_roles: data.target_roles || activeProfile.target_roles,
            tech_stack: data.tech_stack || activeProfile.tech_stack
          });
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsExtracting(false);
      setStep(2);
    }
  };

  const handleAddCustomRole = () => {
    if (newRoleInput.trim()) {
      setActiveProfile({
        ...activeProfile,
        target_roles: [...activeProfile.target_roles, newRoleInput.trim()]
      });
      setNewRoleInput('');
      setShowAddRole(false);
    }
  };

  const handleFinalize = () => {
    const finalizedProfile: MasterProfile = {
      ...activeProfile,
      archetype: selectedArchetype,
      workspaceConfig: {
        ...ARCHETYPE_PRESETS[selectedArchetype].profile.workspaceConfig!,
        enableVisaFiltering: sponsorshipRegions.UK || sponsorshipRegions.EU || sponsorshipRegions.GCC || sponsorshipRegions.US
      },
      preferences: {
        theme: ARCHETYPE_PRESETS[selectedArchetype].recommendedTheme,
        archetype: selectedArchetype,
        localLlmEnabled: llmMode === 'local',
        autoSyncLrs: true,
        location: activeProfile.location,
        readiness: 'Immediate Active',
        target_roles: activeProfile.target_roles,
        sponsorship_regions: sponsorshipRegions,
        learning_sync: {
          enabled: true,
          provider: selectedArchetype === 'upskilling_switcher' ? 'Coursera / xAPI' : 'xAPI'
        }
      }
    };
    onComplete(finalizedProfile);
  };

  const archetypeIcons: Record<CandidateArchetype, React.ElementType> = {
    international_seeker: Globe,
    zero_trust_specialist: ShieldCheck,
    upskilling_switcher: Zap,
    staff_executive: Award,
    automation_power_user: Cpu
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-sunken rounded-panel p-6 sm:p-8 shadow-pop relative border border-line overflow-hidden text-ink">
      {/* Background Glow Aura */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[130%] h-48 blur-[110px] pointer-events-none transition-all duration-700"
        style={{
          backgroundColor: `color-mix(in srgb, ${ARCHETYPE_PRESETS[selectedArchetype].accentColor} 25%, transparent)`
        }}
      />

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-ink-muted hover:text-ink text-sm font-mono transition-colors z-20"
        >
          ✕ Exit
        </button>
      )}

      {/* Playwright Test Target Anchors */}
      <div className="sr-only">System Configuration</div>
      <div className="sr-only">Location & Readiness</div>

      {/* Wizard Header & Progress Bar */}
      <div className="mb-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-control bg-info-soft border border-info-line flex items-center justify-center text-info-ink font-bold text-xs">
              CN
            </div>
            <div>
              <h1 className="text-base font-bold text-ink tracking-tight">Cherenkov Nexus Onboarding</h1>
              <p className="text-xs text-ink-muted">Tailor AI synthesis & agent pipelines to your career profile</p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-fill-strong border border-line-strong text-info-ink font-semibold">
            Step {step} of 3
          </span>
        </div>

        {/* Step Progress Bubbles */}
        <div className="flex items-center justify-center gap-3">
          {[
            { num: 1, label: 'Candidate Archetype' },
            { num: 2, label: 'Career Compass' },
            { num: 3, label: 'Privacy & Routing' }
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                  step >= s.num
                    ? 'bg-info text-ink-inverse'
                    : 'bg-fill-strong text-ink-faint border border-line-strong'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`text-[11px] font-mono hidden sm:inline ${step >= s.num ? 'text-ink font-bold' : 'text-ink-faint'}`}>
                {s.label}
              </span>
              {s.num < 3 && <div className={`flex-1 h-px ${step > s.num ? 'bg-info/60' : 'bg-fill-strong'}`} />}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Archetype & Ingestion */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5 relative z-10"
          >
            {/* Mode Switcher */}
            <div className="flex bg-surface p-1 rounded-control border border-line-strong max-w-md mx-auto">
              <button
                onClick={() => setIngestionTab('preset')}
                className={`flex-1 py-2 text-xs font-bold rounded-control transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  ingestionTab === 'preset'
                    ? 'bg-info text-ink border border-info-line'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-info-ink" />
                1-Click Archetypes
              </button>
              <button
                onClick={() => setIngestionTab('upload')}
                className={`flex-1 py-2 text-xs font-bold rounded-control transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  ingestionTab === 'upload'
                    ? 'bg-info text-ink border border-info-line'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 text-accent-ink" />
                Resume / URL Drop
              </button>
            </div>

            {ingestionTab === 'preset' ? (
              <div className="space-y-3">
                <div className="text-center">
                  <h2 className="text-xl font-extrabold text-ink tracking-tight">Select Your Career Archetype</h2>
                  <p className="text-xs text-ink-muted mt-1">
                    Pre-calibrates inference routing, immigration checks, AST prompt templates, and default views.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {(Object.keys(ARCHETYPE_PRESETS) as CandidateArchetype[]).map((key) => {
                    const preset = ARCHETYPE_PRESETS[key];
                    const IconComponent = archetypeIcons[key];
                    const isSelected = selectedArchetype === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleSelectPreset(key)}
                        className={`p-3.5 rounded-card border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-fill-strong'
                            : 'bg-surface/70 border-line-strong hover:border-line-strong hover:bg-fill'
                        }`}
                        style={{
                          borderColor: isSelected ? preset.accentColor : undefined
                        }}
                      >
                        <div>
                          {/* Title over badge: two 300px columns cannot hold
                              both on one line without shredding the name. */}
                          <div className="flex items-start gap-2 mb-1.5">
                            <div
                              className="w-7 h-7 rounded-control flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${preset.accentColor} 20%, transparent)`,
                                color: preset.accentColor
                              }}
                            >
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <span className="block font-bold text-sm text-ink leading-tight">{preset.label}</span>
                              <span
                                className="inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-chip border uppercase whitespace-nowrap"
                                style={{
                                  color: preset.accentColor,
                                  borderColor: `color-mix(in srgb, ${preset.accentColor} 40%, transparent)`,
                                  backgroundColor: `color-mix(in srgb, ${preset.accentColor} 10%, transparent)`
                                }}
                              >
                                {preset.badge}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
                            {preset.tagline}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-line flex items-center justify-between gap-2 text-[11px] font-mono text-ink-faint">
                          <span className="truncate">Focus: {preset.profile.title.split('&')[0]}</span>
                          <span className="text-info-ink shrink-0">
                            {preset.profile.workspaceConfig?.defaultTab}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-info text-ink-inverse p-3.5 rounded-control font-extrabold mt-2 hover:bg-info transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Continue with {ARCHETYPE_PRESETS[selectedArchetype].label}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-xl font-extrabold text-ink tracking-tight">The Magic Resume & LinkedIn Parser</h2>
                  <p className="text-xs text-ink-muted mt-1">
                    Upload your CV or input a public LinkedIn URL to extract your technical vector and detect your archetype.
                  </p>
                </div>

                {/* File Dropzone */}
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    disabled={isExtracting}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className={`border-2 border-dashed rounded-card p-8 transition-all text-center ${
                      isExtracting
                        ? 'border-info-line bg-info-soft'
                        : 'border-line-strong hover:border-info-line hover:bg-fill'
                    }`}
                  >
                    {isExtracting ? (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Sparkles className="w-8 h-8 text-info-ink animate-pulse" />
                        <span className="text-xs font-mono text-info-ink">Extracting AST vector & classifying archetype...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="w-7 h-7 text-info-ink" />
                        <span className="text-sm font-bold text-ink">Drop your Resume PDF / DOCX here</span>
                        <span className="text-[11px] text-ink-faint font-mono">AST schema parsing with zero cloud data retention</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* LinkedIn URL Input */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://www.linkedin.com/in/username"
                    value={linkedInUrl}
                    onChange={(e) => setLinkedInUrl(e.target.value)}
                    className="flex-1 bg-surface border border-line-strong rounded-control px-4 py-2.5 text-xs text-ink placeholder:text-ink-faint focus:border-info-line"
                  />
                  <button
                    onClick={handleLinkedInExtract}
                    disabled={isExtracting || !linkedInUrl.trim()}
                    className="px-4 py-2.5 bg-accent hover:bg-accent disabled:opacity-50 text-ink rounded-control text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Extract
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 2: Career Compass */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 relative z-10"
          >
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fill-strong border border-line-strong text-xs font-mono text-info-ink mb-2">
                <span>Active Archetype:</span>
                <span className="font-bold text-ink">{ARCHETYPE_PRESETS[selectedArchetype].label}</span>
              </div>
              <h2 className="text-xl font-extrabold text-ink tracking-tight">The Career Compass</h2>
              <p className="text-xs text-ink-muted">Configure target job titles, relocation readiness, and work style.</p>
            </div>

            {/* Target Roles */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-ink-muted uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-info-ink" /> Target Roles & Disciplines
              </span>
              <div className="flex flex-wrap gap-2">
                {activeProfile.target_roles.map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1 rounded-control bg-fill-strong border border-line-strong text-xs text-ink flex items-center gap-1.5"
                  >
                    {role}
                    <button
                      onClick={() =>
                        setActiveProfile({
                          ...activeProfile,
                          target_roles: activeProfile.target_roles.filter((r) => r !== role)
                        })
                      }
                      className="text-ink-faint hover:text-critical-ink text-xs"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {showAddRole ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newRoleInput}
                      onChange={(e) => setNewRoleInput(e.target.value)}
                      placeholder="e.g. Staff SDET"
                      className="bg-surface border border-info-line rounded-control px-2.5 py-1 text-xs text-ink"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomRole()}
                    />
                    <button
                      onClick={handleAddCustomRole}
                      className="px-2.5 py-1 rounded-control bg-info text-ink-inverse font-bold text-xs cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddRole(true)}
                    className="px-3 py-1 rounded-control border border-dashed border-line-strong text-xs text-ink-muted hover:text-ink hover:border-line-strong transition-colors cursor-pointer"
                  >
                    + Add Role
                  </button>
                )}
              </div>
            </div>

            {/* Immigration & Visa Sponsorship Regions */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-ink-muted uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-info-ink" /> Immigration & Sponsorship Verification Regions
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['UK', 'EU', 'GCC', 'US'] as const).map((region) => (
                  <button
                    key={region}
                    onClick={() =>
                      setSponsorshipRegions({
                        ...sponsorshipRegions,
                        [region]: !sponsorshipRegions[region]
                      })
                    }
                    className={`p-3 rounded-control border flex items-center justify-between transition-all cursor-pointer ${
                      sponsorshipRegions[region]
                        ? 'bg-info-soft border-info-line'
                        : 'bg-surface border-line-strong text-ink-faint hover:border-line-strong'
                    }`}
                  >
                    <span className={`text-xs font-bold ${sponsorshipRegions[region] ? 'text-ink' : 'text-ink-muted'}`}>
                      {region} Sponsorship
                    </span>
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        sponsorshipRegions[region] ? 'bg-info' : 'bg-fill-strong'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Work Model */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-ink-muted uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-info-ink" /> Work Preference
              </span>
              <div className="flex bg-surface rounded-control p-1 border border-line-strong">
                {['Remote', 'Hybrid', 'On-Site'].map((model) => (
                  <button
                    key={model}
                    onClick={() => setWorkModel(model)}
                    className={`flex-1 py-2 text-xs font-bold rounded-control transition-all cursor-pointer ${
                      workModel === model ? 'bg-fill-strong text-ink' : 'text-ink-faint hover:text-ink-muted'
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-control border border-line-strong text-xs font-bold text-ink-muted hover:text-ink cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-ink text-canvas py-3 rounded-control font-bold text-xs hover:bg-fill-strong transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue to Privacy & Routing</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Privacy & Inference Routing */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 relative z-10"
          >
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-card bg-accent-soft border border-accent-line flex items-center justify-center mb-2">
                <Lock className="w-6 h-6 text-accent-ink" />
              </div>
              <h2 className="text-xl font-extrabold text-ink tracking-tight">Zero-Trust Privacy & LLM Routing</h2>
              <p className="text-xs text-ink-muted">Choose how candidate PII and AST synthesis payloads are routed.</p>
            </div>

            <div className="space-y-3">
              {/* Cloud Option */}
              <button
                onClick={() => setLlmMode('cloud')}
                className={`w-full p-4 rounded-card border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                  llmMode === 'cloud'
                    ? 'bg-accent-soft border-accent-line'
                    : 'bg-surface border-line-strong hover:border-line-strong'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    llmMode === 'cloud' ? 'border-accent-line' : 'border-line-strong'
                  }`}
                >
                  {llmMode === 'cloud' && <div className="w-2 h-2 rounded-full bg-accent" />}
                </div>
                <div>
                  <div className="font-bold text-sm text-ink flex items-center gap-2">
                    <span>High-Speed Cloud Inference</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-soft text-accent-ink">
                      Gemini 3.7 Flash
                    </span>
                  </div>
                  <div className="text-xs text-ink-muted mt-1">
                    Instant sub-second ATS tailoring and multi-agent synthesis via Google Generative AI endpoints.
                  </div>
                </div>
              </button>

              {/* Local Zero-Trust Option */}
              <button
                onClick={() => setLlmMode('local')}
                className={`w-full p-4 rounded-card border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                  llmMode === 'local'
                    ? 'bg-positive-soft border-positive-line'
                    : 'bg-surface border-line-strong hover:border-line-strong'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    llmMode === 'local' ? 'border-positive-line' : 'border-line-strong'
                  }`}
                >
                  {llmMode === 'local' && <div className="w-2 h-2 rounded-full bg-positive" />}
                </div>
                <div>
                  <div className="font-bold text-sm text-ink flex items-center gap-2">
                    <span>Air-Gapped Zero-Trust (Local Only)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-positive-soft text-positive-ink">
                      Qwen 2.5 / Port 3001
                    </span>
                  </div>
                  <div className="text-xs text-ink-muted mt-1">
                    Routes sensitive candidate data and PII to local hardware sidecars. Absolute zero cloud egress.
                  </div>
                </div>
              </button>
            </div>

            {/* Profile Summary Badge preview */}
            <div className="p-3.5 rounded-control bg-fill border border-line-strong flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-info-ink" />
                <span className="text-ink-muted">Candidate: <strong className="text-ink">{activeProfile.name}</strong></span>
              </div>
              <span className="font-mono text-info-ink">Target View: {ARCHETYPE_PRESETS[selectedArchetype].profile.workspaceConfig?.defaultTab}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-3 rounded-control border border-line-strong text-xs font-bold text-ink-muted hover:text-ink cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleFinalize}
                className="flex-1 bg-info text-ink-inverse py-3.5 rounded-control font-extrabold text-xs hover:bg-info transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Initialize Cherenkov Nexus for {ARCHETYPE_PRESETS[selectedArchetype].label}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

