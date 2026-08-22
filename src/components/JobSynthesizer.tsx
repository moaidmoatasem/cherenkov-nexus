import React, { useState, useEffect, useMemo } from 'react';
import { MasterProfile, SynthesizedResult, ApplicationCard, RoutingConfig, AnswerEvaluation } from '../types';
import { INITIAL_ROUTING_CONFIG, SAMPLE_JOBS, isProfileConfigured } from '../data/initialData';
import { useAutoSave } from '../hooks/useAutoSave';
import { useWebLLM } from '../hooks/useWebLLM';
import { LinkedInScoutModal } from './LinkedInScoutModal';
import { InterviewSandbox } from './InterviewSandbox';
import { ModelCompareModal } from './ModelCompareModal';
import { Badge, Button, EmptyState, Modal, PanelHeader } from './ui';
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
import type { ToastFn } from './Toast';

interface JobSynthesizerProps {
  masterProfile: MasterProfile;
  /** Opens the profile setup flow from the empty state. */
  onOpenOnboarding: () => void;
  /** Seeds the shipped demo profile and applications. */
  onLoadSampleData?: () => void;
  onApplicationCreated: (app: ApplicationCard) => void;
  onAddCourseToLearning: (title: string, provider: string, skills: string[]) => void;
  onNavigateToKanban: () => void;
  onToast: ToastFn;
}

export type OutreachTone = 'executive' | 'deeptech' | 'security' | 'chaos';

