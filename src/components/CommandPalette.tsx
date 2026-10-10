import React, { useState, useEffect } from 'react';
import { 
  Command, 
  Search, 
  Sparkles, 
  Cloud, 
  BookOpen, 
  Settings, 
  Trash2, 
  Volume2, 
  Download, 
  X 
} from 'lucide-react';
import { PersonaConfig } from '../types';
import { PERSONAS } from '../data/personas';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'chat' | 'aws' | 'missions' | 'docs' | 'settings') => void;
  onSelectPersona: (persona: PersonaConfig) => void;
  onClearChat: () => void;
  onToggleSound: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectPersona,
  onClearChat,
  onToggleSound,
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'tab-chat',
      title: 'Go to Agent Chat',
      category: 'Navigation',
      icon: <Sparkles className="w-4 h-4 text-indigo-500" />,
      run: () => {
        onNavigateTab('chat');
        onClose();
      },
    },
    {
      id: 'tab-aws',
      title: 'Open AWS Free Tier Launchpad ($0/mo)',
      category: 'Navigation',
      icon: <Cloud className="w-4 h-4 text-emerald-500" />,
      run: () => {
        onNavigateTab('aws');
        onClose();
      },
    },
    {
      id: 'tab-missions',
      title: 'Explore Engineering Playbooks',
      category: 'Navigation',
      icon: <BookOpen className="w-4 h-4 text-sky-500" />,
      run: () => {
        onNavigateTab('missions');
        onClose();
      },
    },
    {
      id: 'tab-docs',
      title: 'Open System Documentation & AWS Specs',
      category: 'Navigation',
      icon: <BookOpen className="w-4 h-4 text-indigo-500" />,
      run: () => {
        onNavigateTab('docs');
        onClose();
      },
    },
    {
      id: 'tab-settings',
      title: 'Agent Preferences & Tone',
      category: 'Navigation',
      icon: <Settings className="w-4 h-4 text-slate-500" />,
      run: () => {
        onNavigateTab('settings');
        onClose();
      },
    },
    ...Object.values(PERSONAS).map((p) => ({
      id: `persona-${p.id}`,
      title: `Switch Persona: ${p.name} (${p.badge})`,
      category: 'Personas',
      icon: <span className="text-base">{p.avatar}</span>,
      run: () => {
        onSelectPersona(p);
        onClose();
      },
    })),
    {
      id: 'toggle-sound',
      title: 'Toggle Audio Delight Chime',
      category: 'Audio',
      icon: <Volume2 className="w-4 h-4 text-amber-500" />,
      run: () => {
        onToggleSound();
        onClose();
      },
    },
    {
      id: 'clear-chat',
      title: 'Clear Current Conversation',
      category: 'Chat',
      icon: <Trash2 className="w-4 h-4 text-rose-500" />,
      run: () => {
        onClearChat();
        onClose();
      },
    },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to feature..."
            autoFocus
            className="w-full text-xs text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching actions found.
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={item.run}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs text-slate-700 hover:bg-slate-100 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="shrink-0">{item.icon}</div>
                  <span className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {item.category}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Bottom Hint */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-600 flex items-center justify-between">
          <span>Use arrows to navigate</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
