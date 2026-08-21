import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  ShieldCheck,
  Webhook,
  Sparkles,
  Cpu,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Zap,
  HelpCircle,
  Play,
  RotateCcw,
  Layers,
  Activity,
  Award,
  ChevronRight,
  Crosshair,
  Radio,
  Eye,
  Sliders,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TabId } from '../types';
import type { ToastFn } from './Toast';

export interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  targetSelector: string;
  tabId?: TabId;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  badge: string;
  badgeColor: 'violet' | 'cyan' | 'emerald' | 'amber' | 'purple';
  icon: React.ElementType;
  quickActionLabel?: string;
  onQuickAction?: () => void;
  accentHex: string;
}

interface SystemTourProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: TabId) => void;
  activeTab: TabId;
  onOpenCommandPalette?: () => void;
  onOpenIdentityVault?: () => void;
  onToast: ToastFn;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'command-palette',
    title: 'Universal Command Palette',
    subtitle: 'Instant System Orchestration (Sub-50ms)',
    description: 'Press ⌘K (or Ctrl+K) anywhere across the workspace to trigger autonomous QA swarms, switch active contexts, run ATS company presets, or change themes in under 50ms.',
    targetSelector: '#tour-command-palette',
    tabId: 'synthesizer',
    placement: 'bottom',
    badge: 'Shortcut: ⌘K / Ctrl+K',
    badgeColor: 'violet',
    accentHex: 'var(--color-accent)',
    icon: Command,
    quickActionLabel: 'Open Command Palette'
  },
  {
    id: 'identity-vault',
    title: 'Zero-Trust Identity Vault',
    subtitle: 'Air-Gapped PII & Bare-Metal Local LLM',
    description: 'Protect candidate personal data with automated inference routing. Sensitive PII (passport numbers, salary targets, home addresses) is strictly processed by local Qwen 2.5 on port 3001 with zero cloud egress.',
    targetSelector: '#tour-identity-vault',
    tabId: 'synthesizer',
    placement: 'bottom',
    badge: 'Zero Cloud Egress',
    badgeColor: 'emerald',
    accentHex: 'var(--color-positive)',
    icon: ShieldCheck,
    quickActionLabel: 'Inspect Zero-Trust Vault'
  },
  {
    id: 'sync-webhook',
    title: 'Continuous xAPI Learning Webhook',
    subtitle: 'Living Document Telemetry',
    description: 'Connect Coursera, Udemy, or custom LRS platforms to the /api/webhooks/xapi tunnel. Completing external QA upskilling immediately parses competencies and injects them into your active profile.',
    targetSelector: '#tour-sync-webhook',
    tabId: 'learning',
    placement: 'bottom',
    badge: 'xAPI Listener Active',
    badgeColor: 'amber',
    accentHex: 'var(--color-caution)',
    icon: Webhook,
    quickActionLabel: 'View Webhook Panel'
  },
  {
    id: 'job-synthesizer',
    title: 'Agentic Job Synthesizer',
    subtitle: 'AST Weaponry & 141K+ Visa Register',
    description: 'Paste any job posting or Greenhouse/Lever URL. The engine cross-references the official UK/EU sponsor register (£41,700 threshold), verifies CodeQL/Playwright/k6 AST proof, and generates tailored CV weaponry.',
    targetSelector: '#tour-job-synthesizer',
    tabId: 'synthesizer',
    placement: 'bottom',
    badge: '98% ATS Alignment',
    badgeColor: 'cyan',
    accentHex: 'var(--color-info)',
    icon: Sparkles
  },
  {
    id: 'agent-canvas',
    title: 'Visual Agent Swarm & Human Gate',
    subtitle: 'Autonomous MCP Orchestration',
    description: 'Inspect multi-agent QA swarms (Scout, Architect, Red Team, Synthesizer) executing through MCP stdio channels with interactive human-in-the-loop sign-off checkpoints.',
    targetSelector: '#tour-agent-canvas',
    tabId: 'orchestrator',
    placement: 'bottom',
    badge: 'Human-in-the-Loop',
    badgeColor: 'purple',
    accentHex: 'var(--color-accent-strong)',
    icon: Cpu
  }
];

