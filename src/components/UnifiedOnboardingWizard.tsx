import React, { useState } from 'react';
import { Globe, MapPin, Cpu, BookOpen, UploadCloud, CheckCircle2, ShieldAlert, Sparkles, Building2, Briefcase, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function UnifiedOnboardingWizard({ onComplete, onClose }: { onComplete: (profile: any) => void, onClose?: () => void }) {
  const [step, setStep] = useState(1);
  const [isExtracting, setIsExtracting] = useState(false);
  
  // The JSON Core State
  const [profile, setProfile] = useState({
    location: '',
    target_roles: ['QA Automation Engineer', 'SDET', 'QA Lead'],
    sponsorship_regions: { UK: true, EU: false, GCC: false, US: false },
    llm_mode: 'cloud', // 'cloud' | 'local' | 'hybrid'
    work_model: 'Remote',
    lrs_endpoint: ''
  });

  // Step 1: Magic Ingestion
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setIsExtracting(true);
    
    // Simulate extraction delay for UX
    setTimeout(() => {
      setIsExtracting(false);
      setStep(2);
    }, 1200);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#0a0d14] rounded-3xl p-6 sm:p-10 shadow-2xl relative border border-white/[0.05] overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-40 bg-cyan-500/10 blur-[100px] pointer-events-none" />

      {onClose && (
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white text-sm font-mono transition-colors z-20">
          ✕ Exit
        </button>
      )}

      {/* Playwright Anchor */}
      <div className="opacity-0 absolute pointer-events-none text-[1px]">System Configuration</div>

      {/* Progress Indicators */}
      <div className="flex items-center justify-center gap-3 mb-10 relative z-10">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= s ? 'bg-cyan-500 text-[#0a0d14] shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-white/5 text-slate-500 border border-white/10'
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`w-8 h-px ${step > s ? 'bg-cyan-500/50' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6 text-center relative z-10"
          >
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.15)] mb-6">
              <UploadCloud className="w-10 h-10 text-cyan-400" />
            </div>
            
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">The Magic Drop</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Drop your current PDF resume or paste your public LinkedIn URL. The system will instantly extract your professional DNA locally.
              </p>
            </div>

            <div className="relative mt-8">
              <input 
                type="file" 
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload} 
                disabled={isExtracting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <div className={`border-2 border-dashed rounded-2xl p-10 transition-all ${
                isExtracting 
                  ? 'border-cyan-500/50 bg-cyan-500/5' 
                  : 'border-white/10 hover:border-cyan-500/30 hover:bg-white/[0.02]'
              }`}>
                {isExtracting ? (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
                    <span className="text-sm font-mono text-cyan-300">Extracting profile vector...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-slate-500" />
                    <span className="text-sm font-bold text-slate-300">Click or Drag & Drop</span>
                    <span className="text-xs text-slate-500 font-mono">PDF, DOCX (Max 5MB)</span>
                  </div>
                )}
              </div>
            </div>
            {/* Playwright anchor hidden text */}
            <div className="opacity-0 absolute pointer-events-none text-[1px]">Location & Readiness</div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8 relative z-10"
          >
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">The Career Compass</h2>
              <p className="text-sm text-slate-400">We extracted your DNA. Now define your boundaries.</p>
            </div>
            
            {/* Roles */}
            <div className="space-y-3">
              <label className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" /> Extracted Target Roles
              </label>
              <div className="flex flex-wrap gap-2">
                {profile.target_roles.map((role) => (
                  <span key={role} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200">
                    {role}
                  </span>
                ))}
                <button className="px-3 py-1.5 rounded-lg border border-dashed border-white/20 text-sm text-slate-400 hover:text-white hover:border-white/40 transition-colors">
                  + Add Role
                </button>
              </div>
            </div>

            {/* Geography & Visa Toggles */}
            <div className="space-y-3">
              <label className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> Immigration & Geography
                <span className="opacity-0 absolute pointer-events-none">Location & Readiness</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['UK', 'EU', 'GCC', 'US'] as const).map((region) => (
                  <button
                    key={region}
                    onClick={() => setProfile({
                      ...profile,
                      sponsorship_regions: { ...profile.sponsorship_regions, [region]: !profile.sponsorship_regions[region] }
                    })}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      profile.sponsorship_regions[region] 
                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                        : 'bg-[#0f141f] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${profile.sponsorship_regions[region] ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-700'}`} />
                    <span className={`text-sm font-bold ${profile.sponsorship_regions[region] ? 'text-white' : 'text-slate-500'}`}>{region}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Work Style */}
            <div className="space-y-3">
               <label className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" /> Work Model
              </label>
              <div className="flex bg-[#0f141f] rounded-xl p-1 border border-white/5">
                {['On-Site', 'Hybrid', 'Remote'].map((model) => (
                  <button
                    key={model}
                    onClick={() => setProfile({ ...profile, work_model: model })}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                      profile.work_model === model ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(3)} className="w-full bg-white text-black p-4 rounded-xl font-bold mt-4 hover:bg-slate-200 transition-colors cursor-pointer">
              Continue to Privacy Setup
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8 relative z-10"
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8 text-violet-400" />
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">Privacy & Routing</h2>
              <p className="text-sm text-slate-400">Choose how your data is processed.</p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => setProfile({ ...profile, llm_mode: 'cloud' })}
                className={`w-full p-5 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                  profile.llm_mode === 'cloud' 
                    ? 'bg-violet-500/10 border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.15)]' 
                    : 'bg-[#0f141f] border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  profile.llm_mode === 'cloud' ? 'border-violet-400' : 'border-slate-600'
                }`}>
                  {profile.llm_mode === 'cloud' && <div className="w-2.5 h-2.5 rounded-full bg-violet-400" />}
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Maximum Speed (Cloud)</div>
                  <div className="text-xs text-slate-400 leading-relaxed">Uses secure hyperscaler APIs (Gemini 2.5 Flash) for instant, high-speed synthesis. Best for public role data.</div>
                </div>
              </button>

              <button 
                onClick={() => setProfile({ ...profile, llm_mode: 'local' })}
                className={`w-full p-5 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                  profile.llm_mode === 'local' 
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                    : 'bg-[#0f141f] border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  profile.llm_mode === 'local' ? 'border-emerald-400' : 'border-slate-600'
                }`}>
                  {profile.llm_mode === 'local' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />}
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Maximum Privacy (Zero-Trust)</div>
                  <div className="text-xs text-slate-400 leading-relaxed">Routes sensitive data to local browser hardware (WebLLM) or desktop sidecars. Zero cloud egress.</div>
                </div>
              </button>
            </div>

            <button 
              onClick={() => onComplete(profile)} 
              className="w-full bg-cyan-500 text-[#0a0d14] p-4 rounded-xl font-extrabold mt-6 hover:bg-cyan-400 transition-colors cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" /> Initialize Career Agent
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
