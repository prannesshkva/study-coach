import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import TraceVisualizer from './TraceVisualizer';

function FormattedMessage({ content }) {
  if (!content) return null;

  const paragraphs = content.split('\n\n');

  return (
    <div className="space-y-2">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('* ');
              const cleanLine = isBullet
                ? trimmed.replace(/^[•\-*]\s*/, '')
                : line;

              const parts = [];
              let remaining = cleanLine;
              let key = 0;

              const tokenRegex = /(\*\*([^*]+)\*\*|`([^`]+)`)/;
              while (remaining) {
                const match = remaining.match(tokenRegex);
                if (!match) {
                  parts.push(<span key={key++}>{remaining}</span>);
                  break;
                }

                const matchIndex = match.index;
                if (matchIndex > 0) {
                  parts.push(<span key={key++}>{remaining.substring(0, matchIndex)}</span>);
                }

                if (match[2]) {
                  parts.push(
                    <strong key={key++} className="font-semibold text-white tracking-wide">
                      {match[2]}
                    </strong>
                  );
                } else if (match[3]) {
                  parts.push(
                    <code key={key++} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                      {match[3]}
                    </code>
                  );
                }

                remaining = remaining.substring(matchIndex + match[0].length);
              }

              if (isBullet) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1.5 text-slate-300">
                    <span className="text-slate-500 font-bold text-xs mt-0.5">•</span>
                    <span className="flex-1 leading-relaxed">{parts}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="leading-relaxed text-slate-300">
                  {parts}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function AgentChat({ messages = [], onSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleChipClick = (chipText) => {
    if (isLoading) return;
    onSendMessage(chipText);
  };

  const suggestionChips = [
    "Log 25m studying Operating Systems (Focus: 5/5)",
    "What should I do next: take a break or study?",
    "Set my daily goal to 180 minutes",
    "Show my progress and streak summary"
  ];

  return (
    <div className="bg-[#111622]/90 border border-slate-800/90 rounded-2xl p-5 shadow-sm backdrop-blur-md flex flex-col h-[650px]">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-xs sm:text-sm text-slate-200 flex items-center gap-1.5">
              Study Coach
              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
                Your Coach, for you
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">Autonomous planning & rest evaluation</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role !== 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tr-none'
                  : 'bg-[#0c1017] border border-slate-800/90 text-slate-300 rounded-tl-none'
              }`}
            >
              <FormattedMessage content={msg.content} />

              {msg.traces && msg.traces.length > 0 && (
                <TraceVisualizer traces={msg.traces} />
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400 shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-[#0c1017] border border-slate-800 rounded-xl rounded-tl-none p-3 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
              <span>Analyzing session parameters...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="py-2.5 flex gap-1.5 overflow-x-auto no-scrollbar">
        {suggestionChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleChipClick(chip)}
            className="px-2.5 py-1 bg-[#0c1017] hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
          >
            <Sparkles className="w-3 h-3 text-slate-500" />
            {chip}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="pt-2 border-t border-slate-800/70 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message your coach..."
          className="flex-1 px-3.5 py-2 bg-[#0c1017] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-3.5 py-2 bg-slate-100 hover:bg-white disabled:opacity-40 text-slate-950 rounded-xl font-medium flex items-center justify-center transition-all"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
