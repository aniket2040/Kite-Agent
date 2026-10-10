import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { AgentChat } from './components/AgentChat';
import { AwsLaunchpad } from './components/AwsLaunchpad';
import { MissionTemplates } from './components/MissionTemplates';
import { PreferencesModal } from './components/PreferencesModal';
import { CommandPalette } from './components/CommandPalette';
import { DocsView } from './components/DocsView';
import { PERSONAS } from './data/personas';
import { ChatMessage, PersonaConfig } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'aws' | 'missions' | 'docs' | 'settings'>('chat');
  const [currentPersona, setCurrentPersona] = useState<PersonaConfig>(PERSONAS['kite-core']);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('kite_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Persist messages to local storage
  useEffect(() => {
    try {
      localStorage.setItem('kite_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Persist preferences
  useEffect(() => {
    try {
      const savedPersonaId = localStorage.getItem('kite_persona_id');
      if (savedPersonaId && PERSONAS[savedPersonaId]) {
        setCurrentPersona(PERSONAS[savedPersonaId]);
      }
      const savedSound = localStorage.getItem('kite_sound_enabled');
      if (savedSound !== null) {
        setSoundEnabled(savedSound === 'true');
      }
      const savedInstructions = localStorage.getItem('kite_custom_instructions');
      if (savedInstructions) {
        setCustomInstructions(savedInstructions);
      }
    } catch {}
  }, []);

  const handleSelectPersona = (persona: PersonaConfig) => {
    setCurrentPersona(persona);
    try {
      localStorage.setItem('kite_persona_id', persona.id);
    } catch {}
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('kite_sound_enabled', String(next));
      } catch {}
      return next;
    });
  };

  const handleUpdateCustomInstructions = (instructions: string) => {
    setCustomInstructions(instructions);
    try {
      localStorage.setItem('kite_custom_instructions', instructions);
    } catch {}
  };

  const handleResetDefaults = () => {
    setCurrentPersona(PERSONAS['kite-core']);
    setSoundEnabled(true);
    setCustomInstructions('');
    try {
      localStorage.removeItem('kite_persona_id');
      localStorage.removeItem('kite_sound_enabled');
      localStorage.removeItem('kite_custom_instructions');
    } catch {}
  };

  const handleLaunchPromptFromMission = (promptText: string) => {
    setActiveTab('chat');
    // Pre-populate and trigger message in AgentChat
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Send request
    fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        persona: currentPersona.id,
        customInstructions,
      }),
    })
      .then(async (res) => {
        const botMessageId = `msg-${Date.now() + 1}`;
        const botMessage: ChatMessage = {
          id: botMessageId,
          role: 'model',
          content: '',
          timestamp: Date.now() + 1,
          isStreaming: true,
          thought: 'Analyzing engineering mission parameters...',
        };
        setMessages((prev) => [...prev, botMessage]);

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        if (reader) {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const eventMatch = line.match(/^event:\s*(.+)$/m);
              const dataMatch = line.match(/^data:\s*(.+)$/m);
              const eventType = eventMatch ? eventMatch[1].trim() : 'chunk';
              let data: any = {};
              try {
                if (dataMatch) data = JSON.parse(dataMatch[1].trim());
              } catch {}

              if (eventType === 'thought') {
                setMessages((prev) =>
                  prev.map((m) => (m.id === botMessageId ? { ...m, thought: data.step } : m))
                );
              } else if (eventType === 'chunk') {
                accumulatedContent += data.text || '';
                setMessages((prev) =>
                  prev.map((m) => (m.id === botMessageId ? { ...m, content: accumulatedContent } : m))
                );
              }
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMessageId
              ? {
                  ...m,
                  isStreaming: false,
                  suggestedActions: [
                    'Open AWS Free Tier Launchpad',
                    'Show CDK TypeScript blueprint',
                    'Audit cost traps',
                  ],
                }
              : m
          )
        );
      })
      .catch((err) => {
        console.error('Error starting mission chat:', err);
      });
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentPersona={currentPersona}
        onSelectPersona={handleSelectPersona}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'chat' && (
          <AgentChat
            messages={messages}
            setMessages={setMessages}
            currentPersona={currentPersona}
            onNavigateToAws={() => setActiveTab('aws')}
            soundEnabled={soundEnabled}
            customInstructions={customInstructions}
          />
        )}

        {activeTab === 'aws' && <AwsLaunchpad />}

        {activeTab === 'missions' && (
          <MissionTemplates
            onSelectPrompt={handleLaunchPromptFromMission}
            onNavigateToAws={() => setActiveTab('aws')}
          />
        )}

        {activeTab === 'docs' && <DocsView />}

        {activeTab === 'settings' && (
          <PreferencesModal
            currentPersona={currentPersona}
            onSelectPersona={handleSelectPersona}
            customInstructions={customInstructions}
            setCustomInstructions={handleUpdateCustomInstructions}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onResetDefaults={handleResetDefaults}
          />
        )}
      </main>

      {/* Quick Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onSelectPersona={handleSelectPersona}
        onClearChat={() => setMessages([])}
        onToggleSound={handleToggleSound}
      />
    </div>
  );
}
