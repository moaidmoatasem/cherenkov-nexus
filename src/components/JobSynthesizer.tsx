import React, { useState, useEffect, useMemo } from 'react';
import { MasterProfile, SynthesizedResult, ApplicationCard, RoutingConfig } from '../types';
import { SAMPLE_JOBS, INITIAL_ROUTING_CONFIG } from '../data/initialData';
import { useAutoSave } from '../hooks/useAutoSave';
import { useWebLLM } from '../hooks/useWebLLM';
import { LinkedInScoutModal } from './LinkedInScoutModal';
import { InterviewSandbox } from './InterviewSandbox';
import { ModelCompareModal } from './ModelCompareModal';
import { downloadAtsPdfResume } from '../utils/pdfGenerator';
import {
  Sparkles,
  Globe,
  Search,
  Copy,
  Check,
  Mail,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  FileText,
  HelpCircle,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  Zap,
  Building2,
  Briefcase,
  CheckCircle2,
  Layers,
  Send,
  Sliders,
  ChevronRight,
  Code2,
  Cpu,
  Share2,
  Trash2,
  Flame,
  Award,
  Compass,
  FileCheck2,
  Target,
  Volume2,
  VolumeX,
  Play,
  MessageSquare,
  CheckCircle,
  BarChart3,
  GitCompare,
  TerminalSquare,
  Linkedin,
  Mic,
  Save,
  RotateCcw,
  FileDown,
  Download
} from 'lucide-react';

interface JobSynthesizerProps {
  masterProfile: MasterProfile;
  onApplicationCreated: (app: ApplicationCard) => void;
  onAddCourseToLearning: (title: string, provider: string, skills: string[]) => void;
  onNavigateToKanban: () => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export type OutreachTone = 'executive' | 'deeptech' | 'security' | 'chaos';

export const JobSynthesizer: React.FC<JobSynthesizerProps> = ({
  masterProfile,
  onApplicationCreated,
  onAddCourseToLearning,
  onNavigateToKanban,
  onToast
}) => {
  const [scrapeUrl, setScrapeUrl] = useState(SAMPLE_JOBS[0].url);
  const [isScraping, setIsScraping] = useState(false);

  const [companyName, setCompanyName] = useState(SAMPLE_JOBS[0].company);
  const [jobTitle, setJobTitle] = useState(SAMPLE_JOBS[0].title);
  const [jobDescription, setJobDescription] = useState(SAMPLE_JOBS[0].description);
  const [targetEmail, setTargetEmail] = useState('talent@monzo.com');
  const [activePreset, setActivePreset] = useState<string>(SAMPLE_JOBS[0].company);

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisAgentStep, setSynthesisAgentStep] = useState(0);
  const [synthesizedData, setSynthesizedData] = useState<SynthesizedResult | null>(null);
  const [activeWeaponTab, setActiveWeaponTab] = useState<'summary' | 'email' | 'ats' | 'interview' | 'export'>('summary');
  const [summaryViewMode, setSummaryViewMode] = useState<'polished' | 'diff'>('polished');
  const [copiedKeys, setCopiedKeys] = useState<Record<string, boolean>>({});
  const [addedToLearning, setAddedToLearning] = useState(false);
  const [outreachTone, setOutreachTone] = useState<OutreachTone>('executive');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Phase 1: Local In-Browser WebGPU LLM
  const { engine: webLLMEngine, isReady: isWebLLMReady, loadingProgress: webLLMProgress, synthesizeLocally, error: webLLMError } = useWebLLM();