export const SystemTour: React.FC<SystemTourProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  activeTab,
  onOpenCommandPalette,
  onOpenIdentityVault,
  onToast
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStepIdx] || TOUR_STEPS[0];
  const StepIcon = step.icon;

  // ---------------------------------------------------------------------------
  // Programmatic CSS Highlighter Injection
  // Injects dynamic CSS rules to elevate target DOM element, add focus glow,
  // pulsating reticle animations, and dim background elements seamlessly.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) {
      // Clean up injected styles and classes when closed
      const existingStyle = document.getElementById('system-tour-css-highlighter');
      if (existingStyle) existingStyle.remove();
      document.body.classList.remove('tour-is-active');
      document.querySelectorAll('.tour-highlighted-element').forEach((el) => {
        el.classList.remove('tour-highlighted-element');
      });
      return;
    }

    document.body.classList.add('tour-is-active');

    // Create or update dynamic <style> tag
    let styleTag = document.getElementById('system-tour-css-highlighter') as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'system-tour-css-highlighter';
      document.head.appendChild(styleTag);
    }

    const accentColor = step.accentHex;

    styleTag.innerHTML = `
      @keyframes tour-pulse-glow {
        0%, 100% {
          box-shadow: 0 0 0 3px ${accentColor}cc, 0 0 30px ${accentColor}88, 0 0 60px ${accentColor}33;
          border-color: ${accentColor} !important;
        }
        50% {
          box-shadow: 0 0 0 6px ${accentColor}ee, 0 0 45px ${accentColor}aa, 0 0 90px ${accentColor}55;
          border-color: var(--color-ink) !important;
        }
      }

      @keyframes tour-scan-sweep {
        0% { transform: translateY(-100%); opacity: 0; }
        50% { opacity: 0.7; }
        100% { transform: translateY(1000%); opacity: 0; }
      }

      @keyframes tour-corner-bracket {
        0%, 100% { transform: scale(1); opacity: 0.85; }
        50% { transform: scale(1.1); opacity: 1; filter: drop-shadow(0 0 6px ${accentColor}); }
      }

      /* Dim and soften non-spotlight workspace elements */
      body.tour-is-active .tour-dim-target {
        transition: filter 0.35s ease, opacity 0.35s ease;
      }

      /* Target element programmatic elevation & highlight */
      ${step.targetSelector} {
        position: relative !important;
        z-index: 105 !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        animation: tour-pulse-glow 2.5s infinite ease-in-out !important;
        border-radius: 18px !important;
      }
    `;

    // Apply class to target DOM element
    const targetElement = document.querySelector(step.targetSelector);
    if (targetElement) {
      targetElement.classList.add('tour-highlighted-element');
    }

    return () => {
      if (targetElement) {
        targetElement.classList.remove('tour-highlighted-element');
      }
    };
  }, [isOpen, step, currentStepIdx]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      const styleTag = document.getElementById('system-tour-css-highlighter');
      if (styleTag) styleTag.remove();
      document.body.classList.remove('tour-is-active');
      document.querySelectorAll('.tour-highlighted-element').forEach((el) => {
        el.classList.remove('tour-highlighted-element');
      });
    };
  }, []);

  // Measure target DOM element bounding box with padding
  const updateTargetRect = useCallback(() => {
    if (!isOpen) return;

    // Check if step needs a tab switch first
    if (step.tabId && step.tabId !== activeTab) {
      onSelectTab(step.tabId);
      setTimeout(() => {
        const el = document.querySelector(step.targetSelector);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTargetRect(el.getBoundingClientRect());
        } else {
          setTargetRect(null);
        }
      }, 250);
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [isOpen, step, activeTab, onSelectTab]);

  useEffect(() => {
    if (isOpen) {
      updateTargetRect();
      const handleResize = () => updateTargetRect();
      const handleScroll = () => updateTargetRect();

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen, currentStepIdx, updateTargetRect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleFinishTour(false);
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIdx]);

  const handleNext = () => {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      handleFinishTour(true);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleFinishTour = (completed: boolean) => {
    try {
      localStorage.setItem('cherenkov_tour_completed', 'true');
    } catch {}

    // Clean up injected styles
    const existingStyle = document.getElementById('system-tour-css-highlighter');
    if (existingStyle) existingStyle.remove();
    document.body.classList.remove('tour-is-active');

    if (completed) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch {}
      onToast('success', 'System Tour Completed', 'Interactive tour finished. You are ready to synthesize weaponized QA profiles!');
    }
    onClose();
  };

  const handleQuickAction = () => {
    if (step.id === 'command-palette' && onOpenCommandPalette) {
      onOpenCommandPalette();
    } else if (step.id === 'identity-vault' && onOpenIdentityVault) {
      onOpenIdentityVault();
    } else if (step.id === 'sync-webhook') {
      onSelectTab('learning');
    }
  };

  if (!isOpen) return null;

  // Calculate tooltip placement coordinates
  const padding = 10;
  const highlightBox = targetRect
    ? {
        x: Math.max(0, targetRect.left - padding),
        y: Math.max(0, targetRect.top - padding),
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2
      }
    : null;

  // Calculate tooltip floating box coordinates
  let tooltipStyle: React.CSSProperties = {};
  if (highlightBox) {
    const isMobile = window.innerWidth < 640;
    const tooltipWidth = isMobile ? Math.min(window.innerWidth - 32, 380) : 440;
    const spacing = 16;

    if (step.placement === 'bottom') {
      let top = highlightBox.y + highlightBox.height + spacing;
      let left = highlightBox.x + highlightBox.width / 2 - tooltipWidth / 2;

      // Bound checking
      if (left < 16) left = 16;
      if (left + tooltipWidth > window.innerWidth - 16) {
        left = window.innerWidth - tooltipWidth - 16;
      }
      if (top + 320 > window.innerHeight) {
        // Flip to top if overflow
        top = Math.max(16, highlightBox.y - 320 - spacing);
      }

      tooltipStyle = {
        top: `${top}px`,
        left: `${left}px`,
        width: `${tooltipWidth}px`
      };
    } else if (step.placement === 'top') {
      let top = highlightBox.y - 320 - spacing;
      let left = highlightBox.x + highlightBox.width / 2 - tooltipWidth / 2;

      if (left < 16) left = 16;
      if (left + tooltipWidth > window.innerWidth - 16) {
        left = window.innerWidth - tooltipWidth - 16;
      }
      if (top < 16) {
        top = highlightBox.y + highlightBox.height + spacing;
      }

      tooltipStyle = {
        top: `${top}px`,
        left: `${left}px`,
        width: `${tooltipWidth}px`
      };
    } else {
      // Center fallback
      tooltipStyle = {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${tooltipWidth}px`
      };
    }
  } else {
    // Default screen center
    tooltipStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'min(92vw, 440px)'
    };
  }

  const badgeColorMap = {
    violet: 'bg-accent-soft text-accent-ink border-accent-line',
    cyan: 'bg-info-soft text-info-ink border-info-line',
    emerald: 'bg-positive-soft text-positive-ink border-positive-line',
    amber: 'bg-caution-soft text-caution-ink border-caution-line',
    purple: 'bg-accent-soft text-accent-ink border-accent-line'
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-auto select-none">
      {/* SVG Mask Spotlight Overlay - Dims the entire background while illuminating the target */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300 ease-out">
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White background reveals the dark mask */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout creates transparent spotlight viewport */}
            {highlightBox && (
              <rect
                x={highlightBox.x}
                y={highlightBox.y}
                width={highlightBox.width}
                height={highlightBox.height}
                rx={16}
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Deep cinematic backdrop with 88% dimming */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(3, 5, 10, 0.88)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Animated Glowing Ring & Tactical HUD Crosshairs over highlighted target */}
      {highlightBox && (
        <motion.div
          layoutId="tour-highlight-box"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="absolute rounded-card border-2 pointer-events-none ring-4 ring-info-line"
          style={{
            left: `${highlightBox.x}px`,
            top: `${highlightBox.y}px`,
            width: `${highlightBox.width}px`,
            height: `${highlightBox.height}px`,
            borderColor: step.accentHex
          }}
        >
          {/* Tactical Corner Brackets */}
          <div
            className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2"
            style={{ borderColor: step.accentHex }}
          />
          <div
            className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2"
            style={{ borderColor: step.accentHex }}
          />
          <div
            className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2"
            style={{ borderColor: step.accentHex }}
          />
          <div
            className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2"
            style={{ borderColor: step.accentHex }}
          />

          {/* Floating Target Identification Beacon */}
          <div className="absolute -top-7 left-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-scrim border text-2xs font-mono font-bold"
               style={{ borderColor: `color-mix(in srgb, ${step.accentHex} 55%, transparent)`, color: step.accentHex }}>
            <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: step.accentHex }} />
            <Target className="w-3 h-3" />
            <span>FEATURE FOCUS #{currentStepIdx + 1}</span>
          </div>

          {/* Animated Laser Sweep Line across target */}
          <div className="absolute inset-0 overflow-hidden rounded-card pointer-events-none">
            <div
              className="w-full h-1 opacity-60"
              style={{
                backgroundColor: step.accentHex,
                animation: 'tour-scan-sweep 3.5s infinite linear'
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Floating Interactive Tooltip Card */}
      <motion.div
        key={step.id}
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.25 }}
        className="fixed z-[110] bg-surface border rounded-panel p-5 sm:p-6 space-y-4 backdrop-blur-2xl"
        style={{
          ...tooltipStyle,
          borderColor: `color-mix(in srgb, ${step.accentHex} 40%, transparent)`,
          boxShadow: 'var(--shadow-pop)'
        }}
      >
        {/* Top Header with Step Counter and Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-2xs font-mono font-bold bg-fill-strong text-ink border border-line">
              STEP {currentStepIdx + 1} OF {TOUR_STEPS.length}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-2xs font-mono font-bold border ${badgeColorMap[step.badgeColor]}`}
            >
              {step.badge}
            </span>
          </div>

          <button
            onClick={() => handleFinishTour(false)}
            className="text-ink-muted hover:text-ink p-1 rounded-control hover:bg-fill-strong transition-colors cursor-pointer"
            title="Skip Tour (Esc)" aria-label="Skip Tour (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Title & Icon */}
        <div className="flex items-start gap-3">
          <div
            className="p-2.5 rounded-card text-ink shrink-0"
            style={{
              background: step.accentHex
            }}
          >
            <StepIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink tracking-tight leading-snug">
              {step.title}
            </h3>
            <p className="text-sm font-mono font-semibold mt-0.5" style={{ color: step.accentHex }}>
              {step.subtitle}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-ink-muted leading-relaxed font-sans">
          {step.description}
        </p>

        {/* Quick Action Trigger Button (if applicable) */}
        {step.quickActionLabel && (
          <div className="pt-1">
            <button
              onClick={handleQuickAction}
              className="w-full py-2 px-3 rounded-control bg-fill hover:bg-fill-strong border border-line text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              style={{ color: step.accentHex }}
            >
              <Zap className="w-3.5 h-3.5" style={{ color: step.accentHex }} />
              <span>{step.quickActionLabel}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Step Progress Dots & Navigation Controls */}
        <div className="pt-3 border-t border-line flex items-center justify-between gap-3">
          {/* Progress Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIdx(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIdx
                    ? 'w-6'
                    : idx < currentStepIdx
                    ? 'w-2 bg-positive'
                    : 'w-2 bg-fill-strong hover:bg-fill-strong'
                }`}
                style={idx === currentStepIdx ? { backgroundColor: step.accentHex, color: step.accentHex } : {}}
                title={`Jump to Step ${idx + 1}: ${s.title}`} aria-label={`Jump to Step ${idx + 1}: ${s.title}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentStepIdx > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-control bg-fill hover:bg-fill-strong text-xs text-ink-muted hover:text-ink transition-all flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-control text-ink text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              style={{
                background: step.accentHex
              }}
            >
              <span>{currentStepIdx === TOUR_STEPS.length - 1 ? 'Finish Tour 🎉' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
