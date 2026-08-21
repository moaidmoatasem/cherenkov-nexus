import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UnifiedOnboardingWizard } from './UnifiedOnboardingWizard';
import { MasterProfile } from '../types';
import { Modal } from './ui';
import type { ToastFn } from './Toast';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileImported: (profile: MasterProfile) => void;
  onToast: ToastFn;
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
        <Modal open onClose={onClose} label="Agentic onboarding" className="sm:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-2xl"
          >
            <UnifiedOnboardingWizard 
              onClose={onClose}
              onComplete={(profile: MasterProfile) => {
                onProfileImported(profile);
                onClose();
              }}
            />
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
};
