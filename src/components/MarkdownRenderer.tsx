import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Parse markdown chunks into blocks
  const renderBlocks = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let currentCodeLines: string[] = [];
    let codeBlockCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block start/end
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim() || 'typescript';
          currentCodeLines = [];
        } else {
          inCodeBlock = false;
          const codeString = currentCodeLines.join('\n');
          const currentIndex = codeBlockCount++;
          elements.push(
            <div key={`code-${i}`} className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 shadow-sm">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800/80 text-[11px] text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{codeLanguage}</span>
                </div>
                <button
                  onClick={() => handleCopyCode(codeString, currentIndex)}
                  className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors"
                  title="Copy code to clipboard"
                >
                  {copiedCodeIndex === currentIndex ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 text-xs font-mono overflow-x-auto leading-relaxed text-slate-200">
                <code>{codeString}</code>
              </pre>
            </div>
          );
        }
        continue;
      }

      if (inCodeBlock) {
        currentCodeLines.push(line);
        continue;
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-sm font-bold text-slate-900 mt-4 mb-2 tracking-tight">
            {formatInline(line.slice(4))}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={i} className="text-xs font-bold text-slate-800 mt-3 mb-1 uppercase tracking-wider">
            {formatInline(line.slice(5))}
          </h4>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-base font-bold text-slate-950 mt-5 mb-2 pb-1 border-b border-slate-100 tracking-tight">
            {formatInline(line.slice(3))}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="text-lg font-extrabold text-slate-950 mt-5 mb-3 tracking-tight">
            {formatInline(line.slice(2))}
          </h1>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Unordered list item
        elements.push(
          <div key={i} className="flex items-start gap-2 my-1 text-xs text-slate-700 leading-relaxed pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
            <span className="flex-1">{formatInline(line.slice(2))}</span>
          </div>
        );
      } else if (/^\d+\.\s/.test(line)) {
        // Ordered list item
        const match = line.match(/^(\d+)\.\s(.*)$/);
        if (match) {
          elements.push(
            <div key={i} className="flex items-start gap-2 my-1.5 text-xs text-slate-700 leading-relaxed pl-1">
              <span className="font-semibold text-indigo-600 text-xs shrink-0 w-4">{match[1]}.</span>
              <span className="flex-1">{formatInline(match[2])}</span>
            </div>
          );
        }
      } else if (line.startsWith('> ')) {
        // Blockquote
        elements.push(
          <blockquote key={i} className="pl-3 py-1 my-2 border-l-2 border-indigo-400 text-xs italic text-slate-600 bg-indigo-50/30 rounded-r-lg">
            {formatInline(line.slice(2))}
          </blockquote>
        );
      } else if (line.trim() === '') {
        // Blank line spacer
        elements.push(<div key={i} className="h-2" />);
      } else {
        // Regular paragraph
        elements.push(
          <p key={i} className="text-xs text-slate-800 leading-relaxed my-1 font-normal">
            {formatInline(line)}
          </p>
        );
      }
    }

    return elements;
  };

  // Helper for inline markdown: bold, italics, inline code, links
  const formatInline = (text: string): React.ReactNode => {
    // Process inline code first `code`
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-[11px] border border-slate-200">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={idx} className="italic text-slate-700">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return <div className="space-y-0.5">{renderBlocks()}</div>;
};
