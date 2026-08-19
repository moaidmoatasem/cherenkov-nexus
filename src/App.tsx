import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterProfile, ApplicationCard, AppTheme, TabId, CandidateArchetype } from './types';
import { INITIAL_MASTER_PROFILE, INITIAL_APPLICATIONS, ARCHETYPE_PRESETS } from './data/initialData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { JobSynthesizer } from './components/JobSynthesizer';
import { KanbanBoard } from './components/KanbanBoard';
import { LearningSync } from './components/LearningSync';
import { Marketplace } from './components/Marketplace';
import { AgentCanvas } from './components/AgentCanvas';
import { HiveMind } from './components/HiveMind';
import { IdentityVaultModal } from './components/IdentityVaultModal';
import { OnboardingModal } from './components/OnboardingModal';
import { MasterProfileModal } from './components/MasterProfileModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { CommandPalette } from './components/CommandPalette';
import { TelemetryModal } from './components/TelemetryModal';
import { SystemTour } from './components/SystemTour';
import { OracleWorkbench } from './components/OracleWorkbench';
import { WORKSPACES } from './navigation';
import { cn, Modal } from './components/ui';

export default function App() {
  const [masterProfile, setMasterProfile] = useState<MasterProfile>(() => {
    try {
      const saved = localStorage.getItem('cherenkov_master_profile');
      return saved ? JSON.parse(saved) : INITIAL_MASTER_PROFILE;
    } catch {
      return INITIAL_MASTER_PROFILE;
    }
  });

  const [applications, setApplications] = useState<ApplicationCard[]>(() => {
    try {
      const saved = localStorage.getItem('cherenkov_applications');
      return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
    } catch {
      return INITIAL_APPLICATIONS;
    }
  });

  const [activeTab, setActiveTab] = useState<TabId>('synthesizer');
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('cherenkov_theme');
      return (saved as AppTheme) || 'cyber';
    } catch {
      return 'cyber';
    }
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isIdentityVaultOpen, setIsIdentityVaultOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [kanbanBackend, setKanbanBackend] = useState<'live' | 'local' | 'syncing'>('syncing');
  const hydratedFromApiRef = useRef(false);

  // System tour initialization
  useEffect(() => {
    // Tour is explicitly user-triggered via Header/Sidebar actions
  }, []);

  // Apply theme class to document body
  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Persist masterProfile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cherenkov_master_profile', JSON.stringify(masterProfile));
    } catch (e) {
      console.error('Failed to persist masterProfile to localStorage:', e);
    }
  }, [masterProfile]);

  // Persist applications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cherenkov_applications', JSON.stringify(applications));
    } catch (e) {
      console.error('Failed to persist applications to localStorage:', e);
    }
  }, [applications]);

  // Hydrate applications from the persistent Kanban backend (SQLite via /api/kanban/state)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const res = await fetch('/api/kanban/state', { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const tasks = await res.json();
        if (cancelled) return;
        if (Array.isArray(tasks) && tasks.length > 0) {
          setApplications(
            tasks.map((task: any) => ({
              id: task.id,
              jobTitle: task.jobTitle ?? '',
              company: task.company ?? '',
              location: task.location ?? '',
              salary: task.salary ?? undefined,
              column: (task.column ?? 'Saved') as ApplicationCard['column'],
              createdAt: task.createdAt ?? new Date().toISOString(),
              updatedAt: task.updatedAt ?? new Date().toISOString(),
              jobDescription: task.jobDescription ?? '',
              matchScore: task.matchScore ?? undefined,
              contactEmail: task.coldEmail ?? undefined,
            }))
          );
        }
        if (!cancelled) setKanbanBackend('live');
      } catch {
        if (!cancelled) setKanbanBackend('local');
      } finally {
        hydratedFromApiRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist applications to the persistent Kanban backend (debounced)
  useEffect(() => {
    if (!hydratedFromApiRef.current) return;
    const timer = setTimeout(() => {
      fetch('/api/kanban/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          applications.map((app) => ({
            id: app.id,
            column: app.column,
            company: app.company,
            jobTitle: app.jobTitle,
            salary: app.salary,
            location: app.location,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt,
            matchScore: app.matchScore ?? 0,
            jobDescription: app.jobDescription,
            coldEmail: app.contactEmail,
          }))
        ),
      })
        .then((res) => {
          if (res.ok) setKanbanBackend('live');
        })
        .catch(() => {
          setKanbanBackend((prev) => (prev === 'live' ? prev : 'local'));
        });
    }, 600);
    return () => clearTimeout(timer);
  }, [applications]);

  // Persist theme choice to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cherenkov_theme', currentTheme);
    } catch (e) {
      console.error('Failed to persist currentTheme to localStorage:', e);
    }
  }, [currentTheme]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Add new synthesized or manual application
  const handleApplicationCreated = (app: ApplicationCard) => {
    setApplications((prev) => [app, ...prev]);
  };

  const handleUpdateApplication = (updated: ApplicationCard) => {
    setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleDeleteApplication = (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    addToast('info', 'Application Removed', 'Application card removed from pipeline.');
  };

  // Add course to LearningSync from Gap Analysis recommendation
  const handleAddCourseFromSynthesis = (title: string, provider: string, skills: string[]) => {
    const newCert = {
      id: `cert-${Date.now()}`,
      title,
      provider,
      status: 'In Progress' as const,
      extracted_skills: skills,
      badge_color: 'amber'
    };

    const updatedCerts = [newCert, ...(masterProfile.learning_certs || [])];
    setMasterProfile((prev) => ({
      ...prev,
      learning_certs: updatedCerts
    }));
  };

  const handleLoadPreset = (company: string) => {
    addToast('info', 'Role Preset Loaded', `Loaded ${company} requirements into Synthesizer.`);
  };

  const handleSelectArchetypePreset = (archetypeKey: CandidateArchetype) => {
    const preset = ARCHETYPE_PRESETS[archetypeKey];
    if (preset) {
      setMasterProfile(preset.profile);
      try {
        localStorage.setItem('cherenkov_master_profile', JSON.stringify(preset.profile));
      } catch (e) {
        console.error(e);
      }
      if (preset.recommendedTheme) {
        setCurrentTheme(preset.recommendedTheme as AppTheme);
        try {
          localStorage.setItem('cherenkov_theme', preset.recommendedTheme);
        } catch (e) {
          console.error(e);
        }
      }
      if (preset.profile.workspaceConfig?.defaultTab) {
        setActiveTab(preset.profile.workspaceConfig.defaultTab);
      }
      addToast('success', `${preset.label} Active`, `System calibrated with ${preset.badge} configuration.`);
    }
  };

  const handleSyncSkillsToProfile = (newSkills: string[]) => {
    setMasterProfile((prev) => {
      const existingTech = new Set(prev.tech_stack || []);
      const existingCore = new Set(prev.core_competencies || []);
      newSkills.forEach((s) => {
        existingTech.add(s);
        existingCore.add(s);
      });
      const updated = {
        ...prev,
        tech_stack: Array.from(existingTech),
        core_competencies: Array.from(existingCore)
      };
      try {
        localStorage.setItem('cherenkov_master_profile', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  /** Each workspace's element, keyed by tab. Building these is cheap; only the
   *  one selected above is ever mounted. */
  const workspaceViews: Record<TabId, React.ReactNode> = {
    synthesizer: (
      <JobSynthesizer
        masterProfile={masterProfile}
        onApplicationCreated={handleApplicationCreated}
        onAddCourseToLearning={handleAddCourseFromSynthesis}
        onNavigateToKanban={() => setActiveTab('kanban')}
        onToast={addToast}
      />
    ),
    kanban: (
      <KanbanBoard
        applications={applications}
        onUpdateApplication={handleUpdateApplication}
        onDeleteApplication={handleDeleteApplication}
        onAddApplication={handleApplicationCreated}
        onToast={addToast}
      />
    ),
    learning: (
      <LearningSync
        masterProfile={masterProfile}
        onUpdateProfile={setMasterProfile}
        onToast={addToast}
      />
    ),
    marketplace: (
      <Marketplace onToast={addToast} onSyncSkillsToProfile={handleSyncSkillsToProfile} />
    ),
    orchestrator: <AgentCanvas onToast={addToast} />,
    hivemind: <HiveMind onToast={addToast} />,
    oracle: <OracleWorkbench />,
  };

  return (
    <div className="h-dvh min-h-[40rem] flex flex-col bg-canvas text-ink font-sans relative overflow-hidden">

      {/* Top Application Header */}
      <Header
        profile={masterProfile}
        onOpenNav={() => setIsNavOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        currentTheme={currentTheme}
        onChangeTheme={setCurrentTheme}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenTelemetry={() => setIsTelemetryOpen(true)}
        onOpenIdentityVault={() => setIsIdentityVaultOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onStartTour={() => setIsTourOpen(true)}
      />

      {/* Main App Container */}
      <div className="flex-1 min-h-0 flex relative z-10">
        {/* Desktop Technical Sidebar with live Recharts Dashboard */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          profile={masterProfile}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          applications={applications}
          certCount={masterProfile.learning_certs?.length || 0}
          onOpenIdentityVault={() => setIsIdentityVaultOpen(true)}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onStartTour={() => setIsTourOpen(true)}
        />

        {/* Below md the rail is hidden, so the same nav opens as a drawer. */}
        <Modal
          open={isNavOpen}
          onClose={() => setIsNavOpen(false)}
          align="left"
          label="Workspace navigation"
          className="md:hidden pt-14"
        >
          <Sidebar
            variant="drawer"
            onCloseDrawer={() => setIsNavOpen(false)}
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              setIsNavOpen(false);
            }}
            profile={masterProfile}
            onOpenProfile={() => {
              setIsNavOpen(false);
              setIsProfileModalOpen(true);
            }}
            applications={applications}
            certCount={masterProfile.learning_certs?.length || 0}
            onOpenIdentityVault={() => {
              setIsNavOpen(false);
              setIsIdentityVaultOpen(true);
            }}
            onOpenOnboarding={() => {
              setIsNavOpen(false);
              setIsOnboardingOpen(true);
            }}
            onStartTour={() => {
              setIsNavOpen(false);
              setIsTourOpen(true);
            }}
          />
        </Modal>

        {/* Dynamic Workspace Body */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/* Mobile Tab Selector — same workspace registry as the sidebar */}
          <div className="md:hidden flex items-center gap-1 overflow-x-auto rounded-control border border-line bg-surface p-1 mb-4">
            {WORKSPACES.map((workspace) => {
              const isActive = activeTab === workspace.id;
              return (
                <button
                  key={workspace.id}
                  onClick={() => setActiveTab(workspace.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-chip text-xs font-semibold whitespace-nowrap',
                    'transition-colors duration-150 cursor-pointer',
                    isActive ? 'bg-accent text-accent-contrast' : 'text-ink-muted hover:bg-fill hover:text-ink'
                  )}
                >
                  {workspace.icon}
                  <span>{workspace.shortName}</span>
                  {workspace.id === 'kanban' && (
                    <span className="font-mono tabular">({applications.length})</span>
                  )}
                  {workspace.id === 'kanban' && kanbanBackend === 'live' && (
                    <span className="px-1 rounded-chip bg-positive-soft text-positive-ink border border-positive-line font-mono text-[9px] font-bold">
                      DB
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Module Transitions with Framer Motion */}
          {/* One transition, seven destinations. The workspaces differ only in
              which node renders, so the wrapper is written once. */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              data-testid={`workspace-${activeTab}`}
            >
              {workspaceViews[activeTab]}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={setActiveTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onSelectTheme={setCurrentTheme}
        onLoadPreset={handleLoadPreset}
        onSelectArchetype={handleSelectArchetypePreset}
        onOpenTelemetry={() => setIsTelemetryOpen(true)}
        currentTheme={currentTheme}
        onOpenIdentityVault={() => setIsIdentityVaultOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onStartTour={() => setIsTourOpen(true)}
      />

      {/* Guided Onboarding Tooltip Tour */}
      <SystemTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onSelectTab={setActiveTab}
        activeTab={activeTab}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenIdentityVault={() => setIsIdentityVaultOpen(true)}
        onToast={addToast}
      />

      {/* Telemetry & Observability Modal */}
      <TelemetryModal
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
      />

      {/* Zero-Trust Identity Vault Modal */}
      <IdentityVaultModal
        isOpen={isIdentityVaultOpen}
        onClose={() => setIsIdentityVaultOpen(false)}
        masterProfile={masterProfile}
        onToast={addToast}
      />

      {/* Onboarding & 1-Click Deploy Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onProfileImported={(profile) => {
          setMasterProfile(profile);
          try {
            localStorage.setItem('cherenkov_master_profile', JSON.stringify(profile));
          } catch (e) {
            console.error(e);
          }
          if (profile.preferences?.theme) {
            setCurrentTheme(profile.preferences.theme as AppTheme);
            try {
              localStorage.setItem('cherenkov_theme', profile.preferences.theme);
            } catch (e) {
              console.error(e);
            }
          }
          if (profile.workspaceConfig?.defaultTab) {
            setActiveTab(profile.workspaceConfig.defaultTab);
          }
          addToast('success', 'Profile & Workspace Synced', `Imported profile set as active master anchor for ${profile.name}.`);
        }}
        onToast={addToast}
      />

      {/* Master Profile Source of Truth Modal */}
      <MasterProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={masterProfile}
        onUpdateProfile={setMasterProfile}
        onToast={addToast}
      />

      {/* Toast Notifications System */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

