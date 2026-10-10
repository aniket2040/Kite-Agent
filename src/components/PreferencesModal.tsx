import React from 'react';
import { 
  Settings, 
  Sliders, 
  Volume2, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  RotateCcw 
} from 'lucide-react';
import { PersonaConfig } from '../types';
import { PERSONAS } from '../data/personas';

interface PreferencesModalProps {
  currentPersona: PersonaConfig;
  onSelectPersona: (persona: PersonaConfig) => void;
  customInstructions: string;
  setCustomInstructions: (instructions: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetDefaults: () => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  currentPersona,
  onSelectPersona,
  customInstructions,
  setCustomInstructions,
  soundEnabled,
  onToggleSound,
  onResetDefaults,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 rounded-lg bg-slate-100 text-slate-800">
            <Settings className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Agent Personalization
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Fine-Tune Kite to Your Taste
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
          Customize agent demeanor, cognitive pacing, sound effects, and persistent guidance so every interaction matches your workflow.
        </p>
      </div>

      {/* Persona Selection Cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          Select Agent Demeanor
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {Object.values(PERSONAS).map((p) => {
            const isSelected = currentPersona.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPersona(p)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200/50 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{p.avatar}</span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">{p.name}</h3>
                      <span className="text-[10px] text-indigo-700 font-semibold">{p.badge}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {p.description}
                </p>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                  Tone: <span className="text-slate-800">{p.tone}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Custom Guidance & Instructions */}
      <section className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-900">
            Custom Directives & Technical Preferences
          </label>
          <span className="text-[11px] text-slate-600">Injected into system instructions</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Tell Kite about your preferred programming language, cloud region, coding style, or team requirements (e.g., &quot;Always provide TypeScript types and favor AWS CDK over Terraform&quot;).
        </p>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="e.g. Always write code with TypeScript strict mode, target us-east-1 for AWS free tier, and avoid external libraries when standard Web APIs suffice."
          rows={3}
          className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none leading-relaxed"
        />
      </section>

      {/* Feedback Audio & Haptics */}
      <section className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Delight Chime on Completion</h3>
            <p className="text-xs text-slate-500">
              Plays a soft synthesizer chime when an agent response stream finishes.
            </p>
          </div>
        </div>

        <button
          onClick={onToggleSound}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            soundEnabled ? 'bg-indigo-600' : 'bg-slate-200'
          }`}
          role="switch"
          aria-checked={soundEnabled}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              soundEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </section>

      {/* Reset Defaults */}
      <div className="pt-4 border-t border-slate-200 flex justify-end">
        <button
          onClick={onResetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All to Defaults</span>
        </button>
      </div>
    </div>
  );
};
