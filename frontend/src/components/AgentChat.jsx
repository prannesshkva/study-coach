import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Brain, Activity, Clock, ShieldCheck, UserCheck, Zap, CornerDownLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TraceVisualizer from './TraceVisualizer';

const AGENT_BADGE_MAP = {
  'Cognitive Architect': { color: 'bg-purple-950/90 text-purple-300 border-purple-700/80 shadow-purple-900/30', borderAccent: 'border-l-purple-500', icon: '🧠', label: 'Cognitive Architect' },
  'Cognitive Architect & Mindset Coach': { color: 'bg-purple-950/90 text-purple-300 border-purple-700/80 shadow-purple-900/30', borderAccent: 'border-l-purple-500', icon: '🧠', label: 'Cognitive Architect' },
  'Focus Specialist': { color: 'bg-amber-950/90 text-amber-300 border-amber-700/80 shadow-amber-900/30', borderAccent: 'border-l-amber-500', icon: '⚡', label: 'Focus Specialist' },
  'Focus Session Specialist': { color: 'bg-amber-950/90 text-amber-300 border-amber-700/80 shadow-amber-900/30', borderAccent: 'border-l-amber-500', icon: '⚡', label: 'Focus Specialist' },
  'Neuro Rest Specialist': { color: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80 shadow-emerald-900/30', borderAccent: 'border-l-emerald-500', icon: '🌿', label: 'Neuro Rest Specialist' },
  'Neuro-Rest & Fatigue Specialist': { color: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80 shadow-emerald-900/30', borderAccent: 'border-l-emerald-500', icon: '🌿', label: 'Neuro Rest Specialist' },
  'Performance Analyst': { color: 'bg-blue-950/90 text-blue-300 border-blue-700/80 shadow-blue-900/30', borderAccent: 'border-l-blue-500', icon: '📊', label: 'Performance Analyst' },
  'Study Router Orchestrator': { color: 'bg-indigo-950/90 text-indigo-300 border-indigo-700/80 shadow-indigo-900/30', borderAccent: 'border-l-indigo-500', icon: '🍅', label: 'Study Router' }
};

function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3.5 rounded-2xl border border-slate-700/80 bg-slate-950/80 shadow-xl">
              <table className="w-full border-collapse text-left text-xs" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-100 font-bold border-b border-slate-700" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-3.5 py-3 text-slate-200 font-bold text-[11px] uppercase tracking-wider border-r border-slate-800 last:border-r-0" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3.5 py-2.5 border-b border-slate-800/80 text-slate-300 text-xs border-r border-slate-900 last:border-r-0" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-slate-800/50 transition-colors even:bg-slate-900/40" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-3 border-indigo-500 pl-3.5 my-2.5 text-slate-300 italic bg-indigo-950/30 py-1.5 rounded-r-xl" {...props} />
          ),
          code: ({ node, inline, ...props }) => (
            inline ? (
              <code className="px-1.5 py-0.5 rounded-md bg-slate-800/90 text-indigo-300 font-mono text-[11px] border border-slate-700/60 font-semibold" {...props} />
            ) : (
              <pre className="p-3.5 my-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto shadow-inner">
                <code {...props} />
              </pre>
            )
          ),
          h1: ({ node, ...props }) => <h1 className="text-base font-bold text-white mt-3.5 mb-1.5 tracking-tight" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-sm font-bold text-white mt-3 mb-1 tracking-tight" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-xs font-bold text-indigo-300 mt-3 mb-1 uppercase tracking-wider" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1.5 my-2 text-slate-300" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1.5 my-2 text-slate-300" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-200" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-white tracking-tight" {...props} />
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
    "⏰ My schedule: wake 7am, sleep 11pm, evening peak",
    "🌿 Evaluate fatigue: should I take a break or study?",
    "📊 Show my performance analytics matrix & streak",
    "🎯 Set daily focus goal to 180 minutes",
    "⚡ Start 25m focus on Distributed Systems"
  ];

  return (
    <div className="glass-card rounded-3xl p-6 shadow-2xl flex flex-col h-[700px] border border-slate-800/90 relative overflow-hidden">
      {/* Subtle Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base text-white flex items-center gap-2 tracking-tight">
              Psychological Study Coach
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                5-Agent Swarm
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
              Active Student: <span className="font-mono text-indigo-300 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{currentUserId}</span>
            </p>
          </div>
        </div>

        {onOpenProfile && (
          <button
            onClick={onOpenProfile}
            className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/80 flex items-center gap-1.5 transition-all shadow-sm hover:border-slate-600"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            Schedule Intake
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 z-10">
        {messages.map((msg, index) => {
          const badge = AGENT_BADGE_MAP[msg.active_agent] || AGENT_BADGE_MAP['Study Router Orchestrator'];
          
          return (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-200 shrink-0 mt-0.5 shadow-md text-sm">
                  {badge?.icon || '🍅'}
                </div>
              )}

              <div
                className={`max-w-[92%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-lg transition-all ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white rounded-tr-none shadow-indigo-600/20 font-medium'
                    : `bg-slate-950/80 border border-slate-800/90 text-slate-200 rounded-tl-none border-l-4 ${badge?.borderAccent || 'border-l-indigo-500'}`
                }`}
              >
                {msg.role !== 'user' && msg.active_agent && (
                  <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-800/80">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shadow-sm ${badge.color}`}>
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>
                    {msg.psychological_framework && (
                      <span className="text-[10px] text-slate-400 font-medium truncate">
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
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shrink-0 shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl rounded-tl-none p-4 text-xs text-slate-300 flex items-center gap-3 shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span className="font-medium">Orchestrating multi-agent psychological swarm...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="py-2.5 flex gap-1.5 overflow-x-auto no-scrollbar z-10">
        {suggestionChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleChipClick(chip)}
            className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 rounded-xl text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 shadow-sm font-medium hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            {chip}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="pt-3 border-t border-slate-800/80 flex gap-2 z-10">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message Coach (${currentUserId})... (e.g. plan 90m on Math or share routine)`}
          className="flex-1 px-4 py-3 bg-slate-950/90 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-40 text-white rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}

