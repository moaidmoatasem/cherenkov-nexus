import React, { useState } from 'react';
import { MasterProfile } from '../types';
import { User, Sparkles, MapPin, Globe, Cpu, Award, X, Code, Check, Edit2, ShieldCheck, Download, Copy, Braces } from 'lucide-react';
import { Modal } from './ui';
import type { ToastFn } from './Toast';

interface MasterProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MasterProfile;
  onUpdateProfile: (updated: MasterProfile) => void;
  onToast: ToastFn;
}

export const MasterProfileModal: React.FC<MasterProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'json' | 'edit'>('view');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [editName, setEditName] = useState(profile.name);
  const [editTitle, setEditTitle] = useState(profile.title);
  const [editLocation, setEditLocation] = useState(profile.location);
  const [editExperience, setEditExperience] = useState(profile.experience);
  const [editTechStack, setEditTechStack] = useState(profile.tech_stack.join(', '));
  const [editCompetencies, setEditCompetencies] = useState(profile.core_competencies.join(', '));

  if (!isOpen) return null;

  const handleOpenJson = () => {
    setJsonText(JSON.stringify(profile, null, 2));
    setJsonError(null);
    setActiveTab('json');
  };

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.name || !parsed.title) {
        throw new Error('Name and Title fields are required');
      }
      onUpdateProfile(parsed);
      onToast('success', 'Master Profile Updated', 'Source of truth JSON updated successfully.');
      setActiveTab('view');
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: MasterProfile = {
      ...profile,
      name: editName.trim() || profile.name,
      title: editTitle.trim() || profile.title,
      location: editLocation.trim() || profile.location,
      experience: editExperience.trim() || profile.experience,
      tech_stack: editTechStack
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      core_competencies: editCompetencies
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    onUpdateProfile(updated);
    onToast('success', 'Profile Updated', 'Master profile details saved.');
    setActiveTab('view');
  };

  return (
    <Modal open={isOpen} onClose={onClose} label="Master profile anchor">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface border border-info-line rounded-panel overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-sunken">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-card bg-info-soft border border-info-line flex items-center justify-center text-info-ink">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-ink">Master Profile Anchor</h3>
                <span className="px-2.5 py-0.5 text-2xs font-mono uppercase tracking-wider bg-info-soft border border-info-line text-info-ink rounded-full font-bold">
                  GROUND TRUTH
                </span>
              </div>
              <p className="text-sm text-ink-muted">Root candidate identity injected into Gemini agent synthesis pipeline</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-fill p-1 rounded-card border border-line">
              <button
                onClick={() => setActiveTab('view')}
                className={`px-3 py-1 text-xs font-bold rounded-control transition-all cursor-pointer ${
                  activeTab === 'view' ? 'bg-accent text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Executive View
              </button>
              <button
                onClick={() => {
                  setEditName(profile.name);
                  setEditTitle(profile.title);
                  setEditLocation(profile.location);
                  setEditExperience(profile.experience);
                  setEditTechStack(profile.tech_stack.join(', '));
                  setEditCompetencies(profile.core_competencies.join(', '));
                  setActiveTab('edit');
                }}
                className={`px-3 py-1 text-xs font-bold rounded-control transition-all cursor-pointer ${
                  activeTab === 'edit' ? 'bg-accent text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Edit
              </button>
              <button
                onClick={handleOpenJson}
                className={`px-3 py-1 text-xs font-bold rounded-control transition-all cursor-pointer ${
                  activeTab === 'json' ? 'bg-accent text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Raw JSON
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-ink-muted hover:text-ink rounded-control hover:bg-fill-strong transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: EXECUTIVE VIEW */}
          {activeTab === 'view' && (
            <div className="space-y-6">
              {/* Profile Card Banner */}
              <div className="p-6 rounded-panel bg-surface border border-info-line shadow-pop relative overflow-hidden">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div>
                    <span className="text-xs font-mono font-bold text-info-ink block mb-1">
                      {profile.title}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">{profile.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-ink-muted">
                      <span className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-4 h-4 text-info-ink" />
                        {profile.location}
                      </span>
                      <span className="flex items-center gap-1.5 text-positive-ink font-mono font-bold bg-positive-soft border border-positive-line px-2.5 py-1 rounded-control">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Target: Remote & UK/EU Visa Sponsorship
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-card bg-fill border border-line text-right">
                    <div className="text-xs font-mono text-ink-muted uppercase">Verified Tech Skills</div>
                    <div className="text-2xl font-black text-info-ink font-mono mt-0.5">{profile.tech_stack.length}</div>
                  </div>
                </div>
              </div>

              {/* Core Competencies & Tech Stack */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-panel bg-sunken border border-line space-y-3.5">
                  <h4 className="text-xs font-bold text-ink uppercase font-mono flex items-center gap-2">
                    <Award className="w-4 h-4 text-accent-ink" />
                    <span>Core QA Competencies</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-ink-muted">
                    {profile.core_competencies.map((comp) => (
                      <li key={comp} className="flex items-center gap-2.5 bg-fill p-2.5 rounded-control border border-line">
                        <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                        <span className="font-medium text-ink">{comp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 rounded-panel bg-sunken border border-line space-y-3.5">
                  <h4 className="text-xs font-bold text-ink uppercase font-mono flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-info-ink" />
                    <span>Technical Stack</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.tech_stack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 text-xs font-mono font-bold bg-info-soft border border-info-line text-info-ink rounded-control"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Experience Statement */}
              <div className="p-6 rounded-panel bg-sunken border border-line space-y-2.5">
                <h4 className="text-xs font-bold text-ink uppercase font-mono">
                  Executive Experience Summary
                </h4>
                <p className="text-sm text-ink-muted leading-relaxed font-sans bg-fill p-4 rounded-card border border-line">
                  {profile.experience}
                </p>
              </div>

              {/* Synced Certifications */}
              <div className="p-6 rounded-panel bg-sunken border border-line space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-ink uppercase font-mono">
                    Active & Completed Certifications ({profile.learning_certs?.length || 0})
                  </h4>
                  <span className="text-xs text-positive-ink font-mono font-bold">Auto-Synced into AI Prompt</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {profile.learning_certs?.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-4 rounded-card bg-fill border border-line flex items-start justify-between gap-2"
                    >
                      <div>
                        <span className="text-2xs font-mono text-info-ink font-bold block">
                          {cert.provider}
                        </span>
                        <div className="text-xs font-bold text-ink mt-0.5">{cert.title}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {cert.extracted_skills.map((s) => (
                            <span key={s} className="px-2 py-0.5 text-2xs font-mono bg-fill text-ink-muted rounded">
                              +{s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-2xs font-mono font-bold rounded-control ${cert.status === 'Completed' ? 'bg-positive-soft text-positive-ink border border-positive-line' : 'bg-caution-soft text-caution-ink border border-caution-line'}`}>
                        {cert.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT FORM */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="master-profile-modal-full-name" className="block text-xs font-bold text-ink-muted mb-1 font-mono uppercase">Full Name</label>
                  <input id="master-profile-modal-full-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-sunken border border-line rounded-control text-ink focus:border-info-line"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="master-profile-modal-executive-title" className="block text-xs font-bold text-ink-muted mb-1 font-mono uppercase">Executive Title</label>
                  <input id="master-profile-modal-executive-title"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-sunken border border-line rounded-control text-ink focus:border-info-line"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="master-profile-modal-location-visa-status" className="block text-xs font-bold text-ink-muted mb-1 font-mono uppercase">Location / Visa Status</label>
                <input id="master-profile-modal-location-visa-status"
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-sunken border border-line rounded-control text-ink focus:border-info-line"
                  required
                />
              </div>

              <div>
                <label htmlFor="master-profile-modal-core-competencies-comma-separated" className="block text-xs font-bold text-ink-muted mb-1 font-mono uppercase">
                  Core Competencies (comma-separated)
                </label>
                <textarea id="master-profile-modal-core-competencies-comma-separated"
                  rows={2}
                  value={editCompetencies}
                  onChange={(e) => setEditCompetencies(e.target.value)}
                  className="w-full p-3 text-xs bg-sunken border border-line rounded-control text-ink focus:border-info-line"
                />
              </div>

              <div>
                <label htmlFor="master-profile-modal-tech-stack-comma-separated" className="block text-xs font-bold text-ink-muted mb-1 font-mono uppercase">
                  Tech Stack (comma-separated)
                </label>
                <textarea id="master-profile-modal-tech-stack-comma-separated"
                  rows={2}
                  value={editTechStack}
                  onChange={(e) => setEditTechStack(e.target.value)}
                  className="w-full p-3 text-xs font-mono bg-sunken border border-line rounded-control text-info-ink focus:border-info-line"
                />
              </div>

              <div>
                <label htmlFor="master-profile-modal-executive-experience-summary" className="block text-xs font-bold text-ink-muted mb-1 font-mono uppercase">
                  Executive Experience Summary
                </label>
                <textarea id="master-profile-modal-executive-experience-summary"
                  rows={3}
                  value={editExperience}
                  onChange={(e) => setEditExperience(e.target.value)}
                  className="w-full p-3 text-xs bg-sunken border border-line rounded-control text-ink focus:border-info-line leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('view')}
                  className="px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-extrabold text-accent-contrast bg-accent hover:bg-accent-strong rounded-control cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: RAW JSON */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              {jsonError && (
                <div className="p-3.5 rounded-control bg-critical-soft border border-critical-line text-critical-ink text-xs font-mono">
                  {jsonError}
                </div>
              )}
              <textarea
                rows={16}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full p-4 text-xs font-mono bg-sunken border border-line rounded-card text-info-ink focus:border-info-line leading-relaxed"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setActiveTab('view')}
                  className="px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveJson}
                  className="px-5 py-2.5 text-xs font-extrabold text-accent-contrast bg-accent hover:bg-accent-strong rounded-control cursor-pointer"
                >
                  Save JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
