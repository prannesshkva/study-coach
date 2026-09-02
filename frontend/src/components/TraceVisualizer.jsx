import React, { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle2, Wrench, ArrowRightLeft, Sparkles, UserCheck } from 'lucide-react';

export default function TraceVisualizer({ traces = [], handoffs = [], activeAgent, psychologicalFramework }) {
  const [isOpen, setIsOpen] = useState(true);

  const hasTraces = traces && traces.length > 0;
  const hasHandoffs = handoffs && handoffs.length > 0;

  if (!hasTraces && !hasHandoffs && !psychologicalFramework) return null;

  return (
    <div className="bg-[#0c1017]/95 border border-slate-800 rounded-xl p-3 my-2.5 shadow-inner">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-slate-300">
            Agent Swarm Orchestration Trace
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
            {traces.length} tool{traces.length !== 1 ? 's' : ''} • {handoffs.length} handoff{handoffs.length !== 1 ? 's' : ''}
          </span>
        </div>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-2.5">
          {/* Active Agent and Framework Tag */}
          {psychologicalFramework && (
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-[11px]">
              <span className="text-indigo-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <strong>Framework:</strong> {psychologicalFramework}
              </span>
              {activeAgent && (
                <span className="text-slate-300 font-medium">
                  {activeAgent}
                </span>
              )}
            </div>
          )}

          {/* Handoff Trace Visualization */}
          {hasHandoffs && (
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 flex items-center gap-1 px-1">
                <ArrowRightLeft className="w-3 h-3 text-cyan-400" /> Agent Swarm Handoffs
              </div>
              {handoffs.map((h, hIdx) => (
                <div
                  key={hIdx}
                  className="bg-[#111622] border border-cyan-900/40 rounded-lg p-2 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                      {h.from_agent}
                    </span>
                    <span className="text-cyan-400 text-xs">➔</span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-[10px] font-semibold">
                      {h.to_agent}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 italic">
                    {h.reason}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tool Execution Traces */}
          {hasTraces && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 flex items-center gap-1 px-1">
                <Wrench className="w-3 h-3 text-emerald-400" /> Function Tool Execution
              </div>
              {traces.map((trace, idx) => (
                <div
                  key={idx}
                  className="bg-[#111622] border border-slate-800/90 rounded-lg p-2.5 text-xs font-mono"
                >
                  <div className="flex items-center justify-between text-slate-300 mb-1.5 font-sans">
                    <div className="flex items-center gap-1.5 font-medium text-[11px]">
                      <span className="w-4 h-4 rounded bg-slate-800 text-slate-400 flex items-center justify-center text-[9px] font-mono">
                        {trace.step || idx + 1}
                      </span>
                      <span className="text-emerald-300 font-mono font-semibold flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-slate-500" />
                        {trace.tool_name}()
                      </span>
                      {trace.agent_name && (
                        <span className="px-1.5 py-0.2 text-[9.5px] rounded bg-slate-800 text-slate-400 font-sans">
                          via {trace.agent_name}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{trace.timestamp}</span>
                  </div>

                  {trace.arguments && Object.keys(trace.arguments).length > 0 && (
                    <div className="mb-1.5 text-[10.5px] text-slate-400 font-mono bg-[#0c1017] px-2 py-1 rounded border border-slate-800">
                      <span className="text-slate-400">args: </span>
                      <span className="text-slate-300">{JSON.stringify(trace.arguments)}</span>
                    </div>
                  )}

                  <div className="bg-[#0c1017] p-2 rounded border border-slate-800/80 overflow-x-auto text-[10.5px] text-emerald-400/90 font-mono max-h-44">
                    <div className="flex items-center gap-1 text-[9px] text-slate-400 mb-0.5 font-sans font-medium">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500/80" /> validated tool output:
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

