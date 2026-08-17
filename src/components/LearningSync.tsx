import React, { useState, useEffect } from 'react';
import { MasterProfile, LearningCert } from '../types';
import {
  GraduationCap,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Zap,
  ExternalLink,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Trash2,
  Check,
  Layers,
  Flame,
  Code2,
  Filter,
  CheckCircle,
  Webhook,
  Copy,
  Radio,
  Play,
  Terminal,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LearningSyncProps {
  masterProfile: MasterProfile;
  onUpdateProfile: (updated: MasterProfile) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

const PRESET_PATHWAYS = [
  {
    title: 'Distributed Performance & Stress Testing at Scale',
    provider: 'k6 Academy',
    skills: ['k6', 'Distributed Load', 'Grafana k6 Cloud', 'SLO Budgeting'],
    badge: 'Performance',
    color: 'from-amber-500/20 to-orange-500/10',
    borderColor: 'border-amber-500/30'
  },
  {
    title: 'Static Application Security Testing & CodeQL Gateways',
    provider: 'GitHub Skills',
    skills: ['CodeQL', 'AST Vulnerability Querying', 'SARIF Reports'],
    badge: 'Security',
    color: 'from-cyan-500/20 to-blue-500/10',
    borderColor: 'border-cyan-500/30'
  },
  {
    title: 'Autonomous Multi-Agent Systems for QA Automation',
    provider: 'DeepLearning.AI',
    skills: ['Qwen', 'AnythingLLM', 'Self-Healing Test Agents', 'cherenkov-qa'],
    badge: 'AI & Agents',
    color: 'from-violet-500/20 to-fuchsia-500/10',
    borderColor: 'border-violet-500/30'
  },
  {
    title: 'Modern Cloud-Native Observability & Chaos Engineering',
    provider: 'Chaos Mesh & CNCF',
    skills: ['Chaos Engineering', 'OpenTelemetry', 'Kubernetes Probes', 'Resilience Matrix'],
    badge: 'Infrastructure',
    color: 'from-emerald-500/20 to-teal-500/10',
    borderColor: 'border-emerald-500/30'
  }
];

export const LearningSync: React.FC<LearningSyncProps> = ({
  masterProfile,
  onUpdateProfile,
  onToast
}) => {
  const [courses, setCourses] = useState<LearningCert[]>(masterProfile.learning_certs || []);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');

  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('Coursera');
  const [status, setStatus] = useState<'In Progress' | 'Completed'>('In Progress');
  const [skillsInput, setSkillsInput] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');

  // Listen to Server-Sent Events (SSE) for live xAPI updates
  useEffect(() => {
    const evtSource = new EventSource("/api/webhooks/xapi/stream");
    
    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.verb === "completed") {
          const newCert: LearningCert = {
            id: `cert-xapi-${Date.now()}`,
            title: data.object || "External Course",
            provider: "xAPI Webhook",
            status: "Completed",
            dateCompleted: data.timestamp ? data.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
            extracted_skills: data.extractedSkills || [],
            badge_color: 'emerald'
          };
          
          setCourses(prev => {
            const next = [newCert, ...prev];
            // To prevent infinite loops we only update if it's a genuine new event
            onUpdateProfile({ ...masterProfile, learning_certs: next });
            return next;
          });
          onToast('success', 'xAPI Event Received', `Course "${data.object}" completed!`);
          
          try {
            confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
          } catch {}
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };
    
    return () => evtSource.close();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Complete course and sync skills into MasterProfile
  const handleToggleComplete = (courseId: string) => {
    const updatedCourses = courses.map((c) => {
      if (c.id === courseId) {
        const nextStatus: 'In Progress' | 'Completed' =
          c.status === 'Completed' ? 'In Progress' : 'Completed';
        return {
          ...c,
          status: nextStatus,
          dateCompleted:
            nextStatus === 'Completed'
              ? new Date().toISOString().split('T')[0]
              : undefined
        };
      }
      return c;
    });

    setCourses(updatedCourses);

    const targetedCourse = updatedCourses.find((c) => c.id === courseId);
    if (targetedCourse && targetedCourse.status === 'Completed') {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {}

      const existingTech = new Set(masterProfile.tech_stack);
      targetedCourse.extracted_skills.forEach((s) => existingTech.add(s.trim()));

      const updatedProfile: MasterProfile = {
        ...masterProfile,
        tech_stack: Array.from(existingTech),
        learning_certs: updatedCourses
      };

      onUpdateProfile(updatedProfile);
      onToast(
        'success',
        'Competency Injected into Master Profile',
        `Acquired skills: ${targetedCourse.extracted_skills.join(', ')}.`
      );
    } else {
      const updatedProfile: MasterProfile = {
        ...masterProfile,
        learning_certs: updatedCourses
      };
      onUpdateProfile(updatedProfile);
      onToast('info', 'Status Updated', `Course moved back to In Progress.`);
    }
  };

  const handleEnrollPreset = (preset: typeof PRESET_PATHWAYS[0]) => {
    // Check if already enrolled
    const exists = courses.some((c) => c.title.toLowerCase() === preset.title.toLowerCase());
    if (exists) {
      onToast('info', 'Already Enrolled', `"${preset.title}" is already in your learning matrix.`);
      return;
    }

    const newCert: LearningCert = {
      id: `cert-${Date.now()}`,
      title: preset.title,
      provider: preset.provider,
      status: 'In Progress',
      extracted_skills: preset.skills,
      badge_color: 'indigo'
    };

    const nextCourses = [newCert, ...courses];
    setCourses(nextCourses);

    const nextProfile: MasterProfile = {
      ...masterProfile,
      learning_certs: nextCourses
    };

    onUpdateProfile(nextProfile);
    onToast(
      'success',
      'Pathway Enrolled',
      `"${preset.title}" added to active upskilling pathways.`
    );
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onToast('error', 'Title Required', 'Please enter course or certification title.');
      return;
    }

    const extracted = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newCert: LearningCert = {
      id: `cert-${Date.now()}`,
      title: title.trim(),
      provider: provider.trim(),
      status,
      dateCompleted: status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined,
      extracted_skills: extracted.length > 0 ? extracted : ['QA Skill'],
      credential_url: credentialUrl.trim() || undefined,
      badge_color: status === 'Completed' ? 'emerald' : 'indigo'
    };

    const nextCourses = [newCert, ...courses];
    setCourses(nextCourses);

    let nextTech = masterProfile.tech_stack;
    if (status === 'Completed') {
      const set = new Set(masterProfile.tech_stack);
      newCert.extracted_skills.forEach((s) => set.add(s));
      nextTech = Array.from(set);

      try {
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.6 }
        });
      } catch {}
    }

    const nextProfile: MasterProfile = {
      ...masterProfile,
      tech_stack: nextTech,
      learning_certs: nextCourses
    };

    onUpdateProfile(nextProfile);

    setTitle('');
    setSkillsInput('');
    setCredentialUrl('');
    setIsAddingCourse(false);

    onToast(
      'success',
      'Course Added to Sync Engine',
      `"${newCert.title}" registered.`
    );
  };

  const handleDeleteCourse = (id: string) => {
    const filtered = courses.filter((c) => c.id !== id);
    setCourses(filtered);
    const nextProfile: MasterProfile = {
      ...masterProfile,
      learning_certs: filtered
    };
    onUpdateProfile(nextProfile);
    onToast('info', 'Pathway Removed', 'Removed course from pipeline.');
  };

  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [webhookLog, setWebhookLog] = useState<{ time: string; event: string; status: string }[]>([
    { time: '18:42:10', event: 'POST /api/webhooks/xapi (k6 Performance Course)', status: '200 OK - Synced' },
    { time: '17:15:04', event: 'POST /api/webhooks/xapi (CodeQL AST Certification)', status: '200 OK - Synced' }
  ]);

  const handleSimulateWebhook = async () => {
    setIsSimulatingWebhook(true);
    try {
      const simulatedCourse: LearningCert = {
        id: `xapi-${Date.now()}`,
        title: 'DeepLearning.AI: Self-Healing QA Agents & MCP Orchestration',
        provider: 'DeepLearning.AI (xAPI)',
        status: 'Completed',
        dateCompleted: new Date().toISOString().split('T')[0],
        extracted_skills: ['Autonomous Test Healing', 'MCP Protocol', 'Qwen 2.5 Inference', 'Agentic QA Guardrails'],
        badge_color: 'violet',
        credential_url: 'https://credentials.deeplearning.ai/verify/cherenkov-nexus-agent-2026'
      };

      // Ingest into courses
      const nextCourses = [simulatedCourse, ...courses.filter(c => c.title !== simulatedCourse.title)];
      setCourses(nextCourses);

      // Inject skills into MasterProfile
      const nextTechSet = new Set(masterProfile.tech_stack);
      simulatedCourse.extracted_skills.forEach(s => nextTechSet.add(s));
      const nextTech = Array.from(nextTechSet);

      const nextProfile: MasterProfile = {
        ...masterProfile,
        tech_stack: nextTech,
        learning_certs: nextCourses
      };
      onUpdateProfile(nextProfile);

      // Update Webhook Log
      const newEntry = {
        time: new Date().toLocaleTimeString(),
        event: 'POST /api/webhooks/xapi (Self-Healing QA Agents)',
        status: '200 OK - Extracted 4 Skills'
      };
      setWebhookLog(prev => [newEntry, ...prev.slice(0, 4)]);

      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch {}

      onToast(
        'success',
        'xAPI Webhook Received & Synced',
        'Inbound LMS statement parsed: 4 verified skills automatically injected into Master Profile!'
      );
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  const completedCount = courses.filter((c) => c.status === 'Completed').length;
  const inProgressCount = courses.filter((c) => c.status === 'In Progress').length;
  const totalSkillsAcquired = courses
    .filter((c) => c.status === 'Completed')
    .reduce((acc, c) => acc + c.extracted_skills.length, 0);

  const filteredCourses = courses.filter((c) => {
    if (activeCategoryFilter === 'All') return true;
    if (activeCategoryFilter === 'Completed') return c.status === 'Completed';
    if (activeCategoryFilter === 'In Progress') return c.status === 'In Progress';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0e1324] via-[#0d101c] to-[#07090e] border border-violet-500/25 shadow-[0_10px_40px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-gradient-to-br from-violet-600/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Learning Sync & Competency Matrix
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-violet-500/20 border border-violet-500/40 text-violet-300 rounded-full">
              AUTO-PROFILE PROPAGATION
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Target ATS skill gaps identified during Job Synthesis. When you complete any pathway or certification, its verified competencies automatically inject into Moayed's active Master Profile.
          </p>
        </div>

        <button
          onClick={() => setIsAddingCourse(true)}
          className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 rounded-xl transition-all shadow-lg shadow-violet-600/25 flex items-center gap-1.5 shrink-0 cursor-pointer relative z-10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Pathway</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c101a] border border-emerald-500/25 shadow-lg flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">{completedCount}</div>
            <div className="text-xs font-medium text-slate-400">Completed Credentials</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c101a] border border-amber-500/25 shadow-lg flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">{inProgressCount}</div>
            <div className="text-xs font-medium text-slate-400">Active Upskilling Pathways</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c101a] border border-cyan-500/25 shadow-lg flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-cyan-300 font-mono">+{totalSkillsAcquired}</div>
            <div className="text-xs font-medium text-slate-400">Competencies Injected into Profile</div>
          </div>
        </div>
      </div>

      {/* Real-Time xAPI Sync Webhook & LRS Listener */}
      <div
        id="tour-sync-webhook"
        className="p-6 rounded-3xl bg-[#0c101a] border border-amber-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.5)] relative overflow-hidden space-y-4"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0">
              <Webhook className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Continuous xAPI Learning Sync Webhook
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 text-amber-400 animate-ping" />
                  LISTENER ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Connect external LMS providers (Coursera, Udemy, Pluralsight) or custom LRS streams. Inbound statement triggers immediately parse extracted competencies and auto-update your active Master Profile with zero manual data entry.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText('https://nexus.cherenkov.internal/api/webhooks/xapi');
                onToast('info', 'Webhook URL Copied', 'Endpoint URL copied to clipboard.');
              }}
              className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Endpoint</span>
            </button>

            <button
              onClick={handleSimulateWebhook}
              disabled={isSimulatingWebhook}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSimulatingWebhook ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Simulate xAPI Inbound Telemetry</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Webhook Endpoint & Telemetry Activity Stream */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 relative z-10">
          <div className="p-3.5 rounded-2xl bg-[#06080e] border border-white/[0.08] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Inbound Webhook URI</div>
                <div className="text-xs font-mono text-cyan-300 font-semibold truncate max-w-[280px]">
                  POST /api/webhooks/xapi
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              TLS 1.3
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#06080e] border border-white/[0.08] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Recent Telemetry Activity</div>
                <div className="text-xs font-mono text-slate-300 truncate max-w-[280px]">
                  {webhookLog[0]?.event || 'Awaiting incoming statements'}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {webhookLog[0]?.time || 'Idle'}
            </span>
          </div>
        </div>
      </div>

      {/* Fast Preset Upskilling Tracks */}
      <div className="p-6 rounded-3xl bg-[#0c101a] border border-white/[0.08] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
              High-Yield QA Lead Upskilling Pathways
            </h3>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono font-bold">1-Click Fast Enroll</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {PRESET_PATHWAYS.map((p, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl bg-gradient-to-b ${p.color} bg-[#07090e] border ${p.borderColor} hover:border-white/[0.2] transition-all flex flex-col justify-between gap-3 shadow-md`}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                  <span className="text-cyan-300 font-bold">{p.provider}</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 font-bold">
                    {p.badge}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white leading-snug">{p.title}</h4>
              </div>

              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-1">
                  {p.skills.slice(0, 3).map((s) => (
                    <span key={s} className="px-1.5 py-0.5 text-[9px] font-mono bg-black/40 text-slate-300 rounded">
                      +{s}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleEnrollPreset(p)}
                  className="w-full py-2 text-xs font-bold bg-white/[0.06] hover:bg-violet-600 hover:text-white text-slate-200 rounded-xl transition-all border border-white/[0.08] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enroll in Pathway</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Course Form Card */}
      {isAddingCourse && (
        <div className="p-6 rounded-3xl bg-[#0c101a] border border-violet-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-400" />
              <span>Enroll & Track Custom Upskilling Course</span>
            </h3>
            <button
              onClick={() => setIsAddingCourse(false)}
              className="text-xs text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleAddCourse} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">
                  Course or Certification Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AWS Certified DevOps or Advanced Playwright Architecture"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">
                  Provider Platform
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="Coursera">Coursera</option>
                  <option value="Udemy">Udemy</option>
                  <option value="DeepLearning.AI">DeepLearning.AI</option>
                  <option value="k6 Academy">k6 Academy</option>
                  <option value="GitHub Skills">GitHub Skills</option>
                  <option value="AWS Training">AWS Training & Certification</option>
                  <option value="Independent Research">Independent Research / Framework Creation</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">
                  Extracted Tech Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g. Kubernetes, Chaos Mesh, Distributed Tracing"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#07090e] border border-white/[0.08] rounded-xl text-cyan-300 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed (Auto-syncs into Master Profile)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingCourse(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 rounded-xl shadow-md shadow-violet-600/30 cursor-pointer"
              >
                Save & Track Course
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
            <span>Active Learning Pathways ({courses.length})</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </h3>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {['All', 'In Progress', 'Completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCategoryFilter(tab)}
                className={`px-3 py-1 text-xs rounded-lg transition-all cursor-pointer font-medium ${
                  activeCategoryFilter === tab
                    ? 'bg-violet-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCourses.map((course) => {
            const isDone = course.status === 'Completed';
            return (
              <div
                key={course.id}
                className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between shadow-xl ${
                  isDone
                    ? 'bg-[#0c101a] border-emerald-500/35 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                    : 'bg-[#0c101a] border-white/[0.08] hover:border-violet-500/30'
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-cyan-400 block">
                        {course.provider}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{course.title}</h4>
                    </div>

                    <button
                      onClick={() => handleToggleComplete(course.id)}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isDone
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'bg-white/[0.04] text-slate-300 hover:bg-gradient-to-r hover:from-violet-600 hover:to-cyan-500 hover:text-white border border-white/[0.08]'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Completed</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Mark Complete</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Skills extracted */}
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1.5 font-bold">
                      Extracted Competencies:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {course.extracted_skills.map((skill) => (
                        <span
                          key={skill}
                          className={`px-2.5 py-1 text-xs font-mono rounded-lg font-bold ${
                            isDone
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                              : 'bg-[#07090e] border border-white/[0.08] text-slate-200'
                          }`}
                        >
                          +{skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {isDone ? (
                      <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        Injected into Master Profile
                      </span>
                    ) : (
                      <span className="text-amber-400 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        In Progress
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remove course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
