import React, { useState } from 'react';
import { MasterProfile } from '../types';
import { User, Sparkles, MapPin, Globe, Cpu, Award, X, Code, Check, Edit2, ShieldCheck, Download, Copy, Braces } from 'lucide-react';

interface MasterProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MasterProfile;
  onUpdateProfile: (updated: MasterProfile) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c101a] border border-cyan-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#07090e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Master Profile Anchor</h3>
                <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded-full font-bold">
                  GROUND TRUTH
                </span>
              </div>
              <p className="text-xs text-slate-400">Root candidate identity injected into Gemini agent synthesis pipeline</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white/[0.04] p-1 rounded-2xl border border-white/[0.08] shadow-inner">
              <button
                onClick={() => setActiveTab('view')}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'view' ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
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
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'edit' ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Edit
              </button>
              <button
                onClick={handleOpenJson}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'json' ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Raw JSON
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer"
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
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0e1324] via-[#090c15] to-[#07090e] border border-cyan-500/20 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-400 block mb-1">
                      {profile.title}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{profile.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-slate-300">
                      <span className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        {profile.location}
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Target: Remote & UK/EU Visa Sponsorship
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-right shadow-inner">
                    <div className="text-[11px] font-mono text-slate-400 uppercase">Verified Tech Skills</div>
                    <div className="text-2xl font-black text-cyan-300 font-mono mt-0.5">{profile.tech_stack.length}</div>
                  </div>
                </div>
              </div>

              {/* Core Competencies & Tech Stack */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-[#07090e] border border-white/[0.08] space-y-3.5 shadow-lg">
                  <h4 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
                    <Award className="w-4 h-4 text-violet-400" />
                    <span>Core QA Competencies</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {profile.core_competencies.map((comp) => (
                      <li key={comp} className="flex items-center gap-2.5 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                        <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.5)] shrink-0" />
                        <span className="font-medium text-slate-200">{comp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 rounded-3xl bg-[#07090e] border border-white/[0.08] space-y-3.5 shadow-lg">
                  <h4 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span>Technical Stack</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.tech_stack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 text-xs font-mono font-bold bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 rounded-xl shadow-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Experience Statement */}
              <div className="p-6 rounded-3xl bg-[#07090e] border border-white/[0.08] space-y-2.5 shadow-lg">
                <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">
                  Executive Experience Summary
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans bg-white/[0.02] p-4 rounded-2xl border border-white/[0.04]">
                  {profile.experience}
                </p>
              </div>

              {/* Synced Certifications */}
              <div className="p-6 rounded-3xl bg-[#07090e] border border-white/[0.08] space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">
                    Active & Completed Certifications ({profile.learning_certs?.length || 0})
                  </h4>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">Auto-Synced into AI Prompt</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {profile.learning_certs?.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start justify-between gap-2 shadow-sm"
                    >
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold block">
                          {cert.provider}
                        </span>
                        <div className="text-xs font-bold text-slate-100 mt-0.5">{cert.title}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {cert.extracted_skills.map((s) => (
                            <span key={s} className="px-2 py-0.5 text-[9px] font-mono bg-white/[0.04] text-slate-300 rounded">
                              +{s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg ${cert.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
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
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">Executive Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">Location / Visa Status</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">
                  Core Competencies (comma-separated)
                </label>
                <textarea
                  rows={2}
                  value={editCompetencies}
                  onChange={(e) => setEditCompetencies(e.target.value)}
                  className="w-full p-3 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">
                  Tech Stack (comma-separated)
                </label>
                <textarea
                  rows={2}
                  value={editTechStack}
                  onChange={(e) => setEditTechStack(e.target.value)}
                  className="w-full p-3 text-xs font-mono bg-[#07090e] border border-white/[0.08] rounded-xl text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">
                  Executive Experience Summary
                </label>
                <textarea
                  rows={3}
                  value={editExperience}
                  onChange={(e) => setEditExperience(e.target.value)}
                  className="w-full p-3 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('view')}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 rounded-xl shadow-md shadow-violet-600/30 cursor-pointer"
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
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono">
                  {jsonError}
                </div>
              )}
              <textarea
                rows={16}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full p-4 text-xs font-mono bg-[#07090e] border border-white/[0.08] rounded-2xl text-cyan-300 focus:outline-none focus:border-cyan-500 leading-relaxed shadow-inner"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setActiveTab('view')}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveJson}
                  className="px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 rounded-xl shadow-md shadow-violet-600/30 cursor-pointer"
                >
                  Save JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
