import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UnifiedOnboardingWizard } from './UnifiedOnboardingWizard';
import { MasterProfile } from '../types';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileImported: (profile: MasterProfile) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onProfileImported,
  onToast,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#030407]/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-2xl"
          >
            <UnifiedOnboardingWizard 
              onClose={onClose}
              onComplete={(profileConfig: any) => {
                // Map config to MasterProfile structure
                const newProfile: MasterProfile = {
                  name: "Moayed Badawy", // Placeholder for actual extracted data
                  title: "Senior QA Lead",
                  location: profileConfig.location,
                  target_roles: profileConfig.target_roles,
                  core_competencies: ["Test Automation", "CI/CD"],
                  tech_stack: ["Playwright", "TypeScript", "k6"],
                  experience: "Over 8 years of experience...",
                  learning_certs: [],
                  preferences: {
                    theme: 'dark',
                    localLlmEnabled: profileConfig.llm_mode === 'local' || profileConfig.llm_mode === 'hybrid',
                    autoSyncLrs: !!profileConfig.lrs_endpoint
                  } as any
                };
                onProfileImported(newProfile);
                onClose();
              }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
