import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Square, 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Bookmark, 
  BookmarkCheck, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  Cloud,
  ArrowRight
} from 'lucide-react';
import { ChatMessage, PersonaConfig } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { sound } from '../utils/sound';

interface AgentChatProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  currentPersona: PersonaConfig;
  onNavigateToAws: () => void;
  soundEnabled: boolean;
  customInstructions: string;
}

export const AgentChat: React.FC<AgentChatProps> = ({
  messages,
  setMessages,
  currentPersona,
  onNavigateToAws,
  soundEnabled,
  customInstructions,
}) => {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll on new messages unless user has scrolled up
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSend = async (textToSend?: string) => {
    const promptText = (textToSend ?? input).trim();
    if (!promptText || isGenerating) return;

    if (soundEnabled) sound.playSend();

    const userMessageId = `msg-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: promptText,
      timestamp: Date.now(),
    };

    const botMessageId = `msg-${Date.now() + 1}`;
    const botMessage: ChatMessage = {
      id: botMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now() + 1,
      isStreaming: true,
      thought: 'Analyzing your query and verifying AWS Free Tier constraints...',
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput('');
    setIsGenerating(true);
    setExpandedThoughts((prev) => ({ ...prev, [botMessageId]: true }));

    // Prepare abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          persona: currentPersona.id,
          customInstructions,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let accumulatedThought = 'Formulating crisp response...';

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            const eventMatch = line.match(/^event:\s*(.+)$/m);
            const dataMatch = line.match(/^data:\s*(.+)$/m);

            const eventType = eventMatch ? eventMatch[1].trim() : 'chunk';
            let data: any = {};
            try {
              if (dataMatch) {
                data = JSON.parse(dataMatch[1].trim());
              }
            } catch {
              // Ignore non-json lines
            }

            if (eventType === 'thought') {
              accumulatedThought = data.step || accumulatedThought;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMessageId
                    ? { ...msg, thought: accumulatedThought }
                    : msg
                )
              );
            } else if (eventType === 'chunk') {
              accumulatedContent += data.text || '';
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMessageId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                )
              );
            } else if (eventType === 'error') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMessageId
                    ? {
                        ...msg,
                        isError: true,
                        errorMessage: data.message,
                        content:
                          accumulatedContent ||
                          'I encountered a hiccup connecting to the reasoning pipeline.',
                      }
                    : msg
                )
              );
            }
          }
        }
      }

      // Finish streaming
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === botMessageId) {
            // Generate contextual follow-up action suggestions
            const suggestedActions = generateSuggestedActions(accumulatedContent, promptText);
            return {
              ...msg,
              isStreaming: false,
              suggestedActions,
            };
          }
          return msg;
        })
      );

      if (soundEnabled) sound.playSuccess();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User aborted
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? { ...msg, isStreaming: false, content: msg.content + ' *(Generation paused)*' }
              : msg
          )
        );
      } else {
        // Error state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? {
                  ...msg,
                  isStreaming: false,
                  isError: true,
                  errorMessage: err.message || 'Network error occurred.',
                  content:
                    msg.content ||
                    'I ran into an issue connecting to the AI endpoint. No worries — Kite has preserved your prompt so you can retry with one click!',
                }
              : msg
          )
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSpeak = (text: string, id: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown before speaking
    const cleanText = text.replace(/[#*`_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleTogglePin = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m))
    );
  };

  const handleRetry = (msgIndex: number) => {
    // Find preceding user message
    for (let i = msgIndex; i >= 0; i--) {
      if (messages[i]?.role === 'user') {
        const text = messages[i].content;
        handleSend(text);
        break;
      }
    }
  };

  const generateSuggestedActions = (response: string, userPrompt: string): string[] => {
    const text = (response + userPrompt).toLowerCase();
    const actions: string[] = [];

    if (text.includes('aws') || text.includes('free tier') || text.includes('lambda')) {
      actions.push('Open AWS Free Tier Launchpad');
      actions.push('Show CDK TypeScript blueprint');
      actions.push('Check DynamoDB 25GB free tier limit');
    } else if (text.includes('code') || text.includes('function') || text.includes('api')) {
      actions.push('Add TypeScript interface & tests');
      actions.push('Review edge cases & error handling');
    } else {
      actions.push('Break this into 3 immediate action steps');
      actions.push('How can we deploy this to AWS Free Tier?');
    }

    return actions.slice(0, 3);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto px-3 sm:px-6 w-full">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {messages.length === 0 ? (
          /* First-Run Experience */
          <div className="py-6 sm:py-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Friendly Greeting Card */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm mb-4">
                <span className="text-3xl">{currentPersona.avatar}</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
                Meet {currentPersona.name}
              </h1>
              <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                {currentPersona.description}
              </p>
            </div>

            {/* First-Run Mission Starters */}
            <div className="space-y-2 mb-8">
              <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Instant Mission Starters</span>
                <span className="text-indigo-600 font-normal">Click to launch</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentPersona.sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="p-3.5 text-left rounded-xl bg-white hover:bg-indigo-50/50 border border-slate-200/90 hover:border-indigo-300 shadow-sm transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-slate-800 group-hover:text-indigo-900 leading-snug">
                        {q}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct AWS Free Tier Banner */}
            <div className="rounded-xl p-4 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 border border-emerald-200/80 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-950">
                    Deploy 100% Free on AWS Free Tier
                  </h3>
                  <p className="text-xs text-emerald-800">
                    1M Lambda requests/mo, 1TB CloudFront, 25GB DynamoDB with verified $0 cost.
                  </p>
                </div>
              </div>
              <button
                onClick={onNavigateToAws}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors shrink-0"
              >
                Open Launchpad
              </button>
            </div>
          </div>
        ) : (
          /* Live Message Stream */
          messages.map((msg, index) => (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Avatar for bot */}
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-100/80 border border-indigo-200/80 flex items-center justify-center text-sm shrink-0 mt-0.5">
                  {currentPersona.avatar}
                </div>
              )}

              {/* Message Bubble Content */}
              <div
                className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* User Message */}
                {msg.role === 'user' ? (
                  <div className="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-xs leading-relaxed shadow-sm">
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ) : (
                  /* Bot Message */
                  <div className="w-full bg-white border border-slate-200/90 rounded-2xl rounded-tl-sm p-4 shadow-sm text-slate-800">
                    {/* Collapsible Thought Header */}
                    {msg.thought && (
                      <div className="mb-3 border-b border-slate-100 pb-2">
                        <button
                          onClick={() =>
                            setExpandedThoughts((prev) => ({
                              ...prev,
                              [msg.id]: !prev[msg.id],
                            }))
                          }
                          className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          {expandedThoughts[msg.id] ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            {msg.isStreaming ? 'Thinking in progress...' : 'Thought process'}
                          </span>
                        </button>

                        {expandedThoughts[msg.id] && (
                          <div className="mt-1.5 text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded-lg border border-slate-200/60 animate-in fade-in duration-150">
                            {msg.thought}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Main Content */}
                    <MarkdownRenderer content={msg.content} />

                    {/* Streaming Cursor */}
                    {msg.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-indigo-600 ml-1 animate-pulse align-middle" />
                    )}

                    {/* Error Banner with Proactive Recovery */}
                    {msg.isError && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold">{msg.errorMessage || 'Response interrupted'}</p>
                            <p className="text-amber-800 mt-0.5">
                              Kite has kept your query intact. Click below to retry or switch to local analysis.
                            </p>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => handleRetry(index)}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-medium transition-colors"
                              >
                                Retry Now
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actionable Follow-up Chips */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && !msg.isStreaming && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                          <Lightbulb className="w-3 h-3 text-amber-500" />
                          Suggested:
                        </span>
                        {msg.suggestedActions.map((action, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => {
                              if (action.includes('Launchpad')) {
                                onNavigateToAws();
                              } else {
                                handleSend(action);
                              }
                            }}
                            className="text-[11px] font-medium text-slate-600 hover:text-indigo-700 bg-slate-50 hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-200 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Bottom message utilities */}
                    <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>·</span>
                        <span className="text-slate-500 font-medium">{currentPersona.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleSpeak(msg.content, msg.id)}
                          aria-label="Read response aloud"
                          className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Read aloud"
                        >
                          {speakingMessageId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCopyMessage(msg.content, msg.id)}
                          aria-label="Copy response text"
                          className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleTogglePin(msg.id)}
                          aria-label="Bookmark message"
                          className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Bookmark message"
                        >
                          {msg.pinned ? (
                            <BookmarkCheck className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar Area */}
      <div className="pb-4 pt-2">
        <div className="relative rounded-2xl bg-white border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 shadow-sm transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message ${currentPersona.name}... (Press Enter to send, Shift+Enter for newline)`}
            rows={1}
            disabled={isGenerating}
            className="w-full resize-none bg-transparent px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none max-h-44 leading-relaxed"
          />

          <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-slate-100 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline font-mono">↵ Send</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline font-mono">⇧↵ Newline</span>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-slate-500 hover:text-slate-800 transition-colors ml-1"
                >
                  Clear chat
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isGenerating ? (
                <button
                  onClick={handleStopGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium transition-colors"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    input.trim()
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 scale-100'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Send</span>
                  <Send className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
