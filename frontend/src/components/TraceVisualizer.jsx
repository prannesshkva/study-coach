import React, { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle2, Wrench, ArrowRightLeft, Sparkles, UserCheck, Terminal, Cpu } from 'lucide-react';

export default function TraceVisualizer({ traces = [], handoffs = [], activeAgent, psychologicalFramework }) {
  const [isOpen, setIsOpen] = useState(true);

  const hasTraces = traces && traces.length > 0;
  const hasHandoffs = handoffs && handoffs.length > 0;

  if (!hasTraces && !hasHandoffs && !psychologicalFramework) return null;

  return (
    <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-3.5 my-3 shadow-inner">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50"></span>
          <span className="font-bold text-slate-200 tracking-tight flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            Swarm Orchestration Trace
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-indigo-300 border border-slate-700/60 font-mono">
            {traces.length} tool{traces.length !== 1 ? 's' : ''} • {handoffs.length} handoff{handoffs.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-3.5 space-y-3 pt-2 border-t border-slate-800/80">
          {/* Active Agent and Framework Tag */}
          {psychologicalFramework && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-950/40 border border-indigo-800/50 text-[11px]">
              <span className="text-indigo-200 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <strong className="text-white">Active Paradigm:</strong> {psychologicalFramework}
              </span>
              {activeAgent && (
                <span className="text-slate-300 font-semibold px-2 py-0.5 rounded bg-indigo-900/60 text-[10px]">
                  {activeAgent}
                </span>
              )}
            </div>
          )}

          {/* Handoff Trace Visualization */}
          {hasHandoffs && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1 px-1">
                <ArrowRightLeft className="w-3 h-3 text-cyan-400" /> Swarm Dynamic Handoffs
              </div>
              {handoffs.map((h, hIdx) => (
                <div
                  key={hIdx}
                  className="bg-slate-900/90 border border-cyan-900/50 rounded-xl p-2.5 text-xs flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-950 text-slate-300 text-[10px] font-mono border border-slate-800">
                      {h.from_agent}
                    </span>
                    <span className="text-cyan-400 text-xs font-bold">➔</span>
                    <span className="px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-200 text-[10px] font-bold shadow-sm">
                      {h.to_agent}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 italic max-w-xs truncate">
                    {h.reason}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tool Execution Traces */}
          {hasTraces && (
            <div className="space-y-2.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1 px-1">
                <Terminal className="w-3 h-3 text-emerald-400" /> Function Tool Execution
              </div>
              {traces.map((trace, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 text-xs font-mono shadow-sm"
                >
                  <div className="flex items-center justify-between text-slate-300 mb-2 font-sans">
                    <div className="flex items-center gap-2 font-medium text-[11px]">
                      <span className="w-5 h-5 rounded-lg bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 flex items-center justify-center text-[10px] font-mono font-bold">
                        {trace.step || idx + 1}
                      </span>
                      <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-slate-400" />
                        {trace.tool_name}()
                      </span>
                      {trace.agent_name && (
                        <span className="px-2 py-0.5 text-[10px] rounded-md bg-slate-950 text-slate-400 font-sans border border-slate-800">
                          via {trace.agent_name}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{trace.timestamp}</span>
                  </div>

                  {trace.arguments && Object.keys(trace.arguments).length > 0 && (
                    <div className="mb-2 text-[10.5px] text-slate-400 font-mono bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-slate-500 font-semibold">parameters: </span>
                      <span className="text-indigo-300">{JSON.stringify(trace.arguments)}</span>
                    </div>
                  )}

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 overflow-x-auto text-[10.5px] text-emerald-400 font-mono max-h-48 shadow-inner">
                    <div className="flex items-center gap-1 text-[9px] text-slate-500 mb-1 font-sans font-semibold uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Result Payload:
                    </div>
                    <pre className="whitespace-pre-wrap break-words">
                      {typeof trace.output === 'object'
                        ? JSON.stringify(trace.output, null, 2)
                        : String(trace.output)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


