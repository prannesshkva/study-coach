import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2, Brain, Activity, Clock, ShieldCheck, UserCheck, Zap, ArrowRight, CornerDownLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TraceVisualizer from './TraceVisualizer';

const AGENT_BADGE_MAP = {
  'Cognitive Architect': { color: 'bg-[#221f2d] text-purple-200 border-[#3d3356]', borderAccent: 'border-l-purple-500', icon: '🧠', label: 'Cognitive Architect' },
  'Cognitive Architect & Mindset Coach': { color: 'bg-[#221f2d] text-purple-200 border-[#3d3356]', borderAccent: 'border-l-purple-500', icon: '🧠', label: 'Cognitive Architect' },
  'Focus Specialist': { color: 'bg-[#2d2417] text-amber-200 border-[#523d20]', borderAccent: 'border-l-amber-500', icon: '⚡', label: 'Focus Specialist' },
  'Focus Session Specialist': { color: 'bg-[#2d2417] text-amber-200 border-[#523d20]', borderAccent: 'border-l-amber-500', icon: '⚡', label: 'Focus Specialist' },
  'Neuro Rest Specialist': { color: 'bg-[#182a20] text-emerald-200 border-[#284c36]', borderAccent: 'border-l-emerald-500', icon: '🌿', label: 'Neuro Rest Specialist' },
  'Neuro-Rest & Fatigue Specialist': { color: 'bg-[#182a20] text-emerald-200 border-[#284c36]', borderAccent: 'border-l-emerald-500', icon: '🌿', label: 'Neuro Rest Specialist' },
  'Performance Analyst': { color: 'bg-[#182333] text-blue-200 border-[#253d5e]', borderAccent: 'border-l-blue-500', icon: '📊', label: 'Performance Analyst' },
  'Study Router Orchestrator': { color: 'bg-[#1e2028] text-zinc-200 border-[#2f3342]', borderAccent: 'border-l-zinc-400', icon: '🍅', label: 'Study Router' }
};

function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="prose prose-invert max-w-none text-xs sm:text-[13px] leading-relaxed text-[#ededef]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-[#2d2e38] bg-[#0c0d10] shadow-sm">
              <table className="w-full border-collapse text-left text-xs" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-[#181920] text-white font-bold border-b border-[#2d2e38]" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-3.5 py-2.5 text-white font-bold text-[11px] uppercase tracking-wider border-r border-[#262730] last:border-r-0" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3.5 py-2 border-b border-[#1f2028] text-zinc-200 text-xs border-r border-[#1a1b22] last:border-r-0" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-[#15161c] transition-colors even:bg-[#101115]" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-3 border-zinc-400 pl-3.5 my-2.5 text-zinc-300 italic bg-[#15161c] py-1.5 rounded-r-lg" {...props} />
          ),
          code: ({ node, inline, ...props }) => (
            inline ? (
              <code className="px-1.5 py-0.5 rounded bg-[#1c1d24] text-zinc-200 font-mono text-[11px] border border-[#2b2c36] font-semibold" {...props} />
            ) : (
              <pre className="p-3.5 my-2.5 rounded-xl bg-[#090a0d] border border-[#202128] text-zinc-200 font-mono text-xs overflow-x-auto">
                <code {...props} />
              </pre>
            )
          ),
          h1: ({ node, ...props }) => <h1 className="text-base font-bold text-white mt-3 mb-1 tracking-tight" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-sm font-bold text-white mt-3 mb-1 tracking-tight" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-xs font-bold text-zinc-300 mt-2.5 mb-1 uppercase tracking-wider" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 my-1.5 text-zinc-300" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1 my-1.5 text-zinc-300" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed text-[#ededef]" {...props} />,
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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
      className="bg-[#15161a] border border-[#24252c] rounded-2xl p-5 shadow-sm flex flex-col h-[680px] focus-ambient-glow"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#24252c] mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1f2028] border border-[#2d2e38] flex items-center justify-center text-zinc-300 shadow-sm">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2 tracking-tight">
              Psychological Study Coach
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#22242c] text-zinc-300 border border-[#2e303c]">
                5-Agent Swarm
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400 font-medium">
              Active Student: <span className="font-mono text-white font-semibold">{currentUserId}</span>
            </p>
          </div>
        </div>

        {onOpenProfile && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenProfile}
            className="px-2.5 py-1 bg-[#1a1b20] hover:bg-[#22242c] text-zinc-300 hover:text-white rounded-lg text-xs font-semibold border border-[#282932] flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
            Schedule Intake
          </motion.button>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const badge = AGENT_BADGE_MAP[msg.active_agent] || AGENT_BADGE_MAP['Study Router Orchestrator'];
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role !== 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-[#1a1b20] border border-[#282932] flex items-center justify-center text-zinc-300 shrink-0 mt-0.5 text-xs shadow-sm">
                    {badge?.icon || '🍅'}
                  </div>
                )}

                <div
                  className={`max-w-[92%] rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm transition-all ${
                    msg.role === 'user'
                      ? 'bg-[#22242d] border border-[#343644] text-white rounded-tr-none font-medium'
                      : `bg-[#0e0f12] border border-[#24252e] text-[#ededef] rounded-tl-none border-l-3 ${badge?.borderAccent || 'border-l-zinc-500'}`
                  }`}
                >
                  {msg.role !== 'user' && msg.active_agent && (
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#1c1d24]">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${badge.color}`}>
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>
                      {msg.psychological_framework && (
                        <span className="text-[10px] text-zinc-400 font-medium truncate">
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
                  <div className="w-7 h-7 rounded-lg bg-[#22242d] border border-[#343644] text-zinc-300 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2.5 justify-start"
          >
            <div className="w-7 h-7 rounded-lg bg-[#1a1b20] border border-[#282932] flex items-center justify-center text-zinc-400 shrink-0 shadow-sm">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-[#0e0f12] border border-[#24252e] rounded-xl rounded-tl-none p-3 text-xs text-zinc-300 flex items-center gap-2.5 shadow-sm">
              <div className="flex gap-1 items-center">
                <motion.span
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                  className="w-1.5 h-1.5 rounded-full bg-zinc-400"
                />
                <motion.span
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                  className="w-1.5 h-1.5 rounded-full bg-zinc-400"
                />
                <motion.span
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                  className="w-1.5 h-1.5 rounded-full bg-zinc-400"
                />
              </div>
              <span className="font-medium text-zinc-400">Orchestrating agent swarm & cognitive models...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="py-2.5 flex gap-1.5 overflow-x-auto no-scrollbar">
        {suggestionChips.map((chip, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleChipClick(chip)}
            className="px-2.5 py-1 bg-[#0e0f12] hover:bg-[#1a1b22] border border-[#24252e] hover:border-[#383a48] rounded-lg text-[11px] text-zinc-300 hover:text-white whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 font-medium shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-zinc-400" />
            {chip}
          </motion.button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="pt-2.5 border-t border-[#24252c] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message Coach (${currentUserId})... (e.g. plan 90m on Math or share routine)`}
          className="flex-1 px-3.5 py-2.5 bg-[#0e0f12] border border-[#24252c] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors shadow-inner"
          disabled={isLoading}
        />
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 bg-white hover:bg-zinc-100 disabled:opacity-40 text-zinc-950 rounded-xl font-bold flex items-center justify-center transition-colors shadow-md"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> : <Send className="w-4 h-4 text-zinc-950" />}
        </motion.button>
      </form>
    </motion.div>
  );
}
