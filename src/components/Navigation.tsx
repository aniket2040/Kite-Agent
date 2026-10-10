import React from 'react';
import { 
  Sparkles, 
  Cloud, 
  BookOpen, 
  Settings, 
  Volume2, 
  VolumeX, 
  Command, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { PersonaConfig } from '../types';
import { PERSONAS } from '../data/personas';

interface NavigationProps {
  activeTab: 'chat' | 'aws' | 'missions' | 'docs' | 'settings';
  setActiveTab: (tab: 'chat' | 'aws' | 'missions' | 'docs' | 'settings') => void;
  currentPersona: PersonaConfig;
  onSelectPersona: (persona: PersonaConfig) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenCommandPalette: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  currentPersona,
  onSelectPersona,
  soundEnabled,
  onToggleSound,
  onOpenCommandPalette,
}) => {
  const [personaMenuOpen, setPersonaMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('chat')} 
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-sm shadow-indigo-200 transition-transform group-hover:scale-105">
              <span className="text-lg">🪁</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-slate-900">Kite</span>
                <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/60">
                  Agent
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal">Delightful AI & AWS Suite</p>
            </div>
          </button>

          {/* Persona Picker Dropdown */}
          <div className="relative hidden md:block ml-2">
            <button
              onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
              className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-expanded={personaMenuOpen}
              aria-label="Change agent persona"
            >
              <span>{currentPersona.avatar}</span>
              <span className="font-semibold text-slate-900">{currentPersona.name}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{currentPersona.badge}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {personaMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setPersonaMenuOpen(false)} 
                />
                <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    Select Agent Persona
                  </div>
                  {Object.values(PERSONAS).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectPersona(p);
                        setPersonaMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                        currentPersona.id === p.id ? 'bg-indigo-50/60 text-indigo-950 font-medium' : 'text-slate-700'
                      }`}
                    >
                      <span className="text-lg mt-0.5">{p.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-900">{p.name}</span>
                          <span className="text-[10px] text-slate-600">{p.badge}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1">{p.tagline}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'chat'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Agent Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('aws')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all relative ${
              activeTab === 'aws'
                ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>AWS Free Tier</span>
            <span className="hidden sm:inline-block text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full border border-emerald-300">
              $0/mo
            </span>
          </button>

          <button
            onClick={() => setActiveTab('missions')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'missions'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Playbooks</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'docs'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Docs</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'settings'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preferences</span>
          </button>
        </nav>

        {/* Right utility actions */}
        <div className="flex items-center gap-2">
          {/* AWS Free Tier Guard Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-emerald-900">Free Tier Guard Active</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute audio feedback' : 'Enable audio feedback'}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            title={soundEnabled ? 'Audio feedback ON' : 'Audio feedback OFF'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-indigo-600" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Command Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            aria-label="Open command palette"
            className="hidden sm:flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-1.5 rounded-lg transition-colors"
            title="Quick actions (Cmd+K)"
          >
            <Command className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">K</span>
          </button>
        </div>
      </div>
    </header>
  );
};