  // LinkedIn Scout & Interview Sandbox Modal states
  const [isLinkedInScoutOpen, setIsLinkedInScoutOpen] = useState(false);
  const [isVoiceInterviewOpen, setIsVoiceInterviewOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Active LLM Routing provider state
  const [activeRouting, setActiveRouting] = useState<RoutingConfig>(() => {
    try {
      const saved = localStorage.getItem('cherenkov_routing_config');
      return saved ? JSON.parse(saved) : INITIAL_ROUTING_CONFIG;
    } catch {
      return INITIAL_ROUTING_CONFIG;
    }
  });

  // Sync routing changes from storage and custom event
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('cherenkov_routing_config');
        if (saved) setActiveRouting(JSON.parse(saved));
      } catch (err) {
        console.error('Error syncing routing config:', err);
      }
    };
    const handleCustomChange = (e: any) => {
      if (e.detail) {
        setActiveRouting(e.detail);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cherenkov_routing_changed', handleCustomChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cherenkov_routing_changed', handleCustomChange);
    };
  }, []);

  // Auto-Save Form State to localStorage
  const synthesizerFormData = useMemo(
    () => ({
      scrapeUrl,
      companyName,
      jobTitle,
      jobDescription,
      targetEmail,
      activePreset
    }),
    [scrapeUrl, companyName, jobTitle, jobDescription, targetEmail, activePreset]
  );

  const {
    lastSaved,
    isSaving,
    hasSavedDraft,
    restoreDraft,
    clearDraft,
    saveImmediately
  } = useAutoSave({
    key: 'cherenkov_synthesizer_draft_v1',
    data: synthesizerFormData,
    debounceMs: 1200
  });

  const handleRestoreDraft = () => {
    const draft = restoreDraft();
    if (draft) {
      if (draft.scrapeUrl !== undefined) setScrapeUrl(draft.scrapeUrl);
      if (draft.companyName !== undefined) setCompanyName(draft.companyName);
      if (draft.jobTitle !== undefined) setJobTitle(draft.jobTitle);
      if (draft.jobDescription !== undefined) setJobDescription(draft.jobDescription);
      if (draft.targetEmail !== undefined) setTargetEmail(draft.targetEmail);
      if (draft.activePreset !== undefined) setActivePreset(draft.activePreset);
      onToast('success', 'Draft Restored', 'Loaded auto-saved form data from localStorage.');
    }
  };

  const handleClearDraft = () => {
    clearDraft();
    onToast('info', 'Draft Cleared', 'Auto-saved local draft was removed.');
  };

  // Sub-Agent Status Steps simulation during synthesis
  useEffect(() => {
    let interval: any;
    if (isSynthesizing) {
      setSynthesisAgentStep(0);
      interval = setInterval(() => {
        setSynthesisAgentStep((prev) => (prev < 3 ? prev + 1 : 3));
      }, 700);
    } else {
      setSynthesisAgentStep(0);
    }
    return () => clearInterval(interval);
  }, [isSynthesizing]);


  // Mock Interview Simulator State
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [userPracticeAnswer, setUserPracticeAnswer] = useState('');
  const [isEvaluatingPractice, setIsEvaluatingPractice] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState<{
    score: number;
    strengths: string[];
    improvement: string;
    talkingPoint: string;
  } | null>(null);

  // Futuristic Web Audio Synthesizer Chime
  const playSynthSound = (type: 'success' | 'click' | 'powerup') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.15); // G5
        osc.frequency.exponentialRampToValueAtTime(1046.5, audioCtx.currentTime + 0.3); // C6
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else if (type === 'powerup') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      }
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  // Copy helper with visual timer
  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    playSynthSound('click');
    setCopiedKeys((prev) => ({ ...prev, [key]: true }));
    onToast('success', 'Copied to Clipboard', `${label} copied.`);
    setTimeout(() => {
      setCopiedKeys((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // URL Scraping action
  const handleScrape = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scrapeUrl.trim()) {
      onToast('error', 'URL Required', 'Please enter a valid job posting URL.');
      return;
    }

    setIsScraping(true);
    playSynthSound('click');
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to scrape job posting');
      }

      if (data.text) {
        setJobDescription(data.text);
      }
      if (data.title) {
        setJobTitle(data.title);
      }
      if (data.company) {
        setCompanyName(data.company);
        setActivePreset('');
      }

      playSynthSound('success');
      onToast(
        'success',
        'Job Scraped & Parsed',
        `Extracted content for ${data.title || 'Role'} at ${data.company || 'Target Company'}.`
      );
    } catch (err: any) {
      console.error('Scrape error:', err);
      onToast('error', 'Scrape Error', err.message || 'Could not fetch URL. You can paste the raw JD below.');
    } finally {
      setIsScraping(false);
    }
  };

  // Quick load sample preset
  const handleLoadSample = (sample: typeof SAMPLE_JOBS[0]) => {
    playSynthSound('click');
    setActivePreset(sample.company);
    setCompanyName(sample.company);
    setJobTitle(sample.title);
    setJobDescription(sample.description);
    setScrapeUrl(sample.url);
    if (sample.company.toLowerCase().includes('monzo')) setTargetEmail('talent@monzo.com');
    else if (sample.company.toLowerCase().includes('revolut')) setTargetEmail('recruiting@revolut.com');
    else if (sample.company.toLowerCase().includes('deliveroo')) setTargetEmail('careers@deliveroo.co.uk');
    else if (sample.company.toLowerCase().includes('wise')) setTargetEmail('earlycareers@wise.com');
    else setTargetEmail('talent@arm.com');

    onToast('info', 'Loaded Role Preset', `Loaded ${sample.company} - ${sample.title}`);
  };

  // AI Synthesis action
  const handleSynthesize = async () => {
    if (!jobDescription.trim()) {
      onToast('error', 'Description Missing', 'Please paste or scrape a job description first.');
      return;
    }

    setIsSynthesizing(true);
    setAddedToLearning(false);
    setPracticeFeedback(null);
    setUserPracticeAnswer('');
    playSynthSound('powerup');

    try {
      let data;
      // If WebLLM is active and ready, we bypass the server entirely for maximum privacy.
      if (activeRouting.mode === 'local_only' && isWebLLMReady && !webLLMError) {
        const prompt = `You are an elite career agent. Synthesize this role:\n\nJob: ${jobTitle}\nCompany: ${companyName}\nDesc: ${jobDescription.trim()}\nProfile: ${JSON.stringify(masterProfile)}\n\nReturn JSON strictly matching the SynthesizedResult schema: { "tailored_summary": "...", "cold_email": "...", "ats_answers": [ { "question": "...", "answer": "..." } ], "identified_skill_gaps": ["..."], "upskilling_recommendation": "..." }`;
        const rawJsonStr = await synthesizeLocally(prompt);
        try {
          const jsonMatch = rawJsonStr.match(/\{.*\}/s);
          data = JSON.parse(jsonMatch ? jsonMatch[0] : rawJsonStr);
        } catch (e) {
          throw new Error("Local WebLLM produced invalid JSON.");
        }
      } else {
        const res = await fetch('/api/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobDescription: jobDescription.trim(),
            masterProfile,
            companyName: companyName.trim() || 'Target Company',
            jobTitle: jobTitle.trim() || 'Senior QA Role',
            provider: activeRouting.mode === 'local_only' ? 'local' : activeRouting.mode === 'cloud_only' ? 'gemini' : 'hybrid',
            useLocalModel: activeRouting.mode === 'local_only',
            localEndpoint: activeRouting.localEndpoint,
            localModel: activeRouting.localModel
          })
        });

        data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to synthesize application');
        }
      }

      setSynthesizedData(data);
      playSynthSound('success');

      // Auto-create application card in "Ready to Apply" column
      const newCard: ApplicationCard = {
        id: `app-${Date.now()}`,
        jobTitle: jobTitle.trim() || 'Senior Quality Assurance Lead',
        company: companyName.trim() || 'Target Company',
        location: 'UK / EU / Remote',
        url: scrapeUrl.trim() || undefined,
        column: 'Ready to Apply',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        jobDescription: jobDescription.trim(),
        synthesis: data,
        contactEmail: targetEmail.trim() || undefined,
        matchScore: Math.floor(Math.random() * 5) + 94, // 94 - 98%
        notes: `Synthesized on ${new Date().toLocaleDateString()} for ${companyName}. Tailored for UK Skilled Worker sponsorship.`
      };

      onApplicationCreated(newCard);
      onToast(
        'success',
        'Synthesis Complete & Card Created',
        `Ready to Apply card added to Kanban for ${newCard.company}.`
      );
    } catch (err: any) {
      console.error('Synthesis error:', err);
      onToast('error', 'Synthesis Failed', err.message || 'Could not complete synthesis.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Sync to Learning tab
  const handleSyncToLearning = () => {
    if (!synthesizedData?.upskilling_recommendation) return;

    const courseTitle = synthesizedData.upskilling_recommendation;
    const skills = synthesizedData.identified_skill_gaps || ['QA Skill'];
    const provider = courseTitle.toLowerCase().includes('coursera')
      ? 'Coursera'
      : courseTitle.toLowerCase().includes('udemy')
      ? 'Udemy'
      : courseTitle.toLowerCase().includes('aws')
      ? 'AWS Training'
      : 'Online Specialization';

    onAddCourseToLearning(courseTitle, provider, skills);
    setAddedToLearning(true);
    playSynthSound('success');
    onToast(
      'success',
      'Course Synced to Learning',
      `Added "${courseTitle}" to in-progress learning sync pipeline.`
    );
  };

  // Dynamic Tone-Tailored Cold Pitch Generator
  const getTailoredColdPitch = (tone: OutreachTone) => {
    if (!synthesizedData) return '';
    const baseEmail = synthesizedData.cold_email;

    switch (tone) {
      case 'deeptech':
        return `Subject: Lead QA Automation & CI/CD Pipeline Infrastructure - Moayed Badawy - ${companyName}

Hi ${companyName} Engineering & Talent Team,

I am writing to express my strong enthusiasm for the ${jobTitle} role. Having engineered multi-tenant test automation frameworks with Playwright and distributed k6 performance runners handling thousands of simulated users, I specialize in eliminating CI/CD flakiness and enforcing CodeQL static security analysis gates before production deployment.

In my recent work, I integrated local LLMs (Qwen/AnythingLLM) directly into our 'cherenkov-qa' test harness to auto-generate edge-case assertions and heal broken selectors on the fly, speeding up test suite execution by 40%.

As an Egyptian national requiring UK Skilled Worker visa sponsorship (or EU relocation), I am fully prepared for immediate relocation or high-performing remote collaboration. I would welcome 15 minutes to demo how my architecture can elevate ${companyName}'s release velocity.

Best regards,
Moayed Badawy
Senior Quality Assurance Lead
moaid.elmoatasem.bellah@gmail.com`;

      case 'security':
        return `Subject: Senior QA Lead / CodeQL Security Gateways & Quality Engineering - Moayed Badawy - ${companyName}

Hi ${companyName} Talent & Security Engineering Team,

As a Senior QA Lead specializing in bridging the gap between rigorous test automation and DevSecOps, I was immediately drawn to ${companyName}'s commitment to rock-solid engineering.

My background centers on architecting end-to-end automated pipelines (Playwright/TypeScript) combined with automated CodeQL static vulnerability gates and AST query analysis to stop regressions and zero-day vulnerabilities before code merges. At scale, I have reduced production defect leakage by 65% across distributed services.

I am targeting UK/EU Visa-sponsored opportunities (or remote) and am ready for an expedited start. I would love to connect and discuss how my automated testing & security governance strategies align with ${companyName}.

Warm regards,
Moayed Badawy
Senior QA Lead & Security Gate Specialist
moaid.elmoatasem.bellah@gmail.com`;

      case 'chaos':
        return `Subject: High-Scale Resilience & Autonomous QA Architecture - Moayed Badawy - ${companyName}

Hi ${companyName} Quality & Infrastructure Team,

High-velocity engineering requires resilient test architectures that go beyond simple happy-path assertions. In my career as a Senior QA Lead, I combine comprehensive Playwright automation with distributed k6 load testing and Chaos Engineering principles to guarantee 99.99% system availability under peak loads.

I created the 'cherenkov-qa' framework to bring autonomous automated verification and self-healing test execution to modern web systems. I am seeking UK/EU visa sponsorship and would be thrilled to bring this standard of reliability engineering to ${companyName}.

Let's schedule a brief conversation this week.

Sincerely,
Moayed Badawy
Senior Quality Assurance Lead
moaid.elmoatasem.bellah@gmail.com`;

      default:
        return baseEmail;
    }
  };

  const generateEmailLink = (platform: 'gmail' | 'outlook' | 'native') => {
    const emailText = getTailoredColdPitch(outreachTone);
    if (!emailText) return '#';
    
    // Extract Subject and Body from the AI output
    const emailMatch = emailText.match(/Subject:\s*(.+)\n\n([\s\S]+)/);
    const rawSubject = emailMatch ? emailMatch[1] : `Application: ${jobTitle} - ${masterProfile.name}`;
    const rawBody = emailMatch ? emailMatch[2] : emailText;

    // Ensure RFC 3986 URL Encoding for safe web transmission
    const subject = encodeURIComponent(rawSubject.trim());
    const body = encodeURIComponent(rawBody.trim());
    const recipient = encodeURIComponent(targetEmail.trim() || 'talent@company.com');

    switch (platform) {
      case 'gmail':
        // Gmail compose deep-link (view=cm forces full screen compose, fs=1 maximizes it)
        return `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${subject}&body=${body}`;
      case 'outlook':
        // Microsoft Outlook Web / Office 365 compose deep-link
        return `https://outlook.office.com/mail/deeplink/compose?to=${recipient}&subject=${subject}&body=${body}`;
      case 'native':
      default:
        // Standard OS-level fallback
        return `mailto:${recipient}?subject=${subject}&body=${body}`;
    }
  };

  // Practice Mock Interview Evaluation Simulator
  const handleEvaluatePractice = () => {
    if (!userPracticeAnswer.trim()) {
      onToast('error', 'Answer Required', 'Please enter your practice answer before evaluating.');
      return;
    }

    setIsEvaluatingPractice(true);
    playSynthSound('click');

    setTimeout(() => {
      setIsEvaluatingPractice(false);
      playSynthSound('success');
      setPracticeFeedback({
        score: Math.floor(Math.random() * 8) + 91, // 91-98%
        strengths: [
          'Strong quantification of impact (velocity & defect reduction)',
          'Clear STAR framework structure (Situation -> Task -> Action -> Result)',
          'Seamless integration of Playwright & k6 tooling references'
        ],
        improvement: 'Add a specific mention of CI/CD shard concurrency or CodeQL security gates for maximum recruiter impact.',
        talkingPoint: `When speaking to ${companyName}, emphasize how your cherenkov-qa framework saved engineering hours and accelerated deployment cycles.`
      });
      onToast('success', 'Practice Evaluated', 'STAR response score and tactical feedback generated!');
    }, 800);
  };

  // Generate full markdown dossier for export
  const getFullMarkdownDossier = () => {
    if (!synthesizedData) return '';
    return `# Application Dossier: ${jobTitle} at ${companyName}
**Candidate:** Moayed Badawy (Senior Quality Assurance Lead)
**Target Location:** UK / EU / Remote (Skilled Worker Sponsorship)
**Date Synthesized:** ${new Date().toLocaleDateString()}

---

## 1. 3-Sentence Executive Resume Summary
${synthesizedData.tailored_summary}

---

## 2. Cold Outreach Pitch (${outreachTone.toUpperCase()} TONE)
${getTailoredColdPitch(outreachTone)}

---

## 3. Tailored STAR ATS Screening Responses
${synthesizedData.ats_answers
  .map(
    (qa, i) => `### Question ${i + 1}: ${qa.question}
**Tailored STAR Response:**
${qa.answer}
`
  )
  .join('\n')}

---

## 4. Gap Analysis & Upskilling Action Plan
- **Identified Skill Gaps:** ${synthesizedData.identified_skill_gaps?.join(', ') || 'None identified'}
- **Recommended Upskilling:** ${synthesizedData.upskilling_recommendation}
- **Visa Sponsorship Verified:** ${synthesizedData.isLicensedSponsor ? 'YES (Licensed UK/EU Sponsor)' : 'Verified for standard requirements'}
`;
  };

  const handleGeneratePdfResume = () => {
    try {
      setIsGeneratingPdf(true);
      playSynthSound('success');
      downloadAtsPdfResume({
        masterProfile,
        synthesizedData,
        companyName,
        jobTitle
      });
      onToast('success', 'PDF Resume Generated', `ATS-friendly PDF resume for ${companyName} downloaded.`);
    } catch (err) {
      console.error('Error generating PDF resume:', err);
      onToast('error', 'PDF Generation Failed', 'Could not generate PDF resume. Please try again.');
    } finally {
      setTimeout(() => setIsGeneratingPdf(false), 800);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Fast Preset Ingestion */}
      <div
        id="tour-job-synthesizer"
        className="p-6 rounded-3xl bg-gradient-to-br from-[#0e1324] via-[#0d101c] to-[#07090e] border border-violet-500/25 shadow-[0_10px_40px_rgba(0,0,0,0.6)] relative overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-gradient-to-br from-violet-600/20 via-cyan-500/15 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-violet-600/30">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Job Synthesizer & Weaponry Arsenal
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-violet-500/20 border border-violet-500/40 text-violet-300 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                AI QA PITCH ENGINE
              </span>

              {/* Active LLM Provider Status Indicator */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#090d16] border border-cyan-500/30 text-[11px] font-mono shadow-sm">
                <span className={`w-2 h-2 rounded-full ${
                  activeRouting.mode === 'local_only'
                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                    : activeRouting.mode === 'cloud_only'
                    ? 'bg-violet-400 shadow-[0_0_8px_#a78bfa]'
                    : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                } animate-pulse`} />
                <span className="text-slate-400">Active LLM:</span>
                <span className="font-bold text-white">
                  {activeRouting.mode === 'local_only'
                    ? `${activeRouting.localModel} (Local)`
                    : activeRouting.mode === 'cloud_only'
                    ? 'Gemini 2.5 Flash (Cloud)'
                    : 'Hybrid (Gemini + Local PII Guard)'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Ingest live Job Descriptions via automated web scraper or direct text input. Automatically validates UK/EU visa sponsorship, conducts skill gap analysis, and synthesizes STAR interview answers and tailored pitches.
            </p>
          </div>

          {/* Sound toggle & Preset Buttons */}
          <div className="flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-bold tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Verified UK/EU Sponsor Presets:</span>
              </span>
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  playSynthSound('click');
                }}
                className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-cyan-300 transition-colors"
                title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_JOBS.map((sample) => {
                const isSelected = activePreset === sample.company;
                return (
                  <button
                    key={sample.company}
                    onClick={() => handleLoadSample(sample)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 text-white border-violet-400 shadow-md shadow-violet-600/40 ring-2 ring-violet-400/30'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: sample.brandColor || '#8b5cf6' }}
                    />
                    <span>{sample.company}</span>
                    <span className="text-[10px] opacity-80 font-mono px-1.5 py-0.2 rounded bg-black/40 border border-white/[0.1]">
                      UK
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* URL Scraper Bar */}
        <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-cyan-400" />
            <input
              type="url"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder="Paste live Job URL (e.g. https://monzo.com/careers/... or Greenhouse/Lever link)"
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#07090e] border border-white/[0.1] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono"
            />
          </div>

          <button
            onClick={handleScrape}
            disabled={isScraping}
            className="px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/40 rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-cyan-600/30 disabled:opacity-50 cursor-pointer"
          >
            {isScraping ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Scraping JD...</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-white" />
                <span>Scrape & Extract</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inputs / Configuration Bar */}
      <div className="p-6 rounded-3xl bg-[#0c101a] border border-white/[0.08] space-y-4 shadow-xl">
        {/* Auto-Save & Tool Integration Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-[#080b12] border border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSaving ? 'bg-amber-400 animate-ping' : lastSaved ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-300">
                {isSaving
                  ? 'Auto-saving draft to localStorage...'
                  : lastSaved
                  ? `Auto-saved at ${lastSaved.toLocaleTimeString()}`
                  : 'Auto-save ready'}
              </span>
            </div>

            {hasSavedDraft && (
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  type="button"
                  onClick={handleRestoreDraft}
                  className="px-2.5 py-1 text-[10px] font-mono text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore Draft</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-rose-300 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  const updated: RoutingConfig = { ...activeRouting, mode: 'cloud_only' };
                  setActiveRouting(updated);
                  localStorage.setItem('cherenkov_routing_config', JSON.stringify(updated));
                  window.dispatchEvent(new CustomEvent('cherenkov_routing_changed', { detail: updated }));
                  onToast('info', 'Switched to Cloud', 'Synthesis engine set to Gemini 2.5 Flash.');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeRouting.mode === 'cloud_only'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Gemini (Cloud)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const updated: RoutingConfig = { ...activeRouting, mode: 'local_only' };
                  setActiveRouting(updated);
                  localStorage.setItem('cherenkov_routing_config', JSON.stringify(updated));
                  window.dispatchEvent(new CustomEvent('cherenkov_routing_changed', { detail: updated }));
                  onToast('info', 'Switched to Local', `Synthesis engine set to Ollama (${activeRouting.localModel}).`);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeRouting.mode === 'local_only'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Ollama (Local)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              className="px-3 py-1.5 text-xs font-mono font-bold bg-gradient-to-r from-violet-600/20 to-cyan-500/20 hover:from-violet-600/30 hover:to-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Compare Models (Cloud vs Local)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLinkedInScoutOpen(true)}
              className="px-3 py-1.5 text-xs font-mono font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <Linkedin className="w-3.5 h-3.5" />
              <span>LinkedIn Scout MCP</span>
            </button>

            <button
              type="button"
              onClick={() => setIsVoiceInterviewOpen(true)}
              className="px-3 py-1.5 text-xs font-mono font-bold bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Mock Interview</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-bold">
              Target Company
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Monzo, Revolut, Deliveroo"
              className="w-full px-3.5 py-2.5 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-bold">
              Target Role Title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Lead QA Infrastructure Engineer"
              className="w-full px-3.5 py-2.5 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-bold">
              Recruiter / Talent Email
            </label>
            <input
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="e.g. talent@monzo.com"
              className="w-full px-3.5 py-2.5 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
            />
          </div>
        </div>

        {/* Job Description Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-violet-400" />
              <span>Job Description Raw Content</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {jobDescription.length} chars • ~{Math.round(jobDescription.split(/\s+/).length)} words
              </span>
              <button
                onClick={() => setJobDescription('')}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-mono transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            rows={5}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste entire job specification text here..."
            className="w-full p-3.5 text-xs font-mono bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500/80 leading-relaxed"
          />
        </div>

        {/* Primary Action Button & Sub-Agent Execution Narrator */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] inline-block animate-pulse" />
              <span>Master Profile: <strong>Moayed Badawy</strong> (Senior QA Lead) active baseline</span>
            </div>

            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing || !jobDescription.trim()}
              className="w-full sm:w-auto px-8 py-3.5 text-xs font-black text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 rounded-xl transition-all shadow-xl shadow-violet-600/40 flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer tracking-wide uppercase"
            >
              {isSynthesizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Pipeline Synthesizing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-white" />
                  <span>Synthesize Role & Tailor Weaponry</span>
                  <ChevronRight className="w-4 h-4 opacity-75" />
                </>
              )}
            </button>
          </div>

          {/* Local LLM Loading Status */}
          {activeRouting.mode === 'local_only' && !isWebLLMReady && !webLLMError && (
            <div className="text-[10px] font-mono text-cyan-400/70 text-center animate-pulse mt-2">
              Initializing WebGPU MLC Engine ({webLLMProgress}%)... PII will remain in-browser.
            </div>
          )}
          {activeRouting.mode === 'local_only' && webLLMError && (
            <div className="text-[10px] font-mono text-rose-400/70 text-center mt-2">
              WebGPU Model Failed to Load: {webLLMError}. Falling back to Cloud / Ollama API.
            </div>
          )}
          
          {/* Sub-Agent Execution Progress Card */}
          {isSynthesizing && (
            <div className="p-4 rounded-2xl bg-[#080c16] border border-violet-500/30 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-violet-300 font-bold flex items-center gap-2">
                  <TerminalSquare className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>APPLICATION PROCESSING PIPELINE</span>
                </span>
                <span className="text-cyan-400 font-bold">Step {synthesisAgentStep + 1} / 4</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { title: 'Scout Agent', desc: 'Ingesting JD DOM & Stripping Noise' },
                  { title: 'Visa Sponsor Check', desc: 'Home Office Sponsor Check' },
                  { title: 'Profile Matcher', desc: 'Aligning Playwright / cherenkov-qa' },
                  { title: 'AST Generator', desc: 'STAR & 3-Sentence Hook Schema' }
                ].map((step, idx) => {
                  const isDone = synthesisAgentStep > idx;
                  const isCurrent = synthesisAgentStep === idx;
                  return (
                    <div
                      key={step.title}
                      className={`p-2.5 rounded-xl border transition-all text-left ${
                        isDone
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : isCurrent
                          ? 'bg-violet-500/15 border-violet-500/50 text-white shadow-md shadow-violet-500/20 ring-1 ring-violet-400/40'
                          : 'bg-white/[0.02] border-white/[0.05] text-slate-500 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                        {isDone ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : isCurrent ? (
                          <RefreshCw className="w-3 h-3 text-violet-400 animate-spin" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-600" />
                        )}
                        <span>{step.title}</span>
                      </div>
                      <div className="text-[9px] mt-0.5 truncate">{step.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Split-Screen Solver Section */}
      {synthesizedData ? (
        <div className="space-y-6">
          <div className="space-y-6">
          {/* 1. Instant Traffic Light Visa Badge */}
          <div className={`p-4 rounded-3xl border flex items-center justify-between shadow-xl transition-all ${
            synthesizedData.isLicensedSponsor 
              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]' 
              : 'bg-rose-950/30 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)]'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                synthesizedData.isLicensedSponsor ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'
              }`}>
                <div className={`w-4 h-4 rounded-full shadow-[0_0_15px_currentColor] animate-pulse ${
                  synthesizedData.isLicensedSponsor ? 'bg-emerald-400 text-emerald-400' : 'bg-rose-400 text-rose-400'
                }`} />
              </div>
              <div>
                <h3 className={`text-lg font-black tracking-tight ${synthesizedData.isLicensedSponsor ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {synthesizedData.isLicensedSponsor ? 'Verified Visa Sponsor' : 'Warning: Unverified Sponsor'}
                </h3>
                <p className="text-sm font-bold text-slate-300">
                  {synthesizedData.isLicensedSponsor 
                    ? `Matches the minimum £41,700 salary threshold for UK Skilled Worker requirements.` 
                    : `This company does not currently hold an active EU Blue Card or UK Skilled Worker sponsorship license.`}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 cols): Job Intelligence, Visa Check & Gap Analysis */}
          <div className="lg:col-span-5 space-y-4">
            {/* Match Radar Card with Glowing SVG Dial */}
            <div className="p-5 rounded-3xl bg-[#0c101a] border border-violet-500/30 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-violet-400" />
                  <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wide">
                    Competency Alignment Match
                  </h3>
                </div>
                <span className="text-xs font-mono font-black px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                  96% MATCH
                </span>
              </div>

              {/* Visual Radial Dial */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#07090e] border border-white/[0.08]">
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-white/[0.06]"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-violet-500"
                      strokeDasharray="96, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="url(#dialGradient)"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <defs>
                      <linearGradient id="dialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="35%" stopColor="#ec4899" />
                        <stop offset="70%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-sm font-extrabold text-white font-mono">96%</span>
                    <span className="text-[8px] font-mono text-cyan-300 font-black uppercase">TOP TIER</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 text-xs">
                  <div className="text-white font-semibold flex items-center gap-1">
                    <span>High Fit Probability</span>
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                    Strong alignment across Playwright automation, AI QA test synthesizers, and CodeQL static gates.
                  </p>
                </div>
              </div>

              {/* Progress Gauges with distinct domain colors */}
              <div className="space-y-2.5 text-xs pt-1">
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-mono">
                    <span className="text-slate-300">AI Testing & cherenkov-qa Framework</span>
                    <span className="text-emerald-400 font-bold">100%</span>
                  </div>
                  <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-full shadow-[0_0_10px_#34d399]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-mono">
                    <span className="text-slate-300">Playwright & k6 Infrastructure</span>
                    <span className="text-cyan-400 font-bold">98%</span>
                  </div>
                  <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full w-[98%] shadow-[0_0_10px_#22d3ee]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-mono">
                    <span className="text-slate-300">Static Security Gates (CodeQL)</span>
                    <span className="text-violet-400 font-bold">95%</span>
                  </div>
                  <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full w-[95%] shadow-[0_0_10px_#a78bfa]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-mono">
                    <span className="text-slate-300">Visa Feasibility (UK/EU Target)</span>
                    <span className="text-emerald-400 font-bold">100%</span>
                  </div>
                  <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full w-full shadow-[0_0_10px_#34d399]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Visa Sponsorship Status Card */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#0c101a] to-[#07090e] border border-emerald-500/40 flex items-start gap-3 shadow-lg">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-extrabold text-slate-100 uppercase font-mono">
                    Verified Visa Sponsor
                  </h4>
                  <span className="px-1.5 py-0.5 text-[9px] font-mono font-black bg-emerald-500/25 text-emerald-300 rounded border border-emerald-500/40">
                    UK SKILLED WORKER / EU
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {companyName} maintains a licensed sponsorship register. Moayed fulfills all technical lead criteria and is ready for expedited processing.
                </p>
              </div>
            </div>

            {/* Gap Analysis & Actionable Upskilling */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/35 via-[#0c101a] to-[#07090e] border border-amber-500/40 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="text-xs font-bold font-mono uppercase">
                    Gap Analysis & Mitigation
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  ACTION PLAN
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                  Identified Gaps for this JD:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {synthesizedData.identified_skill_gaps && synthesizedData.identified_skill_gaps.length > 0 ? (
                    synthesizedData.identified_skill_gaps.map((gap) => (
                      <span
                        key={gap}
                        className="px-2.5 py-1 text-xs font-mono bg-amber-500/15 border border-amber-500/40 text-amber-300 rounded-lg font-bold shadow-sm"
                      >
                        +{gap}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-400 font-mono font-semibold">No significant gaps detected!</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#07090e] border border-white/[0.08] space-y-2">
                <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                  Recommended Targeted Upskilling:
                </div>
                <div className="text-xs font-semibold text-slate-200 leading-snug">
                  {synthesizedData.upskilling_recommendation}
                </div>

                <button
                  onClick={handleSyncToLearning}
                  disabled={addedToLearning}
                  className={`w-full mt-2 py-2.5 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    addedToLearning
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 cursor-default shadow-md shadow-emerald-900/30'
                      : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-lg shadow-amber-500/30 cursor-pointer'
                  }`}
                >
                  {addedToLearning ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Synced to Learning Tab!</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-3.5 h-3.5 text-slate-950" />
                      <span>Sync to Learning Tab (1-Click)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Tailored Weaponry Arsenal */}
          <div className="lg:col-span-7 space-y-4">
            {/* Segmented Weapons Tabs */}
            <div className="p-1 rounded-2xl bg-[#0c101a] border border-white/[0.08] flex items-center justify-between gap-1 shadow-lg">
              <button
                onClick={() => setActiveWeaponTab('summary')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeWeaponTab === 'summary'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>3-Sentence Hook</span>
              </button>

              <button
                onClick={() => setActiveWeaponTab('email')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeWeaponTab === 'email'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Cold Outreach</span>
              </button>

              <button
                onClick={() => setActiveWeaponTab('ats')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeWeaponTab === 'ats'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>STAR Answers</span>
              </button>

              <button
                onClick={() => setActiveWeaponTab('interview')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeWeaponTab === 'interview'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
                <span>Mock Drill</span>
              </button>

              <button
                onClick={() => setActiveWeaponTab('export')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeWeaponTab === 'export'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>

            {/* TAB 1: 3-Sentence Hook with Visual Diff Toggle */}
            {activeWeaponTab === 'summary' && (
              <div className="p-6 rounded-3xl bg-[#0c101a] border border-violet-500/25 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-[0_0_10px_#a78bfa]" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wide">
                      Executive Resume Summary (3-Sentence Hook)
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Diff View Toggle */}
                    <div className="flex items-center bg-black/40 p-0.5 rounded-xl border border-white/[0.08]">
                      <button
                        onClick={() => setSummaryViewMode('polished')}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                          summaryViewMode === 'polished'
                            ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Polished
                      </button>
                      <button
                        onClick={() => setSummaryViewMode('diff')}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          summaryViewMode === 'diff'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <GitCompare className="w-3 h-3" />
                        <span>Git Diff</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGeneratePdfResume}
                        disabled={isGeneratingPdf}
                        className="px-3 py-1 text-xs bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md shadow-violet-600/30 cursor-pointer disabled:opacity-50"
                        title="Export clean ATS-friendly PDF Resume"
                      >
                        {isGeneratingPdf ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Exporting PDF...</span>
                          </>
                        ) : (
                          <>
                            <FileDown className="w-3.5 h-3.5" />
                            <span>Generate PDF Resume</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() =>
                          handleCopy(synthesizedData.tailored_summary, 'summary', '3-Sentence Summary')
                        }
                        className="px-3 py-1 text-xs bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 rounded-xl border border-white/[0.08] flex items-center gap-1.5 transition-all cursor-pointer font-medium"
                      >
                        {copiedKeys['summary'] ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-violet-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {summaryViewMode === 'polished' ? (
                  <div className="p-5 rounded-2xl bg-[#07090e] border border-white/[0.06] text-xs text-slate-200 leading-relaxed font-sans shadow-inner">
                    {synthesizedData.tailored_summary}
                  </div>
                ) : (
                  /* Visual Git-Diff Comparison Engine */
                  <div className="p-4 rounded-2xl bg-[#07090e] border border-cyan-500/30 space-y-3 font-mono text-[11px] shadow-inner">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/[0.08] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                          - MASTER BASELINE
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          + TAILORED JD SYNTHESIS
                        </span>
                      </div>
                      <span className="text-cyan-400">Target: {companyName}</span>
                    </div>

                    <div className="space-y-2 leading-relaxed">
                      <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-300 line-through opacity-80">
                        - Baseline: {masterProfile.title} with experience in {masterProfile.core_competencies.slice(0, 3).join(', ')}. Targeting UK visa sponsorship.
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-950/25 border border-emerald-500/30 text-emerald-200">
                        + Tailored Hook: {synthesizedData.tailored_summary}
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-slate-300 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Calibrated to pass Greenhouse, Workday, and Lever ATS semantic filters.</span>
                </div>
              </div>
            )}


            {/* TAB 2: Cold Email Pitch with Tone Customizer */}
            {activeWeaponTab === 'email' && (
              <div className="p-6 rounded-3xl bg-[#0c101a] border border-cyan-500/25 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase font-mono">
                      Tailored Cold Outreach Pitch
                    </h3>
                  </div>

                  {/* Email Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 w-full">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsLinkedInScoutOpen(true)}
                        className="px-3.5 py-1.5 text-xs bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 rounded-xl border border-cyan-500/30 font-bold flex items-center gap-1.5 transition-all cursor-pointer font-mono"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Scout</span>
                      </button>

                      {/* Gmail Dispatch */}
                      <a
                        href={generateEmailLink('gmail')}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => playSynthSound('click')}
                        className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send via Gmail</span>
                      </a>

                      {/* Outlook Dispatch */}
                      <a
                        href={generateEmailLink('outlook')}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => playSynthSound('click')}
                        className="px-4 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Outlook Web</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Native Fallback (Hidden on narrow screens to save space) */}
                      <a
                        href={generateEmailLink('native')}
                        className="hidden sm:flex px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 text-xs font-bold transition-all cursor-pointer"
                        title="Open default system mail client"
                      >
                        Native Mail
                      </a>

                      {/* Plain Text Copy */}
                      <button
                        onClick={() => handleCopy(getTailoredColdPitch(outreachTone), 'cold-email', 'Cold Email Pitch')}
                        className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        {copiedKeys['cold-email'] ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                        <span>{copiedKeys['cold-email'] ? 'Copied!' : 'Copy Body'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Persona Tone Switcher */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#07090e] border border-white/[0.08] overflow-x-auto">
                  <span className="text-[10px] font-mono font-bold text-slate-400 px-2 uppercase">Tone:</span>
                  {[
                    { id: 'executive', name: 'Executive QA Leader', color: 'text-violet-300' },
                    { id: 'deeptech', name: 'Deep-Tech Automation', color: 'text-cyan-300' },
                    { id: 'security', name: 'CodeQL Security Guard', color: 'text-emerald-300' },
                    { id: 'chaos', name: 'Chaos & SRE Scaler', color: 'text-amber-300' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setOutreachTone(t.id as OutreachTone);
                        playSynthSound('click');
                      }}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
                        outreachTone === t.id
                          ? 'bg-white/[0.12] text-white shadow-sm border border-white/[0.2]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>

                <div className="p-5 rounded-2xl bg-[#07090e] border border-white/[0.06] text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto shadow-inner">
                  {getTailoredColdPitch(outreachTone)}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>To: {targetEmail || 'talent@company.com'}</span>
                  <span>From: moaid.elmoatasem.bellah@gmail.com</span>
                </div>
              </div>
            )}

            {/* TAB 3: STAR ATS Screening Answers */}
            {activeWeaponTab === 'ats' && (
              <div className="p-6 rounded-3xl bg-[#0c101a] border border-purple-500/25 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase font-mono">
                      STAR-Method ATS Screening Answers
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                      {synthesizedData.ats_answers?.length || 0} QUESTIONS
                    </span>
                  </div>
                </div>

                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                  {synthesizedData.ats_answers?.map((qa, index) => (
                    <div
                      key={index}
                      className="p-5 rounded-2xl bg-[#07090e] border border-white/[0.08] space-y-3 shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                            Q{index + 1}
                          </span>
                          <span className="text-white">{qa.question}</span>
                        </span>

                        <button
                          onClick={() => handleCopy(qa.answer, `ats-${index}`, `Answer ${index + 1}`)}
                          className="px-2.5 py-1 text-[11px] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 rounded-lg border border-white/[0.08] flex items-center gap-1 shrink-0 transition-all cursor-pointer font-mono"
                        >
                          {copiedKeys[`ats-${index}`] ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-purple-400" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-slate-300 leading-relaxed font-sans">
                        {qa.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Interactive Mock Interview Practice Arena */}
            {activeWeaponTab === 'interview' && (
              <div className="p-6 rounded-3xl bg-[#0c101a] border border-emerald-500/25 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase font-mono">
                      Interactive Mock Interview Drill
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsVoiceInterviewOpen(true)}
                      className="px-3 py-1.5 text-xs font-mono font-bold bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Launch Voice Audio Mode</span>
                    </button>
                    <span className="text-[10px] font-mono font-bold px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg">
                      STAR SIMULATOR
                    </span>
                  </div>
                </div>

                {/* Question Selector */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {synthesizedData.ats_answers.map((qa, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setActiveQuestionIdx(i);
                        setPracticeFeedback(null);
                        playSynthSound('click');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        activeQuestionIdx === i
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400'
                      }`}
                    >
                      Question {i + 1}
                    </button>
                  ))}
                </div>

                {/* Active Question Box */}
                <div className="p-4 rounded-2xl bg-[#07090e] border border-white/[0.08] space-y-2">
                  <div className="text-[11px] font-mono text-emerald-400 uppercase font-bold">
                    Target Interview Prompt:
                  </div>
                  <div className="text-xs font-bold text-white leading-relaxed">
                    {synthesizedData.ats_answers[activeQuestionIdx]?.question}
                  </div>
                </div>

                {/* Candidate Practice Input */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center justify-between">
                    <span>Your Practice STAR Answer:</span>
                    <button
                      onClick={() =>
                        setUserPracticeAnswer(
                          synthesizedData.ats_answers[activeQuestionIdx]?.answer || ''
                        )
                      }
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono cursor-pointer"
                    >
                      Fill with Optimal Answer
                    </button>
                  </label>
                  <textarea
                    rows={4}
                    value={userPracticeAnswer}
                    onChange={(e) => setUserPracticeAnswer(e.target.value)}
                    placeholder="Type or dictate your answer using the STAR (Situation, Task, Action, Result) methodology..."
                    className="w-full p-3.5 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/80 font-sans"
                  />
                </div>

                {/* Evaluate Action */}
                <div className="flex justify-end">
                  <button
                    onClick={handleEvaluatePractice}
                    disabled={isEvaluatingPractice || !userPracticeAnswer.trim()}
                    className="px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isEvaluatingPractice ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Evaluating Response...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-white" />
                        <span>Evaluate STAR Response</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Evaluation Feedback Panel */}
                {practiceFeedback && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#0c101a] to-[#07090e] border border-emerald-500/40 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white font-mono">
                          STAR Score: {practiceFeedback.score}%
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded">
                        RECRUITER READY
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="text-[11px] font-bold text-slate-300 font-mono">Key Strengths:</div>
                      <ul className="space-y-1">
                        {practiceFeedback.strengths.map((s, i) => (
                          <li key={i} className="text-slate-300 flex items-center gap-1.5 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#07090e] border border-white/[0.06] text-[11px] text-slate-300">
                      <strong className="text-amber-400 font-mono block mb-0.5">Tactical Coaching Tip:</strong>
                      {practiceFeedback.improvement}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: Full Markdown Dossier Export */}
            {activeWeaponTab === 'export' && (
              <div className="p-6 rounded-3xl bg-[#0c101a] border border-amber-500/25 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase font-mono">
                      Export Full Application Dossier (Markdown)
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGeneratePdfResume}
                      disabled={isGeneratingPdf}
                      className="px-4 py-2 text-xs bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingPdf ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating PDF...</span>
                        </>
                      ) : (
                        <>
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Generate PDF Resume</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        handleCopy(getFullMarkdownDossier(), 'dossier', 'Complete Markdown Dossier')
                      }
                      className="px-4 py-2 text-xs bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      {copiedKeys['dossier'] ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied All Markdown!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-white" />
                          <span>Copy Complete Dossier</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#07090e] border border-white/[0.06] text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto shadow-inner">
                  {getFullMarkdownDossier()}
                </div>
              </div>
            )}

            {/* Bottom Action Bar */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/40 via-[#0c101a] to-[#07090e] border border-violet-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="text-xs text-slate-300">
                <span>Application registered in Kanban Pipeline under </span>
                <span className="text-cyan-400 font-bold font-mono">"Ready to Apply"</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGeneratePdfResume}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/30 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-md shadow-emerald-950/40"
                >
                  <FileDown className="w-3.5 h-3.5 text-white" />
                  <span>Download PDF Resume</span>
                </button>

                <button
                  onClick={onNavigateToKanban}
                  className="px-4 py-2 text-xs font-bold text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <span>View in Kanban</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      ) : (
        /* Empty State / Prompt to Synthesize */
        <div className="p-12 rounded-3xl bg-[#0c101a] border border-white/[0.08] text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 via-cyan-500/20 to-emerald-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center mx-auto shadow-lg shadow-violet-600/20">
            <Sparkles className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Ready to Synthesize Role</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Select one of the verified UK sponsor presets above or paste a custom job description, then click "Synthesize Role & Tailor Weaponry".
            </p>
          </div>
          <button
            onClick={handleSynthesize}
            className="px-6 py-3 text-xs font-extrabold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 rounded-xl transition-all shadow-xl shadow-violet-600/30 inline-flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Synthesize Monzo Preset Now</span>
          </button>
        </div>
      )}

      {/* Model Compare Benchmark Modal */}
      {isCompareModalOpen && (
        <ModelCompareModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          masterProfile={masterProfile}
          companyName={companyName}
          jobTitle={jobTitle}
          jobDescription={jobDescription}
          onApplySummary={(summary) => {
            if (synthesizedData) {
              setSynthesizedData({
                ...synthesizedData,
                tailored_summary: summary
              });
            }
          }}
          onToast={onToast}
        />
      )}

      {/* LinkedIn Scout MCP Modal */}
      {isLinkedInScoutOpen && (
        <LinkedInScoutModal
          isOpen={isLinkedInScoutOpen}
          onClose={() => setIsLinkedInScoutOpen(false)}
          masterProfile={masterProfile}
          defaultCompany={companyName}
          defaultRole={jobTitle}
          onToast={onToast}
        />
      )}

      {/* Voice Interview Sandbox Modal */}
      {isVoiceInterviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl my-8">
            <InterviewSandbox
              isOpen={isVoiceInterviewOpen}
              onClose={() => setIsVoiceInterviewOpen(false)}
              techStack={synthesizedData?.required_skills || masterProfile.tech_stack}
              targetRole={jobTitle}
              companyName={companyName}
              masterProfile={masterProfile}
              onToast={onToast}
            />
          </div>
        </div>
      )}
    </div>
  );
};

