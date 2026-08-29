import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import TraceVisualizer from './TraceVisualizer';

function FormattedMessage({ content }) {
  if (!content) return null;

  const paragraphs = content.split('\n\n');

  return (
    <div className="space-y-2.5">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');
        return (
          <div key={pIdx} className="space-y-1.5">
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
                    <strong key={key++} className="font-bold text-white tracking-wide">
                      {match[2]}
                    </strong>
                  );
                } else if (match[3]) {
                  parts.push(
                    <code key={key++} className="px-1.5 py-0.5 rounded-md bg-slate-800 text-rose-300 font-mono text-xs">
                      {match[3]}
                    </code>
                  );
                }

                remaining = remaining.substring(matchIndex + match[0].length);
              }

              if (isBullet) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-rose-400 font-bold text-xs mt-0.5">•</span>
                    <span className="flex-1">{parts}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="leading-relaxed">
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
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col h-[650px]">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
              Study Coach
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Your Coach, for you
              </span>
            </h2>
            <p className="text-xs text-slate-400">Decides breaks & tracks focus time dynamically</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role !== 'user' && (
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-md ${
                msg.role === 'user'
                  ? 'bg-rose-600 text-white rounded-tr-none'
                  : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <FormattedMessage content={msg.content} />

              {msg.traces && msg.traces.length > 0 && (
                <TraceVisualizer traces={msg.traces} />
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-sm text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
              <span>Coach is planning actions & evaluating session data...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {suggestionChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleChipClick(chip)}
            className="px-3 py-1 bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 rounded-xl text-xs text-slate-300 hover:text-white whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
          >
            <Sparkles className="w-3 h-3 text-rose-400" />
            {chip}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="pt-2 border-t border-slate-800/80 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask coach to start session, log progress, or recommend break..."
          className="flex-1 px-4 py-3 bg-slate-950/90 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-5 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg shadow-rose-500/25"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}