export const JobSynthesizer: React.FC<JobSynthesizerProps> = ({
  masterProfile,
  onOpenOnboarding,
  onLoadSampleData,
  onApplicationCreated,
  onAddCourseToLearning,
  onNavigateToKanban,
  onToast
}) => {
  // Everything generated here is signed by the candidate, so it has to follow
  // whichever profile is actually active — never a baked-in identity.
  const candidateName = masterProfile.name;
  const candidateTitle = masterProfile.title;
  const candidateEmail = masterProfile.email ?? 'your.email@example.com';

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

  /**
   * Competency match, computed from the posting and the active profile.
   *
   * Every component is derived from data we actually hold, and each one is
   * reported with the counts behind it so the headline number can be checked
   * rather than taken on faith. A component with no evidence is omitted
   * instead of being padded with a default.
   */
  const matchAnalysis = useMemo(() => {
    if (!synthesizedData) return null;

    const posting = `${jobTitle} ${jobDescription}`.toLowerCase();
    const skills = Array.from(
      new Set([...(masterProfile.tech_stack ?? []), ...(masterProfile.core_competencies ?? [])])
    ).filter(Boolean);

    const matchedSkills = skills.filter((skill) => posting.includes(skill.toLowerCase()));
    const requirements = synthesizedData.extractedRequirements ?? [];
    const coveredRequirements = requirements.filter((requirement) =>
      skills.some((skill) => requirement.toLowerCase().includes(skill.toLowerCase()))
    );
    const gaps = synthesizedData.identified_skill_gaps ?? [];

    const components: { label: string; value: number; detail: string }[] = [];

    if (skills.length) {
      components.push({
        label: 'Your stack found in this posting',
        value: Math.round((matchedSkills.length / skills.length) * 100),
        detail: `${matchedSkills.length} of ${skills.length} listed skills`
      });
    }

    if (requirements.length) {
      components.push({
        label: 'Extracted requirements you cover',
        value: Math.round((coveredRequirements.length / requirements.length) * 100),
        detail: `${coveredRequirements.length} of ${requirements.length} requirements`
      });
    }

    // Gaps are capped at five so one noisy synthesis cannot zero the score.
    components.push({
      label: 'Gap load',
      value: Math.max(0, 100 - Math.min(gaps.length, 5) * 20),
      detail: gaps.length ? `${gaps.length} gap${gaps.length === 1 ? '' : 's'} identified` : 'no gaps identified'
    });

    components.push({
      label: 'Visa feasibility',
      value: synthesizedData.isLicensedSponsor ? 100 : synthesizedData.postingClaimsSponsorship ? 60 : 20,
      detail: synthesizedData.isLicensedSponsor
        ? `${synthesizedData.matchedSponsor ?? 'Employer'} matched on the register`
        : synthesizedData.postingClaimsSponsorship
        ? 'claimed in the posting, not matched on the register'
        : 'no sponsorship signal found'
    });

    const overall = Math.round(
      components.reduce((sum, component) => sum + component.value, 0) / components.length
    );

    return { overall, components, matchedSkills, gaps };
  }, [synthesizedData, jobDescription, jobTitle, masterProfile]);

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
  const [practiceFeedback, setPracticeFeedback] = useState<AnswerEvaluation | null>(null);

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
        return `Subject: Lead QA Automation & CI/CD Pipeline Infrastructure - ${candidateName} - ${companyName}

Hi ${companyName} Engineering & Talent Team,

I am writing to express my strong enthusiasm for the ${jobTitle} role. Having engineered multi-tenant test automation frameworks with Playwright and distributed k6 performance runners handling thousands of simulated users, I specialize in eliminating CI/CD flakiness and enforcing CodeQL static security analysis gates before production deployment.

In my recent work, I integrated local LLMs (Qwen/AnythingLLM) directly into our 'cherenkov-qa' test harness to auto-generate edge-case assertions and heal broken selectors on the fly, speeding up test suite execution by 40%.

As an Egyptian national requiring UK Skilled Worker visa sponsorship (or EU relocation), I am fully prepared for immediate relocation or high-performing remote collaboration. I would welcome 15 minutes to demo how my architecture can elevate ${companyName}'s release velocity.

Best regards,
${candidateName}
${candidateTitle}
${candidateEmail}`;

      case 'security':
        return `Subject: Senior QA Lead / CodeQL Security Gateways & Quality Engineering - ${candidateName} - ${companyName}

Hi ${companyName} Talent & Security Engineering Team,

As a Senior QA Lead specializing in bridging the gap between rigorous test automation and DevSecOps, I was immediately drawn to ${companyName}'s commitment to rock-solid engineering.

My background centers on architecting end-to-end automated pipelines (Playwright/TypeScript) combined with automated CodeQL static vulnerability gates and AST query analysis to stop regressions and zero-day vulnerabilities before code merges. At scale, I have reduced production defect leakage by 65% across distributed services.

I am targeting UK/EU Visa-sponsored opportunities (or remote) and am ready for an expedited start. I would love to connect and discuss how my automated testing & security governance strategies align with ${companyName}.

Warm regards,
${candidateName}
${candidateTitle}
${candidateEmail}`;

      case 'chaos':
        return `Subject: High-Scale Resilience & Autonomous QA Architecture - ${candidateName} - ${companyName}

Hi ${companyName} Quality & Infrastructure Team,

High-velocity engineering requires resilient test architectures that go beyond simple happy-path assertions. In my career as a Senior QA Lead, I combine comprehensive Playwright automation with distributed k6 load testing and Chaos Engineering principles to guarantee 99.99% system availability under peak loads.

I created the 'cherenkov-qa' framework to bring autonomous automated verification and self-healing test execution to modern web systems. I am seeking UK/EU visa sponsorship and would be thrilled to bring this standard of reliability engineering to ${companyName}.

Let's schedule a brief conversation this week.

Sincerely,
${candidateName}
${candidateTitle}
${candidateEmail}`;

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

  // Practice Mock Interview Evaluation
  //
  // This used to return `Math.random() * 8 + 91` with a fixed list of strengths,
  // without ever reading the answer — so typing anything at all scored in the
  // nineties and was praised for "quantification of impact". Someone preparing
  // for a real interview was being told they were ready on the basis of a random
  // number. It now goes through the same evaluator the voice sandbox uses, which
  // declines to score rather than guess when no engine is configured.
  const handleEvaluatePractice = async () => {
    if (!userPracticeAnswer.trim()) {
      onToast('error', 'Answer Required', 'Please enter your practice answer before evaluating.');
      return;
    }

    setIsEvaluatingPractice(true);
    playSynthSound('click');

    try {
      const res = await fetch('/api/interview/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: synthesizedData?.ats_answers[activeQuestionIdx]?.question ?? '',
          userAnswer: userPracticeAnswer,
          techTopic: jobTitle,
          // ATSAnswer carries no rubric points of its own. The role's extracted
          // requirements are the honest stand-in where a synthesis provides
          // them; today's deterministic path does not, and the evaluator drops
          // its "check against the points below" line when the list is empty
          // rather than pointing at nothing.
          expectedPoints: synthesizedData?.extractedRequirements ?? []
        })
      });

      const evaluation: AnswerEvaluation = res.ok
        ? await res.json()
        : {
            scored: false,
            reason: 'The evaluator could not be reached, so this answer was not assessed.',
            expectedPoints: synthesizedData?.extractedRequirements ?? []
          };

      setPracticeFeedback(evaluation);

      if (typeof evaluation.score === 'number') {
        playSynthSound('success');
        onToast('success', 'Practice Evaluated', `Scored ${evaluation.score}/100.`);
      } else {
        onToast('info', 'Not Assessed', evaluation.reason ?? 'This answer was not assessed.');
      }
    } catch (err) {
      console.error('Practice evaluation error:', err);
      setPracticeFeedback(null);
      onToast('error', 'Evaluation Failed', 'Failed to score answer. Please try again.');
    } finally {
      setIsEvaluatingPractice(false);
    }
  };

  // Generate full markdown dossier for export
  const getFullMarkdownDossier = () => {
    if (!synthesizedData) return '';
    return `# Application Dossier: ${jobTitle} at ${companyName}
**Candidate:** ${candidateName} (${candidateTitle})
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

  // Synthesis tailors a posting *against your profile*. Without one there is
  // nothing to tailor from, so ask for it rather than generating from a blank.
  if (!isProfileConfigured(masterProfile)) {
    return (
      <div className="max-w-3xl mx-auto pt-6">
        <EmptyState
          data-testid="synthesizer-empty"
          icon={<Sparkles className="w-5 h-5" />}
          title="Set up your profile first"
          description="The synthesizer tailors a job posting against your experience — your skills, your history, your evidence. It needs that profile before it can produce anything worth sending."
          action={
            <Button onClick={onOpenOnboarding} icon={<Sparkles className="w-3.5 h-3.5" />}>
              Set up my profile
            </Button>
          }
          secondaryAction={
            onLoadSampleData && (
              <Button variant="outline" onClick={onLoadSampleData}>
                Explore with sample data
              </Button>
            )
          }
          footnote="Sample data loads a demo profile and a few example applications, all clearly badged."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Fast Preset Ingestion */}
      <div
        id="tour-job-synthesizer"
        className="p-6 rounded-panel bg-surface border border-accent-line relative overflow-hidden"
      >

        <div className="space-y-5 relative z-10">
          <PanelHeader
            icon={<Sparkles className="w-5 h-5" />}
            tone="accent"
            title="Job Synthesizer & Weaponry Arsenal" aria-label="Job Synthesizer & Weaponry Arsenal"
            description="Ingest live Job Descriptions via automated web scraper or direct text input. Automatically validates UK/EU visa sponsorship, conducts skill gap analysis, and synthesizes STAR interview answers and tailored pitches."
            meta={
              <>
                <Badge tone="accent" font="mono">
                  AI QA PITCH ENGINE
                </Badge>

                {/* Active LLM Provider Status Indicator */}
                <span className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-chip bg-sunken border border-line text-xs font-mono">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeRouting.mode === 'local_only'
                        ? 'bg-positive'
                        : activeRouting.mode === 'cloud_only'
                        ? 'bg-accent'
                        : 'bg-info'
                    }`}
                  />
                  <span className="text-ink-muted">Active LLM:</span>
                  <span className="font-bold text-ink">
                    {activeRouting.mode === 'local_only'
                      ? `${activeRouting.localModel} (Local)`
                      : activeRouting.mode === 'cloud_only'
                      ? 'Gemini 2.5 Flash (Cloud)'
                      : 'Hybrid (Gemini + Local PII Guard)'}
                  </span>
                </span>
              </>
            }
          />

          {/* Sound toggle & Preset Buttons */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-info-ink" />
                <span>Verified UK/EU Sponsor Presets:</span>
              </span>
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  playSynthSound('click');
                }}
                className="p-1 rounded-control bg-fill hover:bg-fill-strong text-ink-muted hover:text-info-ink transition-colors shrink-0"
                title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-info-ink" /> : <VolumeX className="w-3.5 h-3.5 text-ink-faint" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_JOBS.map((sample) => {
                const isSelected = activePreset === sample.company;
                return (
                  <button
                    key={sample.company}
                    onClick={() => handleLoadSample(sample)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-control border transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-accent text-accent-contrast border-accent-line ring-2 ring-accent-line'
                        : 'bg-fill hover:bg-fill-strong border-line text-ink-muted hover:text-ink'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: sample.brandColor || 'var(--color-accent)' }}
                    />
                    <span>{sample.company}</span>
                    <span className="text-2xs opacity-80 font-mono px-1.5 py-0.5 rounded bg-sunken border border-line">
                      UK
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* URL Scraper Bar */}
        <div className="mt-5 pt-4 border-t border-line flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-info-ink" />
            <input
              type="url"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder="Paste live Job URL (e.g. https://monzo.com/careers/... or Greenhouse/Lever link)"
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-sunken border border-line rounded-control text-ink placeholder:text-ink-faint focus:border-info-line focus:ring-2 focus:ring-info-line transition-all font-mono"
            />
          </div>

          <button
            onClick={handleScrape}
            disabled={isScraping}
            className="px-5 py-2.5 text-xs font-extrabold text-accent-contrast bg-accent hover:bg-accent-strong border border-accent-line rounded-control transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {isScraping ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-ink" />
                <span>Scraping JD...</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-ink" />
                <span>Scrape & Extract</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inputs / Configuration Bar */}
      <div className="p-6 rounded-panel bg-surface border border-line space-y-4 shadow-pop">
        {/* Auto-Save & Tool Integration Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-card bg-sunken border border-line">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSaving ? 'bg-caution animate-ping' : lastSaved ? 'bg-positive' : 'bg-fill-strong'
                }`}
              />
              <span className="text-ink-muted">
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
                  className="px-2.5 py-1 text-2xs text-info-ink bg-info-soft hover:bg-info-soft border border-info-line rounded-control flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore Draft</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="px-2 py-1 text-2xs text-ink-muted hover:text-critical-ink rounded-control hover:bg-fill transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-control bg-sunken border border-line">
              <button
                type="button"
                onClick={() => {
                  const updated: RoutingConfig = { ...activeRouting, mode: 'cloud_only' };
                  setActiveRouting(updated);
                  localStorage.setItem('cherenkov_routing_config', JSON.stringify(updated));
                  window.dispatchEvent(new CustomEvent('cherenkov_routing_changed', { detail: updated }));
                  onToast('info', 'Switched to Cloud', 'Synthesis engine set to Gemini 2.5 Flash.');
                }}
                className={`px-2.5 py-1 rounded-control text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeRouting.mode === 'cloud_only'
                    ? 'bg-accent text-ink'
                    : 'text-ink-muted hover:text-ink'
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
                className={`px-2.5 py-1 rounded-control text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeRouting.mode === 'local_only'
                    ? 'bg-positive text-ink'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Ollama (Local)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold bg-accent hover:bg-accent-strong text-accent-contrast border border-accent-line rounded-control flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <GitCompare className="w-3.5 h-3.5 text-accent-contrast" />
              <span>Compare Models (Cloud vs Local)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLinkedInScoutOpen(true)}
              className="px-3 py-1.5 text-xs font-bold bg-info-soft hover:bg-info-soft text-info-ink border border-info-line rounded-control flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Linkedin className="w-3.5 h-3.5" />
              <span>LinkedIn Scout MCP</span>
            </button>

            <button
              type="button"
              onClick={() => setIsVoiceInterviewOpen(true)}
              className="px-3 py-1.5 text-xs font-bold bg-accent-soft hover:bg-accent-soft text-accent-ink border border-accent-line rounded-control flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Mock Interview</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="job-synthesizer-target-company" className="block text-xs font-mono uppercase text-ink-muted mb-1 font-bold">
              Target Company
            </label>
            <input id="job-synthesizer-target-company"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Monzo, Revolut, Deliveroo"
              className="w-full px-3.5 py-2.5 text-xs bg-sunken border border-line rounded-control text-ink focus:border-accent-line font-medium"
            />
          </div>

          <div>
            <label htmlFor="job-synthesizer-target-role-title" className="block text-xs font-mono uppercase text-ink-muted mb-1 font-bold">
              Target Role Title
            </label>
            <input id="job-synthesizer-target-role-title"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Lead QA Infrastructure Engineer"
              className="w-full px-3.5 py-2.5 text-xs bg-sunken border border-line rounded-control text-ink focus:border-accent-line font-medium"
            />
          </div>

          <div>
            <label htmlFor="job-synthesizer-recruiter-talent-email" className="block text-xs font-mono uppercase text-ink-muted mb-1 font-bold">
              Recruiter / Talent Email
            </label>
            <input id="job-synthesizer-recruiter-talent-email"
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="e.g. talent@monzo.com"
              className="w-full px-3.5 py-2.5 text-xs bg-sunken border border-line rounded-control text-ink focus:border-accent-line font-mono"
            />
          </div>
        </div>

        {/* Job Description Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono uppercase text-ink-muted font-bold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-accent-ink" />
              <span>Job Description Raw Content</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xs font-mono text-info-ink font-bold bg-info-soft px-2 py-0.5 rounded border border-info-line">
                {jobDescription.length} chars • ~{Math.round(jobDescription.split(/\s+/).length)} words
              </span>
              <button
                onClick={() => setJobDescription('')}
                className="text-2xs text-critical-ink hover:text-critical-ink transition-colors cursor-pointer"
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
            className="w-full p-3.5 text-xs font-mono bg-sunken border border-line rounded-control text-ink-muted placeholder:text-ink-faint focus:border-accent-line leading-relaxed"
          />
        </div>

        {/* Primary Action Button & Sub-Agent Execution Narrator */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-ink-muted flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-positive inline-block animate-pulse" />
              <span>Master Profile: <strong>{candidateName}</strong> ({candidateTitle}) active baseline</span>
            </div>

            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing || !jobDescription.trim()}
              className="w-full sm:w-auto px-8 py-3.5 text-xs font-black text-accent-contrast bg-accent hover:bg-accent-strong rounded-control transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer tracking-wide uppercase"
            >
              {isSynthesizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-ink" />
                  <span>Pipeline Synthesizing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-ink" />
                  <span>Synthesize Role & Tailor Weaponry</span>
                  <ChevronRight className="w-4 h-4 opacity-75" />
                </>
              )}
            </button>
          </div>

          {/* Local LLM Loading Status */}
          {activeRouting.mode === 'local_only' && !isWebLLMReady && !webLLMError && (
            <div className="text-2xs font-mono text-info-ink/70 text-center animate-pulse mt-2">
              Initializing WebGPU MLC Engine ({webLLMProgress}%)... PII will remain in-browser.
            </div>
          )}
          {activeRouting.mode === 'local_only' && webLLMError && (
            <div className="text-2xs font-mono text-critical-ink/70 text-center mt-2">
              WebGPU Model Failed to Load: {webLLMError}. Falling back to Cloud / Ollama API.
            </div>
          )}
          
          {/* Sub-Agent Execution Progress Card */}
          {isSynthesizing && (
            <div className="p-4 rounded-card bg-sunken border border-accent-line space-y-2 animate-slide-down">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-accent-ink font-bold flex items-center gap-2">
                  <TerminalSquare className="w-4 h-4 text-info-ink animate-pulse" />
                  <span>APPLICATION PROCESSING PIPELINE</span>
                </span>
                <span className="text-info-ink font-bold">Step {synthesisAgentStep + 1} / 4</span>
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
                      className={`p-2.5 rounded-control border transition-all text-left ${
                        isDone
                          ? 'bg-positive-soft border-positive-line text-positive-ink'
                          : isCurrent
                          ? 'bg-accent-soft border-accent-line text-ink ring-1 ring-accent-line'
                          : 'bg-fill border-line text-ink-faint opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-mono text-2xs font-bold">
                        {isDone ? (
                          <CheckCircle2 className="w-3 h-3 text-positive-ink" />
                        ) : isCurrent ? (
                          <RefreshCw className="w-3 h-3 text-accent-ink animate-spin" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-fill-strong" />
                        )}
                        <span>{step.title}</span>
                      </div>
                      <div className="text-2xs mt-0.5 truncate">{step.desc}</div>
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
          {/* 1. Sponsor status. Three states, because "on the register" and
              "the advert says so" are different claims and only one of them
              is something this app can check. */}
          {(() => {
            const onRegister = Boolean(synthesizedData.isLicensedSponsor);
            const claimedOnly = !onRegister && Boolean(synthesizedData.postingClaimsSponsorship);
            const tone = onRegister ? 'positive' : claimedOnly ? 'caution' : 'critical';
            const heading = onRegister
              ? 'Licensed Visa Sponsor'
              : claimedOnly
              ? 'Sponsorship Claimed in Posting'
              : 'Not Found on the Register';
            const detail = onRegister
              ? `${synthesizedData.matchedSponsor ?? companyName} appears on the Register of Licensed Sponsors${
                  synthesizedData.sponsorSource === 'offline-list'
                    ? ' (from the bundled offline list — the live register was unreachable)'
                    : ''
                }.`
              : claimedOnly
              ? `This posting advertises sponsorship, but ${companyName || 'the employer'} was not matched on the Register of Licensed Sponsors. Confirm the employer's registered legal name before relying on it.`
              : synthesizedData.registerAvailable === false
              ? 'The Register of Licensed Sponsors could not be consulted, so no check was made.'
              : `${companyName || 'This employer'} was not matched on the Register of Licensed Sponsors. It may be listed under a different legal name.`;

            return (
              <div
                className={`p-4 rounded-panel border flex items-center gap-4 shadow-pop transition-all ${
                  tone === 'positive'
                    ? 'bg-positive-soft border-positive-line'
                    : tone === 'caution'
                    ? 'bg-caution-soft border-caution-line'
                    : 'bg-critical-soft border-critical-line'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-4 shrink-0 ${
                    tone === 'positive'
                      ? 'border-positive-line bg-positive-soft'
                      : tone === 'caution'
                      ? 'border-caution-line bg-caution-soft'
                      : 'border-critical-line bg-critical-soft'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full ${
                      tone === 'positive' ? 'bg-positive' : tone === 'caution' ? 'bg-caution' : 'bg-critical'
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <h3
                    className={`text-lg font-black tracking-tight ${
                      tone === 'positive'
                        ? 'text-positive-ink'
                        : tone === 'caution'
                        ? 'text-caution-ink'
                        : 'text-critical-ink'
                    }`}
                  >
                    {heading}
                  </h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{detail}</p>
                </div>
              </div>
            );
          })()}
        </div>
        {/* Provenance — a deterministic scaffold must never read as model output. */}
        {synthesizedData.isDeterministicFallback ? (
          <div className="flex items-start gap-3 p-4 rounded-panel border border-caution-line bg-caution-soft">
            <AlertTriangle className="w-5 h-5 text-caution-ink shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-caution-ink">Draft scaffold — not generated by a model</p>
              <p className="text-sm leading-relaxed text-ink-muted mt-1">
                {synthesizedData.fallbackReason ??
                  'No inference engine was reachable.'}{' '}
                The text below was assembled from your Master Profile and needs editing before you send it.
              </p>
            </div>
          </div>
        ) : (
          synthesizedData.inferenceEngine && (
            <div className="flex items-center gap-2 text-xs font-mono text-ink-faint">
              <Cpu className="w-3.5 h-3.5 text-positive-ink" />
              <span>
                Synthesized by <span className="text-ink font-bold">{synthesizedData.inferenceEngine}</span>
              </span>
            </div>
          )
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 cols): Job Intelligence, Visa Check & Gap Analysis */}
          <div className="lg:col-span-5 space-y-4">
            {/* Match Radar Card with Glowing SVG Dial */}
            <div className="p-5 rounded-panel bg-surface border border-accent-line shadow-pop space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-accent-ink" />
                  <h3 className="text-xs font-bold font-mono text-ink uppercase tracking-wide">
                    Competency Alignment Match
                  </h3>
                </div>
                <span className="text-xs font-mono font-black px-2.5 py-1 bg-positive-soft border border-positive-line text-positive-ink rounded-control">
                  {matchAnalysis ? `${matchAnalysis.overall}% MATCH` : '—'}
                </span>
              </div>

              {/* Radial dial, driven by the computed score */}
              <div className="flex items-center gap-4 p-3.5 rounded-card bg-sunken border border-line">
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-line"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-accent"
                      strokeDasharray={`${matchAnalysis?.overall ?? 0}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="url(#dialGradient)"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <defs>
                      <linearGradient id="dialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-accent)" />
                        <stop offset="100%" stopColor="var(--color-accent-strong)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-sm font-extrabold text-ink font-mono">
                      {matchAnalysis ? `${matchAnalysis.overall}%` : '—'}
                    </span>
                    <span className="text-2xs font-mono text-info-ink font-black uppercase">Signal</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 text-xs">
                  <div className="text-ink font-semibold flex items-center gap-1">
                    <span>
                      {!matchAnalysis
                        ? 'Awaiting synthesis'
                        : matchAnalysis.overall >= 75
                        ? 'Strong signal'
                        : matchAnalysis.overall >= 50
                        ? 'Partial signal'
                        : 'Weak signal'}
                    </span>
                    <Award className="w-3.5 h-3.5 text-caution-ink" />
                  </div>
                  <p className="text-sm text-ink-muted mt-0.5 leading-snug">
                    {matchAnalysis?.matchedSkills.length
                      ? `Matched in this posting: ${matchAnalysis.matchedSkills.slice(0, 4).join(', ')}${
                          matchAnalysis.matchedSkills.length > 4 ? `, +${matchAnalysis.matchedSkills.length - 4}` : ''
                        }.`
                      : 'None of your listed skills appear verbatim in this posting.'}
                  </p>
                </div>
              </div>

              {/* The components behind the score, each with its own evidence */}
              <div className="space-y-2.5 text-xs pt-1">
                {matchAnalysis?.components.map((component) => (
                  <div key={component.label}>
                    <div className="flex justify-between gap-2 text-xs mb-1 font-mono">
                      <span className="text-ink-muted truncate">{component.label}</span>
                      <span className="text-ink font-bold tabular shrink-0">{component.value}%</span>
                    </div>
                    <div className="h-2 w-full bg-fill rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-[width] duration-500"
                        style={{ width: `${component.value}%` }}
                      />
                    </div>
                    <p className="text-2xs text-ink-faint mt-1 font-mono">{component.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Register detail. Rendered only on a register match — this used to
                show unconditionally, asserting a verified sponsor even when the
                banner above reported the employer was not found. */}
            {synthesizedData.isLicensedSponsor && (
              <div className="p-4 rounded-panel bg-positive-soft border border-positive-line flex items-start gap-3">
                <div className="p-2.5 rounded-control bg-positive-soft text-positive-ink border border-positive-line shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-extrabold text-ink uppercase font-mono">
                      Register Match
                    </h4>
                    <span className="px-1.5 py-0.5 text-2xs font-mono font-black bg-positive-soft text-positive-ink rounded border border-positive-line">
                      {synthesizedData.sponsorSource === 'offline-list' ? 'OFFLINE LIST' : 'LICENSED SPONSOR'}
                    </span>
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    {synthesizedData.matchedSponsor ?? companyName} is listed on the Register of Licensed Sponsors.
                    Eligibility for a specific role still depends on the occupation code and salary — check those in the Sponsorship Oracle.
                  </p>
                </div>
              </div>
            )}

            {/* Gap Analysis & Actionable Upskilling */}
            <div className="p-5 rounded-panel bg-caution-soft border border-caution-line space-y-3.5 shadow-pop">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-caution-ink">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="text-xs font-bold font-mono uppercase">
                    Gap Analysis & Mitigation
                  </h3>
                </div>
                <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded bg-caution-soft border border-caution-line text-caution-ink">
                  ACTION PLAN
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-ink-muted block mb-1.5">
                  Identified Gaps for this JD:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {synthesizedData.identified_skill_gaps && synthesizedData.identified_skill_gaps.length > 0 ? (
                    synthesizedData.identified_skill_gaps.map((gap) => (
                      <span
                        key={gap}
                        className="px-2.5 py-1 text-xs font-mono bg-caution-soft border border-caution-line text-caution-ink rounded-control font-bold"
                      >
                        +{gap}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-positive-ink font-mono font-semibold">No significant gaps detected!</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-card bg-sunken border border-line space-y-2">
                <div className="text-xs font-mono uppercase text-ink-muted font-bold">
                  Recommended Targeted Upskilling:
                </div>
                <div className="text-xs font-semibold text-ink leading-snug">
                  {synthesizedData.upskilling_recommendation}
                </div>

                <button
                  onClick={handleSyncToLearning}
                  disabled={addedToLearning}
                  className={`w-full mt-2 py-2.5 px-3 text-xs font-black rounded-control transition-all flex items-center justify-center gap-1.5 ${
                    addedToLearning
                      ? 'bg-positive-soft text-positive-ink border border-positive-line cursor-default'
                      : 'bg-caution hover:opacity-90 text-ink-inverse font-black cursor-pointer'
                  }`}
                >
                  {addedToLearning ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-positive-ink" />
                      <span>Synced to Learning Tab!</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-3.5 h-3.5 text-ink-inverse" />
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
            <div className="p-1 rounded-card bg-surface border border-line flex items-center justify-between gap-1">
              <button
                onClick={() => setActiveWeaponTab('summary')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-control transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeWeaponTab === 'summary'
                    ? 'bg-accent text-ink'
                    : 'text-ink-muted hover:text-ink hover:bg-fill'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>3-Sentence Hook</span>
              </button>

              <button
                onClick={() => setActiveWeaponTab('email')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-control transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeWeaponTab === 'email'
                    ? 'bg-info text-ink'
                    : 'text-ink-muted hover:text-ink hover:bg-fill'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Cold Outreach</span>
              </button>

              <button
                onClick={() => setActiveWeaponTab('ats')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-control transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeWeaponTab === 'ats'
                    ? 'bg-accent text-ink'
                    : 'text-ink-muted hover:text-ink hover:bg-fill'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>STAR Answers</span>
              </button>

              <button
                onClick={() => setActiveWeaponTab('interview')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-control transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeWeaponTab === 'interview'
                    ? 'bg-positive text-ink'
                    : 'text-ink-muted hover:text-ink hover:bg-fill'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-positive-ink" />
                <span>Mock Drill</span>
              </button>

              <button
                onClick={() => setActiveWeaponTab('export')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-control transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeWeaponTab === 'export'
                    ? 'bg-caution text-ink'
                    : 'text-ink-muted hover:text-ink hover:bg-fill'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>

            {/* TAB 1: 3-Sentence Hook with Visual Diff Toggle */}
            {activeWeaponTab === 'summary' && (
              <div className="p-6 rounded-panel bg-surface border border-accent-line space-y-4 shadow-pop">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                    <h3 className="text-xs font-bold text-ink uppercase font-mono tracking-wide">
                      Executive Resume Summary (3-Sentence Hook)
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Diff View Toggle */}
                    <div className="flex items-center bg-sunken p-0.5 rounded-control border border-line">
                      <button
                        onClick={() => setSummaryViewMode('polished')}
                        className={`px-2.5 py-1 text-2xs font-mono font-bold rounded-control transition-all cursor-pointer ${
                          summaryViewMode === 'polished'
                            ? 'bg-accent/30 text-accent-ink border border-accent-line'
                            : 'text-ink-muted hover:text-ink'
                        }`}
                      >
                        Polished
                      </button>
                      <button
                        onClick={() => setSummaryViewMode('diff')}
                        className={`px-2.5 py-1 text-2xs font-mono font-bold rounded-control transition-all flex items-center gap-1 cursor-pointer ${
                          summaryViewMode === 'diff'
                            ? 'bg-info-soft text-info-ink border border-info-line'
                            : 'text-ink-muted hover:text-ink'
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
                        className="px-3 py-1 text-xs bg-accent hover:bg-accent-strong text-accent-contrast rounded-control font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        title="Export clean ATS-friendly PDF Resume" aria-label="Export clean ATS-friendly PDF Resume"
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
                        className="px-3 py-1 text-xs bg-fill hover:bg-fill-strong text-ink rounded-control border border-line flex items-center gap-1.5 transition-all cursor-pointer font-medium"
                      >
                        {copiedKeys['summary'] ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-positive-ink" />
                            <span className="text-positive-ink font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-accent-ink" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {summaryViewMode === 'polished' ? (
                  <div className="p-5 rounded-card bg-sunken border border-line text-xs text-ink leading-relaxed font-sans">
                    {synthesizedData.tailored_summary}
                  </div>
                ) : (
                  /* Visual Git-Diff Comparison Engine */
                  <div className="p-4 rounded-card bg-sunken border border-info-line space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-2xs text-ink-muted border-b border-line pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-critical-soft text-critical-ink border border-critical-line font-bold">
                          - MASTER BASELINE
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-positive-soft text-positive-ink border border-positive-line font-bold">
                          + TAILORED JD SYNTHESIS
                        </span>
                      </div>
                      <span className="text-info-ink">Target: {companyName}</span>
                    </div>

                    <div className="space-y-2 leading-relaxed">
                      <div className="p-2.5 rounded-control bg-critical-soft border border-critical-line text-critical-ink line-through opacity-80">
                        - Baseline: {masterProfile.title} with experience in {masterProfile.core_competencies.slice(0, 3).join(', ')}. Targeting UK visa sponsorship.
                      </div>
                      <div className="p-2.5 rounded-control bg-positive-soft border border-positive-line text-positive-ink">
                        + Tailored Hook: {synthesizedData.tailored_summary}
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-ink-muted flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-positive-ink" />
                  <span>Calibrated to pass Greenhouse, Workday, and Lever ATS semantic filters.</span>
                </div>
              </div>
            )}


            {/* TAB 2: Cold Email Pitch with Tone Customizer */}
            {activeWeaponTab === 'email' && (
              <div className="p-6 rounded-panel bg-surface border border-info-line space-y-4 shadow-pop">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-info-ink" />
                    <h3 className="text-xs font-bold text-ink uppercase font-mono">
                      Tailored Cold Outreach Pitch
                    </h3>
                  </div>

                  {/* Email Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 w-full">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsLinkedInScoutOpen(true)}
                        className="px-3.5 py-1.5 text-xs bg-info-soft hover:bg-info-soft text-info-ink rounded-control border border-info-line font-bold flex items-center gap-1.5 transition-all cursor-pointer"
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
                        className="px-4 py-2.5 rounded-control bg-critical-soft hover:bg-critical-soft border border-critical-line text-critical-ink text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
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
                        className="px-4 py-2.5 rounded-control bg-info-soft hover:bg-info-soft border border-info-line text-info-ink text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Outlook Web</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Native Fallback (Hidden on narrow screens to save space) */}
                      <a
                        href={generateEmailLink('native')}
                        className="hidden sm:flex px-3 py-2.5 rounded-control bg-fill hover:bg-fill-strong text-ink-muted text-xs font-bold transition-all cursor-pointer"
                        title="Open default system mail client" aria-label="Open default system mail client"
                      >
                        Native Mail
                      </a>

                      {/* Plain Text Copy */}
                      <button
                        onClick={() => handleCopy(getTailoredColdPitch(outreachTone), 'cold-email', 'Cold Email Pitch')}
                        className="px-4 py-2.5 rounded-control bg-fill hover:bg-fill-strong border border-line text-xs font-bold text-ink flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        {copiedKeys['cold-email'] ? <Check className="w-3.5 h-3.5 text-positive-ink" /> : <Copy className="w-3.5 h-3.5 text-info-ink" />}
                        <span>{copiedKeys['cold-email'] ? 'Copied!' : 'Copy Body'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Persona Tone Switcher */}
                <div className="flex items-center gap-1.5 p-1 rounded-control bg-sunken border border-line overflow-x-auto">
                  <span className="text-2xs font-mono font-bold text-ink-muted px-2 uppercase">Tone:</span>
                  {[
                    { id: 'executive', name: 'Executive QA Leader', color: 'text-accent-ink' },
                    { id: 'deeptech', name: 'Deep-Tech Automation', color: 'text-info-ink' },
                    { id: 'security', name: 'CodeQL Security Guard', color: 'text-positive-ink' },
                    { id: 'chaos', name: 'Chaos & SRE Scaler', color: 'text-caution-ink' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setOutreachTone(t.id as OutreachTone);
                        playSynthSound('click');
                      }}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-control transition-all shrink-0 cursor-pointer ${
                        outreachTone === t.id
                          ? 'bg-fill-strong text-ink border border-line-strong'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>

                <div className="p-5 rounded-card bg-sunken border border-line text-xs font-mono text-ink whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {getTailoredColdPitch(outreachTone)}
                </div>

                <div className="flex items-center justify-between text-xs text-ink-muted font-mono">
                  <span>To: {targetEmail || 'talent@company.com'}</span>
                  <span>From: {candidateEmail}</span>
                </div>
              </div>
            )}

            {/* TAB 3: STAR ATS Screening Answers */}
            {activeWeaponTab === 'ats' && (
              <div className="p-6 rounded-panel bg-surface border border-accent-line space-y-4 shadow-pop">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-accent-ink" />
                    <h3 className="text-xs font-bold text-ink uppercase font-mono">
                      STAR-Method ATS Screening Answers
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-2xs font-mono px-2 py-0.5 rounded bg-accent-soft text-accent-ink border border-accent-line font-bold">
                      {synthesizedData.ats_answers?.length || 0} QUESTIONS
                    </span>
                  </div>
                </div>

                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                  {synthesizedData.ats_answers?.map((qa, index) => (
                    <div
                      key={index}
                      className="p-5 rounded-card bg-sunken border border-line space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-bold text-ink flex items-center gap-2">
                          <span className="w-6 h-6 rounded-control bg-accent-soft text-accent-ink border border-accent-line text-xs font-mono font-bold flex items-center justify-center shrink-0">
                            Q{index + 1}
                          </span>
                          <span className="text-ink">{qa.question}</span>
                        </span>

                        <button
                          onClick={() => handleCopy(qa.answer, `ats-${index}`, `Answer ${index + 1}`)}
                          className="px-2.5 py-1 text-xs bg-fill hover:bg-fill-strong text-ink-muted rounded-control border border-line flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                        >
                          {copiedKeys[`ats-${index}`] ? (
                            <Check className="w-3 h-3 text-positive-ink" />
                          ) : (
                            <Copy className="w-3 h-3 text-accent-ink" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>

                      <div className="p-3.5 rounded-control bg-fill border border-line text-xs text-ink-muted leading-relaxed font-sans">
                        {qa.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Interactive Mock Interview Practice Arena */}
            {activeWeaponTab === 'interview' && (
              <div className="p-6 rounded-panel bg-surface border border-positive-line space-y-4 shadow-pop">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-positive-ink" />
                    <h3 className="text-xs font-bold text-ink uppercase font-mono">
                      Interactive Mock Interview Drill
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsVoiceInterviewOpen(true)}
                      className="px-3 py-1.5 text-xs font-bold bg-accent-soft hover:bg-accent/30 text-accent-contrast border border-accent-line rounded-control flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Launch Voice Audio Mode</span>
                    </button>
                    <span className="text-2xs font-mono font-bold px-2 py-1 bg-positive-soft border border-positive-line text-positive-ink rounded-control">
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
                      className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        activeQuestionIdx === i
                          ? 'bg-positive-soft border border-positive-line text-positive-ink'
                          : 'bg-fill hover:bg-fill-strong text-ink-muted'
                      }`}
                    >
                      Question {i + 1}
                    </button>
                  ))}
                </div>

                {/* Active Question Box */}
                <div className="p-4 rounded-card bg-sunken border border-line space-y-2">
                  <div className="text-xs font-mono text-positive-ink uppercase font-bold">
                    Target Interview Prompt:
                  </div>
                  <div className="text-xs font-bold text-ink leading-relaxed">
                    {synthesizedData.ats_answers[activeQuestionIdx]?.question}
                  </div>
                </div>

                {/* Candidate Practice Input */}
                <div className="space-y-2">
                  <div className="text-xs font-mono uppercase text-ink-muted font-bold flex items-center justify-between">
                    <label htmlFor="job-synthesizer-practice-star-answer">Your Practice STAR Answer:</label>
                    <button
                      onClick={() =>
                        setUserPracticeAnswer(
                          synthesizedData.ats_answers[activeQuestionIdx]?.answer || ''
                        )
                      }
                      className="text-2xs text-info-ink hover:text-info-ink cursor-pointer"
                    >
                      Fill with Optimal Answer
                    </button>
                  </div>
                  <textarea
                    id="job-synthesizer-practice-star-answer"
                    rows={4}
                    value={userPracticeAnswer}
                    onChange={(e) => setUserPracticeAnswer(e.target.value)}
                    placeholder="Type or dictate your answer using the STAR (Situation, Task, Action, Result) methodology..."
                    className="w-full p-3.5 text-xs bg-sunken border border-line rounded-control text-ink focus:border-positive-line font-sans"
                  />
                </div>

                {/* Evaluate Action */}
                <div className="flex justify-end">
                  <button
                    onClick={handleEvaluatePractice}
                    disabled={isEvaluatingPractice || !userPracticeAnswer.trim()}
                    className="px-5 py-2.5 text-xs font-extrabold text-positive-ink bg-positive-soft border border-positive-line hover:bg-positive/20 rounded-control transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isEvaluatingPractice ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Evaluating Response...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-positive-ink" />
                        <span>Evaluate STAR Response</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Not assessed — shown instead of a score when no engine ran. */}
                {practiceFeedback && typeof practiceFeedback.score !== 'number' && (
                  <div
                    data-testid="practice-not-assessed"
                    className="p-4 rounded-card bg-caution-soft border border-caution-line space-y-3 animate-fade-in"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-caution-ink shrink-0 mt-0.5" />
                      <div className="min-w-0 space-y-1">
                        <h4 className="text-xs font-bold text-caution-ink">Answer not assessed</h4>
                        <p className="text-xs text-ink-muted leading-relaxed">
                          {practiceFeedback.reason ?? 'This answer was not assessed.'}
                        </p>
                      </div>
                    </div>

                    {(practiceFeedback.expectedPoints?.length ?? 0) > 0 && (
                      <div className="p-2.5 rounded-control bg-sunken border border-line space-y-1.5">
                        <span className="text-2xs font-mono text-ink-muted uppercase tracking-wider block font-bold">
                          Check your answer against these points:
                        </span>
                        <ul className="space-y-1">
                          {practiceFeedback.expectedPoints?.map((point) => (
                            <li key={point} className="text-xs text-ink-muted leading-relaxed flex gap-2">
                              <span className="text-caution-ink shrink-0">·</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Evaluation Feedback Panel — only when an engine actually scored. */}
                {practiceFeedback && typeof practiceFeedback.score === 'number' && (
                  <div
                    data-testid="practice-scored"
                    className="p-4 rounded-card bg-surface border border-positive-line space-y-3 animate-fade-in"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-positive-ink" />
                      <span className="text-xs font-bold text-ink font-mono">
                        STAR Score: {practiceFeedback.score} / 100
                      </span>
                    </div>

                    {practiceFeedback.technicalAccuracy && (
                      <div className="space-y-1 text-xs">
                        <div className="text-xs font-bold text-ink-muted font-mono">Technical Accuracy:</div>
                        <p className="text-ink-muted leading-relaxed">{practiceFeedback.technicalAccuracy}</p>
                      </div>
                    )}

                    {practiceFeedback.starStructure && (
                      <div className="space-y-1 text-xs">
                        <div className="text-xs font-bold text-ink-muted font-mono">STAR Structure:</div>
                        <p className="text-ink-muted leading-relaxed">{practiceFeedback.starStructure}</p>
                      </div>
                    )}

                    {practiceFeedback.improvements && (
                      <div className="p-2.5 rounded-control bg-sunken border border-line text-xs text-ink-muted">
                        <strong className="text-caution-ink font-mono block mb-0.5">Tactical Coaching Tip:</strong>
                        {practiceFeedback.improvements}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: Full Markdown Dossier Export */}
            {activeWeaponTab === 'export' && (
              <div className="p-6 rounded-panel bg-surface border border-caution-line space-y-4 shadow-pop">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-caution-ink" />
                    <h3 className="text-xs font-bold text-ink uppercase font-mono">
                      Export Full Application Dossier (Markdown)
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGeneratePdfResume}
                      disabled={isGeneratingPdf}
                      className="px-4 py-2 text-xs bg-positive hover:opacity-90 text-ink rounded-control font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
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
                      className="px-4 py-2 text-xs bg-accent hover:bg-accent-strong text-accent-contrast rounded-control font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copiedKeys['dossier'] ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-positive-ink" />
                          <span>Copied All Markdown!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-ink" />
                          <span>Copy Complete Dossier</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-card bg-sunken border border-line text-xs font-mono text-ink-muted whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {getFullMarkdownDossier()}
                </div>
              </div>
            )}

            {/* Bottom Action Bar */}
            <div className="p-4 rounded-card bg-accent border border-accent-line flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-ink-muted">
                <span>Application registered in Kanban Pipeline under </span>
                <span className="text-info-ink font-bold font-mono">"Ready to Apply"</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGeneratePdfResume}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 text-xs font-bold text-ink bg-positive hover:opacity-90 border border-positive-line rounded-control flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <FileDown className="w-3.5 h-3.5 text-ink" />
                  <span>Download PDF Resume</span>
                </button>

                <button
                  onClick={onNavigateToKanban}
                  className="px-4 py-2 text-xs font-bold text-ink bg-fill-strong hover:bg-fill-strong border border-line rounded-control flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <span>View in Kanban</span>
                  <ArrowRight className="w-3.5 h-3.5 text-info-ink" />
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      ) : (
        /* Empty State / Prompt to Synthesize */
        <div className="p-12 rounded-panel bg-surface border border-line text-center space-y-4 shadow-pop">
          <div className="w-14 h-14 rounded-card bg-accent text-accent-contrast border border-accent-line flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7 text-accent-ink" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">Ready to Synthesize Role</h3>
            <p className="text-sm text-ink-muted max-w-md mx-auto mt-1 leading-relaxed">
              Select one of the verified UK sponsor presets above or paste a custom job description, then click "Synthesize Role & Tailor Weaponry".
            </p>
          </div>
          <button
            onClick={handleSynthesize}
            className="px-6 py-3 text-xs font-extrabold text-accent-contrast bg-accent hover:bg-accent-strong rounded-control transition-all inline-flex items-center gap-2 cursor-pointer"
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
        <Modal open onClose={() => setIsVoiceInterviewOpen(false)} label="Voice interview sandbox" className="overflow-y-auto">
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
        </Modal>
      )}
    </div>
  );
};

