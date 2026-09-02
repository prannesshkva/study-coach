import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Brain, Activity, Clock, ShieldCheck, UserCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TraceVisualizer from './TraceVisualizer';

const AGENT_BADGE_MAP = {
  'Cognitive Architect': { color: 'bg-purple-950/80 text-purple-300 border-purple-800/80', icon: '🧠', label: 'Cognitive Architect' },
  'Cognitive Architect & Mindset Coach': { color: 'bg-purple-950/80 text-purple-300 border-purple-800/80', icon: '🧠', label: 'Cognitive Architect' },
  'Focus Specialist': { color: 'bg-amber-950/80 text-amber-300 border-amber-800/80', icon: '⚡', label: 'Focus Specialist' },
  'Focus Session Specialist': { color: 'bg-amber-950/80 text-amber-300 border-amber-800/80', icon: '⚡', label: 'Focus Specialist' },
  'Neuro Rest Specialist': { color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80', icon: '🌿', label: 'Neuro Rest Specialist' },
  'Neuro-Rest & Fatigue Specialist': { color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80', icon: '🌿', label: 'Neuro Rest Specialist' },
  'Performance Analyst': { color: 'bg-blue-950/80 text-blue-300 border-blue-800/80', icon: '📊', label: 'Performance Analyst' },
  'Study Router Orchestrator': { color: 'bg-slate-800 text-slate-300 border-slate-700', icon: '🍅', label: 'Study Router' }
};

function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-slate-700/80 bg-[#090d14] shadow-sm">
              <table className="w-full border-collapse text-left text-xs" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-slate-800/90 text-slate-200 font-semibold border-b border-slate-700" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-3 py-2.5 text-slate-200 font-semibold text-[11px] uppercase tracking-wider" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3 py-2 border-b border-slate-800/80 text-slate-300 text-xs" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-slate-800/40 transition-colors even:bg-[#0d121c]" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-2 border-indigo-500 pl-3 my-2 text-slate-400 italic bg-indigo-950/20 py-1 rounded-r-lg" {...props} />
          ),
          code: ({ node, inline, ...props }) => (
            inline ? (
              <code className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[11px] border border-slate-700/50" {...props} />
            ) : (
              <pre className="p-3 my-2 rounded-xl bg-[#080b10] border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto">
                <code {...props} />
              </pre>
            )
          ),
          h1: ({ node, ...props }) => <h1 className="text-base font-bold text-white mt-3 mb-1" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-sm font-bold text-white mt-3 mb-1" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-xs font-bold text-indigo-300 mt-2.5 mb-1 uppercase tracking-wide" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 my-1.5 text-slate-300" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1 my-1.5 text-slate-300" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-300" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold text-white tracking-tight" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function AgentChat({ messages = [], onSendMessage, isLoading, currentUserId = 'prannesh', onOpenProfile }) {
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
    "🧠 Build psychological plan for Operating Systems (90m)",
    "⏰ My schedule: wake 7am, sleep 11pm, evening focus peak",
    "🌿 Evaluate fatigue: should I take a break or study?",
    "📊 Show my performance analytics matrix & streak",
    "🎯 Set daily focus goal to 180 minutes",
    "⚡ Start 25m focus on Distributed Systems"
  ];

  return (
    <div className="bg-[#111622]/90 border border-slate-800/90 rounded-2xl p-5 shadow-sm backdrop-blur-md flex flex-col h-[680px]">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-xs sm:text-sm text-slate-200 flex items-center gap-1.5">
              Psychological Study Coach
              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                Multi-Agent Swarm
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              Active User: <span className="font-mono text-indigo-300 font-semibold">{currentUserId}</span>
            </p>
          </div>
        </div>

        {onOpenProfile && (
          <button
            onClick={onOpenProfile}
            className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium border border-slate-700 flex items-center gap-1 transition-colors"
          >
            <UserCheck className="w-3 h-3 text-emerald-400" />
            Schedule Intake
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5">
        {messages.map((msg, index) => {
          const badge = AGENT_BADGE_MAP[msg.active_agent] || AGENT_BADGE_MAP['Study Router Orchestrator'];
          
          return (
            <div
              key={index}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role !== 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0 mt-0.5 shadow-sm text-xs">
                  {badge?.icon || '🍅'}
                </div>
              )}

              <div
                className={`max-w-[90%] rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tr-none'
                    : 'bg-[#0c1017] border border-slate-800/90 text-slate-300 rounded-tl-none'
                }`}
              >
                {msg.role !== 'user' && msg.active_agent && (
                  <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-800/70">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border flex items-center gap-1 ${badge.color}`}>
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>
                    {msg.psychological_framework && (
                      <span className="text-[10px] text-slate-400 truncate">
                        • {msg.psychological_framework}
                      </span>
                    )}
                  </div>
                )}

                <MarkdownRenderer content={msg.content} />

                {((msg.traces && msg.traces.length > 0) || (msg.handoffs && msg.handoffs.length > 0)) && (
                  <TraceVisualizer
                    traces={msg.traces || []}
                    handoffs={msg.handoffs || []}
                    activeAgent={msg.active_agent}
                    psychologicalFramework={msg.psychological_framework}
                  />
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400 shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-[#0c1017] border border-slate-800 rounded-xl rounded-tl-none p-3 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Orchestrating agent swarm & psychological models...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="py-2.5 flex gap-1.5 overflow-x-auto no-scrollbar">
        {suggestionChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleChipClick(chip)}
            className="px-2.5 py-1 bg-[#0c1017] hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            {chip}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="pt-2 border-t border-slate-800/70 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message Coach (${currentUserId})... (e.g. plan 90m on Math or tell your schedule)`}
          className="flex-1 px-3.5 py-2.5 bg-[#0c1017] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-medium flex items-center justify-center transition-all shadow-md shadow-indigo-600/20"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}

